-- V1.9.560-C — RLS tighten Variante 1 (preserva paciente atual)
-- Decisao Pedro 02/jun: documento do profissional eh DELE; outros prof e alunos
-- nao veem. Compartilhamento curado continua via Forum (V1.9.403-410).
--
-- ANTES (policy permissiva):
--   USING ((uploaded_by = auth.uid())
--          OR has_role('admin')
--          OR has_role('profissional')   <-- TODO profissional ve TUDO (gap raiz)
--          OR (is_published = true))
--
-- DEPOIS (policy ciruurgica preservando paciente):
--   USING ((uploaded_by = auth.uid())       -- owner sempre
--          OR has_role('admin')              -- admin ve tudo
--          OR (is_curated = true AND
--              (has_role('profissional')     -- prof ve curadoria
--               OR has_role('aluno')))       -- aluno ve curadoria
--          OR (is_published = true))         -- paciente igual antes (publicado)
--
-- Pre-condicao: V1.9.560-A garantiu is_curated=true em 43/43 docs historicos
-- (zero regressao de acesso historico para prof e aluno).
-- Paciente continua vendo APENAS is_published=true (40 docs) sem mudanca.

BEGIN;

DROP POLICY IF EXISTS docs_select_authenticated ON public.documents;

CREATE POLICY docs_select_authenticated
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    (uploaded_by = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (
      is_curated = true
      AND (
        has_role(auth.uid(), 'profissional'::app_role)
        OR has_role(auth.uid(), 'aluno'::app_role)
      )
    )
    OR (is_published = true)
  );

COMMENT ON POLICY docs_select_authenticated ON public.documents IS
  'V1.9.560-C (02/06/2026): tighten SELECT. Profissional/aluno ve curadoria + proprios docs; paciente ve apenas is_published=true (preserva acesso historico); admin ve tudo. Fecha gap raiz onde TODO profissional via TUDO.';

COMMIT;
