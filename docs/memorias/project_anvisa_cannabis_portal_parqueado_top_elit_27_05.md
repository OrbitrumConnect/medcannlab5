---
name: anvisa-cannabis-portal-parqueado-top-elit-27-05
description: "Portal ANVISA Cannabis (consultas.anvisa.gov.br/#/cannabis) parqueado pro 'top elite' MedCannLab pós-PMF. Empíricamente bloqueado HTTP 403 Cloudflare (4 endpoints testados 27/05 madrugada — SPA + 3 API guesses). Wedge clínico FORTE (cannabis medicinal BR = wedge MedCannLab) mas anti-cristalização-prematura aplicado: 5 produtos cannabis principais já estão no seed Bulário (categoria 'cannabis'). 3 caminhos A/B/C documentados. NÃO codar antes de Ricardo bater empíricamente 'faltou produto X'. Princípio fronteira info farmacológica passa (FATO REGISTRO público, não decisão terapêutica)."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🌿 Portal ANVISA Cannabis — parqueado top elite (27/05 madrugada)

## Contexto empírico

Sessão 27/05 ~02h BRT — Pedro perguntou se daria pra puxar dados do portal específico Cannabis ANVISA (`https://consultas.anvisa.gov.br/#/cannabis/q/?substancia=25722` — produtos RDC 327/2019 + RDC 660/2022). Resposta cirúrgica: **mesma proteção que Bulário**.

## Validação empírica curl 27/05 (4 endpoints, todos 403)

| Endpoint | Resultado |
|---|---|
| `consultas.anvisa.gov.br/#/cannabis/q/?substancia=25722` (SPA direta) | HTTP 403, 5466 bytes Cloudflare |
| `api/consulta/cannabis` (guess) | HTTP 403 |
| `api/consulta/cannabis?substancia=25722` | HTTP 403 |
| `api/consulta/cannabis/produtos` | HTTP 403 |

**Conclusão técnica**: scraping/crawler morre antes de começar — mesma proteção Cloudflare do Bulário Eletrônico documentada em [[project_anvisa_bulario_indexacao_pdfs_parqueado_27_05]].

## Avaliação Constituição

✅ **Princípio fronteira info farmacológica passa**: dados produto cannabis ANVISA são FATOS PÚBLICOS DE REGISTRO (empresa registrante + princípio ativo + concentração CBD/THC + status autorização). NÃO é decisão terapêutica. Pode ser organizado, NÃO pode virar "use CBD X em vez de Y".

✅ **Wedge clínico FORTÍSSIMO**: cannabis medicinal BR = wedge MedCannLab. Produtos ANVISA registrados (Mevatyl + canabidióis 200mg/ml + outros) é contexto que Dr. Ricardo USA hoje em prescrição real.

## 3 caminhos parqueados

| Opção | Custo | Risco | Robustez |
|---|---|---|---|
| **A — Google Search pattern** aplicado a cannabis (mesma técnica V1.9.467-C) | ~10min | 🟢 zero | SERP sempre retorna 200 |
| **B — Seed estático `anvisaCannabisSeed.ts`** novo (15-25 produtos RDC 327/660) | ~2-3h | 🟢 baixo | Imutável até git commit |
| **C — Link genérico portal cannabis ANVISA** (página inicial, usuário busca lá) | ~5min | 🟢 zero | Página inicial não cai |

## Estado atual (anti-overlap)

Categoria `cannabis` em [anvisaBularioSeed.ts](src/data/anvisaBularioSeed.ts) JÁ TEM 5 produtos cannabis principais BR (Mevatyl + outros canabidióis). **NÃO duplicar.** Se ativar opção B, separar seed específico cannabis (`anvisaCannabisSeed.ts`) + REMOVER categoria 'cannabis' do seed Bulário pra evitar dual-source.

## Triggers EXPLÍCITOS pra desparquear

1. **Ricardo bater empíricamente** *"faltou produto cannabis Y que eu precisava"* OU
2. **Marco 2** paciente externo pagante real com prescrição cannabis específica fora dos 5 do seed atual OU
3. **>5 buscas falhando** por produto cannabis ausente na telemetria UI Bulário OU
4. **Mudança regulatória RDC 327/660** (nova classe produto, novo princípio ativo registrado)

## Anti-cristalização-prematura aplicada

- 0 pacientes externos pagantes (pré-PMF)
- 5 produtos cannabis BR já cobertos no seed manual
- Construir seed expandido pra fluxo zero seria especulação
- Pedro frase âncora: *"fica pro top elit?"* = parqueamento explícito, não TODO ativo

## Custo estimado quando ativar (opção B recomendada)

- 30min: pesquisa empírica produtos RDC 327/660 (lista oficial ANVISA via doc, não scraping)
- 1h: criar `anvisaCannabisSeed.ts` espelhando schema `anvisaBularioSeed.ts`
- 30min: migrar entries cannabis do seed Bulário → novo arquivo
- 30min: UI tab separada "Cannabis BR" em AnvisaPanel ou ExternalLiterature
- 15min: Google Search pattern aplicado aos links

**Total: ~3h código + smoke**

## Conexões com princípios cristalizados

| Princípio | Conexão |
|---|---|
| [[project_anvisa_bulario_indexacao_pdfs_parqueado_27_05]] | Mesma proteção Cloudflare 403 — pattern Bulário aplicável direto |
| [[feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05]] | Cannabis ANVISA passa princípio (fato registro ≠ decisão terapêutica) |
| [[feedback_bula_e_infraestrutura_cognitiva_no_fluxo_prescricao_27_05]] | Se ativar, integrar ao fluxo prescrição (não aba separada decontextualizada) |
| [[feedback_polir_nao_inventar]] | Reusar schema BularioEntry, helper anvisa() V1.9.467-C, AnvisaPanel UI |

## Frase âncora

> *"Cannabis ANVISA é wedge fortíssimo MedCannLab MAS 5 produtos principais já cobertos no seed Bulário. Parqueia pro top elite — Ricardo bate empíricamente OU Marco 2 paciente externo OU >5 buscas falhando = desparqueia."*

## Próxima sessão Claude que tocar cannabis BR

1. Ler ESTA memory ANTES de codar
2. Verificar `anvisaBularioSeed.ts` categoria 'cannabis' (não duplicar)
3. Se desparquear: opção B (seed separado) é caminho recomendado
4. Aplicar princípios fronteira info farmacológica + bula infraestrutura cognitiva
5. Smoke: produto cannabis registrado retorna empresa + princípio ativo SEM sugerir conduta
