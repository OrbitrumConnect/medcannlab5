-- V1.9.123-A — Adicionar lembretes preventivos 24h e 1h antes da consulta
--
-- Contexto: até 03/05/2026 a Edge `video-call-reminders` só disparava lembretes
-- nas janelas 30min / 10min / 1min antes da consulta. Resultado empírico:
-- 0 / 69 appointments tiveram lembrete enviado (51% das consultas foram
-- canceladas, mas todas com mais de 30min de antecedência — fora da janela).
--
-- V1.9.123-A adiciona 2 janelas preventivas:
--   - 24h antes (~23-25h) — paciente lembra na noite anterior
--   - 1h antes (~55-65min) — paciente já está se preparando
-- Mantém as 3 janelas existentes (30/10/1 min) como fail-safe.
--
-- Cada janela tem coluna BOOLEAN própria pra idempotência (não dispara duas vezes).
-- Default false: appointments existentes não recebem lembrete retroativo.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_24h BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_sent_1h  BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN appointments.reminder_sent_24h IS 'V1.9.123-A: lembrete enviado ~24h antes (janela 23-25h). Idempotência da Edge video-call-reminders.';
COMMENT ON COLUMN appointments.reminder_sent_1h  IS 'V1.9.123-A: lembrete enviado ~1h antes (janela 55-65min). Idempotência da Edge video-call-reminders.';
