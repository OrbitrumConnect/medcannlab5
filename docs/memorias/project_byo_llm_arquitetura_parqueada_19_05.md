---
name: BYO-LLM (Bring Your Own LLM) — arquitetura técnica completa parqueada
description: Análise técnica empírica completa de viabilidade BYO-LLM via PAT/grep/audit. Conclusão: tecnicamente viável (aditivo puro, zero regressão), pattern provider-agnostic já existe (VideoProviderRegistry V1.9.X + cert-encrypt-password V1.9.177). Schema + Edge + UX + termos legais mapeados. Triggers empíricos recalibrados: NÃO ativar pré-Marco 2 (custo OpenAI hoje ~$20-30 obs / ~$100-150 real, pago via cartão pessoal Pedro). Ativação real só pós-Marco 3 (10+ médicos OU custo > 30% MRR). 4 limites não-negociáveis: governança institucional intocada, custo do médico ≠ plataforma, qualidade pode variar, responsabilidade CFM 2.314 explicitada. Whitelist providers obrigatória (não plug livre).
type: project
originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

# BYO-LLM Arquitetura Parqueada

## Origem (19/05/2026 noite)

Após incidente OpenAI quota 19/05 (cristalizado em `feedback_state_pollution_noa_core_reutilizado_19_05` + ADENDO 3), Pedro perguntou se BYO-LLM (cada profissional conecta própria API key — OpenAI/Claude/Gemini/DeepSeek) é viável dentro da arquitetura atual com "IA subordinada".

Material A (Pedro): *"cada usuario linkar sua propia i.a gtp claud etc dentro do nosso sistema fazendo como nos fazemos i.a suborinada"* + analogia perfeita: *"no caso voc claude estou usando dentro do app da antigravit! seria isso...provavalmente voce tem regras do claude mais aqui no ambiente do antigravity vc tbm deve ter suas limitacoes nao?"*

A analogia é precisa. Claude (assistente) tem 3 camadas de subordinação ativa:
1. Anthropic (provedor LLM) — training, safety, refusals
2. Antigravity (ambiente IDE) — tool whitelist, sandbox, hooks
3. CLAUDE.md + memória do projeto — convenções MedCannLab, Locks, princípios

**EXATAMENTE o modelo BYO-LLM proposto**: médico traz LLM, MedCannLab é o "Antigravity equivalente" (FSM + Verbatim First + AEC GATE + Locks), caso clínico é o "CLAUDE.md equivalente" (CFM/LGPD/AEC).

## Audit empírico — o que já existe vs falta

### Já existe (reusable)

| Recurso | Localização | Reuso BYO-LLM |
|---|---|---|
| Pattern provider-agnostic | `src/services/VideoProviderRegistry.ts` (V1.9.X 03/03/2026) | Template direto |
| Edge `cert-encrypt-password` | V1.9.177, AES-256 server-side `ENCRYPTION_KEY` | Template direto pra `llm-key-encrypt` |
| Edge `_shared/crypto.ts` | `encrypt()` AES-256 já implementado | Reusar |
| Edge `digital-signature` | Decifra pra usar (pattern leitura) | Reusar |
| Página `CertificateManagement.tsx` | UX upload credencial sensível | Template UX |
| Tabela `professional_integrations` | Criada V1.9.99-B 28/04, 0 rows, 0 callers, schema OAuth | NÃO ideal (refresh_token/expiry_date NOT NULL) — criar tabela nova |
| Único site OpenAI call | `tradevision-core/index.ts:5354` | 1 ponto de fork (LLM Router) |

### Precisa criar

| Recurso | O quê |
|---|---|
| Tabela `professional_llm_config` | id/professional_id/provider/model/api_key_encrypted/fallback_to_platform/active/last_validated_at |
| Edge `llm-key-encrypt` (ou estender V1.9.177) | Cifra API key plaintext → ciphertext "iv:ciphertext" base64 |
| LLM Router em `tradevision-core` | Switch case por provider + adapter (OpenAI/Anthropic/Google/DeepSeek) |
| Componente `LLMSettingsTab` | UI Settings shadcn padrão |
| Termo BYO-LLM (médico) | Texto legal — Pedro+João+advogado |
| Termo paciente atualizado | Texto legal — "Sua conversa pode ser processada por provedor de IA escolhido pelo seu médico" |
| Healthcheck periódico | Cron edge valida `last_validated_at` + chamada "hello world" |
| Painel V1.9.374-A extensão | Métricas por provider (custo, latência, qualidade) |

