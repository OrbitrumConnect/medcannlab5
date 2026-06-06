# 📘 DIÁRIO 05/06/2026 — UNIFICADO FINAL (documento mestre do dia)

> **O que é isto:** consolidação navegável de TUDO que rodou em 05/06, em 2 máquinas (desktop manhã/tarde + laptop noite + reunião). Os documentos-fonte continuam existindo (nada apagado) — este é o índice-mestre + síntese.
>
> **Fontes consolidadas aqui:**
> - [DIARIO_05_06_2026.md](DIARIO_05_06_2026.md) — 🖥️ desktop (BLOCO A→K)
> - [DIARIO_05_06_2026_PARTE_2_LAPTOP_SANEAMENTO_AUTHZ.md](DIARIO_05_06_2026_PARTE_2_LAPTOP_SANEAMENTO_AUTHZ.md) — 💻 laptop authz
> - [DIARIO_05_06_2026_PARTE_3_POS_JANTAR_VISAO_RICARDO_JOAO.md](DIARIO_05_06_2026_PARTE_3_POS_JANTAR_VISAO_RICARDO_JOAO.md) — 💻 laptop reunião
> - [CHECKLIST_AVANCOS_RISCOS_05_06_POS_REUNIAO.md](CHECKLIST_AVANCOS_RISCOS_05_06_POS_REUNIAO.md) — checklist
> - [AVALIACAO_360_05_06_2026.md](AVALIACAO_360_05_06_2026.md) — auditoria 360°
>
> **HEAD final do dia:** `6a32530` · Locks 8 intocados · zero regressão.

---

## 🌅 Visão do dia (1 parágrafo)

Dia denso em 2 máquinas. **Desktop (manhã/tarde):** fechou o marco de Importação de Base Clínica (wizard + Edge provada e2e + 4 bugs blindados), fez uma **avaliação 360° honesta do sistema inteiro**, e atacou 2 ajustes zero-regressão que **pegaram um bug vivo** (11 médicos invisíveis em 5 telas). **Laptop (noite):** saneamento de autorização (email→UUID) + executou o backlog que a 360° mapeou + **reunião estratégica Pedro+Ricardo+João Vidal** que cravou Marco 1 (CNPJ data 10/06), pricing comercial (R$122×70k) e 2 novas vertentes da Constituição. Fechou com **verificação empírica do grounding da Nôa** (5,5/6 números exatos).

---

## 📋 Tabela mestre de versões/commits do dia

| V | O quê | Máquina | Commit |
|---|---|---|---|
| V1.9.589 | Wizard UI Migração de Base Clínica (Fase 3) | 🖥️ | `ac309dd` |
| V1.9.590 | Índices idempotência PARCIAIS→COMPLETOS (achado piloto) | 🖥️ | `9841672` |
| V1.9.591 | normalizeGender → M/F/Outro | 🖥️ | `cfbc6c9` |
| V1.9.592 | Edge compensa falha parcial (sem órfão) | 🖥️ | `1cd4605` |
| **360°** | Avaliação 360° completa (5 auditorias + 3 PAT) | 🖥️ | `f65cefe` |
| V1.9.593 | Aposenta "Importar CSV" + deleta PatientImportModal órfão | 🖥️ | `3c7ae4e` |
| V1.9.594 | Paciente não enviava exame — RLS (bug Flávia) | 🖥️ | `5635709` |
| V1.9.595 | fhir-export Edge alinhada ao lib (3 fixes V1.9.575) | 🖥️ | `477b7d8` |
| V1.9.596 | Queries bilíngues type EN/PT (bug 11 profs invisíveis) | 🖥️ | `60b68be` |
| V1.9.597 | PII residual Flávia sanitizado | 💻 | `4982306` |
| V1.9.598 | Fecha gap try-catch silencioso Fluxo A cadastro | 💻 | `44d3331` |
| V1.9.599 | Housekeeping pós-pull (drift roles + CLAUDE.md) | 💻 | `3e43305` |
| V1.9.600 | Sync stales CLAUDE.md (PII 0 reais + simulação-default) | 💻 | `84ed0f6` |
| V1.9.601 | email.includes() → UUID singleton officialDoctors | 💻 | `437afcd` |
| V1.9.602 | DIÁRIO PARTE 2 + memória authz UUID | 💻 | `ded5091` |
| V1.9.603 | type EN/PT bilíngue Edge Core (2 spots restantes) | 💻 | `fd2e296` |
| V1.9.604-606 | Consolidado reunião + 10 memórias + Matrix Z2 A/B/C | 💻 | `5c8ac6a` |
| BLOCO K | Sync + verificação grounding Nôa + achado wallets RLS | 🖥️ | `6a32530` |

---

## 🖥️ PARTE I — Desktop (manhã/tarde) — engenharia

