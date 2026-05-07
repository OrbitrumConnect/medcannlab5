# 🔧 Rascunho A.1 — PR-ready (NÃO COMMITAR antes de aprovação)

**Versão:** A.1 (cristalização paragrafo institucional V16 no system prompt)
**Status:** RASCUNHO PRONTO PRA REVISÃO — 07/05/2026 ~15h BRT
**Autor:** Pedro + Claude Opus (auditoria empírica BLOCO B)
**Aprovação requerida ANTES de commit:**
- [ ] Ricardo aprova V16 (texto institucional) via [PARA_RICARDO_V16_APROVAR.md](PARA_RICARDO_V16_APROVAR.md)
- [ ] Pedro aprova arquitetura cirúrgica
- [ ] Pedro escolhe janela de deploy noturno

---

## 🎯 Objetivo

Cristalizar o paragrafo institucional V16 (autoria Ricardo, ~600 palavras) no system prompt da Edge `tradevision-core` em **modo institucional/orientação APENAS** — preservando AEC ativa byte-por-byte.

**Princípio:** P3 polir, não inventar. Reusar `isAecActive` (linha 2602, em uso há 6 meses). Adicionar 1 condicional na linha 4539. Zero LOC removidas. AEC blindada por construção arquitetural.

---

## 📁 Arquivo afetado

```
ÚNICO ARQUIVO: supabase/functions/tradevision-core/index.ts
```

Sem migrations. Sem novas tabelas. Sem novas Edge functions. Sem mudança em RPC. Sem mudança em frontend.

---

## 🔧 MUDANÇA 1 — Adicionar constante INSTITUTIONAL_PARAGRAPH_V16

**Local:** Após linha 50 (depois do `EMPTY_SCORES`, antes da próxima interface).

**Adicionar +85 LOC novas:**

```typescript
// ============================================================================
// [V1.9.x] CONSTITUIÇÃO INSTITUCIONAL V16 — paragrafo cristalizado
// ----------------------------------------------------------------------------
// Versão:        v16 (corrige v15 de "4 fases" → "3 atos macro")
// Aprovação:     Dr. Ricardo Valença via WhatsApp ___ BRT __/05/2026
//                (referência da mensagem: ___________________________)
// Anti-kevlar §1: confirmado por Pedro+Ricardo em sessão 07/05/2026
// 
// Injeção: APENAS quando isAecActive = false (linha 2602)
// (nunca durante fase AEC ativa — preserva Verbatim First V1.9.86 + PHASE LOCKs)
// 
// Smoke obrigatório pós-deploy:
//   diff baseline_aec_prompt.txt new_aec_prompt.txt → DEVE SER 0 BYTES
// 
// Atualizar v17 quando: Ricardo aprovar nova versão via documento Magno.
// NÃO EDITAR sem nova aprovação humana explícita.
// ============================================================================

const INSTITUTIONAL_PARAGRAPH_V16 = `

═══════════════════════════════════════════════════════════════════════════
CONTEXTO INSTITUCIONAL EXPANDIDO (modo livre / orientação / institucional)
═══════════════════════════════════════════════════════════════════════════

MedCannLab é uma Infraestrutura Cognitiva Clínica orientada pela Escuta, fundada na Arte da Entrevista Clínica (AEC — Avaliação Clínica Estruturada) — método integralmente autoral do Dr. Ricardo Valença, construído sobre o princípio de que toda fala do paciente é dado clínico relevante.

O método se materializa em 3 ATOS FUNDAMENTAIS:
  1. Abertura Exponencial — a escuta se inicia, queixas em lista indiciária
  2. Desenvolvimento Indiciário — cada questão aprofundada por perguntas cercadoras  
  3. Fechamento Consensual — síntese clínica construída e validada com o paciente

Operando sob o motor IMRE (Incentivator Minimal of Exponential — lógica de perguntas exponenciais), em fluxo determinístico estruturado e 28 blocos modulares (preservando 37 blocos legacy).

ARQUITETURA: TradeVision Core — núcleo originado em plataforma anterior do CTO Pedro Henrique Passos Galluf e amplamente desenvolvido no MedCannLab — codifica a metodologia em infraestrutura cognitiva auditável: FSM determinístico (19 fases), Verbatim First (V1.9.86, ~46% bypass GPT em hard-lock), AEC Gate, Pipeline Orchestrator, COS Kernel.

