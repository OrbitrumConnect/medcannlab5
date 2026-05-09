/**
 * App Logger — wrapper console respeitando NODE_ENV (V1.9.205)
 *
 * Princípio 46 (reuso > criação): adapta o pattern de
 * src/lib/clinicalGovernance/utils/logger.ts (fóssil ACDSS) sem reusar
 * diretamente porque o fóssil tem prefix [ACDSS] hardcoded e mantém
 * histórico em memória — desnecessário aqui.
 *
 * Comportamento:
 *   • DEV (import.meta.env.DEV):   tudo loga (debug/info/warn/error)
 *   • PROD (import.meta.env.PROD): silencia debug/info; mantém warn/error
 *                                   pra detecção de bugs em produção
 *
 * NÃO migrar todos os 200+ console.error existentes em 1 sweep.
 * Adoção incremental: novos arquivos usam logger; arquivos refatorados
 * trocam ao tocar a área.
 *
 * Exemplo:
 *   import { logger } from '../lib/logger'
 *   logger.info('user loaded', { userId })
 *   logger.error('payment failed', err)
 */

const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD

type LogArgs = unknown[]

export const logger = {
    /** Verboso. Silenciado em produção. */
    debug(...args: LogArgs): void {
        if (isDev) console.debug('🔍', ...args)
    },

    /** Informativo. Silenciado em produção. */
    info(...args: LogArgs): void {
        if (isDev) console.log('ℹ️', ...args)
    },

    /** Avisos. SEMPRE logado (dev + prod) — sinal pra investigação. */
    warn(...args: LogArgs): void {
        console.warn('⚠️', ...args)
    },

    /** Erros. SEMPRE logado (dev + prod) — base pra Sentry futuro. */
    error(...args: LogArgs): void {
        console.error('❌', ...args)
    },

    /** Marker explícito de scope (substitui prefix [Module] manual). */
    scoped(scope: string) {
        return {
            debug: (...args: LogArgs) => isDev && console.debug(`🔍 [${scope}]`, ...args),
            info: (...args: LogArgs) => isDev && console.log(`ℹ️ [${scope}]`, ...args),
            warn: (...args: LogArgs) => console.warn(`⚠️ [${scope}]`, ...args),
            error: (...args: LogArgs) => console.error(`❌ [${scope}]`, ...args)
        }
    },

    /** Util: detectar contexto. Útil pra condicionais externos. */
    isDev,
    isProd
}

export default logger
