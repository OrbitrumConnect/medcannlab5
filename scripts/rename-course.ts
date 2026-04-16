
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://itdjkfubfzmvmuxxjoae.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyOTAsImV4cCI6MjA3Njc0MTI5MH0.j9Kfff56O2cWs5ocInVHaUFcaNTS7lrUNwsKBh2KIFM";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function renameCourse() {
  console.log("🛠️ Renomeando curso no banco...");
  
  const OLD_TITLE = "Cidade Amiga dos Rins";
  const NEW_TITLE = "Curso da AEC - Avaliação Clínica Inicial";

  const { data, error } = await supabase
    .from('courses')
    .update({ title: NEW_TITLE })
    .ilike('title', OLD_TITLE) // Usar ilike para ser case-insensitive
    .select();

  if (error) {
    console.error("❌ Erro ao renomear:", error.message);
  } else if (data && data.length > 0) {
    console.log(`✅ Sucesso! Curso renomeado para: "${NEW_TITLE}"`);
  } else {
    console.log("⚠️ Nenhum curso encontrado com o nome antigo.");
    
    // Lista todos para conferência se falhar
    const { data: all } = await supabase.from('courses').select('title');
    console.log("Lista de títulos no banco:", all?.map(c => c.title));
  }
}

renameCourse();
