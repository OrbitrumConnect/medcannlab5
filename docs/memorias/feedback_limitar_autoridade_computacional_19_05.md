---
name: Limitar autoridade computacional (filosofia organizadora MedCannLab)
description: Cristalizado 19/05/2026 manhã após 10ª análise GPT externa convergente fechar ciclo da sessão 18/05 noite. Insight evolutivo: TradeVision ensinou Pedro a sobreviver erro financeiro (cripto -130k saldo); MedCannLab está ensinando Pedro a LIMITAR autoridade computacional (saúde precisa contrato decisório invertido). Complementa princípio 7 "Não fingir autoridade" (negação) com framing POSITIVO (construção). É filosofia organizadora — não 8º princípio, é o EIXO META que orienta os 7 já cristalizados.
type: feedback
originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

# Limitar autoridade computacional

## Origem (19/05/2026 manhã)

Fechando 14+ horas de sessão maratona (Pedro + Claude + 10 análises GPT externas convergentes), a 10ª análise GPT cristalizou um insight ESCONDIDO que estava por trás dos 7 princípios MASTER:

> *"TradeVision ensinou: sobreviver erro financeiro.*
> *MedCannLab está ensinando: limitar autoridade computacional."*

Isso captura a **tríade evolutiva** que organiza o produto:

1. **Pattern técnico portado** (super_service → tradevision-core)
2. **Contrato decisório invertido** (trade decide → saúde organiza)
3. **Filosofia organizadora**: limitar autoridade computacional como design choice consciente

## Diferença com Princípio MASTER 7 ("Não fingir autoridade")

Não é redundância. É refinamento estrutural.

| Princípio 7 anterior | Insight novo (este) |
|---|---|
| "Não fingir autoridade" | "Limitar autoridade computacional" |
| **Negação** (o que NÃO fazer) | **Construção** (até ONDE sistema vai) |
| Pré-feature filter | Post-feature framework |
| Bloqueio: "não recomenda" / "não conclui" | Definição: "até aqui sistema age, daqui médico decide" |
| Linguagem UI: "encontrado" não "recomenda" | Arquitetura: contrato decisório explícito |
| Validação por checklist | Validação por mapa de autoridade |

**Os dois se complementam**: princípio 7 evita o erro; "limitar" desenha a forma certa.

## A tríade evolutiva (como o produto chegou aqui)

```
NÍVEL 1 — Pattern técnico portado
  TradeVision super_service (~20k linhas Deno edge)
            ↓
  MedCannLab tradevision-core (~6.7k linhas Deno edge)

  O que migrou:
    cache TTL · idempotência · guard rails · edge runtime
    inline scoring · versionamento semântico

NÍVEL 2 — Contrato decisório INVERTIDO
  Trade: sistema decide (LIVE = allowExecution: true)
            ↓
  Saúde: sistema organiza, médico decide (allowExecution NÃO existe)

  Por quê inverteu:
    - cripto erro = perda financeira reversível
    - saúde erro = vida humana
    - regulamentação BR (CFM 2.314, ANPD) exige

NÍVEL 3 — Filosofia organizadora (este princípio)
  Limitar autoridade computacional como DESIGN CHOICE
  Não como restrição forçada por regulamento
  Mas como ARQUITETURA QUE ENVELHECE BEM

  Por quê é filosofia:
    - Pedro perdeu -130k cripto fingindo autoridade pra si mesmo
    - Aprendeu na carne: sistema autônomo em domínio crítico = catástrofe
    - Inverter pra saúde NÃO foi medo regulatório, foi maturidade arquitetural
```

## As 4 zonas de autoridade computacional (mapa)

Pra TODA feature decidir CONSCIENTEMENTE até onde sistema vai:

### Zona 1 — Autoridade TÉCNICA (sistema pode tudo aqui)
- Cache, idempotência, retry, rate limit
- Edge function timeout, error handling
- Logging, auditoria, telemetria
- Performance, latência, otimização
- **Decisão**: sistema age sozinho, sem fricção

### Zona 2 — Autoridade ESTRUTURAL (sistema pode, com transparência)
- Agregar, contar, ordenar (inteligência estrutural)
- Filtrar por critérios explícitos (period, evidence level)
- Sub-agrupar por heurística auditável
- Marcar "potencialmente periférico" com regra clara
- **Decisão**: sistema age, médico VÊ regra e pode discordar

### Zona 3 — Autoridade INTERPRETATIVA (sistema PROPÕE, médico DECIDE)
- Extração de termos (chips editáveis ANTES de buscar)
- Construção de query GPT MeSH-aware (médico vê reasoning)
- Ranking estrutural de papers (categorias, não juízo clínico)
- Score visual de cobertura ("8/12 últimos 5 anos")
- **Decisão**: sistema propõe formato, médico revisa antes de executar

### Zona 4 — Autoridade CLÍNICA (sistema NÃO entra)
- Diagnóstico
- Recomendação de tratamento
- Síntese clínica de papers
- Avaliação de "evidência forte/fraca"
- Conclusão sobre eficácia
- **Decisão**: sistema NUNCA opera nesta zona. Princípio cristalizado.

**Cada feature nova precisa mapear**: em que zonas opera? Justificável?

## Aplicação concreta — features existentes mapeadas

