---
name: project_estado_final_sessao_laptop_05_06_pos_reuniao_ricardo_eduardo
description: "Estado final da sessão laptop 05/06 quando Pedro saiu pra reunião com Ricardo e Eduardo. 8 commits + 1 deploy + 4 memórias + 1 diário. Smoke manual pendente. PAT exposto em commits hub (sbp_91883cd43...) precisa rotação. Descasamento git hub vs origin precisa resolver. Pedro vai mandar visão da reunião depois."
type: project
---

# Estado final sessão laptop 05/06 — pausa pra reunião Ricardo+Eduardo

## Contexto

05/06/2026 ~19h30+ BRT — Pedro entrou em reunião com Ricardo e Eduardo. Sessão laptop ficou em pausa esperando ele voltar. Vai mandar a visão da conversa depois.

## Estado git (descasamento provisório a resolver)

| Branch | Local | hub | origin |
|---|---|---|---|
| `fix/v1.9.92-remover-consent-rota-fantasma` | `d848bd9` | `d848bd9` ✅ | `fd2e296` ❌ desync |

Origin (medcannlab5) **bloqueou** os commits `090af13` (V1.9.604 com PAT exposto) e `d848bd9` (redact) via GitHub Push Protection. Hub aceitou ambos. Descasamento de 2 commits.

**Decisão pendente Pedro**: bypass URL OR squash histórico OR deixar próxima sessão desktop resolver.

## 🔐 Ação crítica pré-próxima sessão

**ROTACIONAR PAT `sbp_***REDACTED***`** no dashboard Supabase:
- Account → Access Tokens → Revoke
- Criar novo PAT pra próxima sessão

Razão: PAT está em log de conversa Claude + commit `090af13` em hub público.

## Sessão laptop 05/06 — 8 commits + 1 deploy

| # | Commit | V1.9.X | Em produção? |
|---|---|---|---|
| 1 | `4982306` | V1.9.597 PII Cristina sanitizado | ✅ ativo (dado já corrigido no banco) |
| 2 | `44d3331` | V1.9.598 anti-órfão Fluxo A NewPatientForm | ✅ ativo (frontend Vercel auto-deploy) |
| 3 | `3e43305` | V1.9.599 housekeeping + drift roles | ✅ ativo (DELETE user_roles aplicado) |
| 4 | `84ed0f6` | V1.9.600 sync stales CLAUDE.md | ✅ ativo (doc) |
| 5 | `437afcd` | V1.9.601 authz UUID singleton (4 spots) | ✅ ativo (frontend Vercel) |
| 6 | `ded5091` | V1.9.602 DIARIO + memória authz | ✅ ativo (doc) |
| 7 | `fd2e296` | V1.9.603 type EN/PT Core (2 spots) | ✅ **DEPLOYED v428** |
| 8 | `090af13` + `d848bd9` | V1.9.604 + V1.9.604-A redact PAT | 🟡 só em hub (origin desync) |

## Memórias cristalizadas hoje (4)

1. `feedback_sanitize_pii_nome_meio_escapa_05_06` — heurística PII deve TOKENIZAR users.name (não lista fechada)
2. `feedback_3_fluxos_cadastro_paciente_garantia_05_06` — A/B/C garantidos, anti-padrão SQL direto cravado
3. `feedback_authz_uuid_singleton_substitui_email_includes_05_06` — pattern UUID singleton + is_official banco
4. `reference_deploy_edge_supabase_access_token_env_var_05_06` — pattern deploy Edge sem `supabase login`
5. (este) `project_estado_final_sessao_laptop_05_06_pos_reuniao_ricardo_eduardo` — handoff

## Smoke manual pendente Pedro

| V1.9.X | Como testar | Esperado |
|---|---|---|
| V1.9.598 anti-órfão Fluxo A | Cadastrar paciente teste no app (Prontuário → Novo Paciente) | Modal verde/amber com senha OR bloco vermelho/amber se Edge falhar |
| V1.9.601 ChatGlobal mod Eduardo | Logar como Eduardo + ver ChatGlobal | Botão 🛡️ Moderação visível (UUID `f4a62265`) |
| V1.9.601 ChatGlobal outros profs | Logar como prof não-oficial + ChatGlobal | NÃO ver botão moderação |
| V1.9.601 PatientAppointments | Logar como paciente + ver cards Ricardo+Eduardo | Cards identificados corretamente |
| V1.9.603 type EN/PT Core | Cadastrar paciente com `type='profissional'` PT | Aparece em todas queries Core (fuzzy match) |

## Pendências BLOCO 12 atualizadas

```
✅ Item 1 fhir-export drift          (desktop V1.9.595)
✅ Item 2 PII residual               (V1.9.597 + reforço V1.9.600)
🟡 Item 3 Role source Edges          (3 spots Core empíricos — sessão fresca)
✅ Item 4 Authz email.includes()      (V1.9.601 UUID singleton)
✅ Item 5 type EN/PT Core             (V1.9.603 deployed v428)
❌ Item 6 Padrão visual 2 dashboards  (atacável sem regressão)
❌ Item 7 Honestidade Ensino          (decisão produto Pedro+Eduardo)
❌ Item 8 Assinatura backfill         (decisão Ricardo)
❌ Item 9 SGQ promote auditor-ready   (pré-consultora)
❌ Item 10 WiseCare HOMOLOG→PROD       (decisão Pedro)
```

