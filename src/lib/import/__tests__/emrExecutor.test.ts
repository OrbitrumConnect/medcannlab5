import { describe, it, expect } from 'vitest'
import { mapEmrExport } from '../emrMapper'
import { buildImportPlan, describeImportPlan } from '../emrExecutor'
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
