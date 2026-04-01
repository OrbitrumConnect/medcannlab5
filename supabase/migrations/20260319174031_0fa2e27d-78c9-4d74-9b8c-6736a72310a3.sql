
-- =====================================================
-- FASE 1: HARDENING CIRÚRGICO DE SEGURANÇA
-- 7 correções críticas - NÃO quebra navegação de admins
-- =====================================================

-- FIX 1: TRIGGER anti-escalação de privilégios na tabela users
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF OLD.type IS DISTINCT FROM NEW.type THEN
    RAISE EXCEPTION 'Não autorizado: alteração de type bloqueada';
  END IF;
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Não autorizado: alteração de role bloqueada';
  END IF;
  IF OLD.flag_admin IS DISTINCT FROM NEW.flag_admin THEN
    RAISE EXCEPTION 'Não autorizado: alteração de flag_admin bloqueada';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_privilege_escalation ON public.users;
CREATE TRIGGER trg_prevent_privilege_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();

-- FIX 2: user_profiles - remover leitura pública anônima
DROP POLICY IF EXISTS "Public profiles read" ON public.user_profiles;
CREATE POLICY "Authenticated profiles read"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

-- FIX 3: clinical_assessments - remover doctor_id IS NULL e hardcoded emails
DROP POLICY IF EXISTS "Users can view their own assessments" ON public.clinical_assessments;
DROP POLICY IF EXISTS "Assessments access" ON public.clinical_assessments;

-- FIX 4: assessment_sharing - adicionar auth.uid() verification
DROP POLICY IF EXISTS "Ricardo Valenca can view shared assessments" ON public.assessment_sharing;
DROP POLICY IF EXISTS "Eduardo Faveret can view shared assessments" ON public.assessment_sharing;
CREATE POLICY "Admins can view shared assessments"
  ON public.assessment_sharing FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND patient_consent = true AND (consent_expiry_date IS NULL OR consent_expiry_date > now()));
CREATE POLICY "Linked professionals can view shared assessments"
  ON public.assessment_sharing FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'profissional') AND patient_consent = true AND (consent_expiry_date IS NULL OR consent_expiry_date > now()) AND check_professional_patient_link(patient_id));

-- FIX 5: 9 tabelas médicas - substituir USING(true)
DROP POLICY IF EXISTS "Authenticated read abertura_exponencial" ON public.abertura_exponencial;
CREATE POLICY "Restricted read abertura_exponencial" ON public.abertura_exponencial FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

DROP POLICY IF EXISTS "Authenticated read avaliacoes_renais" ON public.avaliacoes_renais;
CREATE POLICY "Restricted read avaliacoes_renais" ON public.avaliacoes_renais FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

DROP POLICY IF EXISTS "Authenticated read contexto_longitudinal" ON public.contexto_longitudinal;
CREATE POLICY "Restricted read contexto_longitudinal" ON public.contexto_longitudinal FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

DROP POLICY IF EXISTS "Authenticated read dados_imre_coletados" ON public.dados_imre_coletados;
CREATE POLICY "Restricted read dados_imre_coletados" ON public.dados_imre_coletados FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

DROP POLICY IF EXISTS "Authenticated read desenvolvimento_indiciario" ON public.desenvolvimento_indiciario;
CREATE POLICY "Restricted read desenvolvimento_indiciario" ON public.desenvolvimento_indiciario FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

DROP POLICY IF EXISTS "Authenticated read fechamento_consensual" ON public.fechamento_consensual;
CREATE POLICY "Restricted read fechamento_consensual" ON public.fechamento_consensual FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

DROP POLICY IF EXISTS "Authenticated read interacoes_ia" ON public.interacoes_ia;
CREATE POLICY "Restricted read interacoes_ia" ON public.interacoes_ia FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

DROP POLICY IF EXISTS "Authenticated read pacientes" ON public.pacientes;
CREATE POLICY "Restricted read pacientes" ON public.pacientes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