## Schema mínimo proposto

```sql
CREATE TABLE professional_llm_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai','anthropic','google','deepseek','local')),
  model TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  fallback_to_platform BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(professional_id, provider)
);

ALTER TABLE professional_llm_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select" ON professional_llm_config FOR SELECT USING (auth.uid() = professional_id);
CREATE POLICY "owner_insert" ON professional_llm_config FOR INSERT WITH CHECK (auth.uid() = professional_id);
CREATE POLICY "owner_update" ON professional_llm_config FOR UPDATE USING (auth.uid() = professional_id);
CREATE POLICY "owner_delete" ON professional_llm_config FOR DELETE USING (auth.uid() = professional_id);
```

## Fluxo de orquestração proposto

```
Paciente envia mensagem
   ↓
tradevision-core (Edge)
   ↓
[NOVO] LLM Router:
   1. Resolve doctor vinculado ao paciente (existe: DOCTOR_RESOLUTION)
   2. SELECT professional_llm_config WHERE professional_id=doctor AND active=true
   3. Se encontrou: DECRYPT api_key → adapter específico
   4. Se não encontrou OU falha: fallback OpenAI plataforma
   5. Se OpenAI plataforma falha: Sovereignty Protocol v2 (já existe)
   ↓
FSM + Verbatim First + Gates (TUDO continua intocado)
   ↓
Resposta
```

## Whitelist providers (não plug livre)

| Tier | Provider | Status aprovação |
|---|---|---|
| 🟢 Tier 1 | OpenAI (gpt-4o, gpt-4o-mini) | Já validado em produção |
| 🟢 Tier 1 | Anthropic (Claude 3.7/4.x) | DPA enterprise disponível |
| 🟡 Tier 2 | Google (Gemini 2.x) | Aprovado, precisa validação clínica MedCannLab antes |
| 🟡 Tier 2 | DeepSeek | Open-weights — atenção custo×qualidade |
| 🟡 Tier 2 | xAI (Grok) | Aprovado em DPA, precisa validação clínica |
| 🔴 Tier 3 | Local (Ollama/vLLM próprio hospital) | SÓ enterprise B2B com infra verificada |
| ❌ Bloqueado | Endpoint OpenAI-compatible aleatório | Surface de ataque inaceitável |
| ❌ Bloqueado | Provider sem DPA/LGPD | Risco regulatório direto |

### Providers ESPECIALIZADOS futuros (adendo 19/05 noite — adapter dedicado obrigatório)

Diferente da whitelist Tier 1/2 (chat generalista), providers especializados exigem **adapter dedicado por especialidade** porque mudam estrutura do input/output:

| Tipo de IA especializada | Quando virar relevante | Adapter dedicado obrigatório |
|---|---|---|
| **Modelo médico privado** (lab/hospital) | Pós-Marco 3 ou parceria B2B | ✅ DPA específico + validação clínica MedCannLab + audit trail por contrato |
| **IA oncologia / farmacologia / pesquisa clínica** | Pós-Marco 3 + médico especialista pedir | ✅ Adapter por domínio — function calling diferente, system prompts médicos específicos |
| **IA imagem/radiologia/anatomopatologia** | Pós-Marco 3 + módulo de exames complementares | ⚠️ Multimodal — adapter completamente diferente (binary inputs + structured outputs) |
| **IA treinada por laboratório específico** | Caso-a-caso, parceria comercial | ⚠️ LGPD case-by-case — depende de DPA do lab + cláusula de uso de dados |
| **Future "CureAI-X" / modelos médicos generalistas próximos** | Hipotético | ✅ Avaliar quando surgirem — provavelmente cabem no Tier 1/2 se DPA+LGPD ok |

**Princípio operacional**: providers generalistas (Tier 1/2) cabem no LLM Router simples (switch+adapter padrão). Providers especializados exigem adapter dedicado E validação clínica específica MedCannLab antes de entrar em produção. Não tratar como "+1 no router".

