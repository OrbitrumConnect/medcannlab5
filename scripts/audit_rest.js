const SUPABASE_URL = "https://itdjkfubfzmvmuxxjoae.supabase.co";
const SUPABASE_KEY = "sbp_0a393442bd99cae232e7120ebe14bc6f0962ba50";

async function audit() {
  console.log("Iniciando auditoria via REST API...");
  
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/clinical_reports?select=id,patient_id,created_at,report_type,status,generated_by,interaction_id,content&order=created_at.desc&limit=100`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const reports = await res.json();
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
    let foundDupes = false;
    for (const [pid, patientReports] of Object.entries(byPatient)) {
      if (patientReports.length > 1) {
        console.log(`Paciente ${pid} tem ${patientReports.length} relatórios recentes.`);
        foundDupes = true;
      }
    }
    if (!foundDupes) console.log("Nenhum usuário com múltiplos relatórios entre os últimos 100.");
    
    console.log("\n--- Relatórios com Consentimento Recusado (Bypass detectado) ---");
    console.log(`Encontrados: ${withConsentFalse.length}`);
    if (withConsentFalse.length > 0) console.log(withConsentFalse);

    console.log("\n--- Relatórios Genéricos/Vazios (Fallback trigger) ---");
    console.log(`Encontrados: ${emptyReports.length}`);
    if (emptyReports.length > 0) console.log(emptyReports);

  } catch (err) {
      console.error(err);
  }
}

audit();
