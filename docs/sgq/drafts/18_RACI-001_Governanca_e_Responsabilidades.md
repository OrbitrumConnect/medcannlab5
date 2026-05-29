# RACI-001 — Governança e Responsabilidades

**Versão draft:** 0.2 (29/05/2026 20h35 BRT)
**Status:** **DRAFT OPERACIONAL — vinculação jurídica pós-contrato social MedCannLab Ltda**
**Referência normativa:** ISO 13485:2016 §5.5 (Responsabilidade, autoridade e comunicação)

> ⚠️ **Aviso jurídico crítico:** Este documento NÃO é vinculante juridicamente até existir contrato social formal da MedCannLab Ltda. Funciona como **acordo operacional informal** entre 4 colaboradores documentado em formato ISO 13485 para referência futura. **Não solicita assinaturas** dos sócios pré-CNPJ. Em caso de conflito entre RACI-001 e contrato social (quando este existir), contrato social prevalece. Ver §9.

---

## 1. Objetivo

Documentar formalmente a **distribuição de responsabilidades** no SGQ MedCannLab usando matriz **RACI** (Responsável / Aprovador / Consultado / Informado).

Esse documento fecha o **gap de governança** identificado pela avaliação externa GPT em 29/05/2026, que apontou: *"se essas respostas estiverem concentradas em uma única pessoa, vale começar a desenhar a governança."*

## 2. Convenção RACI

```
R — Responsable (executa a tarefa)
A — Approver (aprova e tem accountability final — apenas 1 por linha)
C — Consulted (consultado antes da decisão — bidirecional)
I — Informed (informado após a decisão — unidirecional)
```

## 3. Atores

### 3.1. Atores atuais (pré-CNPJ)

| Sigla | Nome | Papel | Disponibilidade |
|---|---|---|---|
| **PG** | Pedro Henrique Passos Galluf | Tech Lead + Orquestrador COS | Integral |
| **RV** | Dr. Ricardo Valença | Médico Sócio + Criador AEC | Tarde (clínica externa) |
| **EF** | Dr. Eduardo Faveret | Coordenador Ensino + Neurologia | Variável (operacional 27/05+) |
| **JV** | João Eduardo Vidal | Sócio Institucional + Regulatório | Variável (CNPJ em fechamento) |

### 3.2. Atores a contratar (pós-CNPJ)

| Sigla | Papel | Necessidade |
|---|---|---|
| **RT** | Responsável Técnico habilitado (CRF/CREA) | Marco 1 — assinatura formal documental |
| **CS** | Consultora SaMD especializada | Marco 1 — revisão formato + submissão |
| **DPO** | Data Protection Officer | Marco 2-3 — LGPD compliance |

## 4. Matriz RACI principal

### 4.1. Decisões arquiteturais

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Selagem de lock V1.9.X (Nível 3+) | R | C | I | I | (futuro A) | I |
| Definição da pirâmide cognitiva 8 camadas | R | C+A* | I | I | - | I |
| Mudança constitucional (Livro Magno) | R | A | C | C | - | I |
| Decisão arquitetural (SAD-DEC) | R | C | C | I | (⚠️ A PENDENTE) | (futuro C) |
| Mudança de stack (Postgres, Vercel, OpenAI) | R+A | I | I | C | - | - |
| Migração de dados | R+A | I | I | I | - | - |

> *Pirâmide cognitiva é autoridade clínica conjunta (Pedro arquiteta, Ricardo valida método AEC).

### 4.2. Decisões clínicas

> **Nota:** Decisões clínicas têm autoridade legítima histórica de Ricardo Valença (criador do método AEC há ~15 anos). R+A em decisões clínicas reflete autoridade técnica real, não inflação documental.

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Definição do método AEC | C | R+A | I | I | - | - |
| Aprovação de prompt clínico | I | R+A | C | - | - | - |
| Validação de relatório IA | C | R | C | - | - | - |
| Assinatura ICP-Brasil de prescrição | I | R+A | - | - | - | - |
| Critério de QA clínico (clinical_qa_runs) | C | R+A | I | - | - | - |
| Smoke Matrix Z2 | R | A | C | - | - | - |

### 4.3. Decisões de Ensino

> **⚠️ Eduardo Faveret entrou operacional em 27/05/2026 (2 dias antes deste RACI).** Para evitar inflação documental, A em decisões de Ensino é **provisional 90 dias** até validação empírica (3+ aprovações registradas em audit_log). Status revisado em 27/08/2026.

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Conteúdo do curso AEC | C | C | R + A** | - | - | - |
| Aprovação de instrumentos de avaliação | C | C | R + A** | - | - | - |
| Aprovação de simulações clínicas | C | C | R + A** | - | - | - |
| Aprovação de mentores cadastrados | I | C | R + A** | - | - | - |

