# 🏥 PANORAMA COMPLETO - MEDCANLAB 3.0
## Sistema Integrado de Cannabis Medicinal com IA Residente

---

## 📋 VISÃO GERAL DO SISTEMA

O **MedCannLab 3.0** é uma plataforma médica completa que integra:
- 🤖 **Inteligência Artificial Residente** (Nôa Esperança)
- 🏥 **Protocolo IMRE Triaxial** para avaliações clínicas
- 💬 **Chat em Tempo Real** (texto, voz, vídeo)
- 📚 **Sistema Educacional** completo
- 🔬 **Fórum de Pesquisa** colaborativo
- 📊 **Dashboards** personalizados por tipo de usuário
- 🔐 **Segurança** com Row Level Security (RLS)

---

## 🎯 ARQUITETURA POR EIXOS E TIPOS DE USUÁRIO

### 📐 Estrutura Organizacional
- **3 Eixos**: Clínica 🏥 | Ensino 🎓 | Pesquisa 🔬
- **4 Tipos de Usuário**: Profissional 👨‍⚕️ | Paciente 👤 | Aluno 🎓 | Admin 👑
- **Rotas Individualizadas**: `/app/eixo/tipo/funcionalidade`

---

## 🏥 EIXO CLÍNICA

### 👨‍⚕️ **PROFISSIONAL DE SAÚDE**

#### 📊 Dashboard Profissional (`/app/clinica/profissional/dashboard`)
- **KPIs Clínicos Inovadores**:
  - Narrativas Preservadas (fala espontânea do paciente)
  - Análise Multirracional (4+ racionalidades médicas)
  - Dados Primários Coletados (blocos semânticos)
  - Correlações Identificadas (fala espontânea ↔ análise clínica)
- **Visão Geral**:
  - Total de pacientes ativos
  - Avaliações realizadas hoje
  - Relatórios pendentes
  - Notificações não lidas
- **Acesso Rápido**:
  - Nova avaliação clínica
  - Ver pacientes
  - Ver relatórios
  - Chat com pacientes

#### 👥 Gestão de Pacientes (`/app/clinica/profissional/pacientes`)
- **Lista de Pacientes**:
  - Busca por nome, CPF, email
  - Filtros por status (ativo, inativo)
  - Ordenação por nome, data de cadastro
- **Perfil do Paciente**:
  - Dados pessoais completos
  - Histórico de avaliações
  - Relatórios clínicos
  - Prescrições ativas
  - Agendamentos
- **Importação de Pacientes**:
  - Upload de planilhas (PDF, CSV, Excel)
  - Extração automática de dados
  - Validação de duplicatas
  - Criação em lote
- **Ações**:
  - Criar novo paciente
  - Editar dados
  - Visualizar prontuário completo
  - Iniciar avaliação clínica

#### 📅 Agendamentos (`/app/clinica/profissional/agendamentos`)
- **Calendário de Consultas**:
  - Visualização mensal/semanal/diária
  - Filtros por paciente, data, status
  - Cores por tipo de consulta
- **Gestão de Horários**:
  - Criar novo agendamento
  - Editar horários existentes
  - Cancelar consultas
  - Reagendar pacientes
- **Integração com Avaliação**:
  - Botão "Iniciar Avaliação Clínica" em cada consulta
  - Navegação direta para chat com IA
  - Contexto automático da consulta

#### 📄 Relatórios (`/app/clinica/profissional/relatorios`)
- **Lista de Relatórios**:
  - Filtros por paciente, data, tipo
  - Busca por palavras-chave
  - Ordenação por data
- **Visualização**:
  - Relatório completo IMRE
  - Análise triaxial (Abertura Exponencial, Desenvolvimento Indiciário, Fechamento Consensual)
  - Dados primários preservados
  - Análise multirracional
- **Ações**:
  - Visualizar relatório completo
  - Compartilhar com paciente
  - Exportar PDF
  - Imprimir

#### 💬 Chat com Profissionais (`/app/clinica/profissional/chat-profissionais`)
- **Canais de Comunicação**:
  - Chat global da plataforma
  - Conversas individuais
  - Grupos por especialidade
