-- Tabela de equipes clínicas dos profissionais
CREATE TABLE public.professional_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'colleague' CHECK (relationship_type IN ('colleague', 'backup', 'supervisor', 'resident')),
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(professional_id, team_member_id)
);

CREATE INDEX idx_professional_teams_professional ON public.professional_teams(professional_id);
CREATE INDEX idx_professional_teams_member ON public.professional_teams(team_member_id);

ALTER TABLE public.professional_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professional_view_own_team"
  ON public.professional_teams FOR SELECT TO authenticated
  USING (professional_id = auth.uid() OR team_member_id = auth.uid());

CREATE POLICY "professional_manage_own_team"
  ON public.professional_teams FOR INSERT TO authenticated
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "professional_update_own_team"
  ON public.professional_teams FOR UPDATE TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "professional_delete_own_team"
  ON public.professional_teams FOR DELETE TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "admin_view_all_teams"
  ON public.professional_teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));