PIRÂMIDE DE GOVERNANÇA (8 camadas):
  Constituição §1 → COS Kernel v5.0 → AEC FSM → Verbatim First → 
  AEC Gate → GPT → Pós-processamento → Pipeline Orchestrator
  
"GPT é o último a falar e o primeiro a ser checado."

COMPLIANCE EM PRODUÇÃO:
  • Assinatura digital ICP-Brasil real (PKCS#7 RFC 3852, dual-mode v60+)
  • Trigger CFM 2.314/2022 imutabilidade pós-assinatura ATIVO
  • Clinical Team Command Center (presence realtime)
  • Dual provider videoconsulta (WiseCare V4H + WebRTC P2P fallback)
  • pg_cron lembretes 5min (5 janelas: 24h/1h/30min/10min/1min, Resend prod)
  • 5394 logs operacionais auditáveis
  • 98 relatórios clínicos com signed_hash

INICIATIVAS CLÍNICAS ATIVAS:
  • Cidade Amiga dos Rins (DRC / nefrologia preventiva — Dr. Ricardo Valença)
  • Programa de Cuidado Renal (renal_exams + 3 views diagnósticas + score DRC)
  • Formação clínica como pilar (cursos AEC R$299,90 / IMRE R$199,90 / 
    Cannabis R$2.999,90, Simulador 20 personas)

INSTRUÇÃO DE USO:
- Ao falar sobre o sistema, cite estes elementos com naturalidade
- Use vocabulário canônico: "escuta simbólica", "lista indiciária", 
  "fechamento consensual", "perguntas cercadoras", "IMRE"
- NÃO mencione fine-tuning ou "memória vetorial" 
  (cadência emerge da arquitetura, não do modelo)
- Adapte densidade ao interlocutor:
    paciente leigo → linguagem acessível
    profissional/admin/aluno → vocabulário técnico
- MedCannLab não substitui o método clínico — operacionaliza, preserva e
  escala o método em condições auditáveis.

Method-first, architecture-grounded, AI-last.
═══════════════════════════════════════════════════════════════════════════
`;
```

---

## 🔧 MUDANÇA 2 — UMA LINHA modificada (4539)

**Local:** Linha 4539 atual.

**ANTES:**

```typescript
        const systemPrompt = isTeachingMode ? TEACHING_PROMPT : CLINICAL_PROMPT;
```

**DEPOIS:**

```typescript
        const systemPrompt = isTeachingMode 
            ? TEACHING_PROMPT 
            : (isAecActive
                ? CLINICAL_PROMPT                                // AEC ativa: byte-by-byte intocado
                : CLINICAL_PROMPT + INSTITUTIONAL_PARAGRAPH_V16); // chat livre: paragrafo cristalizado
```

**Pré-condição já garantida sem código novo:**

```typescript
// Linha 2602 (existe há ~6 meses sem bug):
const isAecActive = !!assessmentPhase 
    && assessmentPhase !== 'COMPLETED' 
    && assessmentPhase !== 'INTERRUPTED';
```

---

## 📊 Resumo do impacto

```
LINHAS:
  +85 adicionadas  (constante INSTITUTIONAL_PARAGRAPH_V16 + comentário)
  ~3-5 modificadas (linha 4539 expandida em condicional)
   0  removidas
   0  funções alteradas
   0  variáveis renomeadas
   0  imports novos
   0  migrations
   0  tabelas novas
   0  Edge functions novas
   0  RPCs novas
   0  RLS modificadas

TOTAL: ~88 LOC líquidas adicionadas em 1 arquivo
```

---

## 🧪 Smoke binário falsificável (matemático, não subjetivo)

### Pré-deploy: capturar baseline

```bash
# Capturar systemPrompt em chamada AEC ativa de teste
# (via Edge logs ou query direta noa_logs em fase IDENTIFICATION)

# Salvar em: /tmp/baseline_aec_prompt.txt
```

### Pós-deploy: validar AEC intocada

```bash
# Repetir mesma chamada AEC ativa
# Salvar systemPrompt em: /tmp/new_aec_prompt.txt

# CRITÉRIO OBJETIVO:
diff /tmp/baseline_aec_prompt.txt /tmp/new_aec_prompt.txt

# RESULTADO ESPERADO: 0 bytes diferentes
# SE diff = 0 → AEC empíricamente intocada → continuar
# SE diff ≠ 0 → REGRESSÃO detectada → ROLLBACK imediato
```

### Validação adicional (chat livre):

```bash
# Chamar com user em chat livre (sem AEC ativa)
# systemPrompt DEVE conter "INSTITUCIONAL EXPANDIDO" no final
# Se não: paragrafo não está sendo injetado → bug
```

---

## 🚀 Sequência de deploy (ESTRATÉGIA DE EXECUÇÃO)

```
FASE 0 — Aprovação humana (PRÉ-CÓDIGO)
  [ ] Ricardo lê PARA_RICARDO_V16_APROVAR.md e aprova explicitamente
  [ ] Pedro confirma janela de deploy noturno (ninguém ativo no app)
  [ ] Pedro confirma arquitetura cirúrgica (este documento)

FASE 1 — Preparação (~30 min)
  [ ] Capturar baseline systemPrompt em fase AEC ativa
  [ ] Salvar /tmp/baseline_aec_prompt.txt
  [ ] Confirmar: 0 usuários online no app (PAT query)
  [ ] Confirmar: 0 AECs em curso

FASE 2 — Implementação local (~30 min)
  [ ] Editar supabase/functions/tradevision-core/index.ts
  [ ] Adicionar INSTITUTIONAL_PARAGRAPH_V16 (linhas ~50-135 — 85 LOC)
  [ ] Modificar linha 4539 (condicional isAecActive)
  [ ] npm run type-check (deve passar com 0 erros novos)
  [ ] git diff cuidadoso

FASE 3 — Deploy Edge (~5-10 min)
  npx supabase functions deploy tradevision-core \
      --project-ref itdjkfubfzmvmuxxjoae --no-verify-jwt

FASE 4 — Smoke binário (~10 min)
  [ ] Repetir chamada AEC ativa de teste
  [ ] Salvar /tmp/new_aec_prompt.txt
  [ ] diff baseline new
  [ ] SE = 0 → continuar / SE ≠ 0 → ROLLBACK

FASE 5 — Smoke chat livre (~10 min)
  [ ] Chamada teste em chat livre (perguntar "o que é MedCannLab?")
  [ ] Validar resposta cita Anamnese Triaxial 3 atos / IMRE / Cidade Amiga
  [ ] Se resposta ainda genérica: bug de injeção, investigar

FASE 6 — Commit + push 4 refs
  git add supabase/functions/tradevision-core/index.ts
  git commit -m "feat(institutional): V1.9.x — cristaliza paragrafo V16 (3 atos) no system prompt
                  
                  Caminho A.1 deployado após aprovação Ricardo.
                  Anti-kevlar §1 cumprido. Lock V1.9.95+97+98+99-B intocado.
                  AEC byte-by-byte preservada (smoke binário diff = 0 bytes)."
  
  git push amigo HEAD:main
  git push amigo HEAD:master
  git push medcannlab5 HEAD:main
  git push medcannlab5 HEAD:master

FASE 7 — Observação 5 dias (sem novo código)
  [ ] Telemetria shouldInject log monitorada diariamente
  [ ] Coletar logs de chat livre Ricardo (vocabulário cita V16?)
  [ ] Lista de "perguntas que Nôa parafraseou" → input pra A.2 RICL futura
```

---

## 🔄 Rollback plan (se smoke ≠ 0 ou bug detectado)

```bash
# Tempo total: ~5 minutos

git revert <commit-hash>
git push amigo HEAD:main
git push amigo HEAD:master
git push medcannlab5 HEAD:main
git push medcannlab5 HEAD:master

npx supabase functions deploy tradevision-core \
    --project-ref itdjkfubfzmvmuxxjoae --no-verify-jwt

# Validar rollback:
#   Capturar systemPrompt em fase AEC
#   diff vs baseline = 0 bytes
```

**Sem perda de dados.** Sem migrations a reverter. Apenas Edge function volta.

---

## ⚠️ Riscos mapeados (BLOCO B do diário 07/05)

```
🟢 BAIXO em volume atual (~26 chamadas/dia)
🟡 Token cost +5-15% em chamadas institucionais (~$5-10/mês — irrelevante)
🟡 Latency +200ms em chamadas institucionais (aceitável fora de AEC)
🔴 Vazamento semântico em fase AEC ativa (mitigado por condicional)
🔴 Anti-kevlar §1 sem aprovação Ricardo (BLOQUEADO até OK)
```

---

## 🎯 Critérios objetivos pra detectar regressão

```
ABORTA deploy / ROLLBACK imediato se:
  • diff baseline new ≠ 0 bytes em fase AEC ativa
  • Resposta a paciente em fase AEC contém "Anamnese Triaxial" ou 
    "Verbatim First" ou "IMRE" ou "8 camadas" ou "RICL"
  • Latency p95 > 2000ms (baseline ~800-1500ms, +500ms tolerável)
  • Telemetria shouldInject log: phase != null && injected = true
    (vazamento semântico detectado em prod)

SINAL DE ALERTA (monitorar 24h):
  • Resposta institucional > 400 palavras (densidade excessiva)
  • Paciente comum recebendo vocabulário denso
```

---

## 📦 Janela de observação pós-deploy

```
A.1 ESTÁVEL = TODOS verdes:
  ✓ 5+ conversas institucionais reais sem regressão
  ✓ 3+ AECs completas end-to-end (Verbatim por turno = baseline binário)
  ✓ Mínimo 72h em prod sem rollback
  ✓ Ricardo confirma Nôa cita vocabulário canônico V16
  ✓ Telemetria shouldInject p99 limpo (zero vazamento detectado)

→ Se TODOS verdes: A.2 (RICL) liberada pra deploy
→ Se 1+ falha: recalibrar A.1 antes de A.2
```

---

## 🔗 Links pra contexto

- [PARA_RICARDO_V16_APROVAR.md](PARA_RICARDO_V16_APROVAR.md) — texto V16 isolado pra Ricardo
- DIARIO_07_05_2026.md BLOCO A (auditoria narrativa)
- DIARIO_07_05_2026.md BLOCO B (evidência empírica + arquitetura cirúrgica)
- Memória `project_constituicao_ja_existe_07_05.md` (descoberta drift)
- Memória `project_paragrafo_institucional_v16_07_05.md` (V16 técnico)

---

## ✅ Checklist final pré-commit (NÃO commitar antes)

```
PRÉ-CÓDIGO (governance):
[ ] 1. Ricardo leu PARA_RICARDO_V16_APROVAR.md
[ ] 2. Ricardo aprovou explicitamente via WhatsApp / texto registrado
[ ] 3. Pedro registrou aprovação em commit message ou diário
[ ] 4. Pedro escolheu janela noturna (sem usuários ativos)

PRÉ-DEPLOY (técnico):
[ ] 5. Baseline systemPrompt AEC ativa capturada (/tmp/baseline_*)
[ ] 6. Type-check passou
[ ] 7. PAT (smoke) confirma 0 usuários online
[ ] 8. PAT confirma 0 AECs em curso

PÓS-DEPLOY (validação):
[ ] 9. Smoke binário diff = 0 bytes
[ ] 10. Smoke chat livre cita V16
[ ] 11. Telemetria shouldInject p99 limpo
[ ] 12. Push 4 refs concluído
[ ] 13. Diário atualizado (BLOCO C ou novo)
```

---

## 🤝 Em uma frase

**Tudo pronto pra Pedro+Ricardo revisarem palavra-por-palavra. Zero código tocado. Quando os 4 pré-código forem ✅, basta seguir FASES 1-7. Tempo total trabalho concentrado: ~1.5h (em janela noturna). Rollback ~5 min. Lock CORE preservado por construção. Anti-regressão sagrada inviolada.**

---

*Rascunho preparado por Claude Opus em sessão 07/05/2026 ~15h BRT, baseado em auditoria empírica BLOCO A+B do diário e descobertas de governança documentadas em memórias persistentes.*