- **Funcionalidades**:
  - Mensagens em tempo real
  - Compartilhamento de arquivos
  - Notificações de novas mensagens

---

### 👤 **PACIENTE**

#### 📊 Dashboard do Paciente (`/app/clinica/paciente/dashboard`)
- **Visão Geral**:
  - Próximas consultas
  - Relatórios recentes
  - Prescrições ativas
  - Notificações importantes
- **Acesso Rápido**:
  - Nova avaliação clínica
  - Ver meus relatórios
  - Agendar consulta
  - Chat com médico

#### 🏥 Avaliação Clínica (`/app/clinica/paciente/avaliacao-clinica`)
- **Protocolo IMRE Triaxial**:
  - **Investigação**: Coleta de dados primários (fala espontânea preservada)
  - **Metodologia**: Abertura Exponencial, Desenvolvimento Indiciário, Fechamento Consensual
  - **Resultado**: Análise multirracional (Biomédica, MTC, Ayurvédica, Homeopática, Integrativa)
  - **Evolução**: Recomendações e plano de acompanhamento
- **Interface com IA**:
  - Chat multimodal (texto e voz)
  - Uma pergunta por vez (avaliação pausada)
  - Feedback visual e sonoro
  - Histórico da conversa
- **Resultado**:
  - Relatório gerado automaticamente
  - Salvamento no banco de dados
  - Disponibilização no dashboard
  - Compartilhamento com profissional

#### 📄 Relatórios (`/app/clinica/paciente/relatorios`)
- **Meus Relatórios**:
  - Lista de todas as avaliações
  - Filtros por data
  - Status (concluído, em andamento)
- **Visualização**:
  - Relatório completo IMRE
  - Análise triaxial detalhada
  - Recomendações personalizadas
  - Exportar PDF

#### 📅 Agendamentos (`/app/clinica/paciente/agendamentos`)
- **Minhas Consultas**:
  - Próximas consultas agendadas
  - Histórico de consultas
  - Status de cada consulta
- **Agendar Nova Consulta**:
  - Seleção de profissional
  - Escolha de data/hora
  - Motivo da consulta
  - Confirmação

#### 💬 Chat com Profissional (`/app/clinica/paciente/chat-profissional`)
- **Comunicação Direta**:
  - Mensagens com médico responsável
  - Compartilhamento de documentos
  - Notificações em tempo real

#### 🤖 Chat com Nôa Esperança (`/app/chat-noa-esperanca`)
- **IA Residente Multimodal**:
  - Conversação natural em português
  - Entrada por texto ou voz
  - Respostas com síntese de voz (TTS)
  - Reconhecimento de voz (STT)
- **Funcionalidades**:
  - Avaliação clínica inicial
  - Respostas a dúvidas médicas
  - Acesso à base de conhecimento
  - Contexto clínico preservado

---

## 🎓 EIXO ENSINO

### 👨‍⚕️ **PROFISSIONAL DE SAÚDE**

#### 📊 Dashboard de Ensino (`/app/ensino/profissional/dashboard`)
- **Visão Geral**:
  - Total de alunos
  - Cursos ativos
  - Aulas publicadas
  - Mentoria ativa
- **Programas de Mentoria**:
  - Dr. Ricardo Valença (Coordenação Arte da Entrevista Clínica)
  - Dr. Eduardo Faveret (Direção Acadêmica Cannabis & Nefrologia)
  - IA Nôa Esperança (Tutoria avançada 24h)
- **Ações**:
  - Solicitar mentoria
  - Ver alunos
  - Preparar aulas

#### 📝 Preparação de Aulas (`/app/ensino/profissional/preparacao-aulas`)
- **Editor Científico Completo**:
  - Formato de artigo científico (9 seções)
  - Toolbar de formatação
  - Exportação para PDF
- **Integração com Casos Clínicos**:
  - Busca de casos reais do sistema
  - Criação automática de relatos
  - Preenchimento inteligente
- **Gerenciamento**:
  - Criar nova aula
  - Editar aulas existentes
  - Publicar no curso
  - Sistema de busca e filtros

