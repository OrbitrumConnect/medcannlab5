-- V1.9.190 — swap de roles do Dr. Eduardo Faveret
-- ====================================================================
-- Pedido explícito do Eduardo (via Pedro, 08/05 ~00h45 BRT):
--   "Eduardo entra como pro com gmail. O dele admin é o hotmail."
--
-- Estado ANTES (auditado live 08/05 00h):
--   gmail   eduardoscfaveret@gmail.com   (f4a62265-...)
--     type=admin, is_official=false
--     user_roles=['admin', 'profissional']
--   hotmail eduardo.faveret@hotmail.com  (5a9ada8b-...)
--     type=professional, is_official=true
--     user_roles=['profissional']
--
-- Estado DESEJADO:
--   gmail   = profissional oficial (atende paciente, prescreve, assina ICP)
--     type=professional, is_official=true
--     user_roles=['profissional']
--   hotmail = admin (gestão da plataforma, sem prescrição)
--     type=admin, is_official=false
--     user_roles=['admin']
--
-- Razão: Eduardo prefere usar gmail no clínico do dia-a-dia (já habitual,
-- last_seen recente). Hotmail fica como "sala de comando" admin.
-- Pattern segue Ricardo (rrvalenca=clínico oficial / iaianoaesperanza=admin).
--
-- Regressão: NENHUMA estrutural. Apenas remapping de identidade entre as 2
-- contas que já existiam. Conta gmail recebe is_official=true (importante
-- para signing CFM 2.314). Conta hotmail perde is_official.
--
-- ⚠️ Importante: depois desta migration, V1.9.189 NÃO cobre mais Eduardo
-- gmail (não é mais admin) — em call profissional⇄profissional ele será
-- callee e bate 403 ao salvar telemetria. Issue conhecido, afeta apenas
-- registro pós-call (não a call em si). Backlog.

-- 1. SWAP gmail → professional/oficial
UPDATE public.users SET
  type = 'professional',
  is_official = true
WHERE id = 'f4a62265-8982-44db-8282-78129c4d014a'
  AND email = 'eduardoscfaveret@gmail.com';

DELETE FROM public.user_roles
WHERE user_id = 'f4a62265-8982-44db-8282-78129c4d014a'
  AND role = 'admin';

-- garante role 'profissional' (já existia, mas idempotente)
INSERT INTO public.user_roles (user_id, role)
VALUES ('f4a62265-8982-44db-8282-78129c4d014a', 'profissional')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. SWAP hotmail → admin
UPDATE public.users SET
  type = 'admin',
  is_official = false
WHERE id = '5a9ada8b-cf36-467c-8248-a76c943f7e66'
  AND email = 'eduardo.faveret@hotmail.com';

DELETE FROM public.user_roles
WHERE user_id = '5a9ada8b-cf36-467c-8248-a76c943f7e66'
  AND role = 'profissional';

INSERT INTO public.user_roles (user_id, role)
VALUES ('5a9ada8b-cf36-467c-8248-a76c943f7e66', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Smoke pós-aplicação (visível no resultado da query)
SELECT
  u.email,
  u.type,
  u.is_official,
  array_agg(ur.role ORDER BY ur.role) AS roles
FROM public.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.id IN (
  'f4a62265-8982-44db-8282-78129c4d014a',
  '5a9ada8b-cf36-467c-8248-a76c943f7e66'
)
GROUP BY u.id, u.email, u.type, u.is_official
ORDER BY u.email;
