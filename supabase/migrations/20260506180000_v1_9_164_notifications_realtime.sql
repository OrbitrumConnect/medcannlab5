-- V1.9.164 — Notifications no Realtime publication
--
-- Frontend (src/components/NotificationCenter.tsx + src/services/notificationService.ts)
-- já tem subscribeToNotifications com supabase.channel + postgres_changes filter.
-- ÚNICO gap: tabela notifications não estava em supabase_realtime publication.
-- Solução cirúrgica: 1 ALTER PUBLICATION (1 LOC).
--
-- Aplicado empiricamente via PAT 06/05/2026. Esta migration registra pra git history.
-- Idempotente via DO block (não falha se já adicionada).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
