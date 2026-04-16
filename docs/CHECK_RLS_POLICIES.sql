-- ====================================================================
-- SCRIPT DE AUDITORIA DE RLS (ROW LEVEL SECURITY)
-- Objetivo: Checar as políticas atuais nas tabelas antes de mudar
-- ====================================================================

SELECT 
    schemaname AS "Esquema", 
    tablename AS "Tabela", 
    policyname AS "Nome da Política", 
    permissive AS "Permissiva", 
    roles AS "Papéis Aplicados", 
    cmd AS "Ação (INSERT, SELECT...)", 
    qual AS "Condição (Qual)", 
    with_check AS "Regra de Checagem (WITH CHECK)"
FROM pg_policies 
WHERE tablename IN ('users', 'user_roles', 'clinical_assessments', 'appointments')
ORDER BY tablename, cmd;
