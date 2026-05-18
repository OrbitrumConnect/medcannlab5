-- V1.9.329 — Card persistente pós-aprovação + Arquivar manual (Pedro+Ricardo 17/05 16h)
-- Ricardo aprovou Maria via V1.9.328 mas card sumiu sem feedback. Solução: card persiste 30d
-- com estado visual aprovado/rejeitado + botão "Arquivar" manual + link "Ver Saúde Renal".
-- Princípio Clinical Cockpit (cor por estado) + Linguagem estado real (X aprovou em Y).
-- Pré-PMF: 1 médico, 1 aprovação. Pós: trigger >50 archived/médico → aba dedicada V1.9.X+N.

-- 1. Adicionar 'archived' ao CHECK constraint de status
ALTER TABLE public.renal_inline_suggestions
    DROP CONSTRAINT IF EXISTS renal_inline_suggestions_status_check;

ALTER TABLE public.renal_inline_suggestions
    ADD CONSTRAINT renal_inline_suggestions_status_check
    CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'expired'::text, 'archived'::text]));

-- 2. Colunas de auditoria do archive
ALTER TABLE public.renal_inline_suggestions
    ADD COLUMN IF NOT EXISTS archived_at timestamptz,
    ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.renal_inline_suggestions.archived_at IS 'V1.9.329 — quando médico arquivou pra tirar do dashboard ativo';
COMMENT ON COLUMN public.renal_inline_suggestions.archived_by IS 'V1.9.329 — quem arquivou (auditoria)';

-- 3. View nova: pending + approved/rejected últimos 30d, exclui archived
-- Substitui v_renal_suggestions_pending no frontend (legado mantido por compat caso outro componente use)
CREATE OR REPLACE VIEW public.v_renal_suggestions_active AS
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
    rs.status,
    rs.reviewed_at,
    rs.reviewed_by,
    reviewer.name AS reviewer_name,
    rs.rejection_reason,
    rs.renal_exam_id,
    EXTRACT(epoch FROM rs.expires_at - now()) / 86400::numeric AS days_until_expire
FROM public.renal_inline_suggestions rs
JOIN public.users u ON u.id = rs.patient_id
LEFT JOIN public.users reviewer ON reviewer.id = rs.reviewed_by
WHERE
    rs.status = 'pending'
    OR (rs.status IN ('approved', 'rejected') AND rs.reviewed_at > now() - interval '30 days')
ORDER BY
    -- Pending primeiro (urgência), depois approved (revisão recente), depois rejected
    CASE rs.status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'rejected' THEN 3
        ELSE 4
    END,
    rs.confidence_score DESC NULLS LAST,
    rs.created_at DESC;

COMMENT ON VIEW public.v_renal_suggestions_active IS 'V1.9.329 — view ativa: pending sempre + approved/rejected últimos 30d. Inclui reviewer_name (JOIN) pra UI mostrar quem aprovou.';

-- 4. RPC archive_renal_suggestion (mesmo padrão segurança das outras: vínculo OR admin)
CREATE OR REPLACE FUNCTION public.archive_renal_suggestion(p_suggestion_id uuid)
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

    -- Só pode arquivar sugestões já revisadas (approved/rejected). Pending deve ser aprovada/rejeitada antes.
    IF v_sugg.status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Só sugestões revisadas podem ser arquivadas (status atual: %)', v_sugg.status;
    END IF;

    -- Permissão: médico vinculado OU admin (mesmo padrão approve/reject)
    IF NOT (
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.patient_id = v_sugg.patient_id AND a.professional_id = v_user_id
        )
        OR public.is_admin()
    ) THEN
        RAISE EXCEPTION 'Sem permissão para arquivar esta sugestão';
    END IF;

    UPDATE public.renal_inline_suggestions
       SET status = 'archived',
           archived_at = now(),
           archived_by = v_user_id
     WHERE id = p_suggestion_id;

    RETURN json_build_object(
        'success', true,
        'suggestion_id', p_suggestion_id,
        'archived_by', v_user_id
    );
END;
$$;

COMMENT ON FUNCTION public.archive_renal_suggestion IS 'V1.9.329 — arquiva sugestão revisada pra tirar do dashboard. Mesmo padrão RLS approve/reject.';

GRANT EXECUTE ON FUNCTION public.archive_renal_suggestion(uuid) TO authenticated;

-- 5. Index pra performance (queries por status + reviewed_at)
CREATE INDEX IF NOT EXISTS idx_renal_suggestions_status_reviewed
    ON public.renal_inline_suggestions(status, reviewed_at DESC)
    WHERE status IN ('approved', 'rejected', 'archived');