#### 🎯 Arte da Entrevista Clínica (`/app/ensino/profissional/arte-entrevista-clinica`)
- **Metodologia AEC**:
  - Abertura Exponencial
  - Desenvolvimento Indiciário
  - Fechamento Consensual
- **Conteúdo Editável**:
  - Módulos do curso
  - Aulas por módulo
  - Botão "Preparar" para editar conteúdo
  - Salvamento em Supabase e localStorage
- **Visualização**:
  - Player de vídeo integrado
  - Material complementar
  - Exercícios práticos

#### 📚 Pós-Graduação Cannabis (`/app/ensino/profissional/pos-graduacao-cannabis`)
- **Curso Completo**:
  - 520 horas de conteúdo
  - Módulos organizados
  - Aulas por módulo
- **Gestão de Conteúdo**:
  - Edição de módulos
  - Edição de aulas
  - Upload de materiais
  - Sistema de progresso

#### 👥 Gestão de Alunos (`/app/ensino/profissional/gestao-alunos`)
- **Lista de Alunos**:
  - Busca e filtros
  - Status de progresso
  - Notas e avaliações
- **Ações**:
  - Ver perfil do aluno
  - Acompanhar progresso
  - Enviar mensagens
  - Gerar certificados

---

### 🎓 **ALUNO**

#### 📊 Dashboard do Aluno (`/app/ensino/aluno/dashboard`)
- **Visão Geral**:
  - Progresso nos cursos
  - Próximas aulas
  - Certificados disponíveis
  - Notificações
- **Acesso Rápido**:
  - Continuar estudos
  - Ver biblioteca
  - Ver gamificação

#### 📚 Cursos (`/app/ensino/aluno/cursos`)
- **Cursos Disponíveis**:
  - Pós-Graduação em Cannabis Medicinal (520h)
  - Arte da Entrevista Clínica
  - Módulos organizados
  - Aulas por módulo
- **Funcionalidades**:
  - Iniciar módulo
  - Continuar de onde parou
  - Marcar como concluído
  - Ver progresso

#### 📖 Biblioteca (`/app/ensino/aluno/biblioteca`)
- **Materiais de Estudo**:
  - Documentos científicos
  - Artigos de referência
  - Vídeos educacionais
  - Apresentações
- **Busca e Filtros**:
  - Por categoria
  - Por palavra-chave
  - Por data

#### 🎮 Gamificação (`/app/ensino/aluno/gamificacao`)
- **Sistema de Pontos**:
  - Pontos por conclusão de aula
  - Pontos por participação
  - Pontos por avaliações
- **Ranking**:
  - Posição entre alunos
  - Conquistas desbloqueadas
  - Badges e certificados

---

## 🔬 EIXO PESQUISA

### 👨‍⚕️ **PROFISSIONAL DE SAÚDE**

#### 📊 Dashboard de Pesquisa (`/app/pesquisa/profissional/dashboard`)
- **Visão Geral**:
  - Projetos ativos
  - Casos em discussão
  - Publicações recentes
  - Colaboradores

#### 💬 Fórum de Casos Clínicos (`/app/pesquisa/profissional/forum-casos`)
- **Discussão de Casos**:
  - Criar novo caso clínico
  - Buscar casos existentes
  - Filtros por categoria, complexidade, especialidade
- **Análise Multirracional**:
  - Biomédica
  - Medicina Tradicional Chinesa
  - Ayurvédica
  - Homeopática
  - Integrativa
- **Chat com IA**:
  - Discussão sobre o caso
  - Análise assistida por IA
  - Sugestões de abordagem
- **Funcionalidades**:
  - Visualizar casos
  - Comentar
  - Criar aula a partir do caso
  - Compartilhar

#### 🏛️ Fórum Profissional (`/app/chat?tab=forum`)
- **Temas de Discussão**:
  - Protocolos Clínicos Integrados
  - Integração Cannabis & Nefrologia
  - Títulos clicáveis para discussões
- **Debates**:
  - Lista de debates ativos
  - Filtros e busca
  - Participação por tipo de usuário
- **Navegação**:
  - Clique no título → ver discussões
  - Botão "Ver Fórum de Casos Clínicos"
  - Buscar discussões relacionadas

