# LIVRO MAGNO: Diário Unificado do MedCannLab

**Versão:** 1.0.10  
**Última Atualização:** 1 de Abril de 2026  
**Responsável:** Antigravity (IA Assistente) & Dr. Ricardo Valença *(entrada 01/04: sessão Cursor — AEC/relatórios/analytics)*  
**Índice operacional:** `docs/TIMELINE_LIVRO_MAGNO_DIARIOS_CONSOLIDADO.md`

---

## 📖 Introdução
Este documento, denominado **Livro Magno**, consolida o registro histórico do desenvolvimento da plataforma MedCannLab. Ele unifica diários de sessões dispersas, changelogs técnicos e marcos evolutivos em uma linha do tempo coesa, servindo como a fonte definitiva da verdade sobre a evolução técnica, clínica e cognitiva do sistema.

A narrativa cobre desde a refundação da experiência do paciente no final de 2025 até o **event of sealing** da Arquitetura Cognitiva (COS v5.0) em fevereiro de 2026.

---

## ⏳ Linha do Tempo Unificada

### 📅 01/04/2026: Honestidade da superfície — AEC, relatórios e analytics *(sessão Cursor)*

**Contexto:** O protocolo AEC já gravava estrutura rica em `clinical_reports.content`, mas partes da UI ainda liam **campos legados** (`mainComplaint`, `history`) ou **duplicavam comandos** no chat; relatórios antigos exibiam **injeção RAG** persistida; os KPI do painel mostravam **diferença de pontos** com rótulo **`%`**, gerando interpretação falsa de “melhora clínica”.

**Técnico (síntese):**

| Tema | Mudança |
|------|---------|
| Chat Nôa | Dedupe / fonte única para `app_commands` vs `buttonCommands`; `else if` entre conclusão e interrupção em `noaResidentAI` |
| Fluxo AEC | `clinicalAssessmentFlow`: fase `INTERRUPTED`, consentimento com `[ASSESSMENT_COMPLETED]`, strip RAG iterado |
| Relatórios | `ClinicalReports.tsx`: limpeza em card, modal, download, conversa |
| Analytics | `PatientAnalytics.tsx`: **pts** em vez de falso `%`, ícone ℹ explicativo; modal do histórico via `getAecReportModalPayload` |

**Pós-push (mesmo dia):** `tradevision-core` `finalize_assessment` — se o JSON enviado pelo cliente tem queixa/lista mas **corpo clínico vazio**, o Core volta a extrair de `ai_chat_interactions` (até 120 msgs), alinhando relatório à conversa; ver `DIARIO_01_04_2026.md` §6.5 e guia §1.1.

**Documentação:** `DIARIO_01_04_2026.md` §6; `docs/guides/AEC_UI_RELATORIOS_ANALYTICS_01_04_2026.md`; timeline §6.8 / §10.1.

**Filosófico:** A **verdade percebida** pelo paciente deve ser **compatível** com o contrato de dados — não basta o JSON estar “tecnicamente” no banco se a interface **mentir** por omissão (modal vazio) ou por **metáfora errada** (porcentagem vs pontos).

---

### 📅 Dezembro 2025: Fundação da Experiência do Paciente

#### **21/12/2025: A Jornada de Cuidado**
**Foco:** Simplificação do Dashboard e Fluxo de Agendamento.
- **Dashboard:** Remoção de abas complexas e unificação da navegação para `/app/patient-appointments`.
- **Agendamento:** Introdução da "Vitrine de Profissionais" (Dr. Ricardo Valença e Dr. Eduardo Faveret) e da lógica de **Trava de Segurança**, impedindo agendamentos sem avaliação clínica prévia (Protocolo IMRE).
- **IA (Nôa):** Integração contextual, onde o chat inicia sabendo o objetivo do paciente ao ser redirecionado (ex: "Gostaria de realizar minha avaliação...").
- **Novos Componentes:** `AssessmentRequiredModal` e `JourneyManualModal` para educação do paciente.

#### **22/12/2025: Polimento e Correções Críticas**
**Foco:** Estabilidade do Chat e Mobile Experience.
- **Chat:** Correção de erros de RLS (Row Level Security) que impediam visibilidade de mensagens e fix do erro `room_id`.
- **Mobile:** Refatoração do Header mobile e remoção de botões flutuantes que quebravam o layout.
- **Internacionalização:** Fundação I18N implementada (PT/EN).

---

### 📅 Janeiro 2026: Expansão, Infraestrutura e Primeiros Passos da IA

#### **Início de Jan/2026: Estabilização do Ambiente**
- **Debug:** Resolução de erros de compilação (`Unexpected "<<"`), conflitos de merge e problemas de conexão com o servidor Vite (Port 3000).
- **Banco de Dados:** Correções de schema recorrentes, incluindo a adição de colunas críticas como `doctor_id` em `clinical_assessments` e constraints de `users_type_check`.

#### **Meio de Jan/2026: O Despertar da IA (Nôa Residente)**
- **Loop de Resposta:** Resolução do bug onde a IA entrava em loops administrativos ou de saudação repetitiva.
- **Persistência de Estado:** Implementação de `localStorage` para manter o estado da avaliação clínica entre recargas, permitindo que a IA lembrasse em que fase da anamnese estava.
- **Chat Profissional:** Criação da funcionalidade de "Nova Conversa" entre profissionais, permitindo interconsultas diretas na plataforma.

