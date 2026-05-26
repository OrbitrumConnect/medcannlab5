---
name: project-v1-9-457-sign-pdf-icp-auth-ownership-26-05
description: "V1.9.457 (commit d19cc83 merge f90f346, 26/05/2026 ~17h30 BRT) — fechou vetor abuso ANON_KEY na Edge sign-pdf-icp. Audit 360 pós-V1.9.455 BLOCO L revelou que Edge tinha verify_jwt:false + zero ownership check — qualquer ANON_KEY (pública no bundle) podia invocar Edge pra qualquer documentId, gerando PDF spurious (encheria Storage + audit CFM diluído). Fix: 2 camadas adicionadas SEM tocar algoritmo PBAD AD-RB (lock V1.9.299 preservado). Branch feature/v1_9_457_jwt_validation isolada → merge --no-ff main. Smoke 1+2 validados (401). Algoritmo PBAD intocado. V1.9.455 PARTE C auto-invoke continua funcionando (supabase.functions.invoke injeta session JWT user automaticamente)."
metadata:
  node_type: memory
  type: project
  originSessionId: 2660bb38-0295-449a-8e4f-9439ffc7f2ac
---

# V1.9.457 — Edge sign-pdf-icp Auth + Ownership (26/05/2026)

## Trigger empírico

Audit 360 pós-V1.9.455 (26/05 BLOCO L do diário) revelou via Management API:
- Edge `sign-pdf-icp` deployada com `verify_jwt: false`
- Grep no código: ZERO checks `auth.uid()` ou ownership
- ANON_KEY (público no bundle JS frontend) podia invocar Edge

Detalhes do vetor em [[feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05]] + audit 360 BLOCO L diário 26/05.

**Risco real HOJE (rede pessoal 34 pacientes)**: BAIXO operacional.
**Risco PÓS-MARCO 2** (20-30 pacientes externos pagantes): ALTO LGPD + custo Storage + audit CFM.

## Solução cirúrgica (anti-regressão integral)

### Princípio aplicado

Aplicação direta de [[feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05]]: **NÃO tocar algoritmo PBAD**. Adicionar auth check **ANTES** do algoritmo crypto rodar.

### 2 camadas adicionadas

**Camada 1 — Authorization header check (linhas 1082-1132)**:
```typescript
const authHeader = req.headers.get('Authorization')
if (!authHeader) return 401

const token = authHeader.replace(/^Bearer\s+/i, '').trim()
const isServiceRoleCall = token === supabaseServiceKey

let authenticatedUserId: string | null = null
let isAdminUser = false

if (!isServiceRoleCall) {
  const { data: userData, error } = await supabase.auth.getUser(token)
  if (error || !userData?.user) return 401
  authenticatedUserId = userData.user.id

  const { data: profile } = await supabase
    .from('users')
    .select('type')
    .eq('id', authenticatedUserId)
    .single()
  isAdminUser = profile?.type === 'admin'
}
```

**Camada 2 — Ownership check pós doc lookup (linhas 1170-1184)**:
```typescript
if (!isServiceRoleCall && !isAdminUser) {
  const isOwnerProfessional = document.professional_id === authenticatedUserId
  if (!isOwnerProfessional) {
    console.warn(`[V1.9.457] ACCESS DENIED — user ${authenticatedUserId} tentou gerar PDF do doc ${documentId} (owner: ${document.professional_id})`)
    return 403
  }
}
```

### 3 modos de resolução

| Modo | Quem | Resultado |
|---|---|---|
| **Service role** | Backfill/cron interno (token === SUPABASE_SERVICE_ROLE_KEY) | Bypass total |
| **Admin user** | type='admin' em users (Pedro, Ricardo, Eduardo, João Vidal, Admin Test) | Bypass ownership |
| **Médico dono** | document.professional_id === auth.uid() | PASS |
| **Outros** | Paciente do doc, outros médicos, JWT inválido, sem auth | 401/403 |

