---
name: reference_ricardo_valenca_bio_autoral_mimre_31_05
description: Bio autoral oficial Dr. Ricardo Valença (subtítulo correto + trajetória) + definição do MIMRE (Método Incentivador Mínimo do Relato Espontâneo) — fonte de verdade para landing/material institucional
metadata: 
  node_type: memory
  type: reference
  originSessionId: 33c9058f-295f-4bac-8e8c-3ae05461126b
---

Fonte de verdade autoral fornecida pelo próprio Ricardo via Pedro (31/05/2026) para uso em landing, material institucional e contexto do Claude. **Tem precedência sobre claims antigos da landing.**

## Subtítulo/tagline oficial (escolhido entre 4 opções)
**"Nefrologista · Pesquisador em Comunicação Clínica e Dados em Saúde"**
(substituiu o antigo "Nefrologia · Coordenador Científico" no card da landing — `Landing.tsx` seção Consultório-Escola, V1.9.552 31/05)

Alternativas que ele também considerou aceitáveis:
- Nefrologista · Criador da Arte da Entrevista Clínica
- Nefrologista · Pesquisador em Escuta Clínica e Longitudinalidade
- Médico Nefrologista · Inovação em Saúde e Ciência de Dados Clínicos

## Trajetória (marcos autorais)
- Nefrologista com **mais de três décadas** (30+) em assistência, ensino, pesquisa e inovação. ⚠️ Card antigo dizia "40+ anos" — corrigido pra "três décadas" pela bio autoral.
- **Mestrado (2002)**: *"O que se diz do que se vê: a necessidade faz o produto ou o produto a necessidade? Uma abordagem comunicacional da nefropatia por analgésicos"* — marco inicial da linha de comunicação clínica + construção de significado + tomada de decisão.
- Desenvolveu a **Arte da Entrevista Clínica (AEC)** — método estruturado de escuta clínica e organização narrativa.
- **Campanha Escute-se! (2010)** — valorização da escuta como instrumento do cuidado.
- Atuação: Hospital Central do Exército, Hospital Copa D'Or, atenção domiciliar, implantação de diálise contínua no Brasil.
- **"Cada Creatinina Tem uma História para Contar" (2017)** — defesa da longitudinalidade clínica e trajetória individual do paciente renal.
- Idealizou o programa **Cidade Amiga dos Rins** (escuta qualificada + prevenção + acompanhamento longitudinal + compartilhamento seguro).
- Pandemia: formação em biossegurança p/ equipes audiovisuais → aplicações educacionais da AEC apresentadas no **COBEM**.
- Essas experiências originaram a **Nôa Esperanza** e a **MedCannLab**.
- Marco da plataforma: encontro com **Pedro Galluf Passos** — convergência da reflexão clínica + metodologia com engenharia/arquitetura de sistemas viabilizou a transformação dos conceitos em plataforma operacional.

## MIMRE — Método Incentivador Mínimo do Relato Espontâneo
Componente metodológico da AEC para obtenção e organização de **narrativas espontâneas** em avaliação clínica assistida por IA.
- **Objetivo**: preservar a **prioridade expressiva do usuário**, minimizando induções — os dados clínicos emergem do que o próprio indivíduo considera relevante relatar.
- Estrutura a coleta a partir de escuta clínica + anamnese tradicional + organização narrativa; serve como **camada inicial de processamento** para documentação clínica e educação em saúde.
- Desenvolvido por Ricardo Valença como desdobramento da AEC, implementado na arquitetura da Nôa Esperanza e da MedCannLab.

✅ **Pendência IMRE vs MIMRE RESOLVIDA (01/jun, ao ler a memória completa)**: são o **MESMO conceito** — o motor de perguntas da AEC já em produção em `clinicalAssessmentFlow.ts`. **IMRE** = acrônimo usado no código/landing (`sistema_imre`, kb entry, `Landing.tsx:718` "protocolo IMRE"); **MIMRE** = o mesmo, em nome português completo. NÃO são camadas distintas e **NÃO renomear código/RAG** — a coexistência acrônimo(IMRE)/nome-PT(MIMRE) é correta. Fontes que já respondiam isso: [[project_imre_clarification_24_04]] (Ricardo: "IMRE = Incentivator Minimal of Exponential", motor de perguntas da AEC) + [[project_mimre_pesos_narrativos_24_04]] ("MIMRE = Motor Incentivador Mínimo do Relato Espontâneo = IMRE em português"). ⚠️ Variância menor de redação a reconciliar ao publicar institucionalmente: memória 24/04 diz **"Motor"** Incentivador, a bio do Ricardo 31/05 diz **"Método"** Incentivador — mesmo conceito, escolher 1 termo no material oficial.