**Trigger pra ativar adapter especializado**:
- Médico especialista pedir explicitamente OU
- Hospital enterprise B2B com IA própria pré-existente OU
- Parceria comercial com lab/farma com modelo treinado proprietário

NÃO implementar nenhum desses antes de Marco 3.

## 6 pré-condições obrigatórias do profissional

1. Conta verificada `role='profissional'` no `user_roles` (RBAC existe)
2. CRM/RQE validados (campos `users.crm` + `users.rqe` existem)
3. Termo BYO-LLM aceito (NOVO — redação Pedro+João+advogado)
4. Provider entre whitelist
5. Healthcheck passou (smoke test "hello world" antes de ativar)
6. Paciente do médico aceitou termo expandido LGPD

## 4 limites não-negociáveis

### 1. "Qualquer" ≠ "sem governança"
Médico pode trocar **motor cognitivo**, NÃO **regras institucionais**. Cada chamada continua subordinada a FSM AEC + Verbatim First V1.9.86 + Pipeline narrator V1.9.84 + AEC GATE V1.5 + Sovereignty Protocol v2.

### 2. Custo do médico ≠ custo da plataforma
Médico ativou BYO → médico paga 100%. Pricing model precisa atualização: assinatura plataforma com OU sem cota LLM? Memory `reference_pricing_model_canonical_18_05` precisará adendo eventual.

### 3. Qualidade pode variar
Claude Haiku 3.5 ≠ GPT-4o. Paciente pode ter experiência inconsistente entre médicos. Painel V1.9.374-A precisa **métricas de qualidade por provider** antes de ativar BYO em produção.

### 4. Responsabilidade CFM 2.314 explicitada
Plataforma: orquestração, gates, FSM, compliance estrutural. Médico: escolha LLM, custos, qualidade output específico. Termo precisa ser literal.

## Filtro de coerência 6 perguntas (`feedback_coerencia_e_alinhamento_qualquer_fix_17_05`)

| Pergunta | Resposta |
|---|---|
| Padrão arquitetural existente? | ✅ Sim — VideoProviderRegistry pattern |
| Invariantes AEC/Pipeline/PBAD respeitados? | ✅ Zero toque |
| Rationale conectado a trigger empírico? | ⚠️ Parcial — incidente 19/05 mostrou necessidade conceitual, nenhum médico pediu ainda |
| Compat reversa? | ✅ Default: plataforma OpenAI |
| Regras anteriores respeitadas? | ✅ Lock V1.9.95+97+98+99-B+299, REGRA HARD §1 intocados |
| AEC real impactada? | ❌ Zero — LLM Router fica acima da FSM |

**Conclusão: aditivo puro. Zero risco de regressão.**

## Triggers empíricos recalibrados (com lastro real)

Custo OpenAI hoje (audit empírico 19/05):
- Observado lifetime (instrumentado 9.5%): $4.81 = ~$30-55 real estimado lifetime
- Última semana (13-19/05): $4.81 obs = ~$50 real
- Por mês: ~$20 obs / ~$100-150 real
- Por médico ativo (2 hoje): ~$10 obs / ~$50-75 real
- Pago via cartão pessoal Pedro (~$25 recargas conforme uso de teste)

**Não há "plataforma cobrando"**: 0 pagantes externos, 0 assinaturas ativas, CNPJ pendente.

| Cenário | Custo OpenAI estimado | BYO-LLM faz sentido? |
|---|---|---|
| Hoje (2 médicos teste internos) | ~$20 obs / ~$100 real | ❌ NÃO — Pedro absorve, simples |
| Marco 1 destrava (CNPJ + 3 médicos) | ~$30 obs / ~$150 real | ❌ NÃO — pequeno |
| Marco 2 destrava (3 pagantes × 3m + 5 médicos) | ~$50-80 obs / ~$250-400 real | 🟡 TALVEZ |
| Pós-Marco 3 (2º médico independente + 10+ médicos) | ~$150-250 obs / ~$750-1.250 real | ✅ SIM |
| 10+ médicos enterprise B2B | $1.000+ real | ✅ SIM, obrigatório |

