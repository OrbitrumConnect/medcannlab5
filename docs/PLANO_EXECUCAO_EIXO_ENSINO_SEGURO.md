# PLANO DE EXECUÇÃO: UNIVERSIDADE DIGITAL MEDCANNLAB (ENSINO COM NÔA)
**Versão 2.0 (Corrigida pós-Auditoria Direta de DB)** — *Foco absoluto em "NÃO QUEBRAR O QUE TEMOS HOJE"*

---

## 🏛️ 1. O Diagnóstico Arquitetural da Verdade (O que temos)
Pós-auditoria do Supabase (Lovable), os fatos cristalinos são:
- A tabela genérica `lessons` e `modules` existem e detêm esquema rico, mas estão vazias.
- A tabela `course_modules` JÁ POSSUI a coluna `order_index`.
- O curso "Arte da Entrevista Clínica" JÁ ESTÁ na tabela `courses` oculto (`is_published = false`). Criar um novo geraria duplicação catastrófica.
- O Frontend (`LessonPage.tsx`) busca ativamente dados da tabela `noa_lessons` (incluindo tentativas de leitura das colunas `video_url` e `pdf_url`). 

Portanto, **a decisão arquitetural foi tomada: `noa_lessons` É A TABELA CANÔNICA DE AULAS.** 
Adotaremos o plano tático em 3 Fases Híbridas.

---

## 🛡️ 2. O PLANO DE AÇÃO: TRANSIÇÃO SEGURA

### FASE 1: Ampliação do Banco (Hoje) - Risco ZERO
*(Atualizar sem destruir).*

1. **Expansão de `noa_lessons`:** 
   Adicionar rigorosamente as colunas faltantes (`video_url`, `pdf_url`, `content_type`, `course_id`, `module_id`, e o cirúrgico `order_index`).
2. **Criação de Progresso (`user_lesson_progress`):** 
   Criar a tabela autônoma de *tracking* de alunos com as RLS Policies corretas.
3. **Povoamento via UPDATE (Não INSERT):**
   Rodar um `UPDATE courses SET instructor = 'Dr. Ricardo Valença'` nos cursos inativos. Preencher os Módulos (`course_modules`) do curso "Arte da Entrevista Clínica" que **já existe** no banco, apontando o ID real dele.
4. **Isolamento de Tabelas Antigas (Sem DROP):**
   Manteremos as tabelas vazias `lessons` e `modules` INTACTAS neste momento. Um `DROP TABLE` cego pode explodir *Foreign Keys* ou consultas perdidas no código. Ignorá-las é o procedimento seguro.

### FASE 2: Frontend Híbrido (Backend Orientado)
*(Aqui trocamos os trilhos com o trem andando).*

1. **Atualização do `LessonPage.tsx`:** 
   Adicionaremos uma **lógica paralela**. A página vai olhar se a URL contém um `?lessonId=UUID` (o modelo novo e robusto do plano aprovado). Escrita no modelo:
   ```typescript
   if (searchParams.has('lessonId')) {
       // FLUXO NOVO (Robusto via noa_lessons id)
       loadLessonById(lessonId);
   } else {
       // FLUXO ANTIGO (Fallback não destrutivo)
       loadLessonDataViaTitles(); // Como é hoje
   }
   ```
2. **Habilitar o Save Progress:** Substituir a tag `// TODO: Marcar completado` do código pela função `supabase.from('user_lesson_progress').insert(...)`
3. **Isolamento de Carregamento (Loading State):** 
   Implementar a cascata `Session -> Course -> Modules`, injetando telas de `return <div>Carregando</div>` no momento principal do DOM do React para prevenir o temido `NotFoundError: removeChild`.

### FASE 3: Enchimento e "Go-Live" de Conteúdo
*(Quando a tecnologia for invisível, preenchemos a clínica).*

1. Subir os URLs reais dos vídeos do Dr. Ricardo (Listados como Ocultos no YouTube) direto nas linhas de `noa_lessons`.
2. Habilitar a interpretação LLM sobre a Transcrição dos vídeos gerando a didática no componente *LessonViewer*.
3. Virar a chave `is_published = true` (UPDATE, não INSERT) e noticiar aos 11 alunos fantasmas registrados.

---

## 📜 3. Acordo Selado
Essa ordem garante 100% que as telas hoje navegáveis continuarão respirando, impedindo duplicação de dados, e elevando `noa_lessons` ao status de Fonte da Verdade Definitiva do Eixo Ensino. Este documento servirá como **Sprint Padrão** guiando os scripts vindouros.

*Status: Pronto para autorização da Fase 1 (Gerar Script SQL).*
