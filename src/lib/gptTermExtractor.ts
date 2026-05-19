import { NoaResidentAI } from './noaResidentAI'
import type { ExtractedTerm } from './clinicalTermsTranslator'

// [V1.9.369-C] (18/05/2026) — Extrator de termos clínicos via GPT (opt-in)
//
// Wrapper RESTRITO do Core IA Nôa pra extrair APENAS termos clínicos da
// racionalidade, com tradução PT→EN. Pattern reutilizado de V1.9.357 (Casos
// Similares toggle GPT) — herda cap mensal + tracking ai_chat_interactions
// (cap tracking tem bug pré-existente — memory audit_back_v1_9_368_bugs_descobertos).
//
// O QUE GPT FAZ:
//  - Extrai termos clínicos sofisticados (síndromes, classificações, conceitos sutis)
//  - Traduz PT→EN seguindo MeSH terms quando aplicável
//
// O QUE GPT NÃO FAZ (anti-padrão Ricardo cristalizado em memory):
//  - NÃO sumariza racionalidade
//  - NÃO opina sobre conduta clínica
//  - NÃO sugere diagnóstico
//  - NÃO ranqueia relevância de papers
//  - NÃO sintetiza racionalidade + literatura
//
// Risco LGPD: payload contém texto da racionalidade (dado clínico) → vai pra OpenAI.
// HERDA risco V1.9.357 — não adiciona NOVO risco. Pré-PMF aceitável; pós-pagante
// exige OpenAI Enterprise + ZDR + pseudonimização (memory project_lgpd_payload_
// racionalidade_divida_tecnica_17_05).

const EXTRACTION_PROMPT = `[CLINICAL_TERM_EXTRACTION_MODE]

Você é um assistente de extração técnica. Sua ÚNICA tarefa é extrair termos clínicos da racionalidade abaixo e fornecer tradução pra inglês médico padrão.

REGRAS RÍGIDAS:
- NÃO sumarize a racionalidade
- NÃO opine sobre conduta clínica
- NÃO sugira diagnóstico
- NÃO interprete o caso
- Extraia APENAS termos clínicos (sintomas, doenças, classificações, sistemas afetados, mecanismos)
- Máximo 8 termos relevantes
- Tradução PT→EN deve seguir terminologia médica padrão (MeSH terms quando aplicável)
- Termos em PT em letra minúscula; EN em formato padrão MeSH

FORMATO OBRIGATÓRIO (apenas JSON válido, sem markdown, sem prefácio):
[{"pt": "...", "en": "..."}, ...]

RACIONALIDADE CLÍNICA A ANALISAR:
"""
__TEXT__
"""

Retorne APENAS o JSON array. Nenhum texto adicional.`

function tryParseJSONArray(content: string): any[] | null {
  // Tenta parse direto
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed
  } catch {
    /* continua */
  }
  // Tenta limpar markdown wrappers
  const cleaned = content.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed
  } catch {
    /* continua */
  }
  // Procura por padrão [...] no meio de texto
  const match = content.match(/\[\s*\{[\s\S]*?\}\s*\]/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (Array.isArray(parsed)) return parsed
    } catch {
      /* desiste */
    }
  }
  return null
}

/**
 * Extrai termos clínicos via GPT-4o-mini (Core Nôa).
 * Custo estimado: ~$0.01/extração (~500 tokens input + ~200 tokens output).
 *
 * @param text texto da racionalidade (será truncado em 3000 chars pra cap custo)
 * @param userId opcional, pra tracking em ai_chat_interactions
 * @param email opcional, idem
 * @returns lista de termos extraídos; vazia em caso de erro
 */
export async function extractTermsViaGPT(
  text: string,
  userId?: string,
  email?: string
): Promise<ExtractedTerm[]> {
  if (!text || text.trim().length < 20) return []
  const truncated = text.slice(0, 3000)
  const prompt = EXTRACTION_PROMPT.replace('__TEXT__', truncated)

  try {
    const noa = new NoaResidentAI()
    const response = await noa.processMessage(prompt, userId, email)
    const parsed = tryParseJSONArray(response.content)
    if (!parsed) {
      console.warn('[gptTermExtractor] GPT não retornou JSON válido')
      return []
    }
    return parsed
      .filter(
        (item: any) =>
          item &&
          typeof item.pt === 'string' &&
          typeof item.en === 'string' &&
          item.pt.trim().length > 0 &&
          item.en.trim().length > 0
      )
      .map((item: any) => ({ pt: item.pt.trim(), en: item.en.trim() }))
      .slice(0, 10)
  } catch (err) {
    console.warn('[gptTermExtractor] Falha na extração GPT:', err)
    return []
  }
}
