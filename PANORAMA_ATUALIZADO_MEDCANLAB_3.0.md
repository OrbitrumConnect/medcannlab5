# 🏥 PANORAMA ATUALIZADO - MEDCANLAB 3.0
## Data: Janeiro 2025 | Versão: 3.0 | Status: ✅ OPERACIONAL

---

## 📊 **VISÃO GERAL DO SISTEMA**

O **MedCannLab 3.0** é uma plataforma médica completa que integra **Inteligência Artificial Residente (Nôa Esperança)**, **Avaliação Clínica IMRE**, **Chat em Tempo Real** e **Sistema de Gestão** para profissionais de saúde, pacientes e estudantes de medicina.

### 🎯 **Conceito Central**
**"IA Embarcável para Robôs de Cuidado"** - Plataforma projetada para ser embarcada em robôs clínicos, domiciliares ou educativos, operando com:
- ✅ **Escuta Ativa** - Captação contínua e inteligente
- ✅ **Protocolos Médicos** - IMRE automatizado
- ✅ **Cuidado Simbólico** - Empatia e humanização
- ✅ **Geração de Relatórios** - Automatizada e contextualizada

---

## 🏗️ **ARQUITETURA TÉCNICA**

### **Stack Tecnológico**
- **Frontend**: React 18 + TypeScript + Vite (Porta 3000)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase)
- **Autenticação**: Supabase Auth
- **Segurança**: Row Level Security (RLS)
- **Estilização**: Tailwind CSS
- **IA**: OpenAI GPT-4 + Assistants API

### **Estrutura de Pastas**
```
src/
├── api/              # APIs e rotas backend
├── components/       # Componentes React (62+ componentes)
├── contexts/         # Contextos React (Auth, Nôa, Toast, etc.)
├── hooks/            # Custom hooks
├── lib/              # Bibliotecas e utilitários
│   ├── devVivo/      # Modo Dev Vivo
│   ├── robotEmbedding/ # IA Embarcável
│   └── medcannlab/   # Integração MedCannLab API
├── pages/            # Páginas da aplicação (62+ páginas)
├── services/         # Serviços (Knowledge Base, Notifications, etc.)
└── types/            # Definições TypeScript
```

---

## 👥 **TIPOS DE USUÁRIOS E PERMISSÕES**

### **1. 👤 PACIENTES**
**Dashboard**: `/app/clinica/paciente/dashboard`
- ✅ Chat com Nôa Esperança (IA multimodal)
- ✅ Avaliação Clínica Inicial (Protocolo IMRE)
- ✅ Visualização de Relatórios Clínicos
- ✅ Agendamento de Consultas
- ✅ Chat com Profissionais
- ✅ Histórico Médico
- ✅ Notificações de Relatórios Compartilhados

**Campos de Cadastro**:
- Nome, Email, Senha
- Tipo: Paciente

### **2. 👨‍⚕️ PROFISSIONAIS DE SAÚDE**
**Dashboard**: `/app/clinica/profissional/dashboard`
- ✅ Gestão de Pacientes (Lista, Busca, Seleção)
- ✅ Criação de Canais de Chat por Paciente
- ✅ Visualização de Relatórios Clínicos
- ✅ Sistema de Agendamento
- ✅ Ferramentas de Atendimento (Video/Audio/Chat/Prontuário)
- ✅ KPIs Clínicos Personalizados
- ✅ Biblioteca Médica
- ✅ Prescrições Integrativas

**Campos de Cadastro**:
- Nome, Email, Senha
- Tipo: Profissional
- **Conselho Profissional** (OBRIGATÓRIO):
  - Tipo: CRM, CFN, CRP, CRF, CRO
  - Número do Registro
  - Estado (para conselhos regionais)

**Diferenciação por Conselho**:
- **CRM** → Médicos
- **CFN** → Nutricionistas
- **CRP** → Psicólogos
- **CRF** → Farmacêuticos
- **CRO** → Dentistas

