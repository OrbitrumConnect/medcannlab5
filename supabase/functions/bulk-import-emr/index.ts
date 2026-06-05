// =============================================================================
// bulk-import-emr — Edge de Migração de Base Clínica (V1.9.588)
// =============================================================================
// Processa UM CHUNK auto-contido (pacientes + os filhos deles) de uma importação.
// O frontend (wizard) parseia o ZIP, monta o plano, cria o import_batch (com termo aceito)
// e chama esta Edge em LOTES de ~50 pacientes (cada chunk traz os filhos dos seus pacientes).
//
// Por que Edge (service role): criar identidade em auth.users exige auth.admin (privilégio que
// NÃO pode ficar no frontend). Modelo prontuário-only: cria auth.users SEM enviar credenciais
// (sem blast) — ativação gota a gota depois. Ver docs/MIGRACAO_BASE_CLINICA_SPEC.md.
//
// ISOLADA: não toca tradevision-core nem nenhum lock. Idempotente (ON CONFLICT source_external_id).
// =============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PatientIn { source_external_id: string; name: string; email: string | null; cpf: string | null; birth_date: string | null; gender: string | null; phone: string | null; address: string | null; blood_type: string | null }
interface ChildIn { source_patient_id: string; source_external_id: string; [k: string]: unknown }
interface ChunkBody {
  import_batch_id: string
  patients: PatientIn[]
  records?: ChildIn[]
  prescriptions?: ChildIn[]
  exams?: ChildIn[]
  documents?: ChildIn[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('env ausente')

    // --- AUTH: o chamador tem que ser o profissional (ou admin) ---
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401)
    const anon = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: authErr } = await anon.auth.getUser()
    if (authErr || !user) return json({ error: 'unauthorized' }, 401)
    const professionalId = user.id

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    // --- Valida o lote: pertence ao profissional + termo aceito ---
    const body = (await req.json()) as ChunkBody
    if (!body?.import_batch_id || !Array.isArray(body.patients)) return json({ error: 'payload inválido' }, 400)
    const { data: batch } = await admin.from('import_batches').select('id, professional_id, terms_accepted, status').eq('id', body.import_batch_id).maybeSingle()
    if (!batch) return json({ error: 'lote inexistente' }, 404)
    if (batch.professional_id !== professionalId) return json({ error: 'lote de outro profissional' }, 403)
    if (!batch.terms_accepted) return json({ error: 'termo não aceito' }, 403)

    const ns = (raw: string) => `${professionalId}::${raw}` // namespace anti-colisão + idempotência
    const errorLog: Array<{ source: string; etapa: string; erro: string }> = []
    const idMap = new Map<string, string>() // source raw → UUID nosso
    let created = 0, merged = 0

    // --- 1. Pacientes: dedup (CPF→email) ou cria via admin (auth.users) ---
    for (const p of body.patients) {
      try {
        let existing: string | null = null
        if (p.cpf) { const { data } = await admin.from('users').select('id').eq('cpf', p.cpf).limit(1).maybeSingle(); existing = data?.id ?? null }
        if (!existing && p.email) { const { data } = await admin.from('users').select('id').eq('email', p.email).limit(1).maybeSingle(); existing = data?.id ?? null }
        if (existing) { idMap.set(p.source_external_id, existing); merged++; continue }

        const newId = crypto.randomUUID()
        const email = p.email || `import+${newId}@medcannlab.local`
        const { error: aErr } = await admin.auth.admin.createUser({ id: newId, email, email_confirm: true, password: crypto.randomUUID(), user_metadata: { name: p.name, type: 'patient', imported: true } })
        if (aErr) throw aErr
        // o trigger handle_new_user cria public.users básico; completamos com demografia+proveniência
        const { error: uErr } = await admin.from('users').update({
          name: p.name, cpf: p.cpf, birth_date: p.birth_date, gender: p.gender, phone: p.phone,
          address: p.address, blood_type: p.blood_type, type: 'patient',
          source_external_id: ns(p.source_external_id), import_batch_id: body.import_batch_id,
        }).eq('id', newId)
        if (uErr) throw uErr
        idMap.set(p.source_external_id, newId)
        created++
      } catch (e) {
        errorLog.push({ source: p.source_external_id, etapa: 'patient', erro: String((e as Error)?.message || e) })
      }
    }

    // --- 2. Vínculos (1 por paciente do chunk; ON CONFLICT patient_id+professional_id) ---
    const links = body.patients.map((p) => idMap.get(p.source_external_id)).filter(Boolean).map((pid) => ({
      patient_id: pid, professional_id: professionalId, relationship: 'imported', source: 'import', import_batch_id: body.import_batch_id,
    }))
    if (links.length) { const { error } = await admin.from('patient_professional_links').upsert(links, { onConflict: 'patient_id,professional_id', ignoreDuplicates: true }); if (error) errorLog.push({ source: '-', etapa: 'links', erro: error.message }) }

    // --- 3. Filhos: resolve source_patient_id → UUID; idempotente via source_external_id namespaced ---
    const resolveAndInsert = async (rows: ChildIn[] | undefined, table: string, map: (r: ChildIn, pid: string) => Record<string, unknown>) => {
      if (!rows?.length) return 0
      const ready = rows.map((r) => { const pid = idMap.get(r.source_patient_id); return pid ? map(r, pid) : null }).filter(Boolean) as Record<string, unknown>[]
      if (!ready.length) return 0
      const { error } = await admin.from(table).upsert(ready, { onConflict: 'source_external_id', ignoreDuplicates: true })
      if (error) { errorLog.push({ source: '-', etapa: table, erro: error.message }); return 0 }
      return ready.length
    }

    const nRecords = await resolveAndInsert(body.records, 'patient_medical_records', (r, pid) => ({ patient_id: pid, record_type: 'evolution', record_data: (r as any).record_data, source_external_id: ns(r.source_external_id), import_batch_id: body.import_batch_id }))
    const nRx = await resolveAndInsert(body.prescriptions, 'patient_medical_records', (r, pid) => ({ patient_id: pid, record_type: 'prescription_history', record_data: { content: (r as any).content, status: (r as any).status }, source_external_id: ns(r.source_external_id), import_batch_id: body.import_batch_id }))
    const nExams = await resolveAndInsert(body.exams, 'patient_medical_records', (r, pid) => ({ patient_id: pid, record_type: 'exam_history', record_data: { description: (r as any).description, status: (r as any).status }, source_external_id: ns(r.source_external_id), import_batch_id: body.import_batch_id }))
    const nDocs = await resolveAndInsert(body.documents, 'patient_documents', (r, pid) => ({ patient_id: pid, original_name: (r as any).name, file_path: (r as any).path ?? '', category: 'imported', description: 'Documento importado', source_external_id: ns(r.source_external_id), import_batch_id: body.import_batch_id }))

    // --- 4. Progresso do lote (acumula este chunk; chunks rodam SEQUENCIAIS pelo frontend → sem race) ---
    const { data: cur } = await admin.from('import_batches').select('processed_count, total_records, error_count, error_log').eq('id', body.import_batch_id).maybeSingle()
    await admin.from('import_batches').update({
      status: 'running',
      processed_count: (cur?.processed_count ?? 0) + created + merged,
      total_records: (cur?.total_records ?? 0) + nRecords + nRx + nExams + nDocs,
      error_count: (cur?.error_count ?? 0) + errorLog.length,
      error_log: [...(((cur?.error_log as any[]) ?? [])), ...errorLog].slice(0, 500),
    }).eq('id', body.import_batch_id)

    return json({
      ok: true,
      chunk: { created, merged, links: links.length, records: nRecords, prescriptions: nRx, exams: nExams, documents: nDocs, errors: errorLog.length },
    }, 200)
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }

  function json(b: unknown, status: number) {
    return new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
