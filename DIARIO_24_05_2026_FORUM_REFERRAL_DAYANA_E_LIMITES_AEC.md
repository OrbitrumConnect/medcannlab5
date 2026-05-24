# Diário 24/05/2026 — F4 fórum / Referral / Dayana / Limites AEC empíricos / Manual v1.1

**Autores**: Pedro Henrique Passos Galluf + Claude Opus 4.7 (1M context)
**Estado de entrada**: HEAD `f3ac4f1` (V1.9.439-A — rename Manual de Uso). Diário 23/05 fechado em sessão da manhã/tarde, mas a sessão **continuou** ao longo da tarde-noite-domingo com pendências que não entraram no diário 23. Este diário recupera o que ficou de fora e cobre o trabalho 23/05 noite + 24/05.
**Sessão**: 23/05 tarde-noite → 24/05 madrugada/manhã. Pedro: *"como dia 23 acabou! vamos então começar dia 24 com diário introduzindo essas questões e o que foi feito e falado que não tem no diário 23 — pra que podemos não só levar ao time as questões como tratá-las com devida atenção"*.

---

## 🌅 BLOCO A — Por que esse diário

O diário 23/05 (`DIARIO_23_05_2026_RE_AUDIT_HONESTO_E_LOGO_SWAP.md`) fechou no Bloco F-I cobrindo até a entrega do deck Onboarding Profissional v1.0 + memória `project_onboarding_profissional_estrategia_23_05`. Após esse fechamento, a sessão continuou com:

1. **V1.9.439** — manual v1.1 (2 slides novos: Papéis + Indicação) — pedido pós-WhatsApp profissional confuso
2. **V1.9.439-A** — rename "Onboarding Profissional" → "Manual de Uso do Profissional"
3. **V1.9.440** — fix bug crítico RLS no QR de referral + atalho "Enviar Link de Indicação" no menu Novo Paciente + cleanup AEC zumbi da Dayana
4. **V1.9.440-A** — dropdown Novo Paciente via React Portal (fix sobreposição que estava "inviável de usar")
5. **V1.9.440-B** — remove 2 opções fake/parcial do menu (anti-overclaim)
6. **Análises empíricas 24/05** — sessão prima dentista (siso eletivo) + Illa Proença (agrônoma, presidente associação) + audit tutoriais existentes + 3 recalibrações forçadas por Pedro

Total: 4 commits cirúrgicos pós-V1.9.439 (todos push 4 refs OK, type-check verde, secretlint OK, Locks intocados).

## 🩺 BLOCO B — Auditoria empírica Dayana Brazão Hanemann

**Trigger**: profissional cadastrada (1 de 11 inativos no audit de manhã) mandou WhatsApp pra Pedro perguntando *"como coloco o paciente lá"*. Foi a 1ª vez que ela usou o app empíricamente.

### B.1 — O que Dayana fez via logs (`tradevision-core` 23/05 12:46 BRT, sessão ~9min)

8 interações IA, total ~52k tokens, ~$0,50 USD:

| # | Hora | Mensagem | Intent | Observação |
|---|---|---|---|---|
| 1 | 12:46 | "dor de cabeca" | CLINICA | Simulando paciente |
| 2 | 12:46 | "o tempo inteiro" | CLINICA | Adendo |
| 3 | 12:47 | "qual data tem disponivel de consulta" | **ADMIN** | Trigger agendamento, **18.104 tokens** anomalia |
| 4 | 12:47 | "pode confirmar" | CLINICA | |
| 5 | 12:50 | "agendar" | ADMIN | Trigger novamente |
| 6 | 12:51 | "agendar dra dayana" | ADMIN | DOCTOR detection pegou nome dela mesma |
| 7 | 12:52 | "pode confirmar. as 11h" | CLINICA | **Widget agendamento aberto** |

### B.2 — Achados empíricos

- **realUserRole=professional, userRole=patient** → Dayana usou toggle "Visualizar como Paciente"
- **0 appointments criados** apesar do widget abrir (widget aberto ≠ INSERT real)
- **1 AEC zumbi de 22/03/2026** (in_progress 2 meses, doctor Ricardo) descoberta no audit
- **9 pacientes únicos vinculados a ela como doctor** — todos cruzando com perfis internos do time (Pedro/Carolina/Pedro Paciente/etc)
- **2 pacientes externos reais prováveis** vinculados a Ricardo: Maria Pitoco + Maria Helena Earp
- **Faveret tem 3 AECs como doctor** — não é 0 como audit inicial estimou (descoberta importante)

