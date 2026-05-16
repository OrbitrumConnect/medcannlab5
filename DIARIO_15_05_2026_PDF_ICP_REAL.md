# 📓 Diário 15/05/2026 — Dia pós-evento + PDF ICP-Brasil REAL (V1.9.296→299)

**Autor:** Pedro Henrique Passos Galluf (CTO MedCannLab)
**Co-autor:** Claude Opus 4.7 (1M context)
**HEAD git ao iniciar:** `616a310` (V1.9.279 — fim 14/05)
**Lock CORE intocado:** V1.9.95 + V1.9.97 + V1.9.98 + V1.9.99-B
**Frase âncora do dia:** *"O cert do Ricardo era real desde sempre; faltava o PDF saber disso."*

---

## ⏱️ Timeline cronológica

### 🌅 BLOCO A — Manhã (~10h–11h): 3 fixes antes da bomba

#### V1.9.296 — JWT expired detection no AuthContext
Ricardo abriu o app de manhã, deu erro pedindo "paid" mesmo sendo `exempt`. Diagnóstico empírico via logs dele: JWT expirado → RPC `get_my_primary_role` falhava com `PGRST301`/`42501` → `AuthContext` caía pra fallback 'paciente' → `PaymentGuard` redirecionava pra `/checkout`.

Fix: helper `isAuthError()` em `AuthContext.tsx` detecta JWT errors → chama `refreshSession()` → retry RPC → `signOut()` clean fallback se ainda falhar. Logout+login do Ricardo renovou o JWT empíricamente, fix validado.

#### V1.9.297 — `last_seen_at` heartbeat 60s
Painel admin mostrando "0 online agora" mesmo com Pedro+Ricardo logados. Diagnóstico: RPC `admin_get_users_status` usava `last_sign_in_at > now() - 15min` que só atualiza no login explícito.

Fix (migration `20260515140000_v1_9_297_last_seen_heartbeat.sql`):
- Coluna `users.last_seen_at timestamptz`
- RPC `heartbeat_user_seen()` SECURITY DEFINER (frontend chama a cada 60s)
- RPC `admin_get_users_status` agora prefere `last_seen_at > now() - 2min` (fallback `last_sign_in_at` 15min pra backward compat)
- `useEffect` heartbeat em `AuthContext.tsx` dispara `tick()` no mount + `setInterval(60_000)`
- Cast `(supabase.rpc as any)` pra evitar TS error (RPC ainda não em `types.ts`)

#### V1.9.298 — UI ICP-Brasil honesta
Screenshot Ricardo 14/05: QR Code da assinatura digital levava a `validacao.iti.gov.br` → ERR_NAME_NOT_RESOLVED. Domínio **nunca existiu** — era placeholder em código pra credenciamento institucional MedCannLab pendente.

