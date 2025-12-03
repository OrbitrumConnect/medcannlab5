# 📊 Panorama Completo do Repositório MedCannLab 3.0

## 🎯 Visão Geral

**MedCannLab 3.0** é uma plataforma integrada de gestão clínica especializada em **Cannabis Medicinal**, que combina:
- Sistema de gestão de pacientes e profissionais
- IA Residente (Nôa Esperança) para avaliações clínicas automatizadas
- Protocolo IMRE (Investigação, Metodologia, Resultado, Evolução) integrado
- Sistema educacional com cursos e gamificação
- Pesquisa clínica e fóruns de casos
- Chat em tempo real entre profissionais e pacientes

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico

**Frontend:**
- **React 18.2** com TypeScript
- **Vite 7.1** (build tool)
- **React Router DOM 6.30** (roteamento)
- **Tailwind CSS 3.4** (estilização)
- **Framer Motion 12.23** (animações)
- **Zustand 5.0** (gerenciamento de estado)
- **Lucide React** (ícones)

**Backend/Infraestrutura:**
- **Supabase** (BaaS - Backend as a Service)
  - PostgreSQL (banco de dados)
  - Autenticação integrada
  - Row Level Security (RLS)
  - Storage para arquivos
  - Realtime subscriptions

**IA e Processamento:**
- **@xenova/transformers 2.17** (processamento NLP local)
- **PDF.js 5.4** (processamento de documentos PDF)
- Integração com API MedCannLab externa
- Sistema RAG (Retrieval Augmented Generation)

**Desenvolvimento:**
- **Vitest 1.5** (testes)
- **ESLint** (linting)
- **TypeScript 5.2** (tipagem estática)

---

## 📁 Estrutura de Diretórios

```
medcanlab3.0/
├── src/
│   ├── components/          # Componentes React reutilizáveis (47 arquivos)
│   │   ├── NoaConversationalInterface.tsx  # Interface principal da IA
│   │   ├── NoaAnimatedAvatar.tsx           # Avatar animado da Nôa
│   │   ├── ProfessionalChatSystem.tsx      # Sistema de chat profissional
│   │   ├── ClinicalReports.tsx              # Relatórios clínicos
│   │   ├── KPIDashboard.tsx                # Dashboard de métricas
│   │   └── ...
│   │
│   ├── pages/               # Páginas/rotas da aplicação (61 arquivos)
│   │   ├── PatientNOAChat.tsx               # Chat do paciente com Nôa
│   │   ├── PatientDashboard.tsx            # Dashboard do paciente
│   │   ├── ProfessionalDashboard.tsx       # Dashboard do profissional
│   │   ├── ClinicalAssessment.tsx          # Avaliação clínica
│   │   ├── Courses.tsx                     # Cursos
│   │   └── ...
│   │
│   ├── contexts/            # Contextos React (gerenciamento de estado global)
│   │   ├── AuthContext.tsx                 # Autenticação
│   │   ├── NoaContext.tsx                  # Contexto da IA Nôa
│   │   ├── NoaPlatformContext.tsx          # Plataforma Nôa
│   │   ├── RealtimeContext.tsx             # Conexões em tempo real
│   │   ├── ToastContext.tsx                # Notificações toast
│   │   └── UserViewContext.tsx             # Visualização do usuário
│   │
│   ├── hooks/               # Custom hooks React
│   │   ├── useMedCannLabConversation.ts    # Hook para conversação
│   │   ├── useChatSystem.ts                # Sistema de chat
│   │   ├── useMicrophone.ts                # Controle de microfone
│   │   └── ...
│   │
│   ├── lib/                 # Bibliotecas e utilitários
│   │   ├── medcannlab/                     # Integração API MedCannLab
│   │   │   ├── apiClient.ts                # Cliente HTTP
│   │   │   ├── apiKeyManager.ts            # Gerenciamento de chaves
│   │   │   ├── conversationalAgent.ts      # Agente conversacional
│   │   │   ├── nlp.ts                      # Processamento NLP
│   │   │   └── auditLogger.ts              # Auditoria
│   │   │
│   │   ├── noaResidentAI.ts                # Core da IA Residente
│   │   ├── noaEngine.ts                    # Motor da Nôa
│   │   ├── noaKnowledgeBase.ts             # Base de conhecimento
│   │   ├── assessmentRoteiroExato.ts       # Protocolo IMRE
│   │   ├── clinicalAssessmentService.ts    # Serviço de avaliações
│   │   ├── clinicalReportService.ts        # Serviço de relatórios
│   │   ├── supabase.ts                     # Cliente Supabase
│   │   ├── userTypes.ts                    # Tipos de usuário
│   │   └── ...
│   │
│   ├── services/            # Serviços de negócio
│   │   ├── knowledgeBaseIntegration.ts     # Integração base conhecimento
│   │   ├── chatEvolutionService.ts          # Evolução do chat
│   │   ├── notificationService.ts          # Notificações
│   │   ├── semanticSearch.ts               # Busca semântica
│   │   └── ...
│   │
│   ├── types/               # Definições TypeScript
│   ├── utils/               # Utilitários gerais
│   └── assets/              # Recursos estáticos
│
├── database/                # Scripts SQL de migração
│   └── hardening_2025_11/  # Scripts de hardening/segurança
│
├── assistant_documents/     # Documentos da IA
├── docs/                    # Documentação
├── dist/                    # Build de produção
└── coverage/                # Cobertura de testes
```

