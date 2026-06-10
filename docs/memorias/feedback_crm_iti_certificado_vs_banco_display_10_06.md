---
name: feedback_crm_iti_certificado_vs_banco_display_10_06
description: "Causa-raiz cravada empiricamente 10/06 noite reuniao Pedro+Ricardo+Paulo: CRM no banco (cfm_prescriptions.professional_crm) NAO afeta validacao ITI - sao 2 coisas separadas. ITI extrai CRM do certificado ICP-Brasil FISICO embutido na assinatura PKCS#7 (sempre valida OK). PDF visual renderiza do banco (sempre saiu vazio porque Vitrine salva CRM em users.council_state nao em users.crm - bug arquitetural pre-existente). Por isso empresas/pacientes percebem 'falta CRM' mesmo com assinatura juridicamente valida. 3 causas-raiz mapeadas: (1) Vitrine -> council_state; (2) signed_pdf_url NULL; (3) imutabilidade pos-signed = correto. Fix sem regressao mapeado pra proxima sessao."
type: feedback
---

# Causa-raiz CRM vazio nas prescricoes: ITI valida cert fisico, PDF visual le banco

## Pergunta original (Pedro 10/06)

> "Por que todas as emitidas no app tinham CRM fake/vazio mesmo validando ITI?
> Agora ta correto? Vai resolver pra escala sem regressao funcional 100%?"

## A diferenca cravada empiricamente

**Validacao ITI ≠ Display visual do PDF**. Sao 2 coisas separadas:

| O que o ITI faz | O que mostra no PDF visual |
|---|---|
| Extrai certificado digital ICP-Brasil embutido na assinatura PKCS#7 | Renderiza HTML com dados do banco (cfm_prescriptions.*) |
| CRM esta NO CERTIFICADO (junto com nome, CPF, CNPJ, especialidade) | Se professional_crm = '', cabecalho fica vazio |
| Verifica integridade cadeia de confianca (AC > AC Raiz > ICP-Brasil) | Nao verifica nada - so renderiza string |
| Portal validar.iti.gov.br mostra: "Assinado por RICARDO VALENCA - CRM 5253203" (do certificado) | Mostra o que esta no banco |

**Por isso ITI sempre validou OK** mesmo com `professional_crm = ''` ou fake (123456, 000000) - o certificado fisico do medico TEM o CRM dele. Mas o **PDF visual saia sem CRM** porque o campo no banco estava vazio.

Empresas/farmacias olham o **visual** (raramente abrem portal ITI). Por isso problema ficava "escondido" - validacao juridica passava, percepcao humana flagrava ausencia.

## Audit empirico cravado (10/06 noite)

Estado por tipo de documento no banco:
- 45 receitas simples: 11 com ITI valido, **6 com CRM** (mas eram "000000" Ricardo + "123456" Eduardo = TESTES fake)
- 7 atestados: 3 signed, **2 com CRM** (drafts de Eduardo, "123456")
- 7 special: 3 com ITI valido, **2 com CRM** (testes)

**Ultimas 8 prescricoes SIGNED do Ricardo (5 receitas + 3 atestados)**: TODAS com `professional_crm = ''`. Mesmo as 4 que tem `signed_pdf_url` persistido em storage.

→ **Sistema NUNCA capturou CRM real do Ricardo em nenhum documento signed**. ITI validou TODOS os 8 mesmo assim, porque cert fisico do Ricardo tem CRM 5253203-7.

## Onde Ricardo cadastrou o CRM

`users.council_state = '5253203-7'` ✅ (campo errado/confuso na Vitrine)
`users.crm = NULL` ❌ (campo que QuickPrescriptions.tsx:364 le)

**Frontend da Vitrine grava em `council_state`** (campo de origem reconhecido). **Frontend de Prescription le de `users.crm`** (esperado). Os 2 nao se conversam.

→ Bug arquitetural pre-existente, **nao tocado nos commits recentes**. Visivel agora porque Ricardo testou emitir atestado pra paciente externo (Alexandre Magno Steglich) pela 1a vez - empresa do paciente cobra CRM visual.

## 3 causas-raiz cravadas

