# Guia: Gerar Relatórios Faltantes Automaticamente

## Situação Atual

Foram identificados **6 pacientes** com avaliações concluídas sem relatórios correspondentes:

1. **Maria Souza** (graca11souza@gmail.com) - **3 avaliações** sem relatório
2. **Dr. Ricardo Valença** (profrvalenca@gmail.com) - **2 avaliações** sem relatório
3. **Paulo Gonçalves** (paulo.goncalves@test.com) - **2 avaliações** sem relatório
4. **João Eduardo Vidal** (cbdrepremium@gmail.com) - **1 avaliação** sem relatório
5. **Dr. Ricardo Valença** (rrvalenca@gmail.com) - **1 avaliação** sem relatório
6. **aluno** (consultoriodosvalenca@gmail.com) - **1 avaliação** sem relatório

**Total: 10 avaliações** sem relatórios correspondentes.

## Solução Implementada

Foi criada uma **função RPC no Supabase** (`generate_missing_reports`) que:

1. Identifica automaticamente avaliações concluídas sem relatórios
2. Extrai os dados das avaliações
3. Gera relatórios completos usando os dados disponíveis
4. Salva os relatórios na tabela `clinical_reports`
5. Retorna o status de cada operação (sucesso ou erro)

## Como Usar

### Opção 1: Gerar Todos os Relatórios Faltantes (Recomendado)

Execute no Supabase SQL Editor:

```sql
SELECT * FROM generate_missing_reports();
```

Isso gerará relatórios para **todos os pacientes** com avaliações sem relatórios.

### Opção 2: Gerar para um Paciente Específico

Execute no Supabase SQL Editor:

```sql
-- Exemplo: Gerar relatórios para Maria Souza
SELECT * FROM generate_missing_reports(
  (SELECT id FROM users WHERE email = 'graca11souza@gmail.com' LIMIT 1)
);
```

### Opção 3: Gerar para Cada Paciente Individualmente

Execute cada comando separadamente:

```sql
-- Maria Souza (3 avaliações)
SELECT * FROM generate_missing_reports(
  (SELECT id FROM users WHERE email = 'graca11souza@gmail.com' LIMIT 1)
);

-- Dr. Ricardo Valença - profrvalenca@gmail.com (2 avaliações)
SELECT * FROM generate_missing_reports(
  (SELECT id FROM users WHERE email = 'profrvalenca@gmail.com' LIMIT 1)
);

-- Paulo Gonçalves (2 avaliações)
SELECT * FROM generate_missing_reports(
  (SELECT id FROM users WHERE email = 'paulo.goncalves@test.com' LIMIT 1)
);

-- João Eduardo Vidal (1 avaliação)
SELECT * FROM generate_missing_reports(
  (SELECT id FROM users WHERE email = 'cbdrepremium@gmail.com' LIMIT 1)
);

-- Dr. Ricardo Valença - rrvalenca@gmail.com (1 avaliação)
SELECT * FROM generate_missing_reports(
  (SELECT id FROM users WHERE email = 'rrvalenca@gmail.com' LIMIT 1)
);

-- aluno (1 avaliação)
SELECT * FROM generate_missing_reports(
  (SELECT id FROM users WHERE email = 'consultoriodosvalenca@gmail.com' LIMIT 1)
);
```

## Verificar Resultados

Após executar a função, verifique se os relatórios foram criados:

```sql
-- Ver relatórios gerados recentemente
SELECT 
  cr.id as report_id,
  cr.patient_name,
  cr.generated_at,
  cr.status,
  ca.id as assessment_id,
  ca.created_at as assessment_date
FROM clinical_reports cr
JOIN clinical_assessments ca ON ca.id = cr.assessment_id
WHERE cr.generated_at >= NOW() - INTERVAL '1 hour'
ORDER BY cr.generated_at DESC;

-- Verificar se ainda há avaliações sem relatórios
SELECT 
  u.name as patient_name,
  u.email as patient_email,
  COUNT(ca.id) as assessments_sem_relatorio
FROM clinical_assessments ca
JOIN users u ON u.id = ca.patient_id
LEFT JOIN clinical_reports cr ON cr.patient_id = ca.patient_id 
  AND cr.generated_at >= ca.created_at - INTERVAL '1 hour'
  AND cr.generated_at <= ca.created_at + INTERVAL '24 hours'
WHERE ca.status = 'completed'
  AND cr.id IS NULL
GROUP BY u.id, u.name, u.email
ORDER BY assessments_sem_relatorio DESC;
```

## Estrutura dos Relatórios Gerados

Os relatórios gerados incluem:

- **Investigation**: Dados coletados durante a avaliação
- **Methodology**: Aplicação da Arte da Entrevista Clínica (AEC) com protocolo IMRE
- **Result**: Resultados da avaliação clínica
- **Evolution**: Plano de cuidado personalizado
- **Recommendations**: Recomendações clínicas (extraídas da avaliação ou padrão)
- **Triaxial Analysis**: Análise triaxial se disponível nos dados
- **Scores**: Pontuações clínicas (extraídas da avaliação ou padrão)

## Prevenção Futura

A função `checkAndGenerateMissingReports()` no código TypeScript agora verifica periodicamente se há avaliações sem relatórios e gera automaticamente. Isso garante que o problema não se repita.

## Arquivos Criados

1. **`database/GERAR_RELATORIOS_FALTANTES_AUTOMATICO.sql`**
   - Função RPC `generate_missing_reports()`
   - Pode ser executada para gerar todos os relatórios faltantes

2. **`database/GERAR_RELATORIOS_PACIENTES_ESPECIFICOS.sql`**
   - Scripts para gerar relatórios para pacientes específicos
   - Inclui exemplos para cada paciente identificado

3. **`GUIA_GERAR_RELATORIOS_FALTANTES.md`**
   - Este guia completo

## Próximos Passos

1. Execute `GERAR_RELATORIOS_FALTANTES_AUTOMATICO.sql` no Supabase SQL Editor para criar a função RPC
2. Execute `SELECT * FROM generate_missing_reports();` para gerar todos os relatórios faltantes
3. Verifique os resultados usando os scripts de verificação
4. Confirme que os relatórios aparecem no histórico de cada paciente

