-- V1.9.189 — RLS hardening: permitir admin em video_call_sessions
-- ====================================================================
-- Problema (visto no console do Eduardo, 07/05 23h):
--   POST /rest/v1/video_call_sessions → 403
--   ❌ Erro ao salvar sessão (sem patientId)
--
-- Causa raiz: em call profissional⇄profissional, AMBOS tentam upsert
-- na mesma row (mesmo session_id). Caller grava 1º com seu user.id
-- como professional_id. Callee tenta upsert e bate na UPDATE policy
-- (auth.uid() ≠ professional_id da row existente) → 403.
--
-- Fix: ADICIONAR (não remover) permissão pra admin via user_roles.
-- Eduardo é admin → resolve telemetria sem afrouxar segurança.
--
-- Regressão: ZERO. Profissional continua vendo/editando suas próprias
-- rows como antes. Admin agora também pode (privilege levantado).
--
-- Não afeta:
--   - SELECT (paciente vê próprias, profissional vê próprias)
--   - Calls profissional⇄paciente (caller=prof grava normal)
--   - RLS de outras tabelas

DROP POLICY IF EXISTS "Professional inserts own video call sessions" ON public.video_call_sessions;
DROP POLICY IF EXISTS "Professional updates own video call sessions" ON public.video_call_sessions;

CREATE POLICY "Professional or admin inserts video call sessions"
  ON public.video_call_sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() = professional_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Professional or admin updates video call sessions"
  ON public.video_call_sessions
  FOR UPDATE
  USING (
    auth.uid() = professional_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = professional_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY "Professional or admin inserts video call sessions"
  ON public.video_call_sessions IS
  'V1.9.189 — admin (via user_roles) também pode inserir, resolvendo 403 em call profissional⇄profissional onde callee tenta upsert sessão criada pelo caller.';

COMMENT ON POLICY "Professional or admin updates video call sessions"
  ON public.video_call_sessions IS
  'V1.9.189 — espelha INSERT policy. Admin pode atualizar duration/ended_at em qualquer sessão (telemetria pós-call).';