### Causa 1 - Vitrine grava em campo errado
- Frontend da Vitrine: UPDATE `users.council_state = '<CRM>'`
- Frontend de Prescription: SELECT `users.crm` (vem NULL)
- Resultado: CRM cadastrado mas invisivel pra prescricao

### Causa 2 - signed_pdf_url NULL
- Edge `sign-pdf-icp` (Lock V1.9.299) assina o PDF mas nao persiste no storage
- Cada visualizacao gera PDF on-the-fly via window.open + handlePrintPrescription
- Sem auditoria pos-emissao + paciente nao pode rebaixar depois

### Causa 3 - Imutabilidade pos-signed (CORRETO, manter)
- Trigger `fn_cfm_prescriptions_immutability()` bloqueia UPDATE em campos profissionais pos `status = 'signed'`
- Erro: "Imutabilidade CFM: dados do profissional nao podem ser alterados apos status=signed"
- **Comportamento juridico correto** - anti-adulteracao pos-assinatura digital
- Workaround: medico cria NOVO documento se houver erro

## Fix HOJE 10/06 (urgente, aplicado via PAT - paciente esperando)

```sql
UPDATE public.users
   SET crm = '5253203-7'
 WHERE id IN ('2135f0c0-...', '99286e6f-...');  -- Ricardo prof + admin
```

Aplicado com sucesso. Ricardo logando e recarregando o app pega `crm` via `useAuth()`. Proximas prescricoes/atestados ja vem com CRM automatico.

Atestado fb99247f (do Alexandre Magno Steglich) **NAO pode ser editado** (trigger imutabilidade). Ricardo cria NOVO atestado mesmo texto → vai sair correto.

## Fix arquitetural pra proxima sessao (sem regressao)

### Fase 1 - Alinhar Vitrine -> users.crm
- Grep componente que salva CRM no Vitrine (procurar UPDATE users... council_state)
- Trocar pra UPDATE users.crm OR adicionar gravacao em AMBOS campos
- Type-check + smoke + commit + push 4 refs

### Fase 2 - QuickPrescriptions fallback defensivo
- Alterar `professional_crm: (user as any)?.crm || ''`
  para `professional_crm: (user as any)?.crm || (user as any)?.council_state || ''`
- Backwards-compat: medicos que ja cadastraram via Vitrine antes nao precisam reentrar

### Fase 3 - Backfill medicos existentes
- SELECT users.id, council_state FROM users WHERE council_state IS NOT NULL AND crm IS NULL
- UPDATE users SET crm = council_state pra esses (so backfill, nao quebra)
- Smoke: emitir prescricao apos backfill

### Fase 4 - signed_pdf_url persistencia
- Estudar Edge sign-pdf-icp (Lock V1.9.299 PBAD AD-RB - nao tocar logica assinatura)
- Adicionar passo final: upload do PDF assinado em storage bucket
- UPDATE cfm_prescriptions SET signed_pdf_url = '<storage url>'
- Smoke: assinar nova prescricao -> conferir signed_pdf_url populated

## Locks intocados em todas as fases

- Edge sign-pdf-icp logica assinatura ICP-Brasil PBAD AD-RB CONFORME ITI ✅ NAO TOCAR
- Trigger fn_cfm_prescriptions_immutability ✅ MANTER (juridicamente correto)
- Cadeia confianca certificado fisico ✅ NAO TOCAR
- Validacao ITI portal ✅ INDEPENDENTE do nosso banco

## Frase ancora

> "10/06 noite cravado empiricamente: ITI valida certificado FISICO do medico (CRM ja embutido), PDF visual le do banco (campo professional_crm). 2 vidas separadas. Sistema NUNCA capturou CRM real do Ricardo em nenhum dos 8 signed mais recentes - mas ITI sempre validou OK. Bug arquitetural: Vitrine salva em council_state, Prescription le crm. Fix urgente via PAT aplicado pra Ricardo emitir atestado HOJE. Fix arquitetural sem regressao mapeado em 4 fases pra proxima sessao (Vitrine align + fallback defensivo + backfill + storage signed_pdf). Locks 8 intocados em todas fases."
