# 🔧 Correção: Erros ao Recarregar a Página

## ❌ Problemas Identificados

### 1. Erro 400: `column notifications.expires_at does not exist`
- **Causa:** A query estava tentando filtrar por `expires_at` que não existe na tabela `notifications`
- **Impacto:** Erro ao buscar notificações

### 2. Erro 404: `POST /rest/v1/rpc/get_unread_notifications_count`
- **Causa:** A função RPC `get_unread_notifications_count` não existe no Supabase
- **Impacto:** Erro ao contar notificações não lidas

### 3. Erro Service Worker: `Failed to execute 'put' on 'Cache': Request method 'POST' is unsupported`
- **Causa:** O service worker estava tentando cachear requisições POST
- **Impacto:** Erros no console e possível impacto na performance

---

## ✅ Correções Implementadas

### 1. Correção da Query de Notificações (`notificationService.ts`)

**Antes:**
```typescript
query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
```

**Depois:**
```typescript
// Tentar filtrar por expires_at, mas se não existir, ignorar o erro
try {
  query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
} catch (expiresError) {
  // Se expires_at não existir, continuar sem filtrar
  console.warn('⚠️ Coluna expires_at não existe, ignorando filtro de expiração')
}

// Se o erro for sobre expires_at, tentar novamente sem o filtro
if (error.message?.includes('expires_at') || error.code === '42703') {
  // Retry sem filtro de expiração
}
```

### 2. Correção da Função RPC (`notificationService.ts`)

**Antes:**
```typescript
const { data, error } = await supabase
  .rpc('get_unread_notifications_count', { user_uuid: userId })

if (error) {
  // Fallback básico
}
```

**Depois:**
```typescript
const { data, error } = await supabase
  .rpc('get_unread_notifications_count', { user_uuid: userId })

if (error) {
  // Detectar se a função não existe (404, 42883, etc)
  if (error.code === 'P0001' || error.code === '42883' || 
      error.message?.includes('does not exist') || 
      error.message?.includes('function') || 
      error.code === '404') {
    console.warn('⚠️ Função RPC não existe, usando fallback')
  }
  // Fallback: contar manualmente
  const notifications = await this.getUserNotifications(userId, { unreadOnly: true })
  return notifications.length
}
```

### 3. Correção do Service Worker (`sw.js`)

**Antes:**
```javascript
// Cacheava todas as requisições, incluindo POST
cache.put(event.request, responseToCache)
```

**Depois:**
```javascript
// Não cachear requisições POST, PUT, DELETE
if (event.request.method !== 'GET') {
  event.respondWith(fetch(event.request))
  return
}

// Não cachear requisições para APIs
if (url.pathname.includes('/rest/v1/') || 
    url.pathname.includes('/storage/v1/') ||
    url.hostname.includes('api.openai.com') ||
    url.hostname.includes('supabase.co')) {
  event.respondWith(fetch(event.request))
  return
}

// Só cachear respostas bem-sucedas e cacheáveis
if (response.status === 200 && response.type === 'basic') {
  cache.put(event.request, responseToCache).catch((err) => {
    // Ignorar erros de cache silenciosamente
  })
}
```

---

## 🎯 Resultados Esperados

Após as correções:

1. ✅ **Sem erro 400** ao buscar notificações (mesmo sem `expires_at`)
2. ✅ **Sem erro 404** ao contar notificações não lidas (usa fallback quando RPC não existe)
3. ✅ **Sem erro no Service Worker** ao recarregar a página
4. ✅ **Melhor performance** (não tenta cachear requisições desnecessárias)

---

## 📝 Arquivos Modificados

- `src/services/notificationService.ts`:
  - Método `getUserNotifications`: Tratamento de erro para `expires_at`
  - Método `getUnreadCount`: Melhor tratamento de erro para RPC não existente

- `public/sw.js`:
  - Filtro para não cachear requisições POST/PUT/DELETE
  - Filtro para não cachear requisições de API
  - Tratamento de erros de cache

---

## ⚠️ Notas Importantes

1. **Coluna `expires_at`:**
   - Se você quiser adicionar essa coluna no futuro, execute:
   ```sql
   ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP;
   ```

2. **Função RPC:**
   - Se você quiser criar a função RPC no futuro, execute:
   ```sql
   CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_uuid UUID)
   RETURNS INTEGER AS $$
   BEGIN
     RETURN (SELECT COUNT(*) FROM notifications WHERE user_id = user_uuid AND is_read = false);
   END;
   $$ LANGUAGE plpgsql;
   ```

3. **Service Worker:**
   - O service worker agora só cacheia recursos estáticos (HTML, CSS, JS, imagens)
   - Requisições de API não são cacheadas (comportamento correto)

---

**Data:** 2025-01-26
**Status:** ✅ Corrigido

