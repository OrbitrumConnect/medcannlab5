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

### 🎨 BLOCO I — V1.9.310-A: Clinical Cockpit cores no dashboard professional (~12h-13h)

Pedro printou o dashboard professional + perguntou *"duvida muito colorido o dashboard?! kkk"*. GPT externo aprofundou diagnóstico: cor por **estado clínico**, não por **identidade de feature**. Princípio cristalizado em memória + aplicação concreta.

**Linha "O que você quer fazer agora?"** tinha 6 botões em 6 cores fortes competindo (emerald/purple/blue/cyan/indigo/amber). Reduzido pra:
- **Ver Agenda** = emerald (ação primária do dia, sem `animate-pulse` nem glow)
- **4 ações secundárias** (Relatórios, Nova Prescrição, Chat Equipe, Meus Pacientes) = slate neutro + ícone emerald sutil
- **Cann Matrix** = amber suave (único accent contextual — fórum entre médicos, natureza diferente)
- **Card DRC laranja preservado** como gravidade visual única do dashboard (memória renal V1.9.307)

Type-check clean. Commit `25eed9b` push 4 refs.

**Decisão Pedro**: NÃO fazer redesign agora. Ao tocar UI futura: não adicionar novo accent, evitar múltiplos âmbar/laranja simultâneos.

---

### 🎨 BLOCO J — V1.9.310-B: Clinical Cockpit aluno + paciente (~13h)

Pedro screenshot do dashboard **Aluno** mostrou mesmo padrão arco-íris (6 botões = 6 cores: emerald/azul/roxo/cyan/âmbar/violeta). Aplicado mesmo princípio nos 2 dashboards restantes:

**AlunoDashboard.tsx:**
- **Estudar Curso** = emerald (ação primária)
- 4 neutros (Simulação Clínica / Teste Nivelamento / Biblioteca / Meu Perfil) = slate + ícone emerald
- **Fórum Aluno** = amber suave (único accent — comunidade vs estudo)

**PatientHeaderActions.tsx:**
- **Agendar Consulta** = emerald (ação primária — sem glow/pulse)
- 4 neutros (Enviar Médico / Iniciar Avaliação / Canal Atendimento / Vincular Médico) = slate + ícone emerald
- **WhatsApp** mantém verde marca `#25D366` (convenção universal reconhecível, análogo ao Cann Matrix/Fórum)

Coerência completa Clinical Cockpit nos **3 dashboards**. Commit `e56b321` push 4 refs.

| Dashboard | Ação primária (emerald) | Accent único | Cores neutralizadas |
|---|---|---|---|
| Professional | Ver Agenda | Cann Matrix amber | purple/blue/cyan/indigo → slate |
| Aluno | Estudar Curso | Fórum amber | blue/purple/cyan/indigo → slate |
| Paciente | Agendar Consulta | WhatsApp verde marca | blue/blue/emerald/purple/indigo → slate |

---

### 🎨 BLOCO K — V1.9.311: NFT Consent Pattern (B-lite) + Galeria Clínica médico (~13h-14h)

**Trigger**: Pedro perguntou se existe trigger pra paciente compartilhar NFT com profissional + galeria do médico mostrando NFTs liberados. Audit empírico via PAT mostrou:
- Tabela `patient_nfts` existe (V1.9.193, 33 NFTs hoje)
- RLS antiga: médico vinculado via report-pai acessa AUTOMÁTICO (acesso implícito)
- NÃO existia: `nft_shares`, RPCs, `ProfessionalNFTGallery`, UI de consent

Mesmo padrão do `RenalSuggestionsCard` ANTES de 16/05 manhã: dado + RLS existem, mas sem UI no profissional → bug "invisível".

**3 iterações GPT review** convergiram em **B-lite** (consent explícito por peça, alinhado com referral consent V1.9.275):

#### Migration `20260516220000_v1_9_311_nft_consent.sql`
```sql
ALTER TABLE patient_nfts
  ADD COLUMN shared_with_professional bool DEFAULT false NOT NULL,
  ADD COLUMN shared_at timestamptz,
  ADD COLUMN shared_by uuid REFERENCES auth.users(id);

DROP POLICY "Professional sees patient NFTs via clinical reports";
CREATE POLICY "Professional sees only patient-shared NFTs"
  USING (shared_with_professional = true AND EXISTS (...));
CREATE POLICY "Patient toggles share on own NFTs" FOR UPDATE
  USING (auth.uid() = patient_id);
```

