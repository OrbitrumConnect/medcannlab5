---
name: Rotas fantasma + tipos de app_command no front
description: Catálogo das rotas que o Core gera mas que não existem no App.tsx (causam 404), e dos tipos de app_command que o front efetivamente processa. Útil para evitar regressões silenciosas.
type: reference
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
## Rotas fantasma conhecidas (Core gera, front 404)

| Rota | Onde Core gera | Status no App.tsx | Sintoma |
|---|---|---|---|
| `/app/clinica/paciente/consentimento` | `tradevision-core/index.ts:5230` (`reason: 'consent_collection_ui_trigger'`, commit `88d2281`) | **NÃO existe** | 404 quando paciente clica botão "Autorizar Registro Clínico" derivado do `payload.buttons` (que o front nem renderiza) |

## Tipos de app_command efetivamente processados pelo front

`NoaConversationalInterface.tsx:583-720` tem switch/case dos types:

| Type | Comportamento | Exemplo de target |
|---|---|---|
| `navigate-section` | Navega via `navigate(...)` baseado em `target` mapeado | `'meu-relatorio'`, `'agenda'`, `'pacientes'`, `'agendamentos'`, `'terminal-clinico'`, `'painel-paciente'` |
| `navigate-route` | Navega direto para `detail.target` (URL completa) | `/app/clinica/paciente/agendamentos`, `/app/clinica/profissional/dashboard` |
| `show-prescription` | Navega pra `/app/clinica/prescricoes` | (sem target) |
| `filter-patients` | Navega + aplica filtro | `'active'`, etc. |
| `open-document` | Abre documento inline | `<docId>` |
| `show-document-inline` | Renderiza doc inline no chat | `<docId>` |

**Mapping de `target` para rota em `navigate-section`** (linha 636-661):
- `terminal-clinico` / `atendimento` → `/app/clinica/profissional/dashboard?section=<target>`
- `pacientes` → `/app/clinica/profissional/pacientes`
- `relatorios-clinicos` → `/app/clinica/profissional/relatorios`
- `chat-profissionais` → `/app/clinica/profissional/chat-profissionais`
- `agendamentos` → `/app/clinica/profissional/agendamentos`
- `agenda` → `/app/clinica/paciente/agendamentos` (paciente)
- `meu-relatorio` / `dados-parciais` → `/app/clinica/paciente/dashboard?section=relatorio`
- `painel-paciente` → `/app/clinica/paciente/dashboard?section=analytics`

## Tipos NÃO processados pelo front (dead code)

- `payload.buttons` (em `consent_collection_ui_trigger`) — busca em `src/`: 0 hits
- `ui_contract_version: "v1.5"` — nunca lido pelo front

## Tokens texto que o front trata especialmente

| Token | Onde detectado | Comportamento |
|---|---|---|
| `[TRIGGER_SCHEDULING]` | `NoaConversationalInterface:3344-3450` | Renderiza `SchedulingWidget` INLINE no chat (com guard `isValidUuid` V1.9.85 Fix D contra slug) |
| `[ASSESSMENT_COMPLETED]` | `useMedCannLabConversation` + Core 5257 | Pipeline orchestrator dispara + 2 app_commands pós-AEC |
| `[FINALIZE_SESSION]` | Core | Marca fim de sessão clínica |
| `[NAVIGATE_AGENDA]` | Core 253 | Gera app_command navigate-section target='agendamentos' (rota profissional) |
| `[NAVIGATE_MEUS_AGENDAMENTOS]` | Core 274 | Gera app_command navigate-route target='/app/clinica/paciente/agendamentos' |
| `[TRIGGER_ACTION]` | Front strip | Token genérico para ações via app_command |
| `[ASSESSMENT_FINALIZED]` | constants/metaTags | Variante de ASSESSMENT_COMPLETED |

## How to apply

- Antes de criar novo app_command no Core: verificar tipos suportados aqui
- Antes de adicionar nova rota: verificar se já existe em `App.tsx`
- Antes de assumir que `payload.<x>` será renderizado: grep no `src/` pra confirmar handler
- Se trigger texto novo: adicionar em `INVISIBLE_DISPLAY_TOKENS` do front senão paciente vê o token cru
