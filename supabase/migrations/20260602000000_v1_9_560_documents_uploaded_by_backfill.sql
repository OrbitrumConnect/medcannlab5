-- V1.9.560-A — Backend prep para separacao visual Curadoria vs Meus Documentos
-- Cenario 3 defensivo: todos docs historicos = is_curated=true (preserva acesso atual)
-- Backfill uploaded_by por author (Ricardo + Eduardo) + trigger BEFORE INSERT
-- ZERO impacto runtime: nao mexe em RLS, nao toca dados clinicos.

BEGIN;

-- ============================================================
-- 1. Backfill uploaded_by por author (rastreabilidade)
-- ============================================================

-- Dr. Ricardo Valenca (com e sem prefixo "Dr.") -> conta professional
UPDATE public.documents
SET uploaded_by = '2135f0c0-eb5a-43b1-bc00-5f8dfea13561'
WHERE uploaded_by IS NULL
  AND author IN ('Dr. Ricardo Valença', 'Ricardo Valença');

-- Dr. Eduardo Faveret -> conta professional
UPDATE public.documents
SET uploaded_by = 'f4a62265-8982-44db-8282-78129c4d014a'
WHERE uploaded_by IS NULL
  AND author = 'Dr. Eduardo Faveret';

-- ============================================================
-- 2. Backfill is_curated=true em qualquer doc faltando (DEFENSIVO)
-- Preserva acesso historico: todos os 43 docs viram parte da curadoria
-- Novos uploads futuros: is_curated default false (privado por padrao)
-- ============================================================

UPDATE public.documents
SET is_curated = true
WHERE is_curated IS DISTINCT FROM true;

-- ============================================================
-- 3. Trigger BEFORE INSERT: garante uploaded_by populado automaticamente
-- Frontend nao precisa setar explicitamente; auth.uid() resolve.
-- ============================================================

CREATE OR REPLACE FUNCTION public.documents_set_uploaded_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $func$
BEGIN
  IF NEW.uploaded_by IS NULL THEN
    NEW.uploaded_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_documents_set_uploaded_by ON public.documents;

CREATE TRIGGER trg_documents_set_uploaded_by
  BEFORE INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.documents_set_uploaded_by();

COMMENT ON FUNCTION public.documents_set_uploaded_by() IS
  'V1.9.560-A (01/06/2026): garante uploaded_by populado em todos os INSERTs futuros. Frontend Library.tsx nao precisa setar manualmente; auth.uid() resolve via trigger. RLS docs_insert_own depende deste campo.';

COMMIT;