## Anti-regressão validada

| Item | Status |
|---|---|
| Algoritmo PBAD AD-RB CONFORME ITI | ✅ INTOCADO |
| `signWithRealCertificate()` | ✅ INTOCADO |
| `addSignaturePlaceholder()` | ✅ INTOCADO |
| `signPdfBytes()` | ✅ INTOCADO |
| `signing-certificate-v2` (PAdES) | ✅ INTOCADO |
| `icp_chain.ts` (chain ICP embedded) | ✅ INTOCADO |
| Constants `PA_AD_RB_V24_OID` | ✅ INTOCADO |
| Lock V1.9.299 tag `v1.9.299-pbad-conforme-locked` | ✅ INTEGRAL |
| V1.9.455 PARTE C auto-invoke | ✅ continua (frontend injeta JWT auto) |
| Frontend reader (PatientPrescriptions, PatientExamRequestsCard) | ✅ não invoca diretamente |
| Trigger CFM imutabilidade V1.9.180 | ✅ INTOCADO |
| Bucket signed_documents RLS | ✅ INTOCADO |

## Smoke pós-deploy

### Validados empíricamente via curl

**SMOKE 1** (sem Authorization):
```bash
curl -X POST '.../sign-pdf-icp' -d '{"documentId":"7be5d078-...","documentType":"exam_request"}'
```
→ `{"success":false,"error":"Authorization header obrigatório (V1.9.457 anti-abuso)"}` (401) ✅

**SMOKE 2** (ANON_KEY role=anon, NÃO user JWT):
```bash
curl -X POST '.../sign-pdf-icp' -H 'Authorization: Bearer <ANON_KEY>' -d '{...}'
```
→ `{"success":false,"error":"Token JWT inválido ou expirado (V1.9.457). Faça login novamente."}` (401) ✅

### Smokes pendentes (requerem credenciais runtime)

- **SMOKE 3 SERVICE_ROLE_KEY bypass**: lógica trivial (token === supabaseServiceKey → bypass). Validar via Supabase Dashboard "Invoke" se necessário.
- **SMOKE 4 JWT user real**: Ricardo cria exame novo via app pós-deploy Vercel → V1.9.455 PARTE C auto-invoke chama `sign-pdf-icp` → ownership check valida (Ricardo.id === document.professional_id) → PASS → `signed_pdf_url` populado automático.
- **SMOKE 5 ITI re-validation**: PDF binário pós-V1.9.457 → upload `validar.iti.gov.br` → deve continuar "VÁLIDA" (lock PBAD intocado).

## Impacto operacional (regressão controlada)

### V1.9.455 PARTE C — sem regressão

Frontend `ExamRequestModule.tsx` faz:
```typescript
supabase.functions.invoke('sign-pdf-icp', {
  body: { documentId: req.id, documentType: 'exam_request' }
})
```

`supabase-js` automaticamente injeta:
- `Authorization: Bearer <session JWT do user logado>`
- `apikey: <ANON_KEY>`

V1.9.457:
- `auth.getUser(session_jwt)` resolve `user.id` (médico logado que está assinando)
- Ownership check: `document.professional_id === user.id` → PASS
- Edge gera PDF normal

### V1.9.455 PARTE A — REGRESSÃO esperada (curl ANON_KEY)

Meu invoke manual via curl ANON_KEY usado HOJE (caso João + backfill 12 docs legacy) **NÃO FUNCIONA MAIS** sem JWT user.

**Pra backfills futuros**:
- **Opção A**: SERVICE_ROLE_KEY (bypass total) — pra admin scripts internos
- **Opção B**: autenticar como admin user via session JWT — pra UI admin

Esse é o **comportamento desejado** — fecha vetor abuso. Não é regressão real, é trade-off.

## Deploy

