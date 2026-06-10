import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  FileCheck,
  FileText,
  Heart,
  Loader2,
  Lock,
  Plus,
  Search,
  Stethoscope,
  Target,
  User,
  X,
  Zap,
  History,
  LayoutGrid,
  Printer
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type Rationality =
  | 'biomedical'
  | 'traditional_chinese'
  | 'ayurvedic'
  | 'homeopathic'
  | 'integrative'

type PrescriptionTemplate = {
  id: string
  name: string
  summary: string | null
  description: string | null
  rationality: Rationality
  category: string | null
  defaultDosage: string | null
  defaultFrequency: string | null
  defaultDuration: string | null
  defaultInstructions: string | null
  indications: string[]
  contraindications: string[]
  monitoring: string[]
  tags: string[]
}

type PatientPrescription = {
  id: string
  title: string
  summary: string | null
  rationality: Rationality | null
  dosage: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
  indications: string[]
  status: 'draft' | 'active' | 'completed' | 'suspended' | 'cancelled'
  issuedAt: string
  startsAt: string | null
  endsAt: string | null
  lastReviewedAt: string | null
  professionalName: string | null
  templateName: string | null
  planTitle: string | null
}

interface IntegrativePrescriptionsProps {
  patientId?: string | null
  patientName?: string | null
  planId?: string | null
  className?: string
}

type DraftPrescription = {
  dosage: string
  frequency: string
  duration: string
  instructions: string
  notes: string
  startsAt: string
  endsAt: string
}

const RATIONALITY_OPTIONS: Array<{
  key: 'all' | Rationality
  label: string
  icon: React.ReactNode
}> = [
    { key: 'all', label: 'Todas', icon: <Brain className="w-4 h-4" /> },
    { key: 'biomedical', label: 'Biomédica', icon: <Heart className="w-4 h-4" /> },
    { key: 'traditional_chinese', label: 'MTC', icon: <Stethoscope className="w-4 h-4" /> },
    { key: 'ayurvedic', label: 'Ayurvédica', icon: <Zap className="w-4 h-4" /> },
    { key: 'homeopathic', label: 'Homeopática', icon: <Target className="w-4 h-4" /> },
    { key: 'integrative', label: 'Integrativa', icon: <Brain className="w-4 h-4" /> }
  ]

const RATIONALITY_LABEL: Record<Rationality, string> = {
  biomedical: 'Biomédica',
  traditional_chinese: 'Medicina Tradicional Chinesa',
  ayurvedic: 'Ayurvédica',
  homeopathic: 'Homeopática',
  integrative: 'Integrativa'
}

