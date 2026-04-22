
-- =====================================================
-- 💰 ONDA 1: WALLET CORE - Terminal Financeiro
-- =====================================================
-- Fundação da Carteira Inteligente do Profissional
-- Sem dependência de Stripe (plugável depois)
-- =====================================================

-- 1. TABELA: wallets (1 wallet por usuário)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  balance_available NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance_available >= 0),
  balance_pending NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance_pending >= 0),
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  stripe_account_id TEXT,
  stripe_onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- 2. TABELA: wallet_transactions (histórico financeiro completo)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vínculos
  professional_id UUID NOT NULL,        -- médico que recebe
  patient_id UUID,                       -- paciente que paga (NULL p/ ajustes)
  appointment_id UUID,                   -- vínculo com agenda
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  
  -- Valores (já com split 70/30 gravado)
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),         -- valor bruto
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,             -- 30% plataforma
  professional_amount NUMERIC(12,2) NOT NULL DEFAULT 0,      -- 70% médico
  platform_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  
  -- Classificação
  type TEXT NOT NULL CHECK (type IN ('consultation', 'subscription', 'refund', 'adjustment', 'cashback', 'payout')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  
  -- Metadados
  description TEXT,
  payment_method TEXT,                   -- 'stripe', 'pix', 'manual', etc
  external_id TEXT,                      -- id do Stripe quando houver
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wtx_professional ON public.wallet_transactions(professional_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wtx_patient ON public.wallet_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_wtx_appointment ON public.wallet_transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_wtx_status ON public.wallet_transactions(status);

-- 3. TABELA: payouts (saques)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  method TEXT NOT NULL DEFAULT 'stripe' CHECK (method IN ('stripe', 'pix', 'manual')),
  external_id TEXT,
  failure_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_user ON public.payouts(user_id, status, created_at DESC);

-- 4. RLS — isolamento por usuário
-- =====================================================
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- WALLETS: dono vê e gerencia
DROP POLICY IF EXISTS "wallets_owner_select" ON public.wallets;
CREATE POLICY "wallets_owner_select" ON public.wallets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wallets_owner_insert" ON public.wallets;
CREATE POLICY "wallets_owner_insert" ON public.wallets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- WALLET_TRANSACTIONS: profissional ou paciente envolvido pode ver
DROP POLICY IF EXISTS "wtx_participants_select" ON public.wallet_transactions;
CREATE POLICY "wtx_participants_select" ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = professional_id OR auth.uid() = patient_id);

-- PAYOUTS: só o dono vê e cria
DROP POLICY IF EXISTS "payouts_owner_select" ON public.payouts;
CREATE POLICY "payouts_owner_select" ON public.payouts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payouts_owner_insert" ON public.payouts;
CREATE POLICY "payouts_owner_insert" ON public.payouts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. FUNÇÃO: garantir wallet do usuário (auto-criação)
-- =====================================================
CREATE OR REPLACE FUNCTION public.ensure_wallet(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = p_user_id;
  RETURN v_wallet_id;
END;
$$;

-- 6. TRIGGER: ao confirmar transaction → atualizar saldos
-- =====================================================
CREATE OR REPLACE FUNCTION public.tg_apply_wallet_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  -- Garante wallet do profissional
  v_wallet_id := public.ensure_wallet(NEW.professional_id);
  NEW.wallet_id := v_wallet_id;

  -- Calcula split se ainda não calculado
  IF NEW.platform_fee = 0 AND NEW.professional_amount = 0 AND NEW.amount > 0 THEN
    NEW.platform_fee := ROUND(NEW.amount * (NEW.platform_fee_pct / 100), 2);
    NEW.professional_amount := NEW.amount - NEW.platform_fee;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wtx_before_insert ON public.wallet_transactions;
CREATE TRIGGER trg_wtx_before_insert
BEFORE INSERT ON public.wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION public.tg_apply_wallet_transaction();

-- 7. TRIGGER: aplicar mudança de saldo quando status muda
-- =====================================================
CREATE OR REPLACE FUNCTION public.tg_wallet_balance_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INSERT: se já nasce confirmed, joga em available; se pending, joga em pending
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'confirmed' THEN
      UPDATE public.wallets
      SET balance_available = balance_available + NEW.professional_amount,
          total_earned = total_earned + NEW.professional_amount,
          updated_at = now()
      WHERE user_id = NEW.professional_id;
    ELSIF NEW.status = 'pending' THEN
      UPDATE public.wallets
      SET balance_pending = balance_pending + NEW.professional_amount,
          updated_at = now()
      WHERE user_id = NEW.professional_id;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: detectar transição de status
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- pending → confirmed: move pending para available
    IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
      UPDATE public.wallets
      SET balance_pending = GREATEST(balance_pending - OLD.professional_amount, 0),
          balance_available = balance_available + NEW.professional_amount,
          total_earned = total_earned + NEW.professional_amount,
          updated_at = now()
      WHERE user_id = NEW.professional_id;
      NEW.confirmed_at := now();
    -- pending → cancelled: tira do pending
    ELSIF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
      UPDATE public.wallets
      SET balance_pending = GREATEST(balance_pending - OLD.professional_amount, 0),
          updated_at = now()
      WHERE user_id = NEW.professional_id;
    -- confirmed → refunded: tira do available
    ELSIF OLD.status = 'confirmed' AND NEW.status = 'refunded' THEN
      UPDATE public.wallets
      SET balance_available = GREATEST(balance_available - OLD.professional_amount, 0),
          updated_at = now()
      WHERE user_id = NEW.professional_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wtx_after_change ON public.wallet_transactions;
CREATE TRIGGER trg_wtx_after_change
AFTER INSERT OR UPDATE OF status ON public.wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION public.tg_wallet_balance_sync();

-- 8. TRIGGER: appointment 'completed' → cria transaction pending (se não existir)
-- =====================================================
CREATE OR REPLACE FUNCTION public.tg_appointment_to_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount NUMERIC(12,2);
  v_existing UUID;
BEGIN
  -- Só age em transição para 'completed'
  IF NEW.status <> 'completed' OR (OLD.status = 'completed') THEN
    RETURN NEW;
  END IF;

  -- Não duplica
  SELECT id INTO v_existing
  FROM public.wallet_transactions
  WHERE appointment_id = NEW.id
  LIMIT 1;
  
  IF v_existing IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Valor da consulta (fallback 200 se não houver price)
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
    NEW.doctor_id,
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
$$;

-- Anexa trigger ao appointments (verificando se a coluna price existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'appointments'
  ) THEN
    -- Adiciona coluna price se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'price'
    ) THEN
      ALTER TABLE public.appointments ADD COLUMN price NUMERIC(12,2);
    END IF;

    DROP TRIGGER IF EXISTS trg_appointment_to_wtx ON public.appointments;
    CREATE TRIGGER trg_appointment_to_wtx
    AFTER UPDATE OF status ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_appointment_to_transaction();
  END IF;
END $$;

-- 9. RPC: solicitar payout (saque)
-- =====================================================
CREATE OR REPLACE FUNCTION public.request_payout(p_amount NUMERIC)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet_id UUID;
  v_available NUMERIC;
  v_payout_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor inválido';
  END IF;

  SELECT id, balance_available INTO v_wallet_id, v_available
  FROM public.wallets WHERE user_id = v_user_id;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet não encontrada';
  END IF;

  IF v_available < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Disponível: %', v_available;
  END IF;

  -- Reserva: tira do available imediatamente
  UPDATE public.wallets
  SET balance_available = balance_available - p_amount,
      updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO public.payouts (user_id, wallet_id, amount, status)
  VALUES (v_user_id, v_wallet_id, p_amount, 'pending')
  RETURNING id INTO v_payout_id;

  RETURN v_payout_id;
END;
$$;

-- 10. VIEW: resumo financeiro do profissional (para dashboard)
-- =====================================================
CREATE OR REPLACE VIEW public.v_professional_financial_summary
WITH (security_invoker = true) AS
SELECT
  w.user_id,
  w.balance_available,
  w.balance_pending,
  w.total_earned,
  w.total_withdrawn,
  COALESCE((
    SELECT SUM(professional_amount) FROM public.wallet_transactions
    WHERE professional_id = w.user_id
      AND status = 'confirmed'
      AND created_at >= date_trunc('month', now())
  ), 0) AS revenue_this_month,
  COALESCE((
    SELECT SUM(professional_amount) FROM public.wallet_transactions
    WHERE professional_id = w.user_id
      AND status = 'confirmed'
      AND created_at >= date_trunc('month', now() - interval '1 month')
      AND created_at < date_trunc('month', now())
  ), 0) AS revenue_last_month,
  COALESCE((
    SELECT COUNT(*) FROM public.wallet_transactions
    WHERE professional_id = w.user_id
      AND status = 'confirmed'
      AND created_at >= date_trunc('month', now())
  ), 0) AS transactions_this_month
FROM public.wallets w;
