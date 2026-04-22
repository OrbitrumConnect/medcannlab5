-- ============================================================
-- 0) ÍNDICES CRÍTICOS (caminho quente do trigger)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id  ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_clinical_reports_patient_id ON public.clinical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_reports_doctor_id  ON public.clinical_reports(doctor_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id   ON public.chat_participants(user_id);

-- ============================================================
-- 1) AUDIT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_lifecycle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('anonymized', 'deleted', 'restored')),
  reason text,
  had_appointments boolean DEFAULT false,
  had_clinical_reports boolean DEFAULT false,
  had_chats boolean DEFAULT false,
  triggered_by text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_lifecycle_logs_user ON public.user_lifecycle_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lifecycle_logs_created ON public.user_lifecycle_logs(created_at DESC);

ALTER TABLE public.user_lifecycle_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view lifecycle logs" ON public.user_lifecycle_logs;
DROP POLICY IF EXISTS "No direct inserts" ON public.user_lifecycle_logs;
DROP POLICY IF EXISTS "No updates" ON public.user_lifecycle_logs;
DROP POLICY IF EXISTS "No deletes" ON public.user_lifecycle_logs;

CREATE POLICY "Only admins can view lifecycle logs"
  ON public.user_lifecycle_logs FOR SELECT
  USING (public.current_user_role() = 'admin');
CREATE POLICY "No direct inserts"
  ON public.user_lifecycle_logs FOR INSERT WITH CHECK (false);
CREATE POLICY "No updates"
  ON public.user_lifecycle_logs FOR UPDATE USING (false);
CREATE POLICY "No deletes"
  ON public.user_lifecycle_logs FOR DELETE USING (false);

-- ============================================================
-- 2) FLAG DE ESTADO
-- ============================================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_anonymized boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_is_anonymized 
  ON public.users(is_anonymized) WHERE is_anonymized = true;

-- ============================================================
-- 3a) ANONIMIZAÇÃO
-- ============================================================
CREATE OR REPLACE FUNCTION public.anonymize_user_safely(
  _user_id uuid,
  _reason text DEFAULT 'auth_user_deleted',
  _triggered_by text DEFAULT 'system'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_had_appts boolean;
  v_had_reports boolean;
  v_had_chats boolean;
  v_already_anon boolean;
  v_anon_email text;
  v_anon_name text;
BEGIN
  SELECT is_anonymized INTO v_already_anon 
  FROM public.users WHERE id = _user_id FOR UPDATE;
  
  IF v_already_anon IS NULL THEN RETURN false; END IF;
  IF v_already_anon IS TRUE THEN RETURN false; END IF;

  v_anon_email := 'anon-' || _user_id::text || '@anonymized.local';
  v_anon_name  := 'Paciente #' || substr(_user_id::text, 1, 6);

  v_had_appts   := EXISTS(SELECT 1 FROM public.appointments WHERE patient_id=_user_id OR doctor_id=_user_id);
  v_had_reports := EXISTS(SELECT 1 FROM public.clinical_reports WHERE patient_id=_user_id OR doctor_id=_user_id);
  v_had_chats   := EXISTS(SELECT 1 FROM public.chat_participants WHERE user_id=_user_id);

  -- users
  UPDATE public.users
  SET
    email = v_anon_email,
    name = v_anon_name,
    phone = NULL,
    cpf = NULL,
    address = NULL,
    avatar = NULL,
    avatar_url = NULL,
    birth_date = NULL,
    crm = NULL,
    cro = NULL,
    council_number = NULL,
    referral_code = NULL,
    user_metadata = '{}'::jsonb,
    metadata = jsonb_build_object('anonymized_at', now()),
    is_anonymized = true,
    updated_at = now()
  WHERE id = _user_id AND is_anonymized = false;

  -- user_profiles (apenas colunas que existem)
  UPDATE public.user_profiles
  SET 
    name = v_anon_name,
    full_name = v_anon_name,
    email = v_anon_email,
    bio = NULL,
    specialty = NULL,
    avatar = NULL,
    avatar_url = NULL,
    crm = NULL,
    cro = NULL
  WHERE user_id = _user_id;

  INSERT INTO public.user_lifecycle_logs(user_id, action, reason, had_appointments, had_clinical_reports, had_chats, triggered_by)
  VALUES (_user_id, 'anonymized', _reason, v_had_appts, v_had_reports, v_had_chats, _triggered_by);

  RETURN true;
END;
$$;

-- ============================================================
-- 3b) DELETE com lock + recheck
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_user_completely(
  _user_id uuid,
  _reason text DEFAULT 'no_clinical_data',
  _triggered_by text DEFAULT 'system'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
  v_has_clinical boolean;
BEGIN
  SELECT true INTO v_exists FROM public.users WHERE id = _user_id FOR UPDATE;
  IF v_exists IS NULL THEN RETURN 'noop'; END IF;

  v_has_clinical := 
    EXISTS(SELECT 1 FROM public.appointments WHERE patient_id=_user_id OR doctor_id=_user_id)
    OR EXISTS(SELECT 1 FROM public.clinical_reports WHERE patient_id=_user_id OR doctor_id=_user_id)
    OR EXISTS(SELECT 1 FROM public.chat_participants WHERE user_id=_user_id);

  IF v_has_clinical THEN
    PERFORM public.anonymize_user_safely(_user_id, _reason || '_promoted', _triggered_by);
    RETURN 'promoted_to_anonymized';
  END IF;

  INSERT INTO public.user_lifecycle_logs(user_id, action, reason, had_appointments, had_clinical_reports, had_chats, triggered_by)
  VALUES (_user_id, 'deleted', _reason, false, false, false, _triggered_by);

  DELETE FROM public.user_profiles WHERE user_id = _user_id;
  DELETE FROM public.users WHERE id = _user_id;

  RETURN 'deleted';
END;
$$;

-- ============================================================
-- 3c) DECISÃO CENTRALIZADA
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_user_lifecycle(
  _user_id uuid,
  _reason text DEFAULT 'auth_user_deleted',
  _triggered_by text DEFAULT 'auth_trigger'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_clinical boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = _user_id) THEN
    RETURN 'noop';
  END IF;

  v_has_clinical := 
    EXISTS(SELECT 1 FROM public.appointments WHERE patient_id=_user_id OR doctor_id=_user_id)
    OR EXISTS(SELECT 1 FROM public.clinical_reports WHERE patient_id=_user_id OR doctor_id=_user_id)
    OR EXISTS(SELECT 1 FROM public.chat_participants WHERE user_id=_user_id);

  IF v_has_clinical THEN
    PERFORM public.anonymize_user_safely(_user_id, _reason, _triggered_by);
    RETURN 'anonymized';
  ELSE
    RETURN public.delete_user_completely(_user_id, _reason, _triggered_by);
  END IF;