### I.1 Import de Base Clínica (marco fechado)
Wizard 6 etapas + Edge `bulk-import-emr` **provada e2e** (prof+pacientes sintéticos, 3 runs, cleanup 0 resíduo). 4 bugs só-e2e blindados: índices parciais quebravam ON CONFLICT (V1.9.590), gender male/female→M/F/Outro (591), falha parcial deixava órfão→compensação (592), idempotência provada contando linhas (não pelo retorno). "Importar CSV" legado aposentado (593, redundante; PatientImportModal órfão deletado). Falta: upload binários 860MB + piloto real (gated CNPJ/DPA).

### I.2 Avaliação 360° (honesta)
🟢 Coração sólido (clínica+auth+RLS 147/147+import). 🟠 Bordas (monetização mock, Ensino/TRL, assinatura parcial, drift role). 🔴 Falta (PaymentGate, TRL, teste-nivelamento fachada). **Metade do roadmap atrás do CNPJ.** Divergências doc corrigidas: 17 Edges (não 14), get_chat_history vive, RLS 147. Anti-overclaim exemplar. Detalhe: [AVALIACAO_360_05_06_2026.md](AVALIACAO_360_05_06_2026.md).

### I.3 Bug Flávia (exame não enviava)
RLS bloqueava INSERT em `patient_documents` — `handleUpload` não setava `uploaded_by_role` que o `WITH CHECK` exige. **100% dos pacientes travados** (os 6 docs eram do Ricardo, workaround). Fix V1.9.594 provado nos 2 sentidos via RLS real (SET ROLE + ROLLBACK).

### I.4 fhir-export drift (V1.9.595)
Edge deployada era cópia desatualizada do lib → faltavam os 3 fixes V1.9.575 (URL absoluta + Consent.policyRule + Bundle.identifier). Portados byte-a-byte. Zero-regressão (isolada/read-only). deploy v2 verify_jwt preservado.

