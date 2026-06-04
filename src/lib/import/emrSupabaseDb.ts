/**
 * Adapter de I/O do executor de Migração de Base Clínica — implementa ImportDb.
 * Camada FINA; a lógica (dedup, resolução UUID, proveniência) vive no executeImportPlan (testado).
 *
 * ⚠️ REQUER CLIENT DE SERVICE ROLE → roda numa EDGE FUNCTION, NÃO no frontend.
 * MOTIVO (achado empírico 04/06): `patient_medical_records.patient_id` e
 * `patient_documents.patient_id` têm FK para **auth.users(id)** (não public.users). Logo o paciente
 * importado PRECISA existir em auth.users. Criamos via `auth.admin.createUser` (service role) SEM
 * enviar credenciais (sem blast) — mantém prontuário-only + ativação gota a gota. O frontend (wizard)
 * parseia/preview e POSTa o plano pra a Edge; a Edge executa com este adapter. Este arquivo é a
 * REFERÊNCIA do que a Edge de import faz (a Edge porta esta lógica em Deno).
 *
 * DECISÃO DE DESTINO: histórico clínico externo (notas/prescrições/exames) vai TODO pra
 * `patient_medical_records` com record_type distinto — NÃO polui cfm_prescriptions/
 * patient_exam_requests (artefatos ASSINADOS ICP). Proveniência via import_batch_id.
 */
import type { ImportDb } from './emrExecutor'

export interface SupabaseImportDbOptions {
  professionalId: string
}

/** Cria um ImportDb apoiado num client de SERVICE ROLE (contexto Edge). */
export function createSupabaseImportDb(client: any, _opts: SupabaseImportDbOptions): ImportDb {
  return {
    async findExistingPatient(cpf, email) {
      if (cpf) {
        const { data } = await client.from('users').select('id').eq('cpf', cpf).limit(1).maybeSingle()
        if (data?.id) return data.id
      }
      if (email) {
        const { data } = await client.from('users').select('id').eq('email', email).limit(1).maybeSingle()
        if (data?.id) return data.id
      }
      return null
    },

    async insertPatient(row) {
      // FK patient_medical_records/patient_documents → auth.users → o paciente PRECISA existir em
      // auth.users. Cria via admin (service role) SEM credenciais entregues (sem blast); ativação
      // gota a gota depois. O trigger fn_on_auth_user_created cria o public.users básico; completamos
      // com a demografia + proveniência. (Mesmo padrão da Edge create-patient-auth V1.9.533.)
      const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      const email = row.email || `import+${id}@medcannlab.local` // sintético único se ausente
      const { error: authErr } = await client.auth.admin.createUser({
        id,
        email,
        email_confirm: true,
        password: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random()}`, // random, nunca entregue
        user_metadata: { name: row.name, type: 'patient', imported: true },
      })
      if (authErr) throw authErr
      // completa o public.users criado pelo trigger com demografia + proveniência
      const { error: updErr } = await client
        .from('users')
        .update({
          name: row.name,
          cpf: row.cpf,
          birth_date: row.birth_date,
          gender: row.gender,
          phone: row.phone,
          address: row.address,
          blood_type: row.blood_type,
          type: 'patient',
          source_external_id: row.source_external_id,
          import_batch_id: row.import_batch_id,
        })
        .eq('id', id)
      if (updErr) throw updErr
      return id
    },

    async insertLinks(rows) {
      if (!rows.length) return
      const { error } = await client.from('patient_professional_links').insert(rows)
      if (error) throw error
    },

    async insertRecords(rows) {
      if (!rows.length) return
      const { error } = await client.from('patient_medical_records').insert(
        rows.map((r) => ({
          patient_id: r.patient_id,
          record_type: r.record_type, // 'evolution'
          record_data: r.record_data,
          source_external_id: r.source_external_id,
          import_batch_id: r.import_batch_id,
        })),
      )
      if (error) throw error
    },

    async insertPrescriptions(rows) {
      if (!rows.length) return
      // histórico externo → patient_medical_records (NÃO cfm_prescriptions, que é ICP assinado)
      const { error } = await client.from('patient_medical_records').insert(
        rows.map((r) => ({
          patient_id: r.patient_id,
          record_type: 'prescription_history',
          record_data: { content: r.content, status: r.status },
          source_external_id: r.source_external_id,
          import_batch_id: r.import_batch_id,
        })),
      )
      if (error) throw error
    },

    async insertExams(rows) {
      if (!rows.length) return
      const { error } = await client.from('patient_medical_records').insert(
        rows.map((r) => ({
          patient_id: r.patient_id,
          record_type: 'exam_history',
          record_data: { description: r.description, status: r.status },
          source_external_id: r.source_external_id,
          import_batch_id: r.import_batch_id,
        })),
      )
      if (error) throw error
    },

    async insertDocuments(rows) {
      if (!rows.length) return
      const { error } = await client.from('patient_documents').insert(
        rows.map((r) => ({
          patient_id: r.patient_id,
          original_name: r.name,
          file_path: r.path ?? '',
          category: 'imported',
          description: 'Documento importado',
          source_external_id: r.source_external_id,
          import_batch_id: r.import_batch_id,
        })),
      )
      if (error) throw error
    },

    async finishBatch(batchId, counts) {
      const { error } = await client
        .from('import_batches')
        .update({ status: 'done', total_patients: counts.patients, total_records: counts.records })
        .eq('id', batchId)
      if (error) throw error
    },
  }
}
