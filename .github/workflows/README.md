# GitHub Actions — MedCannLab

## deploy-and-test.yml

Automatiza o que era manual até 24/04/2026.

### O que faz

Cada push em `main` ou `master` que tocar em arquivos de Edge Functions
ou testes de integração vai:

1. **Deploy da Edge Function `tradevision-core`** na Supabase
   (`supabase functions deploy`).
2. **Rodar os 3 testes de integração críticos** (consent gate, monetization
   chain, aec finalize schema) contra o ambiente recém-deployado.

Se o deploy falha, os testes não rodam (sem sentido testar código antigo).
Se os testes falham, o commit fica marcado vermelho no GitHub — alerta imediato.

### Secrets necessários

Configurar em **Settings → Secrets and variables → Actions** do GitHub:

| Nome | Valor | Origem |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | `sbp_...` | https://supabase.com/dashboard/account/tokens — crie um token com nome "GitHub Actions" |
| `SUPABASE_PROJECT_REF` | `itdjkfubfzmvmuxxjoae` | Referência do projeto (disponível em Project Settings → General) |
| `SUPABASE_URL` | `https://itdjkfubfzmvmuxxjoae.supabase.co` | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (JWT longo) | Project Settings → API → `service_role` (secret key) |

**Importante:** `SUPABASE_SERVICE_ROLE_KEY` é secret de admin — nunca deve ir pro
repositório, só pros secrets do GitHub Actions. É usado só pela suite de testes
de integração (bypassa RLS pra poder criar/limpar sandbox).

### Trigger manual

Na UI do GitHub → Actions → "Deploy Edge Functions & Run Integration Tests" →
"Run workflow" permite rodar sob demanda (útil depois de configurar secrets
pela primeira vez, ou pra redeployar sem push).

### Paths monitorados

O workflow só roda quando esses caminhos mudam:
- `supabase/functions/tradevision-core/**`
- `supabase/functions/_shared/**`
- `tests/integration/**`
- O próprio workflow

Mudanças em frontend, outras Edge Functions, migrations, etc., **não**
disparam este workflow — isso é proposital, evita deploy desnecessário.

### Como saber se funcionou

Após push:
1. Vai em Actions no GitHub.
2. Deve aparecer um run "Deploy Edge Functions & Run Integration Tests".
3. Ambos jobs (deploy + integration-tests) devem ficar verdes em ~3-5 min.
4. Se vermelho: clica no job pra ver o log.