### I.5 Type EN/PT bilíngue (V1.9.596) — BUG VIVO
`users.type` EN+PT misturado. `.eq('type','profissional')` retornava **0** → Ricardo/Eduardo/**11 profs invisíveis** em ChatGlobal/PatientHeaderActions/Scheduling/TeamManagement/PatientChat. Fix: helper bilíngue + 9 queries `.in([EN,PT])`. Aditivo. Prova PAT: profs **0→11**, pacientes **4→37**.

### I.6 Grounding da Nôa verificado (BLOCO K)
Pedro testou chat livre. Cruzei 6 números via PAT: **5,5/6 EXATOS** (users, consultas 30d, biblioteca, transação R$200, eventos 24h). Único nit: "1 carteira" vs 4 — `buildAdminContext` consulta `wallets` sem RLS admin-read → sub-conta (seguro).

---

## 💻 PARTE II — Laptop (noite) — saneamento authz + backlog 360°

Executou o backlog que a 360° mapeou (continuidade limpa entre máquinas):
- **V1.9.601 `officialDoctors.ts`** — substitui `email.includes('ricardo'/'faveret')` por **UUID singleton** (fonte `users.is_official`). **Fechou furo real:** homônimo `joaofaveret@gmail.com` ganhava moderação. Ricardo `2135f0c0` · Eduardo `f4a62265` · Ricardo-admin `99286e6f`.
- **V1.9.603** — as 2 linhas do Core (`tradevision-core` type EN/PT) que o desktop deixou.
- **V1.9.597** — PII residual Flávia sanitizado.
- **V1.9.598** — fecha gap try-catch silencioso no Fluxo A de cadastro (garantia 3 fluxos).
- **V1.9.599-600** — housekeeping + sync stales CLAUDE.md.
Detalhe: [PARTE 2](DIARIO_05_06_2026_PARTE_2_LAPTOP_SANEAMENTO_AUTHZ.md).

---

## 🍽️ PARTE III — Reunião Pedro+Ricardo+João Vidal (estratégia)

**18 avanços cravados.** Destaques:
- **Marco 1 CNPJ = DATA D quarta 10/06** · Pix R$ 350/sócio (R$1400/4) · contador presente.
- **Pricing comercial:** Avaliação + estagiamento DRC 1-2 = **R$ 122 × 70k = R$ 8,54M GMV** âncora Sociedade Nefrologia. Vende **relatório** (não consulta). ⚠️ anti-overclaim: vitrine narrativa, não previsão de receita.
- **3ª vertente Constituição:** segurança do paciente / gestão de risco semântica **pré-doença** (= Matrix Z2 + Sidecar Renal já rodando — convergência confirmada).
- **4ª vertente:** remissão DRC inflamatória (Tangri 2026, Kidney Int — ⚠️ paper NÃO prova cannabis; abre janela conceitual).
- **Mapa farmacológico:** CBG potencializa CBD = anti-inflamatório seguro DRC · THC perigoso · NSAIDs proibidos DRC ≥G3b · 80% DM+HAS = G5.
- **Cidade Amiga dos Rins:** 3 frentes B2B (CARD-RJ Prefeitura / Sociedade Nefrologia / Rio Bonito); página institucional **parqueada esperando CNPJ**.
- **Gap curso Ricardo** (Eduardo tem `CursoEduardoFaveret.tsx`, Ricardo não).
Detalhe: [PARTE 3](DIARIO_05_06_2026_PARTE_3_POS_JANTAR_VISAO_RICARDO_JOAO.md).

---

## 🔴 Riscos consolidados (do checklist)

| Sev | Risco | Status |
|---|---|---|
| 🔴 | **PAT `sbp_91883cd43...` EXPOSTO** no commit 090af13, não rotacionado | ❌ PENDENTE Pedro (revoke dashboard) |
| 🔴 | Overclaim "Tangri prova cannabis" / "R$8.54M receita" | ✅ frases-âncora cravadas |
| 🟡 | Matrix Z2 alucinação se Fase B/C mal feita | slug-test obrigatório |
| 🟡 | Modelo duplo-canal (relatório + comunicação) | validar advogado pós-Marco 1 |
| 🟡 | founder→master ainda por email (Core) | trocar por has_role c/ PAT+smoke |
| 🟢 | wallets RLS sem admin-read (sub-conta stats) | fix aditivo candidato |
Detalhe: [CHECKLIST](CHECKLIST_AVANCOS_RISCOS_05_06_POS_REUNIAO.md).

---

## 🛠️ Backlog consolidado

**Atacável JÁ (sem decisão humana, zero/baixo risco):**
1. Fase A Matrix Z2 — indexar 103 PDFs órfãos (74% corpus Ricardo) + anchor citação UI passiva
2. Documento institucional "Camada Cognitiva CAR Digital" (Matrix Z2+Sidecar+Constituição = segurança paciente)
3. Curadoria cohort 43 reports REAIS pra pitch Sociedade Nefrologia (sanitizado)
4. Padrão visual AlunoDashboard + TeamManagement
5. SGQ REL-IA/REL-SEC → auditor-ready
6. 2ª `clinical_qa_runs` (cadência mínima)
7. wallets RLS admin-read (aditivo)
8. PII residual backfill (precisa Ricardo)

**Bloqueado Marco 1 (CNPJ 10/06):** Stripe+PaymentGate · subscription_plans · reativar CidadeAmigaDosRinsInstitucional (3 botões).
**Bloqueado Marco 2:** cohort pagantes · Fase C Matrix Z2.
**Decisões humanas (~50% roadmap):** CNPJ João · 2º médico · 20-30 pagantes · TRL Eduardo · GO Ricardo (curso/Sidecar precoce/CBG).

---

## 📚 Memórias cristalizadas no dia (15+)

**Desktop:** `project_import_wizard_e2e_piloto_05_06` · `feedback_frontend_insert_precisa_satisfazer_rls_with_check_05_06` · `feedback_type_en_pt_bilingue_code_tolerant_first_05_06` · `feedback_admin_stats_context_precisa_admin_read_rls_05_06`

**Laptop (reunião):** `project_reuniao_pedro_ricardo_joao_05_06_visao_jantar_marco1_pricing` · `project_modelo_pricing_ricardo_122_relatorio_70k_drc_05_06` · `feedback_ricardo_quer_integrar_seguranca_paciente_gestao_risco_05_06` · `project_quarta_feira_com_alunos_formato_escala_ricardo_05_06` · `project_intersecao_renal_cannabis_eduardo_ricardo_4_protocolos_05_06` · `reference_mapa_farmacologico_drc_cannabinoides_anti_inflamatorios_05_06` · `project_remissao_drc_inflamatoria_anchor_pesquisa_05_06` · `project_curso_eduardo_pre_criado_ricardo_pendente_05_06` · `project_matrix_z2_escalonamento_rag_papers_fases_a_b_c_05_06` · `reference_authz_uuid_singleton_substitui_email_includes_05_06` · `feedback_try_catch_3_fluxos_cadastro_paciente_garantia_05_06`

---

## 🚀 Frase âncora do dia (05/06 unificada)

> *"Um dia que foi do bisturi à estratégia: de manhã/tarde o desktop fechou o import (provado e2e), fez uma 360° honesta e tirou bugs vivos que usuários batiam (11 médicos invisíveis, exame da Flávia travado); de noite o laptop saneou a autorização (email→UUID, fechou furo de homônimo), executou o backlog da 360° e trouxe da reunião o que faltava pra virar empresa — Marco 1 com DATA (10/06), pricing com número-âncora (R$122×70k) e 2 novas vertentes da Constituição que o Ricardo descreveu sem saber que descrevia o que já roda. O grounding da Nôa foi verificado empíricamente (5,5/6 exatos) — a IA não inventa número. Locks 8 intocados, zero regressão, anti-overclaim preservado até numa reunião empolgante. O coração está sólido e ficando mais sólido; metade do que falta é decisão humana (CNPJ), não código. Caminho certo."*
