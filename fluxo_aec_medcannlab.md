# 🗺️ Diagrama Master: Jornada da AEC (Avaliação Clínica Inicial)

Conforme sua solicitação, mapeei a estrutura de código real que reflete a experiência do usuário, desde a entrada no sistema até a entrega rastreável do laudo ao Médico, detalhando como as Edge Functions, UI Components e Travas LGPD se manifestam no fluxo.

```mermaid
sequenceDiagram
    autonumber
    
    actor P as 🧑 Paciente
    participant UI as 🖥️ React App (UI)
    participant CLF as 🧠 clinicalAssessmentFlow.ts
    participant NOA as 🤖 noaResidentAI.ts
    participant SUP as ☁️ Supabase (Edge & Logs)
    participant DB as 🗄️ PostgreSQL (clinical_reports)
    actor M as 👨‍⚕️ Profissional (Médico)

    %% 1. Início e Orquestração
    note over P, UI: App iniciado e Terminal de Bate-Papo Nôa aberto
    P->>UI: Diz: "Quero começar minha avaliação"
    UI->>CLF: Processa a entrada e inicia a State Machine (INITIAL_GREETING)
    
    %% 2. Conversação Inteligente
    loop Fases da Avaliação
        CLF-->>NOA: Retorna nextQuestionHint contendo as trilhas do Dr. Ricardo
        NOA->>SUP: Invocação à Edge Function (Conversação Padrão RAG)
        SUP-->>NOA: Resposta Humanizada (Texto)
        NOA-->>UI: Exibe ao Paciente no Chat
        P->>UI: Responde à Nôa (Queixas, Dores, etc.)
        UI->>CLF: processResponse() armazena estado no JSON Local
    end
    
    %% 3. Fechamento e Consentimento LGPD
    note over CLF, UI: Transição de Fase: FINAL_RECOMMENDATION ➡️ CONSENT_COLLECTION
    CLF-->>UI: Dispara Modal/Termo de Consentimento para o Paciente
    
    alt Paciente recusa consentimento
        P->>UI: "Não concordo"
        UI->>CLF: consentGiven = false
        CLF->>NOA: Falha no Flow
        NOA->>NOA: ⚠️ MedCannLabAuditLogger.security("LGPD_VIOLATION_PREVENTED")
        note over NOA, SUP: Fluxo abortado, nada enviado para a nuvem.
    else Paciente concede consentimento
        P->>UI: "Eu Concordo"
        UI->>CLF: consentGiven = true
        CLF->>NOA: Autoriza Finalização Fase COMPLETED
        
        %% 4. Injeção de Meta-Tag e Disparo
        NOA->>NOA: 📋 MedCannLabAuditLogger.audit("ASSESSMENT_COMPLETED")
        NOA->>SUP: Payload + Histórico + Tag [ASSESSMENT_COMPLETED]
        NOA-->>UI: Renderiza texto de despedida (Ocultando a TAG)
        
        %% 5. Master Pipeline & Segurança em Nuvem
        note over SUP: A Mágica de Backend (tradevision-core) Acontece!
        SUP->>SUP: 🔒 Validar JWT Token (Zero-Trust)
        SUP->>SUP: ⚖️ Validar Consentimento no Payload do Estado
        SUP->>SUP: ⏱️ Consulta Redis/Trava de Idempotência (Evitar Duplicados 1h)
        SUP->>SUP: 🤖 Engine GPT: Extração em Formato SOAP (Investigação, Resultado, etc.)
        
        %% 6. Persistência 
        SUP->>DB: INSERT INTO clinical_reports (content: JSON + Encrypted Fields)
        DB-->>SUP: Status 201 (Sucesso)
    end
    
    %% 7. Consumo pelo Profissional
    note over M, UI: Visão do Consultório (Algumas horas depois)
    M->>UI: Acessa /app/reports via Sidebar Atualizada
    UI->>DB: clinicalReportService.getAllReports()
    DB-->>UI: Retorna Lista Filtrada do Paciente
    UI-->>M: Renderiza Painel Clínico Analytics com Selo 🔒 "LGPD Compliant"
```

## Como Ler os Principais Pontos no Código:
- **Passo 2 (Loop):** Gerenciado pela `clinicalAssessmentFlow.ts` lendo as strings de `complaintList` e `complaintDescription`.
- **Passos 3 e 4 (O Bloqueio Front-end):** Interceptado no `checkForAssessmentCompletion` dentro de `src/lib/noaResidentAI.ts`, onde amarramos hoje a validação `flowState?.data?.consentGiven`.
- **Passo 5 (Master Pipeline Supabase):** Ocorre unicamente na `supabase/functions/tradevision-core`, protegido pela dupla barreira (Idempotência/LGPD) que instalei ali.
- **Passo 7 (Visual Profissional):** Operado na `src/pages/Reports.tsx` em que o médico enxerga a avaliação sanitizada, os *Scores de Avaliação Orgânicos* (que não são mais "100/100" travados), e tem as opções de exportar e revisar os PDFs com as novas Badges de autoridade.