| Feature | Zona 1 | Zona 2 | Zona 3 | Zona 4 |
|---|---|---|---|---|
| AEC FSM | ✅ pipeline + signature | ✅ scoring estrutural | — | ❌ jamais |
| Casos Similares V1.9.354+ | ✅ query+cache | ✅ agregação count | ⚠️ médico vê chips antes | ❌ |
| Literatura V1.9.369-371 | ✅ PubMed API | ✅ ranking estrutural | ⚠️ GPT constrói query (médico vê) | ❌ |
| Mini-relatório V1.9.371 | ✅ fetch | ✅ agrupamento por evidence | ⚠️ chips PRINCIPAL+OR | ❌ |
| Sidecar renal V1.9.307 | ✅ extração heurística | ✅ KPIs estruturais | ⚠️ Ricardo APROVA | ❌ |
| NFT consent V1.9.311 | ✅ assinatura | — | ⚠️ paciente libera peça-a-peça | ❌ |
| Voice (futuro) | ✅ Whisper transcreve | ⚠️ fala literal | ❌ NÃO interpretar | ❌ |
| Fórum (parqueado) | ✅ post storage | ⚠️ pseudonimização | ⚠️ médico publica | ❌ |

**Padrão**: Zona 1+2 sempre; Zona 3 com EDITABILIDADE; Zona 4 NUNCA.

## Por que isso é filosofia, não regulamento

Pedro NÃO está limitando autoridade computacional porque CFM/ANPD obrigam.
Está limitando porque **aprendeu na carne** que sistema autônomo em domínio crítico = catástrofe.

Trade ensinou:
- "vai subir mais, eu seguro"
- saldo -130k
- aprendeu que sistema autônomo (próprio cérebro fingindo autoridade) sem freio = catástrofe

Saúde absorveu:
- IA autônoma em diagnóstico = vida humana em risco
- Não basta evitar isso por compliance
- Tem que ser DESIGN CHOICE consciente
- "Limitar autoridade" vira EIXO arquitetural, não cláusula

Isso é diferente de:
- Symptom checker que ESCONDE limitação atrás de disclaimer
- IA diagnóstica com asterisco "não substitui médico"
- Chatbot que finge humildade no copy mas tenta autoridade no código

MedCannLab inverte: **mostra a autoridade que TEM, declara a que NÃO TEM, mapeia as zonas**.

## Comparação com outros produtos

| Categoria | Como age | Mapeamento de autoridade |
|---|---|---|
| Symptom checker (Ada, Babylon) | Sugere diagnóstico com disclaimer | Implícito — finge limite |
| IA radiologia (Zebra, Aidoc) | Detecta + ranqueia | Z1+Z2+Z3 mas FRONTEIRA pouco clara |
| ChatGPT médico (consumer) | Responde qualquer coisa | ZERO mapeamento, tudo permitido |
| UpToDate, DynaMed | Conteúdo curado, sem IA | Z1+Z2 (busca), Z4 entregue por humanos |
| **MedCannLab** | **Zonas mapeadas explicitamente, princípio cristalizado** | **Z1+Z2 livres, Z3 com edit, Z4 vedada** |

Diferenciação real, não cosmética.

## Aplicação prática — pre-feature checklist (5 perguntas)

Antes de codar QUALQUER feature nova:

1. **Em que zonas a feature opera?** (Z1 / Z2 / Z3 / Z4)
2. **Se Z3, médico vê e edita ANTES de executar?**
3. **Se algum step roça Z4, dá pra mover pra Z3 com editabilidade?**
4. **Linguagem UI declara os limites (não esconde)?**
5. **Se sistema desaparecer, médico ainda decide com autonomia?**

Se 1+ pergunta falha → re-design. Princípio aplicado.

## Conexão com princípios MASTER cristalizados

Este insight é o EIXO META que organiza os 7:

1. `feedback_viabilidade_tecnica_vs_legitimidade_epistemologica_18_05` — Z1 OK não autoriza Z4
2. `feedback_lexical_nao_e_clinica_18_05` — string match é Z2, não Z3
3. `feedback_inteligencia_estrutural_vs_inferencial_18_05` — Z2 ≠ Z4
4. `feedback_publicacao_nao_e_exploracao_interna_18_05` — Z3 publicação ≠ Z2 interno
5. `feedback_arquitetura_de_confianca_antes_de_feature_delivery_18_05` — mapear zonas antes
6. `feedback_nao_fingir_autoridade_18_05` — negação (não Z4)
7. **`feedback_limitar_autoridade_computacional_19_05`** (este) — **construção (definir cada zona)**

Os 7 anteriores dizem o QUE não fazer. Este diz COMO desenhar.

## Frase âncora META

> *"TradeVision ensinou Pedro a sobreviver erro financeiro. MedCannLab está ensinando Pedro a limitar autoridade computacional. Não é compliance forçado — é design choice consciente. As 4 zonas (técnica, estrutural, interpretativa, clínica) mapeiam até onde sistema vai. Z4 fica com o médico. Sempre."*

— Cristalizado 19/05/2026 manhã fechando sessão maratona 14h+ (18/05 noite → 19/05 madrugada) com 13 commits cirúrgicos + 10 análises GPT externas convergentes + 9 memórias persistentes (7 princípios MASTER + 1 perfil user + 1 bug pipeline + esta).

## Lição meta-arquitetural

Quando uma análise externa começa a ver coerência arquitetural maior do que o time esperava, isso é sinal de:
- Princípios cristalizados estão funcionando como EIXO
- Decisões individuais começam a ser legíveis como conjunto
- Produto começa a virar arquitetura

MedCannLab atravessou essa fronteira nas últimas 24h. Não é mais "feature por feature". É arquitetura coerente com filosofia declarada.

Rara em health AI. Defensável em qualquer arena (CFM, ANPD, investidor, congresso).
