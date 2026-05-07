-- V1.9.188-B — Fluxo de Convite/Aceite + Limite 2 equipes ativas por membro
-- ====================================================================
-- ANTES: professional_teams aceitava INSERT direto com is_active=true,
-- sem consentimento do team_member_id (fraude: alguém adiciona qualquer
-- profissional sem ele saber).
--
-- AGORA:
-- 1. accepted_at TIMESTAMPTZ (nullable). NULL = convite pendente.
-- 2. Backfill: existentes ficam aceitos (mantém vigentes).
-- 3. Trigger fn_team_member_limit: rejeita se member já tem 2 ATIVAS+ACEITAS.
-- 4. Trigger fn_team_invite_notification: dispara notification ao membro
--    quando cria convite (reuso V1.9.164/165 sino realtime + som).
-- 5. View v_team_pending_invites_for_me — convites pendentes pro user atual.
--
-- Compatibilidade: rows existentes (6) ficam aceitas (accepted_at = created_at).
-- Frontend novo cria com accepted_at=NULL (pendente) — fluxo novo.

-- ─────────────────────────────────────────────────────────────────
-- 1. Coluna nova
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.professional_teams
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.professional_teams.accepted_at IS
  'V1.9.188 — quando team_member_id aceitou o convite. NULL = pendente. Não nullable em produção futura, hoje compat existentes via backfill.';

-- ─────────────────────────────────────────────────────────────────
-- 2. Backfill: rows existentes ficam aceitos (preserva semântica)
-- ─────────────────────────────────────────────────────────────────

UPDATE public.professional_teams
SET accepted_at = COALESCE(updated_at, created_at)
WHERE accepted_at IS NULL AND is_active = true;

-- ─────────────────────────────────────────────────────────────────
-- 3. Trigger limite 2 equipes ativas por membro
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_team_member_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  active_count INT;
BEGIN
  -- Só validar quando estiver ATIVANDO (is_active=true E accepted_at IS NOT NULL)
  IF NEW.is_active = true AND NEW.accepted_at IS NOT NULL THEN
    SELECT COUNT(*) INTO active_count
    FROM public.professional_teams
    WHERE team_member_id = NEW.team_member_id
      AND is_active = true
      AND accepted_at IS NOT NULL
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF active_count >= 2 THEN
      RAISE EXCEPTION 'Profissional já está em 2 equipes ativas (limite V1.9.188). Saia de uma equipe antes de aceitar nova.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_team_member_limit ON public.professional_teams;

CREATE TRIGGER trg_team_member_limit
  BEFORE INSERT OR UPDATE ON public.professional_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_team_member_limit();

COMMENT ON TRIGGER trg_team_member_limit ON public.professional_teams IS
  'V1.9.188 — Limite Triple-A: profissional só pode estar em 2 equipes ativas (anti-burnout, anti-spam). Convites pendentes (accepted_at=NULL) NÃO contam.';

-- ─────────────────────────────────────────────────────────────────
-- 4. Trigger notification automática quando cria convite
-- ─────────────────────────────────────────────────────────────────

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

    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      action_url,
      metadata
    ) VALUES (
      NEW.team_member_id,
      'Convite para equipe clínica',
      COALESCE(inviter_name, 'Um colega') || ' te convidou para a equipe clínica dele(a).',
      'info',
      '/app/clinica/profissional/dashboard?section=terminal-clinico&tab=team',
      jsonb_build_object(
        'team_invite_id', NEW.id,
        'inviter_id', NEW.professional_id,
        'relationship_type', NEW.relationship_type
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_team_invite_notification ON public.professional_teams;

CREATE TRIGGER trg_team_invite_notification
  AFTER INSERT ON public.professional_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_team_invite_notification();

COMMENT ON TRIGGER trg_team_invite_notification ON public.professional_teams IS
  'V1.9.188 — dispara notification realtime (sino V1.9.164 + som V1.9.165) quando recebe convite de equipe.';

-- ─────────────────────────────────────────────────────────────────
-- 5. View pendentes (convites recebidos pelo user atual)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_team_pending_invites_for_me WITH (security_invoker = true) AS
SELECT
  pt.id,
  pt.professional_id AS inviter_id,
  pt.team_member_id  AS invitee_id,
  pt.relationship_type,
  pt.notes,
  pt.created_at,
  inviter.name       AS inviter_name,
  inviter.email      AS inviter_email,
  inviter.specialty  AS inviter_specialty,
  inviter.avatar_url AS inviter_avatar
FROM public.professional_teams pt
LEFT JOIN public.users inviter ON inviter.id = pt.professional_id
WHERE pt.accepted_at IS NULL
  AND pt.team_member_id = auth.uid()
ORDER BY pt.created_at DESC;

COMMENT ON VIEW public.v_team_pending_invites_for_me IS
  'V1.9.188 — convites de equipe pendentes que o user atual recebeu. RLS via security_invoker + filter team_member_id = auth.uid().';

GRANT SELECT ON public.v_team_pending_invites_for_me TO authenticated;
