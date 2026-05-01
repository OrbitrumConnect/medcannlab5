-- V1.9.111-C — Adiciona coluna users.specialty + backfill de profissionais existentes
-- Aplicada via Management API em 2026-05-01 ~01h BRT.
-- Pedro autorizou empíricamente após audit confirmar ausência da coluna.
--
-- CONTEXTO
-- Pedro reportou em 30/04 ~20h: "todas as especialidaes aparecem 2 apenas ali
-- ...lembra na landing page tem o card de cadastro lá precisa por no proficional
-- qndo se cadastra qual e a sua especialidade".
--
-- Audit empírico (types.ts:6813-6852) confirmou: tabela users NÃO tinha coluna
-- specialty. Por isso loadProfessionals em PatientAppointments.tsx hardcodava
-- 'Clínica Geral' pra todos os parceiros, e dropdown de especialidades só
-- mostrava Nefrologia + Neurologia (dos 2 oficiais).
--
-- IMPACTO ANALYSIS (pre-execução):
-- ✅ ADD COLUMN nullable é a operação mais segura em Postgres (sem rewrite)
-- ✅ Não bloqueia tabela (default null)
-- ✅ Aplicações existentes continuam funcionando (não selecionam coluna)
-- ✅ RLS não afetado (policies usam predicates, não colunas)
-- ✅ Reversível (DROP COLUMN)
-- ✅ Frontend hardcoded continua funcionando até atualização

BEGIN;

-- 1. Adiciona coluna nullable
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS specialty TEXT;

COMMENT ON COLUMN public.users.specialty IS
  'V1.9.111-C: Especialidade médica (Cardiologia, Neurologia, Nefrologia, etc). NULL para não-médicos.';

-- 2. Backfill Equipe Oficial MedCannLab (Tier 1)
UPDATE public.users
SET specialty = 'Nefrologia'
WHERE email = 'rrvalenca@gmail.com'
  AND specialty IS NULL;

UPDATE public.users
SET specialty = 'Neurologia'
WHERE email IN ('eduardoscfaveret@gmail.com', 'eduardo.faveret@hotmail.com')
  AND specialty IS NULL;

-- 3. Backfill 7 Profissionais Parceiros existentes com 'Clínica Geral' (default seguro)
-- Eles podem atualizar via cadastro/perfil futuramente.
UPDATE public.users
SET specialty = 'Clínica Geral'
WHERE type IN ('profissional', 'professional')
  AND specialty IS NULL;

COMMIT;

-- ──────────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO PÓS-DEPLOY (rodar manualmente)
-- ──────────────────────────────────────────────────────────────────────
--
-- Esperado: 10 médicos com specialty preenchida
-- (1 Nefrologia + 2 Neurologia + 7 Clínica Geral)
--
-- SELECT specialty, count(*) FROM public.users
-- WHERE type IN ('profissional', 'professional', 'admin') AND specialty IS NOT NULL
-- GROUP BY specialty ORDER BY count DESC;

-- ──────────────────────────────────────────────────────────────────────
-- ROADMAP V1.9.111-C parte 2 (frontend, próxima sessão)
-- ──────────────────────────────────────────────────────────────────────
-- 1. PatientAppointments.tsx loadProfessionals: SELECT specialty + usar
--    em vez de hardcode 'Clínica Geral'
-- 2. Landing cadastro profissional: campo <select> Especialidade
--    (lista: Nefrologia, Neurologia, Clínica Geral, Cardiologia,
--     Pediatria, Psiquiatria, Outros)
-- 3. ProfessionalProfile (perfil próprio): permitir editar specialty