### B.3 — Bug crítico do QR de referral descoberto

Pedro testou no celular: filho da Dayana escaneou QR de indicação → recebeu erro **"Profissional não encontrado"**. Pedro reproduziu o mesmo erro.

**Root cause empírico** (`InvitePatient.tsx:27`):
```ts
.from('users').select('name').eq('id', doctorId).single()
```

`public.users` tem 6 policies SELECT, todas exigem `auth.uid()` com permissão. Anônimo (sem JWT) → 0 policies passam → 0 rows → erro. **Atinge TODOS os profissionais, não só Dayana.**

Comparativo: Ricardo tem perfil até menos completo (sem `referral_code`), daria o mesmo erro se alguém escaneasse o QR dele. Validado empíricamente.

## 🔒 BLOCO C — V1.9.440 (RLS fix + atalho referral + cleanup AEC)

3 ações combinadas no mesmo commit (`9c07121`):

### C.1 — Fix RLS via RPC SECURITY DEFINER
```sql
CREATE FUNCTION public.get_public_doctor_info(doctor_id uuid)
RETURNS TABLE (id uuid, name text, specialty text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$ BEGIN
  RETURN QUERY SELECT u.id, u.name::text, u.specialty::text
  FROM public.users u
  WHERE u.id = doctor_id
    AND (u.type::text = ANY (ARRAY['professional','doctor','profissional']))
  LIMIT 1;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_public_doctor_info(uuid) TO anon, authenticated;
```

Retorna SÓ `name + specialty` (zero dados sensíveis tipo email/CRM/CPF). Atinge anônimo (sem JWT) que escaneia QR. Bypass cirúrgico de RLS.

`InvitePatient.tsx` editado pra usar `.rpc('get_public_doctor_info', ...)` em vez de `.from('users')`.

### C.2 — Atalho "Enviar Link de Indicação" no menu Novo Paciente
Novo componente `src/components/QuickReferralModal.tsx` reusável:
- Link único `/invite?doctor_id={uuid}` + QR (api.qrserver.com, paleta Brandbook V3 ciano)
- Share triggers: WhatsApp + Email + Native API + Copy
- Hint explicativo
- Reuso da lógica do `IncentivosPanel.tsx` V1.9.270-271

5ª opção do menu Novo Paciente: "Enviar Link de Indicação" com ícone Link2 ciano + divider sutil.

### C.3 — Cleanup AEC zumbi
AEC `5e591772` de 22/03/2026 (`in_progress` 2 meses) DELETADA via PAT. Aplicação de `feedback_drift_historico_dev_aceitavel_pre_pmf_18_05` — usuário interno pré-PMF, sem audit regulatório bloqueado.

## 🎯 BLOCO D — V1.9.440-A (Portal fix dropdown sobreposto)

Pedro reportou empíricamente: dropdown Novo Paciente abria sobreposto/translúcido atrás de outros cards do prontuário. "Inviável de usar" — bloqueava feature nova V1.9.440.

**Root cause**: dropdown era `position: absolute z-[9999]` aninhado dentro de parents com `backdrop-blur` / `transform` / `overflow`. Esses elementos criam novo stacking context isolando o z-index do contexto global.

**Fix definitivo**: React Portal (`createPortal` de `react-dom`) renderiza dropdown direto no `document.body`, escapando todos stacking contexts. Padrão usado por Radix UI, Headless UI, etc.

Implementação:
- `useRef` no botão pra capturar posição via `getBoundingClientRect()`
- `useEffect` recalcula em `resize` + `scroll`
- `position: fixed` com top/right dinâmicos
- z-index 99999 (1 ordem acima de modais existentes)

Aplicado nos 2 menus duplicados do `PatientsManagement.tsx` (linha 1345 e 1480 — código duplicado pré-existente, ref nos 2 botões, só um no DOM por vez).

## 🪓 BLOCO E — V1.9.440-B (smoke audit + 2 opções fake removidas)

Audit empírico do `NewPatientForm.tsx` revelou 2 overclaims ativos no menu Novo Paciente:

