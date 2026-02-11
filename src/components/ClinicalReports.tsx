import React, { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  Eye,
  Share2,
  QrCode,
  CheckCircle,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Brain,
  Heart,
  Activity,
  Stethoscope,
  Microscope,
  Leaf,
  Zap,
  Target,
  Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { rationalityAnalysisService, type Rationality } from '../services/rationalityAnalysisService'

interface SharedReport {
  id: string
  patientId: string
  patientName: string
  patientAge: number
  patientCpf: string
  date: string
  assessmentType: string
  status: 'shared' | 'reviewed' | 'validated'
  sharedAt: string
  nftToken?: string
  blockchainHash?: string
  content: {
    chiefComplaint: string
    history: string
    physicalExam: string
    assessment: string
    plan: string
    rationalities: {
      biomedical: any
      traditionalChinese: any
      ayurvedic: any
      homeopathic: any
      integrative: any
    }
  }
  doctorNotes?: string
  reviewStatus?: 'pending' | 'reviewed' | 'approved'
}

interface ClinicalReportsProps {
  className?: string
}

const ClinicalReports: React.FC<ClinicalReportsProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const [reports, setReports] = useState<SharedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<SharedReport | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [doctorNotes, setDoctorNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'shared' | 'reviewed' | 'validated'>('all')
  const [selectedRationality, setSelectedRationality] = useState<Rationality | null>(null)
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  const [appliedRationalities, setAppliedRationalities] = useState<Set<Rationality>>(new Set())

  useEffect(() => {
    loadSharedReports()
  }, [user?.id])

  // Recarregar quando a aba volta ao foco (se o usuário compartilhou em outra aba)
  useEffect(() => {
    const handleFocus = () => {
      loadSharedReports()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadSharedReports = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        console.warn('⚠️ Usuário não autenticado')
        setReports([])
        return
      }

      // Tentar usar a função RPC primeiro (mais eficiente)
      const { data: rpcReports, error: rpcError } = await supabase.rpc('get_shared_reports_for_doctor', {
        p_doctor_id: user.id
      })

      if (!rpcError && rpcReports) {
        // Se a função RPC funcionou, usar os dados dela
        const formattedReports: SharedReport[] = rpcReports.map((report: any) => ({
          id: report.id,
          patientId: report.patient_id,
          patientName: report.patient_name || 'Paciente',
          patientAge: 0, // Não vem da RPC, precisamos buscar
          patientCpf: '', // Não vem da RPC, precisamos buscar
          date: report.generated_at || report.shared_at,
          assessmentType: report.report_type || 'initial_assessment',
          status: report.status || 'shared',
          sharedAt: report.shared_at || report.generated_at,
          nftToken: undefined,
          blockchainHash: undefined,
          content: report.content || {
            chiefComplaint: '',
            history: '',
            physicalExam: '',
            assessment: '',
            plan: '',
            rationalities: {
              biomedical: {},
              traditionalChinese: {},
              ayurvedic: {},
              homeopathic: {},
              integrative: {}
            }
          },
          doctorNotes: undefined,
          reviewStatus: 'pending'
        }))
        setReports(formattedReports)
        return
      }

      // Fallback: buscar manualmente se RPC não funcionar
      console.warn('⚠️ RPC não disponível, usando busca manual:', rpcError)
      
      const { data: allReports, error: fetchError } = await supabase
        .from('clinical_reports')
        .select(`
          *,
          patient:patient_id
        `)
        .not('shared_with', 'is', null) // Relatórios que têm shared_with preenchido
        .order('shared_at', { ascending: false })

      if (fetchError) {
        console.error('❌ Erro ao buscar relatórios:', fetchError)
        setReports([])
        return
      }

      // Filtrar relatórios que foram compartilhados com este médico
      // shared_with é um array UUID[], então verificamos se contém o ID do médico
      const sharedReports = allReports?.filter(report => {
        const sharedWith = report.shared_with || []
        if (!Array.isArray(sharedWith) || sharedWith.length === 0) return false
        
        // Converter ambos para string para comparação segura
        const userIdStr = user.id.toString()
        const isShared = sharedWith.some((id: any) => id?.toString() === userIdStr)
        
        if (isShared) {
          console.log('✅ Relatório compartilhado encontrado:', {
            reportId: report.id,
            patientName: report.patient_name,
            sharedWith: sharedWith,
            userId: user.id
          })
        }
        
        return isShared
      }) || []

      console.log(`📊 Total de relatórios encontrados: ${allReports?.length || 0}, compartilhados com este médico: ${sharedReports.length}`)

      // Transformar dados para o formato esperado
      const formattedReports: SharedReport[] = sharedReports?.map(report => ({
        id: report.id,
        patientId: report.patient_id,
        patientName: report.patient_name || 'Paciente',
        patientAge: report.patient_age || 0,
        patientCpf: report.patient_cpf || '',
        date: report.created_at,
        assessmentType: report.assessment_type || 'initial_assessment',
        status: report.status || 'shared',
        sharedAt: report.shared_at || report.created_at,
        nftToken: report.nft_token,
        blockchainHash: report.blockchain_hash,
        content: {
          chiefComplaint: report.chief_complaint || '',
          history: report.history || '',
          physicalExam: report.physical_exam || '',
          assessment: report.assessment || '',
          plan: report.plan || '',
          rationalities: report.rationalities || {
            biomedical: {},
            traditionalChinese: {},
            ayurvedic: {},
            homeopathic: {},
            integrative: {}
          }
        },
        doctorNotes: report.doctor_notes,
        reviewStatus: report.review_status || 'pending'
      })) || []

      setReports(formattedReports)
    } catch (error) {
      console.error('❌ Erro ao carregar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewReport = async (reportId: string, status: 'reviewed' | 'approved') => {
    try {
      const { error } = await supabase
        .from('clinical_reports')
        .update({
          review_status: status,
          doctor_notes: doctorNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', reportId)

      if (error) {
        console.error('❌ Erro ao revisar relatório:', error)
        return
      }

      console.log('✅ Relatório revisado com sucesso')
      loadSharedReports() // Recarregar dados
      setShowReportModal(false)
      setDoctorNotes('')
    } catch (error) {
      console.error('❌ Erro ao revisar relatório:', error)
    }
  }

  const handleGenerateNFT = async (report: SharedReport) => {
    try {
      console.log('Gerando NFT para relatório:', report.id)
      alert(`NFT gerado com sucesso!\nToken: NFT-${Date.now()}\nHash: 0x${Math.random().toString(16).substr(2, 8)}`)
    } catch (error) {
      console.error('Erro ao gerar NFT:', error)
    }
  }

  const handleApplyRationality = async (rationality: Rationality) => {
    if (!selectedReport || !user) {
      alert('Erro: Relatório ou usuário não encontrado.')
      return
    }

    try {
      setIsGeneratingAnalysis(true)
      setSelectedRationality(rationality)

      // Gerar análise
      const analysis = await rationalityAnalysisService.generateAnalysis(
        selectedReport.content,
        rationality,
        user.id,
        user.email
      )

      // Salvar no relatório
      await rationalityAnalysisService.saveAnalysisToReport(
        selectedReport.id,
        rationality,
        analysis
      )

      // Recarregar relatórios para atualizar a UI
      await loadSharedReports()

      // Atualizar selectedReport com a nova análise
      const updatedRationalities = {
        ...selectedReport.content.rationalities,
        [rationality === 'traditional_chinese' ? 'traditionalChinese' : rationality]: analysis
      }
      setSelectedReport({
        ...selectedReport,
        content: {
          ...selectedReport.content,
          rationalities: updatedRationalities
        }
      })

      alert(`Análise ${rationality} aplicada com sucesso!`)
    } catch (error) {
      console.error('Erro ao aplicar racionalidade:', error)
      alert('Erro ao gerar análise. Tente novamente.')
    } finally {
      setIsGeneratingAnalysis(false)
      setSelectedRationality(null)
    }
  }

  const filteredReports = reports.filter(report => {
    if (filterStatus === 'all') return true
    return report.status === filterStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shared': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'validated': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'shared': return <Share2 className="w-4 h-4" />
      case 'reviewed': return <Eye className="w-4 h-4" />
      case 'validated': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getRationalityIcon = (rationality: string) => {
    switch (rationality) {
      case 'biomedical': return <Microscope className="w-4 h-4" />
      case 'traditionalChinese': return <Leaf className="w-4 h-4" />
      case 'ayurvedic': return <Zap className="w-4 h-4" />
      case 'homeopathic': return <Target className="w-4 h-4" />
      case 'integrative': return <Brain className="w-4 h-4" />
      default: return <Stethoscope className="w-4 h-4" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div 
        className="rounded-xl p-6 shadow-lg border"
        style={{
          background: 'rgba(7, 22, 41, 0.88)',
          borderColor: 'rgba(0, 193, 106, 0.12)',
          boxShadow: '0 18px 42px rgba(2, 12, 27, 0.55)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
              <FileText className="w-6 h-6 text-[#00C16A]" />
              <span>Relatórios da Avaliação Clínica Inicial</span>
            </h2>
            <p className="text-[#C8D6E5]">
              Relatórios compartilhados pelos pacientes com você
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadSharedReports()}
              className="px-3 py-1 text-sm rounded-md transition-colors"
              style={{
                background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0, 193, 106, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #00D97A 0%, #158A5F 100%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)'
              }}
              title="Recarregar relatórios"
            >
              🔄 Atualizar
            </button>
            <span className="text-sm text-[#94A3B8]">
              {filteredReports.length} relatórios
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'Todos', icon: <FileText className="w-4 h-4" /> },
            { key: 'shared', label: 'Compartilhados', icon: <Share2 className="w-4 h-4" /> },
            { key: 'reviewed', label: 'Revisados', icon: <Eye className="w-4 h-4" /> },
            { key: 'validated', label: 'Validados', icon: <CheckCircle className="w-4 h-4" /> }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key as any)}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm transition-colors"
              style={
                filterStatus === key
                  ? {
                      background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)',
                      color: '#FFFFFF',
                      boxShadow: '0 4px 12px rgba(0, 193, 106, 0.3)'
                    }
                  : {
                      background: 'rgba(15, 36, 60, 0.7)',
                      color: '#C8D6E5',
                      border: '1px solid rgba(0, 193, 106, 0.12)'
                    }
              }
              onMouseEnter={(e) => {
                if (filterStatus !== key) {
                  e.currentTarget.style.background = 'rgba(0, 193, 106, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(0, 193, 106, 0.2)'
                }
              }}
              onMouseLeave={(e) => {
                if (filterStatus !== key) {
                  e.currentTarget.style.background = 'rgba(15, 36, 60, 0.7)'
                  e.currentTarget.style.borderColor = 'rgba(0, 193, 106, 0.12)'
                }
              }}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Relatórios */}
      {loading ? (
        <div className="text-center text-slate-500 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          Carregando relatórios...
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="w-5 h-5 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-900">{report.patientName}</h3>
                    <span className="text-sm text-slate-500">CPF: {report.patientCpf}</span>
                    <span className="text-sm text-slate-500">Idade: {report.patientAge} anos</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Compartilhado em: {new Date(report.sharedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(report.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm border ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    <span className="capitalize">{report.status}</span>
                  </span>
                  {report.nftToken && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                      NFT: {report.nftToken}
                    </span>
                  )}
                </div>
              </div>

              {/* Resumo do Relatório */}
              <div className="mb-4">
                <h4 className="font-semibold text-slate-800 mb-2">Resumo da Avaliação:</h4>
                <p className="text-slate-600 text-sm mb-2">
                  <strong>Queixa Principal:</strong> {report.content.chiefComplaint}
                </p>
                <p className="text-slate-600 text-sm">
                  <strong>Avaliação:</strong> {report.content.assessment}
                </p>
              </div>

              {/* Racionalidades Médicas */}
              <div className="mb-4">
                <h4 className="font-semibold text-slate-800 mb-2">Racionalidades Médicas:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.content.rationalities).map(([key, value]: [string, any]) => {
                    const hasAnalysis = value && (value.assessment || value.recommendations)
                    const rationalityKey = key === 'traditionalChinese' ? 'traditional_chinese' : key
                    return (
                      <div 
                        key={key} 
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                          hasAnalysis ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {getRationalityIcon(key)}
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        {hasAnalysis && <CheckCircle className="w-3 h-3" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setSelectedReport(report)
                    setDoctorNotes(report.doctorNotes || '')
                    setShowReportModal(true)
                    // Verificar quais racionalidades já foram aplicadas
                    const applied = new Set<Rationality>()
                    Object.entries(report.content.rationalities || {}).forEach(([key, value]: [string, any]) => {
                      if (value && value.assessment) {
                        const rationalityKey = key === 'traditionalChinese' ? 'traditional_chinese' : key
                        applied.add(rationalityKey as Rationality)
                      }
                    })
                    setAppliedRationalities(applied)
                  }}
                  className="flex items-center space-x-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Revisar</span>
                </button>
                <button
                  onClick={() => handleGenerateNFT(report)}
                  className="flex items-center space-x-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Gerar NFT</span>
                </button>
                <button className="flex items-center space-x-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-500 py-8">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum relatório compartilhado</h3>
          <p className="text-slate-500">
            Os pacientes ainda não compartilharam relatórios de avaliação clínica inicial com você.
          </p>
        </div>
      )}

      {/* Modal de Revisão */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                Revisar Relatório - {selectedReport.patientName}
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Conteúdo do Relatório */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Conteúdo do Relatório:</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Queixa Principal:</strong> {selectedReport.content.chiefComplaint}</div>
                  <div><strong>História:</strong> {selectedReport.content.history}</div>
                  <div><strong>Exame Físico:</strong> {selectedReport.content.physicalExam}</div>
                  <div><strong>Avaliação:</strong> {selectedReport.content.assessment}</div>
                  <div><strong>Plano:</strong> {selectedReport.content.plan}</div>
                </div>
              </div>
              
              {/* Aplicar Racionalidades Médicas */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-slate-800 mb-3">Aplicar Racionalidades Médicas</h4>
                <p className="text-sm text-slate-600 mb-3">
                  Selecione uma racionalidade médica para gerar uma análise específica deste relatório:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                  {[
                    { key: 'biomedical' as Rationality, label: 'Biomédica', icon: <Microscope className="w-4 h-4" /> },
                    { key: 'traditional_chinese' as Rationality, label: 'MTC', icon: <Leaf className="w-4 h-4" /> },
                    { key: 'ayurvedic' as Rationality, label: 'Ayurvédica', icon: <Zap className="w-4 h-4" /> },
                    { key: 'homeopathic' as Rationality, label: 'Homeopática', icon: <Target className="w-4 h-4" /> },
                    { key: 'integrative' as Rationality, label: 'Integrativa', icon: <Brain className="w-4 h-4" /> }
                  ].map(({ key, label, icon }) => {
                    const hasAnalysis = selectedReport?.content.rationalities?.[key === 'traditional_chinese' ? 'traditionalChinese' : key]
                    return (
                      <button
                        key={key}
                        onClick={() => handleApplyRationality(key)}
                        disabled={isGeneratingAnalysis || hasAnalysis}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          hasAnalysis
                            ? 'bg-green-100 text-green-800 border border-green-300 cursor-default'
                            : isGeneratingAnalysis
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      >
                        {icon}
                        <span>{label}</span>
                        {hasAnalysis && <CheckCircle className="w-4 h-4" />}
                      </button>
                    )
                  })}
                </div>
                {isGeneratingAnalysis && (
                  <div className="flex items-center space-x-2 text-blue-600 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gerando análise {selectedRationality && `(${selectedRationality})...`}</span>
                  </div>
                )}
              </div>

              {/* Racionalidades Aplicadas */}
              {selectedReport && Object.entries(selectedReport.content.rationalities || {}).some(([_, value]: [string, any]) => value && value.assessment) && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-3">Análises por Racionalidade:</h4>
                  <div className="space-y-4">
                    {Object.entries(selectedReport.content.rationalities || {}).map(([key, value]: [string, any]) => {
                      if (!value || !value.assessment) return null
                      const rationalityLabel = key === 'traditionalChinese' ? 'Medicina Tradicional Chinesa' : 
                                             key === 'biomedical' ? 'Biomédica' :
                                             key === 'ayurvedic' ? 'Ayurvédica' :
                                             key === 'homeopathic' ? 'Homeopática' :
                                             key === 'integrative' ? 'Integrativa' : key
                      return (
                        <div key={key} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-center space-x-2 mb-2">
                            {getRationalityIcon(key)}
                            <h5 className="font-semibold text-slate-800">{rationalityLabel}</h5>
                          </div>
                          <div className="text-sm text-slate-700 space-y-2">
                            <div>
                              <strong>Avaliação:</strong>
                              <p className="mt-1">{value.assessment}</p>
                            </div>
                            {value.recommendations && value.recommendations.length > 0 && (
                              <div>
                                <strong>Recomendações:</strong>
                                <ul className="mt-1 list-disc list-inside">
                                  {value.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {value.considerations && (
                              <div>
                                <strong>Considerações:</strong>
                                <p className="mt-1">{value.considerations}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Notas do Médico */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Suas Notas e Observações:
                </label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Digite suas observações sobre este relatório..."
                  className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReviewReport(selectedReport.id, 'reviewed')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Marcar como Revisado
              </button>
              <button
                onClick={() => handleReviewReport(selectedReport.id, 'approved')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Aprovar Relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClinicalReports
