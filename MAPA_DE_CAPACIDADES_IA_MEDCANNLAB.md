# 🗺️ MAPA DE CAPACIDADES IA: NÔA ESPERANZA & TRADEVISION CORE
> **Ecossistema Inteligente MedCannLab - Versão Janeiro 2026**
> *Status: Mapeamento de Funções Atuais e Potenciais (Environment Alive)*

---

## 🦾 1. O CÉREBRO CENTRAL: TRADEVISION CORE (V2)
O TradeVision Core é o motor "server-side" que processa a lógica pesada e orquestra os diferentes agentes da IA.

### Funções Atuais:
- **Normalização de Intenções**: Identifica se o usuário quer uma consulta, informação clínica ou suporte administrativo.
- **Motor de Reasoning (ACDSS)**: Analisa respostas do paciente em tempo real durante a avaliação inicial.
- **Predictive Scheduling**: Calcula a probabilidade de *no-show* baseada no histórico do paciente.
- **Soberania de Relatórios**: Gera e salva relatórios clínicos ignorando restrições de RLS (via Service Role) para garantir persistência.

### Potencial de Aplicação (Ambiente Vivo):
- **Dynamic Pricing**: Sugerir ajustes de preços de consulta baseados na demanda e ocupação da agenda.
- **Preventive Alerts**: Disparar notificações automáticas para o médico se a IA detectar um padrão de risco nos prontuários.

---

## 🏥 2. NÔA ESPERANZA: A RESIDÊNCIA CLÍNICA (FRONT-END)
A interface conversacional que acolhe o paciente e o profissional.

### Funções Atuais:
- **Acolhimento IMRE**: Avaliação Clínica seguindo o protocolo AEC 001 (10 etapas).
- **Infinite Conversation**: Memória de curto prazo para manter o fluxo dialógico natural.
- **Multimodalidade**: Reconhecimento de voz e leitura de documentos PDF/Imagens anexadas no chat.
- **Smart Widgets**: Ativação automática de calendários e formulários dentro da bolha de chat.

### Potencial de Aplicação (Ambiente Vivo):
- **Follow-up Ativo**: A Nôa pode iniciar conversas para perguntar "Como você se sente hoje após a nova medicação?"
- **Triagem de Urgência**: Encaminhamento imediato para "Tele-Acolhimento" se palavras-chave de risco forem detectadas.

---

## 🎓 3. NÔA EDUCACIONAL: O SISTEMA DE TREINAMENTO
Focado na formação de novos profissionais e nivelamento.

### Funções Atuais:
- **Simulação de Paciente (Paula/Dona Neide)**: IA interpreta personagens reais com patologias específicas para treinar alunos.
- **Avaliação de Nivelamento**: Testes dinâmicos que medem a capacidade diagnóstica do estudante.
- **Preparação de Aulas**: Auxílio ao Dr. Ricardo na estruturação de conteúdos baseados na Base de Conhecimento.

### Potencial de Aplicação (Ambiente Vivo):
- **Live Mentor**: A IA sussurrar no ouvido do aluno durante uma simulação: "Você esqueceu de perguntar sobre o histórico familiar".

---

## 🗃️ 4. INFRAESTRUTURA E SOBERANIA (KNOWLEDGE BASE)
O que permite que a IA não "alucine" e fale com autoridade médica.

### Funções Atuais:
- **Knowledge Base (376 Docs)**: Conexão via Vetores com toda a literatura técnica da MedCannLab.
- **Operação Híbrida/Offline**: Uso de modelos locais (MiniLM) para manter funções básicas sem internet.
- **Audit Log**: Todo "pensamento" da IA é registrado no banco `ai_chat_interactions` para auditoria clínica.

### Potencial de Aplicação (Ambiente Vivo):
- **Auto-Update Knowledge**: A IA extrair "pérolas" de novas consultas e sugerir a inclusão na base de conhecimento como novos protocolos.

---

## 🏁 CONCLUSÃO: O AMBIENTE VIVO
Em conjunto, essas funções transformam o app de um "repositório de dados" em um **"Ambiente Vivo"**:
1. O **TradeVision** observa os dados.
2. A **Nôa** conversa com as pessoas.
3. O **Knowledge Base** garante a verdade científica.

**Resultado: Uma plataforma que aprende, prevê e acolhe simultaneamente.** 💎🚀🦾
