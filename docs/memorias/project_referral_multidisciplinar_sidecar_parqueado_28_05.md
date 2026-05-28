---
name: referral-multidisciplinar-sidecar-parqueado-28-05
description: "Feature de coordenação multidisciplinar PARQUEADA empíricamente 28/05 ~01h BRT. Proposta Pedro: quando sidecar (Renal/Neuro/futuros) detecta sinal fora da especialidade do médico atual do paciente, card oferece opção (1) Indicar profissional da equipe clínica do paciente OU (2) Adicionar pro disponível na área via vitrine. Reusa estrutura existente: DoctorRelationCard parqueado (memory 18/05) + Vitrine médicos + Sharing cross-account (validado 27/05 Eduardo). Materializa Marco 3 (multi-médico) via uso real. Princípio compressão estrutural preservado (card sinaliza + facilita; médico decide). 4 opções timing/escopo apresentadas: A completa 6-8h / B MVP 2-3h / C parqueado (escolhido) / D UI hint 15min. 3 triggers explícitos pra desparquear. Riscos vigiados: CFM referral médico-médico + LGPD consent paciente + marketplace livre responsabilidade clínica + Babylon-pattern se mal feito. Anti-cristalização-prematura aplicado: ZERO caso empírico real ainda (Eduardo entrou 27/05; Ricardo não bateu necessidade)."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🤝 Referral Multidisciplinar Sidecar — PARQUEADO 28/05 madrugada

## Proposta Pedro (28/05 ~00h55 BRT)

> *"caso um paciente faça AEC e apareça questões que um profissional não cuida como card! no mesmo card poderia ter uma opção de indicar para alguém da equipe clínica dele ou caso ele não tenha aquele profissional na equipe oferece um pro na área para ele por na equipe caso esteja apto livre? Já ajuda e inicia melhor tbm a relação entre profissionais usando a área de equipe clínica duvida... e coerente?!"*

## Cenário empírico que motivou proposta

**Hoje (sem feature)**:
- Ricardo (nefro) atende paciente com queixa DRC
- Sidecar Neuro detecta 4 sinais TDAH compatíveis (smoke manual V1.9.475-C)
- Ricardo vê Card Neuro mas NÃO trata TDAH
- Sinal fica órfão (não-tratado)

**Com feature (proposta)**:
- Card Neuro mostra trigger: *"Indicar Dr. Eduardo Faveret (na equipe)"*
- OU se Eduardo não está na equipe do paciente: *"Adicionar Dr. Eduardo Faveret via vitrine"*
- Sinal vira ponte médico ↔ médico → Marco 3 materializa via uso real

## Análise empírica de coerência

### 🟢 Por que faz sentido arquiteturalmente

| Eixo | Justificativa |
|---|---|
| **Princípio compressão estrutural preservado** | Card não diagnostica + não decide conduta. Sinaliza + facilita redirecionamento |
| **Reusa estrutura existente** | DoctorRelationCard parqueado (memory 18/05) + Vitrine médicos + Sharing cross-account (validado 27/05) |
| **Marco 3 materializa empíricamente** | Eduardo entrou 27/05; agora PRECISA de ponte concreta com Ricardo — referral via sidecar É essa ponte |
| **Wedge competitivo** | Poucas healthtechs têm coordenação multidisciplinar fluida |
| **Alinhado fronteira info farmacológica** | Sistema organiza acesso entre médicos; NÃO decide quem trata o quê |

### 🟡 Riscos vigiados (CRÍTICOS pra implementação futura)

| Risco | Mitigação necessária |
|---|---|
| **CFM referral médico-médico** | Termo formal entre médicos (advogado validar) |
| **LGPD compartilhamento dados** | Fluxo: paciente AUTORIZA referral antes de enviar sinal cross-médico |
| **Marketplace livre — responsabilidade clínica** | Convite + aceite EXPLÍCITO médico antes de entrar na equipe |
| **Babylon-pattern** ("IA decide quem você indica") | UX deixar CLARO: Card SUGERE candidato, médico DECIDE |
| **Conflito de interesse** | Disclosure se sócio recomenda sócio (anti-overclaim) |

## 4 opções timing/escopo apresentadas

| Opção | Custo | Risco | Quando faz sentido |
|---|---|---|---|
| A — Feature completa (referral + dropdown equipe + marketplace + LGPD consent + backend) | ~6-8h dev + smoke pesado + revisão jurídica | 🔴 Alto (sem caso empírico) | Só após Marco 2 + 5+ pacientes externos OR trigger empírico Ricardo/Eduardo |
| B — MVP simples (botão "Indicar pra outro médico" + dropdown estático da equipe atual) | ~2-3h dev | 🟡 Médio | Quando Ricardo bater empíricamente |
| **C — Parquear memory + triggers** | **15min** | 🟢 Zero | **ESCOLHIDA** — anti-cristalização-prematura |
| D — UI hint visual "Em breve" no card | ~15min | 🟢 Zero | Bom pra mostrar roadmap aos médicos sem codar |

