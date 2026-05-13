// =====================================================
// 💰 MODEL PRICING — Versionado em git
// =====================================================
// V1.9.238 (13/05/2026): tabela de precos por modelo IA pra calculo empirico
// de custo por turn/sessao/usuario/mes. Versionado em git: cada commit que
// mexer = pricing_version nova (data ISO).
//
// Quando a tabela passar de ~5-6 modelos OU precos mudarem com frequencia,
// migrar pra tabela DB `model_pricing_history` com effective_date + version.
//
// Filosofia: este e um snapshot historico contextual, NAO verdade absoluta.
// Custo real cobrado pela OpenAI pode variar (rate limits, batch, etc.).
//
// Cost estimate via metadata.cost_usd_estimate em ai_chat_interactions.

export const PRICING_VERSION = '2026-05-13' // ISO da ultima atualizacao

interface ModelPricing {
  provider: string
  prompt_usd_per_1k: number
  completion_usd_per_1k: number
  effective_date: string
  notes?: string
}

// Precos vigentes (OpenAI Pricing 13/05/2026)
// Refs: https://openai.com/pricing
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // GPT-4o (modelo principal MedCannLab)
  'gpt-4o-2024-08-06': {
    provider: 'openai',
    prompt_usd_per_1k: 0.0025,
    completion_usd_per_1k: 0.010,
    effective_date: '2024-08-06',
    notes: 'tradevision-core principal'
  },
  'gpt-4o': {
    provider: 'openai',
    prompt_usd_per_1k: 0.0025,
    completion_usd_per_1k: 0.010,
    effective_date: '2024-08-06',
    notes: 'alias latest'
  },

  // GPT-4o-mini (escriba V1.9.84 + tasks leves)
  'gpt-4o-mini': {
    provider: 'openai',
    prompt_usd_per_1k: 0.00015,
    completion_usd_per_1k: 0.0006,
    effective_date: '2024-07-18',
    notes: 'escriba V1.9.84, temp 0.1'
  },
  'gpt-4o-mini-2024-07-18': {
    provider: 'openai',
    prompt_usd_per_1k: 0.00015,
    completion_usd_per_1k: 0.0006,
    effective_date: '2024-07-18'
  },

  // Futuro: Claude, Gemini, etc.
  // 'claude-sonnet-4-6': { provider: 'anthropic', ... },
  // 'gemini-1.5-pro':    { provider: 'google',    ... },
}

const FALLBACK_MODEL = 'gpt-4o-2024-08-06'

/**
 * Calcula custo em USD baseado em tokens consumidos.
 * Retorna 0.000000 se model desconhecido OU tokens vazios (defensivo).
 */
export function calcCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  if (!model || (promptTokens === 0 && completionTokens === 0)) return 0
  const pricing = MODEL_PRICING[model] || MODEL_PRICING[FALLBACK_MODEL]
  const promptCost = (promptTokens / 1000) * pricing.prompt_usd_per_1k
  const completionCost = (completionTokens / 1000) * pricing.completion_usd_per_1k
  // 6 decimais USD = precisao ate 1 centesimo de centavo
  return Number((promptCost + completionCost).toFixed(6))
}

/**
 * Retorna provider canonico ('openai', 'anthropic', 'google', 'unknown').
 * Usado em metadata pra agregar custo por provider em queries SQL.
 */
export function getProviderFor(model: string): string {
  return MODEL_PRICING[model]?.provider || 'unknown'
}
