
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://itdjkfubfzmvmuxxjoae.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyOTAsImV4cCI6MjA3Njc0MTI5MH0.j9Kfff56O2cWs5ocInVHaUFcaNTS7lrUNwsKBh2KIFM";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const TARGET_COURSE_ID = "750d2548-a04a-4af6-bdb4-7fe35b954522";

async function inspectCourse() {
  console.log(`🔬 Inspecionando Conteúdo do Curso (ID: ${TARGET_COURSE_ID})...`);

  // 1. Buscar Módulos
  console.log("\n📁 Módulos Encontrados:");
  const { data: modules, error: modError } = await supabase
    .from('course_modules')
    .select('id, title, order_index')
    .eq('course_id', TARGET_COURSE_ID)
    .order('order_index', { ascending: true });

  if (modError) console.error("❌ Erro ao buscar módulos:", modError.message);
  else if (modules && modules.length > 0) {
    modules.forEach(m => console.log(`- [Módulo] ${m.title} (Index: ${m.order_index})`));
  } else {
    console.log("⚠️ Nenhum módulo real no banco para este curso.");
  }

  // 2. Buscar Aulas (se a tabela lessons existir)
  console.log("\n🎥 Aulas/Conteúdos Encontrados:");
  const { data: lessons, error: lessError } = await supabase
    .from('lessons')
    .select('id, title, module_id, video_url')
    .eq('course_id', TARGET_COURSE_ID);

  if (lessError) {
     // Tentar na própria tabela de módulos caso as aulas estejam lá dentro
     const { data: moduleContent } = await supabase
        .from('course_modules')
        .select('title, content_url')
        .eq('course_id', TARGET_COURSE_ID)
        .not('content_url', 'is', null);
     
     if (moduleContent && moduleContent.length > 0) {
        moduleContent.forEach(c => console.log(`- [Conteúdo] ${c.title} -> ${c.content_url}`));
     } else {
        console.log("⚠️ Nenhuma aula vinculada.");
     }
  } else if (lessons && lessons.length > 0) {
    lessons.forEach(l => console.log(`- [Aula] ${l.title} (Video: ${l.video_url})`));
  } else {
    console.log("⚠️ Nenhuma aula vinculada.");
  }
}

inspectCourse();