#### 5 cenários empíricos via PAT (todos passaram)
| # | Cenário | Esperado | Real |
|---|---|---|---|
| 1 | Paciente Cristiano vê próprios | 4 | **4** ✅ |
| 2 | Ricardo SEM consent | 0 | **0** ✅ |
| 3 | Toggle libera 1 NFT | ok | **ok** ✅ |
| 4 | Ricardo APÓS consent | 1 | **1** ✅ |
| 5 | Admin (Pedro) vê tudo | 30 | **30** ✅ |
| 6 | Revert toggle → Ricardo volta a 0 | 0 | **0** ✅ |

#### Componentes
- **`PatientNFTGallery.tsx`** editado: copy header honesta (`X/Y ancoradas criptograficamente`) + 2 badges card factuais (verde signature / âmbar sem ancoragem) + badge cyan se shared + toggle "Permitir visualização clínica" no modal
- **`ProfessionalNFTGallery.tsx`** NOVO (~370 linhas, read-only): paciente_name SEMPRE visível no card + bloco "Contexto Clínico" via JOIN `clinical_reports.content` (queixa principal + completude + data)

**Decisão Pedro Opção A** (admin = back office padrão SaaS): 5 admins continuam vendo tudo via policy `Admin sees all NFTs`. LGPD coberto via Termos.

Commit `83f5307` push 4 refs.

---

### 🐛 BLOCO L — V1.9.311-B: Fix Galeria plugada no Terminal CORRETO (~14h)

Pedro testou e: *"ok mas não vejo no Terminal de Atendimento do profissional a aba NFT pacientes"*.

**Bug encontrado**: pluguei a aba em `ClinicalTerminal.tsx` que é **componente órfão** (só importa a si mesmo, nada renderiza). A rota real `?section=terminal-clinico` no `ProfessionalMyDashboard.tsx:633-647` renderiza `IntegratedWorkstation`, NÃO `ClinicalTerminal`. Naming colisão (`ClinicalTerminal` vs `IntegratedWorkstation` — ambos com "Terminal" no contexto).

**Fix:**
- Aba `gallery` (Sparkles purple, grupo `governanca`) movida pra `IntegratedWorkstation` allTabs
- `case 'gallery'` renderiza `<ProfessionalNFTGallery />`
- Filtro tab válido em `ProfessionalMyDashboard:637` atualizado (deep link `?tab=gallery`)
- ClinicalTerminal.tsx revertido (mantém órfão)

**Lição operacional cristalizada**: antes de plugar aba em "Terminal X", verificar empíricamente qual componente a rota renderiza — naming colisão é fácil em apps com múltiplos "Terminal".

Commit `6c77cf0` push 4 refs.

---

### 📡 BLOCO M — V1.9.312: System Activity Timeline (radar admin, ~14h-15h)

Pedro pediu: *"abaixo de onde aparece os usuários posso ver a log do que foi completado por eles ou onde bugou? criar algo assim? legal?"*

**Audit empírico via PAT antes de codar** revelou MUITA infraestrutura pronta:
- **15 tabelas** de log/event/audit (`noa_logs` 3858 logs em 8 dias + `user_activity_logs` + `user_lifecycle_logs` + `noa_interaction_logs` + `ai_chat_interactions` + `scheduling_audit_log` + `institutional_trauma_log` + `video_call_quality_logs` + 7 outras)
- **5 RPCs admin**: `admin_get_users_activity_summary` + `admin_get_users_status` + `get_recent_audit_logs` + `log_aec_state_anomaly` + `log_institutional_trauma`

**Decisão GPT-review**: caminho (B) timeline unificado vs (A) drill-down individual. Pré-PMF com 45 users / 2-5 ativos/dia, "sentir pulso do sistema" > "investigar caso individual". Drill-down parqueado pra pós-PMF.

