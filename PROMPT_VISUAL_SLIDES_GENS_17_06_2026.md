# PROMPT VISUAL — Slides Pitch MedCannLab 3.0

> **Cole este documento INTEIRO no Gemini Park / Gamma / Pitch.com / qualquer gerador de slides com IA.**
> Identidade visual extraída do código do app *(tailwind.config.ts + index.css)* + memórias cristalizadas 31/05.
> Conteúdo dos 27 slides está em `PITCH_INVESTIDOR_NARRATIVA_FUSAO_17_06_2026.md` *(v3.4)* — anexar junto.

---

## 1 · IDENTIDADE VISUAL OFICIAL (cravada no app)

### 1.1 Paleta de cores

**Cor primária — Verde Esmeralda *(60% da identidade)***
```
primary-50   #f0fdf4   (verde quase branco)
primary-100  #dcfce7
primary-200  #bbf7d0
primary-300  #86efac   (verde claro brilhante)
primary-400  #4ade80
primary-500  #22c55e   ← VERDE PRINCIPAL DA MARCA
primary-600  #16a34a   (verde forte)
primary-700  #15803d
primary-800  #166534
primary-900  #14532d   (verde forest profundo)
```

**Cor accent — Amarelo Dourado *(20% da identidade)***
```
accent-50    #fffbeb
accent-300   #fcd34d
accent-500   #f59e0b   ← AMARELO ACCENT (warning + highlight)
accent-700   #b45309
accent-900   #78350f
```

**Cor de fundo — Gradiente escuro premium**
```css
background: linear-gradient(135deg,
  #0f172a 0%,    /* slate-900 — azul-preto profundo */
  #1e293b 50%,   /* slate-800 — cinza-azulado escuro */
  #1e3a3a 100%   /* teal-900 muito escuro */
);
```

**Cores de texto e UI**
```
texto principal   #ffffff (branco) sobre fundo escuro
texto secundário  #cbd5e1 (slate-300)
texto muted       #94a3b8 (slate-400)
borda             #1e293b (slate-800) com 60% opacidade
borda destaque    #22c55e/40 (verde com 40% opacidade)
card bg           #0f172a/60 (slate-900 com 60% opacidade) — TRANSLUCENT
```

**Cores semânticas**
```
success/positivo  #22c55e (verde primary-500)
warning           #f59e0b (amarelo accent-500)
error/risco       #ef4444 (vermelho)
info              #3b82f6 (azul)
```

### 1.2 Tipografia

- **Títulos / display:** `Inter` *(weights 700 bold, 800 extra-bold, 900 black)*
- **Corpo / parágrafos:** `Inter` *(weights 400 regular, 500 medium)*
- **Números / KPIs grandes:** `Inter` *(weight 800-900)*
- **Citações / frase âncora:** `Merriweather` serif *(weight 400 italic)*
- **Código / mono:** `Fira Code`

### 1.3 Estilo geral

- **Modo escuro padrão** *(fundo gradiente escuro, texto claro)*
- **CTAs translucent emerald** *(botões verde com transparência 20-30% sobre fundo escuro)*
- **Cards com bg translúcido + borda sutil verde-esmeralda**
- **Container máximo:** 1536px *(max-w-screen-2xl)*
- **Espaçamento generoso:** padding 60-80px lateral em slides
- **Cantos arredondados:** 12-16px em cards, 8px em botões
- **Sombras suaves** verde-esmeralda com baixa opacidade *(box-shadow: 0 4px 24px rgba(34,197,94,0.15))*

---

## 2 · LAYOUTS RECORRENTES *(use esses templates)*

### Layout A — Hero / Manifesto *(slides 01 · 25)*
```
┌─────────────────────────────────────────┐
│                                         │
│    [Título Grande Inter 900]           │
│                                         │
│    Subtítulo em verde claro            │
│                                         │
│    · 5 bullets centralizados verdes    │
│    · texto branco                       │
│                                         │
│    [Mensagem-âncora em itálico]        │
│                                         │
└─────────────────────────────────────────┘
```

### Layout B — KPI Cards Grid *(slides 06 · 07 · 16 · 23)*
```
┌──────────┬──────────┬──────────┐
│   151    │    48    │   142    │
│ Relatórios│ Assinados│ Racionali-│
│          │   ICP    │  dades    │
└──────────┴──────────┴──────────┘
[Números enormes em verde · Inter 900]
[Labels em slate-300 abaixo]
```