---

## 🎭 Tipos de Usuário

O sistema suporta **4 tipos principais de usuários**:

1. **Paciente** (`paciente`)
   - Dashboard personalizado
   - Chat com IA Residente (Nôa)
   - Avaliações clínicas automatizadas
   - Agendamentos
   - Visualização de relatórios clínicos
   - Chat com profissionais

2. **Profissional** (`profissional`)
   - Dashboard clínico
   - Gestão de pacientes
   - Agendamentos
   - Chat com pacientes e outros profissionais
   - Geração de relatórios clínicos
   - Visualização de avaliações IMRE

3. **Aluno** (`aluno`)
   - Dashboard educacional
   - Acesso a cursos
   - Biblioteca de conhecimento
   - Gamificação
   - Fóruns de casos clínicos

4. **Admin** (`admin`)
   - Painel administrativo completo
   - Gestão de usuários
   - Configurações do sistema
   - Analytics e KPIs
   - Upload de documentos

---

## 🗺️ Sistema de Rotas

O sistema utiliza **roteamento hierárquico por Eixos e Tipos**:

### Eixos Principais:

1. **Clínica** (`/app/clinica/`)
   - `/clinica/profissional/dashboard`
   - `/clinica/profissional/pacientes`
   - `/clinica/profissional/agendamentos`
   - `/clinica/profissional/relatorios`
   - `/clinica/profissional/chat-profissionais`
   - `/clinica/paciente/dashboard`
   - `/clinica/paciente/avaliacao-clinica`
   - `/clinica/paciente/chat-profissional`
   - `/clinica/paciente/agendamentos`

2. **Ensino** (`/app/ensino/`)
   - `/ensino/profissional/dashboard`
   - `/ensino/profissional/preparacao-aulas`
   - `/ensino/profissional/arte-entrevista-clinica`
   - `/ensino/profissional/gestao-alunos`
   - `/ensino/aluno/dashboard`
   - `/ensino/aluno/cursos`
   - `/ensino/aluno/biblioteca`
   - `/ensino/aluno/gamificacao`

3. **Pesquisa** (`/app/pesquisa/`)
   - `/pesquisa/profissional/dashboard`
   - `/pesquisa/profissional/forum-casos`
   - `/pesquisa/profissional/medcann-lab`
   - `/pesquisa/profissional/jardins-de-cura`

### Rotas Especiais:

