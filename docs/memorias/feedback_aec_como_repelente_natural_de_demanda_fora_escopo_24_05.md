---
name: AEC é repelente natural de demanda fora-escopo (3 recalibrações Pedro 24/05 manhã)
description: Pedro recalibrou Claude 3x em sequência num único dia (24/05 manhã) corrigindo viés "usuário não terminou fluxo = problema do produto". Empiricamente provado: 89.8% chat livre vs 2% AEC formal. Auto-seleção saudável > onboarding inflado. Função emergente boa, não bug
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# AEC é repelente natural de demanda fora-escopo

**Rule**: Antes de propor fix de produto baseado em "usuário abandonou/se frustrou", validar se ele pertencia ao escopo. Auto-seleção saudável > onboarding inflado.

**Why** — Pedro me forçou a recalibrar 3 vezes na mesma conversa (24/05 manhã). Cada vez eu cheguei a uma conclusão que ele desmontou empíricamente:

### Pass 1 — Eu disse: *"AEC tem falha de design pra casos eletivos"*

Baseado em 2 abandonos (prima dentista siso eletivo + Illa Proença CBD). Propus pivot na fase IDENTIFICATION com adapter por especialidade.

**Pedro corrigiu**:
> *"AEC é instrumento clínico — funciona pro propósito. Quem cai fora-escopo abandona corretamente."*

### Pass 2 — Eu disse: *"Falta entrada de chat livre alternativa"*

Propus adicionar "Conversar com a Nôa" no dashboard.

**Pedro corrigiu**:
> *"Chat livre JÁ EXISTE. É o uso DOMINANTE. Você está propondo construir o que já está construído."*

### Pass 3 — Eu disse: *"Hierarquia visual confunde novato"*

Propus reordenar visibilidade.

**Pedro corrigiu**:
> *"Pessoas não vão ali pra respostas livres tipo ChatGPT. A frustração é a triagem funcionando — AEC repele quem não é caso clínico legítimo. Função emergente boa, não bug."*

## Validação empírica (audit PAT 24/05 manhã)

Distribuição últimos 30d (`ai_chat_interactions` agrupado por intent):
- **CLINICA** (chat livre): **2.129** (89.8%)
- AEC formal (trigger explícito): **48** (~2%)
- ADMIN: 106 (4.5%)
- Outros: 88 (3.7%)
- Total: 2.371

**Tradução em decisões de produto**:
- 9 em cada 10 interações IA são chat livre — não AEC
- AEC formal é alto valor regulatório (ICP, racionalidades, audit trail CFM 2.314) mas baixo volume
- Quem está no escopo (Pedro, Ricardo, Carolina, pacientes vinculados) usa chat livre todo dia
- Quem cai acidentalmente na AEC sem ser caso clínico (Illa agrônoma, prima dentista comercial) abandona — auto-seleção

## Casos canônicos empíricos

| Caso | Padrão | Veredito |
|---|---|---|
| **Prima dentista** | Cirurgia siso eletiva (Pedro: *"dentista tira siso pra ganhar dinheiro"*) — caso comercial-protocolar, não clínico legítimo | Forçou semântica, completou AEC, report saiu errado. **Não é cliente perdido — não pertence ao escopo** |
| **Illa Proença** | Agrônoma + presidente associação cannabis. Não é paciente — busca conexão institucional | Abandonou em 3min. **Auto-seleção saudável.** Caminho real dela é referral/dashboard institucional, não AEC |
| **Maria Pitoco** | Paciente externa real Ricardo | AEC concluída + relatório ICP gerado ✓ |
| **Carolina** (filha Ricardo) | Conta teste | 15 reports assinados ICP em fluxo normal ✓ |

## Padrão de erro meta (auto-correção minha)

Claude tende a ler *"usuário não terminou fluxo = problema do produto"*. Lição cristalizada: **Claude precisa de filtro "estava no escopo?" antes de propor fix de produto**.

**Frase âncora**:
> *"A rigidez da AEC É a recusa correta funcionando. Antes de propor mudar o produto baseado em 'usuário abandonou', validar se ele pertencia ao escopo. Auto-seleção saudável > onboarding inflado."*

## Implicações operacionais

1. **Pitch institucional**: *"plataforma de escuta longitudinal — chat conversacional + AEC formal como pico de valor regulatório"*
2. **Onboarding**: priorizar contextualização do chat livre, não AEC
3. **UX entrada**: dashboard paciente mostra ambos caminhos, não força AEC
4. **Manual v1.1 calibração**: explica os 2 modos honestos

**How to apply**:
- Filtro permanente "estava no escopo?" antes de qualquer proposta de fix UX baseada em abandono
- Diferenciar 4 tipos de saída do usuário: bug real / overclaim / limite metodológico / auto-seleção saudável / problema humano
- Ao propor mudar produto, primeiro verificar via PAT: o usuário era do escopo? Caso clínico legítimo?

## Conexão com princípios meta

- `feedback_chat_livre_dominante_vs_aec_minoria_24_05` — 89.8% vs 2% (dado empírico)
- `feedback_engenharia_perfeita_pode_produzir_semanticamente_inadequado_24_05` — caso prima dentista (engenharia OK, semântica não)
- `feedback_curva_aprendizado_alta_mesmo_para_socios_24_05` — Faveret abandonou (curva alta MESMO pra sócio)

## Cristalizado

Diário 24/05 BLOCO H + Retrospectiva mensal Princípio 15 (Seção 5.3). Princípio arquitetural pivotal do mês — disparou recalibração meta sobre como Claude lê comportamento de usuário.
