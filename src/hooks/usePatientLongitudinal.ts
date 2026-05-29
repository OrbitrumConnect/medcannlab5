/**
 * usePatientLongitudinal — hook que carrega recortes longitudinais de UM paciente
 * pra anexar como cards na Nôa Matrix.
 *
 * V1.9.382 — Fluxo longitudinal Terminal de Atendimento → Nôa Matrix.
 *
 * Origem: conversa Pedro 19/05 noite — "caso amadurece com tempo, não nasce
 * na primeira AEC; médico no Terminal de Atendimento deve poder levar recortes
 * pro chat Nôa Matrix". Material A puro Pedro (continuação coerente da Sequência
 * Conservadora Ricardo cristalizada em 6+ meses).
 *
 * Princípios aplicados:
 *  - feedback_publicacao_nao_e_exploracao_interna_18_05 (exploração vs publicação)
 *  - feedback_limitar_autoridade_computacional_19_05 (Z2 estrutural)
 *  - feedback_admin_metadata_nao_conteudo_clinico_16_05 (cuidado com PHI)
 *  - polir-não-inventar (reusa clinical_reports + clinical_rationalities existentes)
 *
 * Atrito intencional:
 *  - Médico recebe lista de cards DESMARCADOS por default
 *  - Médico marca explicitamente quais quer trazer pro chat
 *  - Audit log no carregamento (LGPD trail — quem viu o quê e quando)
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

import { extractPseudonymizedClinicalContent, type PseudonymizedClinicalContent } from '../lib/casePseudonymization'

export interface LongitudinalReport {
  id: string
  created_at: string
  status: string
  signed_at: string | null
  mainComplaint?: string
  listaIndiciaria?: string[]
  // [V1.9.450-B] Conteúdo clínico pseudonimizado extraído via mesma helper
  // V1.9.450 (casePseudonymization.ts). NoaMatrixView body usa
  // formatPseudonymizedCaseBody quando presente → Matrix recebe corpus rico
  // (família + HDA + hábitos + perguntas objetivas) também no path automático
  // (Terminal → Paciente → Matrix), não só via marcação manual (caseOpens).
  // Sem isso, Matrix tentava completar lacuna via plausibilidade — bug
  // empírico descoberto 25/05/2026 smoke V1.9.450.
  // LGPD: NÃO inclui identificacao.nome (helper preserva whitelist).
  clinicalContent?: PseudonymizedClinicalContent | null
}

export interface LongitudinalRationality {
  id: string
  rationality_type: string
  created_at: string
  assessmentExcerpt?: string  // primeiros 200 chars do assessment (recorte estrutural)
}

// V1.9.483 (Camada 1.3 Matrix-Longitudinal) — Dossiês prévios do paciente em
// foco como contexto interpretativo da continuidade clínica. Ricardo 28/05:
// "Matrix deveria puxar continuidade do estudo pelo prontuário". Empírico:
// Carolina #A41C tem 2 dossiês físicos no banco — quando médico abre Matrix
// com ela amanhã, deveria ver os 2 prévios como contexto.
// LGPD: snapshot imutável (só leitura, não modifica). Título + data + cards
// count + snippet das primeiras mensagens. RLS protege (só dono ou admin).
export interface LongitudinalPriorDossier {
  id: string
  title: string
  generated_at: string
  cardsCount: number       // quantos cards estavam marcados no dossiê
  messagesCount: number    // quantas mensagens conversa Matrix
  snippet?: string         // primeiros ~200 chars da primeira mensagem do médico
}

// V1.9.489 (Camada 1.2 Matrix-Longitudinal — Pedro 29/05) — Evoluções escritas
// PELO MÉDICO via Terminal "Nova Evolução" (clinical_assessments WHERE
// assessment_type = 'FOLLOW_UP'). Fonte distinta de AEC (clinical_reports) e
// de chat_interaction (patient_medical_records). Princípio meta 28/05:
// separação semântica > expansão de corpus — Matrix vê o que MÉDICO escreveu
// como contexto separado e não mistura com IA Residente.
// LGPD: contentExcerpt limitado a 200 chars (preserva body anexável compacto;
// médico vê excerto + data + auto-identifica). doctor_id deixado opcional pra
// futuro display ("Evolução por Dr X em DD/MM").
export interface LongitudinalFollowUp {
  id: string
  created_at: string
  status: string
  contentExcerpt?: string  // primeiros 200 chars de clinical_report OU data.clinicalNotes
  doctorIdRef?: string | null
}

export interface PatientLongitudinalData {
  patientName: string | null         // Nome REAL (médico precisa identificar internamente)
  patientPseudonym: string | null    // V1.9.384 — código curto pra contexto Matrix (LGPD-friendly)
  reports: LongitudinalReport[]
  rationalities: LongitudinalRationality[]
  // V1.9.483 — dossiês prévios do mesmo paciente (continuidade interpretativa)
  priorDossiers: LongitudinalPriorDossier[]
  // V1.9.489 — evoluções escritas pelo médico (clinical_assessments FOLLOW_UP)
  followUps: LongitudinalFollowUp[]
  loading: boolean
  error: string | null
}

/**
 * V1.9.384 — Gera pseudônimo determinístico curto a partir do patient_id.
 * Médico vê "Paciente #A4F2" em vez de "Pedro Paciente" no contexto do chat.
 *
 * Por que pseudonimizar mesmo num chat privado do médico?
 *  - Higiene Z2 cristalizada (Material A Pedro 19/05 noite)
 *  - Prepara pro fluxo futuro Fórum (já sai anonimizado)
 *  - Reduz risco médico copiar/colar conversa com PHI em comunicação externa
 *  - Médico SABE quem é (vê no Terminal de Atendimento) — Matrix só não usa o nome
 *
 * Deterministico (mesmo patient_id sempre gera mesmo pseudônimo na sessão)
 * + curto (4 chars hex) + legível.
 */
