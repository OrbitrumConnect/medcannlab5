import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  Pill,
  Droplets,
  Zap,
  CheckCircle,
  AlertCircle,
  X,
  Printer,
  Save,
  Trash2,
  Loader2,
  Check,
  ListChecks,
  Lock
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getAllPatients } from '../lib/adminPermissions'

interface PrescriptionTemplate {
  id: string
  name: string
  category: 'cannabis' | 'nefrologia' | 'sintomatico' | 'suporte'
  description: string
  dosage: string
  frequency: string
  duration: string
  indications: string[]
  contraindications: string[]
  monitoring: string[]
  lastUsed: string
  usageCount: number
}

interface QuickPrescriptionsProps {
  className?: string
  patientId?: string | null
}

const QuickPrescriptions: React.FC<QuickPrescriptionsProps> = ({ className = '', patientId }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<PrescriptionTemplate | null>(null)

  // Estado do Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(patientId || '')

  // Lista de Pacientes Reais
  const [patientsList, setPatientsList] = useState<{ id: string, name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false) // Novo estado para feedback visual

  // Estado do Formulário de Prescrição (para edição)
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  })

  // [V1.9.134/135] Stats + lista cards — carrega prescrições do médico logado
  interface MyPrescription {
    id: string
    status: 'draft' | 'signed' | 'sent' | 'validated' | 'cancelled'
    prescription_type: string
    patient_name: string | null
    patient_cpf: string | null
    medications: any
    created_at: string
    iti_validation_code?: string | null
  }
  const [myPrescriptions, setMyPrescriptions] = useState<MyPrescription[]>([])
  const [showCertHelpModal, setShowCertHelpModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'todas' | 'draft' | 'signed' | 'sent'>('todas')

  const prescriptionStats = useMemo(() => {
    const draft = myPrescriptions.filter(p => p.status === 'draft').length
    const signed = myPrescriptions.filter(p => p.status === 'signed').length
    const sent = myPrescriptions.filter(p => p.status === 'sent' || p.status === 'validated').length
    return { total: myPrescriptions.length, draft, signed, sent }
  }, [myPrescriptions])

  const filteredMyPrescriptions = useMemo(() => {
    if (statusFilter === 'todas') return myPrescriptions
    if (statusFilter === 'sent') return myPrescriptions.filter(p => p.status === 'sent' || p.status === 'validated')
    return myPrescriptions.filter(p => p.status === statusFilter)
  }, [myPrescriptions, statusFilter])

  const loadMyPrescriptions = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('cfm_prescriptions')
        .select('id, status, prescription_type, patient_name, patient_cpf, medications, created_at, iti_validation_code')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setMyPrescriptions((data || []) as MyPrescription[])
    } catch (err) {
      console.error('[V1.9.135] erro ao carregar prescrições:', err)
    }
  }

  // Carregar lista de pacientes ao montar
  useEffect(() => {
    loadPatientsList()
    loadMyPrescriptions()
  }, [])

  // Recarregar stats após salvar prescrição (criação reflete em rascunhos)
  useEffect(() => {
    if (showSuccess) {
      loadMyPrescriptions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccess])

  // Atualizar selectedPatient se a prop mudar
  useEffect(() => {
    if (patientId) setSelectedPatient(patientId)
  }, [patientId])

  const loadPatientsList = async () => {
    if (!user) return

    try {
      const patients = await getAllPatients(user)
      if (patients) {
        setPatientsList(patients.map(p => ({ id: p.id, name: p.name })))
      }
    } catch (err) {
      console.error("Erro ao carregar lista de pacientes", err)
    }
  }

  const handleSavePrescription = async () => {
    if (!selectedPatient || !prescriptionForm.medication) {
      alert('Selecione um paciente e preencha a medicação.') // Esse alert de validação pode ficar ou mudar para toast depois
      return
    }

    setSaving(true)
    try {
      // Tenta salvar na tabela 'cfm_prescriptions' (canonical)
      const { error } = await supabase.from('cfm_prescriptions').insert({
        prescription_type: 'simple', // Padrão para QuickPrescriptions
        patient_id: selectedPatient,
        patient_name: patientsList.find(p => p.id === selectedPatient)?.name || 'Paciente',
        professional_id: user?.id,
        professional_name: user?.name || 'Profissional',
        professional_crm: (user as any)?.crm || '',
        medications: [{
          name: prescriptionForm.medication,
          dosage: prescriptionForm.dosage,
          frequency: prescriptionForm.frequency,
          duration: prescriptionForm.duration,
          quantity: '1' // Default
        }],
        status: 'draft',
        notes: prescriptionForm.notes,
        created_at: new Date().toISOString()
      })

      if (error) {
        console.error('Erro ao salvar prescrição:', error)
        throw new Error('Falha ao salvar no banco de dados. Verifique a tabela cfm_prescriptions.')
      }

      // SUCESSO ELEGANTE
      setShowSuccess(true)

      // Limpar form
      setPrescriptionForm({
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: ''
      })

      // Fechar modal após 2 segundos
      setTimeout(() => {
        setShowSuccess(false)
        setIsModalOpen(false)
      }, 2000)

    } catch (err: any) {
      alert(err.message) // Erro mantém alert por enquanto para garantir leitura
    } finally {
      setSaving(false)
    }
  }

  // Templates de prescrição mockados (Mantidos para agilidade)
  const prescriptionTemplates: PrescriptionTemplate[] = [
    {
      id: '1',
      name: 'CBD para Dor Crônica Renal',
      category: 'cannabis',
      description: 'Protocolo de CBD para controle de dor em pacientes com doença renal crônica',
      dosage: '10-20mg',
      frequency: '2x ao dia',
      duration: '30 dias',
      indications: ['Dor crônica', 'Insônia', 'Ansiedade', 'Inflamação'],
      contraindications: ['Hipotensão', 'Interação com anticoagulantes'],
      monitoring: ['Pressão arterial', 'Função renal', 'Sintomas neurológicos'],
      lastUsed: '2024-01-10',
      usageCount: 15
    },
    {
      id: '2',
      name: 'THC para Náusea e Vômito',
      category: 'cannabis',
      description: 'Protocolo de THC para controle de náusea e vômito em pacientes renais',
      dosage: '2.5-5mg',
      frequency: 'Conforme necessário',
      duration: '15 dias',
      indications: ['Náusea', 'Vômito', 'Perda de apetite'],
      contraindications: ['Psicose', 'Ansiedade severa'],
      monitoring: ['Estado mental', 'Apetite', 'Náusea'],
      lastUsed: '2024-01-08',
      usageCount: 8
    },
    {
      id: '3',
      name: 'Cannabis para Espasmos Musculares',
      category: 'cannabis',
      description: 'Protocolo combinado CBD/THC para espasmos musculares em pacientes renais',
      dosage: 'CBD 15mg + THC 2.5mg',
      frequency: '3x ao dia',
      duration: '45 dias',
      indications: ['Espasmos musculares', 'Rigidez', 'Dor muscular'],
      contraindications: ['Sedação excessiva'],
      monitoring: ['Função motora', 'Sedação', 'Qualidade do sono'],
      lastUsed: '2024-01-05',
      usageCount: 12
    },
    {
      id: '4',
      name: 'Suporte Nutricional Renal',
      category: 'nefrologia',
      description: 'Protocolo nutricional para pacientes com doença renal crônica',
      dosage: 'Conforme prescrição',
      frequency: 'Diário',
      duration: 'Contínuo',
      indications: ['Desnutrição', 'Perda de peso', 'Fadiga'],
      contraindications: ['Hiperfosfatemia'],
      monitoring: ['Peso', 'Albuminemia', 'Fósforo'],
      lastUsed: '2024-01-12',
      usageCount: 25
    },
    {
      id: '5',
      name: 'Sintomáticos Gerais',
      category: 'sintomatico',
      description: 'Prescrição padrão para sintomas leves',
      dosage: 'Conforme bula',
      frequency: '6/6 horas',
      duration: '5 dias',
      indications: ['Dor leve', 'Febre'],
      contraindications: ['Alergia a dipirona'],
      monitoring: [],
      lastUsed: '2024-01-14',
      usageCount: 42
    }
  ]

  // Templates definidos anteriormente...

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'cannabis', label: 'Cannabis' },
    { id: 'nefrologia', label: 'Nefrologia' },
    { id: 'sintomatico', label: 'Sintomático' },
    { id: 'suporte', label: 'Suporte' }
  ]

  const filteredTemplates = prescriptionTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const loadTemplateIntoForm = (templateId: string) => {
    if (!templateId) {
      // Se selecionar "vazio", limpa o formulário para permitir preenchimento manual
      setPrescriptionForm({
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: ''
      })
      return
    }

    const template = prescriptionTemplates.find(t => t.id === templateId)
    if (template) {
      setPrescriptionForm({
        medication: template.name,
        dosage: template.dosage,
        frequency: template.frequency,
        duration: template.duration,
        notes: template.description
      })
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* [V1.9.134] Stats topo do médico — Total/Rascunhos/Assinadas/Enviadas */}
      {prescriptionStats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pt-4">
          <div className="rounded-xl p-4 border border-white/5 bg-white/[0.03]">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Total</div>
            <div className="text-2xl font-bold text-white tabular-nums">{prescriptionStats.total}</div>
          </div>
          <div className="rounded-xl p-4 border border-yellow-500/15 bg-yellow-500/[0.04]">
            <div className="text-xs text-yellow-400 uppercase tracking-wider">Rascunhos</div>
            <div className="text-2xl font-bold text-yellow-300 tabular-nums">{prescriptionStats.draft}</div>
          </div>
          <div className="rounded-xl p-4 border border-blue-500/15 bg-blue-500/[0.04]">
            <div className="text-xs text-blue-400 uppercase tracking-wider">Assinadas</div>
            <div className="text-2xl font-bold text-blue-300 tabular-nums">{prescriptionStats.signed}</div>
          </div>
          <div className="rounded-xl p-4 border border-emerald-500/15 bg-emerald-500/[0.04]">
            <div className="text-xs text-emerald-400 uppercase tracking-wider">Enviadas</div>
            <div className="text-2xl font-bold text-emerald-300 tabular-nums">{prescriptionStats.sent}</div>
          </div>
        </div>
      )}

      {/* [V1.9.134] Banner pendência ≥5 rascunhos */}
      {prescriptionStats.draft >= 5 && (
        <div className="mx-4 rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/[0.03] p-5 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-yellow-200 mb-1">
              Você tem {prescriptionStats.draft} prescrições em rascunho
            </h3>
            <p className="text-sm text-slate-300 mb-3">
              Para enviar ao paciente com validade legal CFM, é necessária <strong>assinatura digital ICP-Brasil</strong>.
              Sem ela, o documento fica como rascunho (válido apenas para impressão local com carimbo manual).
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/app/clinica/prescricoes')}
                className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30 border border-yellow-500/30 text-sm font-medium transition-colors"
              >
                Ver rascunhos
              </button>
              <button
                type="button"
                onClick={() => setShowCertHelpModal(true)}
                className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
              >
                Como obter certificado ICP-Brasil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 py-2 border-b border-slate-700/50 mb-2">
        <div className="flex items-center justify-center py-2">
          <div className="w-10 h-1 bg-slate-700/30 rounded-full mx-auto"></div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-3 w-full">
          {/* Categories Container */}
          <div className="flex items-center p-0.5 bg-slate-900/50 rounded-full border border-slate-700 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${selectedCategory === category.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="hidden md:block w-px h-6 bg-slate-700/50 mx-1"></div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-full transition-all shadow-lg shadow-emerald-500/10 hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Prescrição</span>
          </button>

          {/* [V1.9.133-B] Atalho pra gestão completa: stats, rascunhos pendentes, ICP-Brasil */}
          <button
            onClick={() => navigate('/app/clinica/prescricoes')}
            title="Ver todas as suas prescrições, rascunhos e gestão completa"
            className="flex items-center space-x-1.5 px-5 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 font-bold text-xs rounded-full border border-slate-700 hover:border-emerald-500/50 transition-all hover:scale-105 active:scale-95"
          >
            <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ver todas / Rascunhos</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar modelos de prescrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-white px-10 py-3 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-colors group cursor-pointer"
            onClick={() => {
              loadTemplateIntoForm(template.id);
              setIsModalOpen(true);
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${template.category === 'cannabis' ? 'bg-green-500/20 text-green-400' :
                template.category === 'nefrologia' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                {template.category === 'cannabis' ? <Droplets className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
              </div>
              <span className="text-xs text-slate-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {template.lastUsed}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              {template.name}
            </h3>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">
              {template.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                <span className="text-white font-medium">{template.dosage}</span>
                <span className="mx-2">•</span>
                <span>{template.frequency}</span>
              </div>
              <div className="text-xs text-slate-500 flex items-center" title="Usado recentemente">
                <User className="w-3 h-3 mr-1" />
                {template.usageCount}x
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* [V1.9.135-B] Minhas Prescrições — lista cards reais do médico (analytics no terminal) */}
      {prescriptionStats.total > 0 && (
        <div className="px-4 pb-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-slate-700/50">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Minhas Prescrições
              {statusFilter !== 'todas' && (
                <span className="text-xs font-normal text-slate-400">
                  · filtro: {statusFilter === 'draft' ? 'Rascunhos' : statusFilter === 'signed' ? 'Assinadas' : 'Enviadas'}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/50 rounded-full border border-slate-700">
              {[
                { id: 'todas', label: 'Todas' },
                { id: 'draft', label: 'Rascunhos' },
                { id: 'signed', label: 'Assinadas' },
                { id: 'sent', label: 'Enviadas' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatusFilter(opt.id as any)}
                  className={`px-3 py-1 text-[11px] font-medium rounded-full transition-all ${
                    statusFilter === opt.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {filteredMyPrescriptions.length === 0 ? (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-slate-400">
                Nenhuma prescrição neste filtro.
                {statusFilter !== 'todas' && ' Limpe o filtro para ver todas.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMyPrescriptions.slice(0, 12).map((p) => {
                const statusColors: Record<string, string> = {
                  draft: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
                  signed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                  sent: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                  validated: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
                }
                const statusLabels: Record<string, string> = {
                  draft: 'Rascunho',
                  signed: 'Assinada',
                  sent: 'Enviada',
                  validated: 'Validada',
                  cancelled: 'Cancelada',
                }
                const meds = Array.isArray(p.medications) ? p.medications : []
                const firstMed = meds[0] || null
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-white/5 bg-white/[0.03] p-4 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {p.patient_name || 'Paciente sem nome'}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          {p.patient_cpf ? `CPF: ${p.patient_cpf}` : 'sem CPF'}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider ${statusColors[p.status] || statusColors.draft}`}>
                        {statusLabels[p.status] || p.status}
                      </span>
                    </div>

                    {firstMed && (
                      <div className="text-xs text-slate-400 mb-2">
                        <span className="text-slate-300 font-medium">{firstMed.name || '—'}</span>
                        {firstMed.dosage && <span className="ml-1">· {firstMed.dosage}</span>}
                        {firstMed.frequency && <span className="ml-1">· {firstMed.frequency}</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/5">
                      <span className="text-[11px] text-slate-500">
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      {p.iti_validation_code && (
                        <span className="text-[10px] text-blue-400 font-mono">ITI: {p.iti_validation_code}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {filteredMyPrescriptions.length > 12 && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/app/clinica/prescricoes')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Ver todas as {filteredMyPrescriptions.length} prescrições →
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE NOVA PRESCRIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-left">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] relative overflow-hidden">

            {/* SUCESSO ELEGANTE - OVERLAY */}
            {showSuccess && (
              <div className="absolute inset-0 z-50 bg-slate-800 flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Prescrição Salva!</h3>
                <p className="text-slate-400">Registrado com sucesso no prontuário.</p>
              </div>
            )}

            <div className="flex items-center justify-between p-6 border-b border-slate-700 shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                Nova Prescrição
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
                disabled={showSuccess}
              >
                <X className="w-5 h-5" />
                <span className="sr-only">Fechar</span>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {/* Seleção de Paciente */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Paciente</label>
                <div className="flex gap-2">
                  <select
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                  >
                    <option value="">Selecione um paciente</option>
                    {patientsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seleção de Modelo (Template) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Carregar Modelo (Opcional)</label>
                <select
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  onChange={(e) => loadTemplateIntoForm(e.target.value)}
                  defaultValue=""
                >
                  <option value="">Preencher Manualmente (Em Branco)</option>
                  {prescriptionTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-700 pt-4 mt-2">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-400" /> Detalhes da Medicação
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Medicamento / Princípio Ativo</label>
                    <input
                      type="text"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Ex: Canabidiol (CBD) Isolate"
                      value={prescriptionForm.medication}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Dosagem</label>
                      <input
                        type="text"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Ex: 50mg/ml"
                        value={prescriptionForm.dosage}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Frequência/Posologia</label>
                      <input
                        type="text"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Ex: 10 gotas de 12/12h"
                        value={prescriptionForm.frequency}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Duração do Tratamento</label>
                    <input
                      type="text"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Ex: 30 dias ou Uso Contínuo"
                      value={prescriptionForm.duration}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Instruções / Observações</label>
                    <textarea
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 min-h-[80px] resize-none"
                      placeholder="Instruções especiais de uso..."
                      value={prescriptionForm.notes}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-3 shrink-0 bg-slate-800/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors font-medium border border-transparent hover:border-slate-600"
                disabled={showSuccess}
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePrescription}
                disabled={saving || showSuccess}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-lg shadow-green-900/20 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar Prescrição</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [V1.9.134] Modal educacional ICP-Brasil */}
      {showCertHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowCertHelpModal(false)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Certificado ICP-Brasil</h3>
                  <p className="text-xs text-slate-400">Como obter para assinar prescrições com validade legal</p>
                </div>
              </div>
              <button onClick={() => setShowCertHelpModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h4 className="text-white font-semibold mb-1.5">Por que preciso?</h4>
                <p className="text-slate-400 leading-relaxed">
                  O CFM exige assinatura com certificado <strong className="text-white">ICP-Brasil</strong> para prescrições eletrônicas terem
                  validade jurídica e poderem ser entregues digitalmente ao paciente. Sem ele, o documento serve só como rascunho local.
                </p>
              </div>

              <div className="border-t border-white/5 pt-4">
                <h4 className="text-white font-semibold mb-2">2 tipos de certificado</h4>
                <div className="space-y-3">
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.05] p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">A1</span>
                      <span className="text-xs text-slate-400">arquivo digital (cloud)</span>
                    </div>
                    <p className="text-xs text-slate-300">Validade 1 ano · ~R$ 280-400 · Instalado no navegador, prático para uso diário</p>
                  </div>
                  <div className="rounded-lg border border-purple-500/20 bg-purple-500/[0.05] p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">A3</span>
                      <span className="text-xs text-slate-400">token físico ou cartão</span>
                    </div>
                    <p className="text-xs text-slate-300">Validade 3 anos · ~R$ 350-500 · Mais seguro, exige hardware (token USB)</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <h4 className="text-white font-semibold mb-2">Onde obter</h4>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  <li>• <a href="https://www.gov.br/iti/pt-br/assuntos/icp-brasil/lista-de-acs-credenciadas" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">ITI — Lista oficial de ACs credenciadas</a></li>
                  <li>• Serasa Experian, Certisign, AC Soluti, Valid, Safeweb</li>
                  <li>• Processo: agendar validação presencial (CPF + foto + comprovante) · entrega em 1-3 dias</li>
                </ul>
              </div>

              <div className="border-t border-white/5 pt-4 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/15 p-3">
                <h4 className="text-emerald-300 font-semibold mb-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Já tenho certificado
                </h4>
                <p className="text-xs text-slate-300">
                  Cadastre em <strong className="text-white">Certificados Digitais</strong> no menu. Quando válido,
                  o botão <strong className="text-white">"Assinar Digitalmente"</strong> ativa nas prescrições.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCertHelpModal(false)}
                className="px-5 py-2.5 rounded-lg bg-white/5 text-white hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuickPrescriptions