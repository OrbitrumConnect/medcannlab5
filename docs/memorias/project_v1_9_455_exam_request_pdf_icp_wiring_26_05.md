---
name: project-v1-9-455-exam-request-pdf-icp-wiring-26-05
description: "V1.9.455 (commit `1c71ef3`, 26/05/2026 ~15h30 BRT) — fix wiring frontend exam_request → PDF ICP-Brasil binário automático. Trigger: caso João Guimarães 25/05 (paciente externo real recusado em laboratório por falta de PDF binário + URL ITI fake). Audit revelou: V1.9.299 PBAD AD-RB CONFORME ITI deployada + APROVADA validar.iti.gov.br MAS Edge sign-pdf-icp órfã (15 de 17 docs signed sem signed_pdf_url). Fix em 2 frentes (núcleo V1.9.299 INTOCADO): PARTE B PatientExamRequestsCard wiring espelhando PatientPrescriptions + PARTE C ExamRequestModule auto-invoke sign-pdf-icp pós digital-signature. Anti-regressão garantida (Edge sign-pdf-icp/digital-signature/AEC FSM/trigger CFM imutabilidade TODAS intocadas). Smoke empírico via PAT: exame João reprocessado, signed_pdf_url populado, PDF 70.248 bytes no bucket (similar ao Carolina V12 70.305 bytes aprovado ITI 16/05)."
metadata:
  node_type: memory
  type: project
  originSessionId: 2660bb38-0295-449a-8e4f-9439ffc7f2ac
---

# V1.9.455 — Exam Request PDF ICP-Brasil Wiring (26/05/2026)

## Trigger empírico

Caso João Guimarães (paciente externo REAL, UUID `3d173bf6-b9a0-4422-ab23-1e0925a82f02`) levou pedido de exame ao laboratório 25/05/2026 17:46 BRT. Atendente Ariane Pereira Marques recusou:

> *"Preciso dele, mas em PDF ou link, Sr. João. Sem ser print. Preciso dele para anexar no sistema..."*
>
> *"Não aceitamos dessa forma, infelizmente. Neste caso, o senhor terá que solicitar o pedido médico constando o CRM"*

Detalhes completos em [[feedback_qr_code_embedded_pdf_gap_caso_joao_guimaraes_25_05]] + [[feedback_paciente_externo_real_estressa_arquitetura_25_05]].

## Diagnóstico empírico (via PAT + audit código)

