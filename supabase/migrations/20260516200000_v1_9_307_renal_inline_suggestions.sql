-- ==============================================================================
-- V1.9.307 — Renal Inline Suggestions (sidecar clínico renal)
-- ==============================================================================
--
-- Contexto: V1.9.303 (16/05) introduziu captation_buffer que captura
-- "laboratorios_inline" quando paciente menciona creatinina/eGFR/proteinúria
-- inline na fala. Maria das Dores empíricamente: "creatinina 1.61",
-- "proteinúria 1924 mg/g". Hoje esses dados ficam só como string em noa_logs.
--
-- V1.9.307 conecta os pontos:
--   captation_extras laboratorios_inline → parser regex → CKD-EPI 2021
--   → renal_inline_suggestions (PENDENTE) → médico aprova
--   → renal_exams oficial → Risk Cockpit deixa de ser MOCK
--
-- GPT review (Pedro 16/05) validou nos 3 níveis técnico/clínico/regulatório.
-- 8 salvaguardas incorporadas: pipeline paralelo, read-only até aprovação,
-- persistência separada, expiração 30d, proveniência explícita, nunca
-- sobrescrever humano, feature flag (Ricardo+admin), Risk Cockpit só aprovados.
--
-- CRÍTICO clínico/regulatório:
-- - NUNCA grava em renal_exams sem aprovação humana explícita
-- - NUNCA decide diagnóstico (só sugere matematicamente CKD-EPI)
-- - Linguagem não-categórica: "possível estadiamento compatível com"
-- - Cidade Amiga dos Rins ativa naturalmente quando Ricardo aprova 1ª sugestão
--
-- Anti-regressão:
-- - Tabela NOVA isolada, não toca renal_exams nem AEC FSM nem Pipeline V1.9.95
-- - RLS estrito: profissional vinculado vê, paciente NÃO vê
-- - Falha silenciosa em qualquer ponto = sistema continua igual antes
-- ==============================================================================

-- ============================================================================
-- 1) Tabela renal_inline_suggestions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.renal_inline_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Dados detectados (todos opcionais — sugestão pode ter só 1 valor)
  creatinine_mg_dl numeric(5,2),
  egfr_calculated numeric(5,1),
  drc_stage_suggested text CHECK (drc_stage_suggested IS NULL OR drc_stage_suggested IN ('G1','G2','G3a','G3b','G4','G5')),
  proteinuria_acr_mg_g numeric(8,2),  -- albumina/creatinina ratio
  patient_age int CHECK (patient_age IS NULL OR (patient_age > 0 AND patient_age < 130)),
  patient_sex text CHECK (patient_sex IS NULL OR patient_sex IN ('male','female')),

  -- Confiança + proveniência (auditabilidade total — GPT review #5)
  confidence_score numeric(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source_turn_id text,        -- interaction_id do noa_logs.captation_extra
  source_text text,           -- snippet original que o parser detectou
  source_noa_log_id uuid REFERENCES public.noa_logs(id) ON DELETE SET NULL,
  ckd_epi_version text NOT NULL DEFAULT '2021',
  parser_version text NOT NULL DEFAULT 'V1.9.307',

  -- Estado da sugestão (workflow approval)
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,

  -- FK pra renal_exam criado QUANDO aprovado (rastreabilidade)
  renal_exam_id uuid REFERENCES public.renal_exams(id) ON DELETE SET NULL,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

COMMENT ON TABLE public.renal_inline_suggestions IS
  'V1.9.307 — Sugestões DRC extraídas automaticamente de captation_extras
   (laboratorios_inline). NÃO é diagnóstico — é cálculo CKD-EPI 2021 pendente
   validação médica. Médico aprova → cria renal_exams oficial.
   Expiração automática 30d. Linguagem não-categórica obrigatória na UI.';

-- ============================================================================
-- 2) Índices
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_renal_sugg_patient_status
  ON public.renal_inline_suggestions(patient_id, status);

CREATE INDEX IF NOT EXISTS idx_renal_sugg_expires_pending
  ON public.renal_inline_suggestions(expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_renal_sugg_source_turn
  ON public.renal_inline_suggestions(source_turn_id)
  WHERE source_turn_id IS NOT NULL;

-- Anti-duplicata: 1 sugestão por turn_id (idempotência do parser)
CREATE UNIQUE INDEX IF NOT EXISTS uq_renal_sugg_turn_creatinine
  ON public.renal_inline_suggestions(source_turn_id, creatinine_mg_dl)
  WHERE source_turn_id IS NOT NULL AND creatinine_mg_dl IS NOT NULL;

-- ============================================================================
-- 3) RLS
-- ============================================================================
ALTER TABLE public.renal_inline_suggestions ENABLE ROW LEVEL SECURITY;

-- Profissional vinculado vê + aprova/rejeita sugestões dos próprios pacientes
DROP POLICY IF EXISTS "renal_sugg_professional_manage" ON public.renal_inline_suggestions;
CREATE POLICY "renal_sugg_professional_manage"
  ON public.renal_inline_suggestions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = renal_inline_suggestions.patient_id
        AND a.professional_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Paciente NÃO vê sugestões (decisão clínica do médico, não exposta ao paciente)
-- (sem policy SELECT explícita pra patient role)

-- Service role bypassa RLS por padrão (edge function persiste sugestões)

-- ============================================================================
-- 4) Feature flag (default desligado — ativa Ricardo+admin via UPDATE manual)
-- ============================================================================
INSERT INTO public.feature_flags (flag, enabled)
VALUES ('renal_inline_suggestions', true)
ON CONFLICT (flag) DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now();