#### Componente `SystemActivityTimeline.tsx` NOVO (~321 linhas)
Reaproveita 3 fontes via Promise.all (sem migration):
- `get_recent_audit_logs` (ai_chat_interactions com risk_level)
- `noa_logs` filtrado `user_id IS NOT NULL` (exclui cron sweeps tipo `video_call_reminders_sweep`)
- `cfm_prescriptions` signed (atos clínicos médicos)

**Aplicação Clinical Cockpit Mode à timeline** (cores por ESTADO):
- error/risk HIGH → vermelho
- warning → âmbar
- success (ICP/prescrição) → emerald
- info (AEC normal) → azul discreto
- neutral → slate

4 filtros (GPT review): Todos / Clínico / Sistema / Risco. Auto-refresh 30s. Cap 30 eventos.

Smoke empírico via PAT: AECs Maria das Dores (CONSENT_COLLECTION, FINAL_RECOMMENDATION) ✅ + 5 prescrições Ricardo→Carolina/Pedro ✅.

Plugada `<SystemActivityTimeline />` embaixo da "Base de Usuários Unificada" em `ClinicalGovernanceAdmin.tsx`. Commit `11a1d6c` push 4 refs.

---

### 🔧 BLOCO N — V11: Fix off-by-2 ByteRange (~16h, descoberta via Adobe Reader)

Ricardo testou V10 no validar.iti.gov.br — mesma resposta "desconhecida". Pedi Ricardo testar **Adobe Reader gratuito** como diagnóstico complementar. Print do Ricardo mostrou:

> *"Há erros na formatação ou nas informações contidas nesta assinatura (informações de suporte: **SigDict /Contents illegal data**)"*

**Diagnóstico via inspeção byte-level do PDF V10:**
```
ByteRange declarado: [0, 4102, 69638, 668] → gap 65536 bytes excluídos
< position empírico: 4101 (1 byte ANTES do declarado)
> position empírico: 69638 (1 byte DEPOIS do declarado)
Gap real <HEX>: 65538 bytes (INCLUINDO delimitadores)
→ Off-by-2 confirmado: < e > sendo INCLUÍDOS no hash assinado
→ 2 hex chars adjacentes do PKCS#7 sendo EXCLUÍDOS
→ Hash recalculado NÃO BATE com messageDigest interno
```

**Causa raiz histórica**: bug existia desde V6 (15/05 tarde) — comentário no código original dizia `"até e incluindo '<'"` deliberadamente. PDF Reference §12.8.1: ByteRange exclui `/Contents <HEX>` INTEIRO INCLUSIVE delimitadores.

**Por que demorou 5 versões pra detectar**: V7→V10 estavam consertando o PKCS#7 INTERNO perfeitamente. Bug estava no ENVELOPE EXTERNO. Adobe foi mais loquaz que ITI.

**Fix V11** (2 linhas):
```typescript
// Antes (errado):
const byteRangeLength1 = contentsStart + 1  // incluía '<'
const byteRangeStart2 = contentsEnd - 1     // incluía '>'

// Depois (correto):
const byteRangeLength1 = contentsStart      // bytes ANTES de '<'
const byteRangeStart2 = contentsEnd         // bytes A PARTIR DE depois de '>'
```

**Verificação empírica V11**:
| Check | Esperado | Real |
|---|---|---|
| Range 1 end | posição `<` (4100) | **4100** ✅ |
| Range 2 start | posição `>` + 1 (69638) | **69638** ✅ |
| Range 2 end | total bytes (70305) | **70305** ✅ |
| Gap excluído | 65538 bytes | **65538** ✅ |

**Resultado Ricardo V11 ITI:**
- Antes (V10): "Assinatura desconhecida" (ITI nem reconhecia)
- Agora (V11): **"Assinatura reprovada — problemas com atributos"** — **AVANÇO GIGANTE** ITI agora reconhece estrutura, ancorou cadeia, validou política PA AD-RB v2.4

Mais ainda — Adobe disse:
> ✅ *"O documento não foi modificado desde que esta assinatura foi aplicada"* — **HASH BATE pela primeira vez em 6 versões**

---

