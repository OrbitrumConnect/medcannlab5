# Gap-Analysis de Conformidade Regulatória — MedCannLab

> **O que falta, e como, pra estar dentro das normas.** Documento técnico-regulatório auditor-safe.
>
> **Data:** 02/06/2026 · **Método:** workflow multi-agente (10 agentes de pesquisa web por norma + 7 de verificação empírica + síntese + crítico adversarial anti-overclaim) **+ re-verificação direta dos números via PAT na mesma sessão** (Management API, HTTP 201, 02/06). Cada número aqui é (a) **auto-verificado no banco hoje**, (b) **citado de fonte web oficial**, ou (c) **lido no código/docs** — e está marcado quando NÃO foi re-verificável.
>
> ⚠️ **Padrão anti-overclaim (nunca violado neste doc):** o relatório clínico carrega **hash SHA-256 de integridade, NÃO assinatura ICP-Brasil**; o sistema é **SaMD Classe IIa _sujeita a avaliação formal_, nunca "não-SaMD"**; SBIS-CFM = **"alinhado aos princípios", não "certificado"**; RNDS = **"caminho definido / compatível", não "homologado"**; números de artigo/norma não confirmados em fonte primária estão **marcados como tal**. As citações regulatórias devem ser confirmadas com especialista regulatório/jurídico antes de uso oficial.

---

## 1. Veredito executivo

**Situação geral: PARCIAL em todas as frentes.** Nenhuma norma está em "zero" (há base real, densa, em quase todas); **nenhuma está em "100%"** (falta o carimbo externo + alguns gaps de processo/documento). O sistema tem **substância técnica acima da média de healthtech** (SGQ orgânico, ICP-Brasil real em prescrições/exames, governança de IA não-decisional codificada, RLS 100%), mas a conformidade formal depende de duas coisas que ainda não existem:

1. **🔴 Gargalo-mãe — Marco 1 (CNPJ + Responsável Técnico):** destrava em cascata a notificação ANVISA, a inscrição da PJ no CRM, a designação do RT, o PaymentGate (1º pagante = Marco 2) e a integração SNCR. **~50% do roadmap regulatório está bloqueado aqui.**
2. **🟢 Trilha técnica atacável JÁ (sem depender de ninguém):** ~6 ações internas que aumentam a maturidade hoje (corrigir leak PII, atualizar doc de risco, relatório de IA, dossiê de cibersegurança, terminologia mínima, promover o FHIR PoC).

**"100% conforme"** = *submission-ready* interno (este doc fechado + drafts SGQ aprovados) **+** carimbo externo (consultora SaMD + RT + petição ANVISA + entidade certificadora SBIS + homologação RNDS). A trilha técnica não espera ninguém; a formal destrava com o Marco 1.

---

## 2. Estado empírico auto-verificado (PAT, 02/06/2026, HTTP 201)

Números re-conferidos por query direta nesta sessão (não herdados de docs — que estavam **stale**: diziam 144 tabelas/447 policies; o **live é 145/467**):

