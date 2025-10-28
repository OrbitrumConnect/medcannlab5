import { createClient } from '@supabase/supabase-js'

// Usar variáveis de ambiente ou fallback para desenvolvimento
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://lhclqebtkyfftkevumix.supabase.co'
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoY2xxZWJ0a3lmZnRrZXZ1bWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzM1MDIsImV4cCI6MjA3MTE0OTUwMn0.YgAdq9Rh-b-fwN_XA_hqJxXxMDS7IARnIr_5YTWX020'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
