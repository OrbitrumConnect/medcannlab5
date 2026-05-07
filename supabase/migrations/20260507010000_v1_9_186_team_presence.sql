-- V1.9.186-A — Foundation Clinical Team Command Center: presence (last_seen_at)
-- ====================================================================
-- Adiciona última atividade do usuário pra Command Center mostrar
-- "ativo há X min" sem depender só do Realtime presence channel
-- (que só vê quem está online AGORA — não cobre quem entrou há 30min).
--
-- Throttle no frontend (5min) evita poluir banco com pings excessivos.
-- ZERO regressão: coluna nullable, default NULL = "nunca pingou" comportamento
-- antigo (mostra como offline, OK).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.users.last_seen_at IS
  'V1.9.186 — última atividade no app. Update throttled 5min via useLastSeen hook. NULL = nunca pingou.';

-- Index parcial pra queries do Command Center (filtros "ativos últimas X horas")
CREATE INDEX IF NOT EXISTS idx_users_last_seen_at
  ON public.users (last_seen_at DESC NULLS LAST)
  WHERE last_seen_at IS NOT NULL;

-- View enriquecida pra Command Center: combina users + métricas + status
CREATE OR REPLACE VIEW public.v_team_member_overview WITH (security_invoker = true) AS
SELECT
  u.id,
  u.name,
  u.email,
  u.type,
  u.specialty,
  u.phone,
  u.avatar_url,
  u.is_official,
  u.consultation_fee_default,
  u.years_experience,
  u.last_seen_at,
  -- Status calculado: online (<5min), recently (<30min), today (<24h), offline (>24h ou null)
  CASE
    WHEN u.last_seen_at IS NULL                                     THEN 'never'
    WHEN u.last_seen_at > NOW() - INTERVAL '5 minutes'              THEN 'online'
    WHEN u.last_seen_at > NOW() - INTERVAL '30 minutes'             THEN 'recently'
    WHEN u.last_seen_at > NOW() - INTERVAL '24 hours'               THEN 'today'
    ELSE 'offline'
  END AS presence_status,
  -- Minutos desde última atividade (NULL se nunca)
  CASE
    WHEN u.last_seen_at IS NULL THEN NULL
    ELSE EXTRACT(EPOCH FROM (NOW() - u.last_seen_at)) / 60
  END AS minutes_since_seen
FROM public.users u
WHERE u.type IN ('profissional', 'admin');

COMMENT ON VIEW public.v_team_member_overview IS
  'V1.9.186 — overview pra Command Center. Status calculado em tempo de query. security_invoker=true respeita RLS de users.';

GRANT SELECT ON public.v_team_member_overview TO authenticated;
