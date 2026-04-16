// =====================================================
// Edge Function: wisecare-session (TITAN 3.2)
// Robusta, segura, resiliente e sincronizada
// =====================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─────────────────────────────────────
// CORS
// ─────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─────────────────────────────────────
// ENV
// ─────────────────────────────────────
const WISECARE_LOGIN = Deno.env.get('WISECARE_LOGIN') || '';
const WISECARE_PASSWORD = Deno.env.get('WISECARE_PASSWORD') || '';
const WISECARE_BASE_URL =
  Deno.env.get('WISECARE_BASE_URL') ||
  'https://session-manager.homolog.v4h.cloud/api/v1';
const WISECARE_DOMAIN =
  Deno.env.get('WISECARE_DOMAIN') || 'conf.homolog.v4h.cloud';
const WISECARE_ORG = Deno.env.get('WISECARE_ORG') || 'MedicannLab';

// ─────────────────────────────────────
// TOKEN CACHE
// ─────────────────────────────────────
let cachedBearerToken: string | null = null;
let tokenExpiresAt = 0;

// ─────────────────────────────────────
// AUTH
// ─────────────────────────────────────
async function getWisecareToken(): Promise<string | null> {
  if (cachedBearerToken && Date.now() < tokenExpiresAt) {
    return cachedBearerToken;
  }

  const baseHost = WISECARE_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const authUrl = `${baseHost}/api/auth/org/`;

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: WISECARE_LOGIN,
        password: WISECARE_PASSWORD,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      // Suporte a diferentes formatos de retorno da WiseCare
      const token = data.access?.token || data.token || data.access_token;

      if (token) {
        cachedBearerToken = token;
        const expiresMinutes = data.access?.expires || 55;
        tokenExpiresAt = Date.now() + (expiresMinutes - 5) * 60 * 1000;
        return token;
      }
    } else {
      console.error('[WiseCare Auth] Login failed via endpoint', await response.text());
    }
  } catch (err) {
    console.error('[WiseCare Auth Error]', err);
  }

  // Fallback Legado: Usar o próprio LOGIN como token (conforme protocolo original)
  console.warn('[WiseCare Auth] Using Login UUID as fallback token');
  cachedBearerToken = WISECARE_LOGIN;
  tokenExpiresAt = Date.now() + 5 * 60 * 1000;
  return WISECARE_LOGIN;
}

