-- V1.9.328 — Fix numeric field overflow em renal_exams.proteinuria
-- Bug Ricardo+Pedro 17/05: Maria das Dores A/Cr=1924 mg/g estoura NUMERIC(5,2) max 999.99
-- Espelha precisão de renal_inline_suggestions.proteinuria_acr_mg_g (NUMERIC 8,2)
-- Princípio polir-não-inventar: alinhar schema das duas tabelas que conversam.

ALTER TABLE public.renal_exams
    ALTER COLUMN proteinuria TYPE numeric(8,2);

COMMENT ON COLUMN public.renal_exams.proteinuria IS 'V1.9.328 — NUMERIC(8,2) pra suportar A/Cr até 999.999,99 mg/g (proteinúria nefrótica >3g/g é clínico real). Antes era (5,2) e estourava na aprovação V1.9.307.';
