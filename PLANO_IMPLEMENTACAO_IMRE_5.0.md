# 🏥 PLANO DE IMPLEMENTAÇÃO - IMRE 3.0 → 5.0 UNIFICATION

## 📋 **VISÃO GERAL**

Este documento descreve o plano completo para implementar a unificação do sistema IMRE Triaxial do MedCannLab 3.0 para a versão 5.0, preservando toda a "alma semântica" do sistema original.

---

## 🎯 **OBJETIVOS**

1. ✅ Preservar os 37 blocos semânticos do sistema IMRE 3.0
2. ✅ Integrar com a estrutura real de usuários do 5.0
3. ✅ Manter a escuta semântica profunda
4. ✅ Habilitar correlações clínicas
5. ✅ Garantir segurança com RLS
6. ✅ Otimizar performance com índices

---

## 📁 **ARQUIVOS NECESSÁRIOS**

### **1. SQL Principal**
- ✅ `IMRE_UNIFICATION_3.0_TO_5.0_COMPLETE.sql` - Script SQL completo

### **2. Código TypeScript**
- ✅ `src/lib/imreMigration.ts` - Já existe, precisa atualizar
- ⚠️ `src/lib/clinicalAssessmentService.ts` - Verificar integração
- ⚠️ `src/pages/ClinicalAssessment.tsx` - Verificar uso das novas tabelas

### **3. Documentação**
- ✅ Este arquivo (plano de implementação)

---

## 🚀 **PASSO A PASSO DE IMPLEMENTAÇÃO**

### **FASE 1: PREPARAÇÃO** ✅

1. ✅ Criar SQL completo com todas as tabelas
2. ✅ Definir estrutura de dados
3. ✅ Planejar migração

### **FASE 2: EXECUÇÃO DO SQL** ⏳

1. **Acessar Supabase SQL Editor**
   - Ir para: https://supabase.com/dashboard
   - Selecionar projeto
   - Abrir SQL Editor

2. **Executar Script Principal**
   ```sql
   -- Copiar e colar o conteúdo de:
   -- IMRE_UNIFICATION_3.0_TO_5.0_COMPLETE.sql
   ```

3. **Verificar Criação**
   - Verificar se as 5 tabelas foram criadas
   - Verificar se RLS está habilitado
   - Verificar se índices foram criados

### **FASE 3: ATUALIZAÇÃO DO CÓDIGO** ⏳

1. **Atualizar `imreMigration.ts`**
   - Verificar se as interfaces estão corretas
   - Atualizar queries para usar novas tabelas
   - Testar funções de migração

2. **Atualizar `clinicalAssessmentService.ts`**
   - Integrar com novas tabelas IMRE
   - Atualizar funções de salvamento
   - Testar criação de avaliações

3. **Atualizar `ClinicalAssessment.tsx`**
   - Verificar se está usando as novas tabelas
   - Testar fluxo completo de avaliação
   - Verificar salvamento de blocos

### **FASE 4: MIGRAÇÃO DE DADOS** ⏳

1. **Verificar Dados Existentes**
   - Verificar se há dados no IndexedDB
   - Verificar se há dados em outras tabelas

2. **Executar Migração**
   - Usar `imreMigration.ts` para migrar
   - Validar dados migrados
   - Verificar integridade

### **FASE 5: TESTES** ⏳

1. **Testes Unitários**
   - Testar criação de avaliação
   - Testar salvamento de blocos
   - Testar contexto semântico

2. **Testes de Integração**
   - Testar fluxo completo
   - Testar RLS
   - Testar tempo real

3. **Testes de Performance**
   - Verificar queries
   - Verificar índices
   - Verificar tempo de resposta

---

## 📊 **ESTRUTURA DAS TABELAS**

### **1. imre_assessments**
- Armazena avaliações completas
- Contém dados triaxiais (JSONB)
- Status de conclusão
- Metadados clínicos

### **2. imre_semantic_blocks**
- 37 blocos semânticos
- Pesos emocionais, cognitivos, comportamentais
- Scores de confiança
- Validação

