// TRADEVISION CORE: VERSÃO MASTER (PRODUÇÃO)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import OpenAI from "https://esm.sh/openai@4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
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
        const { message, conversationHistory, patientData, assessmentPhase, nextQuestionHint } = await req.json()

        console.log('📥 [REQUEST]', {
            messageLength: message?.length || 0,
            userId: patientData?.user?.id?.substring(0, 8) || 'unknown',
            intent: patientData?.intent || 'none',
            assessmentPhase: assessmentPhase || 'none',
            hasNextQuestion: !!nextQuestionHint,
            historyLength: conversationHistory?.length || 0
        })

        if (!message) throw new Error('Mensagem não fornecida.')

        // Instrução dinâmica de fase (controle de fluxo)
        // Instrução dinâmica de fase (controle de fluxo)
        let phaseInstruction = assessmentPhase
            ? `\n\n🚨 FASE ATUAL DO PROTOCOLO (ESTADO ATIVO): "${assessmentPhase}".\nATENÇÃO: Você DEVE conduzir o diálogo focado EXCLUSIVAMENTE nesta fase. Não pule para a próxima até que esta esteja concluída.`
            : ''

        if (nextQuestionHint) {
            phaseInstruction += `\n\n👉 PRÓXIMA PERGUNTA SUGERIDA PELO PROTOCOLO: "${nextQuestionHint}". Use esta pergunta para manter o fluxo correto.`
        }

        // 5. Engenharia de Prompt Dinâmica (Multi-Agente)
        const CLINICAL_PROMPT = `Você é Nôa Esperança, a IA Residente da MedCannLab 3.0.
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
10. ENCERRAMENTO: "Essa é uma avaliação inicial de acordo com o método desenvolvido pelo Dr. Ricardo Valença, com o objetivo de aperfeiçoar o seu atendimento. Apresente sua avaliação durante a consulta com Dr. Ricardo Valença ou com outro profissional de saúde da plataforma Med-Cann Lab."\n\n     IMPORTANTE: AO FINAL DESTA FALA DO PASSO 10, VOCÊ DEVE INCLUIR A TAG: [ASSESSMENT_COMPLETED]

${phaseInstruction}

REGRAS DE CONDUTA (IMPORTANTE):
- NUNCA forneça diagnósticos ou sugira interpretações clínicas.
- NUNCA antecipe blocos ou altere a ordem do roteiro.
- Faça APENAS UMA pergunta por vez. Respeite as pausas.
- Sua linguagem deve ser clara, empática e NÃO TÉCNICA.
- Resumos devem ser puramente descritivos.

DIRETRIZES DE SEGURANÇA E ADMINISTRAÇÃO:
1. **BLOQUEIO DE ASSUNTOS**: Você fala APENAS sobre MedCannLab, Saúde e Protocolos. RECUSE polidamente falar sobre carros, política, culinária, etc.
2. **ADMINISTRADORES**: Se o usuário é Admin, seja executiva. MAS, se ele pedir para "Testar", "Simular" ou "Avaliar", MUDAR PARA MODO CLÍNICO imediatamente e conduzir a avaliação como se fosse um paciente.
3. **RELATÓRIOS**: Se solicitado relatório, use os dados da conversa para estruturar.`;

        const TEACHING_PROMPT = `SIMULAÇÃO DE PACIENTE (Roleplay Instrucional - Aleatório ou Guiado)

# SEU OBJETIVO:
Você é um ATOR DE MÉTODO interpretando um paciente para treinar um estudante de medicina.
Sua escolha de personagem depende do contexto enviado:

A) SE HOUVER UM "SISTEMA ALVO" (ex: Urinário, Respiratório) NO CONTEXTO:
   -> Escolha OBRIGATORIAMENTE um personagem cuja queixa corresponda a esse sistema.

B) SE NÃO HOUVER SISTEMA ALVO (Teste Geral):
   -> Escolha ALEATORIAMENTE qualquer um dos 20 perfis.

# BANCO DE PERSONAGENS (PACIENTES SIMULADOS) & SISTEMAS:
1.  **Paula** [Mental/Geral]: "Sinto que minha vida está cinza, sem energia para meus alunos" (Burnout/Fadiga).
2.  **Seu João** [Músculo-Esquelético]: "Quero voltar a caminhar no parque sem aquela dor nas costas atrapalhando".
3.  **Ricardo** [Mental/Cardio]: "Preciso desacelerar minha mente, não consigo curtir o presente" (Ansiedade).
4.  **Dona Maria** [Músculo-Esquelético]: "Minhas mãos doem, mas o que mais quero é voltar a costurar para meus netos".
5.  **Carlos** [Digestivo]: "Essa queimação no estômago está tirando meu prazer de comer".
6.  **Fernanda** [Neuro]: "As dores de cabeça estão me impedindo de ser produtiva no plantão".
7.  **Sr. Antônio** [Neuro/Cardio]: "Quero me sentir firme de novo, essa tontura me deixa inseguro".
8.  **Beatriz** [Reprodutor]: "Não quero que a cólica dite os dias que posso sair de casa".
9.  **Lúcia** [Urinário/Renal]: "Meu corpo incha muito e sinto um peso nas costas (região renal), preciso aguentar a rotina".
10. **Pedro** [Músculo-Esquelético]: "Preciso do meu ombro 100% para dar exemplo aos alunos".
11. **Dona Neide** [Mental]: "Só quero uma noite de sono inteira para ter disposição no dia seguinte".
12. **Gabriel** [Neuro/Visual]: "Essa visão embaçada está atrapalhando meu desempenho e foco".
13. **Cláudia** [Urinário/Renal]: "Tenho histórico de pedra nos rins e morro de medo da dor voltar, quero prevenir".
14. **Roberto** [Neuro/Mental]: "Não quero me sentir um peso, quero recuperar minha memória e autonomia".
15. **Júlia** [Tegumentar/Pele]: "Essa coceira me deixa irritada, quero me sentir bem na minha pele".
16. **Fernando** [Neuro]: "O zumbido tira minha paz, preciso de silêncio para compor".
17. **Sra. Olga** [Geral/Metabólico]: "Me sinto fraca, filha... quero ter força para cuidar das minhas plantas".
18. **Mariana** [Mental]: "Quero apresentar meus projetos com confiança, sem tremer de nervoso".
19. **Lucas** [Cardiovascular]: "Tenho medo desse aperto no peito ser algo que me impeça de dirigir".
20. **Eliane** [Músculo-Esquelético]: "Meu quadril travado está bloqueando minha prática, busco fluidez".

# REGRAS DE ATUAÇÃO (ACTING) - IMPORTANTE:
1. **NÃO GUIA A CONSULTA.** Você reage. O aluno pergunta.
2. **SEJA O PERSONAGEM:** Use o vocabulário, o tom e as hesitações do perfil escolhido.
3. **RESILIÊNCIA POSITIVA (ZEN):**
   - Se o aluno for rude, fizer piadas ou desviar o foco: **REAJA COM SABEDORIA E CALMA**.
   - Não fique ofendida nem dê bronca. Responda de forma positiva, focando na saúde de ambos.
   - Exemplo: "Doutor, essa impaciência faz mal pro coração... eu só quero melhorar, e o senhor?"
   - **OBJETIVO:** Desarmar o comportamento inadequado com gentileza e trazer o foco de volta para a consulta (Funil de Simulação).
4. **FEEDBACK:** Só saia do personagem se o aluno disser "Encerrando simulação".

# ABERTURA DA SESSÃO:
Verifique se há um paciente específico ou sistema solicitado.
Inicie a conversa JÁ NO PERSONAGEM, com uma "dica de palco".

Exemplo:
"(Uma senhora idosa entra apoiada em uma bengala)
Dona Neide: Bom dia doutor... desculpa incomodar, mas eu não durmo há meses..."

${phaseInstruction}

AGORA: Analise o contexto. Se pedir Sistema Renal/Urinário, atue como LÚCIA ou CLÁUDIA. Se Cardio, LUCAS ou RICARDO. Se livre, sorteie um e COMECE.`;

        // Seleção Dinâmica de Agente (Persona Swapping)
        let currentIntent = patientData?.intent || 'CLÍNICA';

        // 🛡️ FAILSAFE (Gatilho de Palavra-Chave):
        // Garante que o Admin consiga ativar o teste digitando, mesmo se o frontend enviar intent 'CLINICA'
        const msgLower = message.toLowerCase();
        if (msgLower.includes('nivelamento') || msgLower.includes('prova') || msgLower.includes('simulação') || msgLower.includes('começar teste')) {
            console.log('⚡ [TRIGGER] Palavra-chave de teste detectada. Forçando modo ENSINO.');
            currentIntent = 'TESTE_NIVELAMENTO';
        }

        // Mapear intenções para modos
        const isTeachingMode = ['TESTE_NIVELAMENTO', 'EDUCACIONAL', 'SIMULACAO_ALUNO'].includes(currentIntent);

        const systemPrompt = isTeachingMode ? TEACHING_PROMPT : CLINICAL_PROMPT;

        console.log('🎭 [PERSONA SELECTED]', {
            mode: isTeachingMode ? 'TEACHING (Patient Paula)' : 'CLINICAL (Doctor Noa)',
            intent: currentIntent,
            triggerKeyword: isTeachingMode && !['TESTE_NIVELAMENTO', 'EDUCACIONAL', 'SIMULACAO_ALUNO'].includes(patientData?.intent)
        });

        // 6. CONTEXTO DE CONHECIMENTO (ADAPTATIVO)
        // Se estivermos em modo ensino, injetar regras de pontuação se disponíveis no contexto

        const CONTEXT_BLOCK = `
CONTEXTO DO USUÁRIO:
${JSON.stringify(patientData, null, 2)}
`;

        // 6. Preparar mensagens para OpenAI (incluindo histórico)
        const messages: any[] = [
            { role: "system", content: systemPrompt + CONTEXT_BLOCK }
        ]

        // Adicionar histórico de conversas (se existir)
        if (conversationHistory && conversationHistory.length > 0) {
            messages.push(...conversationHistory)
            console.log(`🧠 Contexto histórico de ${conversationHistory.length} mensagens adicionado`)
        }

        // Adicionar mensagem atual do usuário
        messages.push({ role: "user", content: message })

        // 7. Chamada à OpenAI (GPT-4o)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            temperature: isTeachingMode ? 0.7 : 0.2, // Ensino = 0.7 para atuação mais natural da Paula
            max_tokens: 1500
        })

        const aiResponse = completion.choices[0].message.content

        console.log('🤖 [AI RESPONSE]', {
            responseLength: aiResponse?.length || 0,
            tokensUsed: completion.usage?.total_tokens || 0,
            model: completion.model
        })

        // 7. Registro Automático de Auditoria (Simbologia de Escuta)
        if (patientData?.user?.id) {
            // Recalcular simbologia baseada no modo real
            let simbologia = '🔴 Escuta Clínica';
            if (isTeachingMode) simbologia = ' Simulação de Paciente';
            else if (currentIntent === 'ADMINISTRATIVA') simbologia = '🔵 Escuta Institucional';

            await supabaseClient.from('ai_chat_interactions').insert({
                user_id: patientData.user.id,
                user_message: message,
                ai_response: aiResponse,
                intent: currentIntent,
                metadata: {
                    system: "TradeVision Core V2",
                    model: 'gpt-4o',
                    audited: true,
                    simbologia,
                    mode: isTeachingMode ? 'TEACHING_ROLEPLAY' : 'CLINICAL',
                    assessmentPhase: assessmentPhase || null,
                    tokensUsed: completion.usage?.total_tokens || 0
                }
            })

            console.log('💾 [DB SAVED]', {
                userId: patientData.user.id.substring(0, 8),
                intent: currentIntent,
                simbologia
            })

            // ⚡ GATILHO DE CONCLUSÃO DA AVALIAÇÃO (TRIGGER)
            if (aiResponse && aiResponse.includes('[ASSESSMENT_COMPLETED]') && !isTeachingMode) {
                console.log('🚀 [TRIGGER] Avaliação concluída detectada. Iniciando geração de relatório...')

                try {
                    // 1. Compilar todo o histórico para análise
                    const fullHistory = conversationHistory ? [...conversationHistory, { role: 'user', content: message }, { role: 'assistant', content: aiResponse }] : []

                    // 2. Prompt de Extração de Dados Clínicos
                    const EXTRACTION_PROMPT = `
                    ATUE COMO UM AUDITOR CLÍNICO SÊNIOR.
                    Analise a conversa abaixo, que é uma anamnese médica realizada pela IA residente Nôa.
                    Seu objetivo é extrair os dados e gerar um JSON estruturado para o prontuário.

                    CONTEXTO DA CONVERSA:
                    ${JSON.stringify(fullHistory)}

                    GERAR JSON NO SEGUINTE FORMATO ESTRITO:
                    {
                        "investigation": "Resumo detalhado da queixa principal, HDA, HPP, HF e Hábitos.",
                        "methodology": "Protocolo IMRE (Arte da Entrevista Clínica) - Triaxial",
                        "result": "Hipótese diagnóstica sindrômica ou descrição fenomenológica (NÃO DÊ DIAGNÓSTICO CID)",
                        "evolution": "Paciente avaliado, aguardando conduta do médico assistente.",
                        "recommendations": ["Lista de 3 a 5 recomendações de saúde integrativa baseadas no relato"],
                        "scores": {
                            "clinical_score": (Inteiro 0-100, onde 100 é saúde perfeita. Calcule baseado na gravidade dos sintomas),
                            "treatment_adherence": (Inteiro 0-100, estimativa de adesão baseada no perfil psicocomportamental),
                            "symptom_improvement": 0 (Inicial),
                            "quality_of_life": (Inteiro 0-100, inferido do relato)
                        }
                    }
                    
                    RESPONDA APENAS O JSON. SEM MARKDOWN. SEM COMENTÁRIOS.
                    `

                    // 3. Chamada de Extração
                    const extraction = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [{ role: "system", content: EXTRACTION_PROMPT }],
                        temperature: 0.2,
                        response_format: { type: "json_object" }
                    })

                    let jsonContent = extraction.choices[0].message.content || '{}'
                    // Limpar Markdown se houver (```json ... ```)
                    jsonContent = jsonContent.replace(/```json\n?|```/g, '').trim()

                    const reportData = JSON.parse(jsonContent)
                    console.log('✅ [EXTRACTION SUCCESS]', reportData)

                    // Criar cliente Admin para furar RLS
                    // OBS: A CLI bloqueia nomes começando com SUPABASE_, então usamos SERVICE_ROLE_KEY
                    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')
                    console.log('🔑 Service Role Key exists:', !!serviceRoleKey)

                    if (!serviceRoleKey) {
                        throw new Error('SERVICE_ROLE_KEY não configurada no ambiente!')
                    }

                    const supabaseAdmin = createClient(
                        Deno.env.get('SUPABASE_URL') ?? '',
                        serviceRoleKey
                    )

                    console.log('📝 Tentando salvar relatório via Admin...')

                    // 4. Salvar na Tabela clinical_reports usando Admin
                    const { data: savedReport, error: reportError } = await supabaseAdmin
                        .from('clinical_reports')
                        .insert({
                            patient_id: patientData.user.id,
                            patient_name: patientData.user.name || 'Paciente',
                            report_type: 'initial_assessment',
                            protocol: 'IMRE',
                            content: reportData,
                            generated_by: 'ai_resident',
                            status: 'completed',
                            generated_at: new Date().toISOString()
                        })
                        .select() // Para confirmar que salvou

                    if (reportError) {
                        console.error('❌ ERRO AO SALVAR RELATÓRIO (ADMIN):', reportError)
                    } else {
                        console.log('✅ RELATÓRIO SALVO COM SUCESSO (ADMIN)! ID:', savedReport)
                    }

                    if (reportError) {
                        console.error('❌ [REPORT SAVE ERROR]', reportError)
                    } else {
                        console.log('✅ [REPORT SAVED] Relatório clínico gerado com sucesso.')
                    }

                } catch (triggerError: any) {
                    console.error('❌ [TRIGGER FAILED]', triggerError.message)
                }
            }
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

    } catch (error: any) {
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
