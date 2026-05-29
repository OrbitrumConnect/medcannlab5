# POP-LBL-001 — Rotulagem SaMD e Restrições Operacionais

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §7.5.1.1.2 + RDC ANVISA 16/2013

---

## 1. Identificação do dispositivo médico

| Campo | Valor |
|---|---|
| Nome comercial | MedCannLab 3.0 |
| Classificação | Software as a Medical Device (SaMD) Classe IIa |
| Fabricante | (CNPJ a constituir — Marco 1) |
| Tipo | Plataforma HealthTech para Cannabis Medicinal com IA Residente |
| Versão | V1.9.501 (29/05/2026) — em desenvolvimento contínuo |
| Plataforma | Web (Vercel) + Mobile responsivo |

## 2. Finalidade declarada

MedCannLab é uma plataforma HealthTech/EdTech que apoia:

### 2.1. Eixo Clínica
- Conduzir Avaliação Estruturada com Cannabis (AEC) através de IA Residente Nôa Esperança
- Gerar relatórios clínicos estruturados (Pipeline Master v2)
- Documentar prescrições CFM com assinatura ICP-Brasil PBAD AD-RB
- Suportar follow-up de pacientes em uso de cannabis medicinal
- Sidecar para Doença Renal Crônica (DRC) e identificação de sinais neuro (TEA/TOD/TDAH)

### 2.2. Eixo Ensino
- Disponibilizar curso "Arte da Entrevista Clínica" (AEC)
- Simulação de pacientes com IA Residente para treinamento
- Avaliação de competências
- Mentoria com profissionais cadastrados

### 2.3. Eixo Pesquisa
- Fórum Cann Matrix para discussão científica
- Repositório de casos clínicos pseudonimizados
- Análise vetorial de corpus marcado pelo médico

## 3. Indicações de uso

### 3.1. Quem pode usar (autorizados)

- **Médicos** habilitados CRM ativo (verificação CFM API ou manual)
- **Pacientes** sob acompanhamento de médico cadastrado, com consentimento explícito (REGRA HARD §1)
- **Alunos** matriculados em curso AEC com cadastro validado
- **Administradores** designados pela governança MedCannLab

### 3.2. Como deve ser usado

- AEC conduzida pelo paciente com supervisão do médico responsável
- Decisões terapêuticas SEMPRE pelo médico (lock V1.9.388-A.3)
- Sistema gera **sugestões estruturadas**, **nunca prescrições autônomas**
- Documentação ICP-Brasil exige cert válida do médico

## 4. Contraindicações e restrições (CRÍTICO)

### 4.1. NÃO substitui consulta médica presencial inicial

MedCannLab é ferramenta **complementar**. Primeira consulta de avaliação cannabis medicinal deve seguir as orientações CFM 2.314 quanto a telemedicina E avaliação presencial quando aplicável.

### 4.2. NÃO é instrumento diagnóstico autônomo

A IA Nôa **não emite diagnóstico clínico**. Hipóteses diagnósticas geradas são **sugestões pra revisão médica** (lock V1.9.388-A.3 multi-camada).

### 4.3. NÃO substitui prescrição médica

Sistema documenta prescrição **feita pelo médico**. Não pode gerar prescrição autonomamente. Assinatura ICP-Brasil exige cert do próprio médico (Edge `sign-pdf-icp` v22 com auth + ownership check V1.9.457).

### 4.4. NÃO deve ser usado em emergência

Pacientes em **emergência médica** devem buscar atendimento presencial imediato. Sistema não tem capacidade de resposta a emergência.

### 4.5. Limitações de população

- Idade mínima recomendada: 18 anos (questões de consentimento)
- Pacientes pediátricos: requer responsável legal com consentimento próprio
- Gestantes/lactantes: requer avaliação caso-a-caso pelo médico
- Pacientes com transtornos psiquiátricos graves descompensados: requer supervisão presencial reforçada

## 5. Restrições técnicas

### 5.1. Conectividade

- Sistema requer conexão internet estável
- Funcionamento offline NÃO suportado (decisão arquitetural — princípio segurança LGPD)

### 5.2. Browser

- Browsers modernos: Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+
- IE 11 NÃO suportado
- Webview de WhatsApp NÃO recomendado (pode quebrar fluxo OAuth)

### 5.3. Mobile

- Responsivo até 360px de largura
- Funcionalidades clínicas críticas otimizadas pra desktop ≥1024px

## 6. Avisos obrigatórios na interface (exibidos ao usuário)

### 6.1. Pré-AEC

> *"Você está iniciando uma Avaliação Estruturada com Cannabis (AEC) conduzida por IA. As informações que você fornecer serão registradas e compartilhadas com o médico responsável pelo seu acompanhamento. Em situações de emergência, busque atendimento presencial imediatamente."*

### 6.2. Pós-relatório IA

> *"Este relatório foi gerado com apoio de Inteligência Artificial e DEVE ser revisado por médico habilitado antes de qualquer decisão terapêutica. A IA não substitui avaliação clínica humana."*

### 6.3. Pré-prescrição

> *"Esta prescrição será assinada digitalmente com seu certificado ICP-Brasil. Verifique todos os dados antes de assinar. A assinatura é juridicamente vinculante."*

## 7. Versionamento e atualizações

### 7.1. Esquema de versão

V**1**.**9**.**X**[-**A/B/C**] onde:
- 1 = arquitetura cognitiva COS Kernel
- 9 = fase MedCannLab 3.0
- X = patch incremental
- -A/B = subfix do mesmo ciclo

### 7.2. Notificação de atualização

- Atualizações **patch (X)** são deployadas automaticamente via Vercel
- Atualizações **lock (V1.9.X selado)** disparam memória persistente + atualização CLAUDE.md
- Atualizações **constitucionais (Magno)** exigem consenso explícito Tech Lead + Médico Sócio

## 8. Suporte e contato

- **Tech Lead**: Pedro Henrique Passos Galluf (passosmir4@gmail.com)
- **Médico Sócio (Clínica)**: Dr. Ricardo Valença (rrvalenca@gmail.com)
- **Coordenador Ensino**: Dr. Eduardo Faveret (eduardoscfaveret@gmail.com)
- **Sócio Institucional**: João Eduardo Vidal (cbdrcpremium@gmail.com)
- **Canal Feedback**: `/app/feedback` no sistema (V1.9.486)
- **GitHub Issues**: https://github.com/OrbitrumConnect/medcannlab5/issues

## 9. Eliminação e descarte

Por se tratar de software, descarte segue procedimento de **anonimização e remoção LGPD**:

- Solicitação via canal Feedback
- Função `anonymize_user_safely` RPC remove PII preservando agregados estatísticos
- Backup retido por período legal LGPD (5 anos para dados sensíveis de saúde)
- Reports ICP-Brasil signed mantidos por exigência legal (audit Portal ITI)

## 10. Conformidade declarada

### 10.1. Já demonstrada empiricamente

- ✅ Versionamento disciplinado V1.9.X
- ✅ Documentação técnica densa (66 diários + 6 Magnos + 284 memórias)
- ✅ Locks selados (8 atuais)
- ✅ PII sanitization (V1.9.452)
- ✅ Assinatura ICP-Brasil PBAD CONFORME ITI (V1.9.299)
- ✅ Ancoragem regulatória multi-camada (V1.9.388-A.3)

### 10.2. Pendente formalização

- ❌ Submissão ANVISA Classe IIa (pós-Marcos 1-3)
- ❌ CE Mark (caminho EU, posterior a BR)
- ❌ Auditoria SaMD por terceiros (consultora pós-CNPJ)

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