// ─────────────────────────────────────
// REQUEST
// ─────────────────────────────────────
async function wisecareRequest(
  method: string,
  endpoint: string,
  body?: Record<string, unknown>
): Promise<any> {
  const token = await getWisecareToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    let response = await fetch(`${WISECARE_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    // Fallback para Basic Auth (Crítico para resiliência WiseCare)
    if (response.status === 401) {
      console.log(`[WiseCare API] 401 on ${endpoint}, trying Basic Auth...`);
      const credentials = btoa(`${WISECARE_LOGIN}:${WISECARE_PASSWORD}`);
      response = await fetch(`${WISECARE_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`WiseCare ${response.status}: ${text}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

// ─────────────────────────────────────
// RESPONSE
// ─────────────────────────────────────
function jsonResponse(
  data: unknown,
  status: number,
  corsHeaders: Record<string, string>
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─────────────────────────────────────
// SERVER
// ─────────────────────────────────────
Deno.serve(async (req) => {
  // corsHeaders já definido globalmente

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Cliente com JWT do chamador: só autenticação (+ RPC SECURITY DEFINER)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnon, {
      global: {
        headers: { Authorization: req.headers.get('Authorization') || '' },
      },
    });

    // Persistência/leitura cruzada (caller ↔ callee): RLS de video_call_quality_logs
    // só permite ver a própria linha; sem service role o outro lado nunca acha a sessão.
    const supabaseDb =
      serviceKey.length > 0
        ? createClient(supabaseUrl, serviceKey)
        : supabaseAuth;

    if (!serviceKey.length) {
      console.warn(
        '[WiseCare] SUPABASE_SERVICE_ROLE_KEY ausente — get/create cross-user pode falhar por RLS'
      );
    }

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const { action, ...params } = await req.json();

    // ─────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────
    if (action === 'create') {
      if (!params.appointmentId) {
        return jsonResponse(
          { error: 'appointmentId is required for creation' },
          400,
          corsHeaders
        );
      }

      // [TITAN 3.3] Manter RPC de Sincronia (Segurança Invisível)
      // Ajustado para usar appointmentId como fonte da verdade
      const { data: guardRows, error: rpcError } = await supabaseAuth.rpc(
        'get_or_create_video_session',
        { p_appointment_id: params.appointmentId }
      );

      if (rpcError) {
        console.error('[WiseCare] RPC Sync Error (Proceeding anyway):', rpcError);
      }

      const sessionGuard = Array.isArray(guardRows) ? guardRows[0] : guardRows;

      // Se a sessão já existe na tabela de sincronia, retornar imediatamente
      if (sessionGuard && sessionGuard.is_new === false) {
        const { data: legacyLog } = await supabaseDb
          .from('video_call_quality_logs')
          .select('metadata, session_id')
          .eq('appointment_id', params.appointmentId)
          .maybeSingle();

        if (legacyLog) {
            return jsonResponse(
              {
                sessionId: legacyLog.session_id,
                roomId: legacyLog.session_id,
                joinUrl: legacyLog.metadata?.joinUrl || `https://${WISECARE_DOMAIN}/${legacyLog.session_id}`,
                source: 'legacy_sync'
              },
              200,
              corsHeaders
            );
        }
      }

      console.log('[WiseCare] Handshake Legado em execução...', { appointmentId: params.appointmentId });

      // 1. Criar Sala (Padrão Original)
      const room = await wisecareRequest('POST', '/rooms', {
        name: `medcannlab-${params.appointmentId}`,
        org: WISECARE_ORG,
        orgUnit: WISECARE_ORG,
      });

      const roomId = room?.id || room?.roomId || room?.room_id || room?.uuid || room?._id;
      if (!roomId) throw new Error(`WiseCare Room ID not found. Payload: ${JSON.stringify(room)}`);

      // 2. Criar Sessão (Padrão Original)
      const session = await wisecareRequest('POST', '/sessions', {
        roomId,
        org: WISECARE_ORG,
        orgUnit: WISECARE_ORG,
        enableRecording: params.enableRecording ?? false,
      });

      const sessionId = session?.id || session?.sessionId || session?.session_id || session?.uuid || session?._id;
      if (!sessionId) throw new Error(`WiseCare Session ID not found. Payload: ${JSON.stringify(session)}`);

      const joinUrl = session?.joinUrl || `https://${WISECARE_DOMAIN}/${sessionId}`;

      // 3. Persistência na Tabela Legada (video_call_quality_logs)
      const sessionData = {
        sessionId,
        roomId,
        joinUrl,
        source: 'restored_legacy'
      };

      const { error: insertErr } = await supabaseDb.from('video_call_quality_logs').insert({
        session_id: String(sessionId),
        user_id: user.id,
        provider: 'wisecare',
        room_id: String(roomId),
        appointment_id: params.appointmentId,
        status: 'created',
        metadata: {
          ...sessionData,
          wisecareSessionId: sessionId,
          wisecareRoomId: roomId,
          callType: params.callType || 'video',
          created_by: user.id,
        },
      });
      if (insertErr) {
        console.error('[WiseCare] insert video_call_quality_logs failed:', insertErr);
        throw new Error(`Persistência da sessão falhou: ${insertErr.message}`);
      }

      // [TITAN 3.4] SINCRONIA REALTIME (CRÍTICO PARA O CALLEE)
      if (params.appointmentId && params.appointmentId.startsWith('vcr_')) {
        console.log(
          '[WiseCare] Syncing metadata to video_call_requests for Realtime',
          params.appointmentId
        );
        const { error: metaErr } = await supabaseDb
          .from('video_call_requests')
          .update({
            metadata: {
              wisecareSession: sessionData,
              updated_at: new Date().toISOString(),
            },
          })
          .eq('request_id', params.appointmentId);
        if (metaErr) {
          console.error('[WiseCare] video_call_requests metadata update failed:', metaErr);
        }
      }

      return jsonResponse(sessionData, 200, corsHeaders);
    }

    // ─────────────────────────────────────
    // GET (Ação Nova Titan 3.3 para Sincronia de Callee)
    // ─────────────────────────────────────
    if (action === 'get') {
      if (!params.appointmentId) {
        return jsonResponse({ error: 'appointmentId required' }, 400, corsHeaders);
      }

      const { data, error } = await supabaseDb
        .from('video_call_quality_logs')
        .select('*')
        .eq('appointment_id', params.appointmentId)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (!data?.length) {
        return jsonResponse({ success: false, message: 'No session found' }, 200, corsHeaders);
      }

      const log = data[0];
      return jsonResponse(
        {
          success: true,
          sessionId: log.session_id,
          roomId: log.room_id || log.session_id,
          joinUrl: log.metadata?.joinUrl || `https://${WISECARE_DOMAIN}/${log.session_id}`,
          source: 'legacy_get'
        },
        200,
        corsHeaders
      );
    }

    // ─────────────────────────────────────
    // END
    // ─────────────────────────────────────
    if (action === 'end') {
      if (!params.sessionId) {
        return jsonResponse({ error: 'sessionId required' }, 400, corsHeaders);
      }

      console.log(`[WiseCare] Ending session ${params.sessionId}`);

      const { error: endDbErr } = await supabaseDb
        .from('video_call_quality_logs')
        .update({ status: 'ended' })
        .eq('session_id', String(params.sessionId));
      if (endDbErr) {
        console.error('[WiseCare] end: update video_call_quality_logs failed:', endDbErr);
      }

      await wisecareRequest('DELETE', `/sessions/${params.sessionId}`).catch(
        (err) => console.error(`[WiseCare] End failure (Proceeding): ${err.message}`)
      );

      return jsonResponse({ success: true }, 200, corsHeaders);
    }

    return jsonResponse(
      { error: `Unknown action: ${action}` },
      400,
      corsHeaders
    );
  } catch (err: any) {
    console.error('[ERROR RESTORATION]', err);
    return jsonResponse(
      { error: err.message || 'Internal error' },
      500,
      corsHeaders
    );
  }
});