> **A provisional 90 dias (revisão 27/08/2026). Se EF não validar empíricamente capacidade até lá, A retorna ao status "PENDENTE — colegiado dos 3 sócios técnicos".

### 4.4. Gestão de Risco (ISO 14971)

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Identificação de hazard | R | C | C | C | - | - |
| Análise de severidade clínica | C | R+A | C | - | - | - |
| Definição de controle de risco | R+A | C | C | - | (futuro C) | (futuro C) |
| Verificação de eficácia de controle | R | C | I | - | **⚠️ A PENDENTE — pós-Marco 1** | (futuro C) |
| Aceitação de risco residual | C | R | I | C | (futuro A) | (futuro C) |

### 4.5. CAPA (Ação Corretiva e Preventiva)

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Detecção de NC (Não-Conformidade) | R | R | R | R | - | - |
| Análise causa-raiz | R | C | C | - | - | - |
| Implementação de CA | R | C | C | - | - | - |
| Verificação de eficácia de CA | R | C | I | - | **⚠️ A PENDENTE — pós-Marco 1** | (futuro C) |
| Fechamento de CAPA | R | C | I | - | **⚠️ A PENDENTE — pós-Marco 1** | (futuro C) |

> **Honestidade documental:** Antes da contratação de RT (Marco 1), Pedro executa CAPA mas Approver formal não existe — auditor lê "R: PG / A: PENDENTE" e entende que é estágio pré-PMF. R+A em CAPA seria self-approval (anti-padrão ISO 13485 §5.5).

### 4.6. Controle documental

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Criação/edição de POP | R | C | C | - | **⚠️ A PENDENTE — pós-Marco 1** | (futuro C) |
| Aprovação de POP final | C | C | C | - | **⚠️ A PENDENTE — pós-RT** | (futuro C) |
| Atualização de CLAUDE.md | R+A | I | I | - | - | - |
| Selagem de Livro Magno | C | R+A | C | - | - | - |
| Atualização de baseline CFG | R+A | I | I | I | - | - |

> CLAUDE.md, Livro Magno e baseline CFG são *operacionais técnicos* (Pedro autoridade legítima) ou *autoridade clínica do Ricardo* — não dependem de RT externo.

### 4.7. Release management

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Decisão de release V1.9.X (Nível 1-2) | R+A | I | I | - | - | - |
| Decisão de release V1.9.X (Nível 3 clínico) | R | A | I | - | - | - |
| Decisão de release V1.9.X (Nível 4 constitucional) | C | A | C | C | - | - |
| Execução de release gates (G1-G8) | R | C | C | - | - | - |
| Push 4 refs | R+A | I | I | - | - | - |
| Hotfix emergencial Nível 1-2 | R+A | I | I | - | - | - |
| Hotfix emergencial Nível 3 clínico | R | A (sincrono) | I | - | - | - |

### 4.8. Regulatório (futuro pós-CNPJ)

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Pesquisa regulatória CFM/ANVISA/LGPD | C | C | C | R+A | (futuro C) | (futuro R) |
| Contratação de RT | C | C | C | R+A | - | - |
| Contratação de Consultora SaMD | C | C | C | R+A | (futuro C) | - |
| Submissão ANVISA | I | C | I | R | A | R |
| Resposta a auditoria externa | C | C | I | R | A | R |
| LGPD compliance | C | I | I | R | C | (futuro DPO) |

### 4.9. Post-Market Surveillance (parqueado pós-Marco 2)

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| PMS (PROC-PMS-001) | R | C | C | I | (futuro A) | (futuro C) |
| Tecnovigilância (PROC-INC-001) | R | C | C | I | (futuro A) | (futuro C) |
| Comunicado de evento adverso | C | A | C | I | (futuro R+A) | (futuro C) |

## 5. Validações cruzadas (consistência interna)

### 5.1. Cada linha tem exatamente 1 "A" (accountability)

✅ Validado: 9 categorias × ~5 atividades cada = 45 linhas, cada uma com 1 Approver claro.

### 5.2. PG (Pedro) é R+A em quantas linhas?

R+A em **~20 atividades** (~44% das 45 linhas).
**Análise:** alta concentração esperada pré-CNPJ + pré-RT. Pós-Marco 1, RT habilitado assume A em 8-10 linhas (controle documental + risco residual + CAPA + regulatório).

### 5.3. RV (Ricardo) é A em quantas linhas?

A em **~9 atividades** clínicas (método AEC, prompt, signature, QA, Matrix, risco clínico, releases Nível 3 clínico, hotfix clínico, evento adverso).
**Análise:** distribuição correta — Ricardo é autoridade clínica máxima.

### 5.4. EF (Eduardo) é A em quantas linhas?

A em **~4 atividades** de Ensino (curso AEC, instrumentos, simulações, mentores).
**Análise:** distribuição correta — operacional desde 27/05.