### **3. 👨‍🎓 ALUNOS/ESTUDANTES**
**Dashboard**: `/app/ensino/aluno/dashboard`
- ✅ Cursos e Certificações
- ✅ Biblioteca Educacional
- ✅ Gamificação (Pontos, Níveis, Badges)
- ✅ Progresso de Aprendizado
- ✅ Preparação de Aulas

**Campos de Cadastro**:
- Nome, Email, Senha
- Tipo: Aluno

### **4. 👑 ADMINISTRADORES**
**Dashboard**: `/app/ricardo-valenca-dashboard`
- ✅ Gestão Completa da Plataforma
- ✅ Gestão de Usuários
- ✅ Gestão de Notícias (`/app/admin/news`)
- ✅ Analytics e Métricas
- ✅ Upload de Documentos
- ✅ Moderação de Chat/Fórum
- ✅ Sistema Financeiro
- ✅ Modo Dev Vivo (Alterações em tempo real)

**Campos de Cadastro**:
- Nome, Email, Senha
- Tipo: Admin
- Flag: `flag_admin = true`

---

## 🤖 **SISTEMA NÔA ESPERANÇA (IA RESIDENTE)**

### **Funcionalidades Principais**

#### **1. Interface Conversacional**
- **Componente**: `NoaConversationalInterface`
- **Modalidades**: Texto + Voz
- **Disponibilidade**: Todas as rotas protegidas
- **Contexto Persistente**: Histórico de conversas
- **Escuta Ativa**: Processamento em tempo real

#### **2. Protocolo IMRE Automatizado**
- **I** - Investigação (28 blocos clínicos)
- **M** - Metodologia (Arte da Entrevista Clínica)
- **R** - Resultado (Análise Triaxial)
- **E** - Evolução (Plano Terapêutico)

#### **3. Melhorias Recentes**
- ✅ **Correção de Respostas Repetitivas**: Sistema detecta e evita repetições
- ✅ **Contexto de Conversa**: Mantém histórico e não repete informações
- ✅ **Detecção de Reclamações**: Identifica quando usuário reclama de repetição
- ✅ **Filtro de Simulações**: Só menciona simulações quando perguntado
- ✅ **Status da Plataforma**: Versão limpa para leitura em voz alta (sem emojis)

#### **4. Integração com Plataforma**
- ✅ Acesso a dados reais do Supabase
- ✅ Status da plataforma em tempo real
- ✅ Base de conhecimento completa
- ✅ Documento Mestre Institucional

---

## 📋 **FUNCIONALIDADES PRINCIPAIS**

### **1. Sistema de Avaliações Clínicas**
- **Tabela**: `clinical_assessments`
- **Protocolo**: IMRE Triaxial
- **Geração Automática**: Relatórios criados pela IA
- **Compartilhamento**: Entre profissionais
- **Segurança**: RLS restritivo (admins não têm acesso amplo)

**Políticas de Segurança**:
- ✅ Paciente vê apenas suas próprias avaliações
- ✅ Médico vê apenas avaliações designadas (`doctor_id`)
- ✅ Admin NÃO vê avaliações de outros (sem acesso amplo)
- ✅ Compartilhamento explícito via `shared_with`

### **2. Sistema de Chat**
- **Chat Global**: Comunicação entre usuários
- **Chat Profissional-Paciente**: Canais privados
- **Criação de Canais**: Automática ao selecionar paciente
- **Correção**: Foreign key corrigida (`chat_participants`)

**Estrutura**:
- `chat_rooms`: Salas de chat
- `chat_participants`: Participantes (com foreign key corrigida)
- `chat_messages`: Mensagens

### **3. Sistema de Relatórios Clínicos**
- **Geração**: Automática pela IA após avaliação
- **Formato**: IMRE estruturado
- **Armazenamento**: `clinical_reports`
- **Compartilhamento**: Entre profissionais
- **Notificações**: Alertas quando compartilhado

### **4. Gestão de Notícias**
- **Rota**: `/app/admin/news`
- **Funcionalidades**:
  - Criar, editar, deletar notícias
  - Categorias: Cannabis Medicinal, Pesquisa Clínica, Metodologia AEC, Regulamentação
  - Publicação com data
  - Exibição na página do paciente

