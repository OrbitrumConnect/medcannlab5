-- ============================================================================
-- RLS AUDIT GATE — Versão V1.9.50 (expandida pós-falso-positivo de 25/04/2026)
--
-- Histórico:
--   V1 (data desconhecida): cobria 12 tabelas críticas, usava `relrowsecurity`
--                           pra checar tabelas (correto pra `relkind='r'`).
--   V2 (25/04/2026):        expandida pra cobrir TODAS as tabelas + views,
--                           split WARN/FAIL, whitelist explícita de backups.
--
-- Erro que esta versão evita:
--   Em 25/04/2026 afirmamos "26 views sem RLS" baseado em query que usava
--   `pg_class.relrowsecurity` em views. `relrowsecurity` é flag de TABELA
--   (`relkind='r'`), nunca é true em VIEW. Proteção de view se dá por
--   `pg_class.reloptions` contendo `security_invoker=on/true`.
--
-- Output:
--   Cinco result sets concatenados via UNION ALL, cada linha com:
--     severity TEXT  ('FAIL' | 'WARN' | 'OK_INFO')
--     check_id TEXT  (identificador da regra)
--     object   TEXT  (nome da tabela/view/policy)
--     detail   TEXT  (descrição do que foi encontrado)
--
--   FAIL    → bloqueia deploy no CI (categoria 1, 2)
--   WARN    → não bloqueia, mas anota (categoria 3, 4)
--   OK_INFO → contagem informativa (categoria 5)
--
-- Lê o resultado em `scripts/audit_rls_gate.js` que faz exit code 1 se FAIL>0.
-- ============================================================================

WITH
-- ============================================================
-- Whitelist de tabelas backup INTENCIONAIS com RLS=on + 0 policies.
-- Padrão estabelecido: ENABLE RLS sem CREATE POLICY = só service_role acessa.
-- Backups preservados pra rollback eventual sem exposição via PostgREST.
-- ============================================================
backup_whitelist AS (
  SELECT unnest(ARRAY[
    'clinical_reports_consent_backup_v1_9_39',
    'clinical_reports_content_backup_24_04',
    'documents_backup_23_04_2026',
    'generated_slides_archive'
  ]) AS tabela
),

-- ============================================================
-- Lista de tabelas CRÍTICAS — qualquer uma sem policy = FAIL.
-- Tabelas que armazenam dado sensível (clínico, financeiro, autenticação,
-- comunicação privada). Tabelas fora desta lista podem ter 0 policies sem
-- ser FAIL (vira WARN se relrowsecurity=true sem policy).
-- ============================================================
critical_tables AS (
  SELECT unnest(ARRAY[
    -- Clínico
    'users', 'clinical_reports', 'clinical_assessments', 'clinical_rationalities',
    'clinical_axes', 'clinical_kpis', 'cfm_prescriptions', 'appointments',
    'patient_medical_records', 'aec_assessment_state',
    -- Comunicação privada
    'ai_chat_interactions', 'chat_messages', 'chat_rooms', 'chat_participants',
    'video_call_requests', 'video_call_sessions',
    -- Auditoria + identidade
    'noa_logs', 'notifications', 'user_profiles', 'user_roles',
    -- Financeiro
    'payment_transactions', 'wallets', 'wallet_transactions'
  ]) AS tabela
),

-- ============================================================
-- Estado atual de tabelas: relrowsecurity + contagem de policies
-- ============================================================
tables_state AS (
  SELECT
    c.relname AS tabela,
    c.relrowsecurity AS rls_on,
    COUNT(p.policyname) AS policies
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_policies p ON p.tablename = c.relname AND p.schemaname = n.nspname
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  GROUP BY c.relname, c.relrowsecurity
),

-- ============================================================
-- Estado atual de views: reloptions[security_invoker]
-- ============================================================
views_state AS (
  SELECT
    c.relname AS view_name,
    CASE
      WHEN c.reloptions::text ILIKE '%security_invoker=on%'
        OR c.reloptions::text ILIKE '%security_invoker=true%'
      THEN true
      ELSE false
    END AS security_invoker_on
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'v'
),

-- ============================================================
-- CHECK 1 (FAIL) — Tabela com RLS=off
-- Toda tabela em public deve ter RLS habilitada.
-- ============================================================
check_rls_off AS (
  SELECT
    'FAIL'::text AS severity,
    'rls_off'::text AS check_id,
    ts.tabela AS object,
    'Tabela sem RLS habilitada — qualquer chamada via anon/authenticated lê os dados.'::text AS detail
  FROM tables_state ts
  WHERE ts.rls_on = false
),

