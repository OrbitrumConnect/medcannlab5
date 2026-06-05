/**
 * Mapper PURO do motor de Migração de Base Clínica (#3): EmrExport → MappedImport.
 * Sem efeitos colaterais, sem DB. Dedup WITHIN-file por Id de origem; dedup contra o
 * banco (users existentes) é etapa separada no import (precisa de DB). Ver emrTypes.ts.
 */
import type {
  EmrExport, EmrPatientRow, EmrNoteRow, EmrPrescriptionRow, EmrExamRow, EmrFileRow,
  MappedImport, MappedPatient, MappedRecord, MappedPrescription, MappedExam, MappedFile,
} from './emrTypes'

const s = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const orNull = (v: string): string | null => (v.length ? v : null)

/** CPF/doc só dígitos (11). Retorna null se não parecer CPF. */
export function cleanCpf(raw?: string): string | null {
  const d = s(raw).replace(/\D/g, '')
  return d.length === 11 ? d : null
}

/**
 * Gênero → 'M' | 'F' | 'Outro' | null (tolerante a PT/EN/abrev).
 * Emite o MESMO formato que o app usa (CHECK users_gender_check = M/F/Outro; NewPatientForm
 * grava assim). Achado do piloto e2e 05/06: emitir 'male'/'female' viola a constraint.
 */
export function normalizeGender(raw?: string): string | null {
  const g = s(raw).toLowerCase()
  if (!g) return null
  if (/^(m|masc|male|homem|h)$/.test(g) || g.startsWith('masc')) return 'M'
  if (/^(f|fem|female|mulher)$/.test(g) || g.startsWith('fem')) return 'F'
  return 'Outro'
}

/** Datas tolerantes: ISO, YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY → ISO (YYYY-MM-DD) ou null. */
export function parseEmrDate(raw?: string): string | null {
  const t = s(raw)
  if (!t) return null
  // ISO / YYYY-MM-DD (com ou sem hora)
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  // DD/MM/YYYY ou DD-MM-YYYY
  m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (m) {
    const dd = m[1].padStart(2, '0'), mm = m[2].padStart(2, '0')
    if (+mm >= 1 && +mm <= 12 && +dd >= 1 && +dd <= 31) return `${m[3]}-${mm}-${dd}`
  }
  return null
}

function buildAddress(p: EmrPatientRow): string | null {
  const parts = [
    s(p.AddressStreet), s(p.AddressNumber), s(p.AddressNeighborhood),
    s(p.AddressCity), s(p.AddressState), s(p.AddressPostalCode),
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

export function mapPatient(p: EmrPatientRow): MappedPatient | null {
  const name = s(p.Name)
  if (!name) return null // sem nome não cria paciente
  return {
    source_external_id: s(p.Id),
    name,
    email: orNull(s(p.Email).toLowerCase()),
    cpf: cleanCpf(p.PersonalIdentifier) ?? cleanCpf(p.Dni),
    birth_date: parseEmrDate(p.Birthday),
    gender: normalizeGender(p.Gender),
    phone: orNull(s(p.Phone) || s(p.FixedPhone)),
    address: buildAddress(p),
    blood_type: orNull(s(p.BloodType)),
    type: 'patient',
  }
}

export function mapNote(n: EmrNoteRow): MappedRecord | null {
  const text = s(n.Text)
  if (!text) return null
  return {
    source_external_id: s(n.Id),
    source_patient_id: orNull(s(n.PatientId)),
    record_type: 'evolution',
    record_data: { text, original_date: parseEmrDate(n.CreationTime), creator: orNull(s(n.CreatorUser)) },
  }
}

export function mapPrescription(p: EmrPrescriptionRow): MappedPrescription | null {
  const content = s(p.Content)
  if (!content) return null
  return {
    source_external_id: s(p.Id),
    source_patient_id: orNull(s(p.PatientId)),
    content,
    status: 'historical',
    original_date: parseEmrDate(p.CreationTime),
  }
}

export function mapExam(e: EmrExamRow): MappedExam | null {
  const description = [s(e.Description), s(e.ExaminationDescription)].filter(Boolean).join(' — ')
  if (!description) return null
  return {
    source_external_id: s(e.Id),
    source_patient_id: orNull(s(e.PatientId)),
    description,
    status: 'historical',
    original_date: parseEmrDate(e.CreationTime),
  }
}

export function mapFile(f: EmrFileRow): MappedFile | null {
  if (s(f.IsDirectory).toLowerCase() === 'true') return null // pastas não viram documento
  const name = s(f.Name)
  if (!name) return null
  return {
    source_external_id: s(f.Id),
    source_patient_id: orNull(s(f.PatientId)),
    name,
    path: orNull(s(f.Path)),
  }
}

/** Dedup within-file por source_external_id (primeira ocorrência vence). */
function dedupBySourceId<T extends { source_external_id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const it of items) {
    const k = it.source_external_id
    if (k && seen.has(k)) continue
    if (k) seen.add(k)
    out.push(it)
  }
  return out
}

/**
 * Orquestrador puro: EmrExport → MappedImport (mapeia + dedup within-file + summary + warnings).
 * Marca como órfão (warning) record/prescrição/exame cujo PatientId não está entre os pacientes.
 */
export function mapEmrExport(input: EmrExport): MappedImport {
  const warnings: string[] = []

  const patientsRaw = (input.patients ?? []).map(mapPatient).filter((x): x is MappedPatient => x !== null)
  const patients = dedupBySourceId(patientsRaw)
  const patientIds = new Set(patients.map(p => p.source_external_id))

  const recordsRaw = (input.notes ?? []).map(mapNote).filter((x): x is MappedRecord => x !== null)
  const prescriptionsRaw = (input.prescriptions ?? []).map(mapPrescription).filter((x): x is MappedPrescription => x !== null)
  const examsRaw = (input.exams ?? []).map(mapExam).filter((x): x is MappedExam => x !== null)
  const filesRaw = (input.files ?? []).map(mapFile).filter((x): x is MappedFile => x !== null)

  const records = dedupBySourceId(recordsRaw)
  const prescriptions = dedupBySourceId(prescriptionsRaw)
  const exams = dedupBySourceId(examsRaw)
  const files = dedupBySourceId(filesRaw)

  // Órfãos: filho referencia paciente ausente do export
  const isOrphan = (pid: string | null) => pid !== null && !patientIds.has(pid)
  let orfaos = 0
  for (const arr of [records, prescriptions, exams, files] as Array<Array<{ source_patient_id: string | null }>>) {
    orfaos += arr.filter(x => isOrphan(x.source_patient_id)).length
  }
  if (orfaos > 0) warnings.push(`${orfaos} registro(s) referenciam paciente fora do export (órfãos) — serão ignorados no import.`)

  const patientsSemNome = (input.patients?.length ?? 0) - patientsRaw.length
  const notesSemTexto = (input.notes?.length ?? 0) - recordsRaw.length
  if (patientsSemNome > 0) warnings.push(`${patientsSemNome} paciente(s) sem nome — ignorados.`)

  return {
    patients, records, prescriptions, exams, files,
    summary: {
      patients: patients.length,
      notes: records.length,
      prescriptions: prescriptions.length,
      exams: exams.length,
      files: files.length,
      skipped: { patientsSemNome: Math.max(0, patientsSemNome), notesSemTexto: Math.max(0, notesSemTexto), orfaos },
    },
    warnings,
  }
}