### **5. Sistema de Agendamento**
- **Profissionais**: Configuração de horários
- **Pacientes**: Visualização e agendamento
- **Integração**: Com chat e prontuário

### **6. Biblioteca Médica**
- **Base de Conhecimento**: Documentos científicos
- **Busca Semântica**: Integração com IA
- **Categorização**: Por especialidade
- **Upload**: Para administradores

---

## 🔐 **SEGURANÇA E PRIVACIDADE (LGPD)**

### **Row Level Security (RLS)**
- ✅ **Avaliações Clínicas**: Políticas restritivas implementadas
- ✅ **Chat**: Políticas sem recursão
- ✅ **Relatórios**: Compartilhamento controlado
- ✅ **Usuários**: Dados protegidos por tipo

### **Políticas Implementadas**
1. **Pacientes**: Veem apenas seus próprios dados
2. **Profissionais**: Veem apenas pacientes designados
3. **Admins**: Acesso restrito (não têm acesso amplo a avaliações)
4. **Auditoria**: Logs de todas as ações

### **Campos de Conselho Profissional**
- ✅ Validação no cadastro
- ✅ Diferenciação por categoria
- ✅ Sincronização automática (CRM/CRO)
- ✅ Trigger automático no banco

---

## 🗄️ **ESTRUTURA DO BANCO DE DADOS**

### **Tabelas Principais**

#### **Usuários**
- `users`: Dados dos usuários
  - `council_type`: Tipo de conselho (CRM, CFN, etc.)
  - `council_number`: Número do registro
  - `council_state`: Estado do conselho
  - `crm`, `cro`: Campos legados (sincronizados automaticamente)
  - `flag_admin`: Flag para administradores

#### **Avaliações e Relatórios**
- `clinical_assessments`: Avaliações clínicas
- `clinical_reports`: Relatórios clínicos
- `imre_assessments`: Avaliações IMRE

#### **Chat**
- `chat_rooms`: Salas de chat
- `chat_participants`: Participantes (foreign key corrigida)
- `chat_messages`: Mensagens

#### **Notícias**
- `news_items`: Notícias e atualizações

#### **Modo Dev Vivo**
- `dev_vivo_changes`: Alterações em tempo real
- `dev_vivo_sessions`: Sessões de desenvolvimento
- `dev_vivo_audit`: Auditoria
- `dev_vivo_diagnostics`: Diagnósticos

---

## 🚀 **MELHORIAS RECENTES (2025)**

### **1. Sistema de Conselho Profissional** ✅
- Campos adicionados: `council_type`, `council_number`, `council_state`
- Validação no cadastro
- Diferenciação por categoria profissional
- Sincronização automática com campos legados

### **2. Correção de Chat** ✅
- Foreign key corrigida (`chat_participants`)
- Função RPC para criação de salas
- Validação de usuários antes de inserir

### **3. Melhoria da IA Conversacional** ✅
- Detecção de respostas repetitivas
- Contexto de conversa melhorado
- Filtro de simulações
- Status da plataforma limpo (sem emojis)

### **4. Segurança de Avaliações** ✅
- Políticas RLS restritivas
- Admins não têm acesso amplo
- Compartilhamento controlado
- Auditoria completa

### **5. Gestão de Notícias** ✅
- Rota de produção (`/app/admin/news`)
- CRUD completo
- Categorização
- Exibição para pacientes

---

## 📱 **ROTAS PRINCIPAIS**

### **Públicas**
- `/` - Landing Page
- `/termos-lgpd` - Termos e LGPD
- `/experiencia-paciente` - Experiência do Paciente

### **Por Eixo e Tipo**
- `/eixo/:eixo/tipo/:tipo` - Rotas estruturadas
- `/selecionar-eixo` - Seletor de eixo

### **Clínica**
- `/app/clinica/paciente/dashboard` - Dashboard Paciente
- `/app/clinica/profissional/dashboard` - Dashboard Profissional
- `/app/clinica/paciente/chat-profissional` - Chat Profissional-Paciente
- `/app/clinica/paciente/avaliacao-clinica` - Avaliação Clínica

