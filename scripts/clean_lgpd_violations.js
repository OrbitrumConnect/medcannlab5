const PAT = "sbp_0a393442bd99cae232e7120ebe14bc6f0962ba50";
const REF = "itdjkfubfzmvmuxxjoae";

async function runCleanUp() {
  console.log("Iniciando varredura e limpeza LGPD no Supabase...");
  try {
    const keysRes = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys`, {
        headers: { "Authorization": `Bearer ${PAT}` }
    });
    const keys = await keysRes.json();
    const serviceKey = keys.find(k => k.name === 'service_role');
    
    if (!serviceKey) throw new Error("Service key não encontrada");

    // Buscar relatórios recentes
    const auditRes = await fetch(`https://${REF}.supabase.co/rest/v1/clinical_reports?select=id,content`, {
      method: 'GET',
      headers: {
        'apikey': serviceKey.api_key,
        'Authorization': `Bearer ${serviceKey.api_key}`
      }
    });

    const reports = await auditRes.json();
    const reportsToDelete = [];

    for (const r of reports || []) {
      const content = r.content || {};
      if (content.consenso?.aceito === false || content.raw?.consentGiven === false) {
          reportsToDelete.push(r.id);
      }
    }

    if (reportsToDelete.length === 0) {
        console.log("Banco já está limpo. Nenhum relatório vazado encontrado.");
        return;
    }

    console.log(`Deletando ${reportsToDelete.length} relatórios violando LGPD...`);
    
    // Deletando Reports
    const deleteParams = new URLSearchParams();
    deleteParams.append('id', `in.(${reportsToDelete.join(',')})`);
    
    const deleteRes = await fetch(`https://${REF}.supabase.co/rest/v1/clinical_reports?${deleteParams.toString()}`, {
        method: 'DELETE',
        headers: {
            'apikey': serviceKey.api_key,
            'Authorization': `Bearer ${serviceKey.api_key}`
        }
    });

    if (deleteRes.ok) {
        console.log(`✅ Sucesso! ${reportsToDelete.length} relatórios apagados.`);
    } else {
        console.error("Falha ao deletar:", await deleteRes.text());
    }

  } catch (err) {
      console.error(err);
  }
}

runCleanUp();
