/**
 * Camada de parsing CSV do motor de import (#3). Usa xlsx (SheetJS) — já é dependência —
 * que respeita RFC-4180: campos com vírgula, aspas e quebra de linha (texto-livre das Notes/
 * Prescriptions) NÃO quebram, ao contrário do split(',') ingênuo do PatientImportModal legado.
 */
import * as XLSX from 'xlsx'
import type { EmrExport, EmrPatientRow, EmrNoteRow, EmrPrescriptionRow, EmrExamRow, EmrFileRow } from './emrTypes'

/** CSV (string) → linhas como objetos keyed pelo header. Vazio se não houver dados. */
export function parseCsvToRows(csvText: string): Record<string, string>[] {
  if (!csvText || !csvText.trim()) return []
  const wb = XLSX.read(csvText, { type: 'string', raw: false })
  const first = wb.SheetNames[0]
  if (!first) return []
  const sheet = wb.Sheets[first]
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }) as Record<string, string>[]
}

export interface EmrCsvTexts {
  patients: string
  notes?: string
  prescriptions?: string
  exams?: string
  files?: string
}

/** Monta o EmrExport a partir dos textos CSV de cada tabela do export. */
export function emrExportFromCsvTexts(t: EmrCsvTexts): EmrExport {
  return {
    patients: parseCsvToRows(t.patients) as EmrPatientRow[],
    notes: t.notes ? (parseCsvToRows(t.notes) as EmrNoteRow[]) : [],
    prescriptions: t.prescriptions ? (parseCsvToRows(t.prescriptions) as EmrPrescriptionRow[]) : [],
    exams: t.exams ? (parseCsvToRows(t.exams) as EmrExamRow[]) : [],
    files: t.files ? (parseCsvToRows(t.files) as EmrFileRow[]) : [],
  }
}
