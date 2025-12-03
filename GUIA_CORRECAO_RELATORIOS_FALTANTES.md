# Guia de Correção: Relatórios Faltantes

## Problema Identificado

A IA residente alertou que o paciente **João Eduardo Vidal** preencheu uma avaliação clínica inicial, mas não há relatório no histórico dele. Se há uma avaliação, deve haver um relatório.

## Causa Raiz

Quando uma avaliação é salva em `clinical_assessments` com status `'completed'`, o relatório correspondente em `clinical_reports` nem sempre é gerado automaticamente. Isso pode acontecer quando:

1. A avaliação é concluída através do chat sem usar palavras-chave específicas
2. A função `checkForAssessmentCompletion` não detecta a conclusão
3. Há um erro silencioso na geração do relatório

## Solução Implementada

### 1. Função de Verificação Automática

Foi adicionada a função `checkAndGenerateMissingReports()` no `noaResidentAI.ts` que:

- Verifica avaliações concluídas sem relatórios correspondentes
- Gera automaticamente os relatórios faltantes
- Pode ser chamada para um paciente específico ou para todos

### 2. Verificação Periódica

A função agora verifica periodicamente (10% das interações) se há avaliações concluídas sem relatórios para o usuário atual.

### 3. Scripts SQL de Diagnóstico

Foram criados scripts SQL para verificar o problema:

- `VERIFICAR_E_GERAR_RELATORIOS_FALTANTES.sql` - Verifica todas as avaliações sem relatórios
- `CORRIGIR_RELATORIO_JOAO_EDUARDO_VIDAL.sql` - Verifica especificamente o caso do João Eduardo Vidal

## Como Corrigir o Caso do João Eduardo Vidal

### Opção 1: Via SQL (Diagnóstico)

1. Execute o script `CORRIGIR_RELATORIO_JOAO_EDUARDO_VIDAL.sql` no Supabase SQL Editor
2. Identifique o `patient_id` do João Eduardo Vidal
3. Verifique se há avaliações sem relatórios

### Opção 2: Via Código (Correção Automática)

```typescript
import { getNoaResidentAI } from './lib/noaResidentAI'

const noaAI = getNoaResidentAI()

// Para o João Eduardo Vidal especificamente
const patientId = 'id_do_joao_eduardo_vidal'
await noaAI.checkAndGenerateMissingReports(patientId)

// Ou para todos os pacientes
await noaAI.checkAndGenerateMissingReports()
```

### Opção 3: Via Interface da IA

Simplesmente pergunte à IA residente:
- "Verifique se há avaliações sem relatórios para o João Eduardo Vidal"
- "Gere relatórios faltantes para o paciente João Eduardo Vidal"

## Verificação

Após a correção, verifique:

1. Execute o script SQL de verificação novamente
2. Confirme que os relatórios foram criados na tabela `clinical_reports`
3. Verifique se os relatórios aparecem no histórico do paciente

## Prevenção Futura

A função `checkAndGenerateMissingReports()` agora é chamada periodicamente durante as interações com a IA, garantindo que relatórios sejam gerados mesmo se a detecção por palavras-chave falhar.

## Estrutura dos Dados

### Tabela `clinical_assessments`
- Armazena as avaliações clínicas
- Status: `'in_progress'` ou `'completed'`
- Quando `status = 'completed'`, deve haver um relatório correspondente

### Tabela `clinical_reports`
- Armazena os relatórios clínicos gerados
- Deve ter um registro para cada avaliação concluída
- Relacionado por `patient_id` e `generated_at` próximo ao `created_at` da avaliação

## Logs e Debugging

A função `checkAndGenerateMissingReports()` registra:
- ✅ Relatórios gerados com sucesso
- ❌ Erros ao gerar relatórios
- 🔍 Avaliações verificadas

Verifique o console do navegador ou os logs do servidor para acompanhar o processo.

