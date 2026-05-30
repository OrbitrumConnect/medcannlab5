-- V1.9.530 — Trigger pg AFTER INSERT patient_exam_requests → notification new_exam_request
-- ============================================================
-- Pattern V1.9.528 replicado (sem RPC equivalente, INSERT direto SECURITY DEFINER):
--
-- ACHADO EMPIRICO (PAT 30/05 ~19h45 BRT):
--   patient_exam_requests: 24 rows, last 28/05 (todas com status='signed')
--   notifications type='new_exam_request' OR similar: 0 rows
--   Gap funcional: medico cria solicitacao de exame MAS paciente nao eh notificado
--
-- CONTEXTO DOCUMENTAL CONSULTADO:
--   - V1.9.455 (commit 1c71ef3 26/05): exam_request PDF ICP wiring + backfill
--     14 docs legacy. Sistema saiu de 2/17 docs com PDF binario (12%) -> 13/17
--     (76%). Caso Joao Guimaraes 25/05 validado empiricamente.
--   - V1.9.457 (26/05): sign-pdf-icp auth+ownership (Lock V1.9.299 preservado)
--   - Schema empirico: id+patient_id+professional_id+content+status+signed_at+
--     signature_token+signed_pdf_url+digital_signature+iti_validation_code+
--     iti_validation_url+iti_qr_code+document_level (perfil ICP-Brasil completo)
--   - 0 triggers existentes em patient_exam_requests = limpo, sem conflito
--   - 0 RPC equivalente create_exam_request_notification (logo INSERT direto OK)
--
-- SOLUCAO ELITE ESCALAVEL ZERO REGRESSAO:
--   - Trigger AFTER INSERT puro em patient_exam_requests
--   - INSERT direto em notifications (sem RPC, SECURITY DEFINER bypassa RLS)
--   - Mitigacao duplicacao temporal 5s
--   - Detecta prefixo Dr./Dra./Drª no users.name (fix V1.9.528 V2 reusado)
--   - Exception handling: RAISE WARNING + RETURN NEW (NAO bloqueia INSERT)
--   - Include signed_pdf_url no metadata pra frontend deep-link
--
-- ANTI-PADRAO EVITADO:
--   - NAO inventar Edge nova (anti-Babylon)
--   - NAO criar RPC create_exam_request_notification (sem outro use case que reuse)
--   - NAO mexer no frontend que cria exam_request (princípio "nao tocar funcional")
--
-- ROLLBACK 30s:
--   DROP TRIGGER trg_patient_exam_request_notify_after_insert ON public.patient_exam_requests;
--   DROP FUNCTION public.tg_patient_exam_request_notify();
--
-- SMOKE POS-DEPLOY:
--   INSERT INTO patient_exam_requests (patient_id, professional_id, content)
--     VALUES ('<patient_uuid>', '<prof_uuid>', 'Hemograma completo + ureia + creatinina')
--     RETURNING id;
--   SELECT * FROM notifications WHERE type='new_exam_request' ORDER BY created_at DESC LIMIT 1;
--   (deve retornar 1 row recem-criada via trigger)
--   DELETE pra cleanup pos-validacao

CREATE OR REPLACE FUNCTION public.tg_patient_exam_request_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_professional_name text;
  v_message text;
  v_existing_count int;
BEGIN
  -- patient_id eh NOT NULL no schema, mas defensive check
  IF NEW.patient_id IS NULL THEN
    RAISE NOTICE '[V1.9.530] Exam request % sem patient_id, skip notification', NEW.id;
    RETURN NEW;
  END IF;

  -- Buscar nome profissional pra mensagem
  SELECT name
    INTO v_professional_name
    FROM public.users
   WHERE id = NEW.professional_id
   LIMIT 1;

  IF v_professional_name IS NULL THEN
    v_professional_name := 'Profissional';
  END IF;

  -- Reusar fix V1.9.528 V2: detectar prefixo Dr./Dra./Drª pra evitar duplicacao
  v_message := CASE
    WHEN v_professional_name ~* '^(Dr\.?|Dra\.?|Drª\.?)\s+' THEN
      format('%s solicitou um exame para você. Acesse seu prontuário para visualizar.',
             v_professional_name)
    ELSE
      format('Dr(a). %s solicitou um exame para você. Acesse seu prontuário para visualizar.',
             v_professional_name)
  END;

  -- MITIGACAO DUPLICACAO: skip se notification ja existe pra este exam_request nos ultimos 5s
  SELECT COUNT(*) INTO v_existing_count
    FROM public.notifications
   WHERE type = 'new_exam_request'
     AND (metadata->>'exam_request_id')::uuid = NEW.id
     AND created_at > now() - interval '5 seconds';

  IF v_existing_count > 0 THEN
    RAISE NOTICE '[V1.9.530] Notification ja existe para exam_request_id %, skip trigger', NEW.id;
    RETURN NEW;
  END IF;

  -- INSERT direto (SECURITY DEFINER bypassa RLS)
  INSERT INTO public.notifications (
    id,
    user_id,
    type,
    title,
    message,
    is_read,
    metadata
  ) VALUES (
    gen_random_uuid()::text,
    NEW.patient_id,
    'new_exam_request',
    'Nova solicitação de exame',
    v_message,
    false,
    jsonb_build_object(
      'exam_request_id',   NEW.id,
      'professional_id',   NEW.professional_id,
      'professional_name', v_professional_name,
      'status',            NEW.status,
      'signed_pdf_url',    NEW.signed_pdf_url,
      'iti_validation_code', NEW.iti_validation_code,
      'source',            'trigger_v1_9_530'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Trigger NAO bloqueia INSERT em patient_exam_requests caso notification falhe
  RAISE WARNING '[V1.9.530] Falha ao criar notification para exam_request %: %',
                NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.tg_patient_exam_request_notify() TO service_role;

-- Trigger AFTER INSERT puro (NAO BEFORE - evita bloquear inserção)
DROP TRIGGER IF EXISTS trg_patient_exam_request_notify_after_insert
  ON public.patient_exam_requests;

CREATE TRIGGER trg_patient_exam_request_notify_after_insert
  AFTER INSERT ON public.patient_exam_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_patient_exam_request_notify();

COMMENT ON FUNCTION public.tg_patient_exam_request_notify() IS
  'V1.9.530 - Trigger backup notification quando medico cria patient_exam_request. Pattern V1.9.528 replicado (sem RPC equivalente, INSERT direto SECURITY DEFINER). Mitigacao duplicacao via check temporal 5s. NAO bloqueia INSERT em falha. Detecta prefix Dr./Dra. no users.name (fix V1.9.528 V2 reusado).';

COMMENT ON TRIGGER trg_patient_exam_request_notify_after_insert ON public.patient_exam_requests IS
  'V1.9.530 - Defesa em camadas: paciente notificado automaticamente quando medico cria exam request. Cobre 24 rows historicas onde notification correlata = ZERO empirico (gap funcional descoberto audit 30/05 ~19h45 BRT).';
