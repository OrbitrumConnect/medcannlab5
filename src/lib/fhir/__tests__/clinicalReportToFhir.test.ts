import { describe, it, expect } from 'vitest'
import { clinicalReportToFhirBundle, type ClinicalReportInput } from '../clinicalReportToFhir'
import type { Composition, Reference } from '../fhirR4.types'

/**
 * Fixture SINTÉTICO (sem PII real — LGPD): mesma SHAPE da Row `clinical_reports`
 * + content.* jsonb representativo. Validação contra reports REAIS é feita ad-hoc
 * via PAT (não commitado).
 */
const fixture: ClinicalReportInput = {
  id: '00000000-0000-0000-0000-0000000000aa',
  patient_id: '11111111-1111-1111-1111-111111111111',
  patient_name: 'Paciente Sintético',
  professional_id: '22222222-2222-2222-2222-222222222222',
  professional_name: 'Dr. Profissional Sintético',
  report_type: 'Avaliação Clínica Inicial',
  protocol: 'AEC 001',
  generated_at: '2026-06-02T12:00:00.000Z',
  status: 'final',
  review_status: 'reviewed',
  signature_hash: 'a'.repeat(64),
  signed_at: '2026-06-02T12:05:00.000Z',
  consent_given: true,
  consent_at: '2026-06-02T11:58:00.000Z',
  content: {
    identificacao: { idade: 40 },
    queixa_principal: 'Dor lombar há 3 meses.',
    desenvolvimento_queixa: 'Início insidioso, piora ao esforço.',
    lista_indiciaria: 'Indícios renais referidos pelo paciente.',
    rationalities: {
      biomedical: 'Hipótese biomédica organizada (não-diagnóstica).',
      integrative: 'Leitura integrativa do quadro.',
    },
    recommendations: 'Encaminhamento para investigação. Médico decide.',
    // seção ausente de propósito (não deve virar section):
    historia_familiar: '',
  },
}

function collectReferences(comp: Composition): string[] {
  const refs: string[] = []
  if (comp.subject?.reference) refs.push(comp.subject.reference)
  for (const a of comp.author) if (a.reference) refs.push(a.reference)
  for (const s of comp.section ?? []) for (const e of s.entry ?? []) if (e.reference) refs.push(e.reference)
  return refs
}

describe('clinicalReportToFhirBundle', () => {
  const bundle = clinicalReportToFhirBundle(fixture)

  it('produz Bundle type=document', () => {
    expect(bundle.resourceType).toBe('Bundle')
    expect(bundle.type).toBe('document')
    expect(bundle.entry.length).toBeGreaterThan(0)
  })

  it('Composition é a raiz (primeira entry) com cabeçalho correto', () => {
    const first = bundle.entry[0].resource
    expect(first.resourceType).toBe('Composition')
    const comp = first as Composition
    expect(comp.id).toBe(fixture.id)
    expect(comp.status).toBe('final')
    expect(comp.subject?.reference).toBe(`Patient/${fixture.patient_id}`)
    expect(comp.author[0].reference).toBe(`Practitioner/${fixture.professional_id}`)
    expect(comp.date).toBe(fixture.generated_at)
    expect(comp.title).toContain('AEC 001')
  })

  it('inclui Patient e Practitioner', () => {
    const types = bundle.entry.map((e) => e.resource.resourceType)
    expect(types).toContain('Patient')
    expect(types).toContain('Practitioner')
  })

  it('cria um ClinicalImpression por racionalidade', () => {
    const cis = bundle.entry.filter((e) => e.resource.resourceType === 'ClinicalImpression')
    expect(cis.length).toBe(2) // biomedical + integrative
  })

  it('cria Consent quando consent_given=true', () => {
    const consent = bundle.entry.find((e) => e.resource.resourceType === 'Consent')
    expect(consent).toBeDefined()
    expect((consent!.resource as { dateTime?: string }).dateTime).toBe(fixture.consent_at)
  })

  it('só emite seções presentes (omite vazias)', () => {
    const comp = bundle.entry[0].resource as Composition
    const titles = (comp.section ?? []).map((s) => s.title)
    expect(titles).toContain('Queixa Principal')
    expect(titles).toContain('Racionalidades')
    expect(titles).not.toContain('História Familiar') // estava vazia no fixture
  })

  it('todas as referências da Composition resolvem dentro do Bundle', () => {
    const comp = bundle.entry[0].resource as Composition
    const present = new Set(
      bundle.entry.map((e) => `${e.resource.resourceType}/${e.resource.id}`),
    )
    for (const r of collectReferences(comp)) {
      expect(present.has(r)).toBe(true)
    }
  })

  it('AUDITOR-SAFE: hash de integridade vira Provenance/extensão, NUNCA FHIR Signature', () => {
    // Nenhum recurso Signature (assinatura ICP do relatório = roadmap, não estado atual)
    const hasSignatureResource = bundle.entry.some(
      (e) => (e.resource as { resourceType: string }).resourceType === 'Signature',
    )
    expect(hasSignatureResource).toBe(false)

    const prov = bundle.entry.find((e) => e.resource.resourceType === 'Provenance')
    expect(prov).toBeDefined()
    const ext = (prov!.resource as { extension?: Array<{ url: string; valueString?: string }> }).extension ?? []
    const integrity = ext.find((x) => x.url.includes('content-integrity-hash'))
    expect(integrity?.valueString).toBe(fixture.signature_hash)
  })

  it('não-determinístico fora: aceita timestamp injetado', () => {
    const b2 = clinicalReportToFhirBundle({ ...fixture, generated_at: null, created_at: null }, { timestamp: '2026-01-01T00:00:00.000Z' })
    expect(b2.timestamp).toBe('2026-01-01T00:00:00.000Z')
  })
})
