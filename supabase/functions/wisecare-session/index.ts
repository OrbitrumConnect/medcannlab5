// =====================================================
// Edge Function: wisecare-session
// Backend intermediário entre frontend e WiseCare API
// 
// SEGURANÇA: Credenciais NUNCA saem deste servidor.
// O frontend recebe apenas sessionId e joinUrl.
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS — restrito ao domínio da aplicação
const ALLOWED_ORIGINS = [
    'https://app.medcannlab.com',
    'https://medcannlab.com',
    'http://localhost:8080',   // Dev only
    'http://localhost:3000',   // Dev only
];

function getCorsHeaders(req: Request) {
    const origin = req.headers.get('Origin') || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
}

// Credenciais WiseCare (Supabase Secrets — NUNCA expostas ao frontend)
const WISECARE_LOGIN = Deno.env.get('WISECARE_LOGIN') || '';
const WISECARE_PASSWORD = Deno.env.get('WISECARE_PASSWORD') || '';
const WISECARE_BASE_URL = Deno.env.get('WISECARE_BASE_URL') || 'https://session-manager.homolog.v4h.cloud/api/v1';
const WISECARE_DOMAIN = Deno.env.get('WISECARE_DOMAIN') || 'conf.homolog.v4h.cloud';
const WISECARE_ORG = Deno.env.get('WISECARE_ORG') || 'MedicannLab';

// Cache do Bearer token (reutilizar enquanto a function estiver quente)
let cachedBearerToken: string | null = null;
let tokenExpiresAt = 0;

// Helper: obter Bearer token via login
async function getWisecareToken(): Promise<string> {
    // Se tem token em cache e não expirou, reutilizar
    if (cachedBearerToken && Date.now() < tokenExpiresAt) {
        return cachedBearerToken;
    }

    console.log(`[WiseCare Auth] Attempting login... (login: ${WISECARE_LOGIN ? WISECARE_LOGIN.substring(0, 8) + '...' : 'EMPTY!'})`);

    // Endpoint confirmado por Leonardo (co-CTO WiseCare):
    // POST https://session-manager.homolog.v4h.cloud/api/auth/org/
    // NOTA: auth usa /api/auth/org/ (sem /v1/), diferente da API que usa /api/v1/
    const baseHost = WISECARE_BASE_URL.replace(/\/api\/v1\/?$/, '');
    const authUrl = `${baseHost}/api/auth/org/`;

    console.log(`[WiseCare Auth] POST ${authUrl}`);

    try {
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: WISECARE_LOGIN,
                password: WISECARE_PASSWORD,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            // WiseCare retorna: { access: { token: "...", expires: 120 }, refresh: { ... } }
            const token = data.access?.token || data.token || data.access_token;
            if (token) {
                cachedBearerToken = token;
                const expiresMinutes = data.access?.expires || 55;
                tokenExpiresAt = Date.now() + (expiresMinutes - 5) * 60 * 1000;
                console.log(`[WiseCare Auth] ✅ Login OK, token obtained (expires in ${expiresMinutes}min)`);
                return token;
            }
            console.error(`[WiseCare Auth] ❌ 200 but no token in response:`, JSON.stringify(data).substring(0, 300));
        } else {
            const errText = await response.text();
            console.error(`[WiseCare Auth] ❌ ${response.status}: ${errText.substring(0, 300)}`);
        }
    } catch (err) {
        console.error(`[WiseCare Auth] ❌ Request failed:`, err instanceof Error ? err.message : err);
    }

    // Fallback: se login não funcionar, usar o próprio login UUID como Bearer token
    console.warn('[WiseCare Auth] Login failed, using login UUID as Bearer token (may not work)');
    cachedBearerToken = WISECARE_LOGIN;
    tokenExpiresAt = Date.now() + 5 * 60 * 1000; // Só 5 min para retry rápido
    return WISECARE_LOGIN;
}

// Helper: chamada à WiseCare API com timeout e auth automática
async function wisecareRequest(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
): Promise<Record<string, unknown>> {
    const token = await getWisecareToken();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        // Tentar com Bearer token
        let response = await fetch(`${WISECARE_BASE_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });

        // Se Bearer falhar com 401, tentar Basic Auth como fallback
        if (response.status === 401) {
            console.log(`[WiseCare API] Bearer token rejected for ${endpoint}, trying Basic Auth...`);
            const credentials = btoa(`${WISECARE_LOGIN}:${WISECARE_PASSWORD}`);
            response = await fetch(`${WISECARE_BASE_URL}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`,
                },
                body: body ? JSON.stringify(body) : undefined,
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[WiseCare API] ${method} ${endpoint} → ${response.status}: ${errorText}`);
            throw new Error(`WiseCare API error: ${response.status} - ${errorText}`);
        }

        return response.json();
    } finally {
        clearTimeout(timeout);
    }
}

