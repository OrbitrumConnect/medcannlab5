-- ==============================================================================
-- V1.9.150 — Pricing por médico + experiência (LIGAÇÃO 1 de 6)
-- ==============================================================================
--
-- Contexto: ~50 linhas em 6 ligações pra ativar pricing real (zero feature nova).
-- Hoje appointments.price NUNCA é populado via UI → trigger fallback R$200 fixo.
-- O FALLBACK_PROFESSIONALS hardcoded mostra "Ricardo R$350" mas banco tem NULL.
--
-- Esta ligação faz nascer 2 colunas em users:
--   • consultation_fee_default — valor padrão consulta (piso R$350, teto R$1300)
--   • years_experience — anos informados pelo profissional
--
-- Camadas existentes (INTOCÁVEIS — provadas em produção):
--   ✅ wallets, wallet_transactions, payouts (V1.9.13, validado 24/04)
--   ✅ Triggers tg_apply_wallet_transaction + tg_appointment_to_transaction
--      + tg_wallet_balance_sync (split 70/30 automático)
--   ✅ ranking_history (tier_label ELITE/GOLD/SILVER/STANDARD)
--   ✅ user_benefits_status, view_current_ranking_live
--
-- Próximas ligações (LIGAÇÃO 2-6) ficam pós-smoke 11h-13h BRT 06/05:
--   2. book_appointment_atomic seta appointments.price ← consultation_fee_default
--   3. tg_apply_wallet_transaction lê tier_label → platform_fee_pct (Opção B)
--   4. Verificar pg_cron schedule de process_monthly_closing
--   5. Profile.tsx 2 inputs profissional (FASE A — V1.9.150)
--   6. PatientAppointments.tsx fetch enriquecer cards (FASE A — V1.9.150)
-- ==============================================================================

-- 1. Adicionar colunas com CHECK constraint
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS consultation_fee_default NUMERIC(12,2)
    CHECK (
      consultation_fee_default IS NULL
      OR (consultation_fee_default >= 350 AND consultation_fee_default <= 1300)
    ),
  ADD COLUMN IF NOT EXISTS years_experience SMALLINT
    CHECK (
      years_experience IS NULL
      OR (years_experience >= 0 AND years_experience <= 80)
    );

-- 2. Comentários documentando intenção
COMMENT ON COLUMN public.users.consultation_fee_default IS
  'V1.9.150 — Valor padrão da consulta do profissional em BRL. Piso R$350, teto R$1300. NULL = não definido (vitrine esconde grid). Decisão Pedro 06/05.';

COMMENT ON COLUMN public.users.years_experience IS
  'V1.9.150 — Anos de experiência informados pelo profissional (0-80). NULL = não definido.';

-- 3. Índice opcional só pra ordenação por preço (futuro filter na vitrine)
CREATE INDEX IF NOT EXISTS idx_users_consultation_fee
  ON public.users(consultation_fee_default)
  WHERE consultation_fee_default IS NOT NULL;
