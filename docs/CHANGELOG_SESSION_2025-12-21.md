# Relatório de Mudanças - Sessão 21/12/2025

## Resumo Executivo
Hoje focamos na reestruturação e simplificação do **Dashboard do Paciente** e no fluxo de **Agendamento de Consultas**, com foco na experiência do usuário e na garantia da Jornada de Cuidado (Avaliação Clínica Obrigatória).

## 🔄 Antes e Depois

### 1. Dashboard do Paciente (`PatientDashboard.tsx`)
*   **Antes:**
    *   Possuía uma aba interna complexa chamada "Agendamento" que renderizava uma lista de profissionais e explicações duplicadas.
    *   Navegação confusa entre o Dashboard e a página dedicada de Agendamentos.
*   **Depois:**
    *   **Simplificado:** Removemos a aba interna "sistema de agendamento".
    *   **Navegação Unificada:** O botão de "Agendar Consulta" agora redireciona diretamente para a rota `/app/patient-appointments`, centralizando a lógica.

### 2. Página de Agendamentos (`PatientAppointments.tsx`)
*   **Antes:**
    *   Exibia um texto longo e estático sobre a "Jornada de Cuidado".
    *   Não listava os profissionais disponíveis para agendamento direto (apenas consultórios genéricos ou via dashboard).
    *   Permitia tentar agendar (ou apenas ver calendário) sem verificar se o paciente já tinha passado pela avaliação inicial.
*   **Depois:**
    *   **Jornada Simplificada:** O texto longo foi substituído por um banner limpo com um botão "Manual da Jornada" que abre um modal explicativo (`JourneyManualModal`).
    *   **Vitrine de Profissionais:** Adicionada a seção "Agendar com Especialista" (Dr. Eduardo Faveret e Dr. Ricardo Valença) diretamente nesta página.
    *   **Trava de Segurança (Avaliação):** Ao clicar em "Agendar Consulta", o sistema verifica se o paciente possui um plano de cuidado (`carePlan`). Se não tiver, exibe o `AssessmentRequiredModal`.

### 3. Integração com IA (`PatientNOAChat.tsx`)
*   **Antes:**
    *   Chat abria genericamente ou apenas iniciava avaliação sem contexto do médico desejado.
*   **Depois:**
    *   **Contexto Preservado:** Se o paciente for redirecionado pelo modal de "Avaliação Obrigatória" ao tentar agendar com o Dr. Ricardo, o chat inicia dizendo: *"Gostaria de realizar minha avaliação para posterior agendamento com Dr. Ricardo Valença"*.

## 🛠️ Componentes Novos/Alterados
1.  **`src/components/AssessmentRequiredModal.tsx` [NOVO]:** Modal que bloqueia o agendamento se não houver avaliação, educando o paciente sobre a necessidade do protocolo IMRE.
2.  **`src/components/JourneyManualModal.tsx` [NOVO]:** Modal informativo com os passos da jornada (Avaliação -> Relatório -> Compartilhamento -> Consulta).
3.  **`src/pages/PatientAppointments.tsx`:** Refatorado para incluir a lista de profissionais e lógica de modal.
4.  **`src/pages/PatientNOAChat.tsx`:** Atualizado para receber `targetProfessional` via `location.state`.

## 🐛 Correções
*   Correção de erro de referência (`Stethoscope is not defined`) em `PatientAppointments.tsx`.
*   Limpeza de imports duplicados e código morto no Dashboard.

---
**Status:** ✅ Concluído e Testado.