### E.1 — "Importar do Banco" — **FAKE PURO**
```ts
const handleDatabaseImport = async () => {
  alert('Funcionalidade de importação de banco de dados externo requer configuração no backend.')
}
```
Médico preenchia form completo, clicava "Importar" e recebia alert dizendo que não funciona. Visual de feature pronta + comportamento fake.

### E.2 — "Arrastar Arquivos" — **PARCIAL/ENGANOSO**
```ts
if (file.name.endsWith('.csv')) await handleCSVUpload(file.file)
else { console.log('Processando:', file.name); successCount++ }
```
Só processa CSV. Outros formatos (PDF/Excel/imagem) fazem `console.log` e marcam como **sucesso fake**. Médico vê "X arquivos processados!" mas nada foi salvo.

### E.3 — Decisão Pedro: Opção A (esconder do menu)
Aplicação direta de princípios cristalizados 23/05 (`feedback_doc_institucional_sem_pat_nao_e_valido` + `feedback_anti_overclaim_endorsements`). Componente `NewPatientForm.tsx` intacto (modes continuam no código, só não são alcançáveis pelo menu).

**Menu Novo Paciente agora 100% honesto (3 opções funcionais)**:
1. **Cadastro Manual** — INSERT real em users + user_roles + clinical_assessments
2. **Importar CSV** — createPatientFromData em loop, INSERT real
3. **Enviar Link de Indicação** — modal funcional + RPC pública

## 🦷 BLOCO F — Análise empírica prima dentista (caso siso eletivo)

**Trigger**: Pedro pediu pra analisar sessão da prima dele dentista usando passosmir4@gmail.com (conta paciente teste).

### F.1 — Transcript real (23/05 20:24-20:39 BRT, AEC completa)

A prima tentou simular caso de **extração de siso por indicação ortodôntica** (cirurgia eletiva, sem queixa sintomática). Sequência:

- **20:25** prima: *"retirada de sisos"*
- **20:25** prima: *"nada mais"* / *"para colocar aparelho"*
- **20:28** Nôa: *"Vamos explorar o **sintoma** retirada de sisos. Onde você sente isso com mais nitidez?"*
- **20:29** prima: *"não é um sintoma. é uma cirurgia de retirada dos dentes siso"* ← **CORREÇÃO EXPLÍCITA**
- **20:29** Nôa: *"Quando esse **sintoma** começou?"* ← **IGNORA correção**
- **20:30→20:34** Nôa continua perguntando "sintoma" 5x: "Como você descreveria esse sintoma?" / "O que mais você sente?" / "O que melhora?" / "O que piora?"
- **20:38** CONSENSUS_REPORT: "Queixa Principal: para colocar aparelho" (= motivo, não queixa)
- **20:39** Report assinado ICP via Pipeline (24s, hash fef551f2..., DOCTOR_RESOLUTION vinculou Ricardo via appointments)

### F.2 — Diagnóstico em 2 camadas

**Técnica**: ZERO bug. 19 fases AEC percorridas, Verbatim First V1.9.86 disparou nas 3 hard-locks, Pipeline rodou completo, ICP assinado, DOCTOR_RESOLUTION OK, idempotência detectada.

**Clínica/semântica**: AEC é método **nefrológico** (drift_nefro_cannabis_16_05). Modelo cognitivo "queixa = sintoma + sensação corporal". Caso eletivo (cirurgia agendada por protocolo) não encaixa: não tem dor inicial, não tem fator que piora/melhora, não tem início no tempo.

### F.3 — Recalibração #1 forçada por Pedro

Minha leitura inicial: *"AEC tem falha de design pra casos eletivos"*. Pedro corrigiu: prima dentista NÃO é caso clínico legítimo do escopo MedCannLab — *"dentista tira siso pra ganhar dinheiro"* (over-indicação comercial-protocolar). Não há cliente real perdido. Caso encerrado.

## 🌿 BLOCO G — Análise empírica Illa Proença (presidente associação, agrônoma)

**Trigger**: Pedro pediu pra avaliar uso da Illa — *"dona de uma associação possível parceira"*.

### G.1 — Perfil empírico

