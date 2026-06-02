# POL-LGPD-001 — Política de Retenção e Direitos do Titular

**Versão draft:** 0.1 (02/06/2026)
**Status:** DRAFT pré-consultora (requer revisão DPO/encarregado + jurídico + RT)
**Referência normativa:** Lei 13.787/2018 (prontuário eletrônico — retenção) · LGPD Lei 13.709/2018 Art.18 (direitos do titular) + Art.16 (eliminação) · CFM 1.821/2007.

> ⚠️ Auditor-safe: documenta a **política**; parte da execução (canal de direitos via UI, automação de retenção) está **a implementar** — marcado em §6.

---

## 1. Política de retenção

- **Prontuário/registro clínico:** retenção **mínima de 20 anos** após a **última entrada** (Lei 13.787/2018) — **prevalece** sobre o direito de eliminação (LGPD Art.16, §exceção legal/regulatória).
- **Documentos assinados** (prescrições/exames ICP-Brasil, relatórios com hash): preservados pelo mesmo prazo (valor probatório).
- **Logs de auditoria** (`noa_logs`, `scheduling_audit_log`, etc.): retidos para rastreabilidade (tecnovigilância — ver PROC-PMS quando ativado).
- **Dados de teste/demo (pré-PMF):** podem ser zerados no lançamento (start limpo) — NÃO são prontuário real.

## 2. Base legal por finalidade (LGPD Art.11)

| Finalidade | Base legal | Observação |
|---|---|---|
| Assistência à saúde (AEC, relatório, prescrição) | Tutela da saúde (Art.11, II, "f") | não exige consentimento, mas exige registro |
| Uso de dado para analytics / RAG / pesquisa interna | Consentimento específico (Art.11, I) | **a separar formalmente** do consent clínico AEC (ver gap-analysis §3.5) |

## 3. Pseudonimização e minimização (mitigação — Art.12, 46)

- **Na exclusão de conta:** PII de owners deletados é **pseudonimizada** (V1.9.407) — confirmado: 3 pacientes anonimizados (`Paciente #XXXXXX`).
- **Texto livre clínico:** nome do paciente sanitizado antes da persistência (`sanitizeRationalityPII`/`sanitizeAssessmentPII`, V1.9.565/566 — insensível a acento).
- **Mínimo ao operador externo (OpenAI):** PII removida do que vai ao LLM.

## 4. Direitos do titular (LGPD Art.18)

O titular (paciente) tem direito a: **confirmação/acesso**, **correção**, **portabilidade**, **informação sobre compartilhamento**, **revogação de consentimento**, e **eliminação** (ressalvada a retenção legal de prontuário — §1).

| Direito | Estado atual | Meta |
|---|---|---|
| Acesso ao prontuário | Paciente vê seus relatórios/consultas na UI (prontuário) | canal formal de solicitação |
| Portabilidade | parcial (export de dossiê existe) — `dossierExport.ts` | export estruturado (FHIR — ver endpoint /fhir) |
| Correção | via médico/admin | canal de solicitação do titular |
| Revogação de consentimento | `consent_given` auditável (V1.9.546) | UI de revogação |
| Eliminação | pseudonimização na exclusão (V1.9.407) | fluxo formal + ressalva de retenção |

## 5. Notificação de incidente (Res. CD/ANPD 15/2024)

Incidente de segurança com dado pessoal deve ser comunicado à ANPD e ao titular em **prazo definido pela ANPD** (procedimento formal a documentar — ver gap-analysis §3.5; proto-vigilância via `system_health_alerts`).

## 6. Lacunas conhecidas (a implementar)

- 🔴 **Canal de direitos do titular (UI)** — página paciente para solicitar acesso/portabilidade/correção/eliminação **NÃO implementada** (feature frontend + RPCs de atendimento). *É o principal item executável desta política.*
- 🔴 **Automação de retenção** — política de 20 anos não há rotina de arquivamento/expiração documentada.
- 🟡 **Separação formal de base legal** (assistência vs analytics/RAG) — não documentada (Art.11).
- 🔴 **Governança LGPD** (RIPD, DPO designado, DPA com Supabase/OpenAI/Resend, RPA) — gap de processo/jurídico (depende consultora).

---

**Aprovação:**
- [ ] DPO/Encarregado: ________________ Data: ___/___/___
- [ ] Jurídico (saúde digital + LGPD): ________________ Data: ___/___/___
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 02/06/2026 (draft)
