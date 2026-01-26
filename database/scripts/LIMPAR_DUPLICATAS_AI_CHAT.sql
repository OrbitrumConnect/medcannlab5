-- =====================================================
-- LIMPEZA DE DUPLICATAS NA TABELA ai_chat_interactions
-- Motivo: Garantir integridade dos logs de auditoria da IA
-- Data: 2026-01-28
-- =====================================================

BEGIN;

-- 1. Identificar e contar duplicatas antes da remoção
CREATE TEMP TABLE duplicate_chats AS
SELECT id
FROM (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, user_message, ai_response, created_at
            ORDER BY created_at DESC
        ) as row_num
    FROM ai_chat_interactions
) t
WHERE row_num > 1;

DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM duplicate_chats;
    RAISE NOTICE 'Encontradas % interações duplicadas para remoção.', v_count;
END $$;

-- 2. Remover as duplicatas
DELETE FROM ai_chat_interactions
WHERE id IN (SELECT id FROM duplicate_chats);

-- 3. Verificação de integridade pós-limpeza
DO $$
DECLARE
    v_remaining_duplicates INT;
BEGIN
    SELECT COUNT(*) INTO v_remaining_duplicates
    FROM (
        SELECT
            user_id, user_message, ai_response, created_at, COUNT(*)
        FROM ai_chat_interactions
        GROUP BY user_id, user_message, ai_response, created_at
        HAVING COUNT(*) > 1
    ) t;

    IF v_remaining_duplicates = 0 THEN
        RAISE NOTICE '✅ Sucesso: Tabela ai_chat_interactions limpa e sem duplicatas.';
    ELSE
        RAISE WARNING '⚠️ Atenção: Ainda existem % grupos de duplicatas.', v_remaining_duplicates;
    END IF;
END $$;

COMMIT;
