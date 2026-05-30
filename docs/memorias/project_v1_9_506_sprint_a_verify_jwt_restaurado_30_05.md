---
name: v1-9-506-sprint-a-verify-jwt-restaurado-30-05
description: "30/05/2026 manhã — V1.9.506 Sprint A executado: Edge tradevision-core flipped de verify_jwt=false (desde v407 22/05) para verify_jwt=true (v424 30/05). Bomba latente de 8 dias fechada. Defesa em camadas restaurada: Supabase rejeita request anônimo ANTES de chegar à Edge (não consome CPU/tokens) + auth interna assertPatientHasDoctorContext continua ativa em runtime. Mitigação de risco via slug-test paralelo `tradevision-core-jwt-test v1` (4/4 PASS) ANTES do flip em produção. Smoke pós-flip: 401 sem JWT + 401 com JWT inválido + logs Edge confirmaram AEC + Pipeline + Verbatim + ICP signature 100% funcionais (Pedro paciente AEC FINAL_RECOMMENDATION → COMPLETED total_ms 17888 signature_hash gerado). RSK-001 H8 fechado, SRS-NFR-06 satisfeito, TRM-001 Gap #3 resolvido. Script preventivo `npm run deploy:tradevision` (sem --no-verify-jwt) adicionado em package.json. Lock V1.9.299 sign-pdf-icp INTOCADO. Commit 1f9fc81 push 4 refs OK."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# V1.9.506 Sprint A — verify_jwt restaurado em tradevision-core

## O que mudou

**Edge `tradevision-core`** flipped de **v423 (verify_jwt=false)** → **v424 (verify_jwt=true)**.

**Histórico do flag**: removido em v407 (22/05/2026) durante deploy de fix urgente PII V1.9.452 — Pedro precisava destravar Edge sem precisar JWT pra testar empíricamente. Permaneceu `false` por 8 dias (~270 deploys de outras versões V1.9.408→423). Restaurado em V1.9.506 (30/05/2026 manhã).

## Por que era bomba latente

Com `verify_jwt=false`, **qualquer requisição HTTP pra URL pública da Edge passava da camada Supabase** sem precisar de token. Vetores reais:

1. **Consumo de tokens OpenAI** (R$ 0,13/chamada Matrix Z2) por invocação anônima
2. **Enumeração de pacientes** via lookup direto sem auth
3. **Probing de endpoints internos** sem rate limit

A auth interna (`assertPatientHasDoctorContext` + RLS Supabase) mitigava **parcialmente** em runtime — mas defesa-em-camadas tava quebrada: anyone podia bater no endpoint, gastar CPU, e só ser barrado tarde no fluxo. Diferença prática: ~50ms CPU desperdiçado por chamada anônima vs ~0ms se Supabase rejeitasse no ingress.

Memory `audit_pendencias_um_mes_pos_pbad_20_05` já tinha mapeado como pendência. DIARIO_29 chamou Sprint A. DIARIO_30 priorizou como Tier 2 ITEM 11.

## Mitigação de risco do flip (anti-regressão crítica)

