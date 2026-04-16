import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders, encrypt } from "../_shared/crypto.ts";

// Configurações do Google Oauth e Banco
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// A URL ONDE O GOOGLE VAI DEVOLVER O CÓDIGO APÓS O LOGIN
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-auth`;

serve(async (req) => {
  // Tratamento de CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const professional_id = url.searchParams.get("state"); // Enviamos o ID do médico escondido no State

    // FLUXO 1: GERAR A URL PARA O MÉDICO CLICAR
    if (!code && req.method === "POST") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("Professional ID ausente");

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent("https://www.googleapis.com/auth/calendar.events")}&` +
        `access_type=offline&` +
        `prompt=consent&` + // FORÇA CONDUZIR O REFRESH_TOKEN
        `state=${user_id}`; // Carrega o ID no pescoço até voltar!

      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // FLUXO 2: O CALLBACK DO GOOGLE DEVOLVE O 'CODE'
    if (code && professional_id) {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
         throw new Error("Chaves do Google ausentes no servidor (Cloud Console).");
      }

      // Troca o Código Temporário pelas Chaves Definitivas (Acess e Refresh)
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code"
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        throw new Error(`Google Oauth Error: ${tokens.error_description || tokens.error}`);
      }

      // Criptografia Nível Banco 
      const encAccess = await encrypt(tokens.access_token);
      let encRefresh = "";
      if (tokens.refresh_token) {
        encRefresh = await encrypt(tokens.refresh_token);
      } else {
        // Fallback pesado de sistema falho: O Google só manda o refresh NA PRIMEIRA VEZ.
        // O prompt=consent força mas se falhar é critico.
        throw new Error("O Google não retornou Refresh Token. Verifique se a flag prompt=consent está ativa e remova a permissão antiga do app no seu painel Google Account.");
      }

      const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Grava no Banco com Permissão de Sistema (SuperUser)
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Limpamos antigas e inserimos a nova (Oauth seguro)
      await supabase.from("professional_integrations").delete().eq("professional_id", professional_id);
      
      const { error: dbError } = await supabase.from("professional_integrations").insert({
        professional_id: professional_id,
        provider: "google",
        access_token: encAccess,
        refresh_token: encRefresh,
        expiry_date: expiry
      });

      if (dbError) throw dbError;

      // REDIRECIONA O MÉDICO DE VOLTA PARA O PAINEL DE SUCESSO DELE NO FRONTEND
      // O App roda em que porta? Assumiremos a raiz ou uma Rota de Sucesso.
      const originUI = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:3000";
      // Redirecionamento limpo para o front
      return Response.redirect(`${originUI}/app/clinica/profissional/dashboard?gcal_connected=success`, 302);
    }

    throw new Error("Requisição mal-formada. Siga o fluxo OAuth padrão.");

  } catch (error: any) {
    console.error("GAuth Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
