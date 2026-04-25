-- V1.9.49 — Gate de role explícito para INSERT/UPDATE em clinical_rationalities
--
-- Contexto:
--   Tabela `clinical_rationalities` (criada em 27/03/2026 — migration
--   20260327173000_clinical_intelligence_layer.sql) tinha policies:
--     - admin_full_access (FOR ALL) — admin via is_admin()
--     - professional_read_linked (FOR SELECT) — pro vê racionalidade de pacientes vinculados
--     - patient_read_own (FOR SELECT) — paciente vê suas próprias
--
--   Faltava INSERT/UPDATE explícito para profissional. Hoje qualquer profissional
--   tentando salvar racionalidade dependia do `admin_full_access` cobrir (não cobre
--   profissional não-admin) ou do código falhar silenciosamente (ClinicalReports.tsx:629
--   tem comentário "falhas de RLS no UPDATE não devem bloquear UI").
--
--   Decisão Pedro 25/04/2026: "para médico apenas racionalidades, profissionais
--   e admins no caso". Ou seja: explicitar que INSERT/UPDATE é restrito a
--   profissional/admin, e PACIENTE nunca pode chamar (defesa server-side caso
--   bundle JS seja burlado via devtools).
--
-- Fix:
--   Adiciona policies INSERT/UPDATE explícitas que casam com o gate client-side
--   em src/services/rationalityAnalysisService.ts (V1.9.49). Defesa em profundidade.
--
--   Retém `admin_full_access` (FOR ALL) — admin continua passando por ela.
--   Adiciona policies novas que liberam INSERT/UPDATE para users.type IN
--   ('professional','profissional').
--
-- Resultado:
--   - admin → admin_full_access cobre tudo
--   - profissional → nova policy INSERT/UPDATE permite salvar racionalidade
--   - paciente/aluno/anon → bloqueado por ausência de policy aplicável
--   - SELECT preservado (profissional via vínculo, paciente própria, admin tudo)

-- Idempotência: usa IF NOT EXISTS via DO blocks. Re-run de CI ou replay de
-- migration não recria policies que já existem (evita drift e gap microscópico
-- de DROP+CREATE). Padrão diferente do V1.9.47 (que precisava recriar pra
-- substituir conteúdo) — aqui são policies novas, não substituição.

BEGIN;

-- INSERT explícito para profissional (admin já passa via admin_full_access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clinical_rationalities'
      AND policyname = 'rationalities_insert_pro_admin'
  ) THEN
    CREATE POLICY "rationalities_insert_pro_admin"
      ON public.clinical_rationalities
      FOR INSERT
      WITH CHECK (
        public.is_admin()
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
            AND LOWER(COALESCE(type, '')) IN ('professional', 'profissional')
        )
      );
    RAISE NOTICE '[V1.9.49] Policy rationalities_insert_pro_admin CRIADA';
  ELSE
    RAISE NOTICE '[V1.9.49] Policy rationalities_insert_pro_admin já existe — skip';
  END IF;
END $$;

-- UPDATE explícito para profissional (admin já passa via admin_full_access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clinical_rationalities'
      AND policyname = 'rationalities_update_pro_admin'
  ) THEN
    CREATE POLICY "rationalities_update_pro_admin"
      ON public.clinical_rationalities
      FOR UPDATE
      USING (
        public.is_admin()
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
            AND LOWER(COALESCE(type, '')) IN ('professional', 'profissional')
        )
      );
    RAISE NOTICE '[V1.9.49] Policy rationalities_update_pro_admin CRIADA';
  ELSE
    RAISE NOTICE '[V1.9.49] Policy rationalities_update_pro_admin já existe — skip';
  END IF;
END $$;

-- Validação final: ambas as policies devem existir após esta migration
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'clinical_rationalities'
    AND policyname IN ('rationalities_insert_pro_admin', 'rationalities_update_pro_admin');

  IF policy_count <> 2 THEN
    RAISE EXCEPTION '[V1.9.49] Esperadas 2 policies, encontradas %', policy_count;
  END IF;
  RAISE NOTICE '[V1.9.49] Gate de role aplicado — INSERT/UPDATE em clinical_rationalities restrito a professional/profissional/admin';
END $$;

COMMIT;

-- Rollback manual (fora desta migration):
-- BEGIN;
-- DROP POLICY IF EXISTS "rationalities_insert_pro_admin" ON public.clinical_rationalities;
-- DROP POLICY IF EXISTS "rationalities_update_pro_admin" ON public.clinical_rationalities;
-- COMMIT;
