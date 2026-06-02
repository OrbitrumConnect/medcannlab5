/**
 * Serializer FHIR R4 — `clinical_reports` → Bundle (type=document) com Composition.
 *
 * Frente #1 do roadmap regulatório (docs/INTEROP_FHIR_MEDCANNLAB_R4.md §6/§9).
 * Função PURA e READ-ONLY: recebe a linha do report (+ content jsonb) e devolve
 * um Bundle FHIR. NÃO escreve no banco, NÃO chama Edge, NÃO toca nenhum lock.
 * Transforma "arquitetura compatível com FHIR" em "exporta FHIR de verdade".
 *
 * ⚠️ Ressalvas auditor-safe (alinhadas ao doc, NÃO reintroduzir overclaim):
 *  - `signature_hash` do relatório é HASH DE INTEGRIDADE SHA-256, **não** assinatura
 *    ICP-Brasil. Aqui vira Provenance + extensão de integridade — nunca FHIR Signature.
 *    (A assinatura ICP-Brasil real existe só em prescrições/exames; assinar a
 *    Composition é roadmap.)
 *  - O código LOINC do documento é ILUSTRATIVO; o código final depende do perfil
 *    documental (RAC/RES / br-core) e exige validação caso a caso.
 *  - Conformação br-core / homologação RNDS NÃO está implementada.
 */

import type {
  Bundle,
  BundleEntry,
  ClinicalImpression,
  Composition,
  CompositionSection,
  Consent,
  Narrative,
  Patient,
  Practitioner,
  Provenance,
  Reference,
} from './fhirR4.types'

/** Namespace base dos identifiers/extensões internos. */
const BASE = 'urn:medcannlab'
const INTEGRITY_HASH_URL = `${BASE}/fhir/StructureDefinition/content-integrity-hash-sha256`
const SECTION_NS = `${BASE}/fhir/CodeSystem/aec-section`

/** Subconjunto da Row `clinical_reports` que o serializer consome. */
export interface ClinicalReportInput {
  id: string
  patient_id: string
  patient_name?: string | null
  professional_id?: string | null
  professional_name?: string | null
  doctor_id?: string | null
  report_type?: string | null
  protocol?: string | null
  generated_at?: string | null
  created_at?: string | null
  status?: string | null
  review_status?: string | null
  signature_hash?: string | null
  signed_at?: string | null
  consent_given?: boolean | null
  consent_at?: string | null
  content?: Record<string, unknown> | null
}

export interface SerializeOptions {
  /** Timestamp p/ Bundle.timestamp (default: generated_at do report). Passado de fora p/ evitar Date.now em ambientes determinísticos. */
  timestamp?: string
}

/** Seções de `content.*` que viram narrativa textual em Composition.section[]. */
const TEXT_SECTIONS: ReadonlyArray<{ key: string; title: string }> = [
  { key: 'queixa_principal', title: 'Queixa Principal' },
  { key: 'desenvolvimento_queixa', title: 'História da Doença Atual' },
  { key: 'lista_indiciaria', title: 'Lista Indiciária (IMRE)' },
  { key: 'historia_patologica_pregressa', title: 'História Patológica Pregressa' },
  { key: 'historia_familiar', title: 'História Familiar' },
  { key: 'habitos_vida', title: 'Hábitos de Vida' },
  { key: 'perguntas_objetivas', title: 'Perguntas Objetivas' },
  { key: 'investigation', title: 'Investigação' },
  { key: 'recommendations', title: 'Recomendações' },
  { key: 'evolution', title: 'Evolução' },
]

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function narrative(text: string): Narrative {
  return {
    status: 'additional',
    div: `<div xmlns="http://www.w3.org/1999/xhtml">${escapeHtml(text)}</div>`,
  }
}

/** Converte um valor jsonb arbitrário em texto exibível (ou null se vazio). */
function asText(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') {
    const t = v.trim()
    return t.length ? t : null
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    const s = JSON.stringify(v)
    return s && s !== '{}' && s !== '[]' && s !== 'null' ? s : null
  } catch {
    return null
  }
}

