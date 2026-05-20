# PARA O DR. RICARDO — V17: Como funciona a Nôa Matrix no eixo Pesquisa

**Data:** 19/05/2026
**De:** Pedro Henrique
**Sobre:** Fluxo completo Atendimento → Nôa Matrix + como usar no dia a dia
**Memorias técnicas relacionadas:** V1.9.388-A.5 deployada e validada empíricamente

---

## Em 30 segundos

Ricardo, lembra da nossa conversa de 19/05 13h, quando você falou que o fórum precisa ter publicação ativa e perguntou se "é um local pra fazer pesquisa"? Pois é — eu polí a parte que faltava antes do fórum: o **chat Nôa Matrix dentro do Terminal de Pesquisa**, que é onde o médico debate estruturalmente o caso *antes* de publicar.

Não é uma "Nôa nova". É a mesma Nôa Esperança que você já conhece, com **outra função**: ela não conduz fluxo clínico aqui, ela organiza e debate o que VOCÊ marcou. O nome interno é "Z2 estrutural" — não-diretivo, não prescreve conduta, não infere diagnóstico, não categoriza por doença. Mas debate. Pondera. Pergunta de volta. Tem voz própria.

A peça crítica é essa: **Z2 estrutural ≠ Z2 burra**. Ela conversa como pessoa, dentro das regras do app.

---

## Como ela se encaixa nos 3 eixos

```
EIXO CLÍNICO              EIXO ENSINO          EIXO PESQUISA
(você + paciente)         (cursos seus +       (você + colegas +
                           Eduardo)             literatura)
       ↓                       ↓                       ↓
AEC paciente              Trilhas               Casos Similares
Relatório clínico         Mentoria              Literatura PubMed
Assinatura ICP            Avaliações            Base Conhecimento
                                                Fórum
                                                ▼
                                         ✨ Nôa Matrix
                                         (chat Z2 estrutural)
```

A Matrix é a **ponte entre o eixo clínico e o eixo pesquisa**. Quando você termina o atendimento e fecha o relatório, em vez de "perder o pensamento", você leva o material direto pra Matrix e estrutura a reflexão lá.

---

## O fluxo passo a passo

### Passo 1 — Você está no Terminal de Atendimento

Você fez a consulta, paciente fez AEC, gerou o relatório clínico, você assinou com sua certificação ICP. Tudo no fluxo normal que você já conhece.

### Passo 2 — Botão "Nôa Matrix" no card do paciente

No cabeçalho da tela do paciente em foco (`PatientFocusView`), aparece o botão **"Nôa Matrix"**. Você clica.

### Passo 3 — Você cai no Terminal de Pesquisa, aba Nôa Matrix

A URL fica `/app/pesquisa/profissional/dashboard?section=noa-matrix&patientId=X`. O `patientId=X` é o paciente que você estava atendendo.

A tela tem 2 colunas:

```
┌─────────────────────────────┬─────────────────────────────────┐
│ COLUNA ESQUERDA             │ COLUNA DIREITA                  │
│                             │                                 │
│ Banner: "Sessão sobre Pedro │ 🧬 Nôa Matrix                  │
│  · contexto Matrix usa      │ Z2 · Chat estrutural não-       │
│  código #6ACF (LGPD)"       │ diretivo                        │
│                             │                                 │
│ MATERIAL DISPONÍVEL:        │ [campo de mensagens]            │
│ ☐ Relatório de 19/05/2026  │                                 │
│ ☐ Relatório de 11/05/2026  │                                 │
│ ☐ Relatório de 07/05/2026  │                                 │
│ ☐ Racionalidade Integrativa │                                 │
│   (11/05/2026)              │ [campo digitar mensagem...]     │
│ ☐ Racionalidade Biomédica   │                                 │
│   (07/05/2026)              │                                 │
│                             │                                 │
│ 📚 Buscar literatura PubMed │                                 │
│ [expansível]                │                                 │
└─────────────────────────────┴─────────────────────────────────┘
```

