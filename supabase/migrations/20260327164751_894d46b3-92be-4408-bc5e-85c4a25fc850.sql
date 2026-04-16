-- =====================================================
-- RPC: complete_appointment
-- Permite profissionais/admin concluírem consultas
-- Fecha o ciclo clínico operacional
-- =====================================================

CREATE OR REPLACE FUNCTION public.complete_appointment(
  p_appointment_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_id UUID;
  v_appointment RECORD;
BEGIN
  v_caller_id := auth.uid();
  
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar appointment e validar
  SELECT id, patient_id, professional_id, status
  INTO v_appointment
  FROM appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consulta não encontrada';
  END IF;

  -- Verificar se status permite conclusão
  IF v_appointment.status NOT IN ('scheduled', 'confirmed', 'in_progress') THEN
    RAISE EXCEPTION 'Consulta não pode ser concluída (status atual: %)', v_appointment.status;
  END IF;

  -- Verificar permissão: profissional da consulta OU admin
  IF v_appointment.professional_id != v_caller_id 
     AND NOT public.is_admin(v_caller_id) THEN
    RAISE EXCEPTION 'Sem permissão para concluir esta consulta';
  END IF;

  -- Concluir consulta
  UPDATE appointments
  SET status = 'completed',
      notes = COALESCE(p_notes, notes),
      updated_at = NOW()
  WHERE id = p_appointment_id;

  RETURN TRUE;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.complete_appointment(UUID, TEXT) TO authenticated;

-- =====================================================
-- TRIGGER: Side-effects ao concluir consulta
-- Atualiza last_sign_in_at como proxy de última atividade
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_appointment_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Criar notificação para o paciente
    INSERT INTO notifications (
      user_id, type, title, message, is_read, metadata
    ) VALUES (
      NEW.patient_id,
      'appointment_completed',
      'Consulta Concluída',
      'Sua consulta foi concluída. Confira seu dashboard para ver os resultados.',
      false,
      jsonb_build_object(
        'appointment_id', NEW.id,
        'professional_id', NEW.professional_id,
        'completed_at', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger (idempotente)
DROP TRIGGER IF EXISTS trg_appointment_completed ON appointments;
CREATE TRIGGER trg_appointment_completed
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_appointment_completed();