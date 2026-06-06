# Camada Cognitiva — Cidade Amiga dos Rins Digital

> **Enquadramento (segurança do paciente):** documento institucional que descreve a camada cognitiva da plataforma MedCannLab aplicada ao programa **Cidade Amiga dos Rins (CAR)**. Posiciona a tecnologia como **gestão de risco na linguagem clínica — antes da doença instalada**, alinhada à linha de pesquisa do Dr. Ricardo Valença.
>
> **Disciplina anti-overclaim (manter):** a plataforma é **apoio cognitivo à escuta clínica**, não substitui diagnóstico médico. Baseline SGQ = SaMD Classe IIa, **não-decisional** (mitigação de classe). Não é "FHIR/RNDS ready", não é "IA que diagnostica". O médico decide; o sistema organiza o relato e sinaliza.

---

## 1. A tese: risco mora na linguagem, antes do laboratório

A Sociedade de Nefrologia capta o paciente **a partir da creatinina elevada** — quando o rim já perdeu função. O modelo de atenção atual perde o paciente nas etapas precoces (estágios 1-2-3), onde o sinal não está no exame, mas **no que a pessoa relata**: cálculo renal, infecção urinária de repetição, dor lombar, dificuldade para urinar.

A **Camada Cognitiva CAR Digital** atua exatamente nesse intervalo: **escuta estruturada + sinalização de risco semântico**, capturando o relato espontâneo antes do desfecho laboratorial. É **gestão de risco na semântica** — o que o Dr. Ricardo Valença chama de "olhar para o que o paciente fala, bem antes de se pensar em doença".

---

## 2. As 4 camadas técnicas (o que já roda)

| Camada | Função | Garantia de segurança |
|---|---|---|
| **AEC / MIMRE** (Avaliação Clínica Inicial) | Motor determinístico de entrevista que incentiva o **relato espontâneo** (método autoral Ricardo Valença) | Fases fixas, não pula etapas; consentimento ≠ agendamento (regra constitucional) |
| **Matrix Z2** (modo pesquisa) | Camada cognitiva que organiza informação clínica **sem sintetizar diagnóstico** | Anti-alucinação: material é **marcado, não inventado**; a IA **admite limite** em vez de fingir que entende |
| **Sidecar Renal** | Extrai sinais renais do relato + laboratório (creatinina / eGFR / proteinúria) de forma passiva | Não decide conduta; sinaliza para o médico |
| **Constituição cognitiva** | Princípios que governam o sistema: *"queixa ≠ sintoma"*, 4 eixos de escuta, **a IA admite quando não sabe** | Defesa em camadas: validação em runtime, não confiança no prompt |

> **Princípio nuclear:** o sistema **separa "organizar a informação" de "decidir a terapêutica"**. A primeira é da plataforma; a segunda é exclusivamente do médico.

---

## 3. Por que isto é "segurança do paciente"

Segurança do paciente, como modelo de gestão de risco, pergunta: *onde o sistema de saúde erra, e como anteciparmos?* A resposta clássica em nefrologia é tardia (o erro aparece no exame alterado). A Camada Cognitiva CAR Digital propõe a **antecipação na linguagem**:

1. **Captura local e ágil** — o paciente relata onde está, sem depender de exame marcado em outra cidade meses depois ("sistema suave de resolução do problema").
2. **Longitudinal** — o relato é estruturado e acompanhado ao longo do tempo, não um evento isolado.
3. **Sinalização precoce** — sinais semânticos de risco renal são marcados para o médico antes do desfecho laboratorial.
4. **Rastreável e auditável** — todo passo é registrado (governança SGQ orientada a ISO 13485 / IEC 62304 / ISO 14971, em construção).

---

## 4. Fronteiras honestas (o que NÃO é)

- **Não diagnostica.** Organiza o relato e sinaliza; o diagnóstico é ato médico.
- **Não substitui exame.** Antecipa a escuta; o laboratório segue necessário.
- **Não é certificação concluída.** O SGQ está em construção (drafts ISO/IEC); a petição ANVISA depende de constituição formal (CNPJ).
- **Não é interoperabilidade homologada.** Há estrutura compatível com FHIR R4 (PoC validado), mas **RNDS não homologada**.
- **A remissão de DRC** é paradigma emergente na literatura (ex.: Tangri et al., *Kidney Int.* 2026) — a plataforma **investiga** a contribuição da escuta precoce e de canabinoides anti-inflamatórios (CBG/CBD) como **vetor complementar de pesquisa**, sem afirmar eficácia estabelecida.

---

## 5. Convergência institucional

A Camada Cognitiva CAR Digital é a tradução técnica da linha de pesquisa "segurança do paciente via gestão de risco semântica" para 3 audiências B2B do mesmo produto:

- **Cidade Amiga dos Rins Digital (CARD-RJ)** — prefeitura / saúde pública municipal
- **Sociedade Brasileira de Nefrologia** — estagiamento DRC precoce (dado que não existe hoje a partir do laboratório)
- **Ambulatório regional (Rio Bonito)** — "linguagem dos encontros"

> **Síntese:** a tecnologia não é o protagonista. O protagonista é o **método de escuta** (Ricardo Valença, três décadas de prática e pesquisa em comunicação clínica). A plataforma é a camada que **escala** esse método com rastreabilidade e segurança.

---

*Documento institucional — versão de trabalho. Linguagem auditor-safe; revisar com Dr. Ricardo Valença antes de uso externo. Não contém dados de paciente.*