- Cadastro 22/05, conta paciente, paid R$ 63
- `invited_by` NULL (entrou direta, sem referral)
- **AGRÔNOMA, não médica**
- Presidente de associação de cannabis

### G.2 — Transcript (23/05 21:40-21:43 BRT, ~3min, ABANDONOU)

6 interações IA, $0,0363 USD (~R$ 0,18):

- 21:41 Illa: *"quero iniciar meu tratamento"*
- 21:41 Illa: *"tenho diagnostico de ansiedade"*
- 21:42 Illa: *"preciso de orientações para iniciar meu tratamento com eloe de cbd"* (típico óleo)
- 21:42 Nôa: *"Vamos explorar o **sintoma** quero iniciar meu tratamento. Onde você sente isso?"* ← absurdo no contexto
- 21:43 Illa: *"emocional"*
- 21:43 Nôa: *"Quando esse sintoma começou?"*
- **ABANDONO**

### G.3 — Recalibração #2 forçada por Pedro

Minha leitura inicial: *"Illa frustrou-se → fluxo AEC quebra demanda informacional"*. Pedro corrigiu radicalmente: **Illa é agrônoma + presidente associação = NÃO É PACIENTE**. Abandono não é frustração — é **auto-seleção saudável**. Ela percebeu sozinha que não era o lugar dela.

## 🧠 BLOCO H — Recalibração tripla e insight cristalizado

Pedro me forçou a recalibrar 3 vezes na mesma conversa. Cada vez eu cheguei a uma conclusão que ele desmontou empíricamente:

### H.1 — Pass 1: "AEC tem falha de design"
**Erro**: vi 2 abandonos seguidos (prima + Illa) e propus mudar AEC com pivot de tipo de queixa.
**Correção Pedro**: AEC é método clínico determinístico desenhado pra paciente OUVIDO por médico. Funciona pro propósito.

### H.2 — Pass 2: "Falta entrada de chat livre"
**Erro**: propus adicionar opção "Conversar com a Nôa" alternativa à AEC.
**Correção Pedro**: chat livre **JÁ EXISTE** e é o uso DOMINANTE. Provado empíricamente via PAT (BLOCO I abaixo).

### H.3 — Pass 3: "Hierarquia visual confunde novato"
**Erro**: propus reordenar visibilidade.
**Correção Pedro**: pessoas que entram no app NÃO vão ali pra respostas livres tipo ChatGPT. A "frustração" da Illa é **a triagem funcionando** — quem não é caso clínico legítimo percebe e sai. **AEC é repelente natural de demanda fora-escopo.** Função emergente boa.

### H.4 — Insight cristalizado (definitivo)

> **"AEC tem função emergente valiosa: filtra naturalmente demanda fora do escopo clínico-integrativo. Antes de propor mudança no produto baseado em 'usuário abandonou/se frustrou', validar se o usuário pertencia ao escopo. Auto-seleção saudável > onboarding inflado. A rigidez da AEC É a recusa correta (`feedback_recusa_correta_vale_mais_que_resposta_22_05`)."**

Memória pra cristalizar: `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05` (aguardando autorização Pedro).

## 📊 BLOCO I — Audit empírico chat livre vs AEC formal (último 30d)

Query PAT:

| Tipo | Volume últimos 30 dias | % |
|---|---|---|
| **Chat livre clínico** (intent=CLINICA SEM trigger AEC) | **2.129** | **89,8%** |
| Admin (navegação) | 106 | 4,5% |
| **Triggers AEC formais** ("iniciar avaliação") | **48** | **2,0%** |
| Outros | 88 | 3,7% |
| **Total** | 2.371 | 100% |

**Tradução empírica**: 9 em cada 10 mensagens IA do app são chat livre conversacional. AEC formal é alto valor regulatório (gera ICP assinado, racionalidades) mas baixo volume. Quem está dentro do escopo (Pedro, Ricardo, Carolina, pacientes vinculados) usa chat livre todo dia. Quem cai acidentalmente na AEC sem ser caso clínico (Illa, agrônoma) abandona — auto-seleção.

## 👥 BLOCO J — Curva de aprendizado mesmo dos sócios (não-cliente externo)

Pedro: *"app é novo! ninguém nunca usou. Ricardo sabe navegar tudo, quem dirá Eduardo Faveret! ambos também precisam de ajuda mesmo eu tentando fazer o design mais simples possível"*.

