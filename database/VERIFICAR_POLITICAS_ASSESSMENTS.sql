-- =====================================================
-- VERIFICAR POLÍTICAS RLS DE CLINICAL_ASSESSMENTS
-- MedCannLab 3.0 - Auditoria de Segurança
-- =====================================================

-- 1. LISTAR TODAS AS POLÍTICAS
-- =====================================================
SELECT 
  policyname as "Nome da Política",
  permissive as "Permissiva",
  roles as "Roles",
  cmd as "Comando",
  CASE 
    WHEN qual LIKE '%admin%' AND qual LIKE '%all%' THEN '🔴 PERIGOSA - Admin acesso total'
    WHEN qual LIKE '%admin%' AND qual LIKE '%type%admin%' THEN '⚠️ Admin Policy'
    WHEN qual LIKE '%patient_id%' AND qual LIKE '%auth.uid()%' THEN '✅ Segura - Paciente próprio'
    WHEN qual LIKE '%doctor_id%' AND qual LIKE '%auth.uid()%' THEN '✅ Segura - Profissional próprio'
    WHEN qual LIKE '%shared%' OR qual LIKE '%consent%' THEN '✅ Segura - Compartilhamento explícito'
    ELSE 'ℹ️ Verificar manualmente'
  END as "Status de Segurança",
  qual as "Condição SQL"
FROM pg_policies
WHERE tablename = 'clinical_assessments'
ORDER BY 
  CASE 
    WHEN qual LIKE '%admin%' AND qual LIKE '%all%' THEN 1
    WHEN qual LIKE '%admin%' THEN 2
    ELSE 3
  END,
  policyname;

-- 2. VERIFICAR POLÍTICAS PERIGOSAS
-- =====================================================
SELECT 
  '⚠️ POLÍTICAS PERIGOSAS ENCONTRADAS' as alerta,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'clinical_assessments'
  AND (
    qual LIKE '%admin%' AND (qual LIKE '%all%' OR qual LIKE '%TRUE%' OR qual NOT LIKE '%doctor_id%' AND qual NOT LIKE '%shared%')
  )
ORDER BY policyname;

-- 3. CONTAR POLÍTICAS POR TIPO
-- =====================================================
SELECT 
  CASE 
    WHEN qual LIKE '%patient_id%' AND qual LIKE '%auth.uid()%' THEN 'Paciente Próprio'
    WHEN qual LIKE '%doctor_id%' AND qual LIKE '%auth.uid()%' THEN 'Profissional Próprio'
    WHEN qual LIKE '%admin%' AND qual LIKE '%all%' THEN '🔴 Admin Acesso Total'
    WHEN qual LIKE '%admin%' AND qual LIKE '%doctor_id%' THEN 'Admin Seus Pacientes'
    WHEN qual LIKE '%shared%' OR qual LIKE '%consent%' THEN 'Compartilhamento Explícito'
    ELSE 'Outras'
  END as tipo_politica,
  COUNT(*) as quantidade,
  STRING_AGG(policyname, ', ') as politicas
FROM pg_policies
WHERE tablename = 'clinical_assessments'
GROUP BY 
  CASE 
    WHEN qual LIKE '%patient_id%' AND qual LIKE '%auth.uid()%' THEN 'Paciente Próprio'
    WHEN qual LIKE '%doctor_id%' AND qual LIKE '%auth.uid()%' THEN 'Profissional Próprio'
    WHEN qual LIKE '%admin%' AND qual LIKE '%all%' THEN '🔴 Admin Acesso Total'
    WHEN qual LIKE '%admin%' AND qual LIKE '%doctor_id%' THEN 'Admin Seus Pacientes'
    WHEN qual LIKE '%shared%' OR qual LIKE '%consent%' THEN 'Compartilhamento Explícito'
    ELSE 'Outras'
  END
ORDER BY 
  CASE 
    WHEN tipo_politica LIKE '%🔴%' THEN 1
    ELSE 2
  END;

-- 4. VERIFICAR SE RLS ESTÁ HABILITADO
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Habilitado"
FROM pg_tables
WHERE tablename = 'clinical_assessments';

-- =====================================================
-- INTERPRETAÇÃO
-- =====================================================
-- 🔴 Políticas perigosas: Remover imediatamente
-- ⚠️ Políticas de admin: Verificar se são restritivas
-- ✅ Políticas seguras: Manter
-- =====================================================

