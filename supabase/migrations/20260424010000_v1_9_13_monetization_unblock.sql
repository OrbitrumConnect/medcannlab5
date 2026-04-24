-- V1.9.13 — Destrava fluxo de monetização (wallet_transactions)
--
-- Contexto: 59 appointments existentes tinham professional_id preenchido e doctor_id NULL.
-- O trigger tg_appointment_to_transaction lia NEW.doctor_id (NULL) e tentava inserir
-- em wallet_transactions.professional_id (NOT NULL) → constraint violation em todo
-- UPDATE status='completed'. Resultado: 0 wallet_transactions em produção por meses.
--
-- Segundo bug: notifications.id era NOT NULL sem DEFAULT, handle_appointment_completed
-- não passava id → mesmo erro bloqueava o UPDATE completed antes do wallet_tx.
--
-- Validado em produção em 2026-04-24 com appointment de teste Pedro→Ricardo, R$200,
-- split automático 30/70 (platform_fee=60, professional_amount=140), wallet criada
-- sob demanda via ensure_wallet, balance_pending = 140 no Ricardo, notification emitida.

-- Fix 1: tg_appointment_to_transaction aceita professional_id OU doctor_id
CREATE OR REPLACE FUNCTION public.tg_appointment_to_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_amount NUMERIC(12,2);
  v_existing UUID;
  v_professional UUID;
BEGIN
  IF NEW.status <> 'completed' OR (OLD.status = 'completed') THEN
    RETURN NEW;
  END IF;

  v_professional := COALESCE(NEW.doctor_id, NEW.professional_id);
  IF v_professional IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_existing
  FROM public.wallet_transactions
  WHERE appointment_id = NEW.id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_amount := COALESCE(NEW.price, 200.00);

  INSERT INTO public.wallet_transactions (
    professional_id,
    patient_id,
    appointment_id,
    amount,
    type,
    status,
    description,
    payment_method
  ) VALUES (
    v_professional,
    NEW.patient_id,
    NEW.id,
    v_amount,
    'consultation',
    'pending',
    'Consulta concluída - aguardando confirmação de pagamento',
    'pending'
  );

  RETURN NEW;
END;
$fn$;

-- Fix 2: notifications.id ganha DEFAULT pra que handle_appointment_completed
-- (e qualquer outro código que não passe id) funcione.
ALTER TABLE public.notifications
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