Audit empírico:

| Sócio | AECs | Reports | Último login | Veredito |
|---|---|---|---|---|
| **Ricardo Valença** | 66 | 100 (12 ICP últimos 14d) | 23/05 manhã | Usa AEC++Report ICP empíricamente |
| **Eduardo Faveret** | 3 | 1 | **05/05** (19 dias) | Testou 3x e parou — não voltou |
| **Pedro Galluf** | (admin teste) | 9 (passosmir4) | 23/05 | Testa todo dia |

**Implicação**: mesmo Faveret (sócio-fundador, médico) **abandonou após 3 AECs em maio**. Não por design ruim — por falta de **hand-holding pós-cadastro**. Mata empíricamente a fantasia "design simples basta" — plataforma clínica nova exige manual + acompanhamento.

## 📚 BLOCO K — Audit tutoriais existentes (descoberta positiva)

### K.1 — OnboardingTutorial (`src/components/OnboardingTutorial.tsx`)
- 5 steps por perfil (paciente/profissional/aluno)
- Aparece pra usuário sem `onboarding_completed_at`
- Salva no banco quando completa
- **Taxa empírica de conclusão: 100%** (31/31 que aceitaram termos completaram tutorial)

**Caveat**: completar ≠ absorver. Modal fullscreen com "X Pular" — usuário clica "Próximo" 5x rápido pra começar a usar. Banco marca completo, médico esquece. Faveret completou e abandonou mesmo assim.

### K.2 — NoaChatHelpModal (`src/components/NoaChatHelpModal.tsx` — V1.9.54)
- Acionado pelo botão "?" no header do chat Nôa
- Conteúdo por perfil (V1.9.49 + V1.9.52 + V1.9.53 coerente)
- Sobre o que a Nôa faz / como iniciar AEC / etc

**Caveat**: botão `p-2 rounded-full w-5 h-5 text-white/80` — pequeno, pálido, sem pulse, sem destaque. **Ninguém vê**. Provavelmente HelpModal silencioso = subutilizado.

### K.3 — Proposta Pedro pro V1.9.441 (não codada)

Auto-open HelpModal na 1ª vez que usuário abre chat Nôa (~20min código):
- localStorage `noa_help_seen` OU coluna `users.noa_help_dismissed`
- Se NULL → HelpModal abre sozinho
- Usuário fecha → marca visto, não abre mais
- Princípio: visibilidade > criar feature nova (`feedback_polir_nao_inventar`)

Mata o problema da Illa (não sabia que existia chat livre) sem mexer em AEC.

## 📦 BLOCO L — Cristalizações pendentes (autorização Pedro)

Esta sessão acumulou aprendizados estruturais que merecem cristalização. Aguardando autorização individual:

| Memória sugerida | Conteúdo |
|---|---|
| `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05` | Insight do BLOCO H + dados BLOCO I — AEC filtra demanda fora-escopo, função emergente boa, 89,8% uso é chat livre, antes de propor fix validar contexto |
| `feedback_curva_aprendizado_alta_mesmo_para_socios_24_05` | BLOCO J — Faveret abandonou em maio mesmo sendo sócio, design simples não substitui hand-holding, white glove é o caminho pré-PMF |
| `feedback_chat_livre_dominante_vs_aec_minoria_24_05` | BLOCO I numérico empírico (2.129 vs 48), implicação pra UX entrada novato web |
| `feedback_completar_tutorial_nao_e_absorver_24_05` | BLOCO K — OnboardingTutorial 100% conclusão MAS baixa absorção, HelpModal silencioso = subutilizado, próximo passo é visibilidade |
| `feedback_forum_publish_requer_pseudonimo_23_05` | (já cristalizada 23/05 sessão da tarde) |
| `project_onboarding_profissional_estrategia_23_05` | (já cristalizada 23/05) — atualizar com dado empírico de adesão pós-WhatsApp Dayana |
| `feedback_doc_institucional_sem_pat_nao_e_valido_23_05` | (já cristalizada 23/05) — princípio mãe que ressurgiu várias vezes |

## 🎯 BLOCO M — Pendências do PARECER P0 (recalibradas)

Audit hoje recalibrou 2 P0s anteriores:

