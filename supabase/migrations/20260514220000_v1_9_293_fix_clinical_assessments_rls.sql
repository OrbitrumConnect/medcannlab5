-- V1.9.293 — Fix RLS INSERT clinical_assessments (Ricardo bug 14/05 18:58)
-- 
-- Bug: policy "Medico cria envelope vazio" exigia status='pending'
--      mas CHECK constraint só aceita 'in_progress'|'completed'|'reviewed'.
--      INSERT direto via JS sempre falhava (RLS vs CHECK conflict).
--
-- Empírico: ZERO rows com status='pending' no banco (audit 14/05 19h)
--           Última row Ricardo 14/05 00:07 via SECURITY DEFINER RPC.
--           Bug reportado por Ricardo testando "Salvar chat como evolução"
--           no canal Atendimento Integrado.
--
-- Fix: trocar a constraint status='pending' por status IN (CHECK válidos).
--      Mantém doctor_id = auth.uid() + patient_id NOT NULL (mesma segurança).
--
-- Anti-regressão:
--   AEC FSM usa RPC SECURITY DEFINER → bypassa RLS → NÃO afetada
--   Pipeline mesma coisa → NÃO afetada
--   chatEvolutionService.saveChatAsEvolution → passa a funcionar
--   Outras INSERTs com status válido (TRIAGE in_progress) → continuam OK

BEGIN;

DROP POLICY IF EXISTS "Medico cria envelope vazio" ON public.clinical_assessments;

CREATE POLICY "Medico cria assessment" ON public.clinical_assessments
  FOR INSERT WITH CHECK (
    doctor_id = auth.uid()
    AND status IN ('in_progress', 'completed', 'reviewed')
    AND patient_id IS NOT NULL
  );

COMMIT;
