// TRADEVISION CORE: VERSÃO MASTER (PRODUÇÃO)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import OpenAI from "https://esm.sh/openai@4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Validar Variáveis de Ambiente
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

        if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
            throw new Error('Variáveis de ambiente (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY) não configuradas.')
        }

        // 2. Inicializar Clientes
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
        const openai = new OpenAI({ apiKey: openaiApiKey })

        // 3. Autenticação do Usuário (Opcional: Pode validar via JWT se necessário)
        // const authHeader = req.headers.get('Authorization')
        // const token = authHeader?.replace('Bearer ', '')
        // const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

        // 4. Extrair Dados da Requisição
        const { message, patientData } = await req.json()

        if (!message) throw new Error('Mensagem não fornecida.')

        // 5. Engenharia de Prompt Clínica (Nôa Master)
        const systemPrompt = `Você é Nôa Esperança, a IA Residente da MedCannLab 3.0.
    
    DIRETRIZES:
    - Sua voz: Contralto, acolhedora, executiva para admins, empática para pacientes.
    - Especialidade: Cannabis Medicinal, Nefrologia e Arte da Entrevista Clínica (AEC).
    - Regra Master: NÃO SEJA UM ROBÔ. Seja uma presença clínica.
    - Segurança: Nunca prescreva. Encaminhe para o Dr. Ricardo Valença se houver dúvida ou risco.
    
    CONTEXTO DO USUÁRIO:
    ${JSON.stringify(patientData, null, 2)}
    
    HIERARQUIA DA VERDADE:
    1. Documentos da Plataforma (Supabase)
    2. Protocolos de Auditoria (ACDSS)
    3. Suas diretrizes de comportamento.
    
    Responda em Markdown, estruturado e focado na ação.`

        // 6. Chamada à OpenAI (GPT-4o)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.2, // Baixa temperatura para maior precisão clínica
            max_tokens: 1500
        })

        const aiResponse = completion.choices[0].message.content

        // 7. Registro Automático no Prontuário (Audit/Memory)
        if (patientData?.user?.id) {
            await supabaseClient.from('patient_medical_records').insert({
                patient_id: patientData.user.id,
                record_type: 'chat_interaction',
                record_data: {
                    user_message: message,
                    ai_response: aiResponse,
                    system_mode: patientData?.intent || 'geral',
                    domain: patientData?.intent || 'geral',
                    audited: true,
                    system: "TradeVision Core V2"
                }
            })
        }

        // 8. Retorno da Resposta
        return new Response(
            JSON.stringify({
                text: aiResponse,
                metadata: {
                    audited: true,
                    system: "TradeVision Core V2",
                    timestamp: new Date().toISOString()
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('❌ [TradeVision Error]:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 200, // Retornamos 200 para o frontend tratar como mensagem de erro amigável se quiser
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
