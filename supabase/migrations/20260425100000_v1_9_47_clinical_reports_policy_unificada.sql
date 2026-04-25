-- V1.9.47 — Unificar policy "Reports access" de clinical_reports
--
-- Contexto:
--   Policy atual tem hardcode de 2 emails (Pedro + João), criada quando havia
--   apenas eles como admins. Hoje há 4 sócios fundadores (Pedro CTO, João,
--   Ricardo, Eduardo) + admin.test + futuros admins. Admins não-hardcoded
--   só vêem reports onde aparecem como prof/doctor/patient — gap real que
--   aparece quando view v_clinical_reports virar security_invoker.
--
--   Análise externa (GPT) apontou 3 melhorias sobre proposta inicial:
--     1. Hardcode email = dívida técnica (email é mutável)
--     2. UID > email (chave estável vs string mutável)
--     3. is_admin() deve ser fonte principal de verdade, hardcode = exceção
--
-- Fix:
--   - is_admin() vira fonte principal (cobre 5 admins atuais + futuros)
--   - Break-glass via UUID (não email) — 4 sócios fundadores como redundância
--     caso is_admin() falhe ou seja modificado
--   - Vínculos clínicos preservados (professional_id, doctor_id, patient_id)
--
-- Resultado:
--   - Migration AMPLIA acesso, não restringe
--   - Quem via antes (Pedro+João via email; profissionais/pacientes via vínculo)
--     continua vendo
--   - Eduardo+Ricardo iaianoa+admin.test passam a ver tudo (eram lacuna pre-existente)
--   - Profissionais externos (Cristina, Inoã, Lucas, Tércio, Marcelo, Dayana)
--     continuam vendo apenas reports onde têm vínculo
--
-- Débito futuro registrado (memória project_clinical_reports_policy_evolution):
--   Em ~6 meses, após confirmar estabilidade de is_admin() via testes E2E,
--   considerar remover break-glass UUID e usar is_admin() como única fonte.

BEGIN;

-- Snapshot defensivo da policy atual (em comentário para reversão manual):
-- POLICY ANTIGA "Reports access":
--   ((auth.email() = ANY (ARRAY['phpg69@gmail.com', 'cbdrcpremium@gmail.com']))
--    OR (professional_id = auth.uid())
--    OR (doctor_id = auth.uid())
--    OR (patient_id = auth.uid()))

DROP POLICY IF EXISTS "Reports access" ON clinical_reports;

CREATE POLICY "Reports access" ON clinical_reports
  FOR ALL
  USING (
    -- Fonte principal: qualquer admin via users.type='admin'
    -- (cobre 5 admins atuais + admin.test + futuros admins regulares)
    is_admin()

    -- Break-glass redundante via UUID estável (NÃO email mutável):
    -- camada de defesa caso is_admin() falhe ou seja modificada.
    -- Não remover sem alternativa de recovery configurada.
    OR auth.uid() = ANY (ARRAY[
      '17345b36-50de-4112-bf78-d7c5d9342cdb'::uuid,  -- Pedro Galluf (CTO, phpg69@gmail.com)
      'f62c3f62-1d7e-44f1-bec9-6f3c40ece391'::uuid,  -- João Eduardo Vidal (sócio admin, cbdrcpremium@gmail.com)
      '99286e6f-b309-41ad-8dca-cfbb80aa7666'::uuid,  -- Dr. Ricardo Valença (fundador médico, conta admin iaianoaesperanza)
      'f4a62265-8982-44db-8282-78129c4d014a'::uuid   -- Dr. Eduardo Faveret (fundador ensino, conta admin eduardoscfaveret)
    ])

    -- Vínculos clínicos legítimos (preservados da policy original):
    OR professional_id = auth.uid()
    OR doctor_id = auth.uid()
    OR patient_id = auth.uid()
  );

-- Assert: garantir que policy foi recriada exatamente uma vez
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'clinical_reports'
    AND policyname = 'Reports access';

  IF policy_count != 1 THEN
    RAISE EXCEPTION '[V1.9.47] Policy "Reports access" não foi recriada corretamente. Encontradas: %', policy_count;
  END IF;
  RAISE NOTICE '[V1.9.47] Policy "Reports access" atualizada — is_admin() principal + 4 sócios via UUID break-glass + vínculos clínicos preservados';
END $$;

COMMIT;

-- Rollback manual (se necessário — fora desta migration):
-- BEGIN;
-- DROP POLICY IF EXISTS "Reports access" ON clinical_reports;
-- CREATE POLICY "Reports access" ON clinical_reports
--   FOR ALL
--   USING (
--     auth.email() = ANY (ARRAY['phpg69@gmail.com', 'cbdrcpremium@gmail.com'])
--     OR professional_id = auth.uid()
--     OR doctor_id = auth.uid()
--     OR patient_id = auth.uid()
--   );
-- COMMIT;
