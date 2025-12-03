# Instruções: Gerar Relatório para João Eduardo Vidal

## Situação

- **Avaliação ID**: `965c5b51-448e-4b1f-b92f-e081230c6ec6`
- **Paciente**: JOão Eduardo Vidal
- **Patient ID**: `923eb201-9ae8-42f5-a95e-662c0b1079ce`
- **Data da Avaliação**: 2025-11-26 15:46:53
- **Status**: ❌ SEM RELATÓRIO - PRECISA GERAR

## Solução Rápida

### Opção 1: Usar a Função RPC (Recomendado)

Se você já executou o script `GERAR_RELATORIOS_FALTANTES_AUTOMATICO.sql`, execute:

```sql
SELECT * FROM generate_missing_reports('923eb201-9ae8-42f5-a95e-662c0b1079ce');
```

### Opção 2: Script Manual Específico

Execute o arquivo `GERAR_RELATORIO_JOAO_EDUARDO_VIDAL_ESPECIFICO.sql` no Supabase SQL Editor.

Este script:
1. Verifica os dados da avaliação
2. Extrai todas as informações disponíveis
3. Gera o relatório completo
4. Salva na tabela `clinical_reports`
5. Verifica se foi criado com sucesso

## Passo a Passo

1. **Abra o Supabase SQL Editor**
2. **Execute o script completo** `GERAR_RELATORIO_JOAO_EDUARDO_VIDAL_ESPECIFICO.sql`
3. **Verifique os resultados** usando a query de verificação no final do script

## Verificação

Após executar, verifique se o relatório foi criado:

```sql
SELECT 
  cr.id as report_id,
  cr.patient_name,
  cr.generated_at,
  cr.status,
  ca.id as assessment_id
FROM clinical_assessments ca
LEFT JOIN clinical_reports cr ON cr.assessment_id = ca.id
WHERE ca.id = '965c5b51-448e-4b1f-b92f-e081230c6ec6';
```

Se o `report_id` não for `null`, o relatório foi criado com sucesso! ✅

## Conteúdo do Relatório

O relatório será gerado com base nos dados já armazenados na avaliação:

- **Investigation**: Dados coletados durante a avaliação
- **Methodology**: Aplicação da Arte da Entrevista Clínica (AEC) com protocolo IMRE
- **Result**: Resultados da avaliação clínica
- **Evolution**: Plano de cuidado personalizado
- **Recommendations**: Recomendações clínicas
- **Triaxial Analysis**: Análise triaxial (se disponível)
- **Scores**: Pontuações clínicas (se disponível)

## Próximos Passos

Após gerar o relatório:

1. O relatório aparecerá automaticamente no histórico do paciente
2. Profissionais poderão visualizar o relatório na seção de relatórios clínicos
3. O paciente poderá acessar seu relatório no dashboard