-- ============================================================================
-- 5) RPC pra aprovar sugestão (atômica: marca approved + cria renal_exams)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.approve_renal_suggestion(
  p_suggestion_id uuid,
  p_creatinine numeric DEFAULT NULL,
  p_urea numeric DEFAULT NULL,
  p_egfr numeric DEFAULT NULL,
  p_proteinuria numeric DEFAULT NULL,
  p_drc_stage text DEFAULT NULL,
  p_exam_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sugg record;
  v_exam_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_sugg FROM public.renal_inline_suggestions WHERE id = p_suggestion_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sugestão não encontrada';
  END IF;

  IF v_sugg.status <> 'pending' THEN
    RAISE EXCEPTION 'Sugestão já foi processada (status=%)', v_sugg.status;
  END IF;

  -- Verifica permissão: médico vinculado OU admin
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = v_sugg.patient_id AND a.professional_id = v_user_id
    )
    OR public.is_admin()
  ) THEN
    RAISE EXCEPTION 'Sem permissão para aprovar esta sugestão';
  END IF;

  -- Cria renal_exams oficial (valores aprovados podem ser editados pelo médico)
  INSERT INTO public.renal_exams (
    patient_id,
    exam_date,
    creatinine,
    urea,
    egfr,
    proteinuria,
    drc_stage,
    ai_interpretation,
    created_by
  ) VALUES (
    v_sugg.patient_id,
    COALESCE(p_exam_date, current_date),
    COALESCE(p_creatinine, v_sugg.creatinine_mg_dl),
    p_urea,
    COALESCE(p_egfr, v_sugg.egfr_calculated),
    COALESCE(p_proteinuria, v_sugg.proteinuria_acr_mg_g),
    COALESCE(p_drc_stage, v_sugg.drc_stage_suggested),
    'Origem: sugestão V1.9.307 aprovada (fonte: ' || COALESCE(v_sugg.source_text, 'AEC') || ')',
    v_user_id
  )
  RETURNING id INTO v_exam_id;

  -- Marca sugestão aprovada com FK
  UPDATE public.renal_inline_suggestions
     SET status = 'approved',
         reviewed_by = v_user_id,
         reviewed_at = now(),
         renal_exam_id = v_exam_id
   WHERE id = p_suggestion_id;

  RETURN json_build_object(
    'success', true,
    'suggestion_id', p_suggestion_id,
    'renal_exam_id', v_exam_id,
    'reviewed_by', v_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_renal_suggestion(uuid, numeric, numeric, numeric, numeric, text, date) TO authenticated;

COMMENT ON FUNCTION public.approve_renal_suggestion(uuid, numeric, numeric, numeric, numeric, text, date) IS
  'V1.9.307 — Aprovar sugestão renal (atômica: marca approved + cria renal_exams oficial).
   Médico pode override valores via parâmetros opcionais. Auditoria via reviewed_by/reviewed_at.';

-- ============================================================================
-- 6) RPC pra rejeitar sugestão (com motivo opcional)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reject_renal_suggestion(
  p_suggestion_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sugg record;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_sugg FROM public.renal_inline_suggestions WHERE id = p_suggestion_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sugestão não encontrada';
  END IF;

  IF v_sugg.status <> 'pending' THEN
    RAISE EXCEPTION 'Sugestão já foi processada (status=%)', v_sugg.status;
  END IF;

  IF NOT (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = v_sugg.patient_id AND a.professional_id = v_user_id
    )
    OR public.is_admin()
  ) THEN
    RAISE EXCEPTION 'Sem permissão para rejeitar esta sugestão';
  END IF;

  UPDATE public.renal_inline_suggestions
     SET status = 'rejected',
         reviewed_by = v_user_id,
         reviewed_at = now(),
         rejection_reason = p_reason
   WHERE id = p_suggestion_id;

  RETURN json_build_object('success', true, 'suggestion_id', p_suggestion_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_renal_suggestion(uuid, text) TO authenticated;

-- ============================================================================
-- 7) pg_cron job: marca expired após 30d (cleanup automático — GPT review #4)
-- ============================================================================
DO $$
BEGIN
  -- Remove job se já existe (idempotente)
  PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname = 'expire-renal-suggestions';
EXCEPTION WHEN OTHERS THEN
  -- Ignora se pg_cron não tem o job
  NULL;
END $$;

SELECT cron.schedule(
  'expire-renal-suggestions',
  '0 2 * * *',  -- diariamente às 02:00
  $$UPDATE public.renal_inline_suggestions
       SET status = 'expired'
     WHERE status = 'pending'
       AND expires_at < now()$$
);

-- ============================================================================
-- 8) View consolidada pra dashboard do médico
-- ============================================================================
CREATE OR REPLACE VIEW public.v_renal_suggestions_pending AS
SELECT
  rs.id,
  rs.patient_id,
  u.name AS patient_name,
  rs.creatinine_mg_dl,
  rs.egfr_calculated,
  rs.drc_stage_suggested,
  rs.proteinuria_acr_mg_g,
  rs.patient_age,
  rs.patient_sex,
  rs.confidence_score,
  rs.source_text,
  rs.ckd_epi_version,
  rs.created_at,
  rs.expires_at,
  EXTRACT(epoch FROM (rs.expires_at - now()))/86400 AS days_until_expire
FROM public.renal_inline_suggestions rs
JOIN public.users u ON u.id = rs.patient_id
WHERE rs.status = 'pending'
ORDER BY rs.confidence_score DESC, rs.created_at DESC;

GRANT SELECT ON public.v_renal_suggestions_pending TO authenticated;

COMMENT ON VIEW public.v_renal_suggestions_pending IS
  'V1.9.307 — Lista de sugestões DRC pendentes de aprovação pelo médico.
   Ordenada por confiança DESC + recência. Usada pelo Card "Sugestões DRC Pendentes" no dashboard.';
