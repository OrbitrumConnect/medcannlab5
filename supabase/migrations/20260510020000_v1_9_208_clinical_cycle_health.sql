-- V1.9.208 — View v_clinical_cycle_health
--
-- Inteligência de negócio + observabilidade do ciclo clínico fechado.
-- Conecta: AEC → Pipeline → Devolução → Prescrição em 1 single source of truth.
--
-- Princípio aplicado: "diminuir superfície probabilística" (Princípio 37) +
-- "polir não inventar" (Princípio 8). Reusa schema existente. ZERO mudança em
-- tabelas. Apenas agregação read-only.
--
-- Casos de uso:
--   1. Dashboard admin (operacional / BI interno)
--   2. Pilot Concept Note Muhdo D+7 (KPI "closed-loop completion rate")
--   3. Auditoria CFM 2.314 / Anvisa (volumes reais auditáveis)
--   4. Validação empírica Sprint 1 (D+14 measure)
--
-- Acesso: SECURITY INVOKER (default, RLS herdado das tabelas-fonte).
--         Admin/professional veem agregados; paciente vê 0 ou bloqueado.

CREATE OR REPLACE VIEW public.v_clinical_cycle_health AS
SELECT
    -- ═══════════════════════════════════════════════════════════════
    -- Estágio 1 INTAKE — volumes de relatórios clínicos
    -- ═══════════════════════════════════════════════════════════════
    (SELECT COUNT(*) FROM clinical_reports) AS reports_total,
    (SELECT COUNT(*) FROM clinical_reports
        WHERE generated_at > NOW() - INTERVAL '7 days') AS reports_7d,
    (SELECT COUNT(*) FROM clinical_reports
        WHERE generated_at > NOW() - INTERVAL '30 days') AS reports_30d,

    -- ═══════════════════════════════════════════════════════════════
    -- Estágio 1+5 ICP-Brasil signing (CFM 2.314/2022 + Lei 14.063)
    -- ═══════════════════════════════════════════════════════════════
    (SELECT COUNT(*) FROM clinical_reports
        WHERE signature_hash IS NOT NULL) AS reports_signed_total,
    (SELECT COUNT(*) FROM clinical_reports
        WHERE signature_hash IS NOT NULL
            AND signed_at > NOW() - INTERVAL '30 days') AS reports_signed_30d,

    -- ═══════════════════════════════════════════════════════════════
    -- Estágio 3 INTERPRETATION — Devolução clínica (Sprint 1 V1.9.200)
    -- ═══════════════════════════════════════════════════════════════
    (SELECT COUNT(*) FROM clinical_reports
        WHERE review_status = 'approved') AS reports_approved_total,
    (SELECT COUNT(*) FROM clinical_reports
        WHERE review_status = 'approved'
            AND reviewed_at > NOW() - INTERVAL '7 days') AS reports_approved_7d,
    (SELECT COUNT(*) FROM clinical_reports
        WHERE review_status = 'approved'
            AND reviewed_at > NOW() - INTERVAL '30 days') AS reports_approved_30d,
    (SELECT COUNT(*) FROM clinical_reports
        WHERE review_status = 'reviewed') AS reports_reviewed_marked,
    (SELECT COUNT(*) FROM clinical_reports
        WHERE review_status = 'draft') AS reports_draft_total,

    -- SLA Devolution: tempo médio entre relatório gerado e revisado
    (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (reviewed_at - generated_at)) / 86400.0)::numeric, 1)
        FROM clinical_reports
        WHERE review_status = 'approved'
            AND reviewed_at > NOW() - INTERVAL '30 days'
            AND reviewed_at > generated_at) AS avg_review_days_30d,

    -- ═══════════════════════════════════════════════════════════════
    -- Estágio 2 STRUCTURING — Pipeline RATIONALITY (automático)
    -- ═══════════════════════════════════════════════════════════════
    (SELECT COUNT(*) FROM clinical_rationalities) AS rationalities_total,
    (SELECT COUNT(*) FROM clinical_rationalities
        WHERE created_at > NOW() - INTERVAL '30 days') AS rationalities_30d,

    -- ═══════════════════════════════════════════════════════════════
    -- Estágio 5 FORMAL_ACT — Prescrições CFM
    -- ═══════════════════════════════════════════════════════════════
    (SELECT COUNT(*) FROM cfm_prescriptions) AS prescriptions_total,
    (SELECT COUNT(*) FROM cfm_prescriptions
        WHERE status = 'draft') AS prescriptions_draft,
    (SELECT COUNT(*) FROM cfm_prescriptions
        WHERE status = 'signed') AS prescriptions_signed,
    (SELECT COUNT(*) FROM cfm_prescriptions
        WHERE status = 'sent') AS prescriptions_sent,

    -- ═══════════════════════════════════════════════════════════════
    -- Atividade IA / Nôa
    -- ═══════════════════════════════════════════════════════════════
    (SELECT COUNT(*) FROM ai_chat_interactions
        WHERE created_at > NOW() - INTERVAL '30 days') AS ai_chats_30d,
    (SELECT COUNT(*) FROM noa_logs
        WHERE created_at > NOW() - INTERVAL '30 days') AS noa_logs_30d,

    -- ═══════════════════════════════════════════════════════════════
    -- Pessoas + completude cadastral profissional (V1.9.207 CFM)
    -- ═══════════════════════════════════════════════════════════════
    (SELECT COUNT(*) FROM users
        WHERE type IN ('paciente', 'patient')) AS patients_total,
    (SELECT COUNT(*) FROM users
        WHERE type IN ('profissional', 'professional')) AS professionals_total,
    (SELECT COUNT(*) FROM users
        WHERE type IN ('profissional', 'professional')
            AND consultation_fee_default IS NOT NULL) AS professionals_with_fee,
    (SELECT COUNT(*) FROM users
        WHERE type IN ('profissional', 'professional')
            AND council_state IS NOT NULL
            AND council_state != '') AS professionals_with_council_state,

    -- ═══════════════════════════════════════════════════════════════
    -- KPI âncora Muhdo D+7: Closed-Loop Completion Rate (30d)
    -- = % reports gerados nos últimos 30d que viraram review_status='approved'
    -- ═══════════════════════════════════════════════════════════════
    CASE
        WHEN (SELECT COUNT(*) FROM clinical_reports
                WHERE generated_at > NOW() - INTERVAL '30 days') > 0
        THEN ROUND(
            (SELECT COUNT(*)::numeric FROM clinical_reports
                WHERE review_status = 'approved'
                    AND generated_at > NOW() - INTERVAL '30 days') * 100 /
            (SELECT COUNT(*)::numeric FROM clinical_reports
                WHERE generated_at > NOW() - INTERVAL '30 days'),
            2
        )
        ELSE 0
    END AS closed_loop_completion_rate_30d_pct,

    -- ═══════════════════════════════════════════════════════════════
    -- KPI: ICP signing rate (30d) — % reports gerados que foram assinados
    -- ═══════════════════════════════════════════════════════════════
    CASE
        WHEN (SELECT COUNT(*) FROM clinical_reports
                WHERE generated_at > NOW() - INTERVAL '30 days') > 0
        THEN ROUND(
            (SELECT COUNT(*)::numeric FROM clinical_reports
                WHERE signature_hash IS NOT NULL
                    AND generated_at > NOW() - INTERVAL '30 days') * 100 /
            (SELECT COUNT(*)::numeric FROM clinical_reports
                WHERE generated_at > NOW() - INTERVAL '30 days'),
            2
        )
        ELSE 0
    END AS icp_signing_rate_30d_pct,

    -- ═══════════════════════════════════════════════════════════════
    -- Snapshot timestamp
    -- ═══════════════════════════════════════════════════════════════
    NOW() AS snapshot_at
;

COMMENT ON VIEW public.v_clinical_cycle_health IS
'V1.9.208 — Observabilidade do ciclo clínico fechado (AEC → Pipeline → Devolução → Prescrição).
Single source of truth para BI interno + Pilot Concept Note Muhdo D+7 + auditoria CFM.
Read-only aggregation, security_invoker (RLS herdado).';
