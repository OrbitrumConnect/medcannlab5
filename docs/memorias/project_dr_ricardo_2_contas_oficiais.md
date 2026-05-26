---
name: Dr. Ricardo 2 contas oficiais (intencional, histórico)
description: Dr. Ricardo Valença sempre teve 2 contas distintas no MedCannLab — não é duplicação a ser corrigida. Confirmado por Pedro 06/05.
type: project
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
# Dr. Ricardo Valença — 2 contas oficiais (intencional desde sempre)

| Conta | Email | Tipo | Função |
|---|---|---|---|
| `rrvalenca` | rrvalenca@... | `professional` | Conta clínica / atendimento de pacientes |
| `iaianoaesperanza` | iaianoaesperanza@... | `admin` | Conta administrativa / governance |

**Confirmação Pedro 06/05/2026:**
> *"ricardo tem conta rrvalenca como proficional e iaianoaesperanza como adm isso dai ja era definido! e sempre esteve!"*

## How to apply

- **NÃO tratar como bug ou duplicação** quando aparecer em audit (ex: `v_video_call_recipient_response` mostra "Dr. Ricardo Valença" professional + "Ricardo Valença" admin como linhas separadas — comportamento esperado).
- **NÃO sugerir merge ou cleanup** dessas contas.
- Em queries / dashboards: ambas são "Ricardo" do ponto de vista humano, mas representam responsabilidades diferentes (clínica vs governance).
- Listar separadas é comportamento correto — as métricas de cada uma têm leitura distinta:
  - `rrvalenca` (professional) — métricas clínicas (consultas, prescriptions, AEC executados)
  - `iaianoaesperanza` (admin) — métricas administrativas (override payment, flags, dashboards)
- O mesmo padrão pode existir pra outros sócios — se aparecer "duplicação", confirmar com Pedro antes de chamar de bug.

## Why

> Princípio **Anomalia ≠ bug** + **Anti-overclaim** — em audit empírico 06/05 chamei isso de "duplicação confirmada", overclaim. Pedro corrigiu na hora. Memória registra a regra pra não repetir.