- `/app/chat-noa-esperanca` - Chat com IA Residente
- `/app/patient-noa-chat` - Chat do paciente com Nôa
- `/app/clinical-assessment` - Avaliação clínica IMRE
- `/app/admin/*` - Painel administrativo

---

## 🤖 IA Residente - Nôa Esperança

### Componente Principal: `NoaConversationalInterface`

**Localização:** `src/components/NoaConversationalInterface.tsx` (2287 linhas)

**Funcionalidades:**
- ✅ Interface conversacional multimodal (texto + voz)
- ✅ Reconhecimento de voz (Web Speech API)
- ✅ Síntese de voz (Text-to-Speech)
- ✅ Escuta ativa com auto-resume
- ✅ Upload de documentos PDF
- ✅ Gravação de consultas
- ✅ Integração com base de conhecimento
- ✅ Processamento NLP especializado
- ✅ Protocolo IMRE automatizado
- ✅ Geração de relatórios clínicos

**Integrações:**
- API MedCannLab (`/platform/status`, `/training/context`, `/patients/simulations`, `/knowledge/library`)
- Supabase (chat, documentos, histórico)
- Sistema RAG para busca semântica
- Transformers.js para processamento local

---

## 📋 Protocolo IMRE

**Investigação, Metodologia, Resultado, Evolução**

Implementado em: `src/lib/assessmentRoteiroExato.ts`

**Fluxo:**
1. **Investigação**: Coleta de dados clínicos do paciente
2. **Metodologia**: Definição da abordagem terapêutica
3. **Resultado**: Análise dos resultados obtidos
4. **Evolução**: Acompanhamento e ajustes

**Características:**
- Avaliação triaxial (somático, psíquico, social)
- Perguntas estruturadas e contextualizadas
- Geração automática de relatórios
- Fechamento consensual

---

## 💬 Sistema de Chat

### Tipos de Chat:

1. **Chat com IA Residente** (`PatientNOAChat`)
   - Interface conversacional completa
   - Avaliações clínicas automatizadas
   - Suporte a voz

2. **Chat Profissional-Paciente** (`PatientDoctorChat`)
   - Comunicação direta
   - Histórico persistente
   - Notificações em tempo real

3. **Chat entre Profissionais** (`ProfessionalChat`)
   - Colaboração clínica
   - Discussão de casos
   - Compartilhamento de conhecimento

4. **Chat Global** (`ChatGlobal`)
   - Comunidade geral
   - Fóruns de discussão

**Tecnologia:**
- Supabase Realtime (WebSockets)
- Row Level Security (RLS) para segurança
- Notificações push

---

## 📊 Dashboards e KPIs

### Dashboards por Tipo de Usuário:

1. **PatientDashboard**
   - Métricas de saúde
   - Próximos agendamentos
   - Relatórios recentes
   - Evolução clínica

2. **ProfessionalDashboard**
   - Pacientes ativos
   - Agendamentos do dia
   - Relatórios pendentes
   - KPIs clínicos

3. **AlunoDashboard**
   - Progresso nos cursos
   - Conquistas (gamificação)
   - Biblioteca acessada
   - Fóruns participados

4. **AdminDashboard**
   - Usuários ativos
   - Métricas do sistema
   - Análise financeira
   - Configurações globais

---

## 🔐 Segurança

### Implementações:

1. **Row Level Security (RLS)**
   - Políticas de acesso por usuário
   - Isolamento de dados por tipo
   - Proteção de informações sensíveis

2. **Autenticação**
   - Supabase Auth
   - Sessões seguras
   - Refresh tokens

3. **API Keys**
   - Gerenciamento seguro de chaves MedCannLab
   - Renovação automática
   - Auditoria de acesso

4. **LGPD Compliance**
   - Página de termos (`/termos-lgpd`)
   - Consentimento de dados
   - Privacidade garantida

---

## 📚 Base de Conhecimento

### Sistema de Documentos:

