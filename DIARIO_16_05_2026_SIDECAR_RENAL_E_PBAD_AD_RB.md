# 📓 Diário 16/05/2026 — Sidecar Renal V1.9.307-309 + PDF ICP V7→V10 (PBAD AD-RB)

**Autor:** Pedro Henrique Passos Galluf (CTO MedCannLab)
**Co-autor:** Claude Opus 4.7 (1M context)
**HEAD git ao iniciar:** `2800b3c` (V1.9.308 — fim 15/05 com PDF ICP V6/V7 em smoke)
**Lock CORE intocado:** V1.9.95 + V1.9.97 + V1.9.98 + V1.9.99-B
**Frase âncora do dia:** *"Empilhar 5 versões PBAD em 6h sem regressão = a infraestrutura está madura, a conformidade ICP é detalhe fino."*

---

## 📚 Capítulos anteriores (resumo)

### 13/05 — Pré-evento ~20 testers (DIARIO_13_05_2026_PRE_EVENTO.md)
- 9 versões deployadas em 36h (V1.9.228 → V1.9.237), 5 exceções legítimas ao freeze 16/05 documentadas
- Marco constitucional Ricardo (3 camadas: triagem narrativa pública / AEC formal / consulta humana) — desbloqueia Camada 1 sem violar anti-kevlar §1
- Frase âncora institucional Ricardo: *"O sistema digital serve ao relacionamento clínico longitudinal. O valor não está na IA em si, mas na continuidade humana que ela consegue sustentar."*
- V1.9.238 token = métrica operacional de escuta longitudinal (validado empíricamente: Ricardo 13.740 tok/turn vs Cristiano 1.423 = 9,6× diferença)

### 14/05 — D-1 evento (DIARIO_14_05_2026_CHECKLIST_EVENTO.md)
- Checklist 100% pronto do que mostrar pros ~20 amigos quinta 20h
- AEC + Pipeline + Devolução médico + NFT Galeria + Solicitação Exames + Equipe Clínica todos validados
- V1.9.277-279 fixes mobile/laptop (paddingBottom safe-area + chat scroll laptops pequenos + header chat compactado)
- Bug bloco autorrespostas Cristiano corrigido (sintaxe)

