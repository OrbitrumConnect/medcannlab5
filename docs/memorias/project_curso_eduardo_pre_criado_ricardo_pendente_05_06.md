---
name: project_curso_eduardo_pre_criado_ricardo_pendente_05_06
description: "Pedro flagou 05/06 que ambiente de curso pré-criado existe pra Eduardo (CursoEduardoFaveret.tsx — 'Pós-Graduação em Cannabis Medicinal' R$1999 2 meses/60h Avançado, carrega módulos de course_modules + noa_lessons) mas NÃO existe equivalente pra Ricardo. O que Ricardo tem: 1 entry kb-curso-aec em base_conhecimento (RAG, não UI) + página ArteEntrevistaClinica.tsx (landing, não curso estruturado) + 4 protocolos cravados em CAR (DRCTEZ/renal-medcannlab/IMRE Cannabis/Onboarding). Para 'quarta-feira com os alunos' escalar (30→1000), Ricardo precisa de ambiente equivalente. Replicar pattern Eduardo = ~4-6h código MAS depende Ricardo entregar conteúdo (Manual v1.1) OR autorizar adaptar protocolos CAR existentes como módulos."
type: project
---

# Curso Eduardo pré-criado / Curso Ricardo pendente

## Estado empírico (auditoria 05/06 via codebase)

Pedro flagou na conversa pós-jantar: *"para Eduardo acho que Ricardo ainda não 100%! avaliar."*

Confirmação empírica via Glob+Grep no codebase:

### ✅ Eduardo TEM ambiente pré-criado completo

[src/pages/CursoEduardoFaveret.tsx](src/pages/CursoEduardoFaveret.tsx):
- **Título**: "Pós-Graduação em Cannabis Medicinal"
- **Instructor cravado**: Dr. Eduardo Faveret
- **Pricing**: R$ 1.999 (de R$ 2.999)
- **Duração**: 2 meses / 60 horas
- **Nível**: Avançado
- **Certificado**: sim
- **Infra técnica**:
  - Carrega módulos de tabela `course_modules` (Supabase)
  - Carrega conteúdo de aulas de `noa_lessons` (com fallback localStorage)
  - Sistema de assignments + progresso aluno + edição inline de conteúdo
  - Identifica curso por `title.ilike.%cannabis medicinal%` OR `title.ilike.%eduardo%`

### ❌ Ricardo NÃO tem equivalente pré-criado

Busca: `src/pages/Curso*.tsx` retorna apenas:
1. `CursoEduardoFaveret.tsx` (Cannabis Medicinal)
2. `CursoJardinsDeCura.tsx` (Dengue / Agentes Comunitários — projeto separado, não Ricardo)

Busca: `src/pages/*Ricardo*.tsx` retorna **zero arquivos**.