## 3 triggers EXPLÍCITOS pra desparquear

1. **Ricardo bater empíricamente**: *"queria indicar caso TDAH pra Eduardo, como faço?"*
2. **Eduardo bater empíricamente**: *"tenho paciente com queixa renal, queria indicar Ricardo"*
3. **Marco 2 paciente externo real** com sinal fora especialidade do médico atual dele

## Custo estimado quando desparquear (B → A)

### Fase B MVP (~2-3h)
- Botão "Indicar pra outro médico" no Card Neuro/Renal
- Dropdown estático da equipe clínica atual do paciente (vínculo `appointments`)
- Salvar referral em tabela `clinical_referrals` (nova)
- Email pro médico-alvo (Resend)

### Fase A completa (~6-8h, depois B)
- Marketplace de médicos via Vitrine (médicos opt-in)
- Filtro por especialidade + disponibilidade
- LGPD consent flow do paciente
- Aceite/recusa do médico-alvo
- Dashboard "Minhas indicações pendentes" (médico-alvo)
- Audit log referrals

## Por que parquear é o correto agora (anti-cristalização-prematura)

- ❌ ZERO caso empírico real ainda
- ❌ Ricardo NÃO bateu necessidade
- ❌ Eduardo entrou 27/05 (só simulou paciente; ainda não atendeu real)
- ❌ Marco 2 (paciente externo) NÃO materializou
- ❌ Codar agora = especulação sobre fluxo que não existe na prática

**Trigger empírico → cristalização → código.** Sem trigger, parquear.

## Componentes técnicos que serão reusados quando ativar

| Componente | Status |
|---|---|
| `DoctorRelationCard` parqueado | Memory 18/05 já documenta design |
| Vitrine médicos | Eduardo cadastrado 27/05 (URL `/p/<slug>`) |
| Sharing relatórios cross-account | Validado 27/05 (Pedro → Eduardo, email chegou) |
| Sidecar pattern (Renal V1.9.307 + Neuro V1.9.475) | Container Sidecars Cognitivos V1.9.477 pronto |
| RLS BD por paciente-médico | Já implementado em `appointments` |
| `clinical_referrals` (nova tabela) | A ser criada Fase B |

## Princípios meta-arquiteturais aplicáveis

1. **Compressão estrutural** — card SINALIZA candidato + facilita; médico DECIDE
2. **Hierarquia inviolável** — médico prescreve/indica; sistema documenta
3. **Anti-Babylon** — sistema NÃO decide quem indicar; oferece + médico escolhe
4. **Fronteira info farmacológica análoga** — sistema organiza acesso; NÃO participa da decisão clínica
5. **Defense in depth** — disclosure + consentimento + aceite explícito + audit log

## Frase âncora

> *"Feature multidisciplinar é evolução natural do sidecar pattern + Marco 3. Coerente arquiteturalmente, parqueada empíricamente até trigger real materializar. Anti-cristalização-prematura aplicado: zero caso real hoje, codar = especulação sobre fluxo que não existe."*

## Próxima sessão Claude que tocar referral

1. Verificar se algum trigger materializou (Ricardo bateu? Eduardo bateu? Marco 2 chegou?)
2. Se SIM trigger: implementar Fase B MVP (~2-3h) seguindo design proposto
3. Se NÃO trigger: manter parqueado, registrar em diário sessão atual
4. Se Fase B implementada: monitorar uso real (audit referrals criados/aceitos/recusados)
5. Fase A completa só APÓS Marco 2 + Fase B validada empíricamente

## Conexões

- [[project_doctor_relation_card_design_18_05]] — design DoctorRelationCard parqueado
- [[project_eduardo_faveret_no_app_sharing_validado_27_05]] — sharing cross-account validado
- [[project_universo_sinais_neuro_tea_tod_tdah_mapa_completo_27_05]] — mapa neuro Fase A
- [[feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05]] — princípio análogo aplicável
- [[feedback_anti_overclaim]] — disclosure + transparência referral

## Anti-padrões a vigiar quando ativar

- ❌ Card "sugerir" automático sem opção médico recusar
- ❌ Marketplace livre sem aceite explícito médico (responsabilidade clínica)
- ❌ Email referral sem consentimento paciente (LGPD)
- ❌ Sócio recomendar sócio sem disclosure (anti-overclaim)
- ❌ Algoritmo "decidindo melhor médico" sem transparência (Babylon-pattern)