function generatePseudonym(patientId: string): string {
  // Hash leve dos últimos 8 chars do UUID — não-criptográfico, só pra exibição
  const tail = patientId.slice(-8).toUpperCase()
  // Pega 4 chars distribuídos pra evitar colisão visual ("Paciente #A4F2")
  return `${tail[0]}${tail[2]}${tail[4]}${tail[6]}`
}

const MAX_REPORTS = 5
const MAX_RATIONALITIES = 10
const ASSESSMENT_EXCERPT_CHARS = 200
// V1.9.483 — cap defensivo dossiês prévios (anti-DOC_LIST hijacking V1.9.318).
// 5 é suficiente pra continuidade interpretativa empírica (Carolina tem só 2 hoje).
const MAX_PRIOR_DOSSIERS = 5
const DOSSIER_SNIPPET_CHARS = 200
// V1.9.489 — cap defensivo FOLLOW_UP. Sistema tem ~18 rows totais hoje (empírico
// audit 28/05); por paciente raramente mais que 5-10. Cap 10 evita corpus inflar
// sem perder continuidade do que o médico escreveu.
const MAX_FOLLOW_UPS = 10
const FOLLOW_UP_EXCERPT_CHARS = 200

export function usePatientLongitudinal(patientId: string | undefined | null): PatientLongitudinalData {
  const [data, setData] = useState<PatientLongitudinalData>({
    patientName: null,
    patientPseudonym: null,
    reports: [],
    rationalities: [],
    priorDossiers: [],
    followUps: [],
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!patientId) {
      setData({ patientName: null, patientPseudonym: null, reports: [], rationalities: [], priorDossiers: [], followUps: [], loading: false, error: null })
      return
    }

    let cancelled = false
    setData((prev) => ({ ...prev, loading: true, error: null }))

    const load = async () => {
      try {
        // Nome do paciente (RLS protege — só médicos vinculados veem)
        const { data: userData } = await (supabase as any)
          .from('users')
          .select('name')
          .eq('id', patientId)
          .maybeSingle()

        // Últimos N relatórios assinados (snapshot estruturado)
        const { data: reportsData } = await (supabase as any)
          .from('clinical_reports')
          .select('id, created_at, status, signed_at, content')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(MAX_REPORTS)

        // Últimas N racionalidades aplicadas
        const { data: rationalitiesData } = await (supabase as any)
          .from('clinical_rationalities')
          .select('id, rationality_type, created_at, assessment')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(MAX_RATIONALITIES)

        // V1.9.483 (Camada 1.3) — dossiês prévios do mesmo paciente como
        // contexto de continuidade interpretativa. Limit defensivo + ordem desc
        // (mais recente primeiro). RLS por physician_id protege (médico vê só
        // os próprios; admin vê todos). Empírico Carolina #A41C tem 2 dossiês
        // físicos no banco — quando Ricardo abrir Matrix com ela, deveria ver
        // a continuidade.
        const { data: dossiersData } = await (supabase as any)
          .from('physician_research_dossiers')
          .select('id, title, generated_at, content')
          .eq('patient_id', patientId)
          .order('generated_at', { ascending: false })
          .limit(MAX_PRIOR_DOSSIERS)

        // V1.9.489 (Camada 1.2) — evoluções FOLLOW_UP escritas pelo médico via
        // Terminal "Nova Evolução". Fonte distinta de AEC (clinical_reports)
        // e de chat_interaction. Filtra exato assessment_type='FOLLOW_UP'
        // (não incluir TRIAGE/CONSULTA/IMRE — esses são fluxo IA, não evolução
        // longitudinal escrita pelo médico). doctor_id incluso pra display futuro.
        const { data: followUpsData } = await (supabase as any)
          .from('clinical_assessments')
          .select('id, created_at, status, clinical_report, data, doctor_id')
          .eq('patient_id', patientId)
          .eq('assessment_type', 'FOLLOW_UP')
          .order('created_at', { ascending: false })
          .limit(MAX_FOLLOW_UPS)

        if (cancelled) return

        const reports: LongitudinalReport[] = (reportsData || []).map((r: any) => {
          const c = r.content || {}
          // [V1.9.450-B] Extrai whitelist clínica completa do content jsonb.
          // Inclui história familiar, HDA, hábitos, perguntas objetivas
          // — campos que NÃO existiam no body antigo do longitudinal.
          // Sem isso Matrix alucinava esses dados (smoke 25/05 caso real).
          const clinicalContent = extractPseudonymizedClinicalContent(c)
          return {
            id: r.id,
            created_at: r.created_at,
            status: r.status,
            signed_at: r.signed_at,
            mainComplaint: c.main_complaint || c.queixa_principal || c.chiefComplaint || undefined,
            listaIndiciaria: Array.isArray(c.lista_indiciaria)
              ? c.lista_indiciaria.slice(0, 5).map((x: any) => typeof x === 'string' ? x : (x?.label ?? ''))
              : undefined,
            clinicalContent,
          }
        })

        const rationalities: LongitudinalRationality[] = (rationalitiesData || []).map((r: any) => ({
          id: r.id,
          rationality_type: r.rationality_type,
          created_at: r.created_at,
          assessmentExcerpt: typeof r.assessment === 'string'
            ? r.assessment.substring(0, ASSESSMENT_EXCERPT_CHARS).trim()
            : undefined,
        }))

        // V1.9.489 — mapeia FOLLOW_UPs pra interface compacta. Excerpt vem de
        // clinical_report (string direta) OU data.clinicalNotes/investigation
        // (jsonb fallback). Preserva ordem desc (mais recente primeiro).
        const followUps: LongitudinalFollowUp[] = (followUpsData || []).map((a: any) => {
          const directReport = typeof a.clinical_report === 'string' ? a.clinical_report : ''
          const dataNotes = typeof a.data === 'object' && a.data !== null
            ? (a.data.clinicalNotes || a.data.investigation || '')
            : ''
          const source = directReport || (typeof dataNotes === 'string' ? dataNotes : '')
          return {
            id: a.id,
            created_at: a.created_at,
            status: a.status || 'unknown',
            contentExcerpt: source.length > 0 ? source.substring(0, FOLLOW_UP_EXCERPT_CHARS).trim() : undefined,
            doctorIdRef: a.doctor_id || null,
          }
        })

        // V1.9.483 — mapeia dossiês prévios pra interface compacta. Extrai
        // metadata (cards count, messages count, primeira mensagem médico como
        // snippet). NÃO inclui content jsonb completo no card pra preservar
        // payload leve + reduzir vetor PHI no contexto (médico abre via Eye
        // pra ver dossiê completo se quiser).
        const priorDossiers: LongitudinalPriorDossier[] = (dossiersData || []).map((d: any) => {
          const content = d.content || {}
          const messages = Array.isArray(content.messages) ? content.messages : []
          const selectedCards = Array.isArray(content.selectedCards) ? content.selectedCards : []
          // Primeira msg do médico (role 'user' ou similar) como snippet contextual
          const firstMedicMsg = messages.find((m: any) =>
            m && typeof m === 'object' && (m.role === 'user' || m.author === 'medico' || m.from === 'physician')
          )
          const snippetSource = (firstMedicMsg?.content || firstMedicMsg?.text || '') as string
          return {
            id: d.id,
            title: d.title || `Dossiê ${new Date(d.generated_at).toLocaleDateString('pt-BR')}`,
            generated_at: d.generated_at,
            cardsCount: selectedCards.length,
            messagesCount: messages.length,
            snippet: typeof snippetSource === 'string' && snippetSource.length > 0
              ? snippetSource.substring(0, DOSSIER_SNIPPET_CHARS).trim()
              : undefined,
          }
        })

        // Audit log LGPD (sem PHI direto, só metadados)
        try {
          await (supabase as any).from('noa_logs').insert({
            interaction_type: 'matrix_patient_load_v1_9_382',
            payload: {
              patient_id: patientId,
              reports_loaded: reports.length,
              rationalities_loaded: rationalities.length,
              prior_dossiers_loaded: priorDossiers.length,  // V1.9.483
              follow_ups_loaded: followUps.length,           // V1.9.489
              source: 'noa_matrix_longitudinal',
            },
          })
        } catch {
          // audit fail-open (não bloqueia carregamento)
        }

        setData({
          patientName: userData?.name || null,
          patientPseudonym: generatePseudonym(patientId),  // V1.9.384 — sempre pseudônimo no contexto Matrix
          reports,
          rationalities,
          priorDossiers,  // V1.9.483
          followUps,      // V1.9.489
          loading: false,
          error: null,
        })
      } catch (err: any) {
        if (cancelled) return
        console.warn('[usePatientLongitudinal] erro:', err)
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err?.message || 'Erro ao carregar histórico do paciente',
        }))
      }
    }

    load()
    return () => { cancelled = true }
  }, [patientId])

  return data
}
