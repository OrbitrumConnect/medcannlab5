import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = "https://itdjkfubfzmvmuxxjoae.supabase.co";
const SUPABASE_KEY = "sbp_0a393442bd99cae232e7120ebe14bc6f0962ba50";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function audit() {
  console.log("Iniciando auditoria no Supabase...");
  
  // 1. Check for duplicate reports by patient_id
  const { data: reports, error: repsError } = await supabase
    .from('clinical_reports')
    .select('id, patient_id, created_at, report_type, status, generated_by, interaction_id, content')
    .order('created_at', { ascending: false })
    .limit(100);

  if (repsError) {
    console.error("Erro ao buscar reports:", repsError);
  } else {
    console.log(`Total de relatórios recentes: ${reports?.length}`);
    
    // Agrupar por paciente
    const byPatient = {};
    const withConsentFalse = [];
    const emptyReports = [];
    
    for (const r of reports || []) {
      if (!byPatient[r.patient_id]) byPatient[r.patient_id] = [];
      byPatient[r.patient_id].push(r);
      
      const content = r.content || {};
      
      // Check for empty/generic reports
      if (typeof content.investigation === 'string' && content.investigation.includes('Investigacao realizada atraves da avaliacao clinica inicial')) {
        emptyReports.push(r.id);
      }
      
      // Check consent
      if (content.consenso?.aceito === false || content.raw?.consentGiven === false) {
          withConsentFalse.push(r.id);
      }
    }
    
    console.log("\n--- Relatórios Duplicados ---");
    for (const [pid, patientReports] of Object.entries(byPatient)) {
      if (patientReports.length > 1) {
        console.log(`Paciente ${pid} tem ${patientReports.length} relatórios recentes.`);
      }
    }
    
    console.log("\n--- Relatórios com Consentimento Recusado (Bypass detectado) ---");
    console.log(`Encontrados: ${withConsentFalse.length}`);
    if (withConsentFalse.length > 0) console.log(withConsentFalse);

    console.log("\n--- Relatórios Genéricos/Vazios (Fallback trigger) ---");
    console.log(`Encontrados: ${emptyReports.length}`);
    if (emptyReports.length > 0) console.log(emptyReports);
  }

  // 2. Check aec_assessment_state
  const { data: states, error: statesError } = await supabase
    .from('aec_assessment_state')
    .select('*')
    .limit(10);
    
  if (statesError) {
      console.log("Tabela aec_assessment_state não encontrada ou erro:", statesError);
  } else {
      console.log(`\nEstados AEC em andamento/abertos: ${states?.length}`);
  }
}

audit().catch(console.error);
