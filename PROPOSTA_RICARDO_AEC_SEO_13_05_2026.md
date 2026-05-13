# 🩺 Proposta — AEC pré-cadastro no SEO público

**Para:** Dr. Ricardo Valença
**De:** Pedro (CTO MedCannLab)
**Data:** 13/05/2026
**Decisão pedida:** Sim/Não/Ajuste (1-pager A4)

---

## 🎯 O que está sendo proposto

Criar uma **versão "triagem" da AEC** no SEO público (Google → MedCannLab) **antes do cadastro**, com 4 salvaguardas que preservam integralmente o método AEC autoral seu.

**Não é AEC formal.** É **organização da história clínica do paciente** antes dele decidir se quer agendar consulta médica.

Quando o paciente cadastra + agenda → AEC vira oficial, **o senhor revisa, aprova ou ajusta**, gera relatório ICP-Brasil padrão.

---

## 📊 Empírico real hoje (acesso ao banco confirmou)

| Métrica empírica | Valor |
|------------------|-------|
| AECs realizadas últimos 30d | 95 |
| Pacientes distintos | 11 (todos amigos/família/sócios) |
| Pacientes externos pagantes | **0** |
| Documentos ICP-Brasil assinados pelo Sr. | 7 (5 reais PKCS#7 desde 06/05) |
| Reports AEC com signature_hash (Pipeline V1.9.95) | 31 — **100% sign rate** |
| Custo médio por AEC | ~R$ 2,50-4 |

**Pré-PMF confirmado.** App está pronto tecnicamente, falta entrada de pacientes externos.

---

## 🛡️ 4 salvaguardas que preservam seu método autoral

| Garantia | Como funciona |
|----------|---------------|
| **1. NÃO é consulta** | Disclaimer permanente em vermelho: *"Esta é uma triagem com IA pra organizar sua história antes da consulta. Não substitui consulta médica. Não emite diagnóstico nem prescrição."* |
| **2. Sem ICP-Brasil anônimo** | O senhor continua sendo o único que assina relatórios oficiais. Triagem anônima gera apenas **preview com marca d'água "RASCUNHO — sem valor clínico"**. |
| **3. Dados expiram em 24h** | Conversa anônima é deletada automaticamente (LGPD). Só vira AEC oficial **quando paciente cadastra** e o senhor é vinculado. |
| **4. Lock V1.9.95 intocado** | Sua AEC FSM de 13 fases, o Pipeline (REPORT→SCORES→SIGNATURE→AXES→RATIONALITY→DONE), o Verbatim First e o COS Kernel **continuam intocados e exclusivos do ambiente clínico autenticado**. |

---

## 💰 Valor empírico pro Sr. (e pra MedCannLab)

### Pra você como médico
- **Paciente chega pré-organizado** — em vez de 20min repetindo sintomas, você abre o relatório, valida, ajusta, prescreve
- **Você decide quem vira AEC oficial** — paciente cadastra, você aceita ou recusa vínculo
- **Seu CRM, sua assinatura ICP, sua responsabilidade civil** — intocados, formalizados apenas pós-cadastro
- **Conversão maior em consultas R$ 350 (70% líquido = R$ 245 pro Sr.)** — paciente já viu valor antes de pagar

### Pra MedCannLab como instituição
- Funil SEO Google → triagem → cadastro → consulta sua → ICP-Brasil
- Diferenciador competitivo real (concorrentes têm chatbot raso; MedCannLab tem método AEC + ICP-Brasil empírico)
- Defensável regulatoriamente: triagem é categoria reconhecida CFM (Ada Health, Symptoma, etc.)

---

## 🔒 O que NÃO mudaria (anti-kevlar §1 respeitado)

- AEC formal continua exclusiva do ambiente autenticado, com seu método autoral 13 fases
- Anti-kevlar §1 ("Consentimento ≠ Agendamento") preservado — paciente diz "autorizo" pra fechar AEC oficial
- Constituição da Nôa Esperanza intocada
- Magno V17 documentaria essa nova categoria ("Triagem pré-cadastro") como **complemento**, não substituição

---

## 🚦 Decisão pedida do Sr.

**Opção A — Aprovo como proposto:**
> Pode rodar como triagem com disclaimer claro, expiração 24h, sem ICP, promove a AEC formal quando paciente cadastra e me vinculo.

**Opção B — Aprovo com ajustes:**
> Sim, mas mudaria X, Y, Z. (Sr. detalha)

**Opção C — Não aprovo:**
> AEC deve ser sempre formal com médico vinculado desde o início. SEO público pode ter outro produto (não AEC).

---

## ⏱️ Timeline empírica

| Quando | O que acontece |
|--------|-----------------|
| **Hoje 13/05** | Sr. responde A/B/C |
| Quinta 15/05 | Evento com 20 amigos testers (cadastrados normais — não afetado por essa proposta) |
| Sexta 16/05 | Se A/B aprovada, começo a codar (~12-15h, 2-3 commits push 4 refs) |
| 1-2 semanas | Ativação completa em produção |
| Pós-CNPJ | Stripe destrava pagamento, funil completo monetizado |

---

## 💬 Frase âncora

> *"A triagem pré-cadastro é a porta de entrada. A AEC formal — sua, com método autoral e ICP — continua sendo o ato clínico. Uma serve a outra."*

---

Aguardo sua decisão. Qualquer dúvida, me chama.

Pedro Henrique Passos Galluf
CTO MedCannLab
phpg69@gmail.com
