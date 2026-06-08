---
name: feedback_auditar_componente_inteiro_antes_de_touch_07_06
description: "Principio meta cravado por Pedro 07/06 noite: antes de touch grande num componente, auditar o arquivo INTEIRO (ler 100% + grep todas queries do banco + audit empirico de cada coluna referenciada). Caso empirico: V1.9.622 troquei ureia->A/Cr em RenalFunctionModule mas nao auditei OUTRAS queries do mesmo componente - bug pre-existente date_of_birth (coluna que nao existe, real e birth_date) continuou silencioso ate Pedro testar Carolina (aparecia '40 anos masculino' apesar de ter 35 anos e ser feminino). Impacto critico: calculo CKD-EPI usava age+sex defaults errados. Anti-padrao: 'eu mexi muito no arquivo mas nao li tudo' = irresponsavel."
type: feedback
---

# Antes de touch grande, auditar componente INTEIRO

## A regra

Quando vou fazer mudança significativa num componente (>3 edits OR mexer em estrutura/state/queries), **ANTES de aplicar o primeiro Edit**:

1. **Ler 100% do arquivo** com Read tool (sem offset/limit) — entender estrutura completa, todas as funcoes, todas as queries, todos os useEffects
2. **Grep todas as queries do banco** dentro do arquivo (`supabase.from`, `supabase.rpc`, `supabase.auth`, `select(`)
3. **Audit empirico via PAT** de cada coluna referenciada em SELECT — confirmar que existe no schema
4. **Listar comportamentos default** + ver onde caem (fallbacks silenciosos = armadilha)

## Why (caso empirico V1.9.622 → V1.9.625)

**07/06 ~20h BRT** — Pedro flagou na reuniao olhando Saude Renal de Carolina:
> "40 anos . Masculino" - Carolina e nome feminino e nasceu 1990 (35 anos)

Audit empirico via PAT revelou:
- `users.birth_date` = '1990-07-15' (35 anos)
- `users.gender` = null
- Coluna `date_of_birth` NAO EXISTE em `public.users`

Bug pre-existente em `RenalFunctionModule.tsx:163`:
```ts
.select('name, date_of_birth, gender')  // date_of_birth nao existe
```
- Query falhava silenciosamente
- Data ficava vazio
- Caia pros defaults `setLocalAge(40)` + `setLocalGender('male')`
- **Impacto critico**: calculo CKD-EPI usa age+sex - se errados, estagio G CALCULADO ERRADO

**Por que eu nao vi mesmo mexendo no arquivo (V1.9.622)**:
- Apliquei 6 edits no arquivo (substituir ureia->A/Cr em input, display, helper, handleSave, onboarding)
- NAO li o componente INTEIRO antes de comecar
- NAO grep'ei todas as queries (linhas 162-167 ficaram fora do meu radar)
- Resultado: bug ficou silencioso ate Pedro testar empiricamente

## How (procedimento operacional)

### Pre-touch (obrigatorio se vai mexer em componente >100 linhas)

```bash
# 1. Ler arquivo INTEIRO
Read tool sem offset/limit

# 2. Grep todas queries Supabase
Grep --path=componente.tsx pattern="supabase\.(from|rpc|auth)" -n

# 3. Pra cada query select, validar colunas via PAT
SELECT column_name FROM information_schema.columns
WHERE table_name='<tabela>' AND column_name IN ('col1','col2','col3')

# 4. Listar defaults/fallbacks
Grep --path=componente.tsx pattern="\|\| \"|\?\? |useState\(.*\)" -n
```

### Durante touch
- Cada Edit cita explicitamente o numero da linha onde ta editando
- Antes de Edit numa linha, ja sei o que tem ao redor (do Read inteiro)
- Anti-regressao: comportamento default antigo = comportamento default novo

### Pos-touch (smoke)
- Type-check verde (necessario, nao suficiente)
- Empirico via PAT: cada coluna SELECT/INSERT bate com schema
- Run mental: usuario faz X -> componente faz Y -> ve Z

## Quando aplicar

- ✅ Componentes >100 linhas
- ✅ Componentes que tocam state critico (auth/RLS/clinico)
- ✅ Mudanca em query/handler de DB
- ✅ Pre-V1.9.X mudanca de UX visivel
- ✅ Refactor de coluna/interface

## Quando NAO aplicar (excecoes razoaveis)

- ❌ Componente <50 linhas simples
- ❌ Mudanca puramente cosmetica (so tailwind class)
- ❌ Edit em string isolada (label/tooltip)

## Anti-padroes a vigiar

- ❌ "Vou ler so a parte que vou mexer" = bug silencioso pre-existente fica
- ❌ "Default 'male' e razoavel" = sem checar paciente real no banco
- ❌ "Type-check verde basta" = type-check NAO valida coluna existir no banco
- ❌ "Coluna deve se chamar X" = NUNCA assumir nome de coluna, sempre PAT

## Conexoes

- `feedback_auditar_100_antes_de_qualquer_mudanca` (principio original)
- `feedback_metodo_validacao_producao` (smoke 5 etapas)
- `feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05` (screenshot > plano)
- `feedback_doc_institucional_sem_pat_nao_e_valido_23_05` (Ricardo: PAT obrigatorio)
- `feedback_memorias_estaticas_envelhecem_<30d_pre_pmf` (banco vivo > memoria velha)

## Frase ancora

> *"07/06 noite Pedro flagou: Carolina '40 anos masculino' (nasceu 1990 = 35a, nome feminino). Bug pre-existente date_of_birth (coluna nao existe, real e birth_date) que eu deixei passar mesmo mexendo V1.9.622 no componente. Razao: nao li componente inteiro antes de touch + nao grep todas queries + nao audit empirico de cada coluna. Type-check verde NAO pega isso. Going-forward: pre-touch obrigatorio Read inteiro + Grep queries + PAT schema validate. Anti-padrao: 'mexi mas nao li tudo' = bug silencioso fica."*