- Upload de documentos PDF
- Processamento com PDF.js
- Indexação semântica
- Busca RAG (Retrieval Augmented Generation)
- Categorização por área (cannabis, nefrologia, etc.)
- Compartilhamento controlado

**Localização:** `src/services/knowledgeBaseIntegration.ts`

---

## 🎓 Sistema Educacional

### Funcionalidades:

1. **Cursos**
   - Módulos e lições
   - Conteúdo interativo
   - Progresso do aluno

2. **Biblioteca**
   - Documentos científicos
   - Artigos
   - Protocolos clínicos

3. **Gamificação**
   - Pontos e conquistas
   - Rankings
   - Badges

4. **Fóruns**
   - Discussão de casos clínicos
   - Debate de temas
   - Colaboração

---

## 🔄 Integrações Externas

### API MedCannLab

**Endpoints utilizados:**
- `GET /platform/status` - Status da plataforma
- `GET /training/context` - Contexto de treinamento
- `POST /patients/simulations` - Simulações clínicas
- `GET /knowledge/library` - Biblioteca de conhecimento

**Autenticação:**
- `X-API-Key` header
- Renovação automática
- Auditoria de chamadas

**Localização:** `src/lib/medcannlab/`

---

## 🧪 Testes

### Framework: Vitest

**Testes implementados:**
- `apiClient.test.ts` - Cliente HTTP
- `nlp.test.ts` - Processamento NLP

**Comandos:**
```bash
npm test          # Executar testes
npm run test:watch # Modo watch
```

**Cobertura:** Relatórios em `coverage/`

---

## 📝 Documentação Adicional

O repositório contém **centenas de arquivos de documentação** em Markdown:

- Guias de execução (`GUIA_*.md`)
- Análises do sistema (`ANALISE_*.md`)
- Correções (`CORRECAO_*.md`)
- Scripts SQL (`*.sql`)
- Documentos mestre (`DOCUMENTO_MESTRE_*.md`)

---

## 🚀 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento (porta 3000)
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Linting
npm run lint:fix     # Corrigir erros de lint
npm run type-check   # Verificar tipos TypeScript
npm test             # Executar testes
npm run test:watch   # Testes em modo watch
```

---

## 📈 Status do Projeto

✅ **Sistema 100% Funcional**
- ✅ Autenticação e autorização
- ✅ Chat em tempo real
- ✅ IA Residente operacional
- ✅ Protocolo IMRE implementado
- ✅ Relatórios clínicos automatizados
- ✅ Sistema educacional completo
- ✅ Dashboards personalizados
- ✅ Base de conhecimento integrada

---

## 🎯 Principais Funcionalidades

1. **Avaliação Clínica Automatizada**
   - Protocolo IMRE completo
   - IA individualizada por paciente
   - Geração automática de relatórios

2. **Interface Conversacional Avançada**
   - Multimodal (texto + voz)
   - Escuta ativa
   - Processamento NLP especializado

3. **Gestão Completa de Pacientes**
   - Prontuário eletrônico
   - Agendamentos
   - Histórico clínico
   - Relatórios compartilháveis

4. **Sistema Educacional**
   - Cursos estruturados
   - Gamificação
   - Biblioteca científica
   - Fóruns de discussão

5. **Colaboração Profissional**
   - Chat entre profissionais
   - Compartilhamento de casos
   - Discussão clínica

---

## 🔧 Configuração

### Variáveis de Ambiente Necessárias:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# MedCannLab API (opcional)
VITE_MEDCANNLAB_API_URL=https://api.medcannlab.com
VITE_MEDCANNLAB_API_KEY=your_api_key
```

---

## 📞 Contato e Suporte

Para mais informações, consulte:
- `README.md` - Documentação principal
- `docs/` - Documentação adicional
- Arquivos `GUIA_*.md` - Guias específicos

---

**Última atualização:** Janeiro 2025
**Versão:** 3.0.1
**Status:** Produção ✅