### Layout C — Tabela *(slides 05 · 09 · 12 · 13 · 16 · 18 · 24)*
```
┌─────────────┬──────────┬──────────┐
│ Header verde│ Header   │ Header   │
├─────────────┼──────────┼──────────┤
│ Linha 1     │  valor   │  valor   │
│ Linha 2     │  valor   │  valor   │
└─────────────┴──────────┴──────────┘
[Cabeçalho bg verde-700, texto branco]
[Linhas alternadas slate-900/60 e slate-800/60]
[Borda verde-esmeralda sutil]
```

### Layout D — Timeline horizontal *(slide 10)*
```
[Etapa 1]───[Etapa 2]───[Etapa 3]───[Etapa 4]───[Etapa 5]
  Jun-Jul    Ago-Dez     2027       2028        2029
   2026       2026
  CNPJ       100        4k          20k+5       70k+14
            pacientes  usuários    equipes    equipes
[Círculos verdes conectados por linha tracejada amarela accent]
```

### Layout E — Cards de Sócios *(slide 17)*
```
┌────────────┬────────────┬────────────┬────────────┐
│ [foto/avatar]│ [foto]    │ [foto]    │ [foto]    │
│ João Vidal  │ Pedro G.  │ Dr Ricardo│ Dr Eduardo│
│ Diretor     │ CTO       │ CMO       │ Coord Cient│
│ Institucional│           │           │           │
│ [1 linha bio]│[1 linha]  │[1 linha]  │[1 linha]  │
└────────────┴────────────┴────────────┴────────────┘
```

### Layout F — Diagrama de Arquitetura *(slide 04 · 07)*
```
ESCUTA FIEL          ←  Verde escuro, borda esmeralda
     ↓
ORGANIZAÇÃO          ←  Verde médio
     ↓
SINALIZAÇÃO          ←  Verde mais claro
     ↓
DOCUMENTAÇÃO         ←  Verde claro
     ↓
ATO MÉDICO           ←  Amarelo accent (decisão humana)
[Setas verdes com gradiente]
```

### Layout G — Pizza Chart *(slides 16 · 22)*
```
Slide 16: 5 vertentes terapêuticas
  - Integrativa 74% (verde-700)
  - Biomédica 9% (verde-500)
  - Homeopática 7% (verde-400)
  - MTC 6% (amarelo-500)
  - Ayurvédica 4% (amarelo-300)

Slide 22: 5 categorias de capital
  - Regulatory 25% (verde-700)
  - Growth Tech 20% (verde-500)
  - Growth GTM 25% (verde-600)
  - Formalização 20% (amarelo-500)
  - Working 10% (verde-300)
```

### Layout H — Curva de Crescimento *(slide 12)*
```
Eixo Y: usuários (0 → 70k)
Eixo X: meses (0 → 48)
Curva: hockey stick verde esmeralda
Pontos marcados: 500 → 4k → 8k → 20k → 40k → 70k
Cor da linha: gradient #22c55e → #f59e0b
```

### Layout I — Quadrantes / 4-up *(slides 19 · 20)*
```
┌─────────────┬─────────────┐
│  Comercial  │  Societário │
│  [riscos]   │  [riscos]   │
├─────────────┼─────────────┤
│  Técnico    │ Regulatório │
│  [riscos]   │  [riscos]   │
└─────────────┴─────────────┘
```

### Layout J — Mapa Geográfico *(slide 09)*
```
Mapa do Brasil zoom em eixo RJ-SP
Pinos verdes nas 4 cidades-alvo:
  - Rio Bonito (menor) ~63k hab
  - Niterói (médio) 517k
  - Nova Iguaçu (grande) 843k
  - Santos (grande) 419k
Labels: nome + população + DRC potencial
Linha tracejada verde conectando as 4
```

---

## 3 · MAPA SLIDE-A-SLIDE (27 slides)

> Conteúdo textual completo em `PITCH_INVESTIDOR_NARRATIVA_FUSAO_17_06_2026.md`. Aqui só o layout sugerido.