### 🎯 BLOCO O — V12: sigPolicyHash literal (~16h35, descoberta via ITI Completo)

Aba **Completo** do ITI mostrou diagnóstico cirúrgico:
```
Atributos obrigatórios: Reprovados
✅ IdMessageDigest               Valid
✅ IdContentType                 Valid
❌ IdAaEtsSigPolicyId            INVALID
   "Falha ao construir o atributo. O valor do resumo criptográfico
    não é equivalente ao esperado."
✅ IdAaSigningCertificateV2      Valid
✅ SignatureDictionary           Valid
✅ IdSigningTime                 Valid
```

**1 atributo específico errado**: `signature-policy-identifier` (V8) com **hash da política errado**.

**Audit empírico DER da PA**:
```bash
openssl asn1parse -inform der -in PA_AD_RB_v2_4.der | tail -1
# => 4508:d=1 hl=2 l=32 prim: OCTET STRING [HEX DUMP]:1F3C904C44C392FEEF447E21FAA7A04E85D9C0153346320F557B7042AF5DCF13
```

**Interpretação errada em V8**: calculava SHA-256 do `SignPolicyInfo` (`1DD2BB35...`). **Correto**: RFC 3125 §5.8.1 declara `signPolicyHash OPTIONAL OCTET STRING` DENTRO da própria PA — usar o **VALOR LITERAL** declarado.

**Fix V12** (1 hex string):
```typescript
// Antes (calculado, errado):
const PA_AD_RB_V24_SIGPOLICYHASH_HEX = '1DD2BB35D9B7E7A1B6694FE8726DB03CF21465856C1C0C9C56D06CDC1ED60506'

// Depois (literal do OCTET STRING declarado na PA):
const PA_AD_RB_V24_SIGPOLICYHASH_HEX = '1F3C904C44C392FEEF447E21FAA7A04E85D9C0153346320F557B7042AF5DCF13'
```

**🏆 Resultado Ricardo V12 ITI** (hash arquivo `ca34d4ef...`):
```
Status de assinatura: APROVADO ✅
Caminho de certificação: Valid ✅
Estrutura: Em conformidade com o padrão ✅
Cifra assimétrica: Aprovada ✅
Resumo criptográfico: true ✅
Atributos obrigatórios: APROVADOS ✅
Política de assinatura: PA_AD_RB_v2_4.der ✅

6/6 atributos individuais Valid:
- IdMessageDigest ✅
- IdContentType ✅
- IdAaEtsSigPolicyId ✅  ← AGORA
- IdAaSigningCertificateV2 ✅
- SignatureDictionary ✅
- IdSigningTime ✅
```

**Commit V1.9.299-final** `d8e30f5` (unificado V8/V9/V10/V11/V12) push 4 refs.

---

### 🔒 BLOCO P — Selo + cadeado V1.9.299 (~17h BRT)

Pedro pediu cadear formal pra não mexer. 4 camadas de proteção ativadas:

1. **Tag git anotada** `v1.9.299-pbad-conforme-locked` apontando commit `d8e30f5`, pushed nas 2 remotes
2. **CLAUDE.md atualizado** — Lock canônico passa de `V1.9.95+97+98+99-B` pra `+V1.9.299` + bloco "⚠️ NÃO TOCAR" listando arquivos/constants intocáveis do edge
3. **Memória `feedback_lock_v1_9_299_pbad_nao_tocar_16_05.md`** — regra operacional + checklist 5 passos obrigatório antes de qualquer mudança (backup empírico / diff binário / smoke ITI completo / Adobe cross-check / só commit se ambos passarem)
4. **MEMORY.md indexado** — próxima sessão (qualquer Claude novo) lê primeiro

Commit `9214927` (CLAUDE.md) + commit `9c6a070` (diário apêndice histórico) push 4 refs.

**Tags git canônicas agora:**
```
v1.9.95-lock-aec-relatorio-agendamento    (CORE clínico)
v1.9.99-resend-prod-locked                (email prod)
v1.9.113-locked                           (Analisar Paciente)
v1.9.299-pbad-conforme-locked             ← novo, atual 🏆
```

---

## 📦 Arquivos modificados hoje (sem regressão)