const IntegrativePrescriptions: React.FC<IntegrativePrescriptionsProps> = ({
  patientId,
  patientName,
  planId,
  className = ''
}) => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Tab State
  const [activeTab, setActiveTab] = useState<'library' | 'history'>('library')

  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templatesError, setTemplatesError] = useState<string | null>(null)

  const [patientPrescriptions, setPatientPrescriptions] = useState<PatientPrescription[]>([])
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false)
  const [prescriptionsError, setPrescriptionsError] = useState<string | null>(null)

  const [selectedRationality, setSelectedRationality] = useState<'all' | Rationality>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedTemplate, setSelectedTemplate] = useState<PrescriptionTemplate | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [draft, setDraft] = useState<DraftPrescription>({
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    notes: '',
    startsAt: '',
    endsAt: ''
  })

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCFMModal, setShowCFMModal] = useState(false)

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    setTemplatesError(null)
    try {
      const { data, error } = await supabase
        .from('integrative_prescription_templates')
        .select(
          'id, name, summary, description, rationality, category, default_dosage, default_frequency, default_duration, default_instructions, indications, contraindications, monitoring, tags'
        )
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        throw error
      }

      const mapped: PrescriptionTemplate[] =
        data?.map(template => ({
          id: template.id,
          name: template.name ?? 'Prescrição',
          summary: template.summary ?? null,
          description: template.description ?? null,
          rationality: (template.rationality ?? 'integrative') as Rationality,
          category: template.category ?? null,
          defaultDosage: template.default_dosage ?? null,
          defaultFrequency: template.default_frequency ?? null,
          defaultDuration: template.default_duration ?? null,
          defaultInstructions: template.default_instructions ?? null,
          indications: template.indications ?? [],
          contraindications: template.contraindications ?? [],
          monitoring: template.monitoring ?? [],
          tags: template.tags ?? []
        })) ?? []

      setTemplates(mapped)
    } catch (error) {
      console.warn('Falha ao carregar templates de prescrição:', error)
      setTemplatesError('Não foi possível carregar os modelos de prescrição.')
      setTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  const loadPatientPrescriptions = useCallback(async () => {
    if (!patientId) {
      setPatientPrescriptions([])
      return
    }

    setPrescriptionsLoading(true)
    setPrescriptionsError(null)
    try {
      // V1.9.641 (10/06 ~21h BRT) - migra leitura de patient_prescriptions (0 rows,
      // tabela orfã do mundo integrativo) para cfm_prescriptions (63 rows reais
      // incluindo atestados do Ricardo). Sem regressao: patient_prescriptions estava
      // vazia. Ganho: aba "Prescrição" do Prontuário passa a listar todos os
      // documentos ja emitidos pelo medico (receitas + atestados).
      const { data, error } = await supabase
        .from('cfm_prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const mapped: PatientPrescription[] =
        data?.map((entry: any) => {
          const meds = Array.isArray(entry.medications) ? entry.medications : []
          const firstMed = meds[0] || {}
          const isAttestation = entry.prescription_type === 'attestation'
          const typeLabel = isAttestation
            ? 'Atestado Médico'
            : entry.prescription_type === 'special'
              ? 'Receita Branca (C2)'
              : entry.prescription_type === 'blue'
                ? 'Receita Azul (B1/B2)'
                : entry.prescription_type === 'yellow'
                  ? 'Receita Amarela (A1-A3)'
                  : 'Receita Simples'
          const title = isAttestation
            ? 'Atestado Médico'
            : firstMed.name || typeLabel
          const summary = isAttestation
            ? (entry.notes ? String(entry.notes).slice(0, 160) : null)
            : typeLabel
          return {
            id: entry.id,
            title,
            summary,
            rationality: null,
            dosage: firstMed.dosage ?? null,
            frequency: firstMed.frequency ?? null,
            duration: firstMed.duration ?? null,
            instructions: entry.notes ?? firstMed.instructions ?? null,
            indications: [],
            status: entry.status === 'signed' ? 'active' : (entry.status ?? 'draft'),
            issuedAt: entry.created_at,
            startsAt: null,
            endsAt: entry.expires_at ?? null,
            lastReviewedAt: entry.signature_timestamp ?? null,
            professionalName: entry.professional_name ?? null,
            templateName: typeLabel,
            planTitle: null
          }
        }) ?? []

      setPatientPrescriptions(mapped)
    } catch (error) {
      console.warn('Falha ao carregar prescrições do paciente:', error)
      setPrescriptionsError('Não foi possível carregar as prescrições do paciente.')
      setPatientPrescriptions([])
    } finally {
      setPrescriptionsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    void loadPatientPrescriptions()
  }, [loadPatientPrescriptions])

  useEffect(() => {
    if (!selectedTemplate) return
    setDraft({
      dosage: selectedTemplate.defaultDosage ?? '',
      frequency: selectedTemplate.defaultFrequency ?? '',
      duration: selectedTemplate.defaultDuration ?? '',
      instructions: selectedTemplate.defaultInstructions ?? '',
      notes: '',
      startsAt: '',
      endsAt: ''
    })
  }, [selectedTemplate])

  // V1.9.283: KPIs do paciente derivados de patientPrescriptions (zero fetch extra — princípio polir).
  // Status enum: draft | active | completed | suspended | cancelled.
  const prescriptionKPIs = useMemo(() => {
    const total = patientPrescriptions.length
    const active = patientPrescriptions.filter(p => p.status === 'active').length
    const draft = patientPrescriptions.filter(p => p.status === 'draft').length
    const completed = patientPrescriptions.filter(p => p.status === 'completed').length
    return { total, active, draft, completed }
  }, [patientPrescriptions])

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return templates.filter(template => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        template.name.toLowerCase().includes(normalizedSearch) ||
        (template.summary ?? '').toLowerCase().includes(normalizedSearch) ||
        (template.description ?? '').toLowerCase().includes(normalizedSearch)

      if (!matchesSearch) return false
      if (selectedRationality === 'all') return true
      return template.rationality === selectedRationality
    })
  }, [templates, searchTerm, selectedRationality])

  const handleOpenTemplate = (template: PrescriptionTemplate) => {
    if (!patientId) {
      setActionMessage({
        type: 'error',
        text: 'Selecione um paciente para prescrever.'
      })
      return
    }
    setSelectedTemplate(template)
    setShowTemplateModal(true)
  }

  const handleConfirmPrescription = async () => {
    if (!selectedTemplate || !patientId || !user?.id) return

    setActionLoading(true)
    setActionMessage(null)

    try {
      const payload: Record<string, unknown> = {
        patient_id: patientId,
        professional_id: user.id,
        template_id: selectedTemplate.id,
        plan_id: planId ?? null,
        title: selectedTemplate.name,
        summary: selectedTemplate.summary,
        rationality: selectedTemplate.rationality,
        dosage: draft.dosage || selectedTemplate.defaultDosage,
        frequency: draft.frequency || selectedTemplate.defaultFrequency,
        duration: draft.duration || selectedTemplate.defaultDuration,
        instructions: draft.instructions || selectedTemplate.defaultInstructions,
        indications: selectedTemplate.indications,
        notes: draft.notes || null,
        starts_at: draft.startsAt ? new Date(draft.startsAt).toISOString().slice(0, 10) : null,
        ends_at: draft.endsAt ? new Date(draft.endsAt).toISOString().slice(0, 10) : null
      }

      const { error } = await supabase.from('patient_prescriptions').insert(payload as any)

      if (error) {
        throw error
      }

      setShowTemplateModal(false)
      setActionMessage({
        type: 'success',
        text: 'Prescrição registrada e vinculada ao plano terapêutico.'
      })
      await loadPatientPrescriptions()
      setActiveTab('history') // Auto-switch to history on success
    } catch (error) {
      console.error('Falha ao emitir prescrição:', error)
      setActionMessage({
        type: 'error',
        text: 'Não foi possível emitir a prescrição. Tente novamente.'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const rationalityBadge = (rationality: Rationality | null) => {
    if (!rationality) return null
    let badgeColor = 'bg-slate-800 border-slate-700 text-slate-300'
    switch (rationality) {
      case 'biomedical':
        badgeColor = 'bg-blue-500/10 border-blue-400/40 text-blue-200'
        break
      case 'traditional_chinese':
        badgeColor = 'bg-rose-500/10 border-rose-400/40 text-rose-200'
        break
      case 'ayurvedic':
        badgeColor = 'bg-amber-500/10 border-amber-400/40 text-amber-200'
        break
      case 'homeopathic':
        badgeColor = 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200'
        break
      case 'integrative':
        badgeColor = 'bg-purple-500/10 border-purple-400/40 text-purple-200'
        break
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${badgeColor}`}>
        {RATIONALITY_LABEL[rationality]}
      </span>
    )
  }

  return (
    <>
      <div className={`space-y-4 ${className} w-full`}>
        {/* V1.9.283: Header compactado (era card 2xl com 6 padding e 2 sub-blocos border-top) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary-500/15 border border-primary-500/30 flex items-center justify-center shrink-0">
              <Brain className="w-4.5 h-4.5 text-primary-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] text-primary-300/80 font-semibold">Prescrições</p>
              <h2 className="text-base font-bold text-white leading-tight">Gestão de Prescrições</h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-950/50 p-0.5 rounded-lg border border-slate-800/50">
              <button
                onClick={() => setActiveTab('library')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'library'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Biblioteca
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'history'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
              >
                <History className="w-3.5 h-3.5" />
                Histórico
              </button>
            </div>
            <button
              onClick={() => setShowCFMModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-medium transition-all hover:scale-[1.02]"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Prescrição CFM
            </button>
          </div>
        </div>

        {/* V1.9.283: KPIs do paciente (só dentro do Prontuário onde patientId existe).
            Ataca diretamente gargalo 94% DRAFT (memória 05/05) — médico vê o estado prescritivo dele de cara.
            V1.9.501 (29/05): quando paciente NOVO (tudo zero), colapsa em pill inline única
            (economiza ~80px verticais, mantém sinal "paciente sem prescrição"). Quando há dado real,
            expande pros 4 cards completos.
            V1.9.543 (31/05): bug UX flagrado por Pedro — durante loading mostrava 4 cards grandes
            com "—" depois colapsava pra pill (flash feio "tela muda"). Fix: loading state usa
            SKELETON pill consistente (mesmo formato que empty state, só muda texto). Transição
            invisível pro médico. */}
        {patientId && (() => {
          const isLoaded = !prescriptionsLoading
          const isEmpty = isLoaded
            && prescriptionKPIs.total === 0
            && prescriptionKPIs.active === 0
            && prescriptionKPIs.draft === 0
            && prescriptionKPIs.completed === 0
          // Loading OU empty → mesma pill compacta (zero flash visual)
          if (!isLoaded || isEmpty) {
            return (
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                <span className="text-slate-600">📋</span>
                {isLoaded ? (
                  <>
                    <span>Sem prescrições pra este paciente ainda.</span>
                    <span className="text-slate-700">·</span>
                    <span className="text-slate-600">0 ativas · 0 draft · 0 concluídas</span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Carregando prescrições...
                  </span>
                )}
              </div>
            )
          }
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total</p>
                <p className="text-lg font-bold text-white">{prescriptionsLoading ? '—' : prescriptionKPIs.total}</p>
                <p className="text-[10px] text-slate-500">prescrições</p>
              </div>
              <div className="bg-emerald-500/8 rounded-lg p-3 border border-emerald-500/25">
                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-0.5">✓ Ativas</p>
                <p className="text-lg font-bold text-white">{prescriptionsLoading ? '—' : prescriptionKPIs.active}</p>
                <p className="text-[10px] text-slate-500">em curso</p>
              </div>
              <div className={`rounded-lg p-3 border ${prescriptionKPIs.draft > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${prescriptionKPIs.draft > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                  ⚠️ Draft
                </p>
                <p className="text-lg font-bold text-white">{prescriptionsLoading ? '—' : prescriptionKPIs.draft}</p>
                <p className="text-[10px] text-slate-500">{prescriptionKPIs.draft > 0 ? 'requer ação' : 'nenhuma'}</p>
              </div>
              <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Concluídas</p>
                <p className="text-lg font-bold text-white">{prescriptionsLoading ? '—' : prescriptionKPIs.completed}</p>
                <p className="text-[10px] text-slate-500">finalizadas</p>
              </div>
            </div>
          )
        })()}

        {actionMessage && (
          <div
            className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${actionMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-400/40 text-emerald-200'
                : 'bg-rose-500/10 border border-rose-400/40 text-rose-200'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${actionMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {actionMessage.text}
          </div>
        )}

        {/* --- LIBRARY TAB --- */}
        {activeTab === 'library' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            {/* V1.9.541: cards "Nova receita" elevados pro nível visual do Workstation
                (Pedro 31/05: "do prontuário tá meio apagada"). Ícone em badge colorido
                grande (igual padrão Prescriptions.tsx Workstation) + paddings maiores +
                tipografia mais legível. Mantém mesma funcionalidade (navigate type). */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-3.5 h-3.5 text-primary-300" />
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Nova receita</h3>
                <span className="text-[10px] text-slate-500 italic">— clique no tipo de receituário</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <button
                  onClick={() => navigate('/app/prescriptions?type=simple')}
                  title="Receituário Simples — Medicamentos sem controle especial"
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-left hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm leading-tight truncate">Simples</p>
                    <p className="text-[11px] text-slate-400 leading-tight truncate">sem controle</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/app/prescriptions?type=special')}
                  title="Controle Especial (Branca) — Lista C2, ANVISA Portaria 344/98, 2 vias"
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-left hover:border-slate-500/60 hover:bg-slate-700/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-700/40 border border-slate-600/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Lock className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm leading-tight truncate">Branca (C2)</p>
                    <p className="text-[11px] text-slate-400 leading-tight truncate">controle especial</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/app/prescriptions?type=blue')}
                  title="Receita Azul B1/B2 — Entorpecentes e psicotrópicos com QR Code"
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-left hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Lock className="w-5 h-5 text-blue-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm leading-tight truncate">Azul (B1/B2)</p>
                    <p className="text-[11px] text-slate-400 leading-tight truncate">psicotrópicos</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/app/prescriptions?type=yellow')}
                  title="Receita Amarela A1/A2/A3 — Entorpecentes restritos, integração Portal ITI"
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-left hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Lock className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm leading-tight truncate">Amarela (A1-A3)</p>
                    <p className="text-[11px] text-slate-400 leading-tight truncate">restrito ITI</p>
                  </div>
                </button>
                {/* V1.9.641 - 5o card Atestado Medico (Ricardo 10/06: precisava emitir
                    atestado pelo Prontuario, nao so pelo Workstation) */}
                <button
                  onClick={() => navigate('/app/prescriptions?type=attestation')}
                  title="Atestado Médico — Afastamento/comparecimento com assinatura ICP-Brasil"
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-left hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileCheck className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm leading-tight truncate">Atestado</p>
                    <p className="text-[11px] text-slate-400 leading-tight truncate">afastamento</p>
                  </div>
                </button>
              </div>
            </div>

            {/* V1.9.283: separador minimalista (era 3 elementos com border) */}
            <div className="flex items-center gap-2 pt-1">
              <BookOpen className="w-3.5 h-3.5 text-primary-400" />
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Protocolos Terapêuticos</h3>
              <span className="text-[10px] text-slate-500 italic">— biblioteca de protocolos pré-definidos</span>
            </div>

            {/* Filters */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Buscar protocolo..."
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/60"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                {RATIONALITY_OPTIONS.map(option => (
                  <button
                    key={option.key}
                    onClick={() => setSelectedRationality(option.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${selectedRationality === option.key
                        ? 'border-primary-500/60 bg-primary-500/10 text-primary-200'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {templatesLoading ? (
              <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mr-3 text-primary-500" />
                Carregando biblioteca...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-2xl py-16 text-center space-y-4 bg-slate-900/20">
                <div className="bg-slate-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-slate-800">
                  <Search className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-slate-300 font-medium">Nenhum protocolo encontrado</p>
                  <p className="text-sm text-slate-500">Tente ajustar seus filtros de busca.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <article
                    key={template.id}
                    className="group rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-2.5 transition-all hover:border-primary-500/30 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-primary-900/5 flex flex-col min-h-[180px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between w-full">
                          <h3 className="text-white text-sm font-semibold leading-snug group-hover:text-primary-200 transition-colors">
                            {template.name}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rationalityBadge(template.rationality)}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed flex-grow">
                      {template.summary ?? template.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-slate-800/60 pt-2.5 mt-auto">
                      <span className="flex items-center gap-1" title="Dosagem Padrão">
                        <Stethoscope className="w-3 h-3 text-slate-600" />
                        {template.defaultDosage ? 'Dosagem pré-def.' : 'Personalizável'}
                      </span>
                      <span className="flex items-center gap-1" title="Duração Padrão">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        {template.defaultDuration ?? 'Duração aberta'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenTemplate(template)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-medium transition-all hover:scale-[1.02]"
                    >
                      Prescrever este protocolo
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </article>
                ))}
                {/* V1.9.539: removidos 2 placeholders fake "Mais protocolos em breve"
                    que poluíam visual quando há <3 templates. Grid responsivo já adapta
                    naturalmente sem precisar preencher slots vazios artificialmente. */}
              </div>
            )}
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-300" />
                Registros de Prescrições
              </h3>
              {!patientId && (
                <span className="text-xs text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Selecione um paciente
                </span>
              )}
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Data / Hora</th>
                    <th className="px-6 py-4 whitespace-nowrap">Protocolo / Título</th>
                    <th className="px-6 py-4 whitespace-nowrap">Racionalidade</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 whitespace-nowrap">Profissional</th>
                    <th className="px-6 py-4 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {prescriptionsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary-500" />
                        Carregando histórico...
                      </td>
                    </tr>
                  ) : patientPrescriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-600 bg-slate-900/20">
                        <div className="bg-slate-800/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto border border-slate-700 mb-3">
                          <History className="w-5 h-5 text-slate-500" />
                        </div>
                        Nenhuma prescrição encontrada para este paciente.
                      </td>
                    </tr>
                  ) : (
                    patientPrescriptions.map(presc => (
                      <tr key={presc.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                          <div className="font-medium text-white">{new Date(presc.issuedAt).toLocaleDateString('pt-BR')}</div>
                          <div className="text-xs text-slate-600">{new Date(presc.issuedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-200 font-medium block truncate max-w-[200px] group-hover:text-primary-200 transition-colors">{presc.title}</span>
                          {presc.templateName && <span className="text-xs text-slate-500">Base: {presc.templateName}</span>}
                        </td>
                        <td className="px-6 py-4">
                          {rationalityBadge(presc.rationality)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${presc.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              presc.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                            {presc.status === 'active' ? 'Ativa' : presc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                          {presc.professionalName || <span className="text-slate-600 italic">Sistema</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-500 hover:text-primary-300 p-2 hover:bg-primary-500/10 rounded-lg transition-colors" title="Imprimir / Visualizar">
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- TEMPLATE MODAL (UNCHANGED) --- */}
      {showTemplateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[1000] px-4 animate-in fade-in duration-200">
          <div className="bg-slate-950 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 sticky top-0 backdrop-blur-md z-10">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedTemplate.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Vinculada ao paciente {patientName ?? 'selecionado'} • {RATIONALITY_LABEL[selectedTemplate.rationality]}
                </p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="w-9 h-9 rounded-full border border-slate-700 text-slate-300 hover:text-primary-200 hover:border-primary-500/40 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">Dosagem</label>
                  <input
                    value={draft.dosage}
                    onChange={event => setDraft(prev => ({ ...prev, dosage: event.target.value }))}
                    placeholder={selectedTemplate.defaultDosage ?? 'Defina a dosagem'}
                    className="w-full mt-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">Frequência</label>
                  <input
                    value={draft.frequency}
                    onChange={event => setDraft(prev => ({ ...prev, frequency: event.target.value }))}
                    placeholder={selectedTemplate.defaultFrequency ?? 'Defina a frequência'}
                    className="w-full mt-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">Duração</label>
                  <input
                    value={draft.duration}
                    onChange={event => setDraft(prev => ({ ...prev, duration: event.target.value }))}
                    placeholder={selectedTemplate.defaultDuration ?? 'Defina a duração'}
                    className="w-full mt-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-transparent transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">Início</label>
                    <input
                      type="date"
                      value={draft.startsAt}
                      onChange={event => setDraft(prev => ({ ...prev, startsAt: event.target.value }))}
                      className="w-full mt-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">Término</label>
                    <input
                      type="date"
                      value={draft.endsAt}
                      onChange={event => setDraft(prev => ({ ...prev, endsAt: event.target.value }))}
                      className="w-full mt-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">Instruções clínicas</label>
                <textarea
                  value={draft.instructions}
                  onChange={event => setDraft(prev => ({ ...prev, instructions: event.target.value }))}
                  placeholder={selectedTemplate.defaultInstructions ?? 'Descreva as orientações para o paciente'}
                  className="w-full mt-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-transparent min-h-[120px] transition-all"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium">Notas adicionais (interno)</label>
                <textarea
                  value={draft.notes}
                  onChange={event => setDraft(prev => ({ ...prev, notes: event.target.value }))}
                  placeholder="Informações complementares visíveis apenas para a equipe profissional."
                  className="w-full mt-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-transparent min-h-[100px] transition-all"
                />
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-300 space-y-1">
                <p>• Indicações principais: {selectedTemplate.indications.join(', ') || 'Sem indicações registradas'}</p>
                {selectedTemplate.contraindications.length > 0 && (
                  <p>• Contraindicações: {selectedTemplate.contraindications.join(', ')}</p>
                )}
                {selectedTemplate.monitoring.length > 0 && (
                  <p>• Monitoramento sugerido: {selectedTemplate.monitoring.join(', ')}</p>
                )}
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-900/30 sticky bottom-0 backdrop-blur-md">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-primary-200 hover:border-primary-500/40 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPrescription}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-primary-500 hover:bg-primary-400 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-900/20"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar prescrição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CFM MODAL (UNCHANGED) --- */}
      {showCFMModal && (
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[1100] px-4 animate-in fade-in zoom-in-95 duration-200"
          onClick={event => {
            if (event.target === event.currentTarget) {
              setShowCFMModal(false)
            }
          }}
        >
          <div
            className="bg-slate-950 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto border border-slate-800 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50">
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary-300" />
                  Emitir prescrição CFM
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione o tipo de receituário conforme as diretrizes do Conselho Federal de Medicina.
                </p>
              </div>
              <button
                onClick={() => setShowCFMModal(false)}
                className="w-9 h-9 rounded-full border border-slate-700 text-slate-300 hover:text-primary-200 hover:border-primary-500/40 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    navigate('/app/prescriptions?type=simple')
                    setShowCFMModal(false)
                  }}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 text-left space-y-2 hover:border-primary-500/40 hover:bg-slate-900/80 transition-all hover:scale-[1.01]"
                >
                  <FileText className="w-7 h-7 text-primary-300" />
                  <p className="text-white font-semibold text-lg">Receituário simples</p>
                  <p className="text-sm text-slate-400">Medicamentos sem controle especial, assinatura digital e envio automático ao paciente.</p>
                </button>
                <button
                  onClick={() => {
                    navigate('/app/prescriptions?type=special')
                    setShowCFMModal(false)
                  }}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 text-left space-y-2 hover:border-primary-500/40 hover:bg-slate-900/80 transition-all hover:scale-[1.01]"
                >
                  <Lock className="w-7 h-7 text-sky-300" />
                  <p className="text-white font-semibold text-lg">Receita branca controle especial</p>
                  <p className="text-sm text-slate-400">Psicotrópicos e retinoides (lista C2) com assinatura ICP-Brasil.</p>
                </button>
                <button
                  onClick={() => {
                    navigate('/app/prescriptions?type=blue')
                    setShowCFMModal(false)
                  }}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 text-left space-y-2 hover:border-primary-500/40 hover:bg-slate-900/80 transition-all hover:scale-[1.01]"
                >
                  <Lock className="w-7 h-7 text-blue-300" />
                  <p className="text-white font-semibold text-lg">Receita azul (B1/B2)</p>
                  <p className="text-sm text-slate-400">Entorpecentes e psicotrópicos controlados, com QR Code para validação.</p>
                </button>
                <button
                  onClick={() => {
                    navigate('/app/prescriptions?type=yellow')
                    setShowCFMModal(false)
                  }}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 text-left space-y-2 hover:border-primary-500/40 hover:bg-slate-900/80 transition-all hover:scale-[1.01]"
                >
                  <Lock className="w-7 h-7 text-amber-300" />
                  <p className="text-white font-semibold text-lg">Receita amarela (A1/A2/A3)</p>
                  <p className="text-sm text-slate-400">Entorpecentes de uso restrito com integração ao Portal do ITI.</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default IntegrativePrescriptions
