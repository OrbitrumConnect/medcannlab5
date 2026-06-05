import { describe, it, expect } from 'vitest'
import {
  mapEmrExport, mapPatient, mapNote, mapPrescription, mapExam, mapFile,
  parseEmrDate, normalizeGender, cleanCpf,
} from '../emrMapper'
import type { EmrExport } from '../emrTypes'

/** Fixture SINTÉTICO (zero PII real) com os nomes de coluna REAIS do export EMR. */
const fixture: EmrExport = {
  patients: [
    { Id: 'p1', Name: 'Paciente Um', PersonalIdentifier: '123.456.789-09', Birthday: '15/03/1980', Gender: 'Masculino', Email: 'UM@MAIL.COM', Phone: '11999998888', AddressStreet: 'Rua A', AddressNumber: '10', AddressCity: 'SP', BloodType: 'O+' },
    { Id: 'p2', Name: 'Paciente Dois', Dni: '98765432100', Birthday: '1975-12-01', Gender: 'F' },
    { Id: 'p3', Name: '' }, // sem nome → ignorado
    { Id: 'p1', Name: 'Duplicado' }, // mesmo Id → dedup
  ],
  notes: [
    { Id: 'n1', PatientId: 'p1', Text: 'Evolução com vírgula, aspas e tudo.', CreationTime: '2026-05-01T10:00:00Z', CreatorUser: 'Dr X' },
    { Id: 'n2', PatientId: 'p2', Text: '   ' }, // sem texto → ignorado
    { Id: 'n3', PatientId: 'pX', Text: 'Órfão' }, // paciente ausente → órfão
  ],
  prescriptions: [{ Id: 'rx1', PatientId: 'p1', Content: 'CBD 80mg', CreationTime: '2026-04-10' }],
  exams: [{ Id: 'e1', PatientId: 'p2', Description: 'Hemograma', ExaminationDescription: 'Normal' }],
  files: [
    { Id: 'f1', PatientId: 'p1', Name: 'exame.pdf', Path: '/x/exame.pdf', IsDirectory: 'false' },
    { Id: 'f2', PatientId: 'p1', Name: 'pasta', IsDirectory: 'true' }, // diretório → ignorado
  ],
}

describe('helpers', () => {
  it('cleanCpf — só 11 dígitos', () => {
    expect(cleanCpf('123.456.789-09')).toBe('12345678909')
    expect(cleanCpf('123')).toBeNull()
    expect(cleanCpf(undefined)).toBeNull()
  })
  it('normalizeGender — PT/EN/abrev', () => {
    expect(normalizeGender('Masculino')).toBe('M')
    expect(normalizeGender('F')).toBe('F')
    expect(normalizeGender('Female')).toBe('F')
    expect(normalizeGender('')).toBeNull()
    expect(normalizeGender('x')).toBe('Outro')
  })
  it('parseEmrDate — ISO, DD/MM/YYYY, inválido', () => {
    expect(parseEmrDate('2026-05-01T10:00:00Z')).toBe('2026-05-01')
    expect(parseEmrDate('15/03/1980')).toBe('1980-03-15')
    expect(parseEmrDate('lixo')).toBeNull()
    expect(parseEmrDate('32/13/2020')).toBeNull()
  })
})

describe('mappers individuais', () => {
  it('mapPatient — campos + sem nome=null', () => {
    const p = mapPatient(fixture.patients[0])!
    expect(p.cpf).toBe('12345678909')
    expect(p.email).toBe('um@mail.com')
    expect(p.gender).toBe('M')
    expect(p.birth_date).toBe('1980-03-15')
    expect(p.address).toContain('Rua A')
    expect(mapPatient({ Id: 'x', Name: '' })).toBeNull()
  })
  it('mapNote — texto obrigatório', () => {
    expect(mapNote(fixture.notes[0])!.record_type).toBe('evolution')
    expect(mapNote({ Id: 'x', Text: '  ' })).toBeNull()
  })
  it('mapPrescription/mapExam — status historical', () => {
    expect(mapPrescription(fixture.prescriptions![0])!.status).toBe('historical')
    expect(mapExam(fixture.exams![0])!.description).toContain('Hemograma')
  })
  it('mapFile — diretório vira null', () => {
    expect(mapFile(fixture.files![0])!.name).toBe('exame.pdf')
    expect(mapFile(fixture.files![1])).toBeNull()
  })
})

describe('mapEmrExport (orquestrador)', () => {
  const r = mapEmrExport(fixture)
  it('dedup + ignora sem-nome', () => {
    expect(r.summary.patients).toBe(2) // p1, p2 (p3 sem nome, p1 dup)
    expect(r.summary.skipped.patientsSemNome).toBe(1)
  })
  it('conta filhos válidos', () => {
    expect(r.summary.notes).toBe(2) // n1 + n3 (n2 sem texto). n3 é órfão mas mapeado
    expect(r.summary.prescriptions).toBe(1)
    expect(r.summary.exams).toBe(1)
    expect(r.summary.files).toBe(1) // f2 diretório ignorado
  })
  it('detecta órfão (n3→pX) com warning', () => {
    expect(r.summary.skipped.orfaos).toBe(1)
    expect(r.warnings.some(w => w.includes('órfãos'))).toBe(true)
  })
  it('export vazio não quebra', () => {
    const empty = mapEmrExport({ patients: [] })
    expect(empty.summary.patients).toBe(0)
    expect(empty.warnings.length).toBe(0)
  })
})
