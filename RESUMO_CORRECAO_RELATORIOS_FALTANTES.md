# Resumo: Correção de Relatórios Faltantes

## Problema Reportado

A IA residente alertou que o paciente **João Eduardo Vidal** preencheu uma avaliação clínica inicial, mas não há relatório no histórico dele.

## Análise do Problema

O problema ocorre quando:
1. Uma avaliação é salva em `clinical_assessments` com status `'completed'`
2. O relatório correspondente em `clinical_reports` não é gerado automaticamente
3. Isso pode acontecer se a função `checkForAssessmentCompletion` não detectar palavras-chave específicas na mensagem do usuário

## Solução Implementada

### 1. Função de Verificação e Correção Automática

Foi adicionada a função `checkAndGenerateMissingReports()` na classe `NoaResidentAI` que:
- Verifica avaliações concluídas sem relatórios correspondentes
- Gera automaticamente os relatórios faltantes
- Pode ser chamada para um paciente específico ou para todos

**Localização:** `src/lib/noaResidentAI.ts` (linha ~3286)

### 2. Verificação Periódica Automática

A função agora verifica periodicamente (10% das interações) se há avaliações concluídas sem relatórios para o usuário atual, garantindo que relatórios sejam gerados mesmo se a detecção por palavras-chave falhar.

**Localização:** `src/lib/noaResidentAI.ts` (linha ~597)

### 3. Scripts SQL de Diagnóstico

Foram criados scripts SQL para verificar o problema:

- **`database/VERIFICAR_E_GERAR_RELATORIOS_FALTANTES.sql`**
  - Verifica todas as avaliações sem relatórios
  - Conta avaliações sem relatórios por paciente
  
- **`database/CORRIGIR_RELATORIO_JOAO_EDUARDO_VIDAL.sql`**
  - Verifica especificamente o caso do João Eduardo Vidal
  - Fornece informações detalhadas sobre avaliações e relatórios

## Como Corrigir o Caso do João Eduardo Vidal

### Passo 1: Verificar o Problema

Execute no Supabase SQL Editor:

```sql
-- Verificar avaliações do João Eduardo Vidal
SELECT 
  ca.id as assessment_id,
  ca.patient_id,
  u.name as patient_name,
  ca.status,
  ca.created_at as assessment_date,
  CASE 
    WHEN cr.id IS NULL THEN '❌ SEM RELATÓRIO'
    ELSE '✅ COM RELATÓRIO'
  END as report_status,
  cr.id as report_id
FROM clinical_assessments ca
JOIN users u ON u.id = ca.patient_id
LEFT JOIN clinical_reports cr ON cr.patient_id = ca.patient_id 
  AND cr.generated_at >= ca.created_at - INTERVAL '1 hour'
  AND cr.generated_at <= ca.created_at + INTERVAL '24 hours'
WHERE ca.status = 'completed'
  AND (u.name ILIKE '%João Eduardo%' 
       OR u.name ILIKE '%Joao Eduardo%' 
       OR u.name ILIKE '%Vidal%')
ORDER BY ca.created_at DESC;
```

### Passo 2: Corrigir via Interface da IA

Simplesmente pergunte à IA residente:
- "Verifique se há avaliações sem relatórios para o João Eduardo Vidal"
- "Gere relatórios faltantes para o paciente João Eduardo Vidal"

A IA agora tem a capacidade de verificar e gerar relatórios faltantes automaticamente.

### Passo 3: Verificar a Correção

Execute novamente o script SQL do Passo 1 para confirmar que os relatórios foram criados.

## Prevenção Futura

A função `checkAndGenerateMissingReports()` agora é chamada:
1. **Periodicamente** durante as interações com a IA (10% das vezes)
2. **Automaticamente** quando uma avaliação é detectada como concluída
3. **Sob demanda** quando solicitado pela IA ou pelo usuário

Isso garante que relatórios sejam gerados mesmo se a detecção por palavras-chave falhar.

## Arquivos Modificados

1. **`src/lib/noaResidentAI.ts`**
   - Adicionada função `checkAndGenerateMissingReports()`
   - Adicionada verificação periódica no `processMessage()`

2. **`database/VERIFICAR_E_GERAR_RELATORIOS_FALTANTES.sql`** (novo)
   - Scripts SQL para verificar avaliações sem relatórios

3. **`database/CORRIGIR_RELATORIO_JOAO_EDUARDO_VIDAL.sql`** (novo)
   - Script SQL específico para o caso do João Eduardo Vidal

4. **`GUIA_CORRECAO_RELATORIOS_FALTANTES.md`** (novo)
   - Guia completo de correção

## Próximos Passos

1. Execute o script SQL de verificação para confirmar o problema
2. Use a interface da IA para solicitar a geração do relatório faltante
3. Verifique se o relatório foi criado corretamente
4. O sistema agora previne esse problema automaticamente

## Notas Técnicas

- A função `checkAndGenerateMissingReports()` usa a mesma lógica do `clinicalReportService.generateAIReport()` para garantir consistência
- Os relatórios são gerados com base nos dados da avaliação armazenados em `clinical_assessments.data`
- A verificação periódica é feita de forma assíncrona e não bloqueia a resposta da IA

