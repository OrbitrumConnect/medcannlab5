/**
 * Subconjunto MÍNIMO de tipos HL7 FHIR R4 usado pelo serializer do MedCannLab.
 *
 * NÃO é a definição completa do FHIR — apenas os recursos/campos que o serializer
 * produz (frente #1 do roadmap regulatório 02/06: camada de EXPORTAÇÃO aditiva,
 * read-only). Conformação aos perfis br-core / RNDS é roadmap (ver
 * docs/INTEROP_FHIR_MEDCANNLAB_R4.md §5-6).
 */

export interface Coding {
  system?: string
  code?: string
  display?: string
}

export interface CodeableConcept {
  coding?: Coding[]
  text?: string
}

export interface Identifier {
  use?: string
  system?: string
  value?: string
}

export interface Reference {
  reference?: string
  display?: string
}

export interface Period {
  start?: string
  end?: string
}

/** Narrativa XHTML (Composition.section.text etc.) */
export interface Narrative {
  status: 'generated' | 'extensions' | 'additional' | 'empty'
  div: string
}

export interface Extension {
  url: string
  valueString?: string
  valueDateTime?: string
  valueBoolean?: boolean
}

export interface Meta {
  versionId?: string
  lastUpdated?: string
  profile?: string[]
}

export interface HumanName {
  use?: string
  text?: string
  family?: string
  given?: string[]
}

export interface ContactPoint {
  system?: 'phone' | 'email' | 'url' | 'sms' | 'fax' | 'pager' | 'other'
  value?: string
  use?: string
}

export interface Patient {
  resourceType: 'Patient'
  id: string
  meta?: Meta
  identifier?: Identifier[]
  name?: HumanName[]
  telecom?: ContactPoint[]
  gender?: string
  birthDate?: string
}

export interface Practitioner {
  resourceType: 'Practitioner'
  id: string
  meta?: Meta
  identifier?: Identifier[]
  name?: HumanName[]
}

export interface CompositionSection {
  title?: string
  code?: CodeableConcept
  text?: Narrative
  entry?: Reference[]
}

export interface Composition {
  resourceType: 'Composition'
  id: string
  meta?: Meta
  extension?: Extension[]
  status: 'preliminary' | 'final' | 'amended' | 'entered-in-error'
  type: CodeableConcept
  subject?: Reference
  author: Reference[]
  date: string
  title: string
  section?: CompositionSection[]
}

export interface ClinicalImpression {
  resourceType: 'ClinicalImpression'
  id: string
  status: 'in-progress' | 'completed' | 'entered-in-error'
  subject: Reference
  date?: string
  summary?: string
  description?: string
}

export interface Consent {
  resourceType: 'Consent'
  id: string
  status: 'active' | 'proposed' | 'rejected' | 'inactive' | 'entered-in-error'
  scope: CodeableConcept
  category: CodeableConcept[]
  patient?: Reference
  dateTime?: string
  /** ppc-1: Consent R4 exige Policy OU PolicyRule. */
  policyRule?: CodeableConcept
}

export interface ProvenanceAgent {
  type?: CodeableConcept
  who: Reference
}

export interface Provenance {
  resourceType: 'Provenance'
  id: string
  target: Reference[]
  recorded: string
  extension?: Extension[]
  agent: ProvenanceAgent[]
}

export type FhirResource =
  | Patient
  | Practitioner
  | Composition
  | ClinicalImpression
  | Consent
  | Provenance

export interface BundleEntry {
  fullUrl?: string
  resource: FhirResource
}

/** Bundle type=document — prontuário empacotado (Composition na raiz). */
export interface Bundle {
  resourceType: 'Bundle'
  id?: string
  meta?: Meta
  type: 'document'
  /** bdl-9: document Bundle exige identifier (system + value). */
  identifier?: Identifier
  timestamp?: string
  entry: BundleEntry[]
}
