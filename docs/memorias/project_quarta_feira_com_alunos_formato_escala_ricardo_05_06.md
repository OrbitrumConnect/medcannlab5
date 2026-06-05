---
name: project_quarta_feira_com_alunos_formato_escala_ricardo_05_06
description: "Formato escala que João Vidal arquitetou na reunião 05/06 noite: 'Quarta-feira com os alunos' — ritual semanal recorrente onde Ricardo abre o dia-a-dia da plataforma, convida Eduardo Faveret + Fernando Bossa como participantes recorrentes, mostra como está sendo a operação. Trade de ideias ao vivo. Curva 30→60→90→1000 alunos. Anchor John 'mundo paga R$1k por cara, 1 dólar por usuário que deu like/curtiu/pagou'. Posicionamento Ricardo: NÃO dono de plataforma famosa, é PROFESSOR que se expôs a formar alunos e desenvolveu um modelo. Pré-condições técnicas hard pré-lançamento: TRL/Ensino infra (7 tabelas zeradas hoje) + Manual v1.1 Eduardo + funil aquisição alunos."
type: project
---

# "Quarta-feira com os alunos" — formato escala Ricardo + Eduardo + Fernando

## A ideia (João arquitetou na mesa)

Reunião 05/06 noite. João Vidal propôs e Ricardo recebeu bem:

> *"O quarta-feira com os alunos é mais pra tipo assim você abrir como é que seria o dia a dia, como é que tá sendo o dia a dia. 1.000 alunos. O Eduardo e o Fernando, qualquer profissional vai desejar participar com você, trocando ideia com opiniões."*

**Mecânica proposta**:

- Ritual semanal **toda quarta-feira** com horário fixo (TBD).
- Ricardo conduz: abre o dia-a-dia da plataforma, mostra casos (anonimizados), discute método AEC, discute racionalidades, formação clínica.
- Convidados recorrentes: **Dr. Eduardo Faveret** (neuro) + **Dr. Fernando Bossa** (precisa confirmar contato/aceite) + *"qualquer profissional vai desejar participar"*.
- Formato: trade de ideias + opiniões ao vivo (podcast / live / encontro síncrono).
- Audiência: alunos da plataforma + público externo (futuramente monetizado).

## Curva projetada

```
Fase 1:  30 alunos      → quarta-feira como ritual interno
Fase 2:  60 alunos
Fase 3:  90 alunos
Fase N:  1.000 alunos   → ritual virou marca
```

João anchor de mercado: *"Brasil Nova York recebe 1M pessoas por YouTube. O mundo paga R$ 1.000 por cara, irmão. Um dólar para cada usuário que está lá, deu like, curtiu — que pagou ainda."*

## Posicionamento Ricardo (postura institucional)

Ricardo cravou textualmente:

> *"Eu quero chegar não com um projeto famoso 'olha a minha plataforma' — não é nesse sentido. É 'olha como um professor dentro de um curso de semiologia foi transformado. Eu me expus ao processo de formar alunos e nesse processo eu desenvolvi um modelo.'"*

**Não-postura**: dono-de-startup vendendo produto.
**Postura assumida**: professor universitário que se expôs ao processo de formação, e no caminho desenvolveu metodologia (AEC + Constituição). A plataforma é consequência, não protagonista.

Implica: comunicação institucional, landing, podcast precisam refletir essa postura — NÃO copiar template "founder vende solução".

## Pré-condições técnicas hard pré-lançamento

Pra "quarta-feira com 1.000 alunos" sair do plano pra real, infra que NÃO existe operacional hoje:

| Componente | Status hoje | Gap pra ritual |
|---|---|---|
| Tabelas TRL/Ensino (7 tabelas) | zeradas (audit 21/05 confirmou) | precisa Eduardo + Ricardo definir conteúdo Manual v1.1 |
| Conteúdo curso AEC formal | parcial (kb-curso-aec em base_conhecimento) | precisa estruturar módulos progressivos |
| Funil aquisição alunos | não existe | precisa landing + canal mídia (João arquiteta) |
| Sistema de live/podcast | não existe nativo | usar WiseCare (HOMOLOG) OR plataforma externa (Zoom/YouTube Live) |
| Sistema de monetização aluno | subscription_plans cadastrados, 0 ativos | depende Stripe + CNPJ Marco 1 |
| Sistema engajamento (gamification) | 45 rows ATIVAS mas cron monthly-closing DORMENTE | descongelar quando lançar |
| Espaço de troca aluno↔aluno | parcial (Fórum V1.9.403-410 fechado) | reutilizável, mas precisa scope ENSINO separado de PESQUISA |
| Trilha do aluno (progresso) | parcial (aluno role existe) | precisa UX + métricas |

