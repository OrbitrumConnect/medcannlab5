
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://itdjkfubfzmvmuxxjoae.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyOTAsImV4cCI6MjA3Njc0MTI5MH0.j9Kfff56O2cWs5ocInVHaUFcaNTS7lrUNwsKBh2KIFM";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function listCourses() {
  console.log("📋 Listando todos os cursos no Banco de Dados...");
  const { data, error } = await supabase.from('courses').select('id, title, category');

  if (error) {
    console.error("❌ Erro ao listar cursos:", error.message);
  } else {
    data.forEach(c => {
      console.log(`- [${c.id}] ${c.title} (${c.category})`);
    });
  }
}

listCourses();
