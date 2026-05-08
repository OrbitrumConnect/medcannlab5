-- V1.9.x — Backfill de profiles órfãs (user_id NULL onde id ∈ users.id)
-- ====================================================================
-- Pedro reportou 07/05 noite: Ricardo logou em rrvalenca (professional id
-- 2135f0c0), preencheu Profile, salvou. users(2135f0c0) atualizou OK
-- (specialty, fee=400, years=36). MAS profiles ficou ÓRFÃO:
--   id=2135f0c0 (= user.id), user_id=NULL
-- Causa: Profile.tsx:253 fazia upsert({id: user.id, ...}) sem user_id.
-- Resultado: row criada com PK certa mas FK NULL → JOIN falha em
-- PatientAppointments → paciente vê fallback em vez do dado real.
--
-- Fix em código (V1.9.x): Profile.tsx:253-262 agora inclui user_id: user.id
-- no upsert. Próximas saves não geram órfãs.
--
-- Esta migration faz backfill das órfãs existentes onde id == users.id
-- (caso muito comum, gerado pelo bug). Idempotente — re-rodar não muda nada.
-- Aplicada empiricamente via PAT 07/05 ~01h BRT.

UPDATE public.profiles p
SET user_id = p.id
FROM public.users u
WHERE p.user_id IS NULL
  AND p.id = u.id;

-- Smoke esperado pós-aplicar:
--   SELECT count(*) FROM profiles WHERE user_id IS NULL AND id IN (SELECT id FROM users)
--   → 0
