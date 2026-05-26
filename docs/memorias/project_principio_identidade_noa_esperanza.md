---
name: 🔒 Princípio de Identidade Nôa Esperanza 05/05
description: Trigger Doctoralia "NOA Notes" no INPI. Decisão Ricardo+GPT+Pedro. 3 camadas (Identidade/Empresa/Produto funcional). "Nôa" sozinho NUNCA em contexto institucional.
type: project
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
## Trigger

Descoberto: Doctoralia tem "NOA Notes" registrado no INPI (depositada 18/02/2025).

## Decisão Ricardo+GPT+Pedro 05/05

```
✅ Nôa Esperanza PERMANECE
✅ "Nôa" sozinho NUNCA em contexto institucional/produto
✅ Em conteúdo público, sempre nome completo

3 CAMADAS:
  1. IDENTIDADE  →  "Nôa Esperanza" (sempre completo)
  2. EMPRESA     →  "MedCannLab Tecnologia em Saúde Ltda"
  3. PRODUTO funcional →  "assistente IA" / "Nôa Esperanza"
                          (genérico OK em UX interno)
```

## Frase Ricardo

> *"Problema jurídico se resolve. Identidade não se recupera depois."*

## Aplicação V1.9.138 (commit a99008f)

```
Ajustou 3 labels UI:
  • Sidebar: "Chat NOA" → "Chat Nôa Esperanza"
  • Avatar tooltip: "Nôa" → "Nôa Esperanza"
  • Header welcome: simplificações suaves
  
NÃO mudou:
  • Conteúdo de mensagens (Nôa pode dizer "eu sou Nôa")
  • Internal vars (noaResidentAI, etc)
  • Edge function names (tradevision-core fica)
```

## Distinção crítica

```
USUÁRIO pode simplificar:
  "ola noa tudo bem?" → OK natural
  
SISTEMA NÃO deve simplificar em contexto institucional:
  ❌ "Bem-vindo ao Nôa"  (institucional cortado)
  ✅ "Bem-vindo ao Nôa Esperanza"
  ✅ "Plataforma MedCannLab"
  
EM PROMPT/CONFIG INTERNO:
  Tradevision-core mantém "Nôa Esperanza" no system prompt
  Frase Dr. Ricardo Valença é PROTOCOLO 001 — NÃO alterar
```

## Refs

- DIARIO_05_05 BLOCO R (V1.9.138)
- Commit a99008f (refactor branding)
- Doctoralia INPI "NOA" classes 9+42 depositada 18/02/2025
- Decisão Ricardo+GPT+Pedro chat 05/05 ~14h BRT

## Quando aplicar

**SEMPRE** ao tocar:
- Labels UI sidebar/header
- Mensagens institucionais (welcome, footer)
- Material público (landing, marketing)
- Pitch / docs comerciais

**NUNCA** em:
- Conteúdo de mensagens dinâmicas (Nôa fala como Nôa)
- Variáveis internas (noaResident, tradevision-core)
- Prompts internos (frase Dr. Ricardo PROTOCOLO 001)
