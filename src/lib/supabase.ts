import { createClient } from '@supabase/supabase-js'

// Usa as variáveis de ambiente configuradas no Vite / Vercel
// (ver `VERCEL_ENV_VARIABLES.md`)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Log bem explícito no console do navegador para facilitar debug
  console.error(
    '❌ Variáveis de ambiente do Supabase não encontradas. ' +
      'Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

