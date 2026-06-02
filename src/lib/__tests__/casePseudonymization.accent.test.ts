import { describe, it, expect } from 'vitest'
import { sanitizeAssessmentPII } from '../casePseudonymization'

/**
 * V1.9.565 — sanitização de PII insensível a ACENTO (gap-analysis 02/06).
 * Prova que: (a) pega variantes acentuadas (José↔Jose) que o regex de token exato
 * deixava vazar; (b) NÃO mutila texto clínico (sem over-match); (c) mantém o exato (sem regressão).
 */
describe('sanitizeAssessmentPII — accent-insensitive (V1.9.565)', () => {
  const pid = '11111111-1111-1111-1111-111111111111'
  const pseudo = 'Paciente #111111'

  it('DB sem acento, texto COM acento (Jose -> José) → sanitiza', () => {
    const out = sanitizeAssessmentPII('A paciente José relata dor lombar.', 'Jose Silva', pid)
    expect(out).not.toContain('José')
    expect(out).toContain(pseudo)
  })

  it('DB com acento, texto SEM acento (José -> Jose) → sanitiza', () => {
    const out = sanitizeAssessmentPII('O paciente Jose chegou para avaliação.', 'José Silva', pid)
    expect(out).not.toMatch(/\bJose\b/)
    expect(out).toContain(pseudo)
  })

  it('Conceição ↔ Conceicao (cedilha + til)', () => {
    const out = sanitizeAssessmentPII('Conceicao apresenta melhora.', 'Conceição Santos', pid)
    expect(out).not.toMatch(/Conceicao/i)
    expect(out).toContain(pseudo)
  })

  it('match exato continua (sem regressão)', () => {
    const out = sanitizeAssessmentPII('Carolina relata melhora.', 'Carolina Campello', pid)
    expect(out).not.toContain('Carolina')
    expect(out).toContain(pseudo)
  })

  it('NÃO mutila termo clínico parecido (sem over-match): "Ana" não casa em "banana"/"anamnese"', () => {
    const out = sanitizeAssessmentPII('Banana na anamnese; sem queixa.', 'Ana Souza', pid)
    expect(out).toContain('Banana')
    expect(out).toContain('anamnese')
  })

  it('texto clínico sem o nome fica INTACTO', () => {
    const txt = 'Creatinina 1.2, eGFR 73. Conduta: monitorar pressão arterial.'
    const out = sanitizeAssessmentPII(txt, 'Mariana Costa', pid)
    expect(out).toBe(txt)
  })
})