function ref(resourceType: string, id: string, display?: string): Reference {
  return display ? { reference: `${resourceType}/${id}`, display } : { reference: `${resourceType}/${id}` }
}

function buildPatient(report: ClinicalReportInput): Patient {
  return {
    resourceType: 'Patient',
    id: report.patient_id,
    ...(report.patient_name ? { name: [{ text: report.patient_name }] } : {}),
  }
}

function buildPractitioner(report: ClinicalReportInput): Practitioner | null {
  const id = report.professional_id ?? report.doctor_id
  if (!id) return null
  return {
    resourceType: 'Practitioner',
    id,
    ...(report.professional_name ? { name: [{ text: report.professional_name }] } : {}),
  }
}

/**
 * `content.rationalities` é um OBJECT por tipo (biomedical/integrative/...) OU array.
 * Cada racionalidade vira um ClinicalImpression. (Ver CLAUDE.md: fonte de UI é o jsonb.)
 */
function buildClinicalImpressions(
  content: Record<string, unknown>,
  patientRef: Reference,
  reportId: string,
  date: string,
): ClinicalImpression[] {
  const rat = content['rationalities']
  if (!rat || typeof rat !== 'object') return []
  const out: ClinicalImpression[] = []

  const entries: Array<[string, unknown]> = Array.isArray(rat)
    ? rat.map((v, i) => [String(i), v])
    : Object.entries(rat as Record<string, unknown>)

  for (const [type, value] of entries) {
    const description = asText(value)
    if (!description) continue
    out.push({
      resourceType: 'ClinicalImpression',
      id: `${reportId}-rat-${type}`,
      status: 'completed',
      subject: patientRef,
      date,
      summary: `Racionalidade: ${type}`,
      description,
    })
  }
  return out
}

function buildConsent(report: ClinicalReportInput, patientRef: Reference): Consent | null {
  if (!report.consent_given) return null
  return {
    resourceType: 'Consent',
    id: `${report.id}-consent`,
    status: 'active',
    scope: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }],
    },
    category: [
      {
        coding: [{ system: 'http://loinc.org', code: '59284-0', display: 'Patient Consent' }],
      },
    ],
    patient: patientRef,
    ...(report.consent_at ? { dateTime: report.consent_at } : {}),
  }
}

/**
 * Provenance do relatório. O `signature_hash` é HASH DE INTEGRIDADE SHA-256 (não ICP):
 * registrado como extensão de integridade + recorded/agent. NUNCA como FHIR Signature.
 */
function buildProvenance(
  report: ClinicalReportInput,
  compositionRef: Reference,
  practitionerRef: Reference | null,
  date: string,
): Provenance | null {
  const hasHash = !!report.signature_hash
  const agentWho = practitionerRef ?? ref('Patient', report.patient_id)
  if (!hasHash && !report.signed_at && !practitionerRef) return null
  return {
    resourceType: 'Provenance',
    id: `${report.id}-prov`,
    target: [compositionRef],
    recorded: report.signed_at ?? date,
    ...(report.signature_hash
      ? {
          extension: [
            {
              // Integridade de conteúdo (SHA-256). NÃO é assinatura ICP-Brasil (ver doc §3.7).
              url: INTEGRITY_HASH_URL,
              valueString: report.signature_hash,
            },
          ],
        }
      : {}),
    agent: [{ who: agentWho }],
  }
}

