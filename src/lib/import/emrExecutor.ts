/**
 * Executor PURO do motor de Migração de Base Clínica (#5/executor).
 * Recebe o MappedImport (saída do emrMapper) + opts (batch/profissional) e produz um
 * ImportPlan: as linhas PRONTAS PARA INSERIR em cada tabela, já etiquetadas com proveniência
 * (import_batch_id) — um DRY-RUN inspecionável.
 *
 * NÃO escreve no banco. A gravação real (insert + resolver source_patient_id → UUID novo do
 * paciente + dedup contra users existentes) é o REAL LOAD — passo gated em Marco 1 (CNPJ/DPA),
 * implementado em sessão dedicada quando o jurídico destravar. Aqui só montamos o plano.
 *
 * Por que puro+isolado: zero side-effect no banco/UI até alguém chamar o real load. Igual o
 * serializer FHIR e o emrMapper. Ver docs/MIGRACAO_BASE_CLINICA_SPEC.md.
 */
import type {
  MappedImport, MappedPatient, MappedRecord, MappedPrescription, MappedExam, MappedFile,
} from './emrTypes'

export interface ImportPlanOptions {
  batchId: string
  professionalId: string
}

/** Vínculo a ser criado: 1 por paciente importado → torna o paciente visível pro médico (#1). */
export interface PlanLink {
  source_patient_id: string // Id do paciente no EMR; resolvido p/ UUID novo no insert
  professional_id: string
  relationship: 'imported'
  source: 'import'
  import_batch_id: string
}

type WithBatch<T> = T & { import_batch_id: string }

export interface ImportPlan {
  batchId: string
  professionalId: string
  patients: WithBatch<MappedPatient>[]
  links: PlanLink[]
  records: WithBatch<MappedRecord>[]
  prescriptions: WithBatch<MappedPrescription>[]
  exams: WithBatch<MappedExam>[]
  documents: WithBatch<MappedFile>[]
  summary: {
    patients: number
    links: number
    records: number
    prescriptions: number
    exams: number
    documents: number
    total: number
  }
  warnings: string[]
}

/**
 * Monta o plano de inserção a partir do MappedImport. PURO — etiqueta tudo com import_batch_id
 * e cria 1 vínculo (patient_professional_links) por paciente. NÃO grava nada.
 */
export function buildImportPlan(mapped: MappedImport, opts: ImportPlanOptions): ImportPlan {
  if (!opts.batchId) throw new Error('buildImportPlan: batchId obrigatório')
  if (!opts.professionalId) throw new Error('buildImportPlan: professionalId obrigatório')

  const tag = <T>(arr: T[]): WithBatch<T>[] => arr.map((x) => ({ ...x, import_batch_id: opts.batchId }))

  const patients = tag(mapped.patients)
  const records = tag(mapped.records)
  const prescriptions = tag(mapped.prescriptions)
  const exams = tag(mapped.exams)
  const documents = tag(mapped.files)

  // 1 vínculo por paciente importado (relationship='imported') → visibilidade pro médico (#1)
  const links: PlanLink[] = mapped.patients.map((p: MappedPatient) => ({
    source_patient_id: p.source_external_id,
    professional_id: opts.professionalId,
    relationship: 'imported',
    source: 'import',
    import_batch_id: opts.batchId,
  }))

  const summary = {
    patients: patients.length,
    links: links.length,
    records: records.length,
    prescriptions: prescriptions.length,
    exams: exams.length,
    documents: documents.length,
    total: patients.length + records.length + prescriptions.length + exams.length + documents.length,
  }

  return {
    batchId: opts.batchId,
    professionalId: opts.professionalId,
    patients,
    links,
    records,
    prescriptions,
    exams,
    documents,
    summary,
    warnings: [...mapped.warnings],
  }
}

/** Resumo legível do plano (para a Etapa 3/5 do wizard — "vai importar X, Y, Z"). */
export function describeImportPlan(plan: ImportPlan): string {
  const s = plan.summary
  return [
    `${s.patients} paciente(s)`,
    `${s.records} evolução(ões)`,
    `${s.prescriptions} prescrição(ões)`,
    `${s.exams} exame(s)`,
    `${s.documents} documento(s)`,
  ].join(' · ')
}

// ───────────────────────── REAL LOAD (executeImportPlan) ─────────────────────────
// A LÓGICA de execução (resolver Id-do-EMR → UUID novo, dedup, ordem, proveniência) vive
// aqui e é testada com um mock de ImportDb. O ADAPTER Supabase (createSupabaseImportDb)
// é fino e implementa ImportDb com o client real. Separação = lógica testável sem tocar banco.
//
// Modelo prontuário-only: cria public.users (type=patient) SEM auth.users (ativação gota a
// gota depois). Dedup por CPF → email → source_external_id. Idempotente: re-rodar o mesmo
// lote não duplica (o adapter usa source_external_id + import_batch_id).

