---
name: Paciente externo real estressa arquitetura diferente de teste interno
description: Smoke interno termina em "PDF gerado + assinatura válida"; smoke externo termina em "receptor aceita o PDF". Caso João Guimarães 25/05 expôs gap operacional que Carolina/Pedro/Dayana (testes internos) nunca pegariam. Frase âncora Pedro "ricardo sempre vem com uma!"
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Paciente externo real estressa arquitetura ≠ teste interno

**Rule**: Toda feature de OUTPUT (PDF, NFT, link share, email) que chegará a paciente externo real PRECISA de **Smoke 3 EXTERNO operacional** ANTES de Marco 2 (20-30 pacientes pagantes). Smoke interno NÃO substitui smoke externo.

**Why** — caso empírico paradigmático:

Carolina, Pedro, Dayana testaram TUDO do fluxo IA → assinatura → PDF gerado em 100+ AECs ao longo do mês. NENHUM levou o PDF a receptor externo real (laboratório, farmácia, hospital). João Guimarães foi o **1º paciente externo real do mês** a fazer isso, em 25/05 17:46-18:44 BRT. Atendente do laboratório recusou agendar exames porque PDF não tinha QR Code visual escaneável.

Gap operacional empírico que ZERO testes internos pegariam, porque:
- Smoke interno: "PDF gerado + selo visual presente + Adobe valida"
- Smoke externo: "atendente do laboratório aceita o PDF e agenda os exames"

São 2 critérios qualitativamente diferentes. O 2º só aparece quando paciente real bate em receptor real.

## Definição operacional

**Smoke 3 EXTERNO** = teste real com:
1. Paciente externo (NÃO conta de sócio/admin/teste interno)
2. Receptor externo (laboratório, farmácia, secretaria hospital, instituição)
3. Validação de fluxo end-to-end pela perspectiva do receptor, NÃO do emissor

Cada peça de OUTPUT tem o seu "atendente do laboratório":
- PDF de exame → atendente lab
- Receita controlada → balcão farmácia
- Atestado → RH empresa
- NFT consent → auditor jurídico
- Link share → médico não-cadastrado

## Frase âncora Pedro 25/05 noite

> *"ricardo sempre vem com uma!"*

Captura dinâmica empírica do projeto pré-PMF: Ricardo (médico ativo único) constantemente expõe gaps que testes sintéticos não pegam, porque ele é o ÚNICO médico que opera o sistema empíricamente com pacientes reais. À medida que paciente real entra (Maria Pitoco, João Guimarães), os gaps escalam de "Ricardo gap" pra "ecossistema gap".

## Implicação arquitetural Marco 2

Antes de Marco 2 (20-30 pacientes externos pagantes), TODA feature de output precisa de Smoke 3 externo. Lista atual de outputs a auditar:

| Output | Receptor externo | Smoke 3 atual |
|---|---|---|
| PDF assinado ICP | Laboratório / farmácia / RH | ❌ FALHOU (caso João — V1.9.455 parqueado) |
| Receita digital | Farmácia | ⚠️ não testado externamente ainda |
| Atestado médico | RH / escola | ⚠️ não testado externamente ainda |
| NFT consent | Auditor jurídico LGPD | ⚠️ não testado externamente ainda |
| Email Resend confirmação | Cliente email (Gmail, Outlook) | ✅ funciona (testado smoke) |
| Link compartilhamento report | Médico não-cadastrado | ⚠️ não testado externamente ainda |

**How to apply**:
- Antes de declarar feature de output "pronta", agendar smoke externo formal (paciente teste leva ao receptor).
- Registrar feedback do receptor literal (não interpretado).
- Se receptor recusou/teve dificuldade → gap real, não bug de paciente.
- Aceitar que cada smoke externo pode disparar V1.9.X parqueado novo.
- Marco 2 requer 100% das outputs com Smoke 3 PASS.

## Conexão com princípios anteriores

- `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05`: AEC é repelente bom de demanda fora-escopo, mas paciente legítimo no escopo gera novos gaps externos.
- `feedback_anti_overclaim_endorsements`: 4-5 reports validados internamente ≠ tração externa. Marco 2 = 20-30 pacientes pagantes COM Smoke 3 externo de cada output.
- `feedback_completar_tutorial_nao_e_absorver_24_05`: completar fluxo interno ≠ fluxo externo funcionar.

## Cristalizado

Diário 25/05 BLOCO S (caso João Guimarães). Memória meta empírica derivada do caso real.
