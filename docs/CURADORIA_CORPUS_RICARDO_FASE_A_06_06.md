# Curadoria do Corpus Científico — Fase A (Matrix Z2 / Base de Conhecimento do App)

> **O que é:** triagem read-only dos **103 arquivos órfãos** (no Storage do Supabase, bucket `documents`, sem ficha em `public.documents`). Objetivo: separar o que é **material científico do app** do que é **interno, duplicado, sem correlação ou pessoal/sensível**.
>
> **Status:** AGUARDANDO GO do Dr. Ricardo Valença. **Nada foi indexado.** Read-only.
> **Data:** 06/06/2026 · investigação empírica via PAT (Pedro + Claude).

---

## 🔒 Garantias de não-regressão (o boundary)

Indexar = criar ficha em **`public.documents`** (acervo/Biblioteca do app + feature "liste documentos" da Nôa). Isso **NÃO**:
- ❌ entra no **RAG clínico/Matrix** (`base_conhecimento`, 5 entries curadas) → **AEC intocada** (lock V1.9.318)
- ❌ usa embeddings (pgvector está off)
- ❌ aparece pro paciente — serão indexados com `target_audience=['professional']` (gate DOC_LIST confirmado no Edge)

Ou seja: vira **acervo consultável por profissional**, sem contaminar o raciocínio clínico.

---

## ✅ APROVAR — papers científicos (≈17 distintos, após dedupe)

| # | Arquivo (título) | Tema | Dono |
|---|---|---|---|
| 1 | From-progression-to-remission — a new paradigm | Remissão DRC (Tangri 2026) | Ric |
| 2 | The Role of Finerenone in Cardiorenal Protection | Nefro / Finerenona | Ric |
| 3 | kathleen-d-liu fluid management in AKI | Nefro / IRA | Ric |
| 4 | The global burden of kidney diseases 2020 | Nefro / epidemiologia | Pedro |
| 5 | 2026 Sodium Correction Rates and Outcomes | Nefro / hiponatremia | Ric-adm |
| 6 | Mycophenolate Mofetil as immunosuppressive | Nefro / imunossupressão | Ric-adm |
| 7 | Pharmacokinetics and Side Effects CBD/THC — Kidney Int 2024 | Cannabis × rim | Pedro |
| 8 | ho-et-al 2019 — cannabis in chronic kidney disease | Cannabis × DRC | Pedro |
| 9 | inibition CB1 CKD new target | Cannabis × DRC | Pedro |
| 10 | A systematic review of cannabidiol dosing | CBD dosagem | Ric-adm |
| 11 | Pressão intraocular e canabinóides | Cannabis | Pedro |
| 12 | Cannabis Exposure During Critical Windows of Development | Cannabis neuro (Eduardo) | Ric |
| 13 | reclassificação das desordens neurológicas | Neuro | Ric |
| 14 | Towards conversational diagnostic AI | IA clínica | Pedro |
| 15 | Deep learning para fatores de risco não tradicionais | IA / risco | Pedro |
| 16 | The medical interview — core curriculum | Entrevista clínica (AEC) | Pedro |
| 17 | Representações paralinguísticas 2022 | Comunicação clínica | Ric/Pedro |

*Indexação: `category='research'`, `target_audience=['professional']`, título+conteúdo extraídos do PDF. Só PDFs.*

---

## 🔴 NÃO SUBIR — pessoal / sensível (decisão Ricardo)

| Arquivo | Por quê |
|---|---|
| **SOLICITAÇÃO_DE_EXAME_5b95e651..._dismorf** (2×) | 🔴 **LGPD** — pedido de exame de **paciente individual** (UUID + termo clínico). NÃO é acervo institucional. Quarentenar. |
| Currículo_Lattes_Ricardo_Valença (2×) | CV pessoal — no máximo entra em bio, nunca no acervo de papers |
| WhatsApp_Image_2025-11-14.jpeg | Imagem solta, conteúdo pessoal/desconhecido |
| Relatório_CDV_Sopro_2017-2025 | Possível relatório clínico/pessoal — ⚠️ confirmar com Ricardo |
| Dossiê de Obra Intelectual — Arte da Entrevista | Registro de **propriedade intelectual** do método — sensível/autoral |

---

## ❌ EXCLUIR — sem correlação com o app

`Creator_Academy_TikTok_For_Creators` · `Hall — Questions Of Cultural Identity` · `Yi — musical tempo` · `Modeling Recommender Ecosystems` · `Manifesto por Futuros Desejáveis`

---

## 🟡 INTERNOS / OPERACIONAIS — não é acervo científico (destino à parte)

Catálogos REUNI (6× dup) · planilha_de_exame Dr.Ricardo (4×) · Protocolos REUNI · Documento_Mestre_Plataforma · documento_mestre.txt · configs ("Instruções Nôa", "Avaliação Inicial Configurações") · COAs de produto (Nano/CBN) · Tabela_Produtos_Remederi · 6 princípios OMS sobre IA (8× dup)

> Projeto **Dengue/Jardins de Cura** (`Training_Program_Community_Health_Workers_and_Dengue`, 2×) = **outro projeto**, não entra no corpus do MedCannLab.

---

## 🔁 Notas técnicas

- **27 dos 103 são DOCX** → o extrator OCR (`extract-document-text`) só lê **PDF**. DOCX ficam fora do índice automático (converter ou pular).
- **Duplicatas massivas:** OMS 8× · Catálogo 6× · reclassificação 5× · nejmp_disclosures 5× · global burden 4× → indexar **1 de cada**.
- `nejmp2514040_disclosures` (5×) = só a página de conflito de interesses de um paper NEJM → descartar.

---

## 📋 Decisão pendente (Ricardo)

1. Confirmar os **17 papers** como acervo do app (ou ajustar a lista)
2. Confirmar **bloqueio** dos pessoais/sensíveis (especialmente o pedido de exame LGPD)
3. Dúvidas pontuais: `Relatório CDV Sopro` é clínico/pessoal? `Dossiê IP` deve ficar privado?

**Após GO:** indexação dos PDFs aprovados via extract-document-text → `documents` (professional-scoped). Zero toque em `base_conhecimento`/AEC.
