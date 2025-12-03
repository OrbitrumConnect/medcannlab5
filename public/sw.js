// Service Worker para MedCannLab 3.0
const CACHE_NAME = 'medcannlab-v3.0.5' // Incrementado para forçar atualização
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker instalado')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error('❌ Erro ao instalar Service Worker:', error)
      })
  )
  self.skipWaiting()
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('🗑️ Removendo cache antigo:', cacheName)
            return caches.delete(cacheName)
          })
      ).then(() => {
        // Forçar atualização imediata
        return self.clients.claim()
      })
    })
  )
})

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const request = event.request
  const method = request.method
  
  // CRÍTICO: O Cache API só suporta requisições GET
  // Ignorar completamente requisições não-GET (HEAD, POST, PUT, DELETE, etc)
  if (method !== 'GET') {
    // Para requisições não-GET, apenas fazer fetch sem tentar cachear
    event.respondWith(
      fetch(request).catch(() => {
        // Se falhar, retornar resposta vazia
        return new Response('', { status: 200 })
      })
    )
    return
  }
  
  // Não cachear requisições para APIs (Supabase, OpenAI, etc) e HMR do Vite
  try {
    const url = new URL(request.url)
    
    // Ignorar requisições do HMR do Vite (Hot Module Replacement)
    if (url.pathname.includes('/@vite/') || 
        url.pathname.includes('/@react-refresh') ||
        url.pathname.includes('/@id/') ||
        url.pathname.includes('/node_modules/') ||
        url.searchParams.has('import') ||
        url.searchParams.has('t')) {
      // Para HMR, apenas fazer fetch sem interceptar
      event.respondWith(fetch(request))
      return
    }
    
    if (url.pathname.includes('/rest/v1/') || 
        url.pathname.includes('/storage/v1/') ||
        url.hostname.includes('api.openai.com') ||
        url.hostname.includes('supabase.co') ||
        url.hostname.includes('vercel.app')) {
      // Para APIs, apenas fazer fetch sem cachear
      event.respondWith(
        fetch(request).catch(() => {
          return new Response('', { status: 200 })
        })
      )
      return
    }
  } catch (e) {
    // Se não conseguir fazer parse da URL, apenas fazer fetch
    event.respondWith(fetch(request))
    return
  }
  
  // Estratégia: Network First, fallback para cache (APENAS para GET)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Verificações múltiplas antes de tentar cachear
        // 1. Método deve ser GET (já verificado acima, mas garantindo)
        // 2. Status deve ser 200
        // 3. Tipo deve ser 'basic' (não CORS, não opaque)
        // 4. Não deve ter cache: no-store
        if (method === 'GET' && 
            response.status === 200 && 
            response.type === 'basic' &&
            request.cache !== 'no-store' &&
            request.headers.get('cache-control') !== 'no-store') {
          
          // Clonar resposta para cache (não modificar a original)
          const responseToCache = response.clone()
          
          // Tentar cachear de forma assíncrona (não bloquear a resposta)
          caches.open(CACHE_NAME).then((cache) => {
            // Verificação final antes de cache.put()
            if (request.method === 'GET') {
              cache.put(request, responseToCache).catch((err) => {
                // Ignorar erros de cache completamente (não logar)
                // Erros comuns: HEAD requests, POST requests, etc
              })
            }
          }).catch(() => {
            // Ignorar erros ao abrir cache
          })
        }
        
        return response
      })
      .catch(() => {
        // Fallback para cache se offline (apenas para GET)
        if (method === 'GET') {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 })
          })
        }
        return new Response('Offline', { status: 503 })
      })
  )
})

