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
