-- V1.9.527 — Trigger pg_trigger AFTER INSERT video_call_requests + RPC reuso
-- ============================================================
-- Solução elite escalável zero-regressão pra gap funcional empírico detectado
-- 30/05 via audit pré-pausa:
--
-- ACHADO EMPÍRICO (PAT):
--   notifications type='video_call_request': 116 rows total, last 2026-05-18
--   video_call_requests: 255 rows total, last 2026-05-27
--   GAP: 9 dias (18/05 → 27/05) video_call_requests continuou MAS
--   notifications PAROU — algum caller frontend deixou de chamar o
--   videoCallRequestService.createRequest() e foi direto pra
--   supabase.from('video_call_requests').insert() bypassando notification.
--
-- SOLUÇÃO ELITE ESCALÁVEL (DEFESA EM CAMADAS):
--   - Trigger pg_trigger AFTER INSERT em video_call_requests
--   - Function chama RPC create_video_call_notification existente
--     (SECURITY DEFINER já cuida do bypass RLS)
--   - Frontend continua tentando (caminho rápido) + trigger garante (backup)
--   - ZERO duplicação porque RPC ja gera UUID novo + insert tem id próprio
--     (frontend e trigger geram rows diferentes em race, mas user vê 2
--     notifications da mesma request — MITIGAR via check temporal opcional)
--
-- ANTI-PADRÃO EVITADO:
--   - NÃO inventar nova Edge (Edge video-call-request-notification existe
--     mas nunca foi conectada — segue parqueada no batch obs 48h até 01/jun)
--   - NÃO criar nova RPC (create_video_call_notification existe + funcional)
--   - NÃO mexer no frontend service (princípio "não tocar o que funciona")
--   - SOMENTE adicionar trigger backup que cobre o caso quebrado
--
-- ROLLBACK 30s:
--   DROP TRIGGER trg_video_call_request_notify_after_insert ON public.video_call_requests;
--   DROP FUNCTION public.tg_video_call_request_notify();
--
-- SMOKE PÓS-DEPLOY:
--   INSERT INTO video_call_requests (request_id, requester_id, recipient_id, call_type, expires_at)
--     VALUES ('vcr_test_' || extract(epoch from now())::text, '<requester_uuid>',
--             '<recipient_uuid>', 'video', now() + interval '30 seconds');
--   SELECT * FROM notifications WHERE type='video_call_request' ORDER BY created_at DESC LIMIT 1;
--   (deve retornar 1 row recém-criada via trigger)
--
-- MITIGAÇÃO DUPLICAÇÃO frontend+trigger:
--   - Trigger checa se notification já existe pra esse request_id nos últimos
--     2 segundos (cobre race frontend tentou e RPC executou antes do trigger)
--   - Se sim: NÃO duplica. Se não: cria.
--   - Custo: 1 SELECT extra (~1ms). Beneficio: zero duplicação visual.

CREATE OR REPLACE FUNCTION public.tg_video_call_request_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester_name text;
  v_requester_type text;
  v_is_professional boolean;
  v_call_label text;
  v_title text;
  v_message text;
  v_existing_count int;
BEGIN
  -- Buscar dados do requester pra montar título/mensagem
  SELECT name, type
    INTO v_requester_name, v_requester_type
    FROM public.users
   WHERE id = NEW.requester_id
   LIMIT 1;

  -- Default seguro se requester não encontrado
  IF v_requester_name IS NULL THEN
    v_requester_name := 'Usuário';
  END IF;

  v_is_professional := v_requester_type IS NOT NULL
    AND v_requester_type NOT IN ('paciente', 'patient');

  v_call_label := CASE NEW.call_type
    WHEN 'audio' THEN 'Chamada de Áudio'
    ELSE 'Videochamada'
  END;

  v_title := CASE WHEN v_is_professional
    THEN 'Profissional está chamando você'
    ELSE 'Solicitação de Videochamada'
  END;

  v_message := CASE WHEN v_is_professional
    THEN format('%s está chamando você para uma %s. Responda em até 30 segundos.',
                v_requester_name, lower(v_call_label))
    ELSE format('%s solicitou uma %s. Aguardando sua resposta (válido por 30 minutos).',
                v_requester_name, lower(v_call_label))
  END;

  -- MITIGAÇÃO DUPLICAÇÃO: se frontend já criou notification pra este request_id
  -- nos últimos 2 segundos, NÃO duplicar
  SELECT COUNT(*) INTO v_existing_count
    FROM public.notifications
   WHERE type = 'video_call_request'
     AND metadata->>'request_id' = NEW.request_id
     AND created_at > now() - interval '2 seconds';

  IF v_existing_count > 0 THEN
    -- Frontend já criou — não duplicar
    RAISE NOTICE '[V1.9.527] Notification ja existe para request_id %, skip trigger', NEW.request_id;
    RETURN NEW;
  END IF;

  -- Criar notification via RPC existente (SECURITY DEFINER bypassa RLS)
  -- Reuso integral pattern V1.9.517 (não inventar, reusar)
  PERFORM public.create_video_call_notification(
    p_user_id  := NEW.recipient_id,
    p_title    := v_title,
    p_message  := v_message,
    p_metadata := jsonb_build_object(
      'request_id',              NEW.request_id,
      'requester_id',            NEW.requester_id,
      'requester_name',          v_requester_name,
      'call_type',               NEW.call_type,
      'is_professional_request', v_is_professional,
      'source',                  'trigger_v1_9_527',
      'request_db_id',           NEW.id
    ) || COALESCE(NEW.metadata, '{}'::jsonb)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Princípio: trigger NÃO pode bloquear INSERT em video_call_requests
  -- Se RPC falhar (ex: recipient_id não existe em users), apenas loga
  -- e deixa o INSERT prosseguir. Frontend ainda tem o caminho próprio.
  RAISE WARNING '[V1.9.527] Falha ao criar notification para request %: %',
                NEW.request_id, SQLERRM;
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.tg_video_call_request_notify() TO service_role;

-- Trigger AFTER INSERT (não BEFORE — evita bloquear inserção)
DROP TRIGGER IF EXISTS trg_video_call_request_notify_after_insert
  ON public.video_call_requests;

CREATE TRIGGER trg_video_call_request_notify_after_insert
  AFTER INSERT ON public.video_call_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_video_call_request_notify();

COMMENT ON FUNCTION public.tg_video_call_request_notify() IS
  'V1.9.527 — Backup notification trigger pra gap funcional empírico identificado 30/05. Reusa RPC create_video_call_notification existente. Mitiga duplicação via check temporal 2s. NÃO bloqueia INSERT em caso de falha.';

COMMENT ON TRIGGER trg_video_call_request_notify_after_insert ON public.video_call_requests IS
  'V1.9.527 — Defesa em camadas: frontend tenta primeiro (videoCallRequestService), trigger garante backup automatico. Cobre caso quebrado 18/05-27/05 quando notifications pararam mas video_call_requests continuou populando.';