END;
$$;

-- ============================================================
-- 4) TRIGGER BEFORE DELETE
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_auth_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.process_user_lifecycle(OLD.id, 'auth_user_deleted', 'auth_before_delete_trigger');
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_deletion();

-- ============================================================
-- 5) LIMPEZA AUDITADA — lista FIXA (verificada em 2026-04-22)
--    joao.vidal@remederi.com NÃO incluído (preservado para investigação)
-- ============================================================
DO $$
DECLARE
  v_orphan_ids uuid[] := ARRAY[
    'ca3d4a5c-34ee-4da3-bdcf-76ab6aa5a339'::uuid,
    '63436af6-f385-4648-b5ef-bba10be45c6a'::uuid,
    '40ba931e-d70e-4b5a-979f-33482a936b6c'::uuid,
    'a16f4505-9c52-4643-93cb-65f0f7568f0d'::uuid,
    '79700b81-e3e3-4d29-889a-59c0129d659e'::uuid,
    '7a235e24-5fe2-4c3c-aa1d-fa473c9ed58e'::uuid,
    '9362c589-962c-41dd-b98c-c03cd1c3577e'::uuid,
    'aee0215c-7280-45f3-9c70-1f958c3e4cb4'::uuid,
    '7991f3e6-243c-4dc3-96b0-222157d40d42'::uuid,
    '1a40305c-db0a-4b39-af4a-edcd4ccbe979'::uuid
  ];
  v_id uuid;
  v_result text;
BEGIN
  FOREACH v_id IN ARRAY v_orphan_ids LOOP
    IF EXISTS (SELECT 1 FROM public.users WHERE id = v_id)
       AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_id) THEN
      v_result := public.process_user_lifecycle(v_id, 'manual_cleanup_2026_04_22', 'admin_audit');
      RAISE NOTICE 'User % -> %', v_id, v_result;
    END IF;
  END LOOP;
END $$;