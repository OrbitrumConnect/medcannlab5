---
name: MedCannLab 3.0 — visão geral do projeto
description: O projeto neste diretório é o MedCannLab 3.0 (Nôa Esperança), HealthTech/EdTech de Cannabis Medicinal com IA residente. Estrutura, stack, status e contexto societário.
type: project
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
**O que é:** MedCannLab 3.0 (também referenciado como "Nôa Esperanza Med Cann Lab"). Plataforma clínica/educacional/pesquisa de Cannabis Medicinal com IA residente "Nôa Esperança" usando protocolo IMRE (Investigação, Metodologia, Resultado, Evolução).

**Arquitetura por Eixos (não mexer fora dessa hierarquia):**
- Clínica → `/app/clinica/{profissional|paciente}/...` (atendimento, prontuário, prescrição)
- Ensino → `/app/ensino/{profissional|aluno}/...` (cursos, aulas, gamificação)
- Pesquisa → `/app/pesquisa/{profissional|aluno}/...` (fóruns, protocolos, MedCannLab, Jardins de Cura)

**Stack:** React 18 + Vite 7 + TypeScript + Tailwind + Supabase (Auth/Postgres/Edge Functions) + OpenAI (via Edge `tradevision-core`) + Resend + Stripe (mock) + WiseCare + ICP-Brasil. Roteamento centralizado em `src/App.tsx`. Auth via `src/contexts/AuthContext.tsx` que usa RPC `get_my_primary_role` como fonte única de verdade para papéis (NUNCA confiar em `users.type`).

**Tipos de usuário canônicos (PT):** `admin`, `profissional`, `paciente`, `aluno`, `master` — normalizados por `src/lib/userTypes.ts`. Rota default por tipo está em `getDefaultRouteByType`.

**Status atual (abr/2026):** Estável (COS v5.0). TypeScript compila sem erros. Em homologação esperando 4 gates para go-live: Stripe Connect prod, DNS Resend (DKIM/SPF/MX/DMARC) no Registro.br, TURN/STUN para WebRTC, script de migração users legacy → Auth.

**Sociedade (acordo_quotistas_juridico.md):** 4 cofundadores 20% cada + 20% Equity Pool Estratégico. Médicos atendem via PJ (não pró-labore). Non-compete 24 meses. Nicho: IA Nativa com IMRE.

**Why:** Esse contexto explica decisões técnicas que parecem estranhas isoladas (ex: dualidade users/profiles, tabelas backup, tabelas vazias mas RLS pronta).

**How to apply:** Antes de criar nova rota, encaixar no eixo certo. Antes de checar papel, usar RPC/`user_roles` (não `users.type`). Antes de criar tabela, considerar se cabe no schema atual de 130+ tabelas.
