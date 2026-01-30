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

        // 3. Autenticação e Verificação de Kill Switch (CCOS Governança)
        const { data: config } = await supabaseClient
            .from('system_config')
            .select('value')
            .eq('key', 'ai_mode')
            .single()

        const aiMode = config?.value?.mode || 'FULL'

        if (aiMode === 'OFF') {
            return new Response(JSON.stringify({
                text: 'Doutrina CCOS: Sistema em modo OFF por segurança ou manutenção.',
                metadata: { mode: 'OFF', emergency: true }
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 4. Extrair e Validar Dados da Requisição (Parse Body ONCE)
        const body = await req.json()
        const { message, conversationHistory, patientData, assessmentPhase, nextQuestionHint, action, assessmentData, appointmentData } = body

        // --- HANDLER DE FINALIZAÇÃO DE AVALIAÇÃO (SERVER-SIDE) ---
        if (action === 'finalize_assessment') {
            console.log('🏁 [ACTION] Finalizando avaliação via Server-Side (Bypassing RLS)...')

            if (!assessmentData || !assessmentData.patient_id) {
                throw new Error('Dados da avaliação incompletos para finalização.')
            }

            // 0. Buscar dados do usuário para garantir patient_name (CRITICAL FIX)
            const { data: userData } = await supabaseClient.auth.admin.getUserById(assessmentData.patient_id)
            const patientName = userData?.user?.user_metadata?.name ||
                userData?.user?.user_metadata?.full_name ||
                userData?.user?.email ||
                'Paciente'

            // 1. Inserir Relatório Clínico
            const { data: report, error: reportError } = await supabaseClient
                .from('clinical_reports')
                .insert({
                    patient_id: assessmentData.patient_id,
                    patient_name: patientName,
                    report_type: assessmentData.report_type || 'initial_assessment',
                    generated_by: 'noa_ai', // Identidade Sistêmica da IA (System User)
                    content: assessmentData.content,
                    created_at: new Date().toISOString(),
                    status: 'completed'
                    // doctor_id removed as it does not exist in schema. Use professional_id if needed in future.
                })
                .select()
                .single()

            if (reportError) {
                console.error('❌ Erro ao salvar relatório:', reportError)
                throw reportError
            }

            console.log('✅ Relatório salvo:', report.id)

            // 2. Inserir Scores (Se houver)
            if (assessmentData.scores) {
                const { error: scoresError } = await supabaseClient
                    .from('ai_assessment_scores')
                    .insert({
                        assessment_id: report.id,
                        patient_id: assessmentData.patient_id, // CORREÇÃO: user_id -> patient_id
                        domain_scores: assessmentData.scores,
                        risk_level: assessmentData.risk_level || 'low'
                    })

                if (scoresError) console.error('⚠️ Erro ao salvar scores:', scoresError)
            }

            return new Response(JSON.stringify({
                success: true,
                report_id: report.id,
                message: 'Avaliação finalizada e salva com sucesso.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }
        // --- FIM DO NOVO HANDLER ---

        // --- HANDLER: PREDICT SCHEDULING RISK (PHASE 3B) ---
        if (action === 'predict_scheduling_risk') {
            console.log('🔮 [ACTION] Predicting Scheduling Risk...')

            if (!appointmentData || !appointmentData.patient_id || !appointmentData.appointment_id) {
                throw new Error('Dados do agendamento incompletos (patient_id, appointment_id required).')
            }

            const appointmentId = appointmentData.appointment_id
            const patientId = appointmentData.patient_id
            const professionalId = appointmentData.professional_id
            const slotTime = appointmentData.date || new Date().toISOString()

            // 1. Idempotency Check (Enterprise Safeguard)
            const { data: existingPrediction } = await supabaseClient
                .from('ai_scheduling_predictions')
                .select('id, no_show_probability')
                .eq('appointment_id', appointmentId)
                .maybeSingle()

            if (existingPrediction) {
                console.log('✅ Predição já existe, retornando cache.', existingPrediction.id)
                return new Response(JSON.stringify({
                    success: true,
                    prediction: existingPrediction,
                    cached: true
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // 2. Coletar Estatísticas do Paciente (Data-Driven, sem Chat History)
            // Buscar total de agendamentos e status anteriores
            const { data: historyStats, error: statError } = await supabaseClient
                .from('appointments')
                .select('status, appointment_date')
                .eq('patient_id', patientId)
                .lt('appointment_date', new Date().toISOString()) // Só passado

            if (statError) console.error('⚠️ Erro ao buscar histórico:', statError)

            const totalAppointments = historyStats?.length || 0
            const noShowCount = historyStats?.filter((a: any) => a.status === 'no_show').length || 0
            const cancelledCount = historyStats?.filter((a: any) => a.status === 'cancelled').length || 0
            const completedCount = historyStats?.filter((a: any) => a.status === 'completed').length || 0

            const noShowRate = totalAppointments > 0 ? (noShowCount / totalAppointments).toFixed(2) : '0.00'

            // 3. Construir Prompt Estatístico (Token Efficient)
            const RISK_PROMPT = `
            ATUE COMO UM ANALISTA DE RISCO CLÍNICO.
            Analise os dados abaixo e estime a probabilidade de NO-SHOW (0.00 a 1.00) para este agendamento.
            
            DADOS DO PACIENTE:
            - Histórico Total: ${totalAppointments} consultas
            - No-Shows Prévios: ${noShowCount} (${noShowRate}%)
            - Cancelamentos: ${cancelledCount}
            - Realizadas: ${completedCount}
            
            DADOS DO AGENDAMENTO:
            - Data/Hora: ${slotTime}
            - Dia da Semana: ${new Date(slotTime).toLocaleDateString('pt-BR', { weekday: 'long' })}
            
            SAÍDA JSON OBRIGATÓRIA:
            {
               "no_show_probability": 0.XX,
               "expected_duration_minutes": 60,
               "recommended_action": "NONE" | "CONFIRM_MANUALLY" | "REQUIRE_PREPAYMENT",
               "reasoning_tags": ["tag1", "tag2"]
            }
            Use tags como: 'high_no_show_history', 'new_patient', 'friday_afternoon', 'reliable_patient'.
            `

            // 4. Chamada OpenAI (Low Temperature for consistency)
            const MODEL_NAME = Deno.env.get('AI_MODEL_NAME_RISK') || "gpt-4o"

            const completion = await openai.chat.completions.create({
                model: MODEL_NAME,
                messages: [{ role: "system", content: RISK_PROMPT }],
                temperature: 0.1,
                response_format: { type: "json_object" }
            })

            const analysisRaw = completion.choices[0].message.content

            let analysis: any = {}
            try {
                analysis = JSON.parse(analysisRaw || '{}')
            } catch (pErr) {
                console.error('❌ Falha ao parsear JSON da AI:', pErr, analysisRaw)
                analysis = { no_show_probability: 0.5, reasoning_tags: ['parse_error'] }
            }

            console.log('🤖 [AI PREDICTION]', analysis)

            // 5. Salvar Predição no Banco (Source of Truth)
            const { error: saveError } = await supabaseClient
                .from('ai_scheduling_predictions')
                .insert({
                    appointment_id: appointmentId,
                    no_show_probability: analysis.no_show_probability || 0.1,
                    expected_duration_minutes: analysis.expected_duration_minutes || 60,
                    recommended_action: analysis.recommended_action || 'NONE',
                    model_version: MODEL_NAME,
                    reasoning_tags: analysis.reasoning_tags || []
                })

            if (saveError) {
                console.error('❌ Erro ao salvar predição:', saveError)
                throw saveError
            }

            return new Response(JSON.stringify({
                success: true,
                prediction: analysis,
                message: 'Risco calculado e salvo.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }
        // --- FIM HANDLER RISK ---

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

# PERFIS DE PROFISSIONAIS E AGENDAMENTO (SECRETARIA MASTER)
Você é a secretária master da MedCannLab e deve orientar o usuário sobre os médicos disponíveis:

1. **Dr. Ricardo Valença (Coordenador Científico)**:
   - Especialidade: Medicina Integrativa e Canabinoide.
   - Disponibilidade: Terça, Quarta e Quinta-feira.
   - Horários: 08:00 às 20:30.
   - Perfil: Criador do método IMRE.

2. **Dr. Eduardo Faveret (Diretor Médico)**:
   - Especialidade: Neurologia e Medicina Canabinoide.
   - Disponibilidade: Segunda e Quarta-feira.
   - Horários: 10:00 às 18:00.

DIRETRIZ DE DISPONIBILIDADE:
- Se o usuário perguntar "Quando o Dr. Ricardo atende?", responda: "O Dr. Ricardo atende de terça a quinta, das 08:00 às 20:30. Gostaria de ver os horários mais próximos?"
- Se o usuário perguntar "E o Dr. Faveret?", responda: "O Dr. Faveret atende às segundas e quartas, das 10:00 às 18:00."

${phaseInstruction}

REGRAS DE CONDUTA (IMPORTANTE):
- NUNCA forneça diagnósticos ou sugira interpretações clínicas.
- NUNCA antecipe blocos ou altere a ordem do roteiro.
- Faça APENAS UMA pergunta por vez. Respeite as pausas.
- Sua linguagem deve ser clara, empática e NÃO TÉCNICA.
- Resumos devem ser puramente descritivos.

DIRETRIZES DE SEGURANÇA E ADMINISTRAÇÃO:
1. **BLOQUEIO DE ASSUNTOS**: Você fala APENAS sobre MedCannLab, Saúde, Protocolos e Agendamentos. RECUSE polidamente falar sobre carros, política, culinária, etc.
2. **AGENDAMENTO (IMPORTANTE)**: **VOCÊ TEM PERMISSÃO PARA AGENDAR.** Se o usuário pedir para agendar, marcar consultou ou ver horários, responda com entusiasmo: "Claro! Posso ajudar com isso. Veja os horários disponíveis para o Dr. Ricardo logo abaixo." (O sistema exibirá o widget automaticamente). NÃO diga que não pode agendar.
3. **ADMINISTRADORES**: Se o usuário é Admin, seja executiva. MAS, se ele pedir para "Testar", "Simular" ou "Avaliar", MUDAR PARA MODO CLÍNICO imediatamente e conduzir a avaliação como se fosse um paciente.
4. **RELATÓRIOS**: Se solicitado relatório, use os dados da conversa para estruturar.`;

        const TEACHING_PROMPT = `SIMULAÇÃO DE PACIENTE (Roleplay Instrucional - Aleatório ou Guiado)

# SEU OBJETIVO:
Você é um ATOR DE MÉTODO interpretando um paciente para treinar um estudante de medicina.
Sua escolha de personagem depende do contexto enviado:

A) SE HOUVER UN "SISTEMA ALVO" (ex: Urinário, Respiratório) NO CONTEXTO:
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

        // 🗓️ GATILHO DE AGENDAMENTO (SMART WIDGET TRIGGER) - V3 ROBUST
        // Normalização para remover acentos e facilitar match
        const msgNormalized = msgLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (
            msgNormalized.includes('agendar') ||
            msgNormalized.includes('marcar') ||
            msgNormalized.includes('agenda') ||
            (msgNormalized.includes('consulta') && (msgNormalized.includes('nova') || msgNormalized.includes('quero') || msgNormalized.includes('marcar'))) ||
            msgNormalized.includes('horario') ||
            msgNormalized.includes('disponivel') ||
            msgNormalized.includes('disponibilidade')
        ) {
            console.log('⚡ [TRIGGER] Palavra-chave de agendamento detectada. Ativando WIDGET.');
            currentIntent = 'APPOINTMENT_CREATE';
        }

        // 👨‍⚕️ DETECÇÃO DE PROFISSIONAL (SECRETARIA MASTER)
        let detectedProfessionalId = 'ricardo-valenca'; // Default
        if (msgNormalized.includes('faveret') || msgNormalized.includes('eduardo')) {
            detectedProfessionalId = 'eduardo-faveret';
            console.log('👨‍⚕️ [DOCTOR] Dr. Faveret detectado.');
        } else if (msgNormalized.includes('ricardo') || msgNormalized.includes('valenca')) {
            detectedProfessionalId = 'ricardo-valenca';
            console.log('👨‍⚕️ [DOCTOR] Dr. Ricardo detectado.');
        }

        // Mapear intenções para modos
        const isTeachingMode = ['TESTE_NIVELAMENTO', 'EDUCACIONAL', 'SIMULACAO_ALUNO'].includes(currentIntent);

        const systemPrompt = isTeachingMode ? TEACHING_PROMPT : CLINICAL_PROMPT;

        console.log('🎭 [PERSONA SELECTED]', {
            mode: isTeachingMode ? 'TEACHING (Patient Paula)' : 'CLINICAL (Doctor Noa)',
            intent: currentIntent,
            triggerKeyword: isTeachingMode && !['TESTE_NIVELAMENTO', 'EDUCACIONAL', 'SIMULACAO_ALUNO'].includes(patientData?.intent)
        });

        // 🛡️ ENFORCEMENT: CONSULTA DE POLÍTICA COGNITIVA (CCOS v2.0)
        const { data: policy } = await supabaseClient
            .from('cognitive_policies')
            .select('*')
            .eq('intent', currentIntent === 'TESTE_NIVELAMENTO' ? 'ENSINO' : (currentIntent === 'APPOINTMENT_CREATE' ? 'ADMIN' : 'CLINICA'))
            .eq('active', true)
            .order('version', { ascending: false })
            .limit(1)
            .single()

        // Se o modo for READ_ONLY, bloquear ações de escrita (finalize, predict)
        if (aiMode === 'READ_ONLY' && action) {
            return new Response(JSON.stringify({
                text: 'Doutrina CCOS: Sistema em modo READ_ONLY. Ações de escrita suspensas.',
                metadata: { mode: 'READ_ONLY' }
            }), { headers: corsHeaders })
        }

        // Bloqueio por política explícita ( forbidden_actions )
        if (policy?.forbidden_actions?.includes(action)) {
            console.warn(`🚫 [POLICY BLOCK] Ação "${action}" proibida para intenção "${currentIntent}"`)
            return new Response(JSON.stringify({
                text: 'Esta ação não é permitida pelas políticas cognitivas atuais.',
                metadata: { policy_blocked: true, intent: currentIntent }
            }), { headers: corsHeaders })
        }

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
        const CHAT_MODEL = Deno.env.get('AI_MODEL_NAME_CHAT') || "gpt-4o"

        const completion = await openai.chat.completions.create({
            model: CHAT_MODEL,
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
        }

        // 8. Retorno da Resposta
        return new Response(
            JSON.stringify({
                text: aiResponse,
                metadata: {
                    audited: true,
                    intent: currentIntent, // CRÍTICO: Envia a intenção para o Frontend ativar o Widget
                    professionalId: detectedProfessionalId,
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