**Manhã/início tarde:**
```
supabase/migrations/20260516200000_v1_9_307_renal_inline_suggestions.sql  [NOVO]
supabase/functions/renal-signal-extractor/index.ts                         [NOVO]
src/components/RenalSuggestionsCard.tsx                                    [NOVO V1.9.307 / refeito V1.9.309]
supabase/functions/tradevision-core/index.ts                               (V1.9.308 RAG híbrido)
src/components/RiskCockpit.tsx                                             (V1.9.307 — zero MOCK)
src/pages/ProfessionalMyDashboard.tsx                                      (V1.9.307 integração card + V1.9.310-A cores)
```

**Tarde (Clinical Cockpit + NFT consent + Timeline + V12 final):**
```
src/pages/AlunoDashboard.tsx                                               (V1.9.310-B cores aluno)
src/components/PatientHeaderActions.tsx                                    (V1.9.310-B cores paciente)
supabase/migrations/20260516220000_v1_9_311_nft_consent.sql               [NOVO V1.9.311]
src/components/PatientNFTGallery.tsx                                       (V1.9.311 toggle + 2 badges + copy honesta)
src/components/ProfessionalNFTGallery.tsx                                  [NOVO ~370 linhas V1.9.311]
src/components/IntegratedWorkstation.tsx                                   (V1.9.311-B aba gallery plugada)
src/components/SystemActivityTimeline.tsx                                  [NOVO ~321 linhas V1.9.312]
src/pages/ClinicalGovernanceAdmin.tsx                                      (V1.9.312 plug timeline)
supabase/functions/sign-pdf-icp/index.ts                                   (V7 → V8 → V9 → V10 → V11 → V12 final ✅)
CLAUDE.md                                                                  (selo Lock V1.9.299)
DIARIO_16_05_2026_SIDECAR_RENAL_E_PBAD_AD_RB.md                            (este — apêndice fechamento + blocos I→P)
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

## 🎯 Estado final HEAD (~17h BRT)

**12 commits no main hoje** (todos push 4 refs amigo+medcannlab5 × main+master):

| Commit | Versão | Conteúdo |
|---|---|---|
| `ab19a61` | V1.9.307 | Sidecar Renal (renal-signal-extractor + tabela + RPCs + UI Maria DRC) |
| `2800b3c` | V1.9.308 | RAG híbrido (base_conhecimento + documents + blindagem AEC) |
| `7e6f947` | V1.9.309 | RenalSuggestionsCard layout compacto + DotPagination |
| `9ff7682` | docs | Diário 16/05 corpo inicial (12h37) |
| `25eed9b` | V1.9.310-A | Clinical Cockpit cores professional dashboard |
| `e56b321` | V1.9.310-B | Clinical Cockpit cores aluno + paciente |
| `83f5307` | V1.9.311 | NFT Consent Pattern + ProfessionalNFTGallery |
| `6c77cf0` | V1.9.311-B | Fix Galeria Clínica plugada no IntegratedWorkstation correto |
| `11a1d6c` | V1.9.312 | System Activity Timeline (radar admin) |
| **`d8e30f5`** | **V1.9.299-final** | **🏆 PBAD AD-RB CONFORME validado ITI** |
| `9214927` | docs | CLAUDE.md selo Lock V1.9.299 + ⚠️ NÃO TOCAR |
| `9c6a070` | docs | Diário apêndice fechamento histórico |

**Tag git nova**: `v1.9.299-pbad-conforme-locked` apontando `d8e30f5` (pushed nas 2 remotes).

**Edge `sign-pdf-icp` v18+** (V12 final) deployada + APROVADA oficialmente em validar.iti.gov.br.

**8 memórias novas indexadas em MEMORY.md**:
1. `project_v1_9_307_renal_inline_suggestions_16_05.md`
2. `feedback_clinical_cockpit_cor_por_estado_16_05.md`
3. `feedback_linguagem_estado_real_nao_identidade_16_05.md`
4. `project_v1_9_311_nft_consent_pattern_16_05.md`
5. `project_drift_nefro_cannabis_16_05.md`
6. ~~`project_pbad_v10_aguardando_completo_iti_16_05.md`~~ (SUPERSEDED)
7. 🏆 `project_v1_9_299_pbad_ad_rb_conforme_16_05.md`
8. 🔒 `feedback_lock_v1_9_299_pbad_nao_tocar_16_05.md`

**Pendentes (próxima sessão / próximos dias)**:
- Ricardo aprovar sugestão DRC G3b da Maria via RenalSuggestionsCard → 1ª linha real em `renal_exams` → Risk Cockpit deixa de ser zero
- **V1.9.300** próximo natural: integração frontend (botão "Baixar PDF assinado ICP-Brasil" no widget, usa coluna `signed_pdf_url`)
- **V1.9.301** próximo natural: trigger automático pós-signing (frontend chama `sign-pdf-icp` em background após `digital-signature` retornar success)
- V11 polish (embedar font UTF-8 pra acentos + fix `Uso: Diário por Contínuo` + reduzir bloco hex visual PKCS#7) — opcional

---

## 🧭 Decisões/lições cristalizadas hoje (14 princípios)

### Da manhã/início tarde (V1.9.307-310)

1. **Sidecar paralelo > modificar CORE** quando feature toca dado clínico crítico (Pedro endossou: *"AEC é imutável lembra?"*). V1.9.307 prova padrão reutilizável (próximos: `cardio_inline_suggestions`, `diabetes_inline_suggestions`, `autoimmune_inline_suggestions`).

2. **Risk Cockpit antes vs depois V1.9.307** — antes era MOCK chamado de "real". Pedro lê dashboard e confia. MOCK em produção = bug latente quando dado real chegar. V1.9.307 zerou MOCK + agora honesto (0 pacientes G3b+ até Ricardo aprovar Maria).

3. **Clinical Cockpit Mode** (memória `feedback_clinical_cockpit_cor_por_estado_16_05.md`) — cor por ESTADO clínico, não por feature. Trigger pra migrar pro modo cockpit completo: Sprint 1 medido OU Ricardo/Eduardo pedirem OU onboarding mostrar atrito.

4. **Linguagem comunica estado real, não identidade** (memória `feedback_linguagem_estado_real_nao_identidade_16_05.md`) — extensão Clinical Cockpit pra COPY. Mostrar "X/Y atendem" > "TODOS atendem". Aplicado V1.9.310 PDF + V1.9.311 NFT Gallery copy. Anti-overclaim regulatório.

### Do meio tarde (V1.9.311-312)

5. **B-lite consent pattern** (memória `project_v1_9_311_nft_consent_pattern_16_05.md`) — paciente libera artefato simbólico peça-a-peça via toggle, vs acesso automático via report-pai. Alinhado com referral consent V1.9.275. Default conservador (`false`) = mais fácil abrir depois do que retirar privacidade.

6. **Naming colisão em componentes Terminal** (lição V1.9.311-B) — antes de plugar feature em "Terminal X", verificar empíricamente qual componente a rota renderiza. ClinicalTerminal (órfão) ≠ IntegratedWorkstation (vivo) — ambos com "Terminal" no contexto. Bug consumiu 1 ciclo Pedro pra detectar.

7. **Audit empírico ANTES de codar** (V1.9.312 timeline) — descobriu 15 tabelas log + 5 RPCs admin já prontas no banco antes de inventar feature nova. Reaproveitamento via Promise.all client-side > migration nova. Princípio: backend frequentemente já tem 80% do que parece "feature nova".

8. **Drift NefroCannabis cristalizado** (memória `project_drift_nefro_cannabis_16_05.md`) — auditoria 22 sinais empíricos: 10 nefro / 7 cannabis / 5 híbridos. Produto está em "infraestrutura clínica geral + validação profunda em NefroCannabis". Vertical-first é trajetória clássica de produtos clínicos sérios, não fraqueza.

### Da tarde PBAD AD-RB (V1.9.299 V6→V12)

9. **DOC-ICP-15.03 ≠ RFC 5035** — Brasil promove campos OPTIONAL do RFC a OBRIGATÓRIOS. Validador ITI aplica regra brasileira estritamente. Implementação só com base no padrão internacional falha silenciosamente como "desconhecida".

10. **`forge.pkcs7` não DER-canonicaliza SET OF** — bug conhecido da biblioteca. Implementações PBAD precisam sortar manualmente antes de hash + serialização. ITI valida rigorosamente — sem isso = "desconhecida".

11. **Auditoria estrutural empírica (openssl asn1parse + Adobe Reader) > especulação** — 7 iterações V6→V12 só funcionaram porque cada falha foi auditada nos bytes reais. PKCS#7 dentro PDF tem encoding camuflado (hex-uppercase de ASCII-hex). Adobe Reader foi mais loquaz que ITI no diagnóstico crítico ("SigDict /Contents illegal data" destravou V11).

12. **Hash literal vs calculado** (lição V12) — RFCs frequentemente deixam OPTIONAL o que padrão regulatório brasileiro promove a OBRIGATÓRIO. Sempre verificar se valor existe **declarado** no artefato regulatório (PA, certificate extension) antes de calcular externamente. RFC 3125 `signPolicyHash OPTIONAL OCTET STRING` declara internamente — usar valor literal, não calcular.

13. **5 iterações com mesmo erro vago = parar técnico** (princípio cristalizado às 15h pré-V11) — buscar diagnóstico explícito antes de continuar. Disciplina anti-chute economizou ciclos quando produção ITI quebrou na tarde. Pedro endossou: *"a decisão de parar de chutar até ver o Completo está correta"*.

14. **Anti-overclaim antes da validação técnica fechar** (V10) — invocar leis ("MP 2.200-2", "Lei 14.063", "CFM 2.314") + prometer garantia jurídica num PDF que validar.iti.gov.br ainda rejeita = sobre-promessa que vira passivo se alguém auditar. Descrever fato técnico (vinculação ASN.1 ao cert ICP) > prometer conformidade regulatória.

---

## 🤝 Quem fez o quê hoje

- **Pedro (CTO)**: orquestração completa do dia, decisões arquiteturais (sidecar paralelo Maria, RAG híbrido com blindagem AEC, layout compacto, calibrações textuais V10, B-lite consent NFT, timeline (B) > drill-down (A), Opção A admin = back office), bridge WhatsApp ↔ Ricardo, validação visual UI, identificação de overclaim, princípio Clinical Cockpit Mode, **disciplina anti-chute às 15h** (recusou V11 sem diagnóstico), pediu o Completo do Ricardo, conseguiu o print do Adobe que destravou tudo, autorizou cadeado V1.9.299 final
- **Claude Opus 4.7**: implementação técnica V1.9.307→V1.9.312 (sidecar renal full stack + RAG + UI compacta + Clinical Cockpit nos 3 dashboards + NFT consent migration+UI dupla + System Activity Timeline + 7 iterações sign-pdf-icp V6→V12) + auditoria empírica openssl asn1parse + extração PA AD-RB v2.4 hash (V8 errado + V12 correto literal) + descoberta bug ByteRange off-by-2 + 8 memórias documentando jornada + fechamento cadeado
- **Ricardo (sócio clínico)**: smoke ITI 7 versões (V5→V12) via WhatsApp, sem reclamar; print do Adobe Reader (V11 destravado: "SigDict /Contents illegal data"); print do ITI Completo (V12 destravado: "IdAaEtsSigPolicyId Invalid"); trigger investigação Maria das Dores manhã ("Nôa comeu a parte mais importante")
- **João Eduardo Vidal (sócio)**: confirmação institucional ao final ("parabéns")
- **GPT-5 externo**: validação 8 salvaguardas sidecar renal + revisão pós-V8 falha (chain trust vs DER ordering) + revisão visual PDF V9 (overclaim) + análise dashboard cores (cor por estado) + B-lite consent semântica (3 ressalvas) + síntese fim de dia validando arquitetura
- **Adobe Reader**: parser strict que diagnosticou o que ITI escondia ("SigDict /Contents illegal data" revelou bug ByteRange existente desde V6)
- **ITI Completo (validar.iti.gov.br)**: diagnóstico cirúrgico V11→V12 ("IdAaEtsSigPolicyId Invalid — valor do resumo criptográfico não equivalente ao esperado")
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