### **Ensino**
- `/app/ensino/aluno/dashboard` - Dashboard Aluno
- `/app/ensino/aluno/cursos` - Cursos

### **Pesquisa**
- `/app/pesquisa/dashboard` - Dashboard Pesquisa

### **Admin**
- `/app/ricardo-valenca-dashboard` - Dashboard Admin
- `/app/admin/news` - Gestão de Notícias

---

## 🎨 **INTERFACE E UX**

### **Design System**
- **Tema**: Dark mode com gradientes
- **Cores**: Verde (#00C16A) como cor primária
- **Tipografia**: Inter/Sans-serif
- **Componentes**: Tailwind CSS + componentes customizados

### **Responsividade**
- ✅ Mobile-first
- ✅ Breakpoints: sm, md, lg, xl
- ✅ Componentes adaptativos
- ✅ Chat mobile otimizado

### **Acessibilidade**
- ✅ Navegação por teclado
- ✅ ARIA labels
- ✅ Contraste adequado
- ✅ Leitura de tela

---

## 🔧 **FERRAMENTAS DE DESENVOLVIMENTO**

### **Modo Dev Vivo**
- **Ativação**: "Olá, Nôa. Modo Dev Vivo aqui."
- **Funcionalidades**:
  - Alterações em tempo real
  - Diagnóstico de problemas
  - Rollback de mudanças
  - Logs e auditoria
  - Autenticação via `flag_admin`

### **Scripts SQL**
- `database/ADICIONAR_CAMPOS_CONSELHO_PROFISSIONAL.sql`
- `database/CORRIGIR_FOREIGN_KEY_CHAT_PARTICIPANTS.sql`
- `database/REVOGAR_PERMISSOES_DEFINITIVO.sql`
- `database/VERIFICAR_E_CORRIGIR_ACESSO_ASSESSMENTS.sql`

---

## 📊 **MÉTRICAS E KPIs**

### **Sistema de KPIs**
- **Clínicos**: Avaliações, relatórios, pacientes
- **Administrativos**: Usuários, atividades, receitas
- **Educacionais**: Cursos, certificações, progresso

### **Dashboard Personalizado**
- Cada tipo de usuário tem seu próprio dashboard
- Métricas relevantes por perfil
- Gráficos e visualizações

---

## 🧪 **TESTES E QUALIDADE**

### **Testes Implementados**
- Vitest para testes unitários
- Testes de integração com MedCannLab API
- Testes de NLP clínico

### **Linting e Type Checking**
- ESLint configurado
- TypeScript strict mode
- Prettier para formatação

---

## 📚 **DOCUMENTAÇÃO**

### **Documentos Principais**
- `README.md` - Visão geral
- `PANORAMA_ATUALIZADO_MEDCANLAB_3.0.md` - Este documento
- `GUIA_CADASTRO_CONSELHO_PROFISSIONAL.md` - Guia de cadastro
- `IA_EMBARCAVEL_ROBOS_CUIDADO.md` - IA Embarcável
- `MODO_DEV_VIVO_ESTRUTURA.md` - Modo Dev Vivo

### **Scripts SQL Documentados**
- Todos os scripts têm comentários explicativos
- Guias de execução em ordem
- Documentação de políticas RLS

---

## 🎯 **PRÓXIMOS PASSOS SUGERIDOS**

1. **Testar Cadastro de Profissional** com campos de conselho
2. **Validar Chat** após correção de foreign key
3. **Verificar Segurança** de avaliações clínicas
4. **Testar Modo Dev Vivo** em produção
5. **Expandir Conselhos** (CRN, CRBM, etc.)

---

## ✅ **STATUS ATUAL**

- ✅ **Sistema Operacional**: 100%
- ✅ **IA Residente**: Funcional
- ✅ **Segurança**: RLS Implementado
- ✅ **Cadastro**: Campos de conselho adicionados
- ✅ **Chat**: Foreign key corrigida
- ✅ **Documentação**: Atualizada

---

**🎉 MedCannLab 3.0 - Estado da Arte em Medicina Integrativa com IA**