### M.1 — P0 #1: Hint enganoso no `/invite`
**Estado**: ainda ativo. Frase *"Use o mesmo email pra vincular automaticamente"* engana — não existe lookup por email. **NÃO foi corrigido ainda**. Custo fix: 30s edit, ZERO risco regressão.

### M.2 — P0 #2: Encryption fallback dev → recalibrado pra P2
Audit PAT: `chat_messages_legacy` tem **0 mensagens em formato AES[...] cripto real**. 15 mensagens, todas plaintext. O `encryption.ts` está no código mas **nunca foi efetivamente usado em produção**. Risco LGPD HOJE = zero empírico pela cripto (pelo plaintext é outra conversa, mas isso é outro tema).
- **Pendência**: Pedro verifica Vercel se `VITE_ENCRYPTION_KEY` está setada (2min teu lado)
- **Quando virar P0**: SE/QUANDO `useChatSystem` começar a ser usado em volume (Marco 2+)

## 🚀 BLOCO N — Estado git e operacional

**Commits dia 23-24/05 (pós-fechamento diário 23):**
```
8e23aad  V1.9.440-B  remove 2 opcoes fake do menu Novo Paciente
f460c32  V1.9.440-A  dropdown via Portal (fix sobreposicao)
9c07121  V1.9.440    fix RLS QR + atalho referral + cleanup AEC Dayana
f3ac4f1  V1.9.439-A  rename "Onboarding Profissional" -> "Manual de Uso"
e0fde18  V1.9.439    manual v1.1 deck (2 slides novos)
```

**Estado git**: 5 commits, push 4 refs OK em todos, type-check + secretlint verdes, Locks AEC/Pipeline/PBAD intocados, V1.9.299 PBAD CONFORME ITI preservado.

**Vite dev server**: rodando background porta 3000 (PID 21576) desde 23/05 manhã.

## 🤝 BLOCO O — Material A pro time (questões a tratar com atenção)

Este diário deve ser lido pelo time (Ricardo + Eduardo Faveret + João Vidal) porque traz 3 questões operacionais reais que precisam decisão coletiva:

### O.1 — Bug RLS QR resolvido, mas tem implicação pra Marco 2/3
Foi resolvido tecnicamente (V1.9.440 RPC SECURITY DEFINER). **Mas conceitualmente**: a RPC retorna name + specialty públicos de qualquer médico cadastrado. Quando Marco 1+ chegar e tiver dezenas de médicos parceiros, qualquer pessoa pode chamar a RPC e descobrir todos os médicos da plataforma (scraping de UUIDs). **Decisão time**: aceitar essa exposição mínima como custo do referral, ou adicionar rate-limit/audit pós-MVP?

### O.2 — Faveret abandonou em maio — precisa reativação ATIVA
3 AECs em maio + abandono 19 dias atrás. Foi sócio fundador. Sugestão acionável: **Pedro mandar WhatsApp pra Eduardo HOJE/AMANHÃ com Manual de Uso v1.1** + agendar call 15min pra ele retomar. Dado empírico de Marco 3 (2º médico independente) depende de Faveret reativar ou recrutar 2º médico de fora.

### O.3 — Illa Proença é parceira institucional, não cliente paciente
Ela testou modo paciente e abandonou em 3min — auto-seleção saudável. **Mas há oportunidade real**: ela é dona de associação. Mensagem WhatsApp sugerida (Pedro manda):
> *"Illa, o fluxo que você experimentou é desenhado pra paciente novo sem diagnóstico. Pro perfil de associação, faz mais sentido eu te mostrar como você convida os pacientes da associação via QR/link e acompanha no painel. 15min de call?"*

### O.4 — Sobre Dayana (profissional cadastrada)
Dona de perfil dual (profissional + paciente), testou modo paciente, tentou agendar consulta com ela mesma. Bug do QR resolvido beneficia ela. Sugestão: Pedro reenvia link da landing pra ela testar de novo + manda Manual de Uso v1.1.

## 🧬 BLOCO P — Princípios cristalizados nesta sessão (resumo)