#### 🏥 Cidade Amiga dos Rins (`/app/pesquisa/profissional/cidade-amiga-dos-rins`)
- **Projeto Especializado**:
  - Conteúdo sobre nefrologia
  - Protocolos específicos
  - Materiais de referência

#### 🔬 MedCannLab (`/app/pesquisa/profissional/medcann-lab`)
- **Projeto Principal**:
  - Estrutura do projeto
  - Documentação
  - Colaboradores

#### 🌿 Jardins de Cura (`/app/pesquisa/profissional/jardins-de-cura`)
- **Projeto Complementar**:
  - Conteúdo específico
  - Materiais educacionais

---

### 🎓 **ALUNO**

#### 📊 Dashboard de Pesquisa (`/app/pesquisa/aluno/dashboard`)
- **Participação em Projetos**:
  - Projetos ativos
  - Tarefas atribuídas
  - Progresso

#### 💬 Fórum de Casos Clínicos (`/app/pesquisa/aluno/forum-casos`)
- **Acesso ao Fórum**:
  - Visualizar casos
  - Comentar (se permitido)
  - Aprender com discussões

---

## 🤖 IA RESIDENTE - NÔA ESPERANÇA

### 🧠 **Funcionalidades Principais**

#### 💬 Chat Multimodal
- **Entrada**:
  - Texto (digitação)
  - Voz (reconhecimento de fala - STT)
- **Saída**:
  - Texto formatado
  - Síntese de voz (TTS)
  - Feedback visual

#### 🏥 Avaliação Clínica IMRE Triaxial
- **Protocolo Pausado**:
  - Uma pergunta por vez
  - Contexto preservado
  - Fala espontânea do paciente mantida
- **Fases da Anamnese**:
  - Abertura Exponencial
  - Desenvolvimento Indiciário
  - Fechamento Consensual
- **Análise Multirracional**:
  - Biomédica
  - Medicina Tradicional Chinesa
  - Ayurvédica
  - Homeopática
  - Integrativa

#### 📚 Base de Conhecimento
- **Acesso Integrado**:
  - Documentos científicos
  - Protocolos clínicos
  - Diretrizes médicas
  - Artigos de referência
- **Busca Inteligente**:
  - Busca semântica
  - Contexto clínico
  - Respostas baseadas em evidências

#### 🎯 Processamento de Linguagem Natural
- **Intenções Clínicas**:
  - Identificação de sintomas
  - Reconhecimento de medicamentos
  - Detecção de urgências
- **Contexto Persistente**:
  - Histórico de conversas
  - Dados do paciente
  - Avaliações anteriores

#### 📊 Geração de Relatórios
- **Relatórios IMRE Automáticos**:
  - Investigação completa
  - Metodologia aplicada
  - Resultados e análise
  - Evolução e recomendações
- **Salvamento Automático**:
  - Banco de dados Supabase
  - Dashboard do paciente
  - Compartilhamento com profissional

---

## 👑 ADMINISTRAÇÃO

### 🔐 **Dashboard Admin** (`/app/admin`)

#### ⚙️ Configurações Administrativas (`/app/admin-settings`)
- **Visão Geral do Sistema**:
  - Total de usuários
  - Documentos cadastrados
  - Mensagens do sistema
  - Status do sistema
- **Visualização de Mensagens**:
  - Modal com todas as mensagens
  - Filtros e busca
  - Link para chat global

#### 👥 Gestão de Usuários (`/app/admin/users`)
- **Ações**:
  - Criar usuários
  - Editar perfis
  - Ativar/desativar contas
  - Definir permissões

#### 📚 Gestão de Cursos (`/app/admin/courses`)
- **Ações**:
  - Criar cursos
  - Editar módulos
  - Gerenciar aulas
  - Publicar conteúdo

#### 📊 Analytics (`/app/admin/analytics`)
- **Métricas**:
  - Usuários ativos
  - Avaliações realizadas
  - Cursos concluídos
  - Engajamento

#### 💾 Backup (`/app/admin/system`)
- **Sistema**:
  - Backup de dados
  - Restauração
  - Logs do sistema