Note: o **nome real do paciente** aparece no banner pra você identificar internamente, mas dentro do chat com a IA a Matrix usa um **código curto** (ex: `#6ACF`) — higiene LGPD pra reduzir circulação de PHI em texto bruto.

### Passo 4 — Você marca o material relevante

Os relatórios e racionalidades do paciente já vêm pré-carregados na coluna esquerda. **Eles NÃO entram automaticamente no chat**. Você decide o que é relevante e clica nos checkboxes pra marcar.

Princípio: a Matrix lê APENAS o que você marcou explicitamente. Isso é proposital — você controla o contexto, a Matrix não infere "sozinha" o que importa.

### Passo 5 — (opcional) Você busca literatura PubMed

Abaixo dos cards, tem o bloco expansível **"📚 Buscar literatura PubMed"**. Você clica pra abrir, digita um termo (ex: "cannabis chronic pain", "hyponatremia treatment", "doravirine kidney"), e ela busca direto na base NCBI (PubMed oficial, grátis).

Aparecem os top 8 papers retornados. Você clica em **"+ anexar"** nos que te interessam. Eles viram cards anexáveis igual aos relatórios.

### Passo 6 — Você conversa com a Matrix

Digita no campo da direita. Exemplos do que funciona bem:

**Primeira pergunta (análise estrutural)**:
> "analise esses relatórios e papers"
>
> "compare os 2 casos marcados"
>
> "estrutura o que esse paciente apresentou nos 3 momentos"

A Matrix responde em formato organizado: casos marcados / padrões observados / questões em aberto / limites do corpus.

**Perguntas de follow-up (debate)**:
> "o que você acha disso?"
>
> "explica de novo o ponto da granularidade"
>
> "qual a relação entre o paper PMID 42150384 e a queixa 'está inchado'?"

Aqui ela **NÃO re-lista tudo de novo** — referencia o que já falou antes e progride o pensamento.

**Perguntas que tentam cruzar a linha clínica**:
> "qual a hipótese diagnóstica mais provável?"
>
> "qual o melhor tratamento?"
>
> "isso é dor neuropática?"

Aqui ela responde com voz própria reconhecendo o limite:
> "Essa é uma decisão clínica sua — eu não atravesso essa linha. No entanto, posso ajudar a olhar o que tem no corpus que talvez informe sua decisão..."

E aí ela aponta dimensões do corpus que VOCÊ pode usar pra decidir. Sem prescrever, sem categorizar.

---

## O que ela faz (Z2 intelectual)

- **Compara** casos que você marcou, sempre citando IDs (`Caso #6ACF`)
- **Agrupa** por critério explícito que você pede (temporal, sintomático, racionalidade)
- **Cita** papers PubMed pelo PMID + título
- **Estrutura perguntas** sobre o material — perguntas DIRETAS, sem inventar relações entre items que você não conectou
- **Aponta divergências** entre racionalidades aplicadas a casos similares, sem opinar qual está certa
- **Recupera histórico** do que você comentou nas notas marcadas
- **Reconhece limites**: quando o material não responde, ela diz "este corpus não cobre essa dimensão"
- **Debate intelectualmente**: pondera tensões, pergunta de volta, expressa dúvida própria

## O que ela NÃO faz (proibições absolutas)

- Sugerir conduta ("recomendo", "sugiro", "indica-se", "deve-se")
- Inferir diagnóstico ("hipótese provável é", "quadro compatível com")
- Sintetizar decisão clínica ("a melhor abordagem é")
- Categorizar por doença antes que você o faça
- Citar conhecimento fora do corpus marcado (sem alucinação)
- Navegar a plataforma ("vou abrir o terminal pra você")
- Agendar consultas
- Executar ações administrativas

## Por que essas limitações?

Por causa do princípio cristalizado a partir da sua tese — escuta primeiro, não categorizar por doença, "a doença não é o centro, o centro é a escuta e a narrativa".

A Matrix **organiza** sem **decidir**. Você decide. Isso é arquitetura, não restrição da IA — é desenho consciente pra preservar autoridade clínica do médico.

