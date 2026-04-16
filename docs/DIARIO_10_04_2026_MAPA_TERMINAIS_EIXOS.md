# Diário de Arquitetura: Análise e Desbloqueio de Terminais e Painéis de Controle
## MedCannLab Plataforma — Auditoria de UX e Roteamento
**Data:** 10 de Abril de 2026

---

## 1. O Desbloqueio do "Catálogo de Cursos" (Eixo Ensino)
A análise da aba de alunos focou na quebra de contexto operacional (o vazamento). 

**O que estava ocorrendo:** 
A página `Courses.tsx` continha a lógica de redirecionamento nativa apontando para URLs do Eixo Administrativo/Profissional (ex: `/app/pesquisa/profissional/cidade-amiga-dos-rins` ou `/app/ensino/profissional/pos-graduacao-cannabis`). Quando o Aluno (simulado ou real) clicava em "Começar Curso", o "Eixo" da plataforma virava para "Profissional", forçando a renderização do `Sidebar` incorreto e quebrando o isolamento da UX do aluno.

**O que desbloqueamos/corrigimos:**
1. **Ativação Segura Sidebar:** Acoplamos o menu "Catálogo de Cursos" (`/app/ensino/aluno/cursos`) de forma nativa no Sidebar de Alunos.
2. **Grampo de Roteadores:** Consertamos as `hrefs` dinâmicas de modo que, se um paciente/estudante clica em um curso, a plataforma o recicla de volta para `/app/ensino/aluno/dashboard`, mantendo a navegação e a Sidebar imaculadas.
3. **Conserto de Loop DB:** Trocamos a chamada `single()` para `maybeSingle()` em _course_enrollments_, extinguindo de vez os erros HTTP 406 (Not Acceptable) que inflavam a aba _Network_ do DevTools e consumiam conexão.

---

## 2. Análise Profunda: Terminais Cativos (Em "Gargalos" de Acesso)

Ao vasculhar o código base da `Sidebar.tsx`, `App.tsx` e dos Controladores Lógicos, encontramos um fenômeno chamado **"Terminais Cativos"**. Muitos "dashboards" ou "Workstations" estão 100% construídos e funcionais, mas **não estão no menu lateral**. O usuário precisa dar "3 cliques" (acessar rotas com query params `?section=...`) para chegar neles.

Veja o que precisamos urgentizar e destrancar para organizar o sistema:

### A. Terminal Clínico e Terminal de Atendimento (Eixo Profissional)
Atualmente a `Sidebar.tsx` do profissional mostra: "Meu Dashboard", "Fórum Cann Matrix", "Gestão Financeira" e "Certificados".
**O Problema:** Os Terminais mais importantes estão dentro do `ProfessionalMyDashboard.tsx` dependentes de parâmetros de URL:
- `?section=terminal-clinico`: Um painel gigante (`IntegratedWorkstation`) construído maravilhosamente. Mas não tem botão direto na Sidebar!
- `?section=atendimento`: O gestor de consultas e agenda (`ProfessionalSchedulingWidget`). Não tem botão na Sidebar!
- `?section=prescricoes`: O gerador de PDFs de prescrição paramétrica. 

**O que propomos (Roadmap de Ação):** Adicionar no Menu Lateral do Profissional, botões diretos: 
1. **[Ícone Stethoscope] Terminal de Atendimento** -> Vai para a Agenda.
2. **[Ícone Terminal] Prontuário Clínico (Workstation)** -> Vai para o ambiente de anotações médicas direto.

### B. O Apagão Analítico do Pesquisador (Eixo Pesquisa)
Observamos um "ponto cego" na `Sidebar.tsx`: ela opera com a lógica `switch(userType)` (paciente, profissional, aluno, admin). Se um **Pesquisador** (Professional) selecionar o Eixo "Pesquisa", o Menu Lateral continuará mostrando "Gestão Financeira" e "Meu Dashboard", omitindo 100% o que já está construído para pesquisa!
**Painéis já construídos, mas escondidos na Sidebar:**
- `Terminal de Pesquisa`
- `Fórum de Casos Clínicos` (Específico do protocolo da cidade e nefrologia)
- `Roteiros e Fichas IMRE`

