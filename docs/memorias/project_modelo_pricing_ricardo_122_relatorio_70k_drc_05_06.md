---
name: project_modelo_pricing_ricardo_122_relatorio_70k_drc_05_06
description: "Modelo de pricing/posicionamento que Ricardo cravou na reunião 05/06 noite com Pedro+João: vende RELATÓRIO (não consulta) de avaliação clínica + estagiamento DRC a R$122 por pessoa, anchor de escala 70.000 pacientes = R$8.54M GMV para oferta Sociedade Brasileira de Nefrologia. Diferencial: dado estágio 1-2 DRC não existe na Nefrologia hoje (só pegam a partir do laboratório com creatinina já elevada). Modelo fiscal: faturamento oriundo de relatório contratado-pago (não consulta médica). Gargalo declarado: contrato de comunicação/mídia pra trazer 70k pessoas. Modelo paradoxo: cliente paga consulta/relatório + plataforma vende comunicação em paralelo."
type: project
---

# Modelo Ricardo — R$ 122 por relatório × 70k estagiamento DRC

## A oferta

Ricardo Valença cravou na reunião 05/06 noite (jantar com Pedro + João Vidal) o que ele vai oferecer para a **Sociedade Brasileira de Nefrologia**:

```
PRODUTO:    Avaliação clínica + estagiamento de doença renal crônica (DRC)
            Estágios 1 e 2 (pré-creatinina-elevada)
PREÇO:      R$ 122,00 por pessoa
ESCALA:     70.000 avaliações = anchor de oferta
GMV:        R$ 8.540.000,00
```

**Posicionamento explícito**: *"Não é 70 mil consultas, são 70 mil avaliações clínicas e estagiamento da doença renal."*

## Por que não "consulta médica"

Ricardo posiciona deliberadamente como **relatório** (não consulta) por 3 razões:

1. **Fiscal/regulatório**: *"A Receita Federal olha pra tua conta e o faturamento é oriundo de relatório contratado, relatório pago — relatório de avaliação fiduciária feito pela plataforma. Eu prometo, vendo, entrego."* Categoria fiscal limpa, evita classificação ato médico CFM.
2. **Escala não-presencial**: relatório pode ser entregue 70k vezes; consulta não.
3. **Diferenciação de mercado**: clínicas/hospitais já vendem consulta. Ninguém vende **estagiamento DRC populacional pré-creatinina**.

## O diferencial técnico (dado que não existe hoje)

Ricardo articulou:

> *"O que eu planejei de vender para a Sociedade de Nefrologia foi estagiamento estágio 1 e 2. É uma pergunta, não tem esse dado. Não existe esse dado na Sociedade de Nefrologia."*

> *"Mas como é que uma sociedade de nefrologia caminha dia a dia, cuidando e tratando de pacientes sem uma avaliação? Não, porque ninguém teve uma ideia de fazer um projeto que fosse mapear estágio de função renal. Então não tem esse dado, só existe a partir do laboratório. A partir do laboratório já era, quando a creatinina sobe — aí você já perdeu muita gente."*

**Tradução técnica MedCannLab**:

- AEC FSM + Pipeline + Verbatim First captura **fenomenologia narrativa** do paciente (queixas, hábitos, contexto familiar, sinais clínicos relatados).
- Sidecar Renal V1.9.307 detecta sinais DRC em texto livre (DRC estágio 1-2 = sintomas vagos pré-laboratório).
- Relatório PDF assinado ICP-Brasil (Lock V1.9.299 PBAD AD-RB CONFORME ITI) = entregável final fiduciário.
- Sistema **JÁ tem instrumentação** pra produzir esse dado (43 reports REAIS assinados ICP, 132 rationalities geradas).
- **Faltam**: (a) Stripe gate hard pra cobrar, (b) campanha/funil pra trazer pacientes, (c) backfill/cohort pra demonstrar volume.

## Gargalo declarado por Ricardo

> *"Só depende de mídia. A questão é você pegar o contrato de comunicação. O desafio é como você traz 70 mil pessoas para dentro de uma plataforma."*

**Não é o produto, é o canal**. Ricardo coloca a engenharia como resolvida e a aquisição como o problema dominante.

João Vidal articulou hipóteses de canal:
- Comunicação + marketing + mídia + TV + rádio
- Interface governo + possível campanha política
- "Brasil Nova York" como anchor de tração (1M pessoas YouTube)

## Modelo paradoxo (duplo canal de monetização)

Ricardo descreveu um modelo de **duplo canal**:

1. **Canal direto**: cliente paciente paga R$ 122 por relatório/avaliação.
2. **Canal paralelo**: plataforma vende **visibilidade/comunicação** em paralelo a esse fluxo (audiência das 70k pessoas dentro da plataforma).

Frase de Ricardo: *"O cara tá me pagando por consulta e eu tô vendendo comunicação pra ele, ele sabe. Ele não sabe que eu tô fazendo um paradoxo em paralelo a isso."*

⚠️ **Risco regulatório a validar com advogado** (Marco 1+2 destrava): esse duplo canal precisa de transparência contratual clara pra não cair em comunicação implícita de saúde, captação irregular, ou conflito de interesse paciente vs anunciante.

## Conexões com estado técnico atual

| Componente da oferta | Tecnologia que JÁ entrega | Gap |
|---|---|---|
| Avaliação clínica narrativa | AEC FSM 13+ fases + Verbatim First | — |
| Estagiamento DRC 1-2 pré-creatinina | Sidecar Renal V1.9.307 + Matrix Z2 | precisa Eduardo bater +/- validação fenomenológica adulta |
| Relatório PDF fiduciário | sign-pdf-icp Lock V1.9.299 PBAD AD-RB CONFORME ITI | — |
| Pricing R$ 122 cobrado | Stripe + Gate hard + UI/RPC liberação admin | ❌ NÃO existe (DEMO/MOCK hoje) |
| Funil 70k pacientes | Marketing + landing + campanha | ❌ NÃO existe |
| Backfill volume comprovável | cohort REAL com X reports/mês | ❌ NÃO existe (43 reports totais em ~6 meses) |
| Auditoria entregável fiscal | Comprovante de relatório-vendido-relatório-entregue | parcial (clinical_reports + signed_at + payment_status manual) |

## Cuidados meta-arquiteturais (Pedro)

1. **Anti-overclaim**: R$ 8.54M GMV é **vitrine narrativa de oferta para Sociedade Nefrologia**, NÃO projeção de receita Q3-Q4 2026. Não citar como "pipeline" pra investidor sem qualificar.
2. **Pré-condições técnicas hard pra modelo virar real**:
   - Stripe + gate hard (pré-Marco 2)
   - CNPJ João liberado (Marco 1, dia 10/06 Pix R$ 350 cada)
   - 2º médico independente validando empíricamente (Marco 2)
   - 20-30 pacientes externos pagantes (PMF declarável)
3. **Anti-padrão de comunicação**: jamais usar "R$ 122 × 70k" em landing pública / WhatsApp paciente / material institucional não-investidor enquanto Stripe gate hard não existir efetivamente.
4. **Marco 2 (2º médico) usa pricing como teste**: validar empíricamente se Eduardo Faveret OU outro médico cobra os primeiros R$ 122 por relatório real antes de comprometer narrativa Sociedade Nefrologia.

## Quando aplicar este modelo

- ✅ Negociação Sociedade Brasileira de Nefrologia (Ricardo já tem espaço institucional)
- ✅ Pitch pra parceiro de mídia/canal
- ✅ Apresentação de oferta pra grupos clínicos/hospitalares
- ✅ Investidor Q1-Q2 2027 pós-Marco 2+3 com cohort REAL

## Quando NÃO aplicar

- ❌ Comunicação direta a paciente (paciente não compra "estagiamento DRC", compra cuidado)
- ❌ Landing pública pré-Stripe-gate-hard
- ❌ Material regulatório (ANVISA/CFM) — fala de bula, classe risco, SaMD, não pricing comercial
- ❌ Linkagem direta com SGQ ANVISA pré-petição (separar plano comercial de plano regulatório)

## Frase ancora

> *"05/06 jantar Ricardo cravou: vende RELATÓRIO de estagiamento DRC R$ 122 × 70k = R$ 8.54M GMV âncora Sociedade Brasileira de Nefrologia. Diferencial: dado estágio 1-2 pré-creatinina NÃO existe na Nefrologia hoje. Fiscal/regulatório limpo: relatório fiduciário contratado-pago via plataforma, não consulta médica. Gargalo declarado: contrato de comunicação pra trazer 70k pessoas (não é o produto, é o canal). Modelo paradoxo duplo-canal: cliente paga relatório + plataforma vende visibilidade em paralelo. Pré-condições hard pra virar real: Stripe gate hard + Marco 1 CNPJ + Marco 2 médico independente + cohort 20-30 pagantes."*
