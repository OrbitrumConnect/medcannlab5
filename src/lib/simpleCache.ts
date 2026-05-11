/**
 * Simple In-Memory Cache — V1.9.211
 *
 * Cache genérico em memória com TTL configurável. ZERO dependências.
 *
 * Princípio 46 (reuso > criação): adaptado do pattern de
 * src/lib/clinicalGovernance/utils/cacheManager.ts (fóssil ACDSS) sem
 * importar diretamente porque o fóssil tem dependências (logger,
 * thresholds) específicas do contexto ACDSS desnecessárias aqui.
 *
 * Características:
 *   • In-process (não persiste em refresh)
 *   • TTL por entrada (padrão 5min)
 *   • Cache MISS automático se expirado (lazy invalidation)
 *   • API: get / set / clear / clearPrefix / stats
 *
 * Uso típico:
 *   import { simpleCache } from '../lib/simpleCache'
 *   const cached = simpleCache.get<MyType>(`rationality:${reportId}:${type}`)
 *   if (cached) return cached
 *   const result = await heavyOperation()
 *   simpleCache.set(`rationality:${reportId}:${type}`, result)
 *   return result
 */

interface CacheEntry<T> {
    data: T
    timestamp: number
    ttl: number
}

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutos

class SimpleCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map()

    get<T>(key: string): T | null {
        const entry = this.cache.get(key)
        if (!entry) return null

        const isExpired = (Date.now() - entry.timestamp) >= entry.ttl
        if (isExpired) {
            this.cache.delete(key)
            return null
        }

        return entry.data as T
    }

    set<T>(key: string, data: T, ttlMs?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs ?? DEFAULT_TTL_MS
        })
    }

    /** Remove uma entrada específica do cache. */
    delete(key: string): boolean {
        return this.cache.delete(key)
    }

    /** Remove todas entradas que começam com prefixo (ex: 'rationality:'). */
    clearPrefix(prefix: string): number {
        let cleared = 0
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key)
                cleared++
            }
        }
        return cleared
    }

    /** Limpa tudo (útil em logout, troca de usuário, etc). */
    clearAll(): void {
        this.cache.clear()
    }

    /** Stats pra debug. */
    stats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        }
    }
}

export const simpleCache = new SimpleCache()
export default simpleCache
