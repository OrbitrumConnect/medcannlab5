import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { decrypt, encrypt } from "../_shared/crypto.ts";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface JobPayload {
  appointment_id: string;
  action: "create_or_update" | "delete" | "patch";
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

serve(async () => {
  // CRON DE BUSCA DE JOBS
  // Pega apenas 10 por vez, que estejam no status Pending, e cujo next_run_at já tenha passado
  const { data: jobs, error: jobFetchError } = await supabase
    .from("integration_jobs")
    .select("*")
    .eq("type", "gcal_sync")
    .eq("status", "pending")
    .lte("next_run_at", new Date().toISOString())
    .limit(10);

  if (jobFetchError || !jobs || jobs.length === 0) {
    return new Response(JSON.stringify({ message: "Nenhum Job pendente." }), { status: 200 });
  }

  // Previne Concorrência (Race Condition Simples)
  const jobIds = jobs.map(j => j.id);
  await supabase.from("integration_jobs").update({ status: 'processing' }).in('id', jobIds);

  for (const job of jobs) {
    let successMessage = "";
    try {
      const payload = job.payload as JobPayload;
      // 1. Busca os dados do Agendamento (Usando a trava do nosso GIST)
      const { data: appointment, error: apptError } = await supabase
        .from("appointments")
        .select(`
          *,
          professional:users!appointments_professional_id_fkey(name, email),
          patient:users!appointments_patient_id_fkey(name, email)
        `)
        .eq("id", payload.appointment_id)
        .single();
      
      if (apptError) throw new Error("Agendamento não encontrado.");

      // 2. Busca a Chave Criptografada do Médico (Professional)
      const { data: integration, error: intError } = await supabase
        .from("professional_integrations")
        .select("*")
        .eq("professional_id", appointment.professional_id)
        .eq("provider", "google")
        .single();

      if (intError || !integration) {
        throw new Error("Médico não conectou sua Agenda do Google.");
      }

      // 3. RECUPERAÇÃO DAS CHAVES
      let accessToken = await decrypt(integration.access_token);
      let expiryTime = new Date(integration.expiry_date).getTime();

      // PROTEÇÃO DE EXPIRAÇÃO (5 Minutos de Margem de Manobra)
      if (expiryTime <= Date.now() + FIVE_MINUTES_MS) {
        const refreshToken = await decrypt(integration.refresh_token);
        
        const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token"
          }),
        });

        const refreshData = await refreshRes.json();
        if (refreshData.error) throw new Error(`Refresh Falhou: ${refreshData.error_description}`);

        accessToken = refreshData.access_token;
        const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
        const encAccess = await encrypt(accessToken);

        // Atualiza a Ficha de Oauth no Banco Injetando o Soro da Vida e Vida Longa ao Token
        await supabase.from("professional_integrations").update({
          access_token: encAccess,
          expiry_date: newExpiry
        }).eq("id", integration.id);
      }

      // 4. LÓGICA DE CALENDÁRIO (Action Dispatcher)
      // Usaremos o TimeZone UTC garantido
      const startTime = new Date(appointment.slot_start).toISOString();
      const endTime = new Date(appointment.slot_end).toISOString();

      if (payload.action === 'delete' && appointment.gcal_event_id) {
         // O paciente cancelou, devemos limpar da agenda do médico
         const delRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.gcal_event_id}`, {
           method: "DELETE",
           headers: { Authorization: `Bearer ${accessToken}` }
         });
         
         if (!delRes.ok && delRes.status !== 410) throw new Error("Falha ao Apagar Google Event.");
         successMessage = "Evento apagado com sucesso";
      } 
      else {
        // CREATE OR PATCH (Injeta a Bandeira conferenceDataVersion = 1)
        const isUpdate = !!appointment.gcal_event_id;
        const method = isUpdate ? "PATCH" : "POST";
        const url = isUpdate 
          ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.gcal_event_id}?conferenceDataVersion=1`
          : `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`;

        const requestBody = {
          summary: appointment.title || `Consulta: ${appointment.patient?.name || 'MedCannLab Patient'}`,
          description: appointment.notes || appointment.type,
          start: { dateTime: startTime },
          end: { dateTime: endTime },
          conferenceData: isUpdate ? undefined : {
            createRequest: { requestId: appointment.id } // Força criação do Meet (Indempotente pela ID da consulta)
          }
        };

        const eventRes = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        const eventData = await eventRes.json();
        if (eventData.error) throw new Error(`Google Cal API Error: ${JSON.stringify(eventData.error)}`);

        // GRAVA OS RESULTADOS DE VERDADE NO APPOINTMENT (Idempotência totalizada)
        await supabase.from("appointments").update({
          gcal_event_id: eventData.id,
          meeting_url: eventData.hangoutLink,
          gcal_last_sync_at: new Date().toISOString(),
          gcal_sync_status: 'synced'
        }).eq("id", appointment.id);
        
        successMessage = `Criado/Alterado: ${eventData.id} com link ${eventData.hangoutLink}`;
      }

      // CONSPIRAÇÃO ENCERRADA: Marca O Job como Resolvido
      await supabase.from("integration_jobs").update({ 
        status: "done",
        last_error: successMessage 
      }).eq("id", job.id);

    } catch (err: any) {
      console.error(`Job ID: ${job.id} Falhou:`, err.message);
      
      // REGRA DE BACKOFF
      const newRetries = (job.retries || 0) + 1;
      // Exponential backoff: 2 min, 4 min, 8 min, 16 min...
      const nextRunMs = Date.now() + (Math.pow(2, newRetries) * 60 * 1000);

      const isHardFail = newRetries >= 5; // Apos 5 tentativas mortais, desiste da ressurreição

      await supabase.from("integration_jobs").update({
        status: isHardFail ? "error" : "pending",
        retries: newRetries,
        last_error: err.message,
        next_run_at: new Date(nextRunMs).toISOString()
      }).eq("id", job.id);

      // Marca o appointment como problemático (Observabilidade)
      if (job.payload?.appointment_id && isHardFail) {
        await supabase.from("appointments").update({
          gcal_sync_status: 'failed'
        }).eq("id", job.payload.appointment_id);
      }
    }
  }

  return new Response(JSON.stringify({ message: `Processados ${jobs.length} jobs.` }), { status: 200, headers: { "Content-Type": "application/json" } });
});
