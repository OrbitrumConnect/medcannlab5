/**
 * Tipos do motor de Migração de Base Clínica (#3) — EMR externo → entidades MedCannLab.
 *
 * Colunas de ORIGEM espelham o export real (validado empíricamente no ZIP do Eduardo,
 * estilo Ninsaúde/iClinic). Funções PURAS e READ-ONLY: não escrevem no banco.
 * O import real resolve `source_patient_id` (Id do paciente no EMR) → UUID nosso e grava
 * com `import_batch_id` (proveniência V1.9.577) — ver docs/MIGRACAO_BASE_CLINICA_SPEC.md.
 */

// ───────────────────────── ORIGEM (linhas dos CSVs do EMR) ─────────────────────────

export interface EmrPatientRow {
  Id: string
  Name?: string
  PersonalIdentifier?: string // CPF (preferencial)
  Dni?: string                // doc alternativo
  Birthday?: string
  Gender?: string
  Email?: string
  Phone?: string
  FixedPhone?: string
  AddressPostalCode?: string
  AddressStreet?: string
  AddressNumber?: string
  AddressNeighborhood?: string
  AddressCity?: string
  AddressState?: string
  BloodType?: string
  Weight?: string
  Height?: string
  MaritalStatus?: string
  Profession?: string
  [k: string]: string | undefined
}

export interface EmrNoteRow {
  Id: string
  CreationTime?: string
  CreatorUser?: string
  PatientId?: string
  Text?: string
  [k: string]: string | undefined
}

export interface EmrPrescriptionRow {
  Id: string
  CreationTime?: string
  PatientId?: string
  Content?: string
  [k: string]: string | undefined
}

export interface EmrExamRow {
  Id: string
  CreationTime?: string
  PatientId?: string
  Description?: string
  ExaminationDescription?: string
  [k: string]: string | undefined
}

export interface EmrFileRow {
  Id: string
  CreationTime?: string
  PatientId?: string
  Name?: string
  IsDirectory?: string
  Path?: string
  [k: string]: string | undefined
}

export interface EmrExport {
  patients: EmrPatientRow[]
  notes?: EmrNoteRow[]
  prescriptions?: EmrPrescriptionRow[]
  exams?: EmrExamRow[]
  files?: EmrFileRow[]
}

// ───────────────────────── DESTINO (shapes prontos p/ gravar) ─────────────────────────
// source_external_id = Id original no EMR (dedup/idempotência)
// source_patient_id  = PatientId no EMR (resolvido p/ UUID nosso no import)

export interface MappedPatient {
  source_external_id: string
  name: string
  email: string | null
  cpf: string | null
  birth_date: string | null
  gender: string | null
  phone: string | null
  address: string | null
  blood_type: string | null
  type: 'patient'
}

export interface MappedRecord {
  source_external_id: string
  source_patient_id: string | null
  record_type: 'evolution'
  record_data: { text: string; original_date: string | null; creator?: string | null }
}

export interface MappedPrescription {
  source_external_id: string
  source_patient_id: string | null
  content: string
  status: 'historical'
  original_date: string | null
}

export interface MappedExam {
  source_external_id: string
  source_patient_id: string | null
  description: string
  status: 'historical'
  original_date: string | null
}

export interface MappedFile {
  source_external_id: string
  source_patient_id: string | null
  name: string
  path: string | null
}

export interface ImportSummary {
  patients: number
  notes: number
  prescriptions: number
  exams: number
  files: number
  skipped: { patientsSemNome: number; notesSemTexto: number; orfaos: number }
}

export interface MappedImport {
  patients: MappedPatient[]
  records: MappedRecord[]
  prescriptions: MappedPrescription[]
  exams: MappedExam[]
  files: MappedFile[]
  summary: ImportSummary
  warnings: string[]
}