| # | Título | Layout | Elementos visuais |
|---|---|---|---|
| 01 | A Medicina Está Mudando | A — Hero | 5 bullets verdes · fundo gradiente · sem imagem |
| 02 | O Que É a MedCannLab | Texto narrativo | Box destacado "beta → alpha" amarelo accent |
| 03 | O Problema | KPI grid + lista | 4 KPI cards (15M / 6,7% / 21,4% / 157k diálise) |
| 04 | Nossa Solução | 5 pilares + Diagrama F | 5 cards CONNECT/CARE/ACADEMY/RESEARCH/INTELLIGENCE + pilha arquitetura |
| 05 | Diferenciais Competitivos | Lista + Tabela C *(matriz)* | Matriz 5 categorias × 6 features × MedCannLab única com 6 ✅ |
| 06 | Tração Comprovada | B — KPI Grid 3×3 | 9 KPI cards números empíricos PAT + nota "0 pagantes externos" |
| 07 | Arquitetura e Compliance | Stack + KPI | Diagrama stack + 4 KPI cards (17 Edges · RLS 100% · 8 locks · 48 ICP) |
| 08 | Estratégia de Mercado | Texto + mapa pequeno | Mapa eixo Rio-Santos pequeno *(detalhe no Slide 09)* |
| 09 | Municípios Prioritários | Mapa J + Tabela C | Mapa GRANDE 4 cidades + tabela populações + DRC potencial + TOTAL 163k destacado |
| 10 | Action Plan 2026-2029 | D — Timeline | Timeline horizontal 5 etapas conectadas com setas verdes |
| 11 | Expansão Verticais | 3 cards lado a lado | Fase 1 Nefrologia · Fase 2 Neuro · Fase 3 Longevidade *(cores verde→amarelo gradiente)* |
| 12 | Previsibilidade Operacional | Tabela + Curva H | Tabela 6 estágios + curva hockey stick 0→70k usuários |
| 13 | Modelo de Negócios | 5 pilares + Tabela pricing | Cards B2C/B2B/Edu/Pesquisa/Dados + tabela pricing 6 produtos |
| 14 | Unit Economics | 3 cards + highlight | Cenário A/B/C em cards + DESTAQUE "Break-even = Marco 2 = 25 pagantes" |
| 15 | Track Regulatório | Lista + status table | Lista 6 eixos ANVISA/IEC/ISO + tabela status |
| 16 | O Ativo Mais Valioso | Texto + Pizza G | Texto narrativo RWE + pizza 5 vertentes terapêuticas + KPI grid |
| 17 | Equipe Fundadora | E — 4 cards sócios | 4 cards com nome + papel + 1 linha bio + avatar |
| 18 | Ativos Já Entregues | Tabela C | Tabela 8 ativos × valor reposição + TOTAL R$ 1,15M+ destacado em verde |
| 19 | Riscos e Transparência | I — Quadrantes 4-up | 4 quadrantes Comercial/Societário/Técnico/Regulatório |
| 20 | Por Que Agora | 4 colunas | 4 cards verticais ANVISA/DRC cara/Cannabis/IA gen *(setas verdes)* |
| 21 | Necessidade de Investimento | Hero + Box | R$ 2.000.000 GIGANTE + box reframe "NÃO é Build / É Growth+Reg+GTM" |
| 22 | Growth & Compliance Capital | Pizza G + Tabela | Pizza 5 categorias + tabela detalhamento Formalização Patrimonial |
| 23 | Valuation | Hero + 7 cards | R$ 15.000.000 PRÉ-MONEY gigante + 7 lastros como cards pequenos |
| 24 | Marcos de Re-precificação | C — Tabela | Tabela M0→M4 com critério + valuation alvo |
| 25 | Visão 2030 | A — Hero | Manifesto centralizado + frase âncora final |
| 26 | Anexos e Referências | Lista | Lista 8 docs + 6 fontes |
| 27 | Backup R$15M (oculto) | Texto Q&A | Pergunta dura + 4 blocos de resposta |

---

## 4 · ÍCONES SUGERIDOS (Lucide Icons, mesma família do app)