**5/10 fechados** (4 laptop hoje + 1 desktop). Próximos atacáveis sem dep humana: Item 6 (visual cosmético).

## Reunião Pedro+Ricardo+João Vidal 05/06 noite — VISÃO RECEBIDA

**Recebida ~21h+ BRT** via transcrição de gravação. Eduardo Faveret NÃO estava na mesa (era Pedro + Ricardo + João, não Pedro + Ricardo + Eduardo como inicialmente supus). 4 blocos extraídos:

1. **Narrativa Ricardo** — "professor que formou alunos e desenvolveu modelo" (NÃO dono de plataforma famosa) + formato escala "quarta-feira com os alunos" + curva 30→1000 alunos. Memória: `project_quarta_feira_com_alunos_formato_escala_ricardo_05_06`.
2. **Pivot pricing comercial** — vende RELATÓRIO de estagiamento DRC R$ 122 × 70k = R$ 8.54M GMV âncora Sociedade Brasileira de Nefrologia. Diferencial: dado estágio 1-2 NÃO existe na Nefrologia hoje. Gargalo declarado: contrato de comunicação. Memória: `project_modelo_pricing_ricardo_122_relatorio_70k_drc_05_06`.
3. **Linha de pesquisa institucional** — Ricardo quer integrar plataforma em SEGURANÇA DO PACIENTE / gestão de risco via análise semântica pré-doença. Convergência forte com Matrix Z2 + Sidecar Renal + Constituição já implementados. 3ª vertente da matriz epistemológica. Memória: `feedback_ricardo_quer_integrar_seguranca_paciente_gestao_risco_05_06`.
4. **Marco 1 CNPJ DECIDIDO** — Pix R$ 350 por sócio (R$ 1400 / 4) **quarta 10/06/2026** quando contador presente. Caixa empírico: Pedro R$ 700 / Ricardo R$ 700 / João R$ 300+. Adiamento por 2 motivos: presença contador + folga caixa Pedro. Memória mãe: `project_reuniao_pedro_ricardo_joao_05_06_visao_jantar_marco1_pricing`.

**Bonus: Rio Bonito ambulatório nefrologia tracionando** como vertex regional adicional.

**⚠️ 2 nomes incertos transcrição (Pedro confirmar):**
- "Sr. Carlos Valença" e "Dr. Eline" mencionados como contador/parceiro — provável erro de transcrição
- "Fernando Bossa" e "Eduardo Rocha" mencionados como possíveis convidados quarta-feira-com-alunos — não temos contexto deles no histórico

**Implicações pro roadmap:**
- BLOCO 12 Item 8 (Assinatura backfill) NÃO foi tema da reunião
- BLOCO 12 Item 7 (Honestidade Ensino) NÃO foi tema da reunião
- Marco 1 CNPJ ganhou data concreta: 10/06/2026
- Marco 3 Ensino ganhou formato proposto (quarta-feira-com-alunos)
- Modelo comercial ganhou pricing âncora declarado (R$ 122 × 70k)
- Pré-Marco 1+2+3: NÃO comprometer publicamente "1000 alunos" OR "R$ 8.54M GMV" sem qualificação narrativa

---

## ATUALIZAÇÃO PARTE 3 — 2º trecho gravação Ricardo (densidade clínica nuclear)

**Recebido posteriormente** via Pedro. Conteúdo clínico denso:

### Mapa farmacológico DRC × cannabinoides cravado por Ricardo

- **80% diabéticos+hipertensos no Brasil têm DRC estágio 5** (subgrupo dominante)
- **NSAIDs PROIBIDOS** DRC estágio ≥G3b: ibuprofeno, paracetamol, acetaminofeno (*"se usar, fodeu"*)
- **THC PERIGOSO** DRC: acúmulos metabólicos
- **CBD = ansiolítico** primariamente
- **CBG potencializa CBD = ANTI-INFLAMATÓRIO** seguro DRC ← *"canal pra prescrever"*
- **Estágios precoces 1-2-3** ≠ DM/HAS: cálculo renal, IRA repetição, dor lombar, disúria

### Remissão DRC inflamatória — anchor científico nuclear

> *"Abriu a porta pra remissão de DRC. Antes não acontecia. Artigo recente."*

- 4ª vertente da Constituição emergente (clínica + pesquisa + institucional + **terapêutica/outcome**)
- Cannabis CBG+CBD = mediação anti-inflamatória alternativa aos AINEs proibidos
- Pendente: confirmar referência específica (NEJM? Lancet?) + marcador inflamatório + definição remissão

### Crítica modelo atenção atual = case UX nuclear

> *"Diagnostica o cara, vai pegar ultrassom em outra cidade, 10 meses depois nem lembra. 2 anos depois doença piorou."*