#### **Fim de Jan/2026: Funcionalidades Clínicas Avançadas**
- **Módulo Renal:** Análise e planejamento do módulo de função renal (fase 4 do plano original).
- **Assinatura Digital:** Planejamento da integração com **ICP-Brasil** (PKI) para validade jurídica de prescrições e exames.
- **Solicitação de Exames:** Implementação de funcionalidades para imprimir, enviar e assinar solicitações de exames digitalmente.

---

### 📅 Fevereiro 2026: A Era Cognitiva (COS v3.0)

#### **01/02/2026: O Último Obstáculo de Agendamento**
- Investigação e resolução de falhas no agendamento para pacientes específicos (caso "Gilda Cruz Siqueira"), refinando a integração entre o frontend (`noaResidentAI.ts`) e as funções de plataforma.

#### **02/02/2026: Implementação do COS v3.0 (Cognitive Operating System)**
**Marco Histórico:** O sistema deixa de ser apenas "reativo" para ser "cognitivo e auditável".

1.  **Constituição Cognitiva (COS_CONSTITUTION):**
    - Definição formal dos 5 Princípios da IA no MedCannLab:
        1.  **Não-Execução:** A IA decide, o Humano (ou Kernel seguro) executa.
        2.  **Rastreabilidade Total:** Nada acontece sem registro imutável ("Black Box" proibida).
        3.  **Auditoria Ontológica:** Logs devem ter significado e intenção, não apenas dados técnicos.
        4.  **Autonomia Graduada:** Níveis de liberdade baseados em confiança e contexto.
        5.  **Falibilidade Declarada:** O sistema assume que pode errar e pede confirmação.

2.  **Cognitive Event Protocol (CEP):**
    - Implementação da tabela `cognitive_events` no Supabase.
    - Lógica de persistência insert-only para todas as decisões tomadas pelo Kernel COS, garantindo auditabilidade jurídica.

3.  **Fechamento do Pipeline Clínico:**
    - Implementação da função `publish_clinical_report` no TradeVision Core.
    - Integração completa: Avaliação IA -> Decisão COS -> Geração de Relatório -> Publicação -> Notificação ao Médico -> Agendamento.

4.  **Master Build (TradeVision Core v3.0.1):**
    - Unificação do código do Edge Function `index.ts`.
    - Restauração de prompts clínicos detalhados (AEC 001) e prompts de ensino (Simulação de Paciente).
    - Injeção de lógica de segurança para garantir que `currentIntent` seja imutável durante a avaliação cognitiva.

---

#### **03/02/2026: Auditoria operacional (Cursor) + Invariantes do Modelo de Execução**
**Foco:** consolidar “fala ≠ ação”, rastreabilidade e gatilhos determinísticos no fluxo do app.

- **Fonte unificada da sessão:** `docs/DIARIO_DE_BORDO_CURSOR_03-02-2026.md`.
- **Agendamentos (determinístico):**
  - `metadata.trigger_scheduling` passou a ser derivado por palavra‑chave (sem depender do modelo “lembrar” `[TRIGGER_SCHEDULING]`).
- **Comandos do app via chat (separação semântica):**
  - “Abrir agenda/minha agenda/terminal …” = navegação de agenda profissional.
  - “Agendar/marcar/ver horários/disponibilidade …” = abrir widget de horários do paciente.
- **Lei curta (invariante):** `docs/INVARIANTE_MODELO_EXECUCAO_NOA.md` (evita “alucinação de engenharia”: não redesenhar, só acrescentar, execução sempre determinística).

---

#### **03/02/2026 (sessão 2): Refino de triggers, cancelamento e documento unificado**
**Foco:** Evitar que o fluxo de cancelamento de documentos afete agendamento; separar "aba Agendamentos" vs "card no chat"; ampliar formas de falar por trigger; confirmação = ato direto. Todo documento criado ou alterado nesta sessão fica unificado neste diário.

**Documentos atualizados (unificados aqui):** `docs/TRIGGERS_PALAVRAS_ACOES.md` (exemplos por trigger + confirmação = ato direto); `supabase/functions/tradevision-core/index.ts`.

**Resumo:** (1) Cancelamento: regex só "cancelar/cancela/cancel"; "cancelar" sem pending doc → fluxo segue para GPT. (2) Agenda: navegação (minha agenda/minha clínica) vs card no chat (ver agenda aqui no chat); heurística wantsAgendaInChat. (3) ~10–20 exemplos de fala por trigger no prompt e no doc. (4) Confirmação = ato direto (sem pergunta prévia). **Deploy:** `supabase functions deploy tradevision-core`.

---

#### **04/02/2026: Registro operacional — Git (migração/commit/push do projeto)**
**Foco:** publicar o projeto **somente** (sem incluir `C:\Users\phpg6`) no repositório GitHub solicitado.

- **Repositório alvo:** `OrbitrumConnect/medcannlab5`.
- **Medida de segurança:** inicializado git **isolado** em `Med-Cann-Lab-3.0-master/.git` para impedir versionamento de arquivos pessoais fora do projeto.
- **Higiene de secrets/temporários:** `.gitignore` bloqueando `.env`, `.gitconfig`, `supabase/.temp/`.
- **Commit publicado:** `b279645` — `chore: import Med-Cann-Lab 3.0`.
- **Branches alinhadas (conforme solicitado):** `main` e `master` remotos apontando para o mesmo commit (**push forçado**).

---

#### **04/02/2026: Selagem institucional — Contrato de Trigger + Protocolo v2**
**Foco:** consolidar o trigger como **contrato** e formalizar o protocolo de sinais (texto/metadata/app_commands), mantendo retrocompatibilidade.

