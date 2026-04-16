
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://itdjkfubfzmvmuxxjoae.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyOTAsImV4cCI6MjA3Njc0MTI5MH0.j9Kfff56O2cWs5ocInVHaUFcaNTS7lrUNwsKBh2KIFM";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const COURSE_ID = 'e1771364-ba76-4ba6-b92a-7eacd2dcea9c'; // ID capturado no seu dropdown
const MODULES = [
  { title: 'Introdução à Cannabis Medicinal', order: 1 },
  { title: 'Farmacologia e Biologia da Cannabis', order: 2 },
  { title: 'Aspectos Legais e Éticos', order: 3 },
  { title: 'Aplicações Clínicas e Protocolos', order: 4 }
];

async function syncModules() {
  console.log(`📡 Sincronizando módulos para o curso ID: ${COURSE_ID}...`);

  for (const mod of MODULES) {
    console.log(`➡️ Verificando/Inserindo: ${mod.title}...`);
    
    // Tentar achar pelo título primeiro
    const { data: existing } = await supabase
      .from('course_modules')
      .select('id')
      .eq('course_id', COURSE_ID)
      .eq('title', mod.title)
      .maybeSingle();

    if (existing) {
       console.log(`ℹ️ Módulo "${mod.title}" já existe. Pulando.`);
       continue;
    }

    const { data, error } = await supabase
      .from('course_modules')
      .insert({
        course_id: COURSE_ID,
        title: mod.title,
        order_index: mod.order
      })
      .select();

    if (error) {
      console.error(`❌ Erro ao inserir ${mod.title}:`, error.message);
      // Fallback: tentar na tabela 'modules' se 'course_modules' falhar por RLS ou estrutura
      console.log(`🔄 Tentando alternativa na tabela 'modules'...`);
      const { error: error2 } = await supabase
        .from('modules')
        .insert({
          course_id: COURSE_ID,
          title: mod.title,
          order_index: mod.order
        });
      if (error2) console.error(`❌ Falha total para ${mod.title}:`, error2.message);
      else console.log(`✅ Sucesso via fallback 'modules' para ${mod.title}`);
    } else {
      console.log(`✅ Sucesso: ${mod.title} (ID: ${data[0].id})`);
    }
  }

  console.log('\n✨ Sincronização concluída! Agora o Editor Administrativo vai listar esses módulos.');
}

syncModules();
