
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://itdjkfubfzmvmuxxjoae.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyOTAsImV4cCI6MjA3Njc0MTI5MH0.j9Kfff56O2cWs5ocInVHaUFcaNTS7lrUNwsKBh2KIFM";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const REAL_AEC_ID = "4a8904fc-3cd2-49d5-8141-6a6807205c8f";

async function inspectRealAEC() {
  console.log(`🔬 Inspecionando a AEC REAL (ID: ${REAL_AEC_ID})...`);

  const { data: modules } = await supabase
    .from('course_modules')
    .select('title')
    .eq('course_id', REAL_AEC_ID);

  if (modules && modules.length > 0) {
    console.log("✅ Módulos encontrados na AEC REAL:");
    modules.forEach(m => console.log(`- ${m.title}`));
  } else {
    console.log("⚠️ A AEC REAL também está sem módulos no banco.");
  }
}

inspectRealAEC();