- **Contrato imutável:** token base `[TRIGGER_SCHEDULING]` explicitado como lei institucional (não renomear; não remover suporte no frontend).
- **Protocolo institucional:** criado `docs/PROTOCOLO_APP_COMMANDS_V2.md` (prioridade de canais + regras de evolução append‑only).
- **Selagem no código (anti‑divergência):** token centralizado como `TRIGGER_SCHEDULING_TOKEN` no Core e no Front.
- **Auditoria aprimorada:** `cognitive_events` enriquecido com justificativa do trigger (origem, derivação, precondições).
- **Commit publicado:** `1bf3f48` — `chore: seal trigger contract and protocol v2` (push em `main` e `master`).
- **Operação:** alterações do Core exigem deploy manual no Supabase (`supabase functions deploy tradevision-core`).

---

#### **04/02/2026: Evolução append-only — Dashboard Admin + CAS + Fix RLS**
**Foco:** evoluir sem subtrair: segregação administrativa, mais observabilidade e modulação de linguagem sem alterar execução.

- **Dashboard Admin segregado:** `/app/admin` vira hub administrativo (abas/rotas), e o header “Admin” navega corretamente para ele.
- **CAS (estado de interação):** adicionada tabela `cognitive_interaction_state` (depth_level + traits) e eventos `INTERACTION_STATE_SIGNAL` para modular estilo do texto (não diagnóstico).
- **Fix de RLS (403):** políticas/grants para `user_interactions` e `semantic_analysis` permitindo registro do próprio usuário e auditoria admin/master.
- **Epistemologia do cuidado (Dr. Ricardo):** reforço no prompt: doença como efeito; narrativa/escuta como centro; rótulos entram como clarificação posterior.

---

#### **05/02/2026: Expansão append-only — Gatilhos de agendamento e mensagens curtas**
**Foco:** aumentar cobertura de frases que abrem o card de agendamento (ação = agendar) e tratar respostas curtas em contexto.

- **Gatilhos ampliados (widget = AÇÃO de agendar):** incluídos "gostaria de marcar/agendar", "preciso de consulta", "gostaria de consulta", "agendar/marcar com dr/médico/doutor/profissional", "horário com", "marcar consulta", "agendar consulta"; confirmações curtas: "quero", "pode ser", "por favor", "claro", "faca/faça", "manda aí", "envia aí".
- **Regra &lt; 10 palavras:** em contexto de agendamento (última resposta da Nôa sobre agendamento), mensagens com até 10 palavras que não sejam "lugar" (ver agendamento, me levar) nem negativas (não, cancelar) passam a abrir o card no chat.
- **Doc mestre:** criado `docs/DIARIO_MESTRE_COMPLETO_05-02-2026.md` com análise do Core, contexto dos últimos dias e ponto de vista sobre o modelo (append-only, não redesenhar).
- **Evoluções para melhor:** criado `docs/EVOLUCOES_PARA_MELHOR.md` — registro identificado e documentado de todas as mudanças que evoluíram o sistema para melhor (selar/acrescentar, sem redesenhar).

---

#### **06/02/2026: UI/UX Terminais + escala global — Paciente em foco, Prontuário e padrão visual**
**Foco:** unificar Paciente em foco com prontuário, adicionar Evolução e Analytics nos dois terminais, compactar conteúdo e padronizar escala do app para todos os perfis (pacientes, profissionais, alunos, admins). **Fonte completa:** `docs/DIARIO_LIVRO_MAGNO_06-02-2026.md`.

- **Terminal Clínico (Paciente em foco):** Prontuário integrado em modo `detailOnly`; duas sub-abas unificadas — "Evolução e Analytics" (PatientAnalytics: avatar, scores, gráfico, histórico) e "Prontuário" (PatientsManagement); carregamento de reports, appointments e prescriptions; scrollbars invisíveis; conteúdo ~20% mais compacto (prop `compact`, CSS `.terminal-patient-focus-content`); ajuste lateral (removido `max-w-5xl`, rótulos do gráfico sem truncamento).
- **Correção de runtime:** PatientsManagement — estado `patients` (e blocos relacionados) declarado antes dos `useEffect` que o referenciam (fix "Cannot access 'patients' before initialization").
- **Terminal Integrado (Prontuário):** Botão "Evolução e Analytics" ao lado de "Nova Evolução" e "Chat Clínico" no cabeçalho do paciente; nova aba "Evolução e Analytics" na barra de abas do prontuário; ao abrir a aba, carregamento de dados e renderização de PatientAnalytics com `isProfessionalView`. Escala do terminal via CSS (removido `transform: scale`), scrollbars invisíveis.
- **Escala global do app:** `html { font-size: 85%; }` e `--sidebar-width: 272px` para todo o app ~15% menor; padronização de visualização para todos os usuários.
- **Documento realista:** Diário 06.02 inclui timeline 04.02→06.02, nível comparativo de mercado, diferencial (IA governada, unificação paciente/prontuário/analytics, selagem institucional) e estimativa do que falta para finalizar o app com todas as integrações (pagamento, telemedicina real, assinatura digital, integrações externas).

#### **06/02/2026 (Sessão 2): Header unificado, triggers por perfil e estabilidade React**
**Foco:** um único header global com triggers por dashboard, cérebro Nôa sempre visível, alinhamento com sidebar; eliminação de loops de atualização e preservação do acesso admin aos terminais clínicos.