### **3. imre_semantic_context**
- Contexto persistente
- Memória semântica acumulada
- Padrões emocionais
- Trajetórias cognitivas

### **4. noa_interaction_logs**
- Logs de interação com NOA
- Multimodal (voz, texto, vídeo)
- Análise semântica
- Estados emocionais

### **5. clinical_integration**
- Integração com dados clínicos
- Correlações IMRE ↔ Clínicas
- Avaliação de risco
- Recomendações terapêuticas

---

## 🔐 **SEGURANÇA (RLS)**

Todas as tabelas têm RLS habilitado com políticas:
- ✅ Usuários só veem seus próprios dados
- ✅ Usuários só inserem seus próprios dados
- ✅ Usuários só atualizam seus próprios dados
- ✅ Blocos vinculados às avaliações do usuário

---

## ⚡ **PERFORMANCE**

### **Índices Criados:**
- ✅ Índices B-tree para chaves estrangeiras
- ✅ Índices GIN para campos JSONB
- ✅ Índices compostos para queries frequentes
- ✅ Índices parciais para otimização

### **Otimizações:**
- ✅ Triggers para updated_at automático
- ✅ Views materializadas (se necessário)
- ✅ Funções auxiliares otimizadas

---

## 🧪 **TESTES NECESSÁRIOS**

### **1. Teste de Criação**
```typescript
// Criar uma avaliação IMRE
const assessment = await createIMREAssessment({
  userId: 'user-id',
  triaxialData: { ... },
  semanticContext: { ... }
});
```

### **2. Teste de Blocos**
```typescript
// Criar blocos semânticos
const blocks = await createSemanticBlocks(assessmentId, blocks);
```

### **3. Teste de Contexto**
```typescript
// Atualizar contexto semântico
const context = await updateSemanticContext(userId, newContext);
```

### **4. Teste de RLS**
```typescript
// Tentar acessar dados de outro usuário (deve falhar)
const otherUserData = await getAssessments(otherUserId);
```

---

## 📝 **CHECKLIST DE IMPLEMENTAÇÃO**

### **SQL e Banco de Dados**
- [ ] Executar script SQL completo
- [ ] Verificar criação de 5 tabelas
- [ ] Verificar RLS habilitado
- [ ] Verificar índices criados
- [ ] Verificar triggers funcionando
- [ ] Verificar funções auxiliares
- [ ] Verificar views criadas
- [ ] Verificar tempo real habilitado

### **Código TypeScript**
- [ ] Atualizar interfaces
- [ ] Atualizar queries
- [ ] Atualizar serviços
- [ ] Atualizar componentes
- [ ] Testar criação
- [ ] Testar leitura
- [ ] Testar atualização
- [ ] Testar migração

### **Testes**
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes de RLS
- [ ] Testes de performance
- [ ] Testes de migração

### **Documentação**
- [ ] Documentar APIs
- [ ] Documentar estruturas
- [ ] Documentar fluxos
- [ ] Atualizar README

---

## 🎯 **RESULTADO ESPERADO**

Após a implementação completa:

1. ✅ Sistema IMRE 3.0 totalmente preservado
2. ✅ Integração completa com MedCannLab 5.0
3. ✅ 37 blocos semânticos funcionando
4. ✅ Contexto semântico persistente
5. ✅ Correlações clínicas ativas
6. ✅ Segurança garantida (RLS)
7. ✅ Performance otimizada
8. ✅ Tempo real funcionando

---

## 📞 **SUPORTE**

Em caso de problemas:
1. Verificar logs do Supabase
2. Verificar console do navegador
3. Verificar políticas RLS
4. Verificar índices
5. Consultar documentação

---

**Status**: ✅ SQL COMPLETO CRIADO - PRONTO PARA EXECUÇÃO

**Próximo Passo**: Executar `IMRE_UNIFICATION_3.0_TO_5.0_COMPLETE.sql` no Supabase