---

## Próximos passos do fluxo (o que falta pra fechar o ciclo)

A jornada completa que estamos polindo:

```
Relatório clínico → Matrix conversa → DOSSIÊ DO MÉDICO → Fórum / Tese / PDF
                                          ↑
                                    falta isso aqui
```

Hoje (19/05) temos: relatório clínico ✓, Matrix conversa ✓.

O que falta:

### 1. Auto-ativação Matrix pós-relatório
Hoje você clica no botão. Visão: aparecer um toast/banner depois que você assina o relatório: *"Quer estruturar a reflexão deste caso na Nôa Matrix?"* — leva direto com o material pré-carregado.

### 2. Função de busca direto no chat
Hoje você precisa abrir o bloco lateral pra buscar PubMed. Visão: você fala no chat *"busca pubmed sobre dor neuropática"* e ela busca + traz na resposta automaticamente.

### 3. **Fechar como dossiê** (a peça mais importante que falta)
Visão: depois de você ter conversado, ponderado, cruzado material — clicar **"Fechar como dossiê"** e gerar 3 saídas:
- **PDF do médico** (relatório próprio seu, voz sua, distinto do relatório clínico do paciente)
- **Submissão pra sala do Fórum** (cria sala dedicada, pré-popula com o dossiê)
- **Draft de tese/artigo** (formato exportável pra você usar academicamente)

### 4. Fórum publicação ativa
Você pediu (WhatsApp 19/05). Tenho 3 bloqueios técnicos mapeados pra destravar. É P1 — vou atacar logo depois de fechar o dossiê (item 3).

---

## Sobre o pedido do Fórum (resposta direta)

Sua pergunta interrogativa 19/05: *"é um local pra fazer pesquisa. é isso?"*

Minha resposta com tudo polido hoje: **sim, mas em 2 momentos do mesmo eixo**:

1. **Antes da publicação** → você usa a Matrix pra estruturar a reflexão privadamente sobre o caso (com seu material clínico real, dentro do seu painel)
2. **Depois da publicação** → o Fórum hospeda a sala daquele caso pra debate institucional com colegas (anonimizado conforme você decidir)

A Matrix **prepara** o material que vai pro Fórum. O Fórum é o espaço **coletivo**. Materializa exatamente o que você cristalizou na sequência: indivíduo → médico → coletivo.

E os 3 bloqueios técnicos do Fórum eu vou destravar na sequência de fechar o dossiê — então quando você for publicar o primeiro caso real, vai estar pronto.

---

## Princípios que vou preservar SEMPRE

1. **Você é o médico, a Matrix estrutura**. Nunca o inverso.
2. **Você decide o contexto** (marca os cards, não a IA escolhe).
3. **Higiene LGPD**: pseudônimo (`#6ACF`) no chat com IA, nome real só pra você no banner.
4. **Z2 não-diretiva clínica + Z2 intelectual conversacional**: ela debate sem cruzar linha de prescrição/diagnóstico.
5. **Nada de "Nôa nova"**: é a mesma Nôa Esperança com função diferente. Voz, personalidade, postura — tudo coerente.

---

## Estado técnico atual (resumo)

- **10 commits cirúrgicos hoje** (V1.9.385 → V1.9.388-A.5)
- **Validado empíricamente em 4 turnos de teste real**
- **Custo cai 85%** em relação ao caminho antigo (~$0.04/sessão)
- **AEC, Pipeline, Locks ICP-Brasil — 100% intocados**
- **Outros chats (Nôa clínica paciente, AEC, Admin) funcionando paralelos sem regressão**
- **Autorizado escalada controlada** (20-30 usuários como teste empírico)

Quando você puder, testa um caso seu — abre um paciente que você atendeu, vai pro Terminal de Pesquisa pela aba Matrix, marca uns relatórios, busca um paper no PubMed, conversa. Me conta se a voz tá batendo com o que você esperaria de uma interlocutora estrutural.

Abraço,
Pedro