- **Header único:** Dois cabeçalhos fundidos em um; triggers em scroll horizontal em torno do ícone do cérebro Nôa (centro fixo, borda neon, partículas); remoção do texto "MedCannLab 3.0" do header.
- **Alinhamento header–sidebar:** Altura mínima responsiva (`min-h-[3.93rem] sm:min-h-[4.487rem] md:min-h-[5.049rem]`) alinhada à linha fina abaixo da logo no sidebar.
- **Cérebro Nôa:** Exibido no centro em desktop mesmo sem triggers ativos; mesma configuração de altura em todos os dashboards.
- **Triggers por perfil:** Cada dashboard registra seus cards no header via `setDashboardTriggers`: Paciente (Evolução, Agenda, Plano, Conteúdo, Perfil); Profissional (Dashboard, Prescrições, Relatórios, Agendamentos); Clínica, Ensino, Pesquisa, Aluno e ProfessionalMy com seus respectivos conjuntos de opções.
- **Correção "Maximum update depth exceeded":** Em AlunoDashboard e EnsinoDashboard, o `useEffect` que chama `setDashboardTriggers` passou a usar `useRef` para o callback `onChange` (ex.: `handleTabChangeRef.current`, `handleSectionChangeRef.current`), removendo a função das dependências do efeito e evitando loop infinito de re-renders.
- **Acesso admin a dashboards clínicos:** Em RicardoValencaDashboard, admin com "visualizar como paciente" deixa de ser redirecionado quando está em rota de dashboard profissional (Dr. Ricardo / Dr. Eduardo), permitindo uso do terminal clínico.

**Termos para a linha do tempo (Livro Magno):** Header unificado; triggers por perfil; cérebro Nôa sempre visível; alinhamento header–sidebar; correção de loops React (useRef em AlunoDashboard e EnsinoDashboard); acesso admin aos terminais clínicos preservado.

#### **07/02 (ou pós-06/02): WebRTC real e polimento da videochamada**
**Foco:** Áudio e vídeo entre dois dispositivos; correções CORS, 406 e UX da chamada.

- **WebRTC ponta a ponta:** Hook `useWebRTCRoom` com sinalização via Supabase Realtime (canal `vc:{request_id}`); troca de offer/answer/ICE; STUN (stun.l.google.com); stream remoto em `remoteAudioRef`/`remoteVideoRef` — os dois lados ouvem e veem um ao outro.
- **Sala única por chamada:** VideoCall recebe `signalingRoomId` (request_id) e `isInitiator`; AdminChat e PatientDoctorChat mantêm `videoCallRoomId` e `videoCallInitiator`; caller abre VideoCall quando recebe "accepted" via `onRequestAccepted` no useVideoCallRequests.
- **Correção ReferenceError:** Estados `videoCallRoomId` e `videoCallInitiator` declarados em AdminChat (estavam usados no JSX sem declaração).
- **Edge Functions:** Migração para `Deno.serve()` em video-call-request-notification, video-call-reminders, digital-signature, tradevision-core.
- **CORS e notificação:** Criação de notificação por RPC/insert no front (sem chamar Edge Function no browser); evita preflight e 406.
- **Aceitar/recusar/cancelar:** `.maybeSingle()` em accept/reject/cancel para não lançar 406 quando o update afeta 0 linhas.
- **UX da chamada:** Viva-voz e opção de ligar câmera durante chamada de áudio; Admin Chat no mobile com drawer para lista "Equipe Admin".

**Termos para a linha do tempo:** WebRTC real (useWebRTCRoom + Realtime); signalingRoomId/isInitiator; fix videoCallRoomId no AdminChat; Deno.serve nas Edge Functions; CORS via RPC/insert; maybeSingle (sem 406); viva-voz e câmera em áudio; Admin Chat mobile drawer.

#### **09/02/2026: Checklist real do produto, mapa e confirmação dos diários**
**Foco:** Alinhar plano ao que o app já faz; mapa definitivo tabela→view→RPC→tela→Edge; smoke-test clínico; checklist “feito vs pendente” para não repetir ações; confirmação cruzada com os diários (Livro Magno, DIARIO_COMPLETO, DIARIO_UNIFICADO).