#### 💰 Financeiro (`/app/admin/financial`)
- **Gestão Financeira**:
  - Planos de assinatura
  - Pagamentos
  - Relatórios financeiros

---

## 🔧 FUNCIONALIDADES TÉCNICAS

### 🔐 **Autenticação e Segurança**
- Login/Registro com Supabase Auth
- Row Level Security (RLS)
- Proteção de rotas por tipo de usuário
- Tokens JWT
- Sessões seguras

### 💾 **Banco de Dados**
- Supabase PostgreSQL
- Tabelas principais:
  - `profiles` (usuários)
  - `imre_assessments` (avaliações IMRE)
  - `clinical_assessments` (avaliações clínicas)
  - `clinical_reports` (relatórios)
  - `appointments` (agendamentos)
  - `forum_posts` (fórum)
  - `chat_messages` (mensagens)
  - `documents` (documentos)
  - `course_modules` (cursos)
  - `notifications` (notificações)

### 🔄 **Tempo Real**
- Supabase Realtime
- Notificações instantâneas
- Chat em tempo real
- Atualizações automáticas

### 📱 **Progressive Web App (PWA)**
- Instalação no dispositivo
- Funcionamento offline (parcial)
- Service Worker
- Manifest.json

### 🎨 **Interface**
- Design responsivo
- Tema escuro/claro
- Acessibilidade
- Navegação intuitiva

---

## 📊 KPIs E MÉTRICAS

### 🏥 **KPIs Clínicos Inovadores**
1. **Narrativas Preservadas**: Número de avaliações com fala espontânea preservada
2. **Análise Multirracional**: Avaliações analisadas por 4+ racionalidades
3. **Dados Primários Coletados**: Total de blocos semânticos coletados
4. **Correlações Identificadas**: Correlações entre fala espontânea e análise clínica

### 📈 **Métricas Gerais**
- Total de usuários
- Avaliações realizadas
- Relatórios gerados
- Cursos concluídos
- Participação no fórum

---

## 🚀 FUNCIONALIDADES RECENTES IMPLEMENTADAS

### ✅ **Últimas Atualizações**
1. **Importação de Pacientes**: Upload de planilhas (PDF/CSV/Excel)
2. **Calendário DRC**: Cronograma de monitoramento renal baseado em diretrizes
3. **Edição de Conteúdo**: Preparação de aulas editável
4. **Mentorias Efetivas**: Sistema de agendamento de mentorias
5. **Fórum Melhorado**: Títulos clicáveis e navegação aprimorada
6. **KPIs Clínicos**: Métricas inovadoras baseadas em análise multirracional
7. **Microfone Robusto**: Tratamento de erros e retry automático
8. **Visualização de Documentos**: Base de conhecimento com visualizador

---

## 📝 NOTAS IMPORTANTES

### ⚠️ **Correções Críticas Implementadas**
- ✅ Análise triaxial corrigida (fases da anamnese, não eixos psicológicos)
- ✅ Emojis removidos do processamento da IA
- ✅ Texto oculto corrigido na janela de consulta
- ✅ Microfone com tratamento robusto de erros
- ✅ Voz "bons ventos sóprem" removida

### 🔄 **Fluxos Principais**
1. **Paciente → Avaliação → Relatório → Dashboard**
2. **Profissional → Agendamento → Avaliação → Relatório**
3. **Aluno → Curso → Aula → Conclusão → Certificado**
4. **Pesquisador → Fórum → Caso → Discussão → Publicação**

---

## 🎯 CONCLUSÃO

O **MedCannLab 3.0** é uma plataforma completa e integrada que oferece:
- ✅ **Avaliação clínica inovadora** com preservação da narrativa do paciente
- ✅ **Análise multirracional** com 5 racionalidades médicas
- ✅ **IA residente multimodal** com chat texto e voz
- ✅ **Sistema educacional completo** com cursos e mentorias
- ✅ **Fórum colaborativo** para pesquisa e discussão
- ✅ **Dashboards personalizados** por tipo de usuário
- ✅ **Segurança robusta** com RLS e autenticação

**Status**: ✅ Sistema funcional e operacional

---

*Documento gerado em: Janeiro 2025*
*Versão: MedCannLab 3.0*

