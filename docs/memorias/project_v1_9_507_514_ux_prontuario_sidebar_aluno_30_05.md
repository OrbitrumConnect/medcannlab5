---
name: v1-9-507-514-ux-prontuario-sidebar-aluno-30-05
description: "30/05/2026 manhã (~03h30-07h BRT) — Sessão UX maratona 8 commits seguidos polindo prontuário PatientsManagement + Sidebar global + AlunoDashboard responsivo, todos triggered por feedback empírico Pedro+Ricardo testando interface real. V1.9.507 Layout C header limpo (busca migrada pro sidebar) + V1.9.508 enxugamento filtros (-108 linhas Specialty/Clinic/Sala) + V1.9.509 header superior eliminado (← + Novo migrados pro sidebar) + V1.9.510 dark/glass colors substituindo verde puro + cards side-by-side quando aplicável + V1.9.511 metrics Atendimentos/Faltas/Serviços reposicionados pos-tabs + Resumo margem leve + V1.9.512 botão Novo color alinhado paleta dark/glass + V1.9.513 Sidebar auto-collapse desktop ao entrar Terminal de Atendimento (mobile early-return preservado) + V1.9.514 AlunoDashboard grid responsivo previsível 3 cols mobile / 6 cols desktop (substituiu flex-wrap inconsistente). Princípio meta cristalizado 28/05 aplicado empíricamente nos 8 commits: validação empírica via screenshot > plano teórico — cada commit nasceu de Pedro flagrando regressão visual na UI real (não de hipótese)."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# V1.9.507-514 — Sessão UX prontuário + Sidebar + AlunoDashboard

## Visão geral

**8 commits seguidos** em ~3h30min madrugada/manhã 30/05/2026 polindo interface de 3 áreas distintas mas inter-dependentes:
1. **Prontuário** (PatientsManagement.tsx) — 6 commits (V1.9.507-512)
2. **Sidebar global** (Sidebar.tsx) — 1 commit (V1.9.513)
3. **AlunoDashboard** (AlunoDashboard.tsx) — 1 commit (V1.9.514)

Cada commit foi cirúrgico, ~10-50 linhas mudadas, type-check verde, push 4 refs OK. Zero regressão clínica.

## Tabela cronológica (8 commits)

| Versão | Commit | Trigger empírico | Mudança técnica |
|---|---|---|---|
| **V1.9.507** | `c1bb0ac` | Feedback Ricardo: "no prontuário ao lado de buscar nome tem algumas outras áreas com especialidades..." | Layout C aprovado por Pedro ("c fica top pro né?"). Busca de nome migrada do header pro sidebar (acima da lista de pacientes). Header superior simplificado. |
| **V1.9.508** | `77016a0` | Pedro: "ok é só remover e ajustar o que eu falei mesmo sem mto mistério amigão" | Removidos: state `showFilters`, `selectedSpecialty`, `selectedClinic`, arrays `specialties[]` + `clinics[]`, `useEffect fetchProfessionals`, import Filter, lógica filtro de sala. **-108 linhas**. |
| **V1.9.509** | `10d7286` | Pedro: "Pacientes Ativos 34/34 'novo paciente' pode ficar aqui do lado pois só ele está ocupando espaço desnecessário em cima" | Header superior completamente ELIMINADO. Botão ← (voltar) + botão "Novo Paciente" migrados pro sidebar acima da lista. |
| **V1.9.510** | `8af6ec2` | Pedro: "+ Nova Evolução, 💬 Chat - esses 2 triggers muito verdes não está padrão app hightech sofisticado!" + "aqui por exemplo na Carolina esses 2 cards como qlqr outro qndo aparecer pode ser side-by-side não tão estenço grande?!" | **Cores trocadas**: "+ Nova Evolução" → `bg-emerald-500/20 text-emerald-300 border-emerald-500/40` / "Chat" → `bg-blue-500/20 text-blue-300 border-blue-500/40`. **Cards Resumo** (allergies/medications/bloodType): grid 2-col condicional quando aparecem juntos. |
| **V1.9.511** | `e5540c8` | Pedro: "Atendimentos \| Faltas \| Serviços essa parte de cima não teria que ficar embaixo?!" + "ou não? to vendo aqui acho que talvez não né" | Metrics Atendimentos/Faltas/Serviços REPOSICIONADAS abaixo das tabs (era topo). Cards Resumo ganharam `gap-2 + bg-slate-800/40` individual com margem leve. |
| **V1.9.512** | `cab711e` | Pedro: "Novo de novo paciente azul tá feio também" | Botão "Novo" (paciente) — color alinhada com paleta V1.9.510: `bg-emerald-500/20 text-emerald-300 border-emerald-500/40`. Coerência visual com "+ Nova Evolução". |
| **V1.9.513** | `e1833af` | Pedro: "quando profissional abre o terminal de atendimento o trigger reduzir automaticamente pode acionar para melhor experiência?" + "no web no caso" | Adicionado `[autoCollapsedOnTerminal, setAutoCollapsedOnTerminal] = useState(false)` em [Sidebar.tsx](src/components/Sidebar.tsx) + useEffect que detecta URL `terminal-clinico` + auto-colapsa sidebar (desktop apenas, mobile early-return preservando UX original). |
| **V1.9.514** | `87a937d` | Pedro: "aluno parece ter algo errado no mobile e web aqui analisar!" | [AlunoDashboard.tsx](src/pages/AlunoDashboard.tsx) trocou `grid grid-cols-3 gap-2 md:flex md:flex-wrap md:gap-3` por `grid grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3`. Mudou breakpoints `md:` → `lg:` nos 6 botões individuais (aspect ratio + text size). Grid previsível 3 cols mobile / 6 cols desktop substituindo flex-wrap inconsistente. |