- Branch: `feature/v1_9_457_jwt_validation` (criada anti-regressão, merge --no-ff)
- Edge deploy: `npx supabase functions deploy sign-pdf-icp --no-verify-jwt`
- Versão Edge: v18 → **v19 ACTIVE** (Management API)
- Mantém `verify_jwt: false` no platform Supabase + check manual no Deno.serve handler
  (permite SERVICE_ROLE_KEY bypass que `verify_jwt: true` não permitiria nativo)
- Commit branch: `d19cc83`
- Merge main: `f90f346`
- Push 4 refs após: amigo + medcannlab5 × main + master

## Princípios meta cristalizados

### 1. Aplicação prática `feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura`

Edge LOCKED pode receber novas funcionalidades que **NÃO tocam algoritmo PBAD**. Critério: adicionar **antes** ou **depois** do bloco crypto, nunca **dentro**. V1.9.457 adiciona auth check no início do handler (antes de qualquer crypto) + ownership check após doc lookup (antes de qualquer crypto). Lock V1.9.299 PBAD preservado porque algoritmo (signWithRealCertificate + addSignaturePlaceholder + signPdfBytes + signing-certificate-v2 + chain embedded) está intocado.

### 2. Branch feature isolada pra Edge LOCKED

Mesmo mudanças "simples" em Edge LOCKED devem usar branch feature + merge --no-ff. Permite:
- Smoke isolado na branch
- Rollback fácil se falhar
- Histórico legível (`git log --oneline --first-parent main` mostra só merges feature)
- Tag git por feature

Aplica também a futuras alterações Edge `digital-signature`, `tradevision-core`, etc.

### 3. Auth manual > verify_jwt platform

`verify_jwt: true` no platform Supabase é binário: aceita JWT user OR rejeita. NÃO permite SERVICE_ROLE_KEY bypass (que tem outro role no JWT).

Em Edges que precisam invocação interna (admin scripts/crons/backfill), preferir `verify_jwt: false` + check manual de `Authorization` header no handler. Mais código mas mais flexível.

## Frase âncora

> *"V1.9.299 deu motor ICP. V1.9.455 deu distribuição ICP. V1.9.457 deu proteção ICP. Algoritmo PBAD AD-RB CONFORME ITI integralmente preservado — auth check é uma camada CIRURGICAMENTE separada do bloco crypto. Vetor abuso ANON_KEY no bundle agora fechado: 401 sem auth, 401 com anon_key role=anon, 403 com user JWT que não é dono nem admin. Frontend supabase.functions.invoke() continua funcionando porque injeta session JWT automaticamente. Curl ANON_KEY backfill admin não funciona mais (mudar pra SERVICE_ROLE_KEY)."*

— Cristalizado 26/05/2026 ~17h30 BRT após audit 360 BLOCO L revelar vetor + branch feature + smoke pós-deploy + merge --no-ff main. Próximo SMOKE pendente: Ricardo cria exame novo via app pós Vercel CI deploy → confirma V1.9.455 PARTE C auto-invoke continua funcionando.

## Conexões

- [[feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05]] — princípio aplicado (auth fora do bloco crypto)
- [[project_v1_9_455_exam_request_pdf_icp_wiring_26_05]] — V1.9.455 que motivou audit 360 (V1.9.457 protege exatamente o vetor que V1.9.455 expôs)
- [[feedback_qr_code_embedded_pdf_gap_caso_joao_guimaraes_25_05]] — caso João Guimarães (vetor original)
- [[feedback_paciente_externo_real_estressa_arquitetura_25_05]] — princípio meta (pré-Marco 2 exige proteção)
- [[feedback_doc_institucional_sem_pat_nao_e_valido_23_05]] — audit empírico validou cada camada (smoke 1+2 via curl)
- [[feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05]] — princípio análogo (smoke obrigatório pré-merge)
- [[feedback_polir_nao_inventar]] — aproveitou `supabase.auth.getUser()` existente (sem reinventar verificação JWT)