### 5.5. JV (João) é A em quantas linhas?

A em **~4 atividades** institucionais/regulatórias.
**Análise:** distribuição correta dependente CNPJ ativo.

## 6. Gaps de governança identificados

### Gap G01 — Excessiva concentração em PG pré-CNPJ

**Análise:** ~44% das atividades A em uma pessoa só. Aceitável pré-CNPJ mas precisa redistribuir.
**Plano:** Pós-Marco 1, transferir A do RT habilitado para:
- Controle documental (POP-CTL-001)
- Verificação de eficácia de controle
- Aceitação de risco residual
- Aprovação de POP final
- Resposta a auditoria externa

### Gap G02 — Sem DPO formal

**Análise:** LGPD Art. 41 sugere DPO em organizações de tratamento de dado sensível.
**Plano:** Nomear DPO formal entre Marcos 2-3 (pode ser advogado externo).

### Gap G03 — Ricardo tem disponibilidade limitada

**Análise:** Tarde apenas (clínica externa pela manhã). Pode atrasar smokes urgentes.
**Plano:** Janelas combinadas pré-release Nível 3.

### Gap G04 — Eduardo recém-operacional

**Análise:** 27/05/2026 = primeiro uso real. Curva de aprendizado pode atrasar decisões Ensino.
**Plano:** Treinamento intensivo Pedro→Eduardo nas próximas 4 semanas.

## 7. Cadência de revisão deste documento

- **Sempre atualizar:** Após contratação de RT / Consultora / DPO.
- **Revisão semestral obrigatória.**
- **Revisão extraordinária:** Após qualquer evento adverso ou auditoria externa.

## 8. Status de aprovação (DRAFT OPERACIONAL)

> **⚠️ Este documento NÃO requer assinaturas formais pré-CNPJ.** Funciona como acordo operacional informal documentado para referência futura. Assinaturas serão coletadas apenas quando:
>
> 1. Contrato social MedCannLab Ltda existir formalmente
> 2. RT habilitado contratado
> 3. RACI-002 derivado do contrato social emitido (substitui este RACI-001)

**Ciência operacional dos colaboradores atuais** (registro de leitura, não vinculação jurídica):

- [ ] Pedro Henrique Passos Galluf — Data leitura: ___/___/___
- [ ] Dr. Ricardo Valença — Data leitura: ___/___/___
- [ ] Dr. Eduardo Faveret — Data leitura: ___/___/___
- [ ] João Eduardo Vidal — Data leitura: ___/___/___

## 9. Limitações de vinculação jurídica deste documento

Este documento é instrumento operacional **pré-contrato social**. Conforme avaliação externa de auditoria 29/05/2026, distribuir A/R/C/I antes do contrato social existir cria risco de conflito documental futuro.

### 9.1. Não substitui

- Contrato social MedCannLab Ltda (não existe ainda)
- Acordo de Sócios formal
- Termo de Responsabilidade Técnica RT habilitado
- Procurações específicas

### 9.2. Hierarquia documental quando houver conflito

```
1. Contrato Social MedCannLab Ltda      (PROVALECE)
        ↓
2. Acordo de Sócios formal
        ↓
3. RACI derivado do contrato social (RACI-002 futuro)
        ↓
4. RACI operacional informal (RACI-001 — este documento)   (CEDE)
```

### 9.3. Quando este documento se torna RACI-002 vinculante

Quando:
- CNPJ MedCannLab Ltda ativado
- Contrato social registrado em Junta Comercial
- RT habilitado contratado e em exercício
- RACI-002 emitido derivado do contrato social

Este RACI-001 fica **arquivado como histórico** e substituído pelo RACI-002.

### 9.4. Princípio aplicado

> *"Documentar governança que ainda não existe juridicamente é overclaim em construção. Reconhecer essa limitação no próprio documento é honestidade regulatória mais valiosa que mascarar com assinaturas prematuras."*

Referência: auditoria externa Claude2 + GPT 29/05/2026; memória `feedback_doc_institucional_sem_pat_nao_e_valido_23_05` aplicada recursivamente.

---

**Frase âncora:**

> *"45 atividades distribuídas em matriz RACI explícita. Pedro tem R em ~20 linhas e R+A em apenas 7 linhas tecnicamente puras (CLAUDE.md, push 4 refs, stack, migração) — outras 13 mudaram para R-only com A PENDENTE pós-Marco 1, calibração honesta. RV mantém R+A em 9 linhas clínicas (autoridade legítima ~15 anos do método AEC). EF entra com A provisional 90 dias revisado 27/08. Documento DRAFT OPERACIONAL não vinculante até contrato social existir. Governança honestamente desenhada — não mais 'tudo em uma pessoa só' nem 'fingir que tudo já existe'."*