**O que Ricardo TEM hoje** (disperso, sem ambiente unificado):
- 1 entry hand-crafted `kb-curso-aec` em `base_conhecimento` (RAG curado V1.9.318 — É RAG, NÃO é página de curso)
- [src/pages/ArteEntrevistaClinica.tsx](src/pages/ArteEntrevistaClinica.tsx) (página informativa/landing — não é curso estruturado com módulos/aulas/progresso)
- 4 protocolos cravados em [CidadeAmigaDosRins.tsx:437-512](src/pages/CidadeAmigaDosRins.tsx#L437): avaliacao-cannabis / drcteza / renal-medcannlab / onboarding-profissionais (são **protocolos clínicos**, não módulos de curso)

## Implicação operacional

Pra "quarta-feira com os alunos" (formato escala arquitetado por João Vidal — `project_quarta_feira_com_alunos_formato_escala_ricardo_05_06`) escalar de 30 → 60 → 90 → 1000 alunos, Ricardo precisa de **ambiente de curso equivalente ao de Eduardo**. Caso contrário:

- Eduardo direciona aluno → `/curso-eduardo-faveret` → infra completa
- Ricardo direciona aluno → ❓ (não tem rota equivalente) → fricção UX + percepção de desigualdade

## Caminhos para fechar o gap

### Caminho A — Replicar pattern Eduardo (esforço código baixo)

Criar `src/pages/CursoRicardoValenca.tsx` espelhando estrutura `CursoEduardoFaveret.tsx`:

**Título proposto**: "Arte da Entrevista Clínica + Cidade Amiga dos Rins — Método autoral Dr. Ricardo Valença"
**Instructor**: Dr. Ricardo Valença
**Duração proposta**: 2 meses / 60 horas (paridade com Eduardo)
**Nível**: Avançado
**Pricing**: a definir Ricardo (paridade R$ 1.999 OR diferenciado)

**Módulos sugeridos** (mapeando o que JÁ existe):
1. AEC + MIMRE/IMRE (base RAG existente `kb-curso-aec`)
2. Constituição Ricardo: queixa ≠ sintoma (memória 24/05)
3. CAR — Cidade Amiga dos Rins (programa físico → digital)
4. Estagiamento DRC pré-creatinina (Sidecar V1.9.307)
5. DRC + TEZ Integrada (interseção Eduardo — protocolo `drcteza`)
6. Protocolo Saúde Renal + Cannabis (protocolo `renal-medcannlab`)
7. Mapa farmacológico DRC × cannabinoides (memória 05/06)
8. Remissão DRC inflamatória (memória 05/06)
9. Bula como infraestrutura cognitiva (memória 27/05)

**Infra**: mesma `course_modules` + `noa_lessons` (zero migração).

**Esforço código**: ~4-6h (1 sessão).

**Bloqueio**: Ricardo precisa entregar **conteúdo dos módulos** (Manual v1.1 equivalente do dele) OU autorizar adaptar memórias/protocolos como aulas.

### Caminho B — Aguardar Manual v1.1 Ricardo

Eduardo tem pendência Manual v1.1 declarada (Marco 3). Ricardo pode estar em situação similar — esperar ele entregar texto autoral antes de codar ambiente.

**Tradeoff**: atrasa curso Ricardo MAS preserva autoria + evita invasão domínio metodológico.

### Caminho C — Adaptar protocolos CAR como módulos com aprovação Ricardo

Os 4 protocolos cravados em CAR JÁ têm conteúdo descritivo + iaPrompt + knowledgeRoute. Pode-se:
1. Apresentar a Ricardo cada protocolo como **proposta de módulo**
2. Ele aprova/edita/rejeita cada um
3. Codifica `CursoRicardoValenca.tsx` carregando esses 4 + os adicionais (1, 2, 7, 8, 9 da lista A)

**Esforço**: ~4-6h código + 1-2h conversa Ricardo.

### Caminho D — Não codar até "quarta-feira com alunos" virar real

Se ritual semanal não tem 30 alunos pagantes externos ainda, não há urgência operacional. Pode esperar Marco 1 (CNPJ 10/06) + Marco 2 (2º médico) + funil aquisição ativo.

## Anti-padrão a vigiar

❌ **NUNCA codar curso Ricardo sem GO dele** — invasão de domínio metodológico. AEC + MIMRE + CAR são autorais (bio Ricardo cravada).
❌ **NUNCA replicar conteúdo do Eduardo "adaptado" pra Ricardo** — métodos são diferentes, domínios são diferentes.
❌ **NUNCA cobrar mais por curso de um do que outro sem alinhamento sócios** — afeta governança comercial.

## Pendências de validação Pedro+Ricardo

1. **Ricardo autoriza criar `CursoRicardoValenca.tsx`** espelhando pattern Eduardo?
2. **Manual v1.1 Ricardo** existe OR está sendo desenvolvido?
3. **Conteúdo dos módulos** — Ricardo escreve OR adapta protocolos CAR existentes?
4. **Pricing** — paridade Eduardo (R$ 1.999) OR diferenciado?
5. **Eduardo tem `noa_lessons` POPULADO** ou também esperando Manual v1.1? (auditar via PAT)
6. **Quem é "Fernando Bossa"** mencionado como possível instructor convidado? Precisa de ambiente próprio também?

## Verificação empírica que dá pra fazer HOJE via PAT

```sql
-- 1. Quantos cursos existem?
SELECT id, title, instructor, is_published, created_at FROM courses;

-- 2. Quantos módulos populados pro curso Eduardo?
SELECT cm.id, cm.title, cm.order_index, LENGTH(cm.content) as content_length
FROM course_modules cm
JOIN courses c ON c.id = cm.course_id
WHERE c.title ILIKE '%cannabis medicinal%' OR c.title ILIKE '%eduardo%'
ORDER BY cm.order_index;

-- 3. Quantas aulas populadas em noa_lessons?
SELECT course_title, COUNT(*) AS lessons_count
FROM noa_lessons
GROUP BY course_title;

-- 4. Quantos enrollments existem?
SELECT c.title, COUNT(ce.id) AS enrollments
FROM courses c
LEFT JOIN course_enrollments ce ON ce.course_id = c.id
GROUP BY c.title;
```

Resultado dessa auditoria diz se Eduardo só tem **AMBIENTE** ou também tem **CONTEÚDO** populado.

## Conexões

- `project_quarta_feira_com_alunos_formato_escala_ricardo_05_06` — formato escala
- `project_intersecao_renal_cannabis_eduardo_ricardo_4_protocolos_05_06` — protocolos CAR
- `reference_mapa_farmacologico_drc_cannabinoides_anti_inflamatorios_05_06` — módulo proposto 7
- `project_remissao_drc_inflamatoria_anchor_pesquisa_05_06` — módulo proposto 8
- `feedback_bula_e_infraestrutura_cognitiva_no_fluxo_prescricao_27_05` — módulo proposto 9
- `reference_ricardo_valenca_bio_autoral_mimre_31_05` — bio autoral Ricardo

## Frase ancora

> *"05/06 Pedro flagou: Eduardo tem ambiente curso pré-criado (CursoEduardoFaveret.tsx, R$1999, 2 meses/60h, Avançado, carrega course_modules+noa_lessons) — Ricardo NÃO tem equivalente. Ricardo tem disperso: 1 entry kb-curso-aec (RAG) + ArteEntrevistaClinica landing + 4 protocolos CAR. Pra 'quarta-feira com alunos' escalar 30→1000, Ricardo precisa ambiente paritário. 4 caminhos: A) replicar pattern (~4-6h código, depende conteúdo Ricardo); B) aguardar Manual v1.1; C) adaptar protocolos CAR como módulos com GO Ricardo; D) esperar Marco 1+2 antes de codar. Anti-padrão: nunca codar curso sem GO Ricardo (invasão domínio metodológico). Auditoria empírica HOJE via PAT pode confirmar se Eduardo tem só ambiente OR conteúdo populado."*
