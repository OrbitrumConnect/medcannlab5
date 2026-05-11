-- V1.9.228 — Backfill is_remote=true em appointments futuros
-- Data: 11/05/2026 19:36 BRT
--
-- Contexto: V1.9.224 fixou forward (UPDATE pós-RPC bookAppointment em
-- src/lib/scheduling.ts:118-125). Aqui aplicamos retroativo APENAS em
-- appointments AINDA AGENDADOS no futuro.
--
-- Auditoria empírica via PAT (11/05 19:35 BRT):
--   • 1 appointment futuro com is_remote=false  → 03ac8f97-5c0a-4cbf-95bc-2e41ac51bafd
--   • Médico: Dr. Ricardo Valença (2135f0c0)
--   • Paciente: Cristiano Pontes (cbd22577) — friendly user 11/05
--   • Data: 2026-05-13 13:00 UTC (qua 13/05 10h BRT)
--   • location/meeting_url NULL → confirma intenção remota
--
-- Norma MedCannLab: 100% telemedicina (Lei 14.063/2020 + CFM 2.314/2022).
-- Reminders 24h/1h/30min/10min/1min via Edge `video-call-reminders` filtram
-- .eq('is_remote', true) → backfill garante Cristiano receba alertas.
--
-- Anti-regressão:
--   • UUID específico (não SQL massivo) → zero chance de afetar outro
--   • Filtros redundantes (is_remote=false + status=scheduled + futuro) → idempotente
--   • Não toca histórico (appointment_date > now())
--   • Reversível trivialmente: UPDATE ... SET is_remote=false WHERE id='...'
--
-- Executado via Supabase Management API antes desta migration ser commitada.
-- Esta migration serve como REGISTRO PERMANENTE da operação realizada.

UPDATE appointments
SET is_remote = true
WHERE id = '03ac8f97-5c0a-4cbf-95bc-2e41ac51bafd'
  AND is_remote = false
  AND status = 'scheduled'
  AND appointment_date > now();

-- Validação: zero appointments futuros pendentes
DO $$
DECLARE
  v_pending int;
BEGIN
  SELECT COUNT(*) INTO v_pending
  FROM appointments
  WHERE appointment_date > now()
    AND status = 'scheduled'
    AND is_remote = false;

  IF v_pending > 0 THEN
    RAISE NOTICE '[V1.9.228] % appointments futuros ainda com is_remote=false (novos casos pós-V1.9.224)', v_pending;
  ELSE
    RAISE NOTICE '[V1.9.228] OK: nenhum appointment futuro pendente';
  END IF;
END $$;