| Slide | Ícone |
|---|---|
| 01 Medicina mudando | `Sparkles` ou `Atom` |
| 03 Problema DRC | `AlertTriangle` ou `Activity` (rim/coração) |
| 04 Pilares | `Network` / `Heart` / `BookOpen` / `Microscope` / `Brain` |
| 05 Diferenciais | `Award` ou `ShieldCheck` |
| 06 Tração | `TrendingUp` |
| 07 Arquitetura | `Layers` ou `Cpu` |
| 09 Municípios | `MapPin` |
| 10 Action Plan | `Calendar` |
| 12 Previsibilidade | `BarChart3` |
| 13 Negócios | `DollarSign` |
| 14 Unit Econ | `Calculator` |
| 15 Regulatório | `FileCheck` ou `Scale` |
| 16 RWE | `Database` |
| 17 Equipe | `Users` |
| 18 Ativos | `Package` |
| 19 Riscos | `AlertOctagon` |
| 20 Por Que Agora | `Zap` |
| 21 Investimento | `Banknote` |
| 22 Alocação | `PieChart` |
| 23 Valuation | `Gem` ou `Trophy` |
| 25 Visão 2030 | `Compass` |

---

## 5 · INSTRUÇÕES FINAIS PARA O GERADOR

```
Gere 27 slides em formato 16:9 (1920×1080) para o pitch da MedCannLab 3.0.

REGRAS DE OURO:
1. Use SEMPRE o gradiente escuro de fundo (linear-gradient 135deg #0f172a → #1e293b → #1e3a3a)
2. Cor primária é VERDE ESMERALDA (#22c55e). Use em títulos, ícones, KPIs, bordas, CTAs.
3. Cor accent é AMARELO DOURADO (#f59e0b). Use APENAS em destaques pontuais (warning, highlight, decisão humana).
4. Todos os cards são TRANSLÚCIDOS (bg-slate-900/60 com borda verde-esmeralda 40% opacidade).
5. Tipografia: Inter (display + corpo + KPI). Merriweather itálico só em citações/frases-âncora.
6. NÃO use imagens stock genéricas. Prefira ícones Lucide + diagramas + gráficos.
7. Números/KPIs grandes ficam em verde brilhante (#4ade80 ou #22c55e). Cantos arredondados generosos.
8. Manter ar generoso (whitespace). Padding mínimo 60px lateral.
9. Slide 27 (BACKUP) deve ter borda tracejada amarela e marcador "BACKUP" no canto.
10. Footer discreto em cada slide: "MedCannLab 3.0 · Pré-Seed 2026 · Confidencial".

REFERÊNCIAS VISUAIS:
- Estética próxima de: Linear, Vercel, Stripe Atlas pitch decks
- Sensação: técnico + premium + sério + clínico
- EVITAR: estética "startup hype" exagerada, gradientes coloridos pop, emojis decorativos

CONTEÚDO TEXTUAL:
- O texto completo de cada slide está em PITCH_INVESTIDOR_NARRATIVA_FUSAO_17_06_2026.md v3.4
- Cole esse arquivo junto com este prompt no gerador
- Preserve frases-âncora em itálico
- Preserve hierarquia visual (h1 > h2 > body) conforme estrutura markdown
```

---

## 6 · CHECKLIST ANTES DE GERAR

- [ ] Confirmar com Pedro: usar logo/marca existente OU gerar nova?
- [ ] Confirmar: incluir fotos reais dos sócios no Slide 17 OU avatares estilizados?
- [ ] Confirmar: pizza chart do Slide 22 inclui a fatia 0% Build Capital *(mostrar vazio)* ou omite?
- [ ] Confirmar: mapa do Slide 09 estilo Google Maps OU ilustração minimalista do litoral RJ-SP?
- [ ] Aprovado pelo Ricardo: linguagem do Slide 05 sobre AEC/MIMRE *(consistente com veto 30/05)*?
- [ ] Aprovado pelo Eduardo: linguagem do Slide 04 e 11 sobre eixo Neuro?

---

**Documento:** Prompt Visual pra Geração de Slides via IA
**Gerado:** 17/06/2026 — Pedro + Claude Opus 4.7
**Para usar com:** Gemini Park · Gamma · Pitch.com · Beautiful.AI · Tome · DesignerBot
**Anexar junto:** `PITCH_INVESTIDOR_NARRATIVA_FUSAO_17_06_2026.md` *(v3.4)*
