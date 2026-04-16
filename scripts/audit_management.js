const PAT = "sbp_0a393442bd99cae232e7120ebe14bc6f0962ba50";
const REF = "itdjkfubfzmvmuxxjoae";

async function run() {
  console.log("Consultando Supabase Management API...");
  try {
    const res = await fetch("https://api.supabase.com/v1/projects", {
      headers: { "Authorization": `Bearer ${PAT}` }
    });
    const projects = await res.json();
    console.log(`Encontrados ${projects.length} projetos.`);
    
    let targetProject = null;
    for (const p of projects) {
        console.log(`- ${p.name} (${p.id})`);
        if (p.id === REF) targetProject = p;
    }

    if (targetProject) {
        console.log(`\nBuscando credenciais para o projeto ${targetProject.name}...`);
        const keysRes = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys`, {
            headers: { "Authorization": `Bearer ${PAT}` }
        });
        const keys = await keysRes.json();
        const serviceKey = keys.find(k => k.name === 'service_role');
        
        if (serviceKey) {
            console.log("\nService Role Key encontrada! Executando auditoria real...\n");
            
            const auditRes = await fetch(`https://${REF}.supabase.co/rest/v1/clinical_reports?select=id,patient_id,created_at,report_type,status,generated_by,interaction_id,content&order=created_at.desc&limit=100`, {
              method: 'GET',
              headers: {
                'apikey': serviceKey.api_key,
                'Authorization': `Bearer ${serviceKey.api_key}`
              }
            });
            const reports = await auditRes.json();
            
            console.log(`Total de relatórios recentes: ${reports?.length}`);
            
            const byPatient = {};
            const withConsentFalse = [];
            const emptyReports = [];
            
            for (const r of reports || []) {
              if (!byPatient[r.patient_id]) byPatient[r.patient_id] = [];
              byPatient[r.patient_id].push(r);
              
              const content = r.content || {};
              if (typeof content.investigation === 'string' && content.investigation.includes('Investigacao realizada atraves da avaliacao clinica inicial')) {
                emptyReports.push(r.id);
              }
              if (content.consenso?.aceito === false || content.raw?.consentGiven === false) {
                  withConsentFalse.push(r.id);
              }
            }
            
            let foundDupes = false;
            console.log("\n[DUPLICADAS]");
            for (const [pid, patientReports] of Object.entries(byPatient)) {
              if (patientReports.length > 1) {
                console.log(`Paciente ${pid} tem ${patientReports.length} relatórios recentes.`);
                foundDupes = true;
              }
            }
            if (!foundDupes) console.log("OK.");
            
            console.log(`\n[BYPASS] Consenso/Consentimento falso: ${withConsentFalse.length}`);
            if (withConsentFalse.length > 0) console.log(withConsentFalse);

            console.log(`\n[FALLBACK] Relatórios genéricos: ${emptyReports.length}`);
            if (emptyReports.length > 0) console.log(emptyReports);
        }
    }
  } catch (err) {
      console.error(err);
  }
}

run();