DROP POLICY IF EXISTS "Authenticated read permissoes_compartilhamento" ON public.permissoes_compartilhamento;
CREATE POLICY "Restricted read permissoes_compartilhamento" ON public.permissoes_compartilhamento FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'profissional'));

-- FIX 6: Tabelas profissionais - adicionar vínculo
DROP POLICY IF EXISTS "Professionals can view all renal exams" ON public.renal_exams;
DROP POLICY IF EXISTS "Professionals can manage renal exams" ON public.renal_exams;
CREATE POLICY "Professionals manage linked renal exams" ON public.renal_exams FOR ALL TO authenticated
  USING (auth.uid() = patient_id OR has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)))
  WITH CHECK (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)));

DROP POLICY IF EXISTS "patient_lab_results_select" ON public.patient_lab_results;
CREATE POLICY "patient_lab_results_select_v2" ON public.patient_lab_results FOR SELECT TO authenticated
  USING (auth.uid() = patient_id OR has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)));

DROP POLICY IF EXISTS "patient_lab_results_update" ON public.patient_lab_results;
CREATE POLICY "patient_lab_results_update_v2" ON public.patient_lab_results FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)));

DROP POLICY IF EXISTS "patient_conditions_select" ON public.patient_conditions;
DROP POLICY IF EXISTS "patient_conditions_manage" ON public.patient_conditions;
CREATE POLICY "patient_conditions_select_v2" ON public.patient_conditions FOR SELECT TO authenticated
  USING (auth.uid() = patient_id OR has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)));
CREATE POLICY "patient_conditions_manage_v2" ON public.patient_conditions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)))
  WITH CHECK (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)));

DROP POLICY IF EXISTS "Profissionais veem todos os pedidos de exame" ON public.patient_exam_requests;
CREATE POLICY "Profissionais veem pedidos vinculados" ON public.patient_exam_requests FOR SELECT TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = professional_id OR has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)));

DROP POLICY IF EXISTS "Acesso Total Profissionais" ON public.prescriptions;
DROP POLICY IF EXISTS "Profissionais podem gerenciar prescricoes" ON public.prescriptions;
CREATE POLICY "Profissionais gerenciam prescricoes vinculadas" ON public.prescriptions FOR ALL TO authenticated
  USING (auth.uid() = patient_id OR has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)))
  WITH CHECK (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)));

DROP POLICY IF EXISTS "Professionals can view patient events" ON public.epilepsy_events;
CREATE POLICY "Professionals view linked patient events" ON public.epilepsy_events FOR SELECT TO authenticated
  USING (auth.uid() = patient_id OR has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)));

DROP POLICY IF EXISTS "Professionals can view patient devices" ON public.wearable_devices;
CREATE POLICY "Professionals view linked patient devices" ON public.wearable_devices FOR SELECT TO authenticated
  USING (auth.uid() = patient_id OR has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)));

DROP POLICY IF EXISTS "ai_docs_select" ON public.ai_saved_documents;
CREATE POLICY "ai_docs_select_v2" ON public.ai_saved_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (auth.uid() = patient_id AND is_shared_with_patient = true) OR has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(patient_id)));

DROP POLICY IF EXISTS "Professionals can read assessments" ON public.imre_assessments;
DROP POLICY IF EXISTS "Professionals can view patient assessments" ON public.imre_assessments;
DROP POLICY IF EXISTS "Professionals can view patient imre assessments" ON public.imre_assessments;
CREATE POLICY "Professionals view linked imre assessments" ON public.imre_assessments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'profissional') AND check_professional_patient_link(user_id)));

-- FIX 7: chat_messages_legacy - restringir USING(true)
DROP POLICY IF EXISTS "chat_view_policy" ON public.chat_messages_legacy;
CREATE POLICY "chat_view_restricted" ON public.chat_messages_legacy FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
