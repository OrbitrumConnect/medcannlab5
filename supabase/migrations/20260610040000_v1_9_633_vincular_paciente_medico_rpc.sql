-- V1.9.633: RPC pra PACIENTE criar VÍNCULO DE CUIDADO leve com um médico,
-- SEM exigir AEC nem agendamento. "Vínculo ≠ Agendamento ≠ AEC".
--
-- Resolve: paciente self-registrado clicava "Vincular" e era forçado a AEC
-- (showAssessmentModal) ou a agendar (showAppointmentModal). Se não completasse,
-- ficava INVISÍVEL pro médico — caso Alexandre Magno Steglich (10/06, Ricardo
-- precisava prescrever e o paciente não aparecia em Meus Pacientes).
--
-- Grava em patient_professional_links (MESMA tabela do import em massa V1.9.578),
-- com source='self_link' (≠ 'import') → import e vínculo manual convivem sem
-- confundir. getAllPatients (adminPermissions.ts) já faz UNION dessa tabela →
-- paciente aparece na hora pro médico, livre pra fazer AEC / agendar depois.
--
-- SECURITY DEFINER porque a RLS da tabela exige WITH CHECK (professional_id =
-- auth.uid() OR is_admin()), bloqueando a escrita do paciente. A função pega
-- patient_id de auth.uid() DENTRO (paciente só vincula a si mesmo — não dá pra
-- forjar professional_id de terceiros). Idempotente: ON CONFLICT DO NOTHING
-- preserva vínculo de import existente intocado.
--
-- ANTI-REGRESSÃO: função NOVA + GRANT só authenticated. Não toca tabela/RLS/locks.

CREATE OR REPLACE FUNCTION public.vincular_paciente_medico(p_professional_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient uuid := auth.uid();
  v_prof_type text;
  v_link_id uuid;
BEGIN
  IF v_patient IS NULL THEN
    RAISE EXCEPTION 'não autenticado';
  END IF;
  IF p_professional_id IS NULL THEN
    RAISE EXCEPTION 'professional_id obrigatório';
  END IF;

  -- valida que o alvo é mesmo profissional/admin (nunca outro paciente)
  SELECT type INTO v_prof_type FROM public.users WHERE id = p_professional_id;
  IF v_prof_type IS NULL THEN
    RAISE EXCEPTION 'profissional não encontrado';
  END IF;
  IF v_prof_type NOT IN ('profissional','professional','admin') THEN
    RAISE EXCEPTION 'alvo não é profissional';
  END IF;

  INSERT INTO public.patient_professional_links (patient_id, professional_id, relationship, source)
  VALUES (v_patient, p_professional_id, 'care', 'self_link')
  ON CONFLICT (patient_id, professional_id) DO NOTHING
  RETURNING id INTO v_link_id;

  -- já existia (ex.: import) → devolve o id sem sobrescrever a linha
  IF v_link_id IS NULL THEN
    SELECT id INTO v_link_id
    FROM public.patient_professional_links
    WHERE patient_id = v_patient AND professional_id = p_professional_id;
  END IF;

  RETURN v_link_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.vincular_paciente_medico(uuid) TO authenticated;