1. **AEC é repelente natural de demanda fora-escopo** — auto-seleção saudável > onboarding inflado
2. **Chat livre é uso dominante** (89,8% últimos 30 dias) — AEC formal é minoria de alto valor regulatório
3. **Curva de aprendizado é alta MESMO para sócios** — Faveret prova, design simples não substitui hand-holding
4. **Completar tutorial ≠ absorver** — 100% conclusão empírica vs baixa retenção, visibilidade do HelpModal contextual é caminho
5. **React Portal pra dropdowns** dentro de parents com stacking context isolado — padrão definitivo
6. **Validar contexto de uso ANTES de propor mudar produto** — Pedro me corrigiu 3x na mesma conversa, viés "frustrou = bug" precisa filtro "estava no escopo?"
7. **Anti-overclaim em menus** — opções que mostram alert "não funciona" precisam ser escondidas (V1.9.440-B Importar do Banco / Arrastar Arquivos)

## 🎯 Frase âncora do dia

> *"Pedro me forçou a recalibrar 3 vezes na mesma conversa o que eu lia como 'problema do produto'. Cada pass eu cheguei a uma conclusão que ele desmontou empíricamente — última versão: AEC é repelente natural de demanda fora-escopo, função emergente boa, não bug. 89,8% das interações IA do app são chat livre conversacional; 2% são AEC formal de alto valor regulatório. Quem está no escopo (Pedro, Ricardo, Carolina, pacientes vinculados) usa chat livre. Quem cai acidentalmente na AEC sem ser caso clínico (Illa agrônoma, prima dentista comercial) abandona — triagem correta. Princípio definitivo: validar contexto de uso ANTES de propor mudar produto."*

— Dia 24/05/2026 (sessão começou 23/05 noite, atravessou madrugada) · 5 commits cirúrgicos pós-diário 23 · 3 recalibrações forçadas por Pedro · 5 memórias pendentes de cristalização · 4 ações operacionais pro time (Ricardo + Faveret + João) · zero regressão · Locks PBAD/AEC/Pipeline intocados.

---

## 🔧 BLOCO Q — Fechamento da sessão (V1.9.441 + 7 memórias)

Pós-feedback final do Pedro elogiando especificamente a maturidade epistemológica do diário (separação engenharia × epistemologia + recalibração transparente), executei o caminho A consolidado:

### Q.1 — V1.9.441 — Fix regex fuzzy match INTERRUPTED (zero regressão)

**Arquivo**: `src/lib/clinicalAssessmentFlow.ts` linhas 1214, 1217, 1218.

**Mudança**: 3 regex de matching de "conversar" no detector de recusa pós-INTERRUPTED ganharam R opcional (`conversa[r]?`).

**Bug fixado** (confirmado empíricamente pelo teste do Pedro 24/05 09:13 manhã): regex exigia "conversar" infinitivo literal. "apenas conversa" (sem R) não casava, Verbatim Hard Lock ficava travado retornando a mesma frase. Empíricamente Pedro digitou "apenas conversa" → ficou travado; depois "apenas conversar" → transição funcionou.

**Filtro 6 perguntas aplicado** (`feedback_coerencia_e_alinhamento_qualquer_fix_17_05`):
1. Padrão arquitetural ✓
2. Invariantes (AEC/Pipeline/PBAD) NÃO TOCADOS ✓
3. Rationale conectado (bug empírico) ✓
4. Trigger empírico ocorreu (Pedro reproduziu) ✓
5. Compat reversa ✓ (R opcional aceita ambos)
6. Regras anteriores respeitadas (recusa SEMPRE primeiro, ordem 1207 preservada) ✓

**Anti-regressão**: zero risco. Type-check verde.

**Volume potencial protegido**: 54 AECs `in_progress` no banco que poderiam ter usuários voltando e digitando "apenas conversa" sem R.

### Q.2 — Fix #1 (banner contextual) PARQUEADO por descoberta de risco escondido

Audit pré-fix revelou que badge UI "Último fluxo: FOLLOW_UP" **NÃO corresponde a fase do enum AssessmentPhase do FSM AEC** (query PAT retornou 0 ocorrências; grep no clinicalAssessmentFlow.ts retornou 0 matches).

Implicação: trigger banner linha 610 não dispara nesse estado. Implementar fix sem entender de onde vem o label "FOLLOW_UP" = "consertar" trigger lendo estado errado = dívida silenciosa entre UI e Core.

