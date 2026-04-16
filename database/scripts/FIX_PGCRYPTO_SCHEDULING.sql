-- ==============================================================================
-- FIX (HOTFIX): HABILITAÇÃO DO PGCRYPTO PARA SISTEMA DE AGENDAMENTO
-- ==============================================================================
-- Descrição: 
-- A trava de dupla marcação no agendamento (SCHEDULING_MASTER_V3) requer
-- a compilação de chaves únicas usando digest('...', 'sha256'). 
-- Isso causava o bug ("function digest does not exist").
-- ==============================================================================

-- 1. Cria a extensão explicitamente no schema 'extensions'
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Teste de Validação Operacional
-- O Supabase agora DEVE retornar um hash bytea para a query abaixo
-- (Se este teste falhar, o app continuará quebrando).
SELECT extensions.digest('test', 'sha256');