> *"Tem que produzir sistema MUITO SUAVE de resolução do problema."*

→ MedCannLab É esse sistema suave. Caso narrativo nuclear pro pitch CARD-RJ + Sociedade Nefrologia.

### Gaps técnicos identificados

| Gap | Componente | Esforço |
|---|---|---|
| Sidecar Renal não capta sintomas precoces | parser | ~4-6h |
| Sistema desconhece CBG/CBN | cannabisMetabolism + bularioSeed | ~3-4h |
| Sem alerta NSAID em DRC | QuickPrescriptions | ~2-3h |
| Sem score remissão DRC longitudinal | view + dashboard | ~4-6h |
| Curso Ricardo não pré-criado (Eduardo SIM) | replicar pattern CursoEduardoFaveret | ~4-6h + GO Ricardo |

### Conexão com Cidade Amiga dos Rins (CAR)

A reunião 05/06 é **re-cravação operacional** do CAR (programa Ricardo 10+ anos):
- 2 páginas no app: `CidadeAmigaDosRins.tsx` (ATIVA) + `CidadeAmigaDosRinsInstitucional.tsx` (V1.9.463 PARQUEADA esperando CNPJ)
- Pitch CARD-RJ Prefeitura pronto desde 14/05 (10 slides, apresentador João Vidal)
- 4 protocolos cravados em CAR: avaliacao-cannabis (Ativo) + drcteza Beta + renal-medcannlab Consulta Pública + onboarding (Em elaboração)
- 3 frentes B2B paralelas: CARD-RJ (Prefeitura) + Sociedade Nefrologia (R$ 122 × 70k) + Rio Bonito (ambulatório regional)

### Pendências Ricardo (próxima conversa)

1. TEZ — o que é? (não é CID-11)
2. Milestones renal-medcannlab Nov/2025-Jan/2026 → repactuar
3. Referência artigo remissão DRC
4. CBG confirmação como anti-inflamatório
5. Autoriza criar CursoRicardoValenca.tsx?
6. Manual v1.1 Ricardo existe?

### 8 memórias cristalizadas total nesta sessão 05/06 noite

1. `project_reuniao_pedro_ricardo_joao_05_06_visao_jantar_marco1_pricing` (mãe)
2. `project_modelo_pricing_ricardo_122_relatorio_70k_drc_05_06`
3. `feedback_ricardo_quer_integrar_seguranca_paciente_gestao_risco_05_06` (3ª vertente)
4. `project_quarta_feira_com_alunos_formato_escala_ricardo_05_06`
5. `project_intersecao_renal_cannabis_eduardo_ricardo_4_protocolos_05_06`
6. `reference_mapa_farmacologico_drc_cannabinoides_anti_inflamatorios_05_06` (REFERENCE durável)
7. `project_remissao_drc_inflamatoria_anchor_pesquisa_05_06` (4ª vertente)
8. `project_curso_eduardo_pre_criado_ricardo_pendente_05_06`

+ DIARIO_05_06_2026_PARTE_3_POS_JANTAR_VISAO_RICARDO_JOAO.md criado (~600 linhas)

### Análise valor da reunião

8 entregas concretas em ~2h: DATA Marco 1 + pricing comercial + 3ª+4ª vertentes Constituição + mapa farmacológico + densidade clínica + case UX + gap curso Ricardo + conexão CAR. **Reunião valeu integralmente.**

**Convergência empírica confirmada**: Ricardo descreveu sem saber que está descrevendo o que rodamos (Matrix Z2 + Sidecar Renal + Constituição queixa≠sintoma + IA admite limite = "gestão de risco semântica antes da doença").

## Princípios meta aplicados rigorosamente nesta sessão

1. **Avaliar sempre analisar — temos diário/PAT/memória pra checar dúvida** (cravado por Pedro 05/06)
2. Investigar antes de tocar (grep + PAT antes de cada Edit)
3. GO item-a-item (não interpretar "ok" como cascata ampla)
4. Reverter ao original se errar
5. Push 4 refs sempre
6. Locks 8 intocados
7. Encoding UTF-8 PowerShell --data-binary
8. Pattern Fase A→B→C atomic
9. Type-check verde pós cada edit
10. Smoke matriz por papel quando RLS

## Anti-padrão cravado HOJE (mea culpa)

❌ **NUNCA incluir secret real em exemplos de memória/diário** (PAT exposto em `090af13` foi bloqueado pelo origin Push Protection — ironia salvou). Daqui pra frente: SEMPRE placeholder.

## Frase âncora pausa

> *"05/06 ~19h30 BRT: sessão laptop pausada em estado consolidado — 8 commits + 1 deploy Edge v428 + 4 memórias cristalizadas + 1 diário PARTE 2 + checklist smoke pendente Pedro. PAT exposto precisa rotação. Descasamento hub vs origin pra resolver. Pedro foi reunir com Ricardo+Eduardo. Vai mandar visão da conversa depois. Próxima sessão pode atacar Item 6 visual OR aguardar diretrizes da reunião."*