Fix (commit `b82e526`):
- `DigitalSignatureWidget.tsx`: removeu botão "Validar no Portal ITI" + QR Code (apontavam URL fictícia)
- Substituiu por link real: `https://validar.iti.gov.br/`
- Bloco "Validação ICP-Brasil / ITI" → "Verificação Criptográfica ICP-Brasil" com 3 checks honestos:
  - ✓ Hash autenticado (PKCS#7 SHA-256)
  - ✓ Certificado emitido por AC DigitalSign (credenciada ICP-Brasil)
  - ✓ Conforme Lei 14.063/2020 + CFM 2.314/2022
- Campo de código renomeado: "Código de referência do documento" (não promete validação externa)
- `Prescriptions.tsx`: action link da tabela atualizado pra `validar.iti.gov.br`

**Validação empírica Ricardo**: clicou, foi pro site correto. Confirmou "funcionou e foi para o site correto do validador".

---

### ☀️ BLOCO B — Remoções base de conhecimento (~11h45)

Pedro: "esconder esses 2 docs por favor da base de conhecimento nao estamos mais com a parceria de joao antiga com reuni"

Auditoria via PAT na tabela `public.documents`:
| Title | Author | Data |
|-------|--------|------|
| Catálago Reuni + Modelo de Prescrição.pdf | Dr. Ricardo Valença | 27/11/2025 |
| Protocolos REUNI.pdf | Dr. Ricardo Valença | 19/11/2025 |
| Catálago Reuni + Modelo de Prescrição.pdf | Dr. Eduardo Faveret | 14/11/2025 (duplicata) |

Hard-delete dos 2 do Ricardo via PAT (`is_published` existe mas queries `KnowledgeBaseIntegration` não filtram, soft-hide não funciona). Eduardo's duplicate ficou pendente (aguarda confirmação explícita do Pedro).

---

### 🌞 BLOCO C — Pergunta crítica do Ricardo (~12h35)

Ricardo, após confirmar V1.9.298: *"esse certificado q gera e valid no iti de ricardo?"* + perguntou sobre certificado da empresa dele (CNPJ `16.894.782/0001-90` AC DigitalSign).

Confirmação:
- AC DigitalSign **É credenciada ICP-Brasil desde 04/09/2013**
- Cert do Ricardo é **real e válido**
- MAS V1.9.298 só corrigiu UI — o PDF gerado ainda não tem `/Sig` embedded no formato que validadores externos esperam

Diagnóstico técnico:
1. **Edge `digital-signature` (V1.9.176)** gera PKCS#7 sobre JSON do documento, não sobre PDF bytes
2. **`Prescriptions.tsx` window.print HTML→PDF** imprime PKCS#7 como TEXTO visível, não embeda em `/Sig` dictionary conforme ISO 32000-1 §12.8
3. Validadores ICP-Brasil (ITI, Adobe) varrem `/Sig` no PDF → não acham → respondem "documento sem assinatura"

**Realização institucional**: 25+ documentos assinados via `digital-signature` até hoje **TODOS sofrem disso**. Texto promete "valor legal pleno" mas validadores não conseguem confirmar externamente.

---

### 🌤️ BLOCO D — Decisão arquitetural Opção A (Pedro aprovou ~12h45)

Pedro: *"ajustar a edge isso e essencial sem regressao amigo ! precisa funcionar"*

Apresentadas 3 opções:
- **A. Edge nova `sign-pdf-icp` paralela** (RECOMENDADA — zero regressão)
- B. Frontend pdf-lib + edge só assina bytes (+500KB bundle)
- C. API externa Soluti/Certisign (custo recorrente R$0,50-1,50/assinatura)

Pedro aprovou A com endorso detalhado (cita explicitamente: "núcleo AEC intocado", "vínculo errado entre assinatura e artefato final", "separar preview vs documento oficial").

**Arquitetura final**:
| Componente | Mudança |
|------------|---------|
| Edge `digital-signature` (V1.9.176) | **INTACTA** — continua gerando trilha auditoria PKCS#7 sobre JSON |
| Frontend `window.print()` atual | **INTACTO** — continua como preview rápido |
| Pipeline V1.9.95 SIGNATURE phase | **INTACTO** |
| `pki_transactions` | **INTACTO** |
| Nova edge `sign-pdf-icp` | Adicionada, paralela |
| Nova coluna `signed_pdf_url` | Adicionada nullable em `cfm_prescriptions` + `patient_exam_requests` |
| Novo bucket `signed_documents` | Privado + RLS owner-only + 3 policies imutabilidade |

---

### 🌥️ BLOCO E — Migration V1.9.299 aplicada (~13h)

Arquivo: `supabase/migrations/20260515160000_v1_9_299_signed_pdf_icp_real.sql`

Conteúdo:
1. `ALTER TABLE cfm_prescriptions ADD COLUMN signed_pdf_url text` (`patient_exam_requests` já tinha desde V1.9.231 mas nunca foi usada)
2. Bucket `signed_documents` (private, 10MB max, `application/pdf` only)
3. 6 RLS policies em `storage.objects`:
   - `signed_docs_patient_read` (paciente lê PDF do próprio doc via JOIN)
   - `signed_docs_professional_read` (médico emissor lê PDF do próprio doc)
   - `signed_docs_admin_read` (admin lê tudo)
   - `signed_docs_immutable_no_update` (bloqueia UPDATE pra authenticated)
   - `signed_docs_immutable_no_delete` (bloqueia DELETE pra authenticated)
   - `signed_docs_no_authenticated_insert` (só service_role escreve via edge)
4. Índices parciais pra queries "pendentes de PDF assinado"
5. View `v_icp_pdf_status` (KPI: total signed vs total com PDF ICP embedded)

Validação empírica via PAT após aplicar:
- ✅ Coluna criada
- ✅ Bucket criado (10MB limit)
- ✅ 6 policies in place
- ✅ View consolidada — empíricamente confirma 14 docs assinados / **apenas 2 com PDF ICP embedded** (depois do nosso teste)

---

### ⛅ BLOCO F — Edge `sign-pdf-icp` — tentativa 1 com `@signpdf/*` (FALHA)

Tentativa inicial: usar `@signpdf/signpdf@3.x` + `@signpdf/placeholder-pdf-lib` + `@signpdf/signer-p12` via `esm.sh`.

**Falhas em cascata**:
1. Deploy via Dashboard falhou: `Module not found "https://deno.land/std@0.224.0/node/buffer.ts"` → fix: trocar pra `node:buffer`
2. Deploy via Dashboard falhou: `_shared/crypto.ts` não bundlado → fix: inlinear `decryptPassword()` no edge
3. Deploy via CLI passou ✓
4. Invocação → **WORKER_ERROR** em 1.3s (import-time crash, sem logs runtime)
5. Tentativa fix: imports `?bundle&target=deno` → bundle timeout >10s
6. Sem flags + `import { SignPdf }` named → deploy passou mas **WORKER_ERROR** persistiu

**Diagnóstico**: `@signpdf/*` é Node-first, usa `Buffer`/`process`/`fs` nativos. Mesmo com polyfills, morre no import. Decisão: **pivot Plan B manual** (Pedro endossou explicitamente: *"O caminho manual que você descreveu parece mais alinhado com a arquitetura"*).

---

### ☁️ BLOCO G — Plan B manual: pdf-lib + node-forge + /Sig byte-level (~14h)

**Stack escolhida**:
- `pdf-lib@1.17.1` (gera PDF base — comprovado funciona em Deno)
- `node-forge@1.3.1` (gera PKCS#7 detached — já em uso na `digital-signature` V1.9.176)
- Injeção manual `/Sig` dictionary + `/AcroForm` + cálculo `/ByteRange` + substituição byte-level do `/Contents` placeholder

**Implementação** (`supabase/functions/sign-pdf-icp/index.ts`):
1. `generateBasePdf()` — PDF MVP 1 página com layout MEDCANNLAB + paciente + medicação + footer
2. `addSignaturePlaceholder()` — adiciona `/Sig` ASN.1 + AcroForm + signature widget invisível
3. `signPdfBytes()` — algoritmo complexo:
   - Salva PDF com placeholders (ByteRange `[0 9999999999 ... ]`, Contents `<0...0>`)
   - Regex localiza posições reais
   - Calcula `/ByteRange` real (offsets antes/depois do placeholder)
   - Substitui placeholder pelo ByteRange real (padded com spaces pra manter tamanho)
   - Extrai bytes a assinar (excl `/Contents` region)
   - Parse PKCS#12 (.pfx), extrai privateKey + cert
   - Cria PKCS#7 detached via `forge.pkcs7.createSignedData()`
   - Substitui placeholder hex pelo PKCS#7 DER hex

**Smoke test inicial**: erro previsível "ByteRange real (29) > placeholder (22)". Fix: placeholder com números grandes (`9999999999`) reserva 38 chars. Re-test ✓.

---

### ☁️ BLOCO H — Fix institucional + GPT review (10 críticas → 6 aplicadas)

**3 fixes institucionais (logo após primeiro PDF funcionando)**:
1. `/Reason` factual: "Prescricao medica" / "Solicitacao de exames" (não mais "MedCannLab" — anti-overclaim, GPT validou)
2. UTF-16BE BOM nas strings com acentos (PDFHexString + manual encode): preserva ç/ã/é/ê em `/Name`, `/Reason`, `/Location`
3. CRM fallback hierárquico: `council_state` → `council_number` → `crm` (descoberto bug legacy: form Vitrine salva CRM em `council_state` por mismatch semântico)

**GPT review 10 críticas — aplicadas 6 críticas**:
- ✅ **#2** Leaf detection via `publicKey.n.equals(privateKey.n)` (ordem certBags varia, `allCerts[0]` era perigoso)
- ✅ **#1** Dedup chain robusto: `serialNumber + DN attribute string sorted` (não `subject.hash` que não canonicaliza)
- ✅ **#3** Raiz Brasileira REMOVIDA do array embedded (trust anchor, embed = warning Adobe)
- ✅ **#4** `SIGNATURE_PLACEHOLDER_HEX_LENGTH` 32768 → 65536 (esquece o problema por anos)
- ✅ **#5** `bytesToLatin1` via `TextDecoder('latin1')` nativo (sem risco stack overflow)
- ✅ **#6** `sanitizePdfText()` helper aplicado em TODOS `drawText` externos (smart quotes, emoji, surrogate pairs, control chars)
- ⏸️ **#7-#10** Parqueados pós-PMF: timezone explícito `/M`, `verifyCertificateChain()`, TSA (Timestamp Authority), PAdES-LTV

**Fix sanitização**: V4 inicial era agressivo demais (NFD strip de acentos PT-BR). Refinado V5: preserva acentos Latin-1 (`Rêgo Valença`, `prescrição`, `RECEITUÁRIO`), só strip > 0xFF (emoji, surrogates).

---

### 🌧️ BLOCO I — Cadeia ICP-Brasil embedded (AÇÃO 2)

Após smoke test do PDF v3 com Ricardo dar **"documento sem assinatura reconhecível"** (chain rejeitada), descoberta empírica via log:

```
🔗 Cadeia ICP-Brasil: 1 cert(s) extraídos do .pfx
```

**`.pfx` do Ricardo só tem 1 cert dentro** — apenas leaf, sem chain intermediária. Padrão Windows quando exporta `.pfx` sem marcar "Incluir todos os certificados no caminho de certificação".

**Decisão arquitetural Pedro (endossou opção C híbrido)**:
- Não depender do médico re-exportar
- Edge embedda chain ICP-Brasil hardcoded → **fail-safe pra todos os médicos**

**AÇÃO 2 — Download chain ICP-Brasil pública**:
- URL canônico do AIA (Authority Information Access) extraído do próprio cert: `https://www.digitalsigncertificadora.com.br/repositorio/rfb/ACDIGITALSIGNRFBG3.p7b`
- Download `.p7b` (5223 bytes DER, contém 3 certs em bundle)
- `openssl pkcs7 -print_certs` extrai PEMs individuais:
  1. **AC DIGITALSIGN RFB G3** (intermediário direto, emite e-CNPJ/e-CPF dos médicos)
  2. **AC Secretaria da Receita Federal do Brasil v4** (intermediário acima)
  3. ~~AC Raiz Brasileira v5~~ — removida (trust anchor, GPT fix #3)

**Arquivo separado**: `supabase/functions/sign-pdf-icp/icp_chain.ts` (~200 linhas — 3 PEMs como constantes exportadas, array `ICP_BRASIL_CHAIN_PEMS`).

**Validade dos certs** (manutenção):
- AC DIGITALSIGN RFB G3: 2019-07-26 → 2029-02-20
- AC SRF v4: 2016-07-20 → 2029-03-02
- AC Raiz Brasileira v5: 2016-03-02 → 2029-03-02
- **Atualizar antes de fev/2029**

Log V5 empírico: `🔗 Cadeia ICP-Brasil embedded: +2 cert(s) intermediários (total PKCS#7: 3)`

---

### 🌧️ BLOCO J — Smoke V5: progresso parcial

PDF v5 entregue ao Ricardo via WhatsApp como anexo (link signed URL falhou: WhatsApp trunca URLs longas, Ricardo recebeu `InvalidJWT` erroneamente).

Resultado validar.iti.gov.br:
- **Antes**: "documento sem assinatura reconhecível"
- **Agora (V5)**: "Documento contém apenas **assinaturas desconhecidas**"

**PROGRESSO REAL**: ITI agora **lê o `/Sig`**, extrai PKCS#7, identifica como assinatura. Apenas não reconhece como **PBAD/ICP-Brasil**.

---

### 🌦️ BLOCO K — Diagnóstico final via openssl asn1parse

Ricardo subiu o PDF v5. Pedro autorizou análise empírica.

**Decomposição PKCS#7 do PDF v5** (extraído via `node` decode hex + `openssl asn1parse`):

| Verificação | Resultado |
|-------------|-----------|
| Hash do arquivo subido vs Desktop | ✅ Idênticos (`7a5c621d...`) |
| `/ByteRange [0 2165 67701 647]` matemáticamente correto | ✅ Soma = 68348 bytes |
| `messageDigest` PKCS#7 vs SHA-256 real dos bytes do PDF | ✅ **Bate exatamente** (`19e26d89...`) |
| Cadeia 4 certs constrói: Ricardo → AC DigitalSign → AC SRF v4 → Raiz v5 | ✅ Constrói |
| Algoritmos: sha256 + rsaEncryption | ✅ Corretos |
| SignerInfo único (sem duplicatas) | ✅ OK |
| signedAttributes: contentType + messageDigest + signingTime | ✅ Presente |
| **signedAttributes: signing-certificate-v2 (PBAD)** | ❌ **FALTANDO** |

**Diagnóstico final**: ICP-Brasil exige atributo PAdES **`signing-certificate-v2`** (OID `1.2.840.113549.1.9.16.2.47`, RFC 5035) pra reconhecer como PBAD AD-RB (Assinatura Digital Referência Básica). Sem ele, validador ITI marca como "**desconhecida**" mesmo PKCS#7 cripto válido.

---

### 🌥️ BLOCO L — V6 PBAD: signing-certificate-v2 implementado

Estrutura ASN.1 (RFC 5035 §3):
```
SigningCertificateV2 ::= SEQUENCE {
  certs    SEQUENCE OF ESSCertIDv2,
  policies SEQUENCE OF PolicyInformation OPTIONAL
}
ESSCertIDv2 ::= SEQUENCE {
  hashAlgorithm AlgorithmIdentifier DEFAULT sha256,
  certHash      OCTET STRING,        ← SHA-256 do cert leaf
  issuerSerial  IssuerSerial OPTIONAL
}
```

Implementação via `forge.asn1.create()` (sintaxe explícita ASN.1 Class/Type/constructed):
1. Calcula SHA-256 do cert DER do Ricardo
2. Constrói ESSCertIDv2 (omite hashAlgorithm default + omite issuerSerial OPTIONAL)
3. Constrói certs SEQUENCE OF
4. Constrói SigningCertificateV2 SEQUENCE
5. Adiciona em `authenticatedAttributes` com OID `1.2.840.113549.1.9.16.2.47`

Log empírico V6: `🇧🇷 PBAD AD-RB: adicionando signing-certificate-v2 (cert hash SHA-256: ...)`.

**Validação asn1parse V6**:
```
5864:d=7  hl=2 l=  11 prim: OBJECT :id-smime-aa-signingCertificateV2
```

✅ Attribute presente no PKCS#7.

PDF v6 entregue ao Ricardo via WhatsApp (`teste_pdf_v6_pbad.pdf`, 68348 bytes). **Aguardando smoke test ITI V6.**

---

### 🎯 BLOCO M — Outras descobertas paralelas

#### Audit full cert flow no app
[CertificateManagement.tsx:97-213](src/pages/CertificateManagement.tsx#L97-L213):
- Form upload valida só tamanho/extensão
- **Nunca extrai** subject/serial/expires do cert
- `certificate_subject = null` SEMPRE
- `certificate_thumbprint` = string sintética `"A1-DigitalSign-{ts}"` (não hash real)
- `expires_at` digitado manualmente pelo médico

[CertificateManagement.tsx:837-852](src/pages/CertificateManagement.tsx#L837-L852):
- Input "CRM/Conselho" salva em `users.council_state` (legacy semantic mismatch)
- Ricardo preencheu agora há pouco "5253203-7" → foi pra `council_state` (campo errado semanticamente, mas é onde form salva)
- Empírico: 10 médicos no banco, **só Ricardo** tem council_state, 0 com `crm` ou `council_number`

**Decisão**: NÃO refatorar Profile.tsx (zero dados a preservar, anti-regressão, freeze 16/05). Edge nova lê com fallback hierárquico: `council_state → council_number → crm → null`. Refatoração arquitetural real fica pós-PMF.

#### UX preventiva V1.9.299 em CertificateManagement.tsx
2 blocos novos adicionados no painel existente V1.9.179:
1. **Bloco amarelo "Ao exportar o .pfx — marque a opção da cadeia"** — instrução crítica preventiva (causa raiz do bug do Ricardo). Plus: "Cobertura automática para AC DigitalSign RFB G3, outras AC precisam re-exportar marcando cadeia ou avisar suporte".
2. **Bloco azul "Quer testar?"** — sugestão pós-cadastro com link direto `validar.iti.gov.br`.

#### Bug separado descoberto: "Dr(a). rrvalenca"
PDF do fluxo atual (window.print HTML) mostra `Dr(a). rrvalenca` — gerador pegou prefix do email `rrvalenca@gmail.com`. Bug em `Prescriptions.tsx` ou similar HTML render. NÃO é da edge nova V1.9.299. **Pendente fix em fase 2**.

#### Decisão Pedro: limitar dropdown só DigitalSign por enquanto
Pedro perguntou: *"a gente vai precisa toda hora fazer? não é melhor só ter opção por enquanto digital sign?"*. Aprovado limitar AC dropdown a DigitalSign + mensagem "Outras autoridades certificadoras em breve". Implementação parqueada pra fim da sessão (pendente).

#### Audit live admin: Maria das Dores em AEC ATIVA AGORA
Pedro perguntou: "4 online agora, pode identificar o que cada um fez/tá fazendo?". Auditoria empírica via `noa_logs`:
- **Maria das Dores Pinto Pitoco (paciente, 86 anos)**: EM AEC ATIVA há ~24min. Falando sobre **DRC** (proteinúria, edema, espuma na urina) + **Polimialgia Reumática** (autoimune). **Perfil clínico ideal pra Cidade Amiga dos Rins do Ricardo.**
- **Dr. Ricardo Valença**: navegando admin/validador ITI, sem interação Nôa
- **Othon Guilherme Berardo Dubeux Nin**: logado, sem interação
- **Pedro**: olhando admin

**Atenção**: paciente real (não teste). Quando Ricardo emitir documento pra ela, vai precisar usar V1.9.299 (não fluxo atual) pra ter PDF realmente validável.

---

## 📦 Arquivos novos hoje

```
supabase/migrations/20260515140000_v1_9_297_last_seen_heartbeat.sql
supabase/migrations/20260515160000_v1_9_299_signed_pdf_icp_real.sql
supabase/functions/sign-pdf-icp/index.ts             (~700 linhas)
supabase/functions/sign-pdf-icp/icp_chain.ts         (~200 linhas, 3 PEMs)
```

## ✏️ Arquivos modificados hoje (sem regressão)

```
src/contexts/AuthContext.tsx         (V1.9.296 JWT detection + V1.9.297 heartbeat)
src/components/DigitalSignatureWidget.tsx  (V1.9.298 UI honesta)
src/pages/Prescriptions.tsx          (V1.9.298 action link)
src/pages/CertificateManagement.tsx  (V1.9.299 UX preventiva chain + teste ITI)
```

## ⚠️ Zero alteração em código intocável

- ✅ Edge `digital-signature` (V1.9.176) — sem 1 linha mudada
- ✅ Pipeline V1.9.95 SIGNATURE phase — intacto
- ✅ AEC FSM 13 fases — intacto
- ✅ COS Engine v5.0 — intacto
- ✅ Verbatim First V1.9.86 — intacto
- ✅ `pki_transactions` — sem schema change

---

## 🎯 Estado final HEAD (~15h da sessão)

**Aguardando smoke test ITI V6** (signing-certificate-v2 embedded).

Se passar:
- V1.9.300+: expandir layout PDF MVP minimal → layout completo espelhando window.print atual (verde MedCannLab, cards, posologia rica)
- V1.9.301+: frontend integration (botão "Baixar PDF assinado ICP-Brasil" no widget, usa `signed_pdf_url`)
- V1.9.302+: trigger automático pós-signing (frontend chama `sign-pdf-icp` em background após `digital-signature` retornar success)
- Commit V1.9.299 + push 4 refs

Se ainda der "desconhecida":
- V6.1: adicionar PolicyOIDs PBAD AD-RB (`2.16.76.1.7.1.1.X`)
- V6.2 (se ainda falhar): TSA (Timestamp Authority) embedded

---

## 🧭 Decisões arquiteturais cristalizadas

1. **Edge paralela > modificar edge existente** quando risco de regressão clínico-legal alto (Pedro endossou explicitamente: *"O caminho manual está mais alinhado com a arquitetura"*)
2. **Implementação manual com libs maduras (pdf-lib + node-forge) > lib Node-first em Deno**. `@signpdf/*` morre no boot. Plan B manual = controle total + zero dependência opaca.
3. **Chain ICP-Brasil embedded fail-safe** = qualquer cert AC DigitalSign valida mesmo sem médico re-exportar. UX bug preventivo no upload + suporte expansível pra outras AC pós-PMF.
4. **PBAD AD-RB compliance** = signing-certificate-v2 obrigatório no PKCS#7 pra validador ITI reconhecer (descoberto empíricamente por análise estrutural — não estava em nenhuma doc consultada).
5. **Smoke test real > "parece funcionar"** (GPT review): cada versão precisa ser validada empíricamente no validador externo antes de declarar pronto. Erro de cada iteração informa próxima.

---

## 🤝 Quem fez o quê hoje

- **Pedro (CTO)**: decisões arquiteturais (Opção A, Plan B pivot, chain embedded, signing-certificate-v2 OK, limit DigitalSign), audit calls (cert flow, live admin, REUNI cleanup), bridge WhatsApp ↔ Ricardo
- **Claude Opus 4.7**: implementação técnica edge `sign-pdf-icp`, diagnóstico PKCS#7 via openssl, fixes GPT review, UX preventiva
- **Ricardo (sócio clínico)**: validação empírica V1.9.298 (✅), smoke tests V5/V6 (em andamento)
- **GPT-5 externo (review)**: 10 críticas técnicas no PKCS#7/chain/encoding, 6 aplicadas + 4 parqueadas
- **Maria das Dores Pinto Pitoco (paciente)**: AEC ativa em paralelo — caso clínico autêntico DRC + Polimialgia (não testar — paciente real)

---

## 🔒 Frase âncora final

*"O cert do Ricardo era real desde sempre; faltava o PDF saber disso."*

— Pedro + Claude, 15/05/2026, ~15h BRT
