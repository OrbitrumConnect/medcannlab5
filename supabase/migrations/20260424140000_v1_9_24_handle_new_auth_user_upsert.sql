-- V1.9.24 — handle_new_auth_user: DO NOTHING → DO UPDATE (COALESCE preservativo)
--
-- Contexto: 5 triggers AFTER INSERT em auth.users. Três deles (on_auth_user_created_profile,
-- trg_auth_users_to_user_profiles/trg_handle_new_auth_user, trg_link_existing_user) inserem
-- em user_profiles com ON CONFLICT DO NOTHING. Pela ordem alfabética, o primeiro
-- (handle_new_user_profile) ganha e insere só user_id + points=0 + level=1.
-- handle_new_auth_user roda depois, bate conflict, desiste — email/full_name/role
-- ficam NULL.
--
-- Validado 24/04/2026 antes do backfill V1.9.14:
--   34 user_profiles totais → 0 com full_name, 10 sem email, 15 sem role.
--
-- Fix cirúrgico (V1.9.24) — NÃO reinventa, NÃO consolida triggers, NÃO dropa nada:
--   Só muda o DO NOTHING para DO UPDATE com COALESCE(existing, EXCLUDED) em cada campo.
--   Efeito: handle_new_auth_user agora COMPLETA campos deixados NULL pelo primeiro
--   trigger, sem sobrescrever dados já presentes.
--
-- Também expande as fontes de full_name e role (paridade com o backfill V1.9.14):
--   full_name: raw_user_meta_data.full_name → raw_user_meta_data.name → split(email, '@', 0)
--   role: raw_user_meta_data.type → raw_user_meta_data.role
--
-- Reversível: CREATE OR REPLACE FUNCTION recriar a versão antiga.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $fn$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'type',
      NEW.raw_user_meta_data->>'role'
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(public.user_profiles.email, EXCLUDED.email),
    full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
    role = COALESCE(public.user_profiles.role, EXCLUDED.role);
  RETURN NEW;
END;
$fn$;
