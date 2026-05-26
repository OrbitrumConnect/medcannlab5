---
name: Lock V1.9.299 PBAD protege de modificação pós-assinatura (princípio técnico)
description: Lock V1.9.299 do CLAUDE.md é manifestação técnica do PBAD AD-RB, não cautela arbitrária. PBAD = assinatura por hash do binário PDF. Qualquer byte modificado DEPOIS = hash diferente = validação ITI volta pra "Desconhecida"
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Lock V1.9.299 PBAD = proteção técnica contra modificação pós-assinatura

**Rule**: Qualquer mudança em `supabase/functions/sign-pdf-icp/index.ts` OU `icp_chain.ts` exige auditoria empírica via:
1. `openssl asn1parse` no binário pós-assinatura (estrutura ASN.1 intacta)
2. Smoke `validar.iti.gov.br` (portal ITI mostra "Válida", não "Desconhecida")
3. Diff binário vs PDF aprovado pré-mudança

Sem os 3 verificados, NÃO selar mudança. Lock V1.9.299 = manifestação técnica desse princípio.

**Why**: PBAD = Política de Assinatura Brasileira de Atributos Definidos (ICP-Brasil v2.4 atual). AD-RB = Assinatura Digital com Referências Básicas. Em PBAD, a assinatura é gerada sobre **hash do binário PDF inteiro**. Qualquer byte modificado DEPOIS da assinatura quebra o hash = validação ITI retorna "Desconhecida".

Caso histórico V1.9.299 (16/05/2026): antes da implementação CONFORME, o selo PBAD validava como "Desconhecida" em verificadores externos (placeholder cosmético). V1.9.299 reescreveu `sign-pdf-icp/index.ts` com algoritmo PBAD AD-RB v2.4 + chain ICP embedded validada. Agora valida como "Válida" — selo jurídico real.

**Constraint declarado em CLAUDE.md**:
> *"⚠️ NÃO TOCAR (sem auditoria empírica via openssl asn1parse + smoke ITI + diff binário vs PDF aprovado): `supabase/functions/sign-pdf-icp/index.ts` — algoritmo PBAD AD-RB validado, mexer = risco voltar pra 'desconhecida'."*

## Implicação arquitetural para features futuras

**Qualquer feature que mexe no PDF assinado ICP precisa modificar ANTES da assinatura, NUNCA depois.**

Casos práticos:
- **QR Code embedded** (caso João Guimarães 25/05) → Opção C "desenhar QR ANTES de assinar" (upstream pipeline), NÃO Opção A "desenhar APÓS assinar" (`project_v1_9_455_qr_code_embedded_pdf_design_25_05`)
- **Marca d'água visual** → upstream
- **Selo CFM customizado** → upstream
- **Layout do PDF** (cabeçalho, rodapé) → upstream
- **Quaisquer metadados visuais** → upstream

## Cuidado especial: refactor `tradevision-core`

Branch `refactor/tradevision-core-modular` (22/05, parqueada) NÃO toca esse Edge. Princípio: refator pode acontecer no Edge gigante (orchestrator/AEC/etc) mas o Edge ICP fica intocado até nova publicação ITI (PA v2.5+) exigir update das constants `PA_AD_RB_V24_OID` + `PA_AD_RB_V24_SIGPOLICYHASH_HEX`.

## Trigger pra ATUALIZAR (não pra mexer)

Constants V24 OID + SIGPOLICYHASH só atualizar quando:
- ITI publicar nova PA (v2.5+) — verificar `https://www.iti.gov.br/` notícias normativas
- Validador ITI portal começar a retornar warning sobre PA desatualizada
- Pedro/Ricardo receberem comunicado oficial CFM ou ITI

## Cristalizado

Diário 25/05 BLOCO S (caso João Guimarães). Memória derivada empírica do gap operacional — princípio técnico que existia implícito no CLAUDE.md, explicitado agora.
