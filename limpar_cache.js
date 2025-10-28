// Execute no console do navegador (F12)

console.log('🧹 Limpando localStorage do chat...');

// Limpar mensagens offline do chat
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('chat_messages_')) {
    localStorage.removeItem(key);
    console.log('✅ Removido:', key);
  }
});

console.log('✅ LocalStorage limpo! Recarregue a página.');
location.reload();

