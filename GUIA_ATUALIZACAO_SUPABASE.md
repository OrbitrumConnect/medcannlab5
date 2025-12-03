# 📋 Guia de Atualização do Supabase

## 🎯 Objetivo

Este guia explica o que precisa ser feito no Supabase após as últimas modificações no código, especialmente relacionadas aos **KPIs Clínicos** e **funcionalidades de visualização de documentos**.

---

## ✅ O Que Foi Modificado no Código

### 1. **KPIs da Camada Clínica**
   - Substituição dos KPIs genéricos por métricas específicas:
     - **Narrativas Preservadas**: Conta avaliações com fala espontânea preservada
     - **Análise Multirracional**: Conta avaliações com 4+ racionalidades médicas
     - **Dados Primários Coletados**: Conta blocos semânticos/dados primários
     - **Correlações Identificadas**: Conta cruzamentos entre fala espontânea e avaliação clínica

### 2. **Visualização de Documentos**
   - Melhorias na função de visualização para buscar conteúdo do banco de dados

### 3. **Importação de Pacientes**
   - Funcionalidade para importar pacientes de planilhas

---

## 🔧 O Que Precisa Ser Feito no Supabase

### **PASSO 1: Executar Script SQL**

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `SUPABASE_ATUALIZACAO_KPIS_CLINICOS.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run** ou pressione `Ctrl+Enter`

### **PASSO 2: Verificar Execução**

O script irá:
- ✅ Criar/verificar tabelas `imre_assessments` e `clinical_assessments`
- ✅ Criar índices para melhorar performance das queries
- ✅ Configurar Row Level Security (RLS)
- ✅ Criar funções auxiliares para cálculo dos KPIs
- ✅ Criar triggers para atualização automática de `updated_at`

### **PASSO 3: Verificar Resultados**

Após executar, você deve ver mensagens como:
```
✅ Todas as tabelas foram verificadas com sucesso!
✅ Índices criados para imre_assessments: X
```

---

## 📊 Estrutura de Dados Esperada

### **Tabela `imre_assessments`**

Campos importantes para os KPIs:

```sql
semantic_context JSONB {
  primary_data: {...},           -- Dados primários preservados
  spontaneous_speech: {...},     -- Fala espontânea do paciente
  patient_narrative: {...},      -- Narrativa do paciente
  semantic_blocks: [...]          -- Blocos semânticos coletados
}

triaxial_data JSONB {
  rationalities: {               -- Racionalidades médicas aplicadas
    biomedica: {...},
    mtc: {...},
    ayurvedica: {...},
    homeopatica: {...},
    integrativa: {...}
  },
  clinical_correlations: {...},  -- Correlações clínicas
  integrated_analysis: {...}     -- Análise integrada
}
```

### **Tabela `clinical_assessments`**

Campos importantes:

```sql
data JSONB {
  patient_narrative: {...},      -- Narrativa do paciente
  spontaneous_speech: {...},     -- Fala espontânea
  primary_data: {...},           -- Dados primários
  investigation: {...}           -- Dados da investigação
}
```

---

## 🔍 Verificações Pós-Execução

### **1. Verificar Tabelas**

Execute no SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('imre_assessments', 'clinical_assessments');
```

**Resultado esperado:** 2 linhas retornadas

### **2. Verificar Índices**

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('imre_assessments', 'clinical_assessments')
ORDER BY tablename, indexname;
```

**Resultado esperado:** Múltiplos índices listados

### **3. Verificar Funções**

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'count_%';
```

**Resultado esperado:** 4 funções:
- `count_preserved_narratives`
- `count_multirational_analyses`
- `count_primary_data_blocks`
- `count_identified_correlations`

### **4. Testar Funções**

```sql
SELECT 
  count_preserved_narratives() as narrativas,
  count_multirational_analyses() as multirracional,
  count_primary_data_blocks() as dados_primarios,
  count_identified_correlations() as correlacoes;
```

**Resultado esperado:** 4 números (podem ser 0 se não houver dados ainda)

---

## ⚠️ Possíveis Problemas e Soluções

### **Problema 1: Erro ao criar políticas RLS**

**Solução:** As políticas antigas podem estar conflitando. O script tenta removê-las automaticamente, mas se persistir:

```sql
-- Remover todas as políticas manualmente
DROP POLICY IF EXISTS "nome_da_politica" ON imre_assessments;
DROP POLICY IF EXISTS "nome_da_politica" ON clinical_assessments;

-- Depois executar o script novamente
```

### **Problema 2: Índices GIN não criados**

**Solução:** Verificar se a extensão está habilitada:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### **Problema 3: Funções retornam erro**

**Solução:** Verificar permissões:

```sql
GRANT EXECUTE ON FUNCTION count_preserved_narratives() TO authenticated;
GRANT EXECUTE ON FUNCTION count_multirational_analyses() TO authenticated;
GRANT EXECUTE ON FUNCTION count_primary_data_blocks() TO authenticated;
GRANT EXECUTE ON FUNCTION count_identified_correlations() TO authenticated;
```

---

## 🎯 Próximos Passos Após Atualização

1. **Testar KPIs no Dashboard**
   - Acesse o dashboard admin
   - Verifique se os KPIs clínicos estão sendo calculados corretamente
   - Os valores podem ser 0 inicialmente se não houver avaliações completas

2. **Testar Visualização de Documentos**
   - Acesse a base de conhecimento
   - Clique em "Visualizar" em um documento
   - Verifique se o modal abre corretamente

3. **Monitorar Performance**
   - Os índices criados devem melhorar a performance das queries
   - Se notar lentidão, verifique se os índices estão sendo usados:
   ```sql
   EXPLAIN ANALYZE 
   SELECT * FROM imre_assessments 
   WHERE completion_status = 'completed';
   ```

---

## 📝 Notas Importantes

- ⚠️ **Backup**: Sempre faça backup antes de executar scripts SQL em produção
- 🔒 **Segurança**: As políticas RLS garantem que usuários só vejam seus próprios dados
- 📊 **Performance**: Os índices GIN são essenciais para busca em campos JSONB
- 🔄 **Atualização**: Os triggers garantem que `updated_at` seja atualizado automaticamente

---

## ✅ Checklist Final

- [ ] Script SQL executado sem erros
- [ ] Tabelas verificadas e existentes
- [ ] Índices criados corretamente
- [ ] Políticas RLS configuradas
- [ ] Funções auxiliares criadas
- [ ] Triggers funcionando
- [ ] KPIs aparecendo no dashboard
- [ ] Visualização de documentos funcionando

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase
2. Execute as queries de verificação acima
3. Consulte a documentação do Supabase sobre JSONB e RLS
4. Verifique se as permissões do usuário estão corretas

