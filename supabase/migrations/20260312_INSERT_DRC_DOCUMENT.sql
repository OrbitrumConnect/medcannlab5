-- ============================================================
-- Fix #4: Popular tabela documents com protocolo DRC
-- Data: 12/03/2026
-- Diário: DIARIO_12_03_2026.md (Part 7, Item #4)
-- ============================================================

INSERT INTO documents (title, summary, category, target_audience, is_published, "aiRelevance")
VALUES (
  'Protocolo de Avaliação da Função Renal - DRC',
  'Protocolo para avaliação e estadiamento da Doença Renal Crônica (DRC). Inclui critérios de classificação, exames laboratoriais (creatinina, TFG, ACR) e fluxo de encaminhamento nefrológico.',
  'protocolo_clinico',
  ARRAY['admin', 'professional', 'patient', 'all'],
  true,
  0.90
)
ON CONFLICT DO NOTHING;