-- ============================================================
-- CHECK 2 (FAIL) — Tabela crítica com 0 policies (não whitelist)
-- Tabela sensível com RLS on mas 0 policies = bloqueia anon/authenticated
-- (comportamento desejado pra backups), MAS críticas devem ter policies.
-- ============================================================
check_critical_no_policy AS (
  SELECT
    'FAIL'::text AS severity,
    'critical_table_zero_policies'::text AS check_id,
    ts.tabela AS object,
    'Tabela crítica com RLS on mas zero policies — usuários autenticados legítimos não conseguem acessar.'::text AS detail
  FROM tables_state ts
  JOIN critical_tables ct ON ct.tabela = ts.tabela
  LEFT JOIN backup_whitelist bw ON bw.tabela = ts.tabela
  WHERE ts.rls_on = true
    AND ts.policies = 0
    AND bw.tabela IS NULL
),

-- ============================================================
-- CHECK 3 (WARN) — View sem security_invoker
-- View bypassa RLS por default (security_definer). Em sistema clínico,
-- toda view deve ter security_invoker=on para herdar RLS da tabela base.
-- ============================================================
check_view_no_invoker AS (
  SELECT
    'WARN'::text AS severity,
    'view_no_security_invoker'::text AS check_id,
    vs.view_name AS object,
    'View sem security_invoker — bypassa RLS da tabela base. Adicionar: ALTER VIEW ' || vs.view_name || ' SET (security_invoker = on);'::text AS detail
  FROM views_state vs
  WHERE vs.security_invoker_on = false
),

-- ============================================================
-- CHECK 4 (WARN) — Policy com qual=true sem auth check
-- Heurística: policy USING true sem referência a auth/role/admin.
-- Pode ser legítimo (read-public para forum, courses, etc) — só WARN.
-- ============================================================
check_permissive_policies AS (
  SELECT
    'WARN'::text AS severity,
    'permissive_policy'::text AS check_id,
    (p.tablename || '.' || p.policyname || ' (' || p.cmd || ')') AS object,
    ('Policy com qual permissivo sem auth check explícito — auditar se é read-public legítimo: ' || COALESCE(p.qual, '<no qual>'))::text AS detail
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.qual ILIKE '%true%'
    AND p.qual NOT ILIKE '%auth.uid%'
    AND p.qual NOT ILIKE '%auth.email%'
    AND p.qual NOT ILIKE '%auth.role%'
    AND p.qual NOT ILIKE '%is_admin%'
    AND p.qual NOT ILIKE '%has_role%'
    AND p.qual NOT ILIKE '%check_%'
    AND p.qual NOT ILIKE '%get_current%'
),

-- ============================================================
-- CHECK 5 (OK_INFO) — Backups whitelisted operando como esperado
-- Confirmação positiva: backups têm RLS on + 0 policies (intencional).
-- Não é problema, mas ajuda revisor confirmar que whitelist está sendo
-- aplicada corretamente.
-- ============================================================
check_backups_ok AS (
  SELECT
    'OK_INFO'::text AS severity,
    'backup_whitelisted'::text AS check_id,
    bw.tabela AS object,
    'Backup intencional — RLS on + 0 policies (apenas service_role acessa via PostgREST).'::text AS detail
  FROM backup_whitelist bw
  JOIN tables_state ts ON ts.tabela = bw.tabela
  WHERE ts.rls_on = true AND ts.policies = 0
)

-- ============================================================
-- RESULTADO CONSOLIDADO
-- ============================================================
SELECT severity, check_id, object, detail
FROM (
  SELECT severity, check_id, object, detail FROM check_rls_off
  UNION ALL
  SELECT severity, check_id, object, detail FROM check_critical_no_policy
  UNION ALL
  SELECT severity, check_id, object, detail FROM check_view_no_invoker
  UNION ALL
  SELECT severity, check_id, object, detail FROM check_permissive_policies
  UNION ALL
  SELECT severity, check_id, object, detail FROM check_backups_ok
) AS all_checks
ORDER BY
  CASE severity WHEN 'FAIL' THEN 0 WHEN 'WARN' THEN 1 ELSE 2 END,
  check_id,
  object;
