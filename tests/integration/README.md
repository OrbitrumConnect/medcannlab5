# Integration Tests — MedCannLab

Testes de integração backend que validam **lógica crítica** sem depender de UI browser.
Complementam os Playwright E2E (`tests/e2e/`) que cobrem fluxo via interface.

## Por que esses testes existem

Os diários do projeto registraram:

> "Testes E2E do fluxo de cadastro de paciente deveriam ter pegado isso em 02/02."
> — referência ao trigger órfão dormindo 2 meses e 21 dias antes de ser descoberto.

Esta suite é a **rede de segurança** que faltava. Cobre os 3 vetores mais críticos:

1. **`consent-gate.test.ts`** — Consent gate server-side fail-closed. Garante que `clinical_reports` nunca é criado sem `content.consenso.aceito === true`, não importa por qual path.
2. **`monetization-e2e.test.ts`** — Cadeia completa de 4 triggers quando `appointment.status='completed'`. Valida split 70/30 automático, criação de `wallet_transaction`, `ensure_wallet`, sync de saldo.
3. **`aec-finalize-schema.test.ts`** — Schema persistido em `clinical_reports` após finalização tem `lista_indiciaria`/`identificacao`/`consenso` direto em `content.*` (padrão pré-22/04, restaurado em V1.9.20) + `professional_id` populado + sync trigger (V1.9.21) garantindo paridade com `doctor_id`.

## Como rodar localmente

```bash
export SUPABASE_URL=https://itdjkfubfzmvmuxxjoae.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
npm run test:integration
```

Sem as env vars os testes pulam silenciosamente (não quebram CI de fork).

## Princípios

- **Isolamento:** cada teste cria dados com prefix `E2E_TEST_` e remove no `afterAll`.
- **Não-destrutivo:** nunca toca em dados reais; tudo é sandbox identificável.
- **Real contra real:** rodam contra Supabase real (staging ou prod), não mock. É
  o único jeito de validar triggers, RLS e constraints de verdade.
- **Determinístico:** evitam timing (sem `setTimeout`), usam `await` explícito em
  cada passo da cadeia.
