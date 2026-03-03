-- =====================================================
-- P0-3: FIX RLS policies referencing user_metadata
-- Replace auth.jwt()->'user_metadata' with has_role()
-- =====================================================

-- ===================
-- 1) AI_SAVED_DOCUMENTS
-- ===================
DROP POLICY IF EXISTS "Usuários veem documentos relacionados" ON public.ai_saved_documents;
CREATE POLICY "ai_docs_select" ON public.ai_saved_documents
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (patient_id = auth.uid() AND is_shared_with_patient = true)
    OR public.has_role(auth.uid(), 'profissional')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Fix always-true INSERT policies
DROP POLICY IF EXISTS "IA pode salvar documentos" ON public.ai_saved_documents;
DROP POLICY IF EXISTS "Users can insert documents" ON public.ai_saved_documents;
CREATE POLICY "ai_docs_insert" ON public.ai_saved_documents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ===================
-- 2) APPOINTMENTS
-- ===================
DROP POLICY IF EXISTS "Admins view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins update all appointments" ON public.appointments;

CREATE POLICY "appointments_select_admin" ON public.appointments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "appointments_update_admin" ON public.appointments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix always-true INSERT policies
DROP POLICY IF EXISTS "Authenticated users insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "RPC insert appointments" ON public.appointments;
CREATE POLICY "appointments_insert" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = patient_id 
    OR auth.uid() = professional_id
    OR auth.uid() = doctor_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- ===================
-- 3) CLINICAL_ASSESSMENTS
-- ===================
DROP POLICY IF EXISTS "Admin can view all clinical assessments" ON public.clinical_assessments;
CREATE POLICY "clinical_assessments_select_admin" ON public.clinical_assessments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ===================
-- 4) USER_ACTIVITY_LOGS (also had hardcoded email)
-- ===================
DROP POLICY IF EXISTS "Admins veem todos os logs" ON public.user_activity_logs;
CREATE POLICY "activity_logs_select_admin" ON public.user_activity_logs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- ===================
-- 5) USERS TABLE - most complex, multiple policies
-- ===================
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.users;
DROP POLICY IF EXISTS "Users view logic" ON public.users;
DROP POLICY IF EXISTS "Users update logic" ON public.users;
DROP POLICY IF EXISTS "Professionals and Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Professionals can update assigned patients" ON public.users;

-- SELECT: Own profile, or admin sees all, or professional sees their patients
CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'profissional')
      AND (
        owner_id = auth.uid()
        OR public.check_professional_patient_link(id)
      )
    )
    OR (
      public.has_role(auth.uid(), 'paciente')
      AND type IN ('professional', 'doctor', 'profissional')
    )
  );

-- INSERT: Professionals and admins can create patient records
CREATE POLICY "users_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'profissional')
  );

-- UPDATE: Own profile, or admin, or professional for assigned patients
CREATE POLICY "users_update" ON public.users
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'profissional')
      AND (owner_id = auth.uid() OR public.check_professional_patient_link(id))
    )
  )
  WITH CHECK (
    id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'profissional')
      AND (owner_id = auth.uid() OR public.check_professional_patient_link(id))
    )
  );