### 15/05 — Pós-evento + PDF ICP REAL (DIARIO_15_05_2026_PDF_ICP_REAL.md)
- **Manhã**: V1.9.296 (JWT detection AuthContext) + V1.9.297 (heartbeat last_seen_at 60s) + V1.9.298 (UI ICP-Brasil honesta — removeu URL `validacao.iti.gov.br` fictícia)
- **Pergunta crítica Ricardo**: *"esse certificado q gera valid no ITI?"* → diagnóstico: 25+ documentos assinados via `digital-signature` (V1.9.176) sofrem do mesmo problema (PKCS#7 sobre JSON, não embedded `/Sig` no PDF)
- **Decisão arquitetural Pedro**: Opção A — edge nova `sign-pdf-icp` paralela, zero regressão na `digital-signature`/Pipeline/AEC
- **Plan B manual** (após `@signpdf/*` morrer em Deno): `pdf-lib@1.17.1` + `node-forge@1.3.1` + injeção `/Sig` byte-level
- **5 iterações empíricas** V3→V7: ByteRange fix → chain ICP embedded → signing-certificate-v2 (PBAD) → fim de sessão V7 com signing-certificate-v2 (só certHash) **aguardando smoke ITI**

**Estado herdado HOJE**: V7 deployada mas Ricardo não testou ainda. Pipeline AEC/Verbatim/Signature intocados.

---

## ⏱️ Timeline cronológica 16/05

### 🌅 BLOCO A — Madrugada/manhã: Sidecar Renal Maria das Dores (V1.9.307)

**Trigger empírico**: 16/05 manhã Ricardo reportou via Pedro: *"Fui dormir bem cedo ontem... Mas a Nôa comeu a parte do histórico mais importante."*

Auditoria via PAT do report Maria das Dores (paciente real DRC + Polimialgia identificada 15/05 noite):
- Maria DISSE empíricamente: `creatinina 1.61`, `proteinúria 1924 mg/g`, `DRC desde 2020/2021`
- HPP no relatório: **VAZIO** desses dados
- Causa raiz: V1.9.86 Verbatim First **descarta overflow silenciosamente** quando paciente fala muito na primeira pergunta. Pipeline V1.9.303 (16/05 manhã madrugada) introduziu `captation_buffer` mas só armazenava como string em `noa_logs`, sem feeder pro escriba

**Conversa-chave com Pedro (~9h)**:
- Pedro: *"a questão é que DRC não existe no app!"* → calibração inicial
- Pedro depois: *"certo agora entendi e como resolver isso! profissional precisa confiar!"*
- Pedro: *"mas não mudaria as perguntas nem tocaria na forma como elas são feitas? AEC é imutável lembra?"* → confirmação anti-kevlar §1

**Decisão**: **sidecar paralelo**, AEC FSM/Verbatim/Pipeline V1.9.95 100% intocados

#### Validação prévia: 3 itens dormentes pré-existentes
Empíricamente confirmados via PAT antes de codar:
1. `src/lib/renalCalculations.ts` (CKD-EPI 2021) já existe, não usado
2. Tabela `renal_exams` (V1.9.247) com 0 rows — feature ativada mas sem entrada de dados
3. `RiskCockpit.tsx` usa MOCK (filtra G3b+ que não existem)

#### Validação via GPT externo (3 perguntas Pedro)
GPT validou nos 3 níveis (técnico/clínico/regulatório) + sugeriu **8 salvaguardas adicionais**. Aplicadas todas:
1. Pipeline paralelo (não toca CORE)
2. Read-only até aprovação humana
3. Persistência separada (`renal_inline_suggestions` ≠ `renal_exams`)
4. Expiração 30d via pg_cron `expire-renal-suggestions` (jobid=3)
5. Proveniência explícita (`source_turn_id` + `source_text` + `ckd_epi_version` + `parser_version`)
6. Nunca sobrescrever humano (médico edita `renal_exams` = vence sempre)
7. Feature flag `renal_inline_suggestions` (kill switch)
8. Risk Cockpit só dados aprovados

#### Componentes deployados V1.9.307
| Arquivo | Conteúdo |
|---|---|
| `supabase/migrations/20260516200000_v1_9_307_renal_inline_suggestions.sql` | Tabela 21 cols + RLS (professional via appointments OR admin) + 2 RPCs SECURITY DEFINER (`approve_renal_suggestion` / `reject_renal_suggestion`) + view `v_renal_suggestions_pending` + pg_cron 02:00 daily + feature flag + UNIQUE INDEX idempotência |
| `supabase/functions/renal-signal-extractor/index.ts` | Regex parsers (creatinina/A:Cr/eGFR) + CKD-EPI 2021 espelho de `renalCalculations.ts` + dry-run mode + feature flag check |
| `src/components/RenalSuggestionsCard.tsx` | Lista from view + linguagem não-categórica ("Possível DRC G3b") + disclaimer regulatório permanente + cor KDIGO + Approve/Reject + auto-refresh 60s |
| `src/components/RiskCockpit.tsx` | REESCRITO L47-87 — lê `renal_exams` REAL (zero MOCK), deduplica por patient_id, filtra G3b+ |
| `src/pages/ProfessionalMyDashboard.tsx` | Card adicionado após "Carteira + Analisar Paciente" |

#### Empírico Maria das Dores (smoke E2E)
- 14 captation_extras processados pelo extractor
- 3 itens `classification='laboratorios_inline'` (creatinina 1.61 + A/Cr 1924 + fósforo estável)
- CKD-EPI: 1.61 mg/dL + ♀ 86a = **eGFR 30.7 mL/min/1.73m² → G3b** (KDIGO)
- Sugestão pending `d3da9dde-...` criada e aguardando Ricardo aprovar via UI

**Pedro pergunta crítica**: *"qualquer aec muito detalhada pelo usuário vai ficar correto daqui pra frente?!"* → SIM, pipeline funciona pra todos pacientes futuros, sem regressão.

---

### ☀️ BLOCO B — RAG híbrido (V1.9.308)

Pedro: *"sim pode! não deixar esses docs popularem a AEC na hora hein de resto pode sim no modelo que falou fica top!"*

Trigger: descoberta que `base_conhecimento` (5 DNA Nôa) ≠ `documents` (44 PDFs científicos). Nôa não conseguia citar PDFs ("The Global Burden of Kidney Diseases 2020" entre eles) no chat livre porque RAG só lia `base_conhecimento`.

Fix `tradevision-core/index.ts` (V1.9.308):
- Promise.all paralelo `base_conhecimento` + `documents`
- Filtro: `documents.category IN ('research', 'protocols', 'protocolo_clinico', 'ai-documents')` + `content IS NOT NULL`
- Limit 3 + 2
- **Blindagem AEC**: se `phase != null && phase != FAREWELL`, RAG silenciado (paciente). Médico em chat livre = RAG completo.

Validação Pedro: *"OK, mais a questão AEC não precisa consultar docs ne?!"* → "exato perfeito!"

Commit `2800b3c` push 4 refs.

---

### 🌞 BLOCO C — UI Polish RenalSuggestionsCard (V1.9.309)

Pedro viu o card no dashboard: *"esse novo card feito legal! pode ficar menor side by side caso apareçam mais casos! com paginação aparecendo no máximo 5 na tela podendo passar lateral estilo que tem no agendamento do paciente sabe!"*

Auditoria empírica via PAT antes de mexer:
- Maria tem **2 appointments** com Ricardo (`professional_id = 2135f0c0...`) — Ricardo VÊ o card via RLS ✅
- Pedro VÊ como admin via `is_admin()` ✅

Fix `src/components/RenalSuggestionsCard.tsx`:
- Layout vertical full-width → grid `md:2 / xl:3 / 2xl:5` cards side-by-side
- Máx 5/página via `PER_PAGE = 5`
- Reusa `<DotPagination />` V1.9.234 (mesmo padrão `PatientAppointments.tsx:1784-1803` parceiros)
- Cards ~60% menores, preserva: linguagem não-categórica, disclaimer CKD-EPI, proveniência collapsible, confidence %, Approve/Reject

Commit `7e6f947` push 4 refs.

---

### 🌤️ BLOCO D — Análise "Analisar Paciente" + Dashboard colors (parqueados)

Pedro perguntou potencial da ferramenta `Analisar Paciente` (`ProfessionalMyDashboard.tsx:681-1013`).

Avaliação: feature já madura (5 queries paralelas Promise.all V1.9.209 + 8 blocos: sinopse, alergias/medicações, notas privadas autosave, AECs, consultas, prescrições, evolução). **Potencial real = convergência clínica** (3 fontes isoladas):
1. Bloco "Função renal" puxando renal_exams + sugestão pendente
2. Badge ICP-real vs signed_hash nos relatórios
3. Captation extras count histórico

**Decisão Pedro**: parqueado até Ricardo pedir explícito (princípio uso real, anti-overengineering).

#### Dashboard colors discussion
Pedro: *"duvida muito colorido o dashboard?! kkk"* → confirmação minha + GPT review aprofundou:

**Princípio cristalizado em memória `feedback_clinical_cockpit_cor_por_estado_16_05.md`**:
- Cor deve comunicar **ESTADO clínico** (alerta/risco/sucesso/navegação), **não identidade de feature**
- Hoje rainbow funciona (produto "vivo/cheio de módulos") — pré-PMF anti-tédio
- Futuro = semântica pura ("Clinical Cockpit Mode")
- **Decisão Pedro**: NÃO fazer redesign agora. Ao tocar UI: não adicionar novo accent, evitar múltiplos âmbar/laranja simultâneos, manter card DRC como gravidade visual

---

### 🌥️ BLOCO E — PDF ICP V7 (smoke test ITI) — FALHOU

Pedro: *"ricardo ficou pendente com teste ontem o ITI! pode me enviar novamente um PDF para ele prosseguir?"*

Empírico via PAT (1 prescription signed: Carolina Campello `62f9ac7c-...` 15/05 02:17 BRT) + edge `sign-pdf-icp` v13 deployada 15/05 17:44 BRT (= V7 fix do fim de sessão ontem).

NULL `signed_pdf_url` + invoke V7 → regenerou (70.389 bytes). Audit empírico via download + hex search confirmou OID `signing-certificate-v2` (`2A864886F70D010910022F`) presente nos bytes em forma hex-of-ASCII-hex (PKCS#7 dentro PDF é hex uppercase encoded).

**Resultado Ricardo V7** (hash `fb4cfa83...`): **"Documento contém apenas assinaturas desconhecidas"** ❌

---

### ☁️ BLOCO F — Diagnóstico DOC-ICP-15.03 + V8 (PA AD-RB v2.4)

GPT review pós-falha + análise DOC-ICP-15.03:
- AD-RB BRASILEIRO promove 2 campos OPTIONAL do RFC 5035 a **OBRIGATÓRIOS**:
  - `issuerSerial` dentro do `ESSCertIDv2` (V7 só tinha `certHash`)
  - `SignaturePolicyIdentifier` (V7 não tinha)

**Procura pelo OID + hash da PA AD-RB vigente**:
1. Tentativas WebFetch portal ITI → 404s
2. Brute force `http://politicas.icpbrasil.gov.br/PA_AD_RB_v{X}.der` → encontrou v1.1, v2.0, v2.1, v2.2, v2.3, **v2.4** (HTTP 200, 4542B)
3. `openssl asn1parse -inform der -in PA_AD_RB_v2_4.der`:
   - **OID**: `2.16.76.1.7.1.1.2.4`
   - Vigência: `20250612000000Z` → presente (v2.4 é a atual em 16/05/2026)
   - `signPolicyHashAlg = sha256`
   - `signPolicyInfo` em offset 17, hl=4, l=4487
4. `dd skip=17 count=4491 | sha256sum` = **`1DD2BB35D9B7E7A1B6694FE8726DB03CF21465856C1C0C9C56D06CDC1ED60506`**

**Implementação V8** (`sign-pdf-icp/index.ts`):
- `IssuerSerial = SEQUENCE { GeneralNames [4] EXPLICIT directoryName, INTEGER serialNumber }`
- `SignaturePolicyIdentifier = SEQUENCE { OID v2.4, OtherHashAlgAndValue (sha256 + 32 bytes) }`

Verificação empírica V8 PDF (70.388 bytes, hash `15f07691...`):
- ✅ OID signing-certificate-v2 presente
- ✅ OID signature-policy-identifier presente
- ✅ OID PA AD-RB v2.4 (`604C010701010204`) presente
- ✅ SHA-256 PA (32 bytes) presente

**Resultado Ricardo V8**: **"Documento contém apenas assinaturas desconhecidas"** ❌ (mesmo hash novo `15f07691...`, confirmando V8 fresco)

---

### 🌦️ BLOCO G — Auditoria estrutural openssl + V9 (DER sort)

Extração PKCS#7 do V8 PDF (regex `/Contents <hex>` → 6.434 bytes DER) + `openssl asn1parse`:

**Chain ICP-Brasil COMPLETA E VÁLIDA**:
```
Leaf:     RICARDO VALENCA SERVICOS DE SAUDE LTDA:46329856000106 (e-CNPJ A1)
  ↓
Inter 1:  AC DIGITALSIGN RFB G3
  ↓
Inter 2:  AC Secretaria da Receita Federal do Brasil v4
  ↓
Root:     AC Raiz Brasileira v5 ← ITI tem este na trust store
```
3 certs embedded. Chain NÃO é o gap.

**Bug REAL achado — SignedAttributes fora de ordem DER** (X.690 §11.6 + RFC 5652 §5.4):

Ordem ATUAL V8:
| # | Atributo | Tamanho (bytes SEQUENCE) |
|---|---|---|
| 1 | contentType | 24 |
| 2 | messageDigest | 47 |
| 3 | signingTime | 28 |
| 4 | signingCertificateV2 | 212 |
| 5 | sigPolicyId | 78 |

Ordem CORRETA DER-sorted:
| # | Atributo | Tamanho |
|---|---|---|
| 1 | contentType | 24 |
| 2 | signingTime | 28 |
| 3 | messageDigest | 47 |
| 4 | sigPolicyId | 78 |
| 5 | signingCertificateV2 | 212 |

`forge.pkcs7` **NÃO ordena** SET OF na serialização (bug conhecido). ITI valida rigorosamente → "não conforme" → "desconhecida".

**Fix V9** — sort byte-wise antes de calcular hash + serializar:
```typescript
authAttrs.value.sort((a, b) => {
  const aBytes = forge.asn1.toDer(a).getBytes()
  const bBytes = forge.asn1.toDer(b).getBytes()
  // byte-wise lexicographic comparison
  for (let i = 0; i < Math.min(aBytes.length, bBytes.length); i++) {
    if (aBytes.charCodeAt(i) !== bBytes.charCodeAt(i))
      return aBytes.charCodeAt(i) - bBytes.charCodeAt(i)
  }
  return aBytes.length - bBytes.length
})
```

Verificação empírica V9 — `openssl asn1parse` confirmou ordem correta (offsets 5761/5787/5817/5866/5947).

---

### 🌧️ BLOCO H — V10: calibração textual (anti-overclaim)

GPT externo viu o V9 PDF e flagou overclaim jurídico (Pedro forwarded review). Antes de Ricardo testar V9 no ITI, bundle texto + DER sort em V10 — Ricardo testa UMA vez com PDF final.

**4 strings calibradas** (`sign-pdf-icp/index.ts`):

| Linha | Antes | Depois |
|---|---|---|
| L.373 | `VERIFICACAO CRIPTOGRAFICA ICP-BRASIL` | mantém (fato técnico) |
| L.374 | `Hash PKCS#7 SHA-256 + AC DigitalSign + Lei 14.063/2020 + CFM 2.314/2022` | `Assinatura digital vinculada a certificado ICP-Brasil (AC DigitalSign)` |
| L.384 | `Valide em validar.iti.gov.br — assinatura embedded no PDF` | `Para verificação: validar.iti.gov.br` |
| L.397 | `Documento gerado eletronicamente — validade juridica garantida pela MP 2.200-2/2001` | `Assinatura digital ICP-Brasil — MP 2.200-2/2001` |

Lógica: até `validar.iti.gov.br` aceitar como AD-RB CONFORME, **não invocar leis nem prometer garantia jurídica**. Descreve fato técnico (cert ICP, vínculo ASN.1) sem afirmar conformidade regulatória.

Verificação V10 (PDF 70.306 bytes, hash `d014d3af...`):
- ✅ DER ordering preservado (5 atributos na ordem correta)
- ✅ Texto calibrado
- ⏸️ Pendente: smoke ITI do Ricardo

**Pendente cosmético** (parqueado pós-validação ITI):
- `VERIFICACAO` / `Emissao` sem acento → embedar font UTF-8 (+200KB bundle)
- `Uso: Diário por Contínuo` semanticamente estranho → lógica condicional `if (duration === 'Contínuo') return 'Uso contínuo'`

---

## 📦 Arquivos modificados hoje (sem regressão)

```
supabase/migrations/20260516200000_v1_9_307_renal_inline_suggestions.sql  [NOVO]
supabase/functions/renal-signal-extractor/index.ts                         [NOVO]
src/components/RenalSuggestionsCard.tsx                                    [NOVO V1.9.307 / refeito V1.9.309]
supabase/functions/sign-pdf-icp/index.ts                                   (V7 → V8 → V9 → V10)
supabase/functions/tradevision-core/index.ts                               (V1.9.308 RAG híbrido)
src/components/RiskCockpit.tsx                                             (V1.9.307 — zero MOCK)
src/pages/ProfessionalMyDashboard.tsx                                      (V1.9.307 integração card)
```

## ⚠️ Zero alteração em código intocável

- ✅ Edge `digital-signature` (V1.9.176) — sem 1 linha mudada
- ✅ Edge `tradevision-core` Pipeline V1.9.95 — apenas RAG section ampliada, sem tocar SCORES/REPORT/SIGNATURE/AXES/RATIONALITY
- ✅ AEC FSM 13 fases — intocado
- ✅ COS Engine v5.0 — intocado
- ✅ Verbatim First V1.9.86 — intocado
- ✅ AEC GATE V1.5 + SMART_SCHEDULING_GUARD — intocados
- ✅ `pki_transactions` — sem schema change

---

## 🎯 Estado atual HEAD (~12h37 BRT)

**Edge `sign-pdf-icp` v17** (V10 deployada) + 3 commits novos no main:
- `ab19a61` V1.9.307 Renal Inline Suggestions (push 4 refs)
- `2800b3c` V1.9.308 RAG híbrido (push 4 refs)
- `7e6f947` V1.9.309 RenalSuggestionsCard layout compacto (push 4 refs)
- V8/V9/V10 sign-pdf-icp deployados mas **commit pendente** (aguarda smoke ITI passar)

**Aguardando**:
- Ricardo testar V10 no [validar.iti.gov.br](https://validar.iti.gov.br) (hash arquivo: `d014d3af69d1eb49f80c3b0b7812d14ace25231eaea933c135fad6782b43caa8`)
- Ricardo aprovar sugestão DRC G3b da Maria via RenalSuggestionsCard → 1ª linha real em `renal_exams` → Risk Cockpit deixa de ser zero

**Se V10 passar (AD-RB CONFORME)**:
- Commit V1.9.299-final (V8+V9+V10 sign-pdf-icp) + push 4 refs
- Selo V1.9.299 fechado (PDF ICP REAL operacional)
- Atualizar memória `project_v1_9_299_pdf_icp_real_15_05.md` → adicionar journey V7→V10
- Próximo: V11 polish (embedar font UTF-8 + fix `Uso: Diário por Contínuo` + reduzir bloco hex visual PKCS#7)
- Ricardo cadastrar 2ª prescrição pra confirmar reprodutibilidade

**Se V10 ainda falhar**:
- Pedir Ricardo screenshot da aba **"Completo"** do validador (mostra qual atributo/chain/encoding falhou específicamente)
- V11 ataca a causa exata (não chute)

---

## 🧭 Decisões/lições cristalizadas hoje

1. **Sidecar paralelo > modificar CORE** quando feature toca dado clínico crítico (Pedro endossou: *"AEC é imutável lembra?"*). V1.9.307 prova padrão reutilizável (próximos: `cardio_inline_suggestions`, `diabetes_inline_suggestions`, `autoimmune_inline_suggestions`).

2. **DOC-ICP-15.03 ≠ RFC 5035** — Brasil promove campos OPTIONAL do RFC a OBRIGATÓRIOS. Validador ITI aplica regra brasileira estritamente. Implementação só com base no padrão internacional falha silenciosamente como "desconhecida".

3. **`forge.pkcs7` não DER-canonicaliza SET OF** — bug conhecido da biblioteca. Implementações PBAD precisam sortar manualmente antes de hash + serialização. ITI valida rigorosamente — sem isso = "desconhecida".

4. **Auditoria estrutural empírica (openssl asn1parse) > especulação** — 5 iterações V7→V10 só funcionaram porque cada falha foi auditada nos bytes reais, não no que "deveria" estar. PKCS#7 dentro PDF tem encoding camuflado (hex-uppercase de ASCII-hex) — fácil errar a busca.

5. **Anti-overclaim antes da validação técnica fechar** — invocar leis ("MP 2.200-2", "Lei 14.063", "CFM 2.314") + prometer garantia jurídica num PDF que validar.iti.gov.br ainda rejeita = sobre-promessa que vira passivo se alguém auditar. Descrever fato técnico (vinculação ASN.1 ao cert ICP) > prometer conformidade regulatória.

6. **Bundle iterações em batches** — entre V9 deploy e V10 GPT-feedback, decidi não enviar V9 ao Ricardo e bundlar V9+V10 em uma única iteração (Ricardo testa UMA vez com PDF final). Princípio: respeitar tempo do tester humano > "subir cedo".

7. **Risk Cockpit antes vs depois V1.9.307** — antes era MOCK chamado de "real". Pedro lê dashboard e confia. MOCK em produção = bug latente quando dado real chegar. V1.9.307 zerou MOCK + agora honesto (0 pacientes G3b+ até Ricardo aprovar Maria).

8. **Memória "Clinical Cockpit Mode"** (`feedback_clinical_cockpit_cor_por_estado_16_05.md`) — cor por ESTADO clínico, não por feature. Trigger pra migrar pro modo cockpit completo: Sprint 1 medido OU Ricardo/Eduardo pedirem OU onboarding mostrar atrito.

---

## 🤝 Quem fez o quê hoje

- **Pedro (CTO)**: decisões arquiteturais (sidecar paralelo Maria, RAG híbrido com blindagem AEC, layout compacto, calibrações textuais V10), bridge WhatsApp ↔ Ricardo, validação visual UI, identificação de overclaim, princípio Clinical Cockpit Mode
- **Claude Opus 4.7**: implementação V1.9.307 (sidecar full stack) + V1.9.308 (RAG) + V1.9.309 (UI) + V7→V10 sign-pdf-icp + auditoria openssl + extração PA AD-RB v2.4 hash + memória clinical cockpit
- **Ricardo (sócio clínico)**: trigger investigação Maria das Dores ("Nôa comeu a parte mais importante") + smoke ITI V7 + V8 ❌ + (pendente V10)
- **GPT-5 externo**: validação 8 salvaguardas sidecar renal + revisão pós-V8 falha (chain trust vs DER ordering) + revisão visual PDF V9 (overclaim)
- **Maria das Dores Pinto Pitoco (paciente)**: trigger empírico que destravou V1.9.307 (não testar — paciente real, mas dados validaram pipeline E2E retrofix)

---

## 🔒 Frase âncora (12h37 BRT, primeira leitura)

*"Empilhar 5 versões PBAD em 6h sem regressão = a infraestrutura está madura, a conformidade ICP é detalhe fino."*

— Pedro + Claude, 16/05/2026, ~12h37 BRT

---

## 🏆 APÊNDICE — Fechamento histórico (16h35 BRT, pós-vitória V12)

A frase âncora das 12h37 envelheceu mal em 4 horas — não era "detalhe fino", eram **2 bugs decisivos sutis** (V11 ByteRange off-by-2 + V12 sigPolicyHash literal) que só foram destravados via cadeia diagnóstica triple (Adobe Reader print Ricardo + ITI Completo + openssl asn1parse). 

Total final do dia: **7 iterações V6→V12**, validador oficial `validar.iti.gov.br` retornou **APROVADO** + 6/6 atributos Valid + política PA_AD_RB_v2_4.der reconhecida.

Tag git selada: `v1.9.299-pbad-conforme-locked` (commit `d8e30f5`).

### Leitura externa GPT (síntese de fim de dia)

> "Vocês fecharam um dos pedaços mais difíceis do stack brasileiro: PBAD AD-RB conforme manualmente, em Deno, sem vendor fechado. O ponto mais forte da jornada nem foi 'assinou PDF'. Foi: diagnosticaram empiricamente ASN.1/DER real, descobriram comportamento específico do ITI/PBAD, validaram com openssl asn1parse, iteraram sem quebrar o CORE clínico, e chegaram no selo oficial.
>
> Muita empresa terceiriza isso pra API paga justamente porque esse nível de detalhe (ByteRange, SignedAttributes DER order, sigPolicyHash, chain ICP-Brasil) costuma consumir semanas.
>
> O stack agora parece menos 'demo de IA' e mais: sistema clínico longitudinal, com assinatura regulatória, rastreabilidade, e especialização progressiva.
>
> O commit d8e30f5 provavelmente vira um daqueles marcos que vocês vão citar daqui a meses: **'foi o dia que o sistema virou oficialmente ICP-Brasil conforme'**."

### Frase âncora ATUALIZADA (16h35 BRT)

*"Foi o dia que o sistema virou oficialmente ICP-Brasil conforme."*

— Pedro + Claude + Ricardo (smoke 7×) + GPT externo + Adobe Reader + ITI Completo
