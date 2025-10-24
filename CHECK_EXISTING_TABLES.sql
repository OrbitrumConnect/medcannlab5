-- =====================================================
-- 🔍 VERIFICAR TABELAS EXISTENTES DO MEDCANLAB
-- =====================================================
-- Execute este script para ver o que já temos configurado

-- 1. VERIFICAR DADOS NAS TABELAS PRINCIPAIS
SELECT 
    'usuarios' as tabela,
    COUNT(*) as total_registros
FROM usuarios
UNION ALL
SELECT 
    'pacientes' as tabela,
    COUNT(*) as total_registros
FROM pacientes
UNION ALL
SELECT 
    'avaliacoes_renais' as tabela,
    COUNT(*) as total_registros
FROM avaliacoes_renais
UNION ALL
SELECT 
    'dados_imre_coletados' as tabela,
    COUNT(*) as total_registros
FROM dados_imre_coletados
UNION ALL
SELECT 
    'interacoes_ia' as tabela,
    COUNT(*) as total_registros
FROM interacoes_ia
UNION ALL
SELECT 
    'base_conhecimento' as tabela,
    COUNT(*) as total_registros
FROM base_conhecimento
UNION ALL
SELECT 
    'contexto_longitudinal' as tabela,
    COUNT(*) as total_registros
FROM contexto_longitudinal
UNION ALL
SELECT 
    'desenvolvimento_indiciario' as tabela,
    COUNT(*) as total_registros
FROM desenvolvimento_indiciario
UNION ALL
SELECT 
    'abertura_exponencial' as tabela,
    COUNT(*) as total_registros
FROM abertura_exponencial
UNION ALL
SELECT 
    'fechamento_consensual' as tabela,
    COUNT(*) as total_registros
FROM fechamento_consensual
UNION ALL
SELECT 
    'permissoes_compartilhamento' as tabela,
    COUNT(*) as total_registros
FROM permissoes_compartilhamento;

-- 2. VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
SELECT 
    'ESTRUTURA DA TABELA USUARIOS' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR ESTRUTURA DA TABELA PACIENTES
SELECT 
    'ESTRUTURA DA TABELA PACIENTES' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'pacientes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR ESTRUTURA DA TABELA DADOS_IMRE_COLETADOS
SELECT 
    'ESTRUTURA DA TABELA DADOS_IMRE_COLETADOS' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'dados_imre_coletados' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. RESUMO GERAL
SELECT 
    'RESUMO DAS TABELAS EXISTENTES' as title,
    (SELECT COUNT(*) FROM usuarios) as total_usuarios,
    (SELECT COUNT(*) FROM pacientes) as total_pacientes,
    (SELECT COUNT(*) FROM avaliacoes_renais) as total_avaliacoes_renais,
    (SELECT COUNT(*) FROM dados_imre_coletados) as total_dados_imre,
    (SELECT COUNT(*) FROM interacoes_ia) as total_interacoes_ia,
    (SELECT COUNT(*) FROM base_conhecimento) as total_base_conhecimento;