/** Porta de I/O que o executor precisa. Implementada pelo adapter Supabase; mockada no teste. */
export interface ImportDb {
  /** Acha user existente por CPF (preferencial) ou email. null se não existe. */
  findExistingPatient(cpf: string | null, email: string | null): Promise<string | null>
  /** Insere 1 paciente (public.users type=patient + proveniência). Retorna o UUID novo. */
  insertPatient(row: WithBatch<MappedPatient>): Promise<string>
  /** Insere os vínculos já com patient_id resolvido. */
  insertLinks(rows: Array<{ patient_id: string; professional_id: string; relationship: string; source: string; import_batch_id: string }>): Promise<void>
  /** Insere evoluções/prescrições/exames/documentos já com patient_id resolvido. */
  insertRecords(rows: Array<{ patient_id: string; record_type: string; record_data: unknown; source_external_id: string; import_batch_id: string }>): Promise<void>
  insertPrescriptions(rows: Array<{ patient_id: string; content: string; status: string; source_external_id: string; import_batch_id: string }>): Promise<void>
  insertExams(rows: Array<{ patient_id: string; description: string; status: string; source_external_id: string; import_batch_id: string }>): Promise<void>
  insertDocuments(rows: Array<{ patient_id: string; name: string; path: string | null; source_external_id: string; import_batch_id: string }>): Promise<void>
  /** Marca o lote concluído com as contagens finais. */
  finishBatch(batchId: string, counts: { patients: number; records: number }): Promise<void>
}

export interface ImportResult {
  batchId: string
  createdPatients: number
  mergedPatients: number // já existiam (dedup) → reusados, não duplicados
  links: number
  records: number
  prescriptions: number
  exams: number
  documents: number
  skippedOrphans: number // filho cujo paciente não veio no plano
}

/**
 * Executa o plano: cria/deduplica pacientes, resolve Id-do-EMR → UUID, grava filhos + vínculos
 * com proveniência. Orquestração testável (db é injetado). NÃO conhece Supabase diretamente.
 */
export async function executeImportPlan(plan: ImportPlan, db: ImportDb): Promise<ImportResult> {
  const idMap = new Map<string, string>() // source_external_id (EMR) → UUID nosso
  let createdPatients = 0
  let mergedPatients = 0

  // 1. Pacientes (dedup por CPF/email; senão cria)
  for (const p of plan.patients) {
    const existing = await db.findExistingPatient(p.cpf, p.email)
    if (existing) {
      idMap.set(p.source_external_id, existing)
      mergedPatients++
    } else {
      const newId = await db.insertPatient(p)
      idMap.set(p.source_external_id, newId)
      createdPatients++
    }
  }

  // 2. Vínculos (resolve patient_id)
  const resolvedLinks = plan.links
    .map((l) => {
      const pid = idMap.get(l.source_patient_id)
      return pid ? { patient_id: pid, professional_id: l.professional_id, relationship: l.relationship, source: l.source, import_batch_id: l.import_batch_id } : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
  if (resolvedLinks.length) await db.insertLinks(resolvedLinks)

  // 3. Filhos — resolve source_patient_id → UUID; órfão (paciente ausente) é pulado
  let skippedOrphans = 0
  const resolveChildren = <T extends { source_patient_id: string | null }>(rows: T[]) => {
    const out: Array<T & { patient_id: string }> = []
    for (const r of rows) {
      const pid = r.source_patient_id ? idMap.get(r.source_patient_id) : undefined
      if (!pid) { skippedOrphans++; continue }
      out.push({ ...r, patient_id: pid })
    }
    return out
  }

  const recs = resolveChildren(plan.records)
  const rxs = resolveChildren(plan.prescriptions)
  const exs = resolveChildren(plan.exams)
  const docs = resolveChildren(plan.documents)

  if (recs.length) await db.insertRecords(recs.map((r) => ({ patient_id: r.patient_id, record_type: r.record_type, record_data: r.record_data, source_external_id: r.source_external_id, import_batch_id: r.import_batch_id })))
  if (rxs.length) await db.insertPrescriptions(rxs.map((r) => ({ patient_id: r.patient_id, content: r.content, status: r.status, source_external_id: r.source_external_id, import_batch_id: r.import_batch_id })))
  if (exs.length) await db.insertExams(exs.map((r) => ({ patient_id: r.patient_id, description: r.description, status: r.status, source_external_id: r.source_external_id, import_batch_id: r.import_batch_id })))
  if (docs.length) await db.insertDocuments(docs.map((r) => ({ patient_id: r.patient_id, name: r.name, path: r.path, source_external_id: r.source_external_id, import_batch_id: r.import_batch_id })))

  await db.finishBatch(plan.batchId, { patients: createdPatients + mergedPatients, records: recs.length + rxs.length + exs.length + docs.length })

  return {
    batchId: plan.batchId,
    createdPatients,
    mergedPatients,
    links: resolvedLinks.length,
    records: recs.length,
    prescriptions: rxs.length,
    exams: exs.length,
    documents: docs.length,
    skippedOrphans,
  }
}
