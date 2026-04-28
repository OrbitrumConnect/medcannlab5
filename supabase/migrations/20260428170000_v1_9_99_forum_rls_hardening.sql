-- Migration: V1.9.99 — fórum RLS hardening (vazamento de allowed_roles)
-- Data: 28/04/2026 ~17h BRT
--
-- Contexto: audit empírico das RLS de forum_posts revelou 3 policies SELECT
-- conflitantes:
--   1. "read_forum_posts"                       qual: TRUE     🚨 sempre libera
--   2. "Anyone can view active forum posts"     qual: is_active 🟡 ignora allowed_roles
--   3. "Users can view posts based on allowed_roles" 🟢 única correta
--
-- Postgres aplica OR entre policies SELECT → policy 1 (qual: true) NEUTRALIZA
-- as outras → allowed_roles está IGNORADO na prática.
--
-- Em forum_comments também havia "Anyone can view forum comments" (qual: true).
--
-- IMPACTO: paciente podia ver post marcado allowed_roles=['professional'].
-- Bug de governança/clínico/regulatório real (broadcast escala rápido).
--
-- ESTADO ANTES (28/04 ~17h): 0 posts, 0 comments. Fix preventivo, zero
-- regressão de dado.
--
-- Doc arquitetural completo: docs/CHAT_AUTH_MATRIX.md

BEGIN;

-- ── forum_posts ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "read_forum_posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Anyone can view active forum posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can view posts based on allowed_roles" ON public.forum_posts;

-- Policy unificada — combina is_active + allowed_roles em single check
CREATE POLICY "forum_posts_select_active_with_role_check"
  ON public.forum_posts
  FOR SELECT
  USING (
    is_active = true
    AND (
      is_admin()
      OR allowed_roles IS NULL
      OR allowed_roles = '{}'::text[]
      OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND (u.type)::text = ANY(allowed_roles)
      )
    )
  );

-- ── forum_comments ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view forum comments" ON public.forum_comments;

-- Policy nova — comments seguem visibilidade do post pai
CREATE POLICY "forum_comments_select_via_post"
  ON public.forum_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_posts p
      WHERE p.id = forum_comments.post_id
        AND p.is_active = true
        AND (
          is_admin()
          OR p.allowed_roles IS NULL
          OR p.allowed_roles = '{}'::text[]
          OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND (u.type)::text = ANY(p.allowed_roles)
          )
        )
    )
  );

-- forum_likes / forum_views: mantidos públicos (telemetria, sem dado clínico)

COMMIT;

-- Smoke test:
--   SELECT tablename, COUNT(*) AS select_policies FROM pg_policies
--    WHERE schemaname='public' AND tablename IN ('forum_posts','forum_comments')
--      AND cmd='SELECT' GROUP BY tablename;
--   Esperado: forum_posts=1, forum_comments=1
