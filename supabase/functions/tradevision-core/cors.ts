// ============================================================================
// cors.ts — Headers CORS do tradevision-core.
// Extraído do index.ts no refator V1.9.419 (anti-bus-factor). Comportamento
// idêntico ao original — apenas relocado, sem mudança de lógica.
// ============================================================================

const corsHeaders = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function getCorsHeaders(origin: string | null) {
    const allowedOrigins = [
        'http://localhost:3000',
        'https://medcannlab.vercel.app',
        'https://www.medcannlab.com.br'
    ];

    // Dynamic Hardening: Permitir domínios oficiais ou subdomínios do lovable.app
    const isAllowed = origin && (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.lovable.app') ||
        origin.endsWith('.lovableproject.com')
    );

    if (isAllowed) {
        return { ...corsHeaders, 'Access-Control-Allow-Origin': origin };
    }

    // Fallback seguro (evita wildcard '*')
    return { ...corsHeaders, 'Access-Control-Allow-Origin': allowedOrigins[0] };
}
