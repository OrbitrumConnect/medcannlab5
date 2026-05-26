---
name: REGRA HARD — consentimento NUNCA dispara agendamento
description: Regra dura cristalizada após sprint V1.9.85 (27/04/2026). Separação semântica entre fluxo clínico e fluxo operacional. Validada por Pedro + GPT review.
type: project
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
**Regra dura:** "concordo", "sim", "autorizo", "pode" — quando ditas pelo paciente em fase de revisão da AEC (CONSENT_COLLECTION, CONSENSUS_REVIEW, CONSENSUS_REPORT) — confirmam **consentimento clínico**, NUNCA disparam **agendamento**.

**Os dois fluxos que NÃO podem ser misturados:**

| Fluxo | O que é | Onde vive |
|---|---|---|
| **Clínico** (concordância, autorização, validação) | Paciente confirma o que foi escutado, autoriza geração do relatório, valida o escriba | AEC fases CONSENT_COLLECTION, CONSENSUS_REVIEW, CONSENSUS_REPORT |
| **Operacional** (intenção de marcar consulta) | Paciente decide concretamente agendar com profissional | Card "Avaliação Concluída" pós-AEC, clique em "Agendar Consulta" |

**Por que essa regra é dura:**

Antes de V1.9.85, o Core fazia `if (norm.includes('concordo')) { injetar [TRIGGER_SCHEDULING] }` durante CONSENT_COLLECTION. Isso confundia consentimento clínico com decisão operacional. Carolina (27/04 ~13:01 BRT) experimentou: dizer "concordo" no consentimento abriu widget de agendamento prematuramente.

**Nova arquitetura (V1.9.85):**
- Core injeta apenas `[ASSESSMENT_COMPLETED][FINALIZE_SESSION]` em fim formal da AEC (FINAL_RECOMMENDATION/CLOSING)
- `[TRIGGER_SCHEDULING]` dispara **apenas** por **clique explícito** do paciente em "Agendar Consulta" no card final
- Princípio aplicado: eventos explícitos > inferência por texto

**Mecanismo anti-regressão (anti-kevlar):**

Se algum dia alguém quiser reabrir CONSENT_COLLECTION (ou outra fase de revisão) como gatilho de agendamento, a mudança **exige nova versão do Livro Magno antes do commit** — porque muda quem decide o quê e quando (anti-kevlar §1).

Comentário em `tradevision-core/index.ts:4839+` documenta a regra hard inline. Documentação em código + memória + diário 27/04 + descrição da PR — 4 camadas de proteção.

**How to apply:**
- Se vir `if (text.includes('concordo'))` decidindo ação de UI/banco → suspeitar
- Se vir gatilho de agendamento em fase clínica → flagrar imediatamente
- Antes de aprovar fix que mistura fluxo clínico com operacional → exigir nova versão do Livro Magno
- Em revisão de PR: "essa mudança permite que confirmação clínica vire decisão operacional?" Se sim → bloquear até alinhamento Ricardo/Pedro

**Why:**
- Auditabilidade: clínico (paciente concordou com o relatório) ≠ operacional (paciente quer marcar com Dr. X)
- Segurança regulatória: confusão semântica em sistema de saúde gera responsibility vacuum
- Princípio fundador (Livro Magno): "AEC organiza. Clínica interpreta." — clínica/clínica não vira operacional/clínica

**Validação:** Pedro autorizou + GPT review concordou em 27/04 ~13:30 BRT. Sprint V1.9.85 (commits 1b156ca, 3abb4b4, 05e4d4c, 16ff6d1 + reforço) implementou.
