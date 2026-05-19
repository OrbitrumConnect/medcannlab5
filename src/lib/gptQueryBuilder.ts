import { NoaResidentAI } from './noaResidentAI'
import type { ExtractedTerm } from './clinicalTermsTranslator'

// [V1.9.372] (18/05/2026) — GPT como CONSTRUTOR de query PubMed (não extrator)
//
// Reorientação do papel do GPT pós-bug V1.9.371 (Pedro empírico):
//   "ele tá sendo usado pra procurar hashtag e não o que falei"
//
// Antes (gptTermExtractor.ts):
//   - GPT extrai mais termos PT→EN sofisticados
//   - Termos vão pro dict junto → query inflada → menos resultados
//   - Valor real: baixo (texto da racionalidade é curto)
//
// Agora (gptQueryBuilder.ts):
//   - GPT recebe racionalidade + termos do dict + contexto cannabis
//   - Retorna query PubMed ESTRUTURADA com AND/OR/parênteses/MeSH tags
//   - Valor real: alto (resolve cases onde só dict gera query ruim)
//
// Anti-padrão preservado: GPT NÃO sumariza, NÃO opina, NÃO interpreta. Só MONTA query.
// Médico sempre vê query antes de executar (chips editáveis + preview).
//
// Risco LGPD: herda V1.9.357 (texto racionalidade vai pra OpenAI).
// Custo: ~$0.005-0.01/uso.

const QUERY_BUILDER_PROMPT = `[PUBMED_QUERY_CONSTRUCTION_MODE]

Você é um assistente de busca bibliográfica. Sua ÚNICA tarefa é construir uma query PubMed bem formada a partir do contexto clínico abaixo.

REGRAS RÍGIDAS:
- NÃO sumarize o caso
- NÃO opine sobre conduta clínica
- NÃO sugira diagnóstico
- NÃO interprete relevância clínica
- Apenas MONTE a string de query

ENTRADA:
- Texto da racionalidade clínica (PT)
- Lista de termos clínicos já identificados (PT↔EN)
- Contexto: aplicação cannabis-medicinal brasileira

OBJETIVO:
Construir UMA query PubMed que MAXIMIZE chance de retornar papers cannabis-relevantes
ao caso, balanceando especificidade e cobertura.

DIRETRIZES TÉCNICAS:
- Use AND/OR/parênteses adequadamente
- Use [Title/Abstract] como filtro padrão de campo
- Use MeSH tags ([MeSH Terms]) APENAS quando tem certeza do termo MeSH exato (não invente)
- Termo médico principal = AND obrigatório
- Termos secundários = OR opcionais
- Considere incluir "cannabis OR cannabidiol OR CBD" no contexto cannabis-medicinal
- Máximo 200 caracteres na query
- Aspas em multi-word terms

FORMATO OBRIGATÓRIO (apenas JSON válido, sem markdown):
{"query": "...", "reasoning_short": "..."}

reasoning_short = 1 linha curta (max 80 chars) explicando estratégia da query.

RACIONALIDADE CLÍNICA:
"""
__RATIONALITY__
"""

TERMOS JÁ IDENTIFICADOS:
__TERMS__

Retorne APENAS o JSON. Nenhum texto adicional.`

interface GPTQueryResult {
  query: string
  reasoning: string
}

function tryParseJSON(content: string): any {
  try {
    return JSON.parse(content)
  } catch {
    /* segue */
  }
  const cleaned = content.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
  try {
    return JSON.parse(cleaned)
  } catch {
    /* segue */
  }
  const match = content.match(/\{[\s\S]*?\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {
      /* desiste */
    }
  }
  return null
}

function sanitizeQuery(q: string): string {
  // Limita comprimento + remove caracteres potencialmente quebradores
  return q.trim().slice(0, 250).replace(/[\n\r\t]+/g, ' ')
}

/**
 * Constrói query PubMed inteligente via GPT-4o-mini.
 * Custo estimado: ~$0.005/uso. Cap geral V1.9.357 herdado.
 */
export async function buildQueryViaGPT(
  rationalityText: string,
  dictTerms: ExtractedTerm[],
  userId?: string,
  email?: string
): Promise<GPTQueryResult | null> {
  if (!rationalityText || rationalityText.trim().length < 20) return null
  const truncated = rationalityText.slice(0, 3000)
  const termsStr = dictTerms.length > 0
    ? dictTerms.map(t => `${t.pt} → ${t.en}`).join(', ')
    : '(nenhum termo identificado pelo dicionário)'

  const prompt = QUERY_BUILDER_PROMPT
    .replace('__RATIONALITY__', truncated)
    .replace('__TERMS__', termsStr)

  try {
    const noa = new NoaResidentAI()
    const response = await noa.processMessage(prompt, userId, email)
    const parsed = tryParseJSON(response.content)
    if (!parsed || typeof parsed.query !== 'string' || parsed.query.trim().length === 0) {
      console.warn('[gptQueryBuilder] resposta sem query válida')
      return null
    }
    return {
      query: sanitizeQuery(parsed.query),
      reasoning: typeof parsed.reasoning_short === 'string'
        ? parsed.reasoning_short.trim().slice(0, 150)
        : '',
    }
  } catch (err) {
    console.warn('[gptQueryBuilder] falha:', err)
    return null
  }
}
