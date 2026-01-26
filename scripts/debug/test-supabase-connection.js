// Script para testar conexão com Supabase
import { supabase } from './src/lib/supabase.ts'

console.log('🔗 Testando conexão com Supabase...')
console.log('📍 URL:', import.meta.env.VITE_SUPABASE_URL)

// Teste 1: Verificar se as variáveis estão configuradas
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('❌ Variáveis de ambiente não configuradas!')
    console.log('💡 Execute: cp .env.example .env')
    process.exit(1)
}

console.log('✅ Variáveis de ambiente configuradas')

// Teste 2: Tentar conectar e buscar dados
try {
    const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true })

    if (error) {
        console.error('❌ Erro ao conectar ao Supabase:', error.message)
        process.exit(1)
    }

    console.log('✅ Conexão com Supabase estabelecida!')
    console.log(`📊 Total de usuários:`, data)

    // Teste 3: Verificar autenticação
    const { data: session } = await supabase.auth.getSession()
    if (session) {
        console.log('✅ Sessão ativa:', session.session?.user?.email)
    } else {
        console.log('ℹ️  Nenhuma sessão ativa (esperado antes do login)')
    }

    console.log('\n🎉 Todos os testes passaram!')

} catch (err) {
    console.error('❌ Erro inesperado:', err)
    process.exit(1)
}
