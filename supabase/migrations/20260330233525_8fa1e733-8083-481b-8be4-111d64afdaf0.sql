
-- RLS para profissionais gerenciarem sua própria disponibilidade
DROP POLICY IF EXISTS "Professionals manage own availability" ON public.professional_availability;
CREATE POLICY "Professionals manage own availability" ON public.professional_availability
  FOR ALL TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());