**Parqueado**: investigação adicional necessária (chatEvolutionService.ts + grep mais profundo) antes de qualquer alteração de trigger. Custo audit: 30-45min próxima sessão dedicada.

Cristalizado em [[feedback_followup_badge_ui_nao_e_fase_aec_fsm_24_05]].

### Q.3 — Fix #3 (meta-cognição da Nôa) PARQUEADO indefinidamente

Implementação nova (não polir, é inventar). Sem trigger empírico em volume — só Pedro perguntou no teste. Princípio `feedback_polir_nao_inventar` aplicado: aguardar 3+ usuários reais perguntando "por que iniciou?" antes de implementar.

### Q.4 — 7 memórias cristalizadas (nível 1 do MEMORY.md)

| # | Memória | Tipo |
|---|---|---|
| 1 | `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05` | princípio meta (3 recalibrações) |
| 2 | `feedback_engenharia_perfeita_pode_produzir_semanticamente_inadequado_24_05` | distinção engenharia ≠ epistemologia |
| 3 | `feedback_followup_badge_ui_nao_e_fase_aec_fsm_24_05` | gap arquitetural UI↔FSM (descoberta nova) |
| 4 | `feedback_chat_livre_dominante_vs_aec_minoria_24_05` | dado empírico 89,8% vs 2% |
| 5 | `feedback_curva_aprendizado_alta_mesmo_para_socios_24_05` | Faveret prova |
| 6 | `feedback_completar_tutorial_nao_e_absorver_24_05` | 100% conclusão ≠ retenção |
| 7 | `feedback_diario_que_mostra_erros_vale_mais_que_diario_polido_24_05` | princípio meta-doc pra diários |

Todas adicionadas ao MEMORY.md nível 1 com hooks descritivos. Próxima sessão lê o índice e entra no contexto cristalizado.

### Q.5 — Insight final cristalizado pelo Pedro

Pedro identificou no feedback do diário que **a separação clara entre 6 tipos de fenômeno** dá credibilidade ao diário:

| Tipo | Exemplo da sessão |
|---|---|
| Bug real | QR referral quebrado por RLS |
| UX real | dropdown invisível |
| Overclaim | menu fake "Importar Banco" |
| Limite metodológico | AEC nefro aplicada em caso eletivo |
| Auto-seleção saudável | Illa abandonando |
| Problema humano | Faveret sumindo após 3 usos |
| Função emergente positiva | AEC como repelente natural |

Tendência em produto novo: jogar tudo no mesmo saco *"usuário saiu = produto ruim"*. **Maturidade = distinguir.** Diário 24/05 demonstrou essa separação na prática.

### Q.6 — Estado pós-sessão

```
HEAD git pós-V1.9.441: (a ser confirmado após commit)
Type-check verde ✓
Secretlint verde (a confirmar)
Push 4 refs OK (a confirmar)
Locks intocados: V1.9.95+97+98+99-B + V1.9.299 PBAD CONFORME ITI ✓
Vite dev server: continuando background porta 3000
Memórias cristalizadas hoje: 7 (nível 1)
Diários da sessão: este (24/05)
```

### Q.7 — Frase âncora FINAL do dia 24/05

> *"O audit do fix #2 ficou MUITO sólido. Vocês validaram: ocorrência real, volume potencial (54 in_progress), matcher atual, compat reversa, ordem dos guards, impacto semântico, ausência de efeito colateral. Isso é exatamente o tipo de fix pré-PMF saudável: pequeno, cirúrgico, empírico, sem refator, sem reinventar arquitetura. Além disso, o insight do FOLLOW_UP vale quase mais que o fix. Porque agora ficou claro: a UI fala uma linguagem, o FSM fala outra, e vocês estavam assumindo que era o mesmo estado. Isso é descoberta arquitetural real. No final o único fix realmente sólido foi: tornar o matcher mais humano ('conversa' sem r). Isso mostra maturidade de produto."* — Pedro 24/05 manhã, fechando avaliação dos 3 fixes.

— Sessão 23/05 noite → 24/05 manhã encerrada com V1.9.441 (fix regex `conversa[r]?`) + 7 memórias nível 1 + descoberta arquitetural FOLLOW_UP gap + parqueamento consciente de 2 fixes (banner contextual + meta-cognição) sem dívida silenciosa. Maturidade > velocidade.
