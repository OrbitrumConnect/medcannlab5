-- Migration: V1.9.99 — colunas de idempotência para Edge video-call-reminders v53
-- Data: 28/04/2026 ~13h BRT
--
-- Contexto: Edge `video-call-reminders` foi reescrita do modo "individual"
-- (recebia schedule_id de tabela `video_call_schedules` que NUNCA EXISTIU)
-- para modo "sweep" cron-driven. Agora consulta `appointments` diretamente.
-- Princípio 8 (polir não inventar): zero tabela nova, usa appointments
-- (60 rows reais, 10 triggers, schema completo) + notifications + send-email.
--
-- 3 colunas booleanas garantem idempotência: cron pode invocar 100 vezes
-- sem duplicar lembrete. Index parcial otimiza query de sweep.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_30min boolean NOT NULL DEFAULT false;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_10min boolean NOT NULL DEFAULT false;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_1min boolean NOT NULL DEFAULT false;

-- Index parcial: só inclui appointments que ainda têm lembrete pendente.
-- Reduz tamanho do índice (filtra is_remote=true + status='scheduled' + algum
-- reminder não enviado), acelera query do sweep mesmo com muitos appointments.
CREATE INDEX IF NOT EXISTS idx_apt_remote_pending_reminders
  ON public.appointments(appointment_date)
  WHERE is_remote = true
    AND status = 'scheduled'
    AND (reminder_sent_30min = false OR reminder_sent_10min = false OR reminder_sent_1min = false);