| Métrica | Valor live | Implicação regulatória |
|---|---|---|
| Tabelas públicas com RLS | **145 / 145 (100%)** | Cibersegurança (RDC 657 Art.17) — base técnica forte |
| Policies RLS ativas | **467** | idem |
| `clinical_reports` | **150** total · **47 c/ hash SHA-256 (31%)** · **101 c/ consent** | Relatório = integridade, não ICP; consentimento auditável presente |
| `cfm_prescriptions` | **52** (12 c/ PKCS#7 real) | ICP-Brasil real em prescrições |
| `patient_exam_requests` | **25** · **`signed_at` NULL em 25/25** | ICP em exames, mas **timestamp de assinatura não gravado** (gap auditabilidade) |
| `pki_transactions` | **12** · **`signer_cpf='000.000.000-00'` em 12/12** (1 valor distinto) | **CPF/cert real do médico não gravado** (placeholder) |
| `patient_conditions` | **0 rows** | **Zero terminologia codificada** (sem CID-10) |
| `clinical_rationalities` | **141** · **121 pseudonimizadas (85,8%)** · **20 não** | Pseudonimização ~86%; **20 rows com PII residual** |
| `patient_lab_results` | coluna real = **`test_type`** (enum); **`exam_type` NÃO existe** | Confirma bug do RPC `calculate_ckd_stage` (INSERT em coluna inexistente) |

---

## 3. Gap por norma

Legenda status: ✅ atende · 🟡 parcial · 🔴 falta · ⚪ não incide hoje. Esforço: B(aixo)/M(édio)/A(lto). Destrava: **Téc** (técnico-interno) · **M1** (Marco 1 CNPJ) · **Cons** (consultora) · **Ric** (Dr. Ricardo) · **Cert** (certificadora).

### 3.1 ANVISA — SaMD (RDC 657/2022 · 751/2022 · 848/2024)

| Requisito | Status | Gap | Esf. | Destrava |
|---|---|---|---|---|
| **Enquadramento + classe de risco** (RDC 751 Regra 11) | 🟡 | Documentado interno (PLN-IEC-001 Classe B; POP-LBL-001 SaMD Classe IIa), **mas sem consulta formal de enquadramento à ANVISA**. É Classe IIa _sujeita a avaliação_ — nunca "não-SaMD"; não-decisional = mitigação de classe. | B | Cons |
| **Notificação ANVISA (código 80272)** | 🔴 | Não peticionada. Pré-PMF (0 pagantes externos, Stripe MOCK) ainda se beneficia do uso interno (Art.5), mas é **pré-condição HARD do 1º pagante externo**. Objeto social do CNPJ precisa contemplar software médico; AFE a verificar. | A | M1 |
| **Relatório de IA** (RDC 657 Art.12, IX) | 🟡 | Usa GPT-4o-2024-08-06 via OpenAI (`index.ts:6646`); arquitetura não-decisional + RAG curado existem, **mas falta o documento SGQ formal "Relatório de IA"** (racional da técnica, bases, fronteira OpenAI×fabricante). Evidência existe, documento auditor-ready não. | M | **Téc** |
| **Cibersegurança** (RDC 657 Art.17) | 🟡 | Técnica **forte e auto-verificada** (RLS 145/145, 467 policies, `verify_jwt=true` em 14/15 Edges — única exceção `sign-pdf-icp` parqueada com auth interna V1.9.457). **Rebaixado de "atende" para parcial** porque o **documento de cibersegurança do dossiê ainda não foi escrito** (evidência ≠ dossiê). | B | **Téc** |
| **Rotulagem / instruções de uso** (RDC 657 Art.6-7) | 🟡 | POP-LBL-001 (172 linhas, 10 seções, contraindicações) já cobre, mas em **DRAFT 0.1** com assinaturas em branco e `Fabricante = "(CNPJ a constituir)"`. | B | M1 |
| **Requisitos essenciais** (RDC 848/2024, vigente set/2024) | 🟡 | Arquitetura não-decisional + RSK-001 (10 hazards) atendem o espírito; falta **avaliação clínica documentada** (`clinical_qa_runs` ~0,75%, 1 run desde 27/04) + declaração formal de conformidade. | M | Ric |
| **Vigilância pós-mercado / tecnovigilância** (Art.23-24 + RDC 67/2009) | 🔴 | PROC-INC-001 e PROC-PMS-001 **ausentes** (parqueados — dependem de incidentes reais + Marco 2). Existe proto-vigilância (`system_health_alerts`, `institutional_trauma_log`), sem processo formal. | M | M1 |

### 3.2 SGQ — ISO 13485 · IEC 62304 · ISO 14971 (via RDC 657 Art.13)

| Requisito | Status | Gap | Esf. | Destrava |
|---|---|---|---|---|
| **ISO 13485** (SGQ documentado) | 🟡 | SGQ orgânico **denso**: ~20 drafts (MAN-SGQ-001, POP-PRJ-002, PROC-CAPA-001) + rastreabilidade bidirecional (URS/SRS/SAD/TRM, ~193 itens). Mas **todos DRAFT 0.1/0.2 pré-consultora**, assinaturas em branco; **gestão de SOUP ausente**. *Não é certificação obrigatória p/ Classe II (regime notificação) — é baseline defensivo.* | A | Cons |
| **IEC 62304** (ciclo de vida) | 🟡 | Classe B justificada (PLN-IEC-001 via lock V1.9.388-A.3); SRS/TRM cobrem. Gaps: §6.1 (manutenção) e §7 (gestão de risco runtime) sem draft; cobertura de teste por classe não documentada; bug-tracker formal ausente. *Edition 2 (ago/2026) fundirá B+C e exigirá AI Planning §5.1.15 — monitorar.* | A | Cons |
| **ISO 14971** (gestão de risco) | 🟡 | RSK-001 com 10 hazards (inclui riscos de IA). **PROBLEMA FÁCIL DE FECHAR:** RSK-001 está **desatualizado** — hazard **H8 (`verify_jwt=false`) marcado PENDENTE**, mas V1.9.506 (30/05) **já corrigiu** (`verify_jwt=true`, v424, confirmado). Falta também monitoramento pós-produção (cláusula 10). | B | **Téc** |

### 3.3 SBIS-CFM (S-RES / NGS2 / IA)

| Requisito | Status | Gap | Esf. | Destrava |
|---|---|---|---|---|
| **NGS2** (assinatura ICP, log, RBAC, integridade) | 🟡 | **Alinhado aos princípios, não certificado.** Atende: ICP real em prescrições/exames, RBAC 4 roles, TLS, log (`noa_logs`). Lacunas hard: relatório só hash SHA-256 (não ICP); `signer_cpf` placeholder (12/12); `validation_codes "ITI-"` gerados internamente (sem callback ITI); sem ≥2 ACs; PDFs nunca submetidos ao `validar.iti.gov.br`. | A | Cert |
| **Certificação SBIS de IA** | ⚪ | Ainda em **consulta pública** (jun/2025) — **não incide hoje**. Posição não-decisional codificada (`index.ts:5239`) é mitigador. Monitorar até virar norma. | — | Cert |

### 3.4 CFM — 2.314/2022 (telemedicina) · 2.454/2026 (IA)

| Requisito | Status | Gap | Esf. | Destrava |
|---|---|---|---|---|
| **Documentos de telemedicina** (CFM 2.314 Art.13) | 🟡 | Prescrições/exames já assinados ICP (PKCS#7 real) atendem. Lacunas: relatório só hash; `signer_cpf` placeholder; **consentimento específico de teleconsulta (Art.15) ≠ consent AEC** (101/150 cobre o clínico AEC, não o de teleconsulta). | M | Ric |
| **PJ prestadora** (CFM 2.314 Art.16-17) | 🔴 | Sem CNPJ → PJ não existe → sem inscrição no CRM da PJ nem RT designado. Dr. Ricardo Valença = candidato natural a RT. 100% dependente do Marco 1. | M | M1 |
| **CFM 2.454/2026 (IA na medicina)** | 🟡 | **⚠️ ATUALIZAÇÃO:** a norma **EXISTE** — número + **DOU 27/02/2026** + vigência **~26/08/2026** confirmados em fonte web (refuta a marcação interna anterior de "sem lastro"). **PORÉM os números de ARTIGO (supervisão humana, classes de risco, Comissão de IA) vieram de fontes secundárias e ainda precisam ser conferidos no PDF oficial** — tratar como **direção regulatória, não mapeamento artigo-por-artigo**. Núcleo já atendido (supervisão humana, não-decisional, AEC GATE, REGRA HARD §1). Lacunas p/ ~26/08: classificação de risco formal CFM (distinta da ANVISA), aviso explícito ao paciente sobre uso de IA, governança/Comissão de IA. | M | Cons |

### 3.5 LGPD (Lei 13.709/2018)

| Requisito | Status | Gap | Esf. | Destrava |
|---|---|---|---|---|
| **Base legal + consentimento** (Art.11) | 🟡 | Consentimento AEC auditável **robusto** pós-V1.9.546 (101/150, invariante íntegra: 0 reports assinados sem consent). Falta **separar formalmente** a base legal: assistência (tutela da saúde) vs uso de dados p/ treino/analytics/RAG (consentimento específico Art.11,I). | M | Cons |
| **Pseudonimização / segurança** (Art.46-47, 12) | 🟡 | **🚨 VULNERABILIDADE DE DESIGN CONFIRMADA EM CÓDIGO (P0):** `sanitizeRationalityPII` (`tradevision-core/index.ts:197-234`) tokeniza o nome do DB e faz regex de **token exato `\b<token>\b`, sem normalizar variantes ortográficas/typos** — se a grafia no DB difere da que o GPT gera, **vaza**. Empíricamente: **20 de 141 racionalidades NÃO pseudonimizadas** (live). *A instância nominal específica reportada pela auditoria não foi re-logada aqui por ser PII; o mecanismo, sim, está confirmado no código.* | M | **Téc** |
| **Governança LGPD** (Art.37-39, 41 + Res. ANPD 15/2024) | 🔴 | **Ausentes:** RIPD, DPO/encarregado formal, DPA/contratos de operador (Supabase/OpenAI/Resend), RPA, procedimento de notificação de incidente (3 dias úteis). Dados de saúde são foco do Mapa de Fiscalização ANPD 2026-2027. Gaps de processo/jurídico. | A | Cons |
| **Retenção + direitos do titular** (Art.18 + Lei 13.787/2018) | 🔴 | Sem política de retenção 20 anos documentada; sem canal/UI de direitos do titular (acesso/portabilidade/retificação). Pseudonimização V1.9.407 mitiga, não substitui o canal. | M | **Téc** |

### 3.6 RNDS / DATASUS + br-core (HL7 FHIR R4)

| Requisito | Status | Gap | Esf. | Destrava |
|---|---|---|---|---|
| **Interoperabilidade FHIR R4** | 🟡 | **Caminho definido / compatível, NÃO homologado.** Serializer FHIR R4 **PoC** existe (`src/lib/fhir/`, V1.9.563, 9/9 testes + validado vs report real). Lacunas: **sem endpoint HTTP `/fhir`** (0 callers em produção), namespace proprietário `urn:medcannlab`, **br-core não implementado**, LOINC ilustrativo, nenhum Bundle validado no `validator.fhir.org`. Obrigatoriedade p/ clínica privada ainda não regulamentada. | A | **Téc** |
| **Terminologia codificada** (RAC + br-core) | 🔴 | **ZERO terminologia codificada.** `patient_conditions` = **0 rows** (sem CID-10); `patient_lab_results` usa enum proprietário (não LOINC); `cfm_prescriptions` em texto livre (sem ATC/RxNorm). A IA **não infere** por lock institucional (não categoriza por doença/não diagnostica — `index.ts:5180`; *o lock é de não-diagnóstico, que por consequência impede CID — não há trava textual sobre "CID-10" especificamente*). **Codificação = ato humano pós-consulta.** Maior trabalho de interop. | A | Ric |

### 3.7 ICP-Brasil / PBAD AD-RB + ITI

| Requisito | Status | Gap | Esf. | Destrava |
|---|---|---|---|---|
| **Assinatura qualificada** (Lei 14.063/2020 + CFM 2.381/2024) | 🟡 | Algoritmo **PBAD AD-RB tecnicamente robusto e real** (lock V1.9.299; PKCS#7 detached, OIDs corretos): 12 prescrições + 13 exames com PKCS#7 real. Lacunas auto-verificadas: **`signer_cpf='000.000.000-00'` em 12/12** (CPF real do médico não gravado — viola identificação completa CFM 2.381 Art.13); thumbprint fictício; `validation_codes "ITI-"` internos (sem callback ITI); **`signed_at` NULL em 25/25 exames**; PDFs **nunca submetidos ao `validar.iti.gov.br`** (conformidade declarada no código, não testada externamente). Relatório = hash SHA-256, não ICP (correto por design). | A | Ric |

### 3.8 ANVISA RDC 1.015/2026 + SNCR (cannabis medicinal)

| Requisito | Status | Gap | Esf. | Destrava |
|---|---|---|---|---|
| **Prescrição estruturada + SNCR** | 🔴 | RDC 1.015/2026 (vigor 04/05/2026) + integração ao **SNCR** (Sistema Nacional de Controle de Receituários) p/ receita eletrônica de cannabis. **Nenhuma integração existe**; as 52 prescrições são **texto livre** (ex: "REuni CBG 80/40 mg") sem numeração SNCR nem Autorização Sanitária estruturada; sem diferenciar THC ≤0,2% (Controle Especial) vs >0,2% (Notificação Receita A). *Datas específicas do cronograma SNCR (disponibilidade 01/06 / adequação ~set/2026) a confirmar em fonte oficial ANVISA.* | A | M1 |

---

## 4. O que falta pra 100% — plano de ataque (ordem ROI × risco)

### 🟢 Atacável JÁ — técnico-interno, NÃO depende de CNPJ/ninguém
1. **[P0 · ~1-2h] Corrigir o leak PII** em `clinical_rationalities`: normalizar variantes no `sanitizeRationalityPII` (tokenizar primeiro nome isolado + tolerância a typo), re-anonimizar as 20 rows não-pseudonimizadas, investigar o alerta PII em `system_health_alerts`. **Risco LGPD direto.**
2. **[B · ~30min] Atualizar RSK-001**: marcar hazard H8 (`verify_jwt`) como RESOLVIDO (V1.9.506 já corrigiu). Documento de risco não pode mentir sobre o estado real.
3. **[B] Escrever o dossiê de cibersegurança** (RDC 657 Art.17) — a evidência já é forte (RLS 145/145, 467 policies, verify_jwt 14/15); falta o documento. Trocar a policy `clinical_reports` com 4 UUIDs hardcoded por check role-based (`is_admin()`).
4. **[M] Relatório de IA formal** (RDC 657 Art.12,IX): racional GPT-4o + 8 camadas + fronteira OpenAI×fabricante.
5. **[M] Política de retenção (20 anos) + canal de direitos do titular** (LGPD Art.18).
6. **[A] Promover o FHIR PoC a operacional**: endpoint HTTP `/fhir`, namespace canonical, slices br-core, LOINC validado, submeter ao `validator.fhir.org`. Manter "compatível", nunca "FHIR/RNDS Ready".

### 🟡 Custo zero mas externo — pode iniciar sem CNPJ
7. **[Cons] Consulta formal de enquadramento SaMD à ANVISA** (GQUIP/GGTPS) — transforma "Classe IIa interno" em certeza regulatória; pré-trabalho da notificação 80272.
8. **[Ric] Smoke ITI completo**: submeter os 25 PKCS#7 ao `validar.iti.gov.br` + `openssl asn1parse`. Lock V1.9.299 — só validar, não tocar o algoritmo. Gravar CPF/cert real do médico + preencher `signed_at`.
9. **[Ric] Terminologia mínima**: UI p/ o médico anexar CID-10 (`patient_conditions` vazia) + **corrigir o RPC `calculate_ckd_stage`** (faz INSERT em `exam_type`, coluna inexistente — a real é `test_type`). IA não infere (lock preservado).

### 🔴 Depende de decisão humana — Marco 1 é o gargalo-mãe
10. **[M1] Constituir o CNPJ** (objeto social = software médico) → **destrava em cascata:** notificação ANVISA 80272, AFE, inscrição PJ no CRM + RT (CFM 2.314 Art.16), `Fabricante` em POP-LBL-001, Stripe Connect → PaymentGate → 1º pagante (Marco 2), integração SNCR.
11. **[M1+Téc] Integração SNCR** (cannabis) — canal regulatório mais específico do contexto. Estruturar prescrição por Autorização Sanitária + diferenciar THC + numeração SNCR via API.
12. **[Cons] Artefatos de governança LGPD**: RIPD, DPO, DPA (Supabase/OpenAI/Resend), RPA, procedimento de incidente.
13. **[Cons] Promover os ~20 drafts SGQ** de 0.1 a aprovado (assinaturas), fechar SOUP, cobrir IEC 62304 §6.1/§7, ativar cadência `clinical_qa_runs`.
14. **[M1] PROC-INC-001 + PROC-PMS-001** (vigilância pós-mercado) — destravam com Marco 2 (incidentes reais + 1º pagante).
15. **[Cons+Marco 4] Petição ANVISA Classe IIa + homologação RNDS + certificação ISO 13485 / SBIS-CFM** — etapa final, pós-validação clínica (Marco 2/2.5).

---

## 5. Ressalvas (honestidade metodológica)

- **Re-verificação:** os números da §2 foram re-conferidos por query direta nesta sessão (PAT, HTTP 201). Os agentes da auditoria reportaram que PATs antigos de memória estavam rotacionados — por isso a re-verificação direta foi feita aqui, e os números do banco prevalecem sobre os docs internos (que estavam stale: 144/447 → live 145/467).
- **CFM 2.454/2026:** número + DOU + vigência são web-confirmados; **os artigos específicos NÃO** — confirmar no PDF oficial do CFM antes de citar artigo-por-artigo.
- **Datas SNCR** (01/06 disponibilidade / ~set/2026 adequação): a obrigação de integração é sólida; **as datas pontuais precisam de fonte primária ANVISA**.
- **Validação ITI é jurídica, não operacional:** a conformidade PBAD AD-RB está declarada no código (lock V1.9.299); a aceitação por `validar.iti.gov.br` ainda **não foi testada**.
- **Instância de leak PII:** o *mecanismo* está confirmado no código; a *instância nominal* específica não foi re-logada aqui (PII) — re-verificar via PAT com cuidado de LGPD.
- **`clinical_reports.signature_hash`** = SHA-256 de integridade, **não** assinatura ICP. Assinar a Composition é roadmap.

---

## 6. Conclusão

O MedCannLab **não está "fora das normas"** — está **parcialmente dentro de quase todas, com base real e densa**, e **2-3 não-conformidades pontuais corrigíveis já** (leak PII, doc de risco desatualizado, placeholders de assinatura). O caminho pra "100%" é claro e tem duas velocidades: **a trilha técnica anda agora** (itens 1-9, sem depender de ninguém) e **a trilha formal destrava com o Marco 1 (CNPJ)**. A maior diferença em relação à média do setor é ter **SGQ + método autoral (AEC) + ICP-Brasil real + governança de IA não-decisional** — o que falta é majoritariamente **carimbo e documento**, não arquitetura.

> *Documento gerado por auditoria multi-agente verificada empíricamente. Não substitui parecer de consultora SaMD, RT, advogado regulatório/saúde digital, nem homologação oficial.*
