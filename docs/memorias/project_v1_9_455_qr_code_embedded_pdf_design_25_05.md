---
name: V1.9.455 QR Code embedded no PDF — design 3 opções A/B/C parqueado
description: Design técnico pra resolver gap caso João Guimarães (QR Code embedded no PDF assinado ICP). 3 opções A/B/C mapeadas com trade-offs explícitos vs Lock V1.9.299 PBAD. Decisão arquitetural pendente Pedro + Ricardo (não codar sem alinhamento)
type: project
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# V1.9.455 QR Code embedded no PDF — design 3 opções

**Fato**: Caso João Guimarães 25/05 (`feedback_qr_code_embedded_pdf_gap_caso_joao_guimaraes_25_05`) revelou gap operacional — PDF assinado ICP juridicamente válido mas SEM QR Code visual embedded.

**Why** (motivação técnica do parqueamento): qualquer modificação do PDF binário pós-assinatura ICP **quebra hash PBAD** = validação ITI volta pra "Desconhecida" = perde Lock V1.9.299. Por isso o design precisa de alinhamento Pedro + Ricardo ANTES de codar — risco arquitetural máximo.

**How to apply** (quando ativar V1.9.455): seguir Opção C (recomendada técnica) + smoke obrigatório 5 etapas + diff binário vs PDF pré-mudança aprovado. NÃO codar sem alinhamento explícito Pedro+Ricardo.

## 3 opções mapeadas com trade-offs explícitos

| Opção | Como | Risco V1.9.299 | Tempo |
|---|---|---|---|
| **A** | Mexer no `sign-pdf-icp` pra desenhar QR APÓS assinar | 🔴 ALTO — quebra lock (hash binário muda) | 4-8h + auditoria pesada |
| **B** | 2 PDFs separados (principal ICP + comprovante QR) | 🟢 ZERO — não toca lock | 2-3h |
| **C** ⭐ | Desenhar QR ANTES de assinar (upstream pipeline) | 🟡 MÉDIO — pipeline novo, smoke obrigatório | 3-5h + smoke |

## Recomendação técnica: Opção C

**Por quê**:
- Elegante (1 PDF único)
- QR coberto pela assinatura (não pode ser falsificado)
- Lock V1.9.299 intocado (Edge `sign-pdf-icp` recebe PDF já com QR + assina normal)
- Compatível com fluxo Memed/Prescrevi que atendentes esperam

**Onde mexer**:
- Novo módulo `pdfWithQR.ts` (gera PDF cliente-side com QR via jspdf antes de mandar pro Edge)
- `clinicalReportPDF.ts` chama novo módulo opcionalmente
- `digital-signature` Edge recebe PDF já com QR e assina (sem modificação)

## Smoke obrigatório (5 etapas)

Antes de selar V1.9.455:
1. `openssl asn1parse` no PDF assinado — binário ICP intacto, estrutura ASN.1 OK
2. `validar.iti.gov.br` upload do PDF — portal real mostra "Válida"
3. Escanear QR com celular — URL validação correta (ex: validar.iti.gov.br/[hash])
4. Adobe Reader desktop — assinatura válida + QR visível no PDF
5. **Diff binário** vs PDF aprovado pré-mudança — confirma modificação só ANTES da assinatura

Sem os 5 PASS, V1.9.455 NÃO sela.

## Lock V1.9.299 PBAD — princípio meta

PBAD = assinatura por hash do binário PDF. Qualquer byte modificado DEPOIS = hash diferente = validação ITI volta pra "Desconhecida". Lock V1.9.299 do CLAUDE.md é manifestação técnica desse princípio, não cautela arbitrária.

Pra adicionar QR Code: modificar PDF ANTES da assinatura (Opção C upstream). Cristalizado em `feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05`.

## Trigger pra ativar (anti-especulação)

Implementar V1.9.455 SÓ quando:
- 2º paciente externo real bater no mesmo gap (confirma padrão, não anomalia)
- OU Pedro+Ricardo decidirem em alinhamento formal pré-Marco 2
- OU Marco 2 (20-30 pacientes externos pagantes) iminente

## Cristalizado

Diário 25/05 BLOCO S (sessão noite). Memória companheira de `feedback_qr_code_embedded_pdf_gap_caso_joao_guimaraes_25_05`.