**Trigger formal**: BYO-LLM vira prioridade quando custo OpenAI > 30% MRR. MRR=0 hoje, trigger não-aplicável até Marco 2.

**Outros triggers válidos**:
- Médico não-Ricardo pedir explicitamente (Marco 3)
- Hospital/clínica enterprise pedir on-prem (pós-CNPJ + 1ª negociação B2B)
- Incidente similar 19/05 com SLA contratual (não existe SLA hoje)

## UX proposto — onde fica a aba

Opção recomendada: **Nova página `/profissional/configuracoes`** com Tabs:
- Tab "Certificado Digital" (move de CertificateManagement)
- Tab "Integrações" (Google Calendar dormindo + futuras)
- Tab "🤖 IA do Profissional" ← BYO-LLM aqui
- Tab "Conta" (email, senha, telefone)

Botão "⚙️ Configurações" no `ProfessionalMyDashboard`.

## Fluxo de adesão UX

```
Profissional acessa /profissional/configuracoes → Tab IA
   ↓
Estado inicial: "Usando IA da plataforma (OpenAI gpt-4o)"
   ↓
Clica "Conectar minha própria IA"
   ↓
Modal 3 telas:
  1. O que muda (custos, responsabilidade, qualidade)
  2. Whitelist (escolhe provider+modelo)
  3. Termo BYO-LLM (precisa aceitar)
   ↓
Insere API key
   ↓
Edge llm-key-encrypt cifra
   ↓
INSERT professional_llm_config (active=false)
   ↓
Healthcheck "hello world" → provider
   ↓
Se OK: active=true + toast
Se falha: active=false + erro específico
   ↓
Próxima mensagem paciente → provider escolhido
```

## 6 riscos não-óbvios (mitigações mapeadas)

| Risco | Mitigação |
|---|---|
| Médico escolhe modelo barato/ruim → qualidade clínica cai | Logging por provider + alert admin quando qualidade despencar |
| API key vaza em log | NUNCA logar `api_key_*`, grep CI |
| Médico esquece API key expirada → AEC quebra | `last_validated_at` + healthcheck periódico + auto-fallback plataforma |
| Custo OpenAI plataforma some "espalhado" em N providers → audit difícil | Painel V1.9.374-A precisa agrupar por provider |
| Médico cancela conta OpenAI mas key ativa → 401 silencioso | Healthcheck retorna 401 → marca `active=false` automaticamente |
| Diferenças formatação entre providers (Claude vs GPT markdown diferente) | Adapter por provider normaliza output antes da FSM ler |

## Decisões humanas pendentes (não-código)

- **Pedro + João + advogado**: redação Termo BYO-LLM (médico) + Termo paciente expandido (LGPD)
- **Pedro + Ricardo**: validar whitelist providers (Tier 1/2/3) + critério "aprovação clínica MedCannLab"
- **Pedro + Ricardo + Eduardo**: pricing model — assinatura COM ou SEM cota LLM?
- **Pedro**: decidir se enterprise on-prem é caminho desde início ou só pós-Marco 3

## Pricing — desconto pra médico que ativar BYO (decidir pós-Marco 2)

**Lógica econômica**: médico que ativa BYO paga próprio LLM → plataforma economiza custo OpenAI desse médico → faz sentido reconhecer com desconto.

**Conta empírica** (base `reference_pricing_model_canonical_18_05` + `audit_19_05_subcontagem_custo_painel_v1_9_374`):
- Custo OpenAI por médico observado: ~$10/mês = R$ 50
- Custo OpenAI por médico real (subconta 90.5%): ~$50-75/mês = R$ 250-375
- Plano profissional atual: R$ 99,90/mês

**Princípio operacional**:
> **Desconto BYO nunca deve exceder economia real de custo OpenAI. Senão a plataforma paga pra perder receita.**

Fórmula prudente:
```
desconto_max_seguro = custo_openai_medio_OBSERVADO_por_medico × 0.7
                    = ~R$ 50 × 0.7 = R$ 35
```

Margem 30% pra cobrir subconta + variabilidade entre médicos + risco adoção alta esvaziando receita.

