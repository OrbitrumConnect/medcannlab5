-- =====================================================
-- V1.9.614 — v_clinical_signals (feed unificado dos 4 sidecars)
-- =====================================================
-- Fundação do cockpit de triagem: UNION normalizada das 4 tabelas de sinal
-- (renal/neuro/relato/cannabis) numa fonte única que a UI lê com filtros.
-- Escala por agregação, não por multiplicar cards. Domínio #5 entra na union.
--
-- security_invoker=true: a view RESPEITA a RLS de cada tabela base (cada médico
-- só vê os sinais dos SEUS pacientes; admin vê todos). Sem isso, view rodaria
-- como owner e VAZARIA sinais de outros pacientes — risco fechado aqui.
--
-- ZERO REGRESSÃO: view read-only, aditiva. Não toca tabelas, Edges, nem cards.
-- Normalização: neuro.transtorno→dominio; renal (lab) → dominio='RENAL',
-- subcategoria=estágio, fala_literal=source_text, confianca=score*100, report_id=NULL.
-- =====================================================

CREATE OR REPLACE VIEW public.v_clinical_signals
  WITH (security_invoker = true) AS
  SELECT id, patient_id, report_id, 'NEURO'::text AS tipo,
         transtorno AS dominio, subcategoria, fala_literal, confianca,
         status, reviewed_by, reviewed_at, created_at
  FROM public.clinical_neuro_signals
  UNION ALL
  SELECT id, patient_id, report_id, 'RELATO'::text AS tipo,
         dominio, subcategoria, fala_literal, confianca,
         status, reviewed_by, reviewed_at, created_at
  FROM public.clinical_reported_signals
  UNION ALL
  SELECT id, patient_id, report_id, 'CANNABIS'::text AS tipo,
         dominio, subcategoria, fala_literal, confianca,
         status, reviewed_by, reviewed_at, created_at
  FROM public.clinical_cannabis_signals
  UNION ALL
  SELECT id, patient_id, NULL::text AS report_id, 'RENAL'::text AS tipo,
         'RENAL'::text AS dominio,
         COALESCE(drc_stage_suggested, 'sugestão') AS subcategoria,
         source_text AS fala_literal,
         ROUND(COALESCE(confidence_score, 0) * 100)::int AS confianca,
         status, reviewed_by, reviewed_at, created_at
  FROM public.renal_inline_suggestions;

COMMENT ON VIEW public.v_clinical_signals IS
  'Feed unificado dos 4 sidecars cognitivos (renal/neuro/relato/cannabis) V1.9.614. security_invoker=true (respeita RLS de cada tabela base). Fundação do cockpit de triagem priorizada. Read-only, aditiva.';