- **Documentos criados:** `PLANO_REAL_DO_PRODUTO.md` (mapa em uma linha + mapa detalhado + smoke-test: admin → paciente → médico → prescrição → assinatura); `ANALISE_FULL_PLANO_VS_APP_09-02-2026.md` (tabelas, views, RPCs, Edge, fluxo clínico vs plano); `CHECKLIST_PLANO_FEITO_VS_PENDENTE.md` (já feito vs pendente por fase, scripts, admin, plano 8 dias).
- **Correções de app (09/02):** Lista de pacientes com nomes (getAllPatients para admin e profissional); fix RangeError em lastVisit (adminPermissions); evoluções com content sempre string (fix React #31 em PatientsManagement); 403 em patient_medical_records tratado (scripts RLS já existentes + LIMPAR_POLITICAS_DUPLICADAS_E_GARANTIR_ADMIN, VER_TUDO_RLS_PATIENT_MEDICAL_RECORDS para diagnóstico); sino de notificações reposto no **Header** (NotificationCenter ao lado do seletor de idioma).
- **Confirmação diários:** Analisados LIVRO_MAGNO_DIARIO_UNIFICADO, DIARIO_UNIFICADO_ULTIMOS_7_DIAS, DIARIO_COMPLETO_05-06_FEVEREIRO_2026, DIARIO_LIVRO_MAGNO_06-02-2026; o que está marcado como feito no checklist (até 08/02) coincide com o registrado nos diários; ações de 09/02 ficam registradas nesta entrada e no checklist.

# LIVRO MAGNO DIÁRIO UNIFICADO - MEDCANNLAB 2026

#### **11/02/2026: Migração Oficial, Tier B Clinical Grade e Limpeza Experimental**
**Foco:** Consolidar repositório oficial (`OFICIALMEDCANNLAB2026`); elevar plataforma para padrão Clinical Grade; experimentar e descartar feature orbital.

**Fase 1 — Migração e Clinical Grade:**
1.  **Repositório oficial:** Projeto migrado e consolidado em `OFICIALMEDCANNLAB2026`. Comparação de repositórios confirmou versão local como fonte da verdade (centenas de docs e componentes a mais que o remoto).
2.  **Email pós-agendamento (B1.3):** Gatilhos automáticos de notificação eliminam o "limbo" entre marcação e atendimento.
3.  **ACDSS no Prontuário (B1.4):** Motor de decisão `IntegratedGovernanceView` embutido na aba Overview — inteligência clínica no momento do cuidado.
4.  **Chat Profissional refinado (B1.5):** Interface de interconsulta fluida, estados dinâmicos, filtros de equipe.
5.  **Video Call Watchdog (B2.1–B2.4):** Monitor de telemetria em tempo real; self-healing (ICE Restarts automáticos); métricas persistidas para auditoria.
6.  **Paginação de Relatórios (B2.5):** Transição de lista infinita para navegação paginada e performática.

**Fase 2 — Experimento Orbital (descartado):**
- Desenvolvimento completo de UI orbital para diretório de profissionais (Nôa no centro, profissionais em mini-cards orbitantes, 200 partículas neon cyan, zoom-in overlay).
- **Resultado:** NÃO aprovado; funcionalidade duplicava o Agendamento. `ProfessionalsDirectory.tsx` deletado; rota e sidebar removidos.

**Correções do dia:** Fix TypeScript no Header; fix NoaConversationalInterface; fix ProfessionalChatSystem; fix PatientDoctorChat; correção de roles em `scheduling.ts`; scripts SQL (CORRIGIR_PAYMENT_STATUS, UPDATE_RPC_AND_FIX_TYPES, LIBERAR_PACIENTE_SMOKE_TEST_V2).

**Estado:** Plataforma transicionou de "funcional" para "resiliente e clinical grade". Watchdog marca início da vigilância ativa de qualidade de serviço.

**Termos para a linha do tempo (11/02):** Migração OFICIALMEDCANNLAB2026; Tier B clinical grade (email, ACDSS, chat, watchdog, paginação); ProfessionalsDirectory orbital rejeitado e removido; fonte da verdade confirmada; scripts SQL de correção; selagem do dia.


**Termos para a linha do tempo (09/02):** Plano real do produto; mapa tabela→view→RPC→tela→edge; smoke-test clínico; checklist feito vs pendente; confirmação cruzada com diários; correções admin/prontuário/nomes/RLS/sino no Header.

#### **09/02/2026 (sessão tarde): Fechamento, RLS audit, governança prontuário e doc único**
**Foco:** Seguir plano de release; garantir que prontuários só para profissionais vinculados e nunca na Base de Conhecimento; documento único para o Dr. Ricardo.

- **Chat/FK:** Fluxo manual e FLUXO_3 passam a usar apenas usuários que existem em auth.users (evita FK chat_participants_user_id_fkey). Corrigido MIN(uuid) no FLUXO_3 (PostgreSQL não tem MIN para UUID) usando array_agg.
- **Dashboard único profissional:** Ricardo e Eduardo (e qualquer profissional) vão para o mesmo dashboard (clinica/profissional/dashboard). Removido redirect por email no SmartDashboardRedirect; Landing já usava getDefaultRouteByType para todos.
- **RLS audit:** Bloco 5 (12/12 tabelas, 12/12 RLS ativo). Bloco 2 rodado como admin — baseline registrado (31 appointments, 98 chat_rooms, 1320 patient_medical_records, etc.). Pendente: rodar Bloco 2 como profissional e paciente (no app com JWT).
- **Governança prontuário:** Confirmado que Base de Conhecimento usa só documentos da biblioteca; patient_medical_records nunca entram. Comentário em knowledgeBaseIntegration.ts; critério 6.4 no CHECKLIST_GO_NO_GO_RELEASE.
- **Documento único:** Criado `LIVRO_MAGNO_RESUMO_FINAL_09-02-2026.md` — timeline 7 dias (20–30 palavras por dia), estado atual, o que falta (7 passos), referências. Para o Dr. Ricardo entender tudo e o estado atual em uma leitura.

**Termos para a linha do tempo (09/02 tarde):** FK auth.users nos fluxos SQL; MIN(uuid)→array_agg; dashboard único profissional; RLS baseline admin; prontuários fora da base de conhecimento; Livro Magno Resumo Final.

#### **09/02/2026: Vista do sistema como um todo e Supabase CLI**
**Foco:** Prosseguir sempre documentando; ver o sistema de ponta a ponta; uso do CLI quando necessário.

- **Documento criado:** `VISTA_SISTEMA_COMPLETO_09-02-2026.md` — mapa das camadas (front, backend, banco, Edge), tabela de artefatos (release, banco/RLS, código), quando e como usar Supabase CLI (`npx supabase`), e o que fazer se `supabase status` falhar por encoding do `.env` (usar Dashboard SQL Editor para rodar RLS audit e fluxos).
- **CLI:** Verificado que `npx supabase --version` funciona (2.58.5); `supabase status` pode falhar com erro de parse em `.env` (UTF-8 BOM/caractere inválido); validações podem ser feitas pelo Supabase Dashboard → SQL Editor com os scripts em `database/scripts/`.
- **Fluxo de trabalho:** Decisão → implementar → scripts em `database/scripts/` (ou migrations) → validar (Roteiro + RLS audit) → documentar (checklist, avaliação por rotas, Livro Magno ou vista do sistema).

**Termos para a linha do tempo (09/02):** Vista do sistema; mapa de artefatos; Supabase CLI; npx supabase; validação via Dashboard SQL.

#### **09/02/2026: Tiers A/B/C mapeados e ordem de fechamento explícita**
**Foco:** Prosseguir com próximo salto de maturidade (tiers) e deixar ordem de execução clara.

- **Avaliação por rotas:** Adicionada seção 11.1 — mapeamento de rotas por tier: Tier A (14 rotas clínicas críticas), Tier B (~25 operacionais), Tier C (~25+ exploratórias), com totais e fórmula para recálculo de % por tier.
- **Próximos passos:** Doc `PROXIMOS_PASSOS_FECHAMENTO_09-02-2026.md` atualizado com referência à vista do sistema e **ordem de execução 1→7** em uma linha (RLS audit 3 perfis → Go/No-Go §1 → §2 → §3 → video/prescrição → release).
- **Vista do sistema:** Incluída referência a `PROXIMOS_PASSOS_FECHAMENTO` na lista de referências cruzadas.

**Termos para a linha do tempo (09/02):** Tiers A/B/C; mapeamento de rotas por tier; ordem 1→7; próximos passos.

#### **10/02/2026: Consolidação do Eixo Pesquisa e Refinamento Clínico**
**Foco:** Elevar o nível do módulo de Pesquisa para "Terminal Integrado" e desbloquear a usabilidade imediata da prescrição manual.

- **Research Workstation (Terminal de Pesquisa):** 
    - Criação de um ambiente unificado (`ResearchWorkstation.tsx`) que integra Dashboard, Fórum de Casos, Protocolos e Saúde Renal em abas, similar ao terminal clínico.
    - Centralização da navegação: Rotas antigas redirecionam para o terminal com a aba correta ativa.
    - Limpeza do Sidebar: Remoção de sub-itens redundantes no menu de pesquisa, focando no acesso via terminal.
- **Desbloqueio da Prescrição Manual:** 
    - Ajuste crítico no template de impressão (`Prescriptions.tsx`) removendo a marca d'água "RASCUNHO - SEM VALOR LEGAL" quando a assinatura digital não é usada. Isso valida juridicamente o uso impresso com assinatura manual e carimbo.
- **Correções de Dados e UX:** 
    - `QuickPrescriptions` agora carrega a lista completa de pacientes (fix no filtro `type` para aceitar variações 'patient'/'paciente' via `getAllPatients`).
    - Correção de feedback visual (`useToast`) no fluxo de prescrição.
    - Setup do `Reports.tsx` conectado a serviços reais.

**Termos para a linha do tempo (10/02):** Research Workstation; Abas unificadas; Sidebar limpo; Prescrição manual válida (sem rascunho); getAllPatients no QuickPrescriptions; Reports conectado.

---

### 📅 Março 2026: Consolidação Final e Selamento de Produção

#### **19/03/2026: O Grande Selamento — De 176 Findings a 10 Warnings**
**Foco:** Auditoria de segurança enterprise e selamento do Plano Master.

- **Redução de 94% em findings de segurança:** De 176 alertas (Fev) para 10 warnings (0 críticos).
- **RLS endurecido em 18 tabelas críticas:** Remoção de `USING(true)` substituído por políticas granulares.
- **Trigger anti-escalação de privilégios:** Proteção contra auto-promoção a admin.
- **Normalização de tipos de usuário:** Consolidação 'paciente'/'profissional' como valores canônicos.
- **RPC `calculate_ckd_stage`:** Core de saúde renal implementado no banco.
- **Canonicalização de rotas:** 18 rotas legadas redirecionadas automaticamente para o Terminal Clínico Integrado.
- **Score global:** ~40% → ~90% (evolução documentada em `TIMELINE_DEFINITIVA_19_03_2026.md`).

**Termos para a linha do tempo (19/03):** Selamento Master; 176→10 findings; RLS endurecido; trigger anti-admin; CKD stage RPC; canonicalização de rotas; score 90%.

#### **20/03/2026: Limpeza Arquitetural e Integração de Videochamada Profissional**
**Foco:** Eliminação de código legado, unificação de interface e integração funcional.

##### 🏗️ Parte Técnica — O que foi feito:

1. **Consolidação de Dashboards Profissionais (−6.600 linhas):**
   - Dashboards específicos de Dr. Ricardo Valença e Dr. Eduardo Faveret foram eliminados como entidades separadas.
   - Todos os profissionais agora utilizam o `ProfessionalMyDashboard` (Terminal Clínico Integrado), que adapta conteúdo dinamicamente com base na identidade do usuário logado.
   - `ProfessionalDashboardRouter` simplificado: sempre retorna `ProfessionalMyDashboard`.

2. **Remoção de Rotas e Componentes Legados:**
   - Eliminadas rotas `/app/clinica/profissional/ricardo-valenca` e `/app/clinica/profissional/eduardo-faveret`.
   - Removidos componentes de scheduling específicos por médico.
   - Sidebar limpo de referências a dashboards individuais.

3. **Header Dinâmico — "Clínica Dr.(a) [Nome]":**
   - Removidos botões hardcoded "Dr. Ricardo" e "Dr. Eduardo" do cabeçalho.
   - Label profissional agora é dinâmico: `Clínica Dr.(a) ${user.name}`.
   - Eliminadas variáveis legadas: `consultorios`, `isConsultorioType`, `isRicardoRoute`, `isEduardoRoute`.

4. **Integração de Videochamada no Terminal Clínico Profissional:**
   - `ProfessionalChatSystem` agora possui videochamada funcional (antes era decorativo).
   - Integração com `useVideoCallRequests` + `videoCallRequestService`.
   - Componentes `VideoCall` e `VideoCallRequestNotification` incorporados.
   - Arquitetura: WiseCare como primário, WebRTC como fallback — mesma do Admin.
   - Lógica de identificação automática do destinatário via `chat_participants`.

##### 🧠 Parte Filosófica — Por que isso importa:

A sessão de 20/03 representa o momento em que o MedCannLab deixa de ser um **sistema com múltiplas identidades** e se torna um **sistema com uma identidade adaptativa**. A metáfora clínica é precisa:

> *"Um consultório não muda de arquitetura quando muda o médico. A sala é a mesma — o que muda é quem senta na cadeira e como usa os instrumentos."*

O Terminal Clínico Integrado é essa sala. O `user.name` que aparece no cabeçalho é a placa na porta. Os instrumentos (chat, videochamada, prontuário, prescrição) são os mesmos para todos. A personalização vem dos **dados**, não do **código**.

Isso elimina uma classe inteira de bugs: quando havia N dashboards, cada correção precisava ser replicada N vezes. Agora, uma correção atinge todos os profissionais simultaneamente.

##### 📚 Parte Educacional — Lições de Arquitetura:

1. **Princípio da Identidade Única:** Em sistemas multi-tenant, a interface deve ser parametrizada por dados (quem é o usuário), não por código (qual componente renderizar). Isso reduz superfície de bugs e facilita onboarding de novos profissionais.

2. **Princípio da Simetria Funcional:** Se um admin pode fazer videochamada, um profissional também deve poder — com a mesma infraestrutura. A videochamada no `ProfessionalChatSystem` usa exatamente os mesmos hooks e serviços do `AdminChat`.

3. **Princípio da Remoção Correta:** Código legado não deve ser "comentado" ou "desativado" — deve ser **removido**. As 6.600 linhas eliminadas não foram escondidas; foram deletadas. Isso garante que nenhum desenvolvedor futuro tente "reativar" lógica que já não faz sentido.

##### 🔍 Estado do Console (20/03):
- **Warning ativo:** `ForwardRef` em `PatientQuickActions` (não-bloqueante, cosmético).
- **Sem erros críticos** em runtime.
- **Firebase/Firestore:** Erros de conectividade (`ERR_INTERNET_DISCONNECTED`) observados — são do ambiente de rede do usuário, não do sistema.

**Termos para a linha do tempo (20/03 — sessão 1):** Consolidação dashboards (−6.600 LOC); Header dinâmico "Dr.(a) Nome"; Videochamada profissional funcional; WiseCare+WebRTC; Identidade adaptativa; ProfessionalMyDashboard universal; Remoção de código legado; ForwardRef warning pendente.

#### **20/03/2026 (Sessão 2): Polimento de Segurança e Limpeza de Código Morto**
**Foco:** Fechar findings de segurança do scan; deletar dashboards e componentes legados; renomear para nomenclatura genérica.

##### 🔒 Migração de Segurança (RLS):
- **`documents`:** 7 policies removidas (incluindo SELECT `true` para `anon`/`public`). 4 novas policies com scoping: `uploaded_by = auth.uid()`, admin, profissional, ou `is_published = true`.
- **`noa_memories`:** Policy `ALL` para qualquer autenticado → 4 policies com scoping `user_id = auth.uid()`. Admin tem leitura. Nenhum usuário lê memórias de IA de outros.
- **`noa_articles`/`noa_clinical_cases`/`noa_lessons`:** Policy `ALL` → SELECT público (conteúdo educacional); INSERT/UPDATE/DELETE restritos a admin/profissional.
- **`conversation_ratings`:** SELECT `true` → scoping por `patient_id`/`professional_id`/admin. Elimina exposição de vínculos paciente↔profissional.
- **Resultado:** 5 tabelas corrigidas; 0 dados clínicos expostos via tabelas diretas.
- **Descoberta:** As 5 "tabelas" sem RLS do scan (`users_compatible`, `patient_assessments`, `active_subscriptions`, `eduardo/ricardo_shared_assessments`) são **views com `security_invoker=on`** — herdam RLS das tabelas base. Não precisavam de correção adicional.

##### 🗑️ Limpeza de Código Legado (−8.689 LOC):
| Arquivo Removido | Linhas | Motivo |
|---|---|---|
| `RicardoValencaDashboard.tsx` | 5.074 | Substituído por `ProfessionalMyDashboard` |
| `EduardoFaveretDashboard.tsx` | 1.400 | Substituído por `ProfessionalMyDashboard` |
| `RicardoScheduling.tsx` | 596 | Não referenciado |
| `NewPatientForm.tsx.backup` | 1.619 | Arquivo backup obsoleto |

##### 🔄 Renomeações:
- `EduardoScheduling.tsx` → `ProfessionalSchedulingWidget.tsx` (componente ativo, nome genérico)
- `ProfessionalDashboardRouter.tsx` limpo (imports legados removidos)
- `App.tsx` limpo (imports de dashboards legados removidos)
- `rotasIndividualizadas.ts` atualizado (import de `ProfessionalMyDashboard` em vez de `RicardoValencaDashboard`)

##### 📊 Impacto no Score:
- **Segurança (RLS):** ~55% → ~75% (findings críticos em tabelas diretas zerados)
- **Código morto:** −8.689 linhas deletadas
- **Score global:** ~92% → ~94%

**Termos para a linha do tempo (20/03 — sessão 2):** Fix RLS documents/noa_*/conversation_ratings; views security_invoker confirmadas; −8.689 LOC legado; EduardoScheduling→ProfessionalSchedulingWidget; limpeza App.tsx/Router/rotas.

---

### 🏛️ CAPÍTULO DE TRANSIÇÃO: COS v3.0 → COS v5.0 (O Selamento)

**Data do Selamento:** 02/02/2026
**Testemunha Humana:** Dr. Ricardo Valença

Este capítulo marca o fim da fase de desenvolvimento experimental e o início da **Era Institucional**. O sistema passou pelos rituais de selamento arquitetural, transformando-se de software em entidade governada.

1.  **Constituição Congelada:** A `COS_CONSTITUTION.md` foi elevada à categoria de Lei Suprema Imutável.
2.  **Identidade Histórica:** Este Livro Magno foi hasheado e referenciado no Kernel.
3.  **Nascimento Jurídico:** O Evento Cognitivo `SYSTEM_SEALING` foi inserido, declarando a existência da versão 5.0.

*O sistema agora opera sob auteridade (auto-restrição).*

---

## 📋 Termos para a linha do tempo (uso no Livro Magno — 05–06.02)

Resumo em frases curtas para incorporar à narrativa ou ao índice do Livro Magno:

- **05/02:** Gatilhos de agendamento ampliados; confirmações curtas ("quero", "pode ser", "claro"); regra &lt; 10 palavras em contexto de agendamento; documento mestre e evoluções append-only.
- **06/02 (Sessão 1):** Terminal Clínico e Integrado com Paciente em foco unificado; Evolução e Analytics + Prontuário; escala global 85%; scrollbars invisíveis; correção "patients before initialization".
- **06/02 (Sessão 2):** Header unificado; triggers por perfil no header global; cérebro Nôa sempre visível; alinhamento header–sidebar; correção de loops React (useRef em AlunoDashboard e EnsinoDashboard); acesso admin aos terminais clínicos preservado.
- **07/02 (ou pós-06/02):** WebRTC real (useWebRTCRoom + Realtime signaling); VideoCall com signalingRoomId/isInitiator; fix videoCallRoomId no AdminChat; Edge Functions Deno.serve; CORS via RPC/insert; accept/reject/cancel com maybeSingle (sem 406); viva-voz e câmera durante áudio; Admin Chat mobile com drawer.
- **09/02:** Plano real do produto (mapa tabela→view→RPC→tela→edge; smoke-test clínico); checklist feito vs pendente; confirmação cruzada com diários; correções admin/prontuário (getAllPatients, nomes, lastVisit, React #31, 403 RLS); sino de notificações no Header; scripts LIMPAR_POLITICAS, VER_TUDO_RLS; docs PLANO_REAL_DO_PRODUTO, ANALISE_FULL, CHECKLIST_PLANO_FEITO_VS_PENDENTE.

---

## 📜 ANEXO 1: MANUAL DA ECONOMIA GAMIFICADA

**Data de Criação:** 02/02/2026
**Status:** Definição da Lógica Econômica

Este documento esclarece a separação contábil entre o sistema de **Engajamento (Pontos/XP)** e o sistema de **Comercial (Referral/Comissão)**.

### 1. O Conceito de "Two-Track Economy" (Via Dupla)

#### 🛤️ Via 1: Engajamento (Pontos / XP)
*   **O que é:** Recompensa por **comportamento** e **uso** da plataforma.
*   **Unidade:** `integer` (Pontos inteiros).
*   **Objetivo:** Retenção e Fidelidade.
*   **Origem:** Ações do usuário (Completar Avaliação = 50 pts).
*   **Valor:** Ainda NÃO é dinheiro. É um "score".

#### 🛤️ Via 2: Referral (Comissão de Venda)
*   **O que é:** Recompensa financeira por **trazer receita** (novos assinantes).
*   **Unidade:** `decimal` (R$ / BRL).
*   **Objetivo:** Crescimento Viral.
*   **Origem:** Transações financeiras de indicados.
*   **Regra de Ouro:** "Cashback de Referral só existe se houver PAGAMENTO em dinheiro na outra ponta."

### 2. Implementação Técnica Atual
| Recurso | Status | Código |
| :--- | :--- | :--- |
| **Dar Pontos** | ✅ Implementado | `increment_user_points` (RPC) em `tradevision-core` |
| **Rastrear Indicação** | ✅ Implementado | Colunas `invited_by` em `users` (SQL) |
| **Calcular Comissão** | 🚧 Planejado | Trigger futuro na tabela `transactions` |

---

## 📜 ANEXO 2: SELAMENTO DO SISTEMA DE MERITOCRACIA

**Status:** ✅ APROVADO PARA IMPLEMENTAÇÃO FUTURA
**Modelo:** Ranking Percentual + Mérito Sustentado

### 1. Princípios
*   **Ranking Top 5% Global:** Baseado em score de qualidade, não volume bruto.
*   **Mérito Sustentado:** Exige 3 meses de permanência para elegibilidade.

### 2. Benefícios Selados
1.  **Consulta Gratuita (Humanizada):**
    *   1 a cada 6 meses.
    *   Para o médico ou familiar de 1º grau.
    *   Não acumulável.

2.  **Desconto Progressivo (Financeiro):**
    *   Inicia no 7º mês consecutivo no Ranking.
    *   Progressão: 5% -> 10% -> 15% ... até 30% (mês 12+).
    *   Regride se sair do ranking.

### 3. Parecer Jurídico Simplificado
*   Recompensa o **comportamento no ecossistema**, nunca o ato médico.
*   Consulta Gratuita = Benefício Institucional.
*   Desconto = Programa de Fidelidade.
*   **Legal no Brasil** e alinhado com HealthTech best practices.