-- V1.9.112-A2 — Notas privadas do médico sobre paciente (audit-light)
-- Aplicada via Management API em 2026-05-01 ~13h BRT.
-- Pedro autorizou B2 (coluna em tabela existente) + auditoria leve.
--
-- CONTEXTO
-- Audit V1.9.112 (Analisar Paciente) identificou gap: médico não tem onde
-- anotar observações próprias sobre paciente. 3 opções avaliadas:
--   A — tabela nova professional_patient_notes (viola Princípio 8 "polir")
--   B1 — usar data JSONB existente (mistura conceitos)
--   B2 ⭐ — ALTER TABLE ADD COLUMN nullable (mesmo padrão V1.9.111-C)
--   B3 — clinical_reports.metadata aninhado (não é coluna própria)
-- Escolhida: B2 + auditoria leve (timestamp + autor)
--
-- IMPACTO ANALYSIS:
-- ✅ ADD COLUMN nullable = backward compat absoluto
-- ✅ Não muda fluxo existente
-- ✅ RLS já existe em clinical_assessments (doctor_id vê suas)
-- ✅ Reversível (DROP COLUMN se necessário)
-- ✅ Frontend hardcoded continua funcionando (textarea só renderiza se nota existe)

BEGIN;

-- 1. Coluna principal: notas privadas do médico
ALTER TABLE public.clinical_assessments
  ADD COLUMN IF NOT EXISTS doctor_private_notes TEXT;

COMMENT ON COLUMN public.clinical_assessments.doctor_private_notes IS
  'V1.9.112-A2: notas privadas do médico sobre o paciente. Visíveis apenas pelo doctor_id (RLS).';

-- 2. Auditoria leve: timestamp da última edição
ALTER TABLE public.clinical_assessments
  ADD COLUMN IF NOT EXISTS doctor_private_notes_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.clinical_assessments.doctor_private_notes_updated_at IS
  'V1.9.112-A2: timestamp da última edição das notas privadas.';

-- 3. Auditoria leve: UUID do autor da última edição
ALTER TABLE public.clinical_assessments
  ADD COLUMN IF NOT EXISTS doctor_private_notes_updated_by UUID;

COMMENT ON COLUMN public.clinical_assessments.doctor_private_notes_updated_by IS
  'V1.9.112-A2: UUID do médico que fez a última edição (audit trail).';

-- Nota: NÃO adicionamos FK em doctor_private_notes_updated_by referenciando users
-- pra evitar problemas de cascade em deleção/anonimização LGPD. Validação no app.

COMMIT;

-- ──────────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO PÓS-DEPLOY (rodar manualmente)
-- ──────────────────────────────────────────────────────────────────────
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema='public'
--   AND table_name='clinical_assessments'
--   AND column_name LIKE 'doctor_private_notes%'
-- ORDER BY column_name;
--
-- Esperado: 3 colunas, todas nullable.

-- ──────────────────────────────────────────────────────────────────────
-- ROADMAP V1.9.112-A2 frontend (próximo)
-- ──────────────────────────────────────────────────────────────────────
-- 1. ProfessionalMyDashboard.tsx painel Analisar Paciente:
--    - Adicionar seção "Notas privadas" (collapsible)
--    - <textarea> com placeholder
--    - Save com debounce 1.5s
--    - Mostrar "Última edição: <data>" se preenchida
-- 2. UPDATE no Supabase via supabase.from('clinical_assessments')
--    .update({
--      doctor_private_notes: text,
--      doctor_private_notes_updated_at: new Date(),
--      doctor_private_notes_updated_by: user.id
--    })
--    .eq('id', assessment.id)
--    .eq('doctor_id', user.id)  -- RLS reforço
