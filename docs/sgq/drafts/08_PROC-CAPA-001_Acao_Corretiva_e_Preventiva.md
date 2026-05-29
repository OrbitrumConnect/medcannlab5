# PROC-CAPA-001 — Ação Corretiva e Preventiva (CAPA)

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §8.5.2 (Ação corretiva) + §8.5.3 (Ação preventiva)

---

## 1. Objetivo

Estabelecer o processo de **identificação, análise causa-raiz, implementação e verificação** de ações corretivas (CA) e preventivas (PA) no SGQ MedCannLab.

## 2. Identificação de oportunidades CAPA

### 2.1. Fontes empíricas validadas

| Fonte | Volume típico | Frequência |
|---|---|---|
| Bug flagrado por Pedro empíricamente via UI | ~5/semana | Contínua |
| Smoke PAT detectando NC em produção | ~2/semana | Contínua |
| Memória `feedback_*` cristalizada | ~3/semana | Contínua |
| Audit retroativo (`clinical_qa_runs`) | 1/quinzena | Cadência mínima |
| Erro flagrado pelo médico sócio (Ricardo) | ~1/semana | Contínua |
| Lessons learned de outras sessões IA | ~1/dia | Contínua |

### 2.2. Princípio fundamental cristalizado

> *"Validação empírica via screenshot > plano teórico"* (memória `feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05`)

Pedro flagrou empíricamente 5 iterações falhadas Card Neuro/Renal antes de cristalizar esse princípio. Aplica-se a TODA refatoração futura.

## 3. Análise causa-raiz

### 3.1. Templates de análise por categoria de NC

#### Categoria A — Bug técnico (TypeScript / SQL / Edge)

Exemplo: V1.9.500-A coluna `clinical_reports.assessment` inexistente.

```
Sintoma: Modal Evolução abre com "column does not exist"
Causa imediata: SELECT incluía coluna inexistente
Causa raiz: Confundi schema de `clinical_rationalities` com `clinical_reports`
Causa sistêmica: Não validei schema empírico antes de SELECT
Lesson learned: SEMPRE rodar PAT smoke schema antes de SELECT em tabela "parecida"
Memória cristalizada: feedback_nao_chutar_uuid_quando_pat_disponivel_29_05
```

#### Categoria B — Drift arquitetural (acúmulo silencioso)

Exemplo: V1.9.452 PII em `clinical_rationalities.assessment` (28 dias backlog).

```
Sintoma: Nome completo de paciente em rows
Causa imediata: Edge tradevision-core não sanitizava antes do INSERT
Causa raiz: Função pseudonymizePatientReferences existia no frontend (V1.9.407) mas não era reusada no backend
Causa sistêmica: Princípio "polir, não inventar" não foi aplicado quando V1.9.407 foi criada
Lesson learned: Mover lógica de sanitização pra camada mais profunda (backend Edge)
Memória cristalizada: project_v1_9_452_pii_sanitize_clinical_rationalities_29_05
```

#### Categoria C — Falha de processo (não-aplicação de princípio existente)

Exemplo: Chutar UUID do Ricardo Valença em vez de validar via PAT.

```
Sintoma: 2 retries FK violation em smoke 20 AECs sintéticas
Causa imediata: UUID literal hardcoded inventado
Causa raiz: Não validei via PAT antes (tinha PAT na mão!)
Causa sistêmica: Recall vs. validação empírica — preguiça pontual
Lesson learned: ANTES de hardcoded UUID/ID em script SQL, validar empíricamente
Memória cristalizada: feedback_nao_chutar_uuid_quando_pat_disponivel_29_05 (Nível 1)
```

## 4. Implementação de ações corretivas (CA)

### 4.1. Fluxo padrão (exemplo V1.9.452)

| Passo | Evidência |
|---|---|
| 1. Documentar NC no diário | DIARIO_29_05_2026 Bloco K |
| 2. Análise causa-raiz | Memória `project_v1_9_452_*` |
| 3. Design de fix (reusando existente) | Helper `sanitizeRationalityPII` polish de `casePseudonymization.ts` |
| 4. Implementação | Edge `tradevision-core` v423 |
| 5. Backfill histórico | 132 rows via PL/pgSQL |
| 6. Smoke validação | Bug detectado "Pedro Paciente" → fix v2 |
| 7. Telemetria | `metadata.pii_sanitized=true` |
| 8. Cristalização | Lock V1.9.452 + memória Nível 1 |
| 9. Atualização CLAUDE.md | Pendência marcada como ✅ RESOLVIDA |

