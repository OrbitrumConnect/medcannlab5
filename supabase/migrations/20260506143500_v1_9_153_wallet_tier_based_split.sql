-- ==============================================================================
-- V1.9.153 — tg_apply_wallet_transaction lê tier_label (LIGAÇÃO 3 de 6)
-- ==============================================================================
--
-- ARQUITETURA: source of truth do RESULTADO FINANCEIRO
-- ============================================================
-- 3 camadas de domínio (NÃO concorrentes — encadeadas):
--   Camada 1 — INPUT MÉDICO       users.consultation_fee_default
--                                  (médico edita; piso R$350, teto R$1300)
--                                  → setado em appointments.price via book_appointment_atomic V1.9.152
--   Camada 2 — REPUTAÇÃO          ranking_history.tier_label
--                                  (cron mensal process_monthly_closing;
--                                   ELITE/GOLD/SILVER/STANDARD)
--   Camada 3 — RESULTADO          wallet_transactions.platform_fee_pct
--                                  (CALCULADO AQUI, neste trigger,
--                                   no momento da liquidação)
--
-- Esta função é a ÚNICA fonte de verdade do resultado financeiro.
-- Captura tier_label + amount no MOMENTO de criar wallet_transaction
-- (status=completed → tg_appointment_to_transaction → este trigger),
-- sem defasagem possível.
--
-- Não há wrapper externo. Não centralizar até existirem múltiplos
-- modificadores (cupom, plano empresa, subsídio) — single-modifier
-- system não justifica complexidade. (decisão Pedro+GPT 06/05)
-- ============================================================
--
-- Mapeamento Opção B (tier-based, decisão Pedro 06/05):
--   ELITE    (top 1%)   → 20% plataforma / 80% médico
--   GOLD     (top 5%)   → 23% plataforma / 77% médico
--   SILVER   (top 10%)  → 26% plataforma / 74% médico
--   STANDARD (resto)    → 30% plataforma / 70% médico
--
-- Pré-PMF: ranking_history vazio → COALESCE 'STANDARD' → todos pagam 30%.
-- Pós-cron mensal: tier_label populado → diferenciação ativa.
--
-- Aplicado empíricamente em produção 06/05/2026 ~11:36 BRT via PAT Pedro.
-- Validado: appointment R$ 700 Ricardo (STANDARD) →
--           amount=700, fee_pct=30, platform_fee=210, professional_amount=490 ✓.
-- Cleanup test executado.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.tg_apply_wallet_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_wallet_id UUID;
    v_tier text;
BEGIN
    -- Garante wallet do profissional (auto-cria se não existe)
    v_wallet_id := public.ensure_wallet(NEW.professional_id);
    NEW.wallet_id := v_wallet_id;

    -- V1.9.153: lê tier_label do mês corrente em ranking_history.
    -- Só sobrescreve platform_fee_pct se vier nulo OU igual ao DEFAULT 30
    -- (preserva valor explícito setado por código upstream se diferente).
    IF NEW.platform_fee_pct IS NULL OR NEW.platform_fee_pct = 30.00 THEN
        SELECT tier_label INTO v_tier
        FROM public.ranking_history
        WHERE user_id = NEW.professional_id
          AND reference_month = date_trunc('month', CURRENT_DATE)::date
        ORDER BY created_at DESC
        LIMIT 1;

        NEW.platform_fee_pct := CASE COALESCE(v_tier, 'STANDARD')
            WHEN 'ELITE'  THEN 20.00
            WHEN 'GOLD'   THEN 23.00
            WHEN 'SILVER' THEN 26.00
            ELSE 30.00
        END;
    END IF;

    -- Calcula split se ainda não calculado (preserva V1.9.13 idempotência)
    IF NEW.platform_fee = 0 AND NEW.professional_amount = 0 AND NEW.amount > 0 THEN
        NEW.platform_fee := ROUND(NEW.amount * (NEW.platform_fee_pct / 100), 2);
        NEW.professional_amount := NEW.amount - NEW.platform_fee;
    END IF;

    RETURN NEW;
END;
$function$;