**Risco identificado**: 1 caller no frontend usa `fetch()` direto pra Edge ([src/lib/noaEngine.ts:60](src/lib/noaEngine.ts#L60)) — se não enviar header `Authorization: Bearer ${session.access_token}`, frontend QUEBRA na hora do flip.

**Plano executado**:
1. Audit dos 9 callers de `tradevision-core` em `src/`:
   - 7 usam `supabase.functions.invoke()` → injeta JWT auto ✅
   - 1 é comentário arquitetural → N/A
   - 1 é `noaEngine.ts:60` `fetch()` direto → **verificar header manualmente**
2. Confirmado: linha 60 envia `Authorization: Bearer ${session.access_token}` ✅
3. **Slug-test paralelo** — deployed `tradevision-core-jwt-test v1` (clone com `verify_jwt=true`) pra smoke matriz SEM afetar produção:
   - SMOKE 1: sem Authorization → 401 ✅
   - SMOKE 2: JWT inválido → 401 ✅
   - SMOKE 3: JWT válido user paciente → AEC funcionou ✅
   - SMOKE 4: JWT válido user médico → Matrix funcionou ✅
4. Aprovado, deployed v424 produção com `verify_jwt=true`
5. Smoke pós-flip produção: 401 sem JWT + 401 JWT inválido ✅
6. **Rollback ready 30s**: `supabase functions deploy tradevision-core --no-verify-jwt --project-ref itdjkfubfzmvmuxxjoae` (caso quebrasse)
7. Slug-test `tradevision-core-jwt-test` deletado pós-validação (cleanup)

## Validação clínica empírica pós-flip

Pedro logado como paciente fez AEC completa após flip:
- AEC FINAL_RECOMMENDATION → COMPLETED
- Total ms: 17888 (~17.9s — dentro do P95 esperado)
- Signature hash gerado: `74f3...` (truncado por LGPD)
- Pipeline rodou: REPORT → SCORES → SIGNATURE → AXES → RATIONALITY → DONE
- Verbatim First disparou nas 3 hard-locks esperadas
- ICP-Brasil PBAD AD-RB CONFORME ITI assinou ✅

**Zero regressão clínica** confirmada empíricamente.

## Fechamentos regulatórios (SGQ)

- **RSK-001 hipótese H8** ("Edge invocação não-autenticada"): FECHADA
- **SRS-NFR-06** (segurança defesa-em-camadas): SATISFEITA
- **TRM-001 Gap #3** (rastreabilidade de auth ingress): RESOLVIDO

Atualizações respectivas em `docs/sgq/drafts/` pendentes na próxima rodada SGQ (não bloqueia).

## Prevenção de regressão futura

Script `deploy:tradevision` adicionado em [package.json](package.json#L13):
```json
"deploy:tradevision": "npx supabase functions deploy tradevision-core --project-ref itdjkfubfzmvmuxxjoae"
```

**Nota**: NÃO contém `--no-verify-jwt`. Próximo deploy emergencial vai exigir override explícito (deliberação consciente), não esquecimento.

## Locks intocados

- ✅ Lock V1.9.299 sign-pdf-icp PBAD CONFORME ITI — NÃO TOCADO
- ✅ Lock V1.9.388-A.3 ancoragem regulatória multi-camada — INTOCADO
- ✅ Lock V1.9.452 PII sanitize — INTOCADO
- ✅ Lock V1.9.468-B Matrix Z2 + Bula — INTOCADO

## Commit + push

- Commit `1f9fc81` — `feat(security): V1.9.506 Sprint A verify_jwt restaurado em tradevision-core (Tier 2 DIARIO_30)`
- Push 4 refs OK: `amigo` + `medcannlab5` × `main` + `master`
- Vercel build verde
- Type-check verde

## Aplicações futuras (3 lugares)

### 1. Toda Edge Function nova ou redeploy

**Checklist obrigatório**:
- [ ] `verify_jwt=true` por padrão (override explícito se exceção justificada)
- [ ] Se override = `false`: documentar razão + prazo de reativação na própria PR
- [ ] Auth interna em runtime SEMPRE — mesmo com `verify_jwt=true` (defesa em camadas)
- [ ] Smoke matriz pós-deploy: sem JWT / JWT inválido / JWT válido

### 2. Toda mudança em flag de segurança ingress

**Padrão cristalizado**: usar slug-test paralelo (clone Edge com flag mudada) pra smoke ANTES do flip em produção. Custo: ~3-5min setup, evita downtime caso regressão. Aplica também a: `cors`, `import_map`, `region`, `oauth`.

### 3. Quando alguém propor remover verify_jwt pra "destravar dev"

**Resposta correta**:
> *"OK pra destravar. Cria slug-test paralelo (`tradevision-core-dev-test`) com verify_jwt=false em vez de mexer no slug produção. Frontend dev aponta pro slug-test. Custo: 5min. Evita bomba latente de 8 dias."*

**NÃO usar**:
> *"Sim, vou deployar com --no-verify-jwt agora e religo depois"* (foi exatamente o que rolou em V1.9.407 — virou bomba latente)

## Princípios meta cristalizados

- **Bomba latente = flag de segurança desligada sem prazo explícito de reativação** — sempre virou regressão silenciosa em 4-30 dias
- **Slug-test paralelo > deploy direto com rollback** — custo de setup é trivial (~3-5min), redução de risco é massiva (zero downtime caso regressão)
- **Smoke matriz mínima**: sem auth / auth inválida / auth válida user A / auth válida user B (4 testes baratos, cobertura alta)
- **Script preventivo no package.json** > confiar em memória do dev (humano esquece após N deploys)

## Conexões

- [[audit_pendencias_um_mes_pos_pbad_20_05]] — mapeou pendência originalmente
- DIARIO_29_05_2026 — chamou Sprint A na primeira vez
- DIARIO_30_05_2026 — priorizou como Tier 2 ITEM 11
- [[reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05]] — lock NÃO afetado pelo flip
- `docs/sgq/drafts/04_RSK-001` — hipótese H8 fechada
- `docs/sgq/drafts/07_SRS-NFR-06` — satisfeita
- `docs/sgq/drafts/05_TRM-001` — Gap #3 resolvido

## Frase âncora

> *"30/05 manhã: Sprint A V1.9.506 fechou bomba latente verify_jwt=false de 8 dias em tradevision-core. Slug-test paralelo `tradevision-core-jwt-test v1` rodou smoke matriz 4/4 PASS ANTES do flip produção (zero downtime ready). Pós-flip empírico: 401 sem JWT + AEC paciente FINAL_RECOMMENDATION → COMPLETED total_ms 17888 + signature ICP gerado + Pipeline + Verbatim 100% intactos. RSK-001 H8 + SRS-NFR-06 + TRM-001 Gap #3 fechados. Lock V1.9.299 PBAD INTOCADO. Script `deploy:tradevision` sem `--no-verify-jwt` adicionado pra prevenir regressão futura. Princípio cristalizado: bomba latente = flag de segurança desligada sem prazo explícito de reativação."*