function buildComposition(
  report: ClinicalReportInput,
  content: Record<string, unknown>,
  patientRef: Reference,
  practitionerRef: Reference | null,
  clinicalImpressions: ClinicalImpression[],
  consent: Consent | null,
  date: string,
): Composition {
  const sections: CompositionSection[] = []

  // Identificação → referencia o Patient
  sections.push({
    title: 'Identificação',
    code: { coding: [{ system: SECTION_NS, code: 'identificacao' }] },
    entry: [patientRef],
  })

  // Seções textuais (só as presentes/não-vazias)
  for (const { key, title } of TEXT_SECTIONS) {
    const text = asText(content[key])
    if (!text) continue
    sections.push({
      title,
      code: { coding: [{ system: SECTION_NS, code: key }] },
      text: narrative(text),
    })
  }

  // Racionalidades → referencia os ClinicalImpression
  if (clinicalImpressions.length) {
    sections.push({
      title: 'Racionalidades',
      code: { coding: [{ system: SECTION_NS, code: 'rationalities' }] },
      entry: clinicalImpressions.map((ci) => ref('ClinicalImpression', ci.id)),
    })
  }

  // Consentimento → referencia o Consent
  if (consent) {
    sections.push({
      title: 'Consentimento',
      code: { coding: [{ system: SECTION_NS, code: 'consent' }] },
      entry: [ref('Consent', consent.id)],
    })
  }

  const author: Reference[] = [practitionerRef ?? patientRef]

  return {
    resourceType: 'Composition',
    id: report.id,
    status: report.status === 'final' || report.review_status === 'reviewed' ? 'final' : 'preliminary',
    type: {
      // LOINC ILUSTRATIVO (ver doc §4) — código final depende do perfil RAC/RES/br-core.
      coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consult note' }],
      text: report.report_type ?? 'Relatório Clínico',
    },
    subject: patientRef,
    author,
    date,
    title: report.protocol ? `${report.report_type ?? 'Relatório Clínico'} (${report.protocol})` : (report.report_type ?? 'Relatório Clínico'),
    ...(report.signature_hash
      ? {
          extension: [{ url: INTEGRITY_HASH_URL, valueString: report.signature_hash }],
        }
      : {}),
    section: sections,
  }
}

/**
 * Serializa um `clinical_report` num Bundle FHIR R4 (type=document).
 * Ordem do Bundle: Composition (raiz) → Patient → Practitioner → ClinicalImpression[] → Consent → Provenance.
 */
export function clinicalReportToFhirBundle(
  report: ClinicalReportInput,
  options: SerializeOptions = {},
): Bundle {
  const content = (report.content ?? {}) as Record<string, unknown>
  const date = report.generated_at ?? report.created_at ?? options.timestamp ?? ''

  const patient = buildPatient(report)
  const practitioner = buildPractitioner(report)
  const patientRef = ref('Patient', patient.id, report.patient_name ?? undefined)
  const practitionerRef = practitioner
    ? ref('Practitioner', practitioner.id, report.professional_name ?? undefined)
    : null

  const clinicalImpressions = buildClinicalImpressions(content, patientRef, report.id, date)
  const consent = buildConsent(report, patientRef)
  const composition = buildComposition(
    report,
    content,
    patientRef,
    practitionerRef,
    clinicalImpressions,
    consent,
    date,
  )
  const compositionRef = ref('Composition', composition.id)
  const provenance = buildProvenance(report, compositionRef, practitionerRef, date)

  const entries: BundleEntry[] = []
  entries.push({ fullUrl: `${BASE}/Composition/${composition.id}`, resource: composition })
  entries.push({ fullUrl: `${BASE}/Patient/${patient.id}`, resource: patient })
  if (practitioner) entries.push({ fullUrl: `${BASE}/Practitioner/${practitioner.id}`, resource: practitioner })
  for (const ci of clinicalImpressions) entries.push({ fullUrl: `${BASE}/ClinicalImpression/${ci.id}`, resource: ci })
  if (consent) entries.push({ fullUrl: `${BASE}/Consent/${consent.id}`, resource: consent })
  if (provenance) entries.push({ fullUrl: `${BASE}/Provenance/${provenance.id}`, resource: provenance })

  return {
    resourceType: 'Bundle',
    id: `${report.id}-document`,
    type: 'document',
    timestamp: options.timestamp ?? (date || undefined),
    entry: entries,
  }
}
