---
name: Caso João Guimarães — QR Code embedded no PDF (1º paciente externo real estressou fluxo)
description: 25/05 ~17:46-18:44 BRT, João Guimarães (paciente REAL Dr. Ricardo, não conta teste) levou PDF assinado ICP ao laboratório. Atendente recusou agendar exames por falta de QR Code visual. Diagnóstico: PDF juridicamente válido (ICP-Brasil) MAS sem QR embedded — gap operacional ≠ jurídico
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Caso João Guimarães — gap QR Code embedded no PDF

**Rule**: PDF assinado ICP-Brasil é juridicamente válido (substitui carimbo físico desde Decisão CFM 2.299/2021). MAS atendente operacional de laboratório aplica processo aprendido com Memed/Prescrevi: escanear QR. Em healthtech B2C onde paciente externo bate em receptor real, **cumprir a lei não basta — precisa cumprir o processo que receptor espera**.

**Why** — caso empírico:

25/05 ~17:46-18:44 BRT, João Guimarães (paciente REAL Dr. Ricardo Valença) recebeu pedido de exame pela plataforma MedCannLab e levou ao laboratório. Atendente recusou agendar. Conversa WhatsApp literal:

> *"[17:46] João: Oi Ricardo, não consigo agendar os exames. Não tem assinatura. Precisa do QR code. No final do exame aparece como assinado pelo ICP BRASIL. Correto?"*
>
> *"[18:44] João: Mas o rapaz disse q o QR code que é a assinatura?"*

## Diagnóstico empírico via grep código

**O que o PDF TEM ✅**:
- Assinatura ICP-Brasil REAL via `sign-pdf-icp/index.ts` (V1.9.299 PBAD AD-RB CONFORME ITI)
- Selo visual rodapé "Assinado por Dr. Ricardo Valença - ICP-Brasil"
- Validação criptográfica OK via `openssl asn1parse` + `validar.iti.gov.br` + Adobe Reader
- **Juridicamente VÁLIDO** (Decisão CFM 2.299/2021 + Lei 14.063/2020 + MP 2.200-2/2001)

**O que o PDF NÃO TEM ❌**:
- **QR Code visual embedded** — atendente não consegue escanear
- `iti_qr_code` na tabela: `null` (não populado)
- `sign-pdf-icp` (LOCK V1.9.299) só assina criptograficamente, não desenha QR
- `DigitalSignatureWidget.tsx:108-111` gera QR via `api.qrserver.com` mas é só UI do médico

## Conflito empírico

| Ponto de vista | Diagnóstico |
|---|---|
| **João/atendente operacional** | "PDF sem QR = inválido pra agendar" |
| **Jurídico/ICP-Brasil** | "PDF assinado ICP = juridicamente válido, dispensa carimbo" |

Os 2 estão "certos" no seu domínio. Mas operacional vence jurídico se não tiver atalho de validação.

## Resolução curta (Ricardo enviou via WhatsApp ao João)

```
1) Exame ESTÁ assinado digitalmente com ICP-Brasil REAL.
   Assinatura jurídica = assinatura física + carimbo (vale por lei).

2) Sobre QR Code: PDF hoje não embeda QR visual (vamos adicionar
   essa semana). Assinatura é 100% válida.

3) 3 caminhos pro laboratório validar AGORA:
   a) Adobe Acrobat Reader (grátis) → "Assinado por Dr. Ricardo
      Valença Médico - ICP-Brasil - Válido"
   b) validar.iti.gov.br → upload PDF → "Assinatura válida"
   c) portal.cfm.org.br/buscamedicos → confirma CRM-PE ativo

4) Receita/exame com ICP-Brasil dispensa carimbo físico desde 2021
   (Decisão CFM 2.299/2021). Se laboratório recusar, me liga.
```

## Próximo passo técnico

**V1.9.455 parqueado** — embed QR Code visual no PDF. Design 3 opções A/B/C documentado em `project_v1_9_455_qr_code_embedded_pdf_design_25_05` (memória dedicada). **Decisão arquitetural pendente Pedro com Ricardo** (não codar sem alinhamento).

## Princípios meta cristalizados pelo caso

1. **Lock V1.9.299 PBAD protege de modificação pós-assinatura** — `feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05`
2. **Paciente externo real estressa arquitetura DIFERENTE de teste interno** — `feedback_paciente_externo_real_estressa_arquitetura_25_05`
3. **Validação jurídica ≠ validação operacional** — em healthtech B2C, processo aprendido pelo receptor (atendente lab) vence texto da lei

**How to apply**:
- Toda feature de OUTPUT (PDF, NFT, link share) que chega a paciente pagante precisa de **Smoke 3 externo operacional** (atendente real / portal real / cartório real) ANTES de Marco 2 (20-30 pacientes externos pagantes).
- Smoke interno termina em "PDF gerado + assinatura válida"; smoke externo termina em "receptor aceita o PDF".
- Frase âncora Pedro 25/05 noite: *"ricardo sempre vem com uma!"* — captura dinâmica empírica do projeto.

## Cristalizado

Diário 25/05 BLOCO S (sessão noite, pós-22h). Caso emblemático do mês — 1º paciente externo REAL a estressar fluxo PDF→receptor.