**O que propomos (Roadmap de Ação):**
Modificar a Sidebar para misturar a permissão (`role`) com a aba atual (`Axis`). Se o profissional estiver no domínio `/app/pesquisa`, a navbar deve instanciar `pesquisaItems`, liberando aos pesquisadores os botões diretos e não forçando eles a ficarem numa aba central estática.

### C. Aluno no Contexto de Pesquisa
Temos Rotas configuradas no `App.tsx` para o "Aluno de Pesquisa" (`/app/pesquisa/aluno/dashboard` e `/app/pesquisa/aluno/forum-casos`).
Contudo, se um aluno visita a página de Pesquisa, não há layout construído para injetar isso no menu lateral dele. A área pode dar impressão de um campo "Morto".

### D. Conclusões e Organização
Temos painéis extremamente performáticos, mas com um front-end (Menu de Navegação Lateral) que opera numa "versão antiga" ou baseada apenas na variável `user.type`. 

**Para alcançar o nível absoluto de usabilidade de produção:**
1. Desmembrar a Sidebar para reagir ao _Contexto_ (Módulos/Eixos) e não apenas à Role de usuário.
2. Tirar os componentes "Terminais" como abas secundárias e promove-los para Entidades Top-Level do menu lateral.
3. Isso inclui separar imediatamente a guia "Relatórios", "Prontuários" e "Caixa de Entrada" para o Profissional Clínico, de forma visual.

---

## 3. Auditoria de Segurança e Cadastro de Pacientes (Bloqueio RLS)

Durante testes de operação real (entrar como "Profissional" em vez de "Admin" e criar um paciente), disparou-se um erro letal no fluxo: `new row violates row-level security policy for table "users"` (e correlatos na tabela `user_roles`). 

**O que estava ocorrendo:**
O motor de cadastro (`NewPatientForm.tsx`) estava em perfeito estado (com regras de negócio avançadas gerando QR code e Anamnese em batch). Porém, as **leis de segurança do banco (Postgres RLS - Row Level Security)** da Supabase estavam em estado protecionista:

1. **`user_roles`:** Apenas administradores oficiais (`has_role(..., 'admin')`) podiam inserir roles. O médico (Dr. Ricardo) estava sendo barrado de marcar o novo cadastro como "Paciente".
2. **`clinical_assessments`:** A política anterior (`auth.uid() = patient_id`) forçava que SOMENTE o próprio paciente pudesse criar seu prontuário inicial. Um médico criando em nome do paciente recebia uma violação severa.

**O que mapeamos e como consertamos:**
Para não agir às cegas, criamos o script `docs/CHECK_RLS_POLICIES.sql` que invadiu as métricas de segurança do Supabase e nos cuspiu (em formato JSON) toda a lista de regras aplicadas. O Diagnóstico foi milimétrico.

Entregamos o documento mestre **`docs/FIX_RLS_CADASTRAR_PACIENTES.sql`**. Nele:
- Inserimos novos portões paramétricos (Policies) para o `user_roles`. Agora profissionais do sistema têm o direito (WITH CHECK) garantido de injetar a flag "Paciente".
- Inserimos regras na `clinical_assessments` permitindo que o profissional, atuando como `doctor_id`, gere relatórios oficiais em nome do paciente recém-cadastrado.

**Conclusão:** 
O pipeline de Onboarding B2B2C (Profissional Cadastrando Paciente, emitindo Link/QR Code e Anamnese atrelada) está agora completamente curado na esfera do banco de dados, fechando a segurança Zero-Trust do MedCannLab sem impactar usabilidade civil.
