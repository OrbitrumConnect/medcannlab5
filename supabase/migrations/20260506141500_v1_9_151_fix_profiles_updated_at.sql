-- ==============================================================================
-- V1.9.151 — Fix erro "record new has no field updated_at" em profiles
-- ==============================================================================
--
-- Reproduzido empíricamente Pedro 06/05 ~10:49 BRT:
--   Login admin → Profile → Editar → Salvar
--   Erro: 'record "new" has no field "updated_at"'
--
-- Causa raiz (audit empírico Claude):
--   Migration 20260219200000_add_profile_columns.sql linha 21 deixou TODO:
--     "Add updated_at trigger if not exists (optional, keeping it simple for now)"
--   Trigger foi criado DIRETO no Studio (sem migration) referenciando
--   NEW.updated_at, mas coluna nunca nasceu em public.profiles.
--   types.ts confirma: profiles tem só id/user_id/name/email/type/avatar_url/
--   created_at/slug/location/phone/bio (11 colunas, sem updated_at).
--
-- Fix: ADD COLUMN idempotente. Se trigger existir, passa a funcionar.
-- Se trigger não existir mais, coluna fica disponível pra futuro.
-- Zero risco — IF NOT EXISTS protege.
--
-- Não relacionado à V1.9.150 — bug pré-existente exposto por save de Profile
-- que sempre dava esse erro silenciosamente.
-- ==============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON COLUMN public.profiles.updated_at IS
  'V1.9.151 — Adicionada para suportar trigger criado fora de migrations (Studio direto). Resolve erro "record new has no field updated_at" em UPDATE.';

-- Backfill: rows existentes ganham timestamp (= created_at quando disponível, senão now())
UPDATE public.profiles
   SET updated_at = COALESCE(created_at, now())
 WHERE updated_at IS NULL OR updated_at = now() - interval '0';
