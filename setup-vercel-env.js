/**
 * 🚀 SETUP VARIÁVEIS DE AMBIENTE PARA VERCEL
 * 
 * Este script gera comandos para configurar as variáveis de ambiente no Vercel
 */

console.log('\n📋 CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE - VERCEL\n')
console.log('='.repeat(60))

const envVariables = [
  {
    key: 'VITE_OPENAI_API_KEY',
    description: 'Chave da API OpenAI para o Assistant GPT-4',
    value: 'sk-proj-SUA_CHAVE_AQUI',
    required: true
  },
  {
    key: 'VITE_SUPABASE_URL',
    description: 'URL do projeto Supabase',
    value: 'https://itdjkfubfzmvmuxxjoae.supabase.co',
    required: true
  },
  {
    key: 'VITE_SUPABASE_ANON_KEY',
    description: 'Chave anônima pública do Supabase',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyOTAsImV4cCI6MjA3Njc0MTI5MH0.j9Kfff56O2cWs5ocInVHaUFcaNTS7lrUNwsKBh2KIFM',
    required: true
  },
  {
    key: 'VITE_API_BASE_URL',
    description: 'URL base da API do MedCannLab',
    value: 'https://api.medcannlab.com',
    required: false
  },
  {
    key: 'VITE_API_KEY',
    description: 'Chave de autenticação da API',
    value: 'sua_api_key_aqui',
    required: false
  }
]

console.log('\n🔧 COMANDOS PARA VERCEL CLI:\n')
console.log('─'.repeat(60))

envVariables.forEach((env, index) => {
  const required = env.required ? '✅ REQUIRED' : '⭕ OPTIONAL'
  console.log(`\n${index + 1}. ${required}`)
  console.log(`   Chave: ${env.key}`)
  console.log(`   Descrição: ${env.description}`)
  console.log(`   Comando:`)
  console.log(`   vercel env add ${env.key} production`)
  console.log(`   ${env.value}`)
})

console.log('\n' + '─'.repeat(60))
console.log('\n📝 PASSOS PARA CONFIGURAR:\n')

console.log('1️⃣  Instalar Vercel CLI:')
console.log('   npm i -g vercel\n')

console.log('2️⃣  Fazer login:')
console.log('   vercel login\n')

console.log('3️⃣  Adicionar cada variável:')
envVariables.filter(e => e.required).forEach((env, index) => {
  console.log(`   ${index + 1}. vercel env add ${env.key} production`)
  console.log(`      Valor: ${env.value}`)
})

console.log('\n4️⃣  Verificar variáveis:')
console.log('   vercel env ls\n')

console.log('5️⃣  Fazer novo deploy:')
console.log('   git push\n')

console.log('─'.repeat(60))
console.log('\n🌐 OU VIA PAINEL WEB:\n')
console.log('1. Acesse: https://vercel.com/dashboard')
console.log('2. Selecione seu projeto')
console.log('3. Settings → Environment Variables')
console.log('4. Add New → Preencha:')
envVariables.filter(e => e.required).forEach((env) => {
  console.log(`   - Key: ${env.key}`)
  console.log(`   - Value: ${env.value}`)
  console.log('')
})

console.log('─'.repeat(60))
console.log('\n✅ CONFIGURAÇÃO COMPLETA!\n')