PAT confirmou empíricamente:
- Edge `sign-pdf-icp` V1.9.299 PBAD AD-RB CONFORME deployada + **APROVADA `validar.iti.gov.br`** (16/05, commit `d8e30f5`, tag `v1.9.299-pbad-conforme-locked`)
- Coluna `patient_exam_requests.signed_pdf_url` existe desde V1.9.231
- Bucket `signed_documents` (private + RLS owner-only) existe
- Cert Ricardo `.pfx` cadastrado em `medical_certificates` (AC DigitalSign, valid até 2027-05-06)
- **MAS Edge `sign-pdf-icp` órfã**: 15 de 17 documentos `signed` com `signed_pdf_url = null` (88%). Frontend nunca invocava automaticamente.
- 3 exames João com `digital_signature` REAL (prefix `MIIK...` = base64 DER PKCS#7) mas SEM PDF binário + URL ITI fake (`gov.br/iti/pt-br/validacao?codigo=` → 404)
- `PatientPrescriptions.tsx:486-538` JÁ tinha wiring V1.9.299 completo (helper `isFictitiousItiUrl()`, banners, botão "Baixar PDF ICP")
- `PatientExamRequestsCard.tsx:108` template HTML cru, ZERO wiring V1.9.299
- `ExamRequestModule.tsx:139, 295` invocavam `digital-signature` MAS nunca `sign-pdf-icp` paralelo

**Conclusão arquitetural**: motor ICP-Brasil existia + era válido. Faltava **distribuição** (princípio meta cunhado por GPT externo triado: *"sistema assinava criptograficamente, mas não entregava o artefato institucional final consumível"*).

## Fix V1.9.455 — 2 partes (commit `1c71ef3`)

### PARTE A — Reprocessamento manual exame João (resolve operacional HOJE)

Invoke direto Edge via curl + ANON_KEY:
```bash
curl -X POST 'https://itdjkfubfzmvmuxxjoae.supabase.co/functions/v1/sign-pdf-icp' \
  -H 'Authorization: Bearer <ANON_KEY>' \
  -H 'apikey: <ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"documentId":"7be5d078-84b8-4c21-b2fa-75783496b19f","documentType":"exam_request"}'
```

Response empírico:
```json
{
  "success": true,
  "signed_pdf_url": "exam_requests/7be5d078-84b8-4c21-b2fa-75783496b19f.pdf",
  "mode": "icp_real_embedded_manual",
  "pdfSizeBytes": 70248
}
```

PAT pós-invoke confirmou:
- `patient_exam_requests.signed_pdf_url` populado
- Arquivo no bucket `signed_documents` 70.248 bytes (similar ao Carolina V12 70.305 bytes aprovado ITI)
- `signature_timestamp` original PRESERVADO (anti-regressão CFM 2.314)

### PARTE B — `src/components/dashboard/patient/PatientExamRequestsCard.tsx` (frontend reader)

Princípio `polir-não-inventar` absoluto — espelha `PatientPrescriptions.tsx:486-538`.

Mudanças:
- Imports adicionais: `Download, ShieldCheck, AlertCircle, ExternalLink, Link as LinkIcon`
- `ExamRequestRow` estendida com 5 campos opcionais ICP (backward-compat modo controlled)
- Helper `isFictitiousItiUrl()` detecta URLs fake (`validacao.iti.gov.br` + `gov.br/iti/pt-br/validacao?codigo=`)
- Query estendida via `(supabase as any)` cast (codegen types defasado)
- 2 handlers novos:
  - `handleDownloadSignedPdf()` — `createSignedUrl` Storage TTL 7d → `window.open`
  - `handleShareSignedPdfWhatsApp()` — gera signed URL + manda LINK via wa.me (resolve Ariane: laboratório abre PDF direto)
- UI condicional baseada em `isSigned` (`digital_signature` populado) + `hasIcpPdf` (`signed_pdf_url` populado):
  - Badge "ICP" no collapsed row
  - Banner verde "Documento assinado digitalmente com ICP-Brasil" + timestamp
  - Banner amarelo "PDF ICP-Brasil ainda não gerado" (legado pré-V1.9.299 ou processando)
  - Botão "Baixar PDF ICP" (verde, ShieldCheck-style)
  - Link "Validar no ITI" (ExternalLink → `validar.iti.gov.br/`)
  - Botão "WhatsApp + PDF" (verde WhatsApp, LinkIcon)
- Handlers existentes "Imprimir" + "WhatsApp texto" PRESERVADOS (anti-regressão)
- "WhatsApp texto" só renderiza quando NÃO há PDF (senão é redundante com "WhatsApp + PDF")

### PARTE C — `src/components/ExamRequestModule.tsx` (writer, auto-invoke)

Adicionou invoke `sign-pdf-icp` em paralelo (background, .then non-blocking) em **2 lugares**:
1. `handleSign()` (linha ~149) — fluxo "assinar pedido existente"
2. `handleSaveAndSign()` (linha ~305) — fluxo "salvar + assinar atômico"

Padrão:
```typescript
supabase.functions.invoke('sign-pdf-icp', {
  body: { documentId: req.id, documentType: 'exam_request' }
}).then(({ data: pdfData, error: pdfError }) => {
  if (pdfError) {
    console.warn('[V1.9.455] sign-pdf-icp falhou (nao-bloqueante):', pdfError?.message || pdfError);
  } else if (pdfData?.signed_pdf_url) {
    console.log('[V1.9.455] PDF ICP-Brasil gerado:', pdfData.signed_pdf_url, `${pdfData.pdfSizeBytes} bytes`);
    loadHistory().catch(() => { /* silent */ });
  }
}).catch((err) => {
  console.warn('[V1.9.455] sign-pdf-icp invoke rejeitado (nao-bloqueante):', err?.message || err);
});
```

Não-bloqueante porque assinatura `digital-signature` PKCS#7 já está persistida no banco. Se `sign-pdf-icp` falhar, exame fica `signed` sem PDF (banner amarelo aparece, paciente pode reprocessar via suporte).

## Anti-regressão garantida (lock V1.9.299 preservado)

| Item | Status |
|---|---|
| Edge `sign-pdf-icp/index.ts` | ✅ INTOCADO |
| Edge `sign-pdf-icp/icp_chain.ts` | ✅ INTOCADO |
| Constants PBAD `PA_AD_RB_V24_OID` | ✅ INTOCADO |
| Edge `digital-signature/index.ts` | ✅ INTOCADO |
| Edge `tradevision-core/index.ts` | ✅ INTOCADO |
| AEC FSM 13 fases | ✅ INTOCADO |
| Trigger CFM imutabilidade | ✅ INTOCADO |
| Verbatim First V1.9.86 | ✅ INTOCADO |
| Pipeline pós-AEC | ✅ INTOCADO |
| Audience Contract V1.9.330-A | ✅ Respeitado (paciente vê PDF próprio, não de outros) |
| RLS `signed_documents` owner-only | ✅ Respeitado (signed URL TTL 7d via service_role internal) |
| Tag git `v1.9.299-pbad-conforme-locked` | ✅ Preservado |

## Smoke pré-commit (empírico)

- ✅ Edge `sign-pdf-icp` invocada via curl ANON_KEY → success, PDF 70.248 bytes
- ✅ PAT confirmou `signed_pdf_url` populado + `signature_timestamp` preservado
- ✅ Arquivo confirmado no bucket `signed_documents`
- ✅ Type-check verde (`tsc --noEmit`)
- ✅ WebFetch confirmou `validar.iti.gov.br` real (aceita QR + upload PDF)
- ✅ WebFetch confirmou `gov.br/iti/pt-br/validacao?codigo=` FAKE 404
- ✅ Cert Ricardo em `medical_certificates`: `.pfx` + senha cifrada + AC DigitalSign + valid

## Pendência V1.9.456 (parqueado)

PARTE D do design original: **QR Code visual embedded no PDF gerado pela Edge `sign-pdf-icp`**.

Empíricamente confirmado: Edge V1.9.299 NÃO desenha QR Code visual (`grep "QR|drawImage|embedPng"` = 0 matches). PDF tem só texto *"Para verificação: validar.iti.gov.br"* (linha 387).

Pra adicionar:
- Lib QR Code via `esm.sh` (`qrcode@1.5.3`)
- Gerar PNG → `pdfDoc.embedPng(bytes)` → `page.drawImage()` no rodapé do box verde de assinatura
- Inserir ANTES de `addSignaturePlaceholder()` — assinatura PBAD cobre o QR (faz parte do hash assinado)
- Smoke ITI completo obrigatório:
  1. `openssl asn1parse` confirmar estrutura PKCS#7 intacta
  2. Upload em `validar.iti.gov.br` → "VÁLIDA" pós-adição QR
  3. Adobe Reader cross-check
  4. Diff binário vs PDF V12 aprovado

Risco: 🟡 MÉDIO (mexe na Edge LOCKED V1.9.299).

QR aponta pra **página própria `medcannlab.com.br/validar/<id>`** (decisão arquitetural — GPT externo endossou, controle UX > dependência ITI).

## Frase âncora

> *"V1.9.299 deu motor ICP. V1.9.455 deu distribuição ICP. Edge órfã virou edge automatizada. 88% dos documentos sem PDF binário voltam a 100% com PDF binário sempre que documento for assinado a partir de agora. Caso João Guimarães foi o primeiro paciente externo a estressar o fluxo PDF→receptor — e expôs o gap exato que V1.9.455 fecha."*

— Cristalizado 26/05/2026 ~15h45 BRT após commit `1c71ef3` push 4 refs. Próximo gap: V1.9.456 QR Code visual embedded (parqueado, exige smoke ITI completo).

## Conexões

- [[feedback_qr_code_embedded_pdf_gap_caso_joao_guimaraes_25_05]] — trigger empírico
- [[feedback_paciente_externo_real_estressa_arquitetura_25_05]] — princípio meta
- [[feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05]] — constraint que V1.9.455 NÃO violou
- [[project_v1_9_455_qr_code_embedded_pdf_design_25_05]] — design original 3 opções A/B/C (resolveu por C "wiring upstream") + D parqueada
- [[feedback_aec_campo_permissivo_e_triagem_gpt_externo_pos_universo_tea_26_05]] — princípio meta GPT externo triado (6ª aparição mês, 2ª sem feature creep)
- [[feedback_polir_nao_inventar]] — PARTE B é espelho cirúrgico de PatientPrescriptions
- [[feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05]] — princípio análogo (smoke obrigatório pré-deploy)
- [[feedback_doc_institucional_sem_pat_nao_e_valido_23_05]] — princípio aplicado (PAT empírico confirmou cada passo)
- [[feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05]] — eixo honestidade > utilidade preservado (PDF assinado JÁ é o documento válido, não placeholder)
