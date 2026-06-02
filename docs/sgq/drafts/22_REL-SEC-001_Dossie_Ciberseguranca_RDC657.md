# REL-SEC-001 — Dossiê de Cibersegurança (RDC 657/2022 Art.17 + LGPD Art.46-47)

**Versão draft:** 0.1 (02/06/2026)
**Status:** DRAFT pré-consultora SaMD (requer revisão RT + consultora)
**Referência normativa:** ANVISA RDC 657/2022 Art.17 (proteção contra acesso não autorizado) · LGPD Art.46-47 (medidas técnicas de segurança) · alinhado aos princípios SBIS-CFM (NGS2) e ISO 14971 (RSK-001 H7/H8/H10).

> ⚠️ Auditor-safe: os números são **auto-verificados via PAT/Management API em 02/06/2026** (não estimados). Onde há lacuna, está marcado. SBIS-CFM = **alinhado aos princípios, não certificado**.

---

## 1. Escopo

Controles técnicos que protegem dados clínicos (sensíveis, LGPD Art.11) contra acesso/alteração não autorizados no MedCannLab 3.0 — stack React + Supabase (Postgres + Edge Functions Deno) + Vercel.

## 2. Autenticação e identidade

- **Supabase Auth** (e-mail) — JWT por sessão. Google OAuth deployado porém dormindo (não usado).
- **RBAC** — 4 papéis em `app_role`: `admin`, `profissional`, `paciente`, `aluno`. Contexto montado por papel (`buildAdminContext`/`buildProfessionalContext`/`buildPatientContext`/`buildStudentContext`).
- **Princípio meta:** UUID nunca tem fallback de slug (`isValidUuid` antes de qualquer op de DB); least data exposure (remover campos desnecessários de queries públicas).

## 3. Controle de acesso a dados — RLS (auto-verificado 02/06)

- **100% das 145 tabelas públicas com RLS habilitado** (145/145 — query `pg_class.relrowsecurity`, PAT HTTP 201).
- **467 policies ativas** (`pg_policies`).
- **0 RPCs SECURITY DEFINER sem `SET search_path`** (audit Lovable 26/05, refutado o gap inverso).
- `chat-images` bucket fechado V1.9.98 (`public=false` + 4 policies Opção B owner/participante).

## 4. Defesa em camadas nas Edge Functions

- **`verify_jwt=true` em 14/15 Edges (93%)** — o Supabase rejeita request anônimo **no ingress, ANTES** do código Deno (não consome CPU/tokens).
- **Única exceção:** `sign-pdf-icp` (lock V1.9.299 PBAD AD-RB) — porém com **auth interna em runtime** (V1.9.457: valida `Authorization` + `auth.getUser` + ownership check). Não é exposição: é defesa equivalente em outra camada.
- Restauração validada via **smoke** (V1.9.506 batch V1.9.520-526): cada Edge testada com sem-JWT + JWT-inválido → 401.
- Crons usam `service_role` JWT do `vault.decrypted_secrets` (bypass legítimo de verify_jwt — confirmado V1.9.526).

## 5. Criptografia

- **Em trânsito:** TLS (HTTPS) — Supabase + Vercel.
- **Em repouso:** criptografia da infraestrutura Supabase (Postgres gerenciado).
- **Senha de certificado ICP** do médico criptografada via Edge `cert-encrypt-password`.

## 6. Integridade de registros clínicos

- **Relatório clínico:** `signature_hash` = **hash SHA-256 de integridade** do conteúdo congelado (47/150 reports). **NÃO** é assinatura ICP (correto por design — assinar a Composition é roadmap).
- **Prescrições/exames:** assinatura **ICP-Brasil PBAD AD-RB** (PKCS#7) — CONFORME validador ITI (lock V1.9.299).
- **Imutabilidade:** RLS bloqueia UPDATE de `signature_hash` exceto via Edge `sign-pdf-icp`; trigger AFTER UPDATE registra modificação (RSK-001 H10).

## 7. Trilha de auditoria

- `noa_logs` (~19,2k rows) — ações/acessos da IA e do sistema.
- `scheduling_audit_log`, `user_lifecycle_logs`, `cognitive_events` — trilhas específicas.
- `system_health_alerts` — fila auditável de alertas (cron SGQ diário 06h BRT, `run_sgq_health_checks`).
- `cron.job_run_details` — 100% succeeded em 2.023 runs/7d (telemetria de cron).

## 8. Atualização segura

- Deploy de Edge via Supabase CLI — **atômico** (build falho → versão anterior permanece).
- **Padrão slug-test** (V1.9.506, V1.9.566): mudança no Core é validada num slug paralelo + smoke ANTES de produção.
- Versionamento V1.9.X + tags git imutáveis (11 locks) + push dual-remote (4 refs).

## 9. Lacunas conhecidas (transparência — a corrigir)

- 🟠 **Policy RLS legada** em `clinical_reports` ("Reports access") com **lista hardcoded de 4 UUIDs** — não escala (admin novo não entra) + padrão de risco. **A trocar por check role-based (`is_admin()`)** — médio-alto risco, sessão dedicada (RSK item #3 da gap-analysis 02/06).
- WiseCare (vídeo) em **homolog**, migrar para produção.
- 72 files órfãos no bucket `documents` (~67 MB) de owners deletados — LGPD housekeeping.
- Governança LGPD documental (RIPD/DPO/DPA) ausente — gap de processo (ver gap-analysis §3.5).

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 02/06/2026 (draft)