⚠️ **NÃO comprometer publicamente** "1.000 alunos" antes de Manual v1.1 + Eduardo bater Marco 3 + Stripe gate hard + funil aquisição definido. Anti-overclaim ativo.

## Convidados confirmados / a confirmar

| Pessoa | Aceitou? | Papel proposto |
|---|---|---|
| Dr. Ricardo Valença | ✅ (conduz) | host principal |
| Dr. Eduardo Faveret | 🟡 (mencionado no plural "Eduardo e Fernando", precisa confirmar) | convidado recorrente (neuro/TEA/TDAH) |
| Dr. Fernando Bossa | ❓ (não temos contato/contexto confirmado) | convidado recorrente — confirmar com Pedro/Ricardo |
| Eduardo Rocha | ❓ (também mencionado: "Aí você pode chamar o Eduardo Rocha, o Fernando Bossa, tipo assim") | possível convidado pontual |

**Pendência Pedro**: confirmar quem são Fernando Bossa e Eduardo Rocha (contexto, contato, relação com Ricardo) — não temos registro em memória ou CLAUDE.md.

## Quando ativar formato

- ✅ **Pós-Marco 1 CNPJ** (10/06/2026) — formaliza estrutura societária pra monetizar
- ✅ **Pós-Marco 3 Eduardo operacional** — Eduardo precisa estar engajado de verdade pra ser convidado regular
- ✅ **Pós-Manual v1.1** — conteúdo base do curso documentado
- ✅ **Quando funil aquisição der primeiros 30 alunos pagantes externos reais** (não testes internos)

## Quando NÃO ativar (antes da hora)

- ❌ Lançar publicamente com Eduardo só "engajamento verbal" (status hoje 27/05 — uso operacional confirmado mas não Marco 3 completo)
- ❌ Ritual sem TRL/Ensino tabelas populadas (0 alunos reais hoje)
- ❌ Antes do Stripe gate hard funcionar (não cobra hoje)
- ❌ Sem Manual v1.1 (Eduardo precisa entregar formal — pendência Marco 3)

## Risco a flagrar

- **Confusão TRL/Ensino vs Pesquisa**: "quarta-feira com alunos" é ENSINO. Não confundir com Fórum Cann Matrix (PESQUISA, V1.9.403-410). Cada um tem escopo, RLS, audiência separada.
- **Risco "professor virou influencer"**: Ricardo declarou posicionamento institucional (professor que formou alunos). Cuidado pra ritual semanal não derivar pra "celebridade clínica" — fere identidade declarada.
- **Risco engajamento Eduardo**: se Eduardo abandonar de novo (como fez 05/05 → voltou 26/05), ritual semanal vira pressão pública. Não comprometer participação dele sem confirmação formal.

## Conexões

- `project_eduardo_faveret_no_app_sharing_validado_27_05` — Eduardo operacional desde 27/05
- `project_reuniao_4_socios_26_05_eduardo_engajando_marco_3_destravando` — Marco 3 destravando
- `project_modelo_pricing_ricardo_122_relatorio_70k_drc_05_06` — modelo comercial paralelo
- `project_reuniao_pedro_ricardo_joao_05_06_visao_jantar_marco1_pricing` — mãe deste plano
- `feedback_anti_overclaim_lista_atualizada_pos_reuniao_4socios_26_05` — anti-overclaim Eduardo/escala
- `feedback_plataforma_fact_checker_e_caixa_real_14_05` — caixa real vs promessa

## Frase ancora

> *"05/06 jantar João arquitetou e Ricardo recebeu: 'quarta-feira com os alunos' = ritual semanal recorrente, Ricardo abre dia-a-dia da plataforma, convida Eduardo Faveret + Fernando Bossa (confirmar contato) como participantes recorrentes. Curva 30→60→90→1000 alunos. Posicionamento Ricardo cravado: NÃO dono de plataforma famosa, é PROFESSOR que se expôs a formar alunos e desenvolveu modelo. Pré-condições hard pré-lançamento público: TRL/Ensino infra (7 tabelas zeradas hoje) + Manual v1.1 Eduardo + funil aquisição alunos + Stripe gate hard + CNPJ Marco 1. Não comprometer '1000 alunos' antes dessas pré-condições. Anti-overclaim ativo."*
