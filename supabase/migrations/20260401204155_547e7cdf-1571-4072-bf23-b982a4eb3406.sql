-- =====================================================
-- PLANO MESTRE P0: BLINDAGEM DE VIEWS + WORKFLOW REVISÃO
-- =====================================================

-- 1. users_compatible
DROP VIEW IF EXISTS public.users_compatible CASCADE;
CREATE VIEW public.users_compatible
WITH (security_invoker = true)
AS
SELECT id, email, name,
    CASE
        WHEN type::text = 'student' THEN 'aluno'::varchar
        WHEN type::text = 'professional' THEN 'profissional'::varchar
        WHEN type::text = 'patient' THEN 'paciente'::varchar
        WHEN type::text = 'admin' THEN 'admin'::varchar
        ELSE type
    END AS type,
    type AS type_original,
    crm, cro, avatar_url, phone, address,
    blood_type, allergies, medications, cpf,
    birth_date, gender, created_at, updated_at
FROM public.users;

-- 2. active_subscriptions
DROP VIEW IF EXISTS public.active_subscriptions CASCADE;
CREATE VIEW public.active_subscriptions
WITH (security_invoker = true)
AS
SELECT us.id, us.user_id, sp.name AS plan_name,
    sp.monthly_price, sp.consultation_discount,
    us.status, us.started_at, us.expires_at,
    us.next_billing_at, us.auto_renew,
    CASE WHEN us.expires_at > now() THEN true ELSE false END AS is_active
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status::text = 'active';

-- 3. v_next_appointments
DROP VIEW IF EXISTS public.v_next_appointments CASCADE;
CREATE VIEW public.v_next_appointments
WITH (security_invoker = true)
AS
SELECT a.id, a.appointment_date AS appt_at,
    a.patient_id, a.professional_id,
    CASE
        WHEN a.status::text = 'scheduled' THEN 'scheduled'::varchar
        WHEN a.status::text = 'confirmed' THEN 'confirmed'::varchar
        WHEN a.status::text = 'waiting' THEN 'waiting'::varchar
        WHEN a.status::text = 'completed' THEN 'completed'::varchar
        WHEN a.status::text = 'cancelled' THEN 'cancelled'::varchar
        ELSE COALESCE(a.status, 'scheduled'::varchar)
    END AS status_norm,
    a.title, a.description, a.duration, a.type,
    a.location, a.is_remote, a.meeting_url,
    p.name AS patient_name, p.email AS patient_email,
    prof.name AS professional_name
FROM appointments a
LEFT JOIN profiles p ON a.patient_id = p.id
LEFT JOIN profiles prof ON a.professional_id = prof.id
WHERE a.appointment_date >= now()
ORDER BY a.appointment_date;

-- 4. v_clinical_reports
DROP VIEW IF EXISTS public.v_clinical_reports CASCADE;
CREATE VIEW public.v_clinical_reports
WITH (security_invoker = true)
AS
SELECT id, patient_id, patient_name, report_type, protocol,
    content, generated_by, generated_at, status,
    professional_id, professional_name, created_at, updated_at,
    doctor_id, shared_with, shared_at, shared_by, assessment_id
FROM clinical_reports cr
WHERE patient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM clinical_assessments ca WHERE ca.patient_id = cr.patient_id AND ca.doctor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM private_chats pc WHERE pc.patient_id = cr.patient_id AND pc.doctor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'admin');

-- 5. patient_assessments
DROP VIEW IF EXISTS public.patient_assessments CASCADE;
CREATE VIEW public.patient_assessments
WITH (security_invoker = true)
AS
SELECT ia.id, ia.user_id, ia.patient_id, ia.assessment_type,
    ia.triaxial_data, ia.semantic_context, ia.emotional_indicators,
    ia.cognitive_patterns, ia.behavioral_markers, ia.assessment_date,
    ia.session_duration, ia.completion_status, ia.clinical_notes,
    ia.risk_factors, ia.therapeutic_goals, ia.created_at, ia.updated_at,
    ash.shared_with_ricardo_valenca, ash.shared_with_eduardo_faveret,
    ash.patient_consent, ash.consent_date, ash.consent_expiry_date
FROM imre_assessments ia
LEFT JOIN assessment_sharing ash ON ash.assessment_id = ia.id
WHERE ia.user_id = auth.uid();

-- 6. v_user_points_balance (corrigido: auth.users não tem coluna 'name')
DROP VIEW IF EXISTS public.v_user_points_balance CASCADE;
CREATE VIEW public.v_user_points_balance
WITH (security_invoker = true)
AS
SELECT u.id AS user_id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) AS name,
    COALESCE(SUM(gp.points), 0) AS total_points,
    COUNT(gp.id) AS total_events
FROM auth.users u
LEFT JOIN gamification_points gp ON gp.user_id = u.id
GROUP BY u.id, u.raw_user_meta_data->>'name', u.email;

-- 7. v_auth_activity
DROP VIEW IF EXISTS public.v_auth_activity CASCADE;
CREATE VIEW public.v_auth_activity
WITH (security_invoker = true)
AS
SELECT id, email, created_at,
    raw_user_meta_data->>'type' AS role_hint,
    (SELECT count(*) FROM auth.audit_log_entries a
     WHERE a.created_at > now() - interval '7 days'
     AND ((a.payload->>'user_id')::uuid = u.id
       OR (a.payload#>>'{target_user_id}')::uuid = u.id)) AS auth_events_7d
FROM auth.users u;

-- 8. v_prescriptions_queue
DROP VIEW IF EXISTS public.v_prescriptions_queue CASCADE;
CREATE VIEW public.v_prescriptions_queue
WITH (security_invoker = true)
AS
SELECT cr.id AS report_id, cr.patient_id,
    cr.created_at, cr.status AS report_status,
    cr.patient_name, cr.professional_id,
    cr.doctor_id
FROM clinical_reports cr
WHERE cr.status IN ('completed', 'reviewed')
AND (cr.patient_id = auth.uid()
     OR cr.professional_id = auth.uid()
     OR cr.doctor_id = auth.uid()
     OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'admin'));

-- ── S7/C2: Workflow de revisão médica + idempotência ──

ALTER TABLE public.clinical_reports
ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS reviewed_by uuid,
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Constraint check separada (ADD COLUMN IF NOT EXISTS não suporta CHECK inline em todas as versões)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'clinical_reports' AND constraint_name = 'clinical_reports_review_status_check'
  ) THEN
    ALTER TABLE public.clinical_reports
    ADD CONSTRAINT clinical_reports_review_status_check
    CHECK (review_status IN ('draft', 'reviewed', 'approved'));
  END IF;
END $$;

-- Índice único parcial para idempotência (C2)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinical_reports_assessment_unique
ON public.clinical_reports (assessment_id, report_type)
WHERE assessment_id IS NOT NULL;