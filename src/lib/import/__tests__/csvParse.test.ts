import { describe, it, expect } from 'vitest'
import { parseCsvToRows, emrExportFromCsvTexts } from '../csvParse'
import { mapEmrExport } from '../emrMapper'

describe('parseCsvToRows — robustez RFC-4180', () => {
  it('campo com vírgula e aspas NÃO quebra (o ponto do motor)', () => {
    const csv = 'Id,Text\nn1,"Evolução: dor, febre e ""tosse"" persistente"\nn2,simples'
    const rows = parseCsvToRows(csv)
    expect(rows.length).toBe(2)
    expect(rows[0].Text).toBe('Evolução: dor, febre e "tosse" persistente')
    expect(rows[1].Text).toBe('simples')
  })

  it('campo com quebra de linha embutida preserva a linha única', () => {
    const csv = 'Id,Content\nrx1,"linha1\nlinha2"\nrx2,ok'
    const rows = parseCsvToRows(csv)
    expect(rows.length).toBe(2)
    expect(rows[0].Content).toContain('linha1')
    expect(rows[0].Content).toContain('linha2')
  })

  it('vazio não quebra', () => {
    expect(parseCsvToRows('')).toEqual([])
  })
})

describe('emrExportFromCsvTexts → mapEmrExport (pipeline ponta-a-ponta)', () => {
  it('parseia + mapeia respeitando vírgula em texto-livre', () => {
    const exp = emrExportFromCsvTexts({
      patients: 'Id,Name,Gender,Birthday\np1,Paciente Um,M,1980-01-01',
      notes: 'Id,PatientId,Text\nn1,p1,"Queixa: dor lombar, há 3 meses"',
    })
    const r = mapEmrExport(exp)
    expect(r.summary.patients).toBe(1)
    expect(r.summary.notes).toBe(1)
    expect(r.records[0].record_data.text).toContain('dor lombar, há 3 meses')
  })
})
