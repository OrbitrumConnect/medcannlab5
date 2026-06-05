// Edge fhir-export — V1.9.569: expõe o serializer FHIR R4 (PoC src/lib/fhir) como ENDPOINT HTTP.
//
// GET/POST com `report_id` → Bundle FHIR R4 (type=document). READ-ONLY: só LÊ o relatório
// (RLS aplicada via JWT do usuário) e serializa. NÃO escreve, NÃO toca lock nenhum. Edge ADITIVA.
// Porta fiel de clinicalReportToFhirBundle (lógica idêntica à validada em
// src/lib/fhir/clinicalReportToFhir.ts — 9 testes vitest PASS).
//
// ⚠️ Auditor-safe (não reintroduzir overclaim):
//  - signature_hash = HASH SHA-256 de integridade, NÃO assinatura ICP-Brasil (vira Provenance/extensão).
//  - LOINC do documento é ILUSTRATIVO; código final depende do perfil RAC/RES/br-core.
//  - Conformação br-core / homologação RNDS NÃO implementada (namespace urn:medcannlab proprietário).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BASE = 'urn:medcannlab'
// V1.9.595 — Base URL ABSOLUTA p/ os fullUrl dos recursos: `urn:` não resolve referência
// relativa (`Patient/<id>`) → validador FHIR/HAPI rejeita. Paridade com o lib já validado
// (src/lib/fhir, HAPI 30→0 erros). BASE fica só p/ os system identifiers/extensões internos.
const RESOURCE_BASE = 'https://fhir.medcannlab.com.br'
const INTEGRITY_HASH_URL = `${BASE}/fhir/StructureDefinition/content-integrity-hash-sha256`
const SECTION_NS = `${BASE}/fhir/CodeSystem/aec-section`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const TEXT_SECTIONS = [
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
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function narrative(text: string) {
  return { status: 'additional', div: `<div xmlns="http://www.w3.org/1999/xhtml">${escapeHtml(text)}</div>` }
}
function asText(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') { const t = v.trim(); return t.length ? t : null }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try { const s = JSON.stringify(v); return s && s !== '{}' && s !== '[]' && s !== 'null' ? s : null } catch { return null }
}
function ref(resourceType: string, id: string, display?: string) {
  return display ? { reference: `${resourceType}/${id}`, display } : { reference: `${resourceType}/${id}` }
}

function buildPatient(report: any) {
  return { resourceType: 'Patient', id: report.patient_id, ...(report.patient_name ? { name: [{ text: report.patient_name }] } : {}) }
}
function buildPractitioner(report: any) {
  const id = report.professional_id ?? report.doctor_id
  if (!id) return null
  return { resourceType: 'Practitioner', id, ...(report.professional_name ? { name: [{ text: report.professional_name }] } : {}) }
}
function buildClinicalImpressions(content: any, patientRef: any, reportId: string, date: string) {
  const rat = content['rationalities']
  if (!rat || typeof rat !== 'object') return []
  const out: any[] = []
  const entries = Array.isArray(rat) ? rat.map((v: any, i: number) => [String(i), v]) : Object.entries(rat)
  for (const [type, value] of entries) {
    const description = asText(value)
    if (!description) continue
    out.push({ resourceType: 'ClinicalImpression', id: `${reportId}-rat-${type}`, status: 'completed', subject: patientRef, date, summary: `Racionalidade: ${type}`, description })
  }
  return out
}
function buildConsent(report: any, patientRef: any) {
  if (!report.consent_given) return null
  return {
    resourceType: 'Consent', id: `${report.id}-consent`, status: 'active',
    scope: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }] },
    category: [{ coding: [{ system: 'http://loinc.org', code: '59284-0', display: 'Patient Consent' }] }],
    // ppc-1: Consent R4 exige Policy OU PolicyRule. CodeableConcept text-only é válido. V1.9.595.
    policyRule: { text: 'Consentimento informado para Avaliação Clínica Inicial (AEC) — MedCannLab' },
    patient: patientRef, ...(report.consent_at ? { dateTime: report.consent_at } : {}),
  }
}
function buildProvenance(report: any, compositionRef: any, practitionerRef: any, date: string) {
  const agentWho = practitionerRef ?? ref('Patient', report.patient_id)
  if (!report.signature_hash && !report.signed_at && !practitionerRef) return null
  return {
    resourceType: 'Provenance', id: `${report.id}-prov`, target: [compositionRef], recorded: report.signed_at ?? date,
    ...(report.signature_hash ? { extension: [{ url: INTEGRITY_HASH_URL, valueString: report.signature_hash }] } : {}),
    agent: [{ who: agentWho }],
  }
}
function buildComposition(report: any, content: any, patientRef: any, practitionerRef: any, clinicalImpressions: any[], consent: any, date: string) {
  const sections: any[] = []
  sections.push({ title: 'Identificação', code: { coding: [{ system: SECTION_NS, code: 'identificacao' }] }, entry: [patientRef] })
  for (const { key, title } of TEXT_SECTIONS) {
    const text = asText(content[key])
    if (!text) continue
    sections.push({ title, code: { coding: [{ system: SECTION_NS, code: key }] }, text: narrative(text) })
  }
  if (clinicalImpressions.length) {
    sections.push({ title: 'Racionalidades', code: { coding: [{ system: SECTION_NS, code: 'rationalities' }] }, entry: clinicalImpressions.map((ci) => ref('ClinicalImpression', ci.id)) })
  }
  if (consent) {
    sections.push({ title: 'Consentimento', code: { coding: [{ system: SECTION_NS, code: 'consent' }] }, entry: [ref('Consent', consent.id)] })
  }
  return {
    resourceType: 'Composition', id: report.id,
    status: report.status === 'final' || report.review_status === 'reviewed' ? 'final' : 'preliminary',
    type: { coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consult note' }], text: report.report_type ?? 'Relatório Clínico' },
    subject: patientRef, author: [practitionerRef ?? patientRef], date,
    title: report.protocol ? `${report.report_type ?? 'Relatório Clínico'} (${report.protocol})` : (report.report_type ?? 'Relatório Clínico'),
    ...(report.signature_hash ? { extension: [{ url: INTEGRITY_HASH_URL, valueString: report.signature_hash }] } : {}),
    section: sections,
  }
}
function clinicalReportToFhirBundle(report: any) {
  const content = (report.content ?? {}) as Record<string, unknown>
  const date = report.generated_at ?? report.created_at ?? ''
  const patient = buildPatient(report)
  const practitioner = buildPractitioner(report)
  const patientRef = ref('Patient', patient.id, report.patient_name ?? undefined)
  const practitionerRef = practitioner ? ref('Practitioner', practitioner.id, report.professional_name ?? undefined) : null
  const clinicalImpressions = buildClinicalImpressions(content, patientRef, report.id, date)
  const consent = buildConsent(report, patientRef)
  const composition = buildComposition(report, content, patientRef, practitionerRef, clinicalImpressions, consent, date)
  const provenance = buildProvenance(report, ref('Composition', composition.id), practitionerRef, date)
  const entries: any[] = []
  entries.push({ fullUrl: `${RESOURCE_BASE}/Composition/${composition.id}`, resource: composition })
  entries.push({ fullUrl: `${RESOURCE_BASE}/Patient/${patient.id}`, resource: patient })
  if (practitioner) entries.push({ fullUrl: `${RESOURCE_BASE}/Practitioner/${practitioner.id}`, resource: practitioner })
  for (const ci of clinicalImpressions) entries.push({ fullUrl: `${RESOURCE_BASE}/ClinicalImpression/${ci.id}`, resource: ci })
  if (consent) entries.push({ fullUrl: `${RESOURCE_BASE}/Consent/${consent.id}`, resource: consent })
  if (provenance) entries.push({ fullUrl: `${RESOURCE_BASE}/Provenance/${provenance.id}`, resource: provenance })
  // bdl-9: document Bundle exige identifier global estável (system + value). V1.9.595.
  return { resourceType: 'Bundle', id: `${report.id}-document`, type: 'document', identifier: { system: `${RESOURCE_BASE}/fhir/document`, value: report.id }, timestamp: date || undefined, entry: entries }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json(401, { error: 'Authorization header required' })
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )
    const url = new URL(req.url)
    let reportId = url.searchParams.get('report_id')
    if (!reportId && req.method === 'POST') {
      const body = await req.json().catch(() => ({} as any))
      reportId = body?.report_id ?? null
    }
    if (!reportId) return json(400, { error: 'report_id obrigatório (query ?report_id= ou body {report_id})' })
    // RLS aplica via JWT do usuário — só exporta relatório a que o usuário tem acesso.
    const { data: report, error } = await supabase.from('clinical_reports').select('*').eq('id', reportId).maybeSingle()
    if (error) return json(500, { error: error.message })
    if (!report) return json(404, { error: 'relatório não encontrado ou acesso negado (RLS)' })
    const bundle = clinicalReportToFhirBundle(report)
    return new Response(JSON.stringify(bundle), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/fhir+json' } })
  } catch (e) {
    return json(500, { error: String(e) })
  }
})
