-- V1.9.188-C — FIX bug 400: trigger fn_team_invite_notification usava
-- coluna `action_url` que NÃO EXISTE em notifications.
-- ====================================================================
-- Schema real de notifications: id, type, title, message, data, created_at,
-- user_id, user_type, is_read, metadata
-- (NÃO tem action_url — minha migration V1.9.188 errou)
--
-- Fix: action_url vai pra dentro de metadata.action_url (jsonb existente).
-- Notification frontend já consulta .action_url via metadata fallback (V1.9.165
-- NotificationCenter.tsx tem `notification.action_url` — precisa também
-- verificar metadata.action_url).
--
-- Smoke pós-aplicar: INSERT em professional_teams com accepted_at=NULL deve
-- funcionar (sem erro 400) e criar notification automatic.

CREATE OR REPLACE FUNCTION public.fn_team_invite_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inviter_name TEXT;
BEGIN
  -- Só dispara em INSERT de convite pendente (accepted_at IS NULL)
  IF TG_OP = 'INSERT' AND NEW.accepted_at IS NULL THEN
    SELECT name INTO inviter_name FROM public.users WHERE id = NEW.professional_id;

    -- V1.9.188-C — Corrigido: notifications NÃO tem action_url. Tudo extra
    -- vai em metadata jsonb (ou data jsonb se preferir — escolhi metadata
    -- pra ser consistente com V1.9.176 pki_transactions.metadata).
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.team_member_id,
      'info',
      'Convite para equipe clínica',
      COALESCE(inviter_name, 'Um colega') || ' te convidou para a equipe clínica dele(a).',
      jsonb_build_object(
        'team_invite_id', NEW.id,
        'inviter_id', NEW.professional_id,
        'relationship_type', NEW.relationship_type,
        'action_url', '/app/clinica/profissional/dashboard?section=terminal-clinico&tab=team'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger continua o mesmo (não precisa drop+recreate, CREATE OR REPLACE FUNCTION basta)

COMMENT ON FUNCTION public.fn_team_invite_notification() IS
  'V1.9.188-C — fix bug 400. Usa metadata.action_url (notifications.action_url não existe). Dispara em INSERT pendente.';