### 4.2. Critério de "fechamento" de CA

- [ ] Causa-raiz documentada em memória
- [ ] Fix implementado + commit + push 4 refs
- [ ] Smoke empírico PASS
- [ ] Backfill histórico se aplicável
- [ ] Telemetria evidencia comportamento esperado
- [ ] Memória persistente cristalizada (Nível 1 se princípio meta)
- [ ] CLAUDE.md atualizado

## 5. Implementação de ações preventivas (PA)

### 5.1. PA implementadas (exemplos)

| PA | Origem | Mecanismo |
|---|---|---|
| Type-check pré-commit obrigatório | NC histórica de bugs sintáticos | Hook git pre-commit (lint-staged) |
| RLS 100% nas 144 tabelas | NC histórica de vazamento | Migration + audit periódico |
| Backup WAL-G + diário | NC potencial de perda | Supabase Pro plan |
| Helper sanitize aplicado no INSERT | V1.9.452 (CA) | Edge tradevision-core v423 |
| Push 4 refs obrigatório | Risco de dessincronia entre remotes | Política operacional |
| Smoke PAT antes de declarar feature pronta | Validação empírica cristalizada | Princípio "polir, não inventar" |

### 5.2. PA prioritárias pendentes

| PA | Plano | Prazo |
|---|---|---|
| `clinical_qa_runs` cadência mínima 2/mês | Programar 14/06/2026 (quinzenal) | Próximo ciclo |
| Auditoria SGQ por consultora externa | Pós-CNPJ | Semana 1-2/06/2026 |
| Validação RT habilitado | Pós-CNPJ + contratação | Semana 2-4/06/2026 |
| Smoke ITI trimestral em PDFs ICP-Brasil | Calendar reminder | Cada trimestre |

## 6. Verificação de eficácia das ações

### 6.1. Métodos de verificação

1. **Smoke empírico** (PAT + UI + log) imediatamente após CA
2. **Telemetria contínua** (`ai_chat_interactions.metadata`, `cognitive_events`)
3. **Audit periódica** via `clinical_qa_runs`
4. **Memória persistente** documentando lessons learned

### 6.2. Indicadores de eficácia

| Indicador | Valor target | Valor atual |
|---|---|---|
| Recorrência de NC dentro de 30 dias | <5% | 0% (V1.9.452 nunca recorreu) |
| Tempo médio detecção → fix | <48h | <24h (média últimos 30d) |
| % memórias cristalizadas com fix completo | 100% | ~95% (5/5 NCs grandes 30d) |
| Smoke empírico aprovado pós-CA | 100% | 100% |

## 7. Catálogo de ações corretivas realizadas (último mês)

| Data | NC | CA | Versão | Verificação |
|---|---|---|---|---|
| 28/04 | chat-images bucket público | RLS Opção B (4 policies + signed URLs) | V1.9.98 | Empírico |
| 16/05 | DOC_LIST hijacking | Reverter para `base_conhecimento` curado | V1.9.318 | 6 casos antes vs 1 depois |
| 25/05 | PII em `assessment` | Sanitize + backfill 132 rows | V1.9.452 | Smoke "Pedro Paciente" |
| 26/05 | Edge `sign-pdf-icp` sem auth | Auth + ownership check | V1.9.457 | SMOKE 1+2 (401 esperado) |
| 29/05 | Coluna `assessment` inexistente | Hotfix EvolutionDetailModal | V1.9.500-A | Type-check + UI |

## 8. Ações preventivas em andamento

### 8.1. PA sistêmicas

- **Cadência `clinical_qa_runs`** programada quinzenal (próxima: 14/06/2026)
- **Sprint A irreversíveis** (PATs + verify_jwt) — pendente decisão sobre callers
- **SGQ formal documental** (este conjunto de drafts) — pré-consultora

### 8.2. PA arquiteturais

- **Validação de callers Edge** antes de qualquer flip de verify_jwt
- **Verificação automática** de schema antes de SELECT em script SQL (via PAT)
- **Princípio cristalizado**: validação empírica via screenshot > plano teórico

## 9. Registro de Conhecimento (lessons learned)

Diretório `memory/` mantém **284 memórias cristalizadas** classificadas:

- **feedback_** — princípios e correções (~80 arquivos)
- **project_** — informações operacionais (~120 arquivos)
- **reference_** — pointers externos (~40 arquivos)
- **user_** — perfil stakeholders (~20 arquivos)

Princípio cristalizado: **NÃO duplicar memórias**. Update preferível a criar nova.

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
