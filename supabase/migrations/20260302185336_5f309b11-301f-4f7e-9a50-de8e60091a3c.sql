-- =====================================================
-- P0-1: FIX cfm_prescriptions - Remove allow_all_authenticated
-- This policy allows ANY authenticated user to read ALL prescriptions
-- including CPF, medications, phone numbers (LGPD violation)
-- =====================================================

-- 1. Drop the dangerous catch-all policy
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.cfm_prescriptions;

-- 2. Drop redundant/overlapping SELECT policies that query auth.users directly
DROP POLICY IF EXISTS "Admins and owners can view prescriptions" ON public.cfm_prescriptions;
DROP POLICY IF EXISTS "Admins can view all prescriptions" ON public.cfm_prescriptions;
DROP POLICY IF EXISTS "Pacientes podem ver suas prescrições" ON public.cfm_prescriptions;
DROP POLICY IF EXISTS "Profissionais podem ver suas prescrições" ON public.cfm_prescriptions;
DROP POLICY IF EXISTS "Profissionais podem criar prescrições" ON public.cfm_prescriptions;
DROP POLICY IF EXISTS "Profissionais podem atualizar suas prescrições" ON public.cfm_prescriptions;
DROP POLICY IF EXISTS "Profissionais podem deletar suas prescrições" ON public.cfm_prescriptions;

-- 3. Create clean policies using has_role() (no auth.users queries)

-- SELECT: Patient sees own, professional sees own, admin sees all
CREATE POLICY "prescriptions_select" ON public.cfm_prescriptions
  FOR SELECT TO authenticated
  USING (
    auth.uid() = patient_id
    OR auth.uid() = professional_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- INSERT: Only professionals and admins can create
CREATE POLICY "prescriptions_insert" ON public.cfm_prescriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = professional_id
    AND (
      public.has_role(auth.uid(), 'profissional')
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- UPDATE: Professional who created it, or admin
CREATE POLICY "prescriptions_update" ON public.cfm_prescriptions
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = professional_id
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() = professional_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- DELETE: Only drafts, by the professional who created, or admin
CREATE POLICY "prescriptions_delete" ON public.cfm_prescriptions
  FOR DELETE TO authenticated
  USING (
    (auth.uid() = professional_id AND status = 'draft')
    OR public.has_role(auth.uid(), 'admin')
  );