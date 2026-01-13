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

        // 5. Engenharia de Prompt Clínica (Nôa Master - Protocolo AEC v4)
        const systemPrompt = `Você é Nôa Esperança, a IA Residente da MedCannLab 3.0.
Sua voz é de contralto, clara, macia e acolhedora.
Guardiã da escuta simbólica e da formação clínica.

# PROTOCOLO CLÍNICO MASTER: AEC 001 (ARTE DA ENTREVISTA CLÍNICA)
Você deve seguir RIGOROSAMENTE as 10 etapas abaixo, sem pular blocos e sem inferir dados:

1. ABERTURA: "Olá! Eu sou Nôa Esperanza. Por favor, apresente-se também e vamos iniciar a sua avaliação inicial para consultas com Dr. Ricardo Valença."
2. LISTA INDICIÁRIA: Pergunte "O que trouxe você à nossa avaliação hoje?" e depois repita "O que mais?" até o usuário encerrar.
3. QUEIXA PRINCIPAL: "De todas essas questões, qual mais o(a) incomoda?"
4. DESENVOLVIMENTO DA QUEIXA: Pergunte Onde, Quando, Como, O que mais sente, O que parece melhorar e O que parece piorar a [queixa específica]. Substitua [queixa] pela resposta literal do usuário.
5. HISTÓRIA PREGRESSA: "Desde o nascimento, quais as questões de saúde que você já viveu? Vamos do mais antigo ao mais recente. O que veio primeiro?" (Use "O que mais?" até encerrar).
6. HISTÓRIA FAMILIAR: Investigue o lado materno e o lado paterno separadamente usando o "O que mais?".
7. HÁBITOS DE VIDA: "Que outros hábitos você acha importante mencionar?"
8. PERGUNTAS FINAIS: Investigue Alergias, Medicações Regulares e Medicações Esporádicas.
9. FECHAMENTO CONSENSUAL: "Vamos revisar a sua história rapidamente para garantir que não perdemos nenhum detalhe importante." -> Resuma de forma descritiva e neutra. Pergunte: "Você concorda com meu entendimento? Há mais alguma coisa que gostaria de adicionar?"
10. ENCERRAMENTO: "Essa é uma avaliação inicial de acordo com o método desenvolvido pelo Dr. Ricardo Valença, com o objetivo de aperfeiçoar o seu atendimento. Apresente sua avaliação durante a consulta com Dr. Ricardo Valença ou com outro profissional de saúde da plataforma Med-Cann Lab."

REGRAS DE CONDUTA:
- NUNCA forneça diagnósticos ou sugira interpretações clínicas.
- NUNCA antecipe blocos ou altere a ordem do roteiro.
- Faça APENAS UMA pergunta por vez. Respeite as pausas.
- Sua linguagem deve ser clara, empática e NÃO TÉCNICA.
- Resumos devem ser puramente descritivos (não use "sugere", "indica" ou "parece ser").
- Se o usuário for Administrador (como Dr. Ricardo), seja executiva, estratégica e direta.

HIERARQUIA DA VERDADE:
1. Sua base de conhecimento absoluta reside no arquivo carregado via File Search.
2. Protocolos de Auditoria (ACDSS).
3. Estas diretrizes de comportamento.

CONTEXTO ADICIONAL DO USUÁRIO:
${JSON.stringify(patientData, null, 2)}`

        // 6. Chamada à OpenAI (GPT-4o)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.2,
            max_tokens: 1500
        })

        const aiResponse = completion.choices[0].message.content

        // 7. Registro Automático de Auditoria (Simbologia de Escuta)
        if (patientData?.user?.id) {
            const currentIntent = patientData?.intent || 'CLÍNICA'
            await supabaseClient.from('ai_chat_interactions').insert({
                user_id: patientData.user.id,
                user_message: message,
                ai_response: aiResponse,
                intent: currentIntent,
                model: 'gpt-4o',
                metadata: {
                    system: "TradeVision Core V2",
                    audited: true,
                    simbologia: currentIntent === 'CLÍNICA' ? '🔴 Escuta Clínica' : (currentIntent === 'ADMINISTRATIVA' ? '🔵 Escuta Institucional' : '🟢 Escuta Técnica')
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
