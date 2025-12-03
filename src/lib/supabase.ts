import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://itdjkfubfzmvmuxxjoae.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyOTAsImV4cCI6MjA3Njc0MTI5MH0.j9Kfff56O2cWs5ocInVHaUFcaNTS7lrUNwsKBh2KIFM'

// Configuração com retry automático para erros de rede
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-itdjkfubfzmvmuxxjoae-auth-token',
  },
  global: {
    headers: {
      'x-client-info': 'medcannlab-3.0',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Interceptar erros de rede e adicionar retry
const originalFrom = supabase.from.bind(supabase)
supabase.from = function(table: string) {
  const query = originalFrom(table)
  
  // Interceptar métodos que fazem requisições
  const methods = ['select', 'insert', 'update', 'delete', 'upsert']
  methods.forEach(method => {
    const originalMethod = query[method]
    if (originalMethod && typeof originalMethod === 'function') {
      query[method] = function(...args: any[]) {
        try {
          const result = originalMethod.apply(this, args)
          // Verificar se o resultado é uma Promise
          if (result && typeof result.catch === 'function') {
            return result.catch((error: any) => {
              // Se for erro de rede (status 0), tentar novamente uma vez
              if (error?.status === 0 || error?.message?.includes('Failed to fetch')) {
                console.warn(`⚠️ Erro de rede detectado em ${table}.${method}, tentando novamente...`)
                return new Promise((resolve, reject) => {
                  setTimeout(() => {
                    const retryResult = originalMethod.apply(this, args)
                    if (retryResult && typeof retryResult.then === 'function') {
                      retryResult.then(resolve).catch(reject)
                    } else {
                      resolve(retryResult)
                    }
                  }, 1000)
                })
              }
              throw error
            })
          }
          return result
        } catch (error) {
          throw error
        }
      }
    }
  })
  
  return query
}

// Interceptar erros de auth
const originalAuth = supabase.auth
const originalGetSession = originalAuth.getSession.bind(originalAuth)
originalAuth.getSession = function() {
  const result = originalGetSession()
  // Verificar se o resultado é uma Promise
  if (result && typeof result.catch === 'function') {
    return result.catch((error: any) => {
      // Se for erro de rede, tentar novamente
      if (error?.status === 0 || error?.message?.includes('Failed to fetch')) {
        console.warn('⚠️ Erro de rede ao obter sessão, tentando novamente...')
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            const retryResult = originalGetSession()
            if (retryResult && typeof retryResult.then === 'function') {
              retryResult.then(resolve).catch(reject)
            } else {
              resolve(retryResult)
            }
          }, 1000)
        })
      }
      throw error
    })
  }
  return result
}
