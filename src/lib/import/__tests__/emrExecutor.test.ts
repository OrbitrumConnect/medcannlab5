import { describe, it, expect } from 'vitest'
import { mapEmrExport } from '../emrMapper'
import { buildImportPlan, describeImportPlan, executeImportPlan, type ImportDb } from '../emrExecutor'
import type { EmrExport } from '../emrTypes'

const fixture: EmrExport = {
  patients: [
    { Id: 'p1', Name: 'Paciente Um', Gender: 'M', Birthday: '1980-01-01' },
    { Id: 'p2', Name: 'Paciente Dois', Gender: 'F' },
  ],
  notes: [
    { Id: 'n1', PatientId: 'p1', Text: 'Evolução um' },
    { Id: 'n2', PatientId: 'p2', Text: 'Evolução dois' },
  ],
  prescriptions: [{ Id: 'rx1', PatientId: 'p1', Content: 'CBD 80mg' }],
  exams: [{ Id: 'e1', PatientId: 'p2', Description: 'Hemograma' }],
  files: [{ Id: 'f1', PatientId: 'p1', Name: 'doc.pdf', Path: '/x/doc.pdf', IsDirectory: 'false' }],
}

const OPTS = { batchId: 'batch-123', professionalId: 'prof-abc' }

describe('buildImportPlan', () => {
  const mapped = mapEmrExport(fixture)
  const plan = buildImportPlan(mapped, OPTS)

  it('exige batchId e professionalId', () => {
    expect(() => buildImportPlan(mapped, { batchId: '', professionalId: 'x' })).toThrow()
    expect(() => buildImportPlan(mapped, { batchId: 'x', professionalId: '' })).toThrow()
  })

  it('etiqueta TUDO com import_batch_id (proveniência)', () => {
    for (const arr of [plan.patients, plan.records, plan.prescriptions, plan.exams, plan.documents]) {
      expect(arr.length).toBeGreaterThan(0)
      for (const row of arr) expect(row.import_batch_id).toBe('batch-123')
    }
  })

  it('cria 1 vínculo por paciente (relationship=imported, ligado ao profissional)', () => {
    expect(plan.links.length).toBe(2)
    expect(plan.links.every((l) => l.professional_id === 'prof-abc')).toBe(true)
    expect(plan.links.every((l) => l.relationship === 'imported' && l.source === 'import')).toBe(true)
    // o vínculo carrega o Id de origem do paciente p/ resolver UUID no insert
    expect(plan.links.map((l) => l.source_patient_id).sort()).toEqual(['p1', 'p2'])
  })

  it('preserva source_patient_id nos filhos (p/ resolver no insert real)', () => {
    expect(plan.records.map((r) => r.source_patient_id).sort()).toEqual(['p1', 'p2'])
    expect(plan.prescriptions[0].source_patient_id).toBe('p1')
    expect(plan.exams[0].source_patient_id).toBe('p2')
    expect(plan.documents[0].source_patient_id).toBe('p1')
  })

  it('summary bate com os mapeados', () => {
    expect(plan.summary).toMatchObject({ patients: 2, links: 2, records: 2, prescriptions: 1, exams: 1, documents: 1 })
    expect(plan.summary.total).toBe(2 + 2 + 1 + 1 + 1) // patients+records+prescriptions+exams+documents
  })

  it('describeImportPlan é legível', () => {
    expect(describeImportPlan(plan)).toContain('2 paciente(s)')
    expect(describeImportPlan(plan)).toContain('1 prescrição')
  })

  it('export vazio → plano vazio, sem quebrar', () => {
    const empty = buildImportPlan(mapEmrExport({ patients: [] }), OPTS)
    expect(empty.summary.total).toBe(0)
    expect(empty.links.length).toBe(0)
  })
})

/** Mock de ImportDb que registra os inserts e resolve UUID deterministicamente. */
function makeMockDb(existingByKey: Record<string, string> = {}) {
  const calls = {
    inserted: [] as Array<{ source: string }>,
    links: [] as any[],
    records: [] as any[],
    prescriptions: [] as any[],
    exams: [] as any[],
    documents: [] as any[],
    finished: null as null | { batchId: string; counts: any },
  }
  const db: ImportDb = {
    async findExistingPatient(cpf, email) {
      return existingByKey[cpf ?? ''] ?? existingByKey[email ?? ''] ?? null
    },
    async insertPatient(row) {
      calls.inserted.push({ source: row.source_external_id })
      return `uuid-${row.source_external_id}` // UUID determinístico p/ asserção
    },
    async insertLinks(rows) { calls.links.push(...rows) },
    async insertRecords(rows) { calls.records.push(...rows) },
    async insertPrescriptions(rows) { calls.prescriptions.push(...rows) },
    async insertExams(rows) { calls.exams.push(...rows) },
    async insertDocuments(rows) { calls.documents.push(...rows) },
    async finishBatch(batchId, counts) { calls.finished = { batchId, counts } },
  }
  return { db, calls }
}

describe('executeImportPlan (mock — lógica de gravação)', () => {
  const plan = buildImportPlan(mapEmrExport(fixture), OPTS)

  it('cria pacientes novos e resolve Id-do-EMR → UUID nos filhos', async () => {
    const { db, calls } = makeMockDb()
    const res = await executeImportPlan(plan, db)
    expect(res.createdPatients).toBe(2)
    expect(res.mergedPatients).toBe(0)
    // filhos ligados ao UUID resolvido (uuid-p1 / uuid-p2)
    expect(calls.records.map((r) => r.patient_id).sort()).toEqual(['uuid-p1', 'uuid-p2'])
    expect(calls.prescriptions[0].patient_id).toBe('uuid-p1')
    expect(calls.exams[0].patient_id).toBe('uuid-p2')
    expect(calls.links.map((l) => l.patient_id).sort()).toEqual(['uuid-p1', 'uuid-p2'])
    // proveniência preservada
    expect(calls.records.every((r) => r.import_batch_id === 'batch-123')).toBe(true)
  })

  it('DEDUP: paciente existente (por CPF) é reusado, não duplicado', async () => {
    const exp: EmrExport = { patients: [{ Id: 'p1', Name: 'Dup', PersonalIdentifier: '123.456.789-09' }], notes: [{ Id: 'n1', PatientId: 'p1', Text: 'x' }] }
    const planDup = buildImportPlan(mapEmrExport(exp), OPTS)
    const { db, calls } = makeMockDb({ '12345678909': 'uuid-EXISTENTE' })
    const res = await executeImportPlan(planDup, db)
    expect(res.createdPatients).toBe(0)
    expect(res.mergedPatients).toBe(1)
    expect(calls.inserted.length).toBe(0) // não inseriu paciente novo
    expect(calls.records[0].patient_id).toBe('uuid-EXISTENTE') // filho ligado ao existente
  })

  it('finishBatch é chamado com as contagens', async () => {
    const { db, calls } = makeMockDb()
    await executeImportPlan(plan, db)
    expect(calls.finished?.batchId).toBe('batch-123')
    expect(calls.finished?.counts.patients).toBe(2)
  })
})