// Helper: resposta JSON
function jsonResponse(data: unknown, status: number, corsHeaders: Record<string, string>) {
    return new Response(
        JSON.stringify(data),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Apenas POST aceito
    if (req.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
    }

    try {
        // ─── Autenticar usuário MedCannLab ───
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
        }

        const { action, ...params } = await req.json();

        switch (action) {
            // ─────────────────────────────────────
            // CREATE: Criar room + session (server-side)
            // Retorna apenas sessionId, roomId e joinUrl
            // Credenciais NUNCA saem daqui
            // ─────────────────────────────────────
            case 'create': {
                // Validação de input
                if (params.appointmentId && typeof params.appointmentId !== 'string') {
                    return jsonResponse({ error: 'Invalid appointmentId' }, 400, corsHeaders);
                }

                // 1. Criar room
                const room = await wisecareRequest('POST', '/rooms', {
                    name: `medcannlab-${params.appointmentId || Date.now()}`,
                    org: WISECARE_ORG,
                    orgUnit: WISECARE_ORG,
                });

                // Debug: log full response to identify correct field name
                console.log(`[WiseCare] Room response keys: ${JSON.stringify(Object.keys(room || {}))}`);
                console.log(`[WiseCare] Room response: ${JSON.stringify(room).substring(0, 500)}`);

                // WiseCare API pode retornar o ID em diferentes campos
                const roomId = room?.id || room?.roomId || room?.room_id || room?.uuid || room?._id;
                if (!roomId) {
                    throw new Error(`WiseCare returned room without id. Response: ${JSON.stringify(room).substring(0, 300)}`);
                }

                // 2. Criar session dentro da room
                const session = await wisecareRequest('POST', '/sessions', {
                    roomId: roomId,
                    enableRecording: params.enableRecording ?? false,
                });

                console.log(`[WiseCare] Session response keys: ${JSON.stringify(Object.keys(session || {}))}`);
                console.log(`[WiseCare] Session response: ${JSON.stringify(session).substring(0, 500)}`);

                const sessionId = session?.id || session?.sessionId || session?.session_id || session?.uuid || session?._id;
                if (!sessionId) {
                    throw new Error(`WiseCare returned session without id. Response: ${JSON.stringify(session).substring(0, 300)}`);
                }

                // 3. Construir joinUrl para iframe (sem credenciais)
                // O iframe apontará para o domínio WiseCare com o sessionId
                const joinUrl = `https://${WISECARE_DOMAIN}/${sessionId}`;

                // 4. Registrar no banco de dados MedCannLab
                await supabaseClient.from('video_call_quality_logs').insert({
                    session_id: String(sessionId),
                    provider: 'wisecare',
                    room_id: String(roomId),
                    appointment_id: params.appointmentId || null,
                    user_id: user.id,
                    status: 'created',
                    metadata: {
                        callType: params.callType || 'video',
                        wisecareSessionId: sessionId,
                        wisecareRoomId: roomId,
                    },
                });

                console.log(`[WiseCare] Session ${sessionId} (Room: ${roomId}) created for user ${user.id}`);

                // Retorna APENAS sessionId + joinUrl — ZERO credenciais
                return jsonResponse({
                    sessionId: sessionId,
                    roomId: roomId,
                    joinUrl,
                }, 200, corsHeaders);
            }

            // ─────────────────────────────────────
            // END: Encerrar sessão
            // ─────────────────────────────────────
            case 'end': {
                // Validação
                if (!params.sessionId) {
                    return jsonResponse({ error: 'sessionId is required' }, 400, corsHeaders);
                }

                // Atualizar log no banco
                await supabaseClient
                    .from('video_call_quality_logs')
                    .update({
                        status: 'ended',
                        ended_at: new Date().toISOString(),
                    })
                    .eq('session_id', String(params.sessionId));

                // Encerrar na WiseCare API
                try {
                    await wisecareRequest('DELETE', `/sessions/${params.sessionId}`);
                } catch (err) {
                    console.warn('[WiseCare] Session may already be ended:', err);
                }

                console.log(`[WiseCare] Session ${params.sessionId} ended by user ${user.id}`);
                return jsonResponse({ success: true }, 200, corsHeaders);
            }

            // ─────────────────────────────────────
            // GET-RECORDING: Buscar gravação
            // ─────────────────────────────────────
            case 'get-recording': {
                if (!params.sessionId) {
                    return jsonResponse({ error: 'sessionId is required' }, 400, corsHeaders);
                }

                try {
                    const recordings = await wisecareRequest(
                        'GET',
                        `/recordings?sessionId=${params.sessionId}`
                    );

                    return jsonResponse(recordings, 200, corsHeaders);
                } catch {
                    return jsonResponse({ error: 'No recordings found' }, 404, corsHeaders);
                }
            }

            default:
                return jsonResponse({ error: `Unknown action: ${action}` }, 400, corsHeaders);
        }

    } catch (err) {
        console.error('[WiseCare Edge Function] Error:', err);
        return jsonResponse(
            { error: err instanceof Error ? err.message : 'Internal error' },
            500,
            getCorsHeaders(req)
        );
    }
});
