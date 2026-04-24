-- V1.9.14 — Backfill de user_profiles
--
-- Contexto: triggers redundantes em auth.users todos inserem em user_profiles
-- com ON CONFLICT DO NOTHING. Primeiro a rodar (handle_new_user_profile) insere
-- só user_id + points=0 + level=1, e os outros batem conflict → campos
-- email/full_name/role ficam NULL mesmo quando auth.users tem metadata.
--
-- Aplicado em prod 2026-04-24: 27 user_profiles corrigidos. Verificação:
-- antes = 24/0/19 (email/full_name/role), depois = 27/27/34.
--
-- Ver docs/ANALISE_TRIGGERS_AUTH_USERS_24_04_2026.md para mapa completo e
-- proposta de consolidação dos triggers.

UPDATE public.user_profiles p
SET
  email = COALESCE(p.email, au.email),
  full_name = COALESCE(
    p.full_name,
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  role = COALESCE(
    p.role,
    au.raw_user_meta_data->>'type',
    au.raw_user_meta_data->>'role'
  )
FROM auth.users au
WHERE p.user_id = au.id
  AND (p.email IS NULL OR p.full_name IS NULL OR p.role IS NULL);