## Princípio meta confirmado empíricamente (cristalizado 28/05)

**[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05](feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05.md)** aplicou-se 8x consecutivas hoje:

**Cada commit V1.9.507-514 nasceu de Pedro flagrando regressão/problema visual na UI real**, NÃO de plano teórico:
- "tem algumas outras áreas com especialidades" → empírico (Ricardo viu)
- "Pacientes Ativos 34/34 ocupando espaço desnecessário" → empírico (Pedro viu na tela)
- "+ Nova Evolução verde demais" → empírico (Pedro flaggou cor)
- "cards side-by-side não tão estenço grande" → empírico (Pedro viu no caso Carolina)
- "Atendimentos parte de cima não teria que ficar embaixo" → empírico (Pedro testou + voltou atrás "ou não? acho que talvez não né")
- "aluno parece ter algo errado mobile e web" → empírico (Pedro testou)

**Anti-padrão evitado**: planejar refator grande baseado em "vamos polir o layout do prontuário". Em vez disso: tela → screenshot → 1 mudança cirúrgica → push → próxima.

## Pattern UX cristalizado

### "Sidebar carrega navegação + ações; header carrega só contexto"
Tudo que é navegação (busca, novo, voltar, filtros) migrou pro sidebar. Header virou só identificador de contexto (nome do paciente, breadcrumb). Reduziu cognitive load.

### "Cards de informação condicional side-by-side quando aparecem juntos"
Allergies + Medications + BloodType: cada um sozinho ocupa linha cheia. Quando 2-3 aparecem juntos: grid 2-col + gap-2. Diferenciado do anti-pattern "tudo sempre side-by-side" (que vira denso quando 1 aparece sozinho).

### "Cores dark/glass tonalidade 20/300/40 substituindo solid 500"
Verde puro `bg-emerald-500` → `bg-emerald-500/20 text-emerald-300 border-emerald-500/40`. Mantém semântica de cor (verde = ação positiva) sem peso visual de botão "primário" forte. Mais alinhado com paleta dark/glass do resto do app.

### "Auto-comportamentos desktop-only com mobile early-return"
Auto-collapse sidebar em Terminal de Atendimento só faz sentido desktop (mobile já é collapsado). Pattern: detectar viewport antes de aplicar comportamento. Aplicado em V1.9.513.

### "Grid responsivo previsível > flex-wrap inconsistente"
6 botões em flex-wrap quebram diferente conforme largura intermediária. Grid `cols-3 lg:cols-6` quebra previsível: sempre 3 cols mobile, sempre 6 cols desktop. Sem estados intermediários esquisitos.

## Limitações conhecidas (não bloqueiam)

- **5 AECs interrupted órfãs** continuam empíricamente — UI V1.9.500 (Sprint A 29/05) entrega o card pro médico decidir, mas decisão clínica Ricardo pendente
- **Cl 8.3 + 10.2 Take Rate** continuam zona cinzenta vínculo trabalhista (Claude2-3 flag, advogado decide pós-CNPJ)
- **3 médico profissional puro** não vê AECs interrupted no card (RLS sem caminho via appointments) — pendência Marco 3

## Commits + push

```
87a937d V1.9.514  fix(aluno): grid responsivo previsivel
e1833af V1.9.513  feat(sidebar): auto-collapse desktop Terminal Atendimento
cab711e V1.9.512  fix(prontuario): botao Novo alinhado paleta
e5540c8 V1.9.511  fix(prontuario): metricas pos-tabs + Resumo margem
8af6ec2 V1.9.510  fix(prontuario): dark/glass + cards side-by-side
10d7286 V1.9.509  feat(prontuario): header superior eliminado
77016a0 V1.9.508  feat(prontuario): enxugamento filtros
c1bb0ac V1.9.507  feat(prontuario): Layout C header limpo
```

Push 4 refs OK em todos. Type-check verde. Locks intocados.

## Conexões

- [[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05]] — princípio meta aplicado 8x hoje
- [[project_v1_9_477_renal_compact_sidecars_cognitivos_28_05]] — sessão similar (5 iterações empíricas) 2 dias antes
- [[project_v1_9_500_interrupted_aecs_card_29_05]] — UI Dashboard Profissional ontem
- [src/pages/PatientsManagement.tsx](src/pages/PatientsManagement.tsx) — alvo principal V1.9.507-512
- [src/components/Sidebar.tsx](src/components/Sidebar.tsx) — alvo V1.9.513
- [src/pages/AlunoDashboard.tsx](src/pages/AlunoDashboard.tsx) — alvo V1.9.514

## Frase âncora

> *"30/05 madrugada/manhã ~3h30: 8 commits UX cirúrgicos seguidos (V1.9.507-514) — Layout C prontuário + filtros enxutos + header eliminado + dark/glass cores + cards side-by-side + métricas reposicionadas + Novo color alinhado + Sidebar auto-collapse Terminal desktop + AlunoDashboard grid responsivo previsível. Cada commit nasceu de Pedro/Ricardo flagrando empíricamente na UI real (NÃO de plano teórico). Princípio meta cristalizado 28/05 aplicado 8x consecutivas. Pattern: tela → screenshot → 1 mudança cirúrgica → push → próxima. Zero regressão clínica, zero refator grande, zero anti-Babylon."*