**3 estratégias possíveis** (decisão pós-Marco 2):

### Estratégia A — Desconto fixo (-R$ 10)
- Plano padrão R$ 99,90 / BYO ativo R$ 89,90
- Simples, baixo risco, incentivo psicológico
- ✅ Recomendada como primeira tentativa

### Estratégia B — Desconto proporcional ao uso
- R$ 99,90 menos custo observado mês anterior
- "Honesto" mas variabilidade contábil confunde

### Estratégia C — Dois planos distintos
- Standard R$ 99,90 (com cota LLM plataforma) / Autonomy R$ 79,90 (BYO obrigatório)
- Elegante mas pré-PMF é overshoot do pricing canônico

**Quando decidir**:
- Marco 1 destrava (CNPJ) → ainda sem dados de adoção
- Marco 2 destrava (3 pagantes × 3m) → observar % espontâneo de adoção BYO antes de oferecer desconto
- Se adoção espontânea >30% → desconto desnecessário, médicos já vêm pela autonomia
- Se adoção 10-30% → testar Estratégia A
- Se <10% → desconto vira mecanismo real de incentivo

**Anti-padrão**: decidir pricing BYO hoje sem dado de elasticidade. Pré-PMF qualquer número é chute. Esperar adoção real.

## Anti-padrões a evitar

| Anti-padrão | Como evitar |
|---|---|
| Implementar agora pré-Marco 2 sem trigger empírico | Esperar trigger (médico pediu, custo > 30% MRR, ou enterprise B2B) |
| Aceitar provider arbitrário "pra ser flexível" | Whitelist rígida — qualquer endpoint custom = surface de ataque |
| Tratar BYO-LLM como "feature de marketing" | É operacional pós-Marco 2, não diferencial de pitch pré-PMF |
| Pular termo de responsabilidade médico | CFM 2.314 explícito — sem termo, médico pode alegar plataforma responsável |
| Replicar VideoProviderRegistry sem adapter por provider | Cada LLM provider tem quirks (function calling format, system prompt, token limits) — adapter por provider |
| Não testar healthcheck antes de ativar | Key inválida em produção = AEC quebra silenciosamente pra esse médico |

## Memórias correlatas

- `feedback_state_pollution_noa_core_reutilizado_19_05` — incidente que motivou a discussão BYO-LLM
- `audit_19_05_subcontagem_custo_painel_v1_9_374` — custo real OpenAI hoje (subconta 90.5% pré-V1.9.238)
- `feedback_dual_write_contract_jsonb_vs_tabela_18_05` — pattern aplicável ao decidir onde gravar config por provider
- `feedback_viabilidade_tecnica_vs_legitimidade_epistemologica_18_05` — princípio "IA não controla workflow"
- `feedback_nao_fingir_autoridade_18_05` — princípio "IA subordinada"
- `feedback_arquitetura_de_confianca_antes_de_feature_delivery_18_05` — containment + governance
- `reference_pricing_model_canonical_18_05` — pricing model atual (precisa adendo eventual)
- `project_3_marcos_minimos_reprecificacao_valuation_18_05` — Marco 1/2/3 que destravam BYO-LLM
- `project_origem_tradevision_core_pedro` — Pirâmide 8 camadas + Antigravity Audit 03/02
- `project_v1_9_311_nft_consent_pattern_16_05` — pattern criptografia + RLS owner-only

## Frase âncora

> *"BYO-LLM é arquiteturalmente viável e tecnicamente trivial (aditivo puro sobre pattern provider-agnostic já existente VideoProviderRegistry + cert-encrypt-password V1.9.177). Mas é otimização prematura pré-Marco 2 — custo OpenAI hoje (~$20-30/mês observado, ~$100-150 real, pago via cartão pessoal Pedro) não justifica complexidade de termos legais + whitelist + healthcheck + adapter por provider. Parquear formalmente com triggers explícitos: médico não-Ricardo pedir / custo > 30% MRR / hospital enterprise / SLA contratual rompido. Manter pattern já existente em mente quando trigger ativar."*

— Cristalizado 19/05/2026 noite após audit empírico completo via PAT + grep + leitura de tradevision-core/cert-encrypt-password/professional_integrations.
