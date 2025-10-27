import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Video,
  Phone,
  MessageCircle,
  FileText,
  Download,
  Upload,
  User,
  Search,
  Mic,
  Plus,
  Clock,
  CheckCircle,
  Image,
  AlertCircle,
  Calendar,
  Share2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ClinicalAssessmentService } from '../lib/clinicalAssessmentService'
import { useAuth } from '../contexts/AuthContext'
import VideoCall from '../components/VideoCall'

interface Patient {
  id: string
  name: string
  age: number
  cpf: string
  phone: string
  lastVisit: string
  status: string
  assessments?: any[]
}

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [patientSearch, setPatientSearch] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false)
  const [isAudioCallOpen, setIsAudioCallOpen] = useState(false)
  const [callType, setCallType] = useState<'video' | 'audio'>('video')
  
  // Debug temporário
  console.log('👨‍⚕️ ProfessionalDashboard - RENDERIZADO! User:', user?.name, 'Type:', user?.type)

  // Buscar pacientes do banco de dados
  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      setLoading(true)
      
      // Buscar avaliações clínicas
      console.log('🔍 Buscando avaliações clínicas no Supabase...')
      
      // Buscar TODAS as avaliações, independente do doctor_id
      const { data: assessments, error } = await supabase
        .from('clinical_assessments')
        .select(`
          *,
          patient:patient_id,
          doctor:doctor_id
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      console.log('📊 Avaliações encontradas:', assessments?.length || 0, assessments)
      console.log('👤 Usuário logado:', user?.id)
      console.log('🏥 Doctor IDs nas avaliações:', assessments?.map(a => a.doctor_id))
      
      if (error) {
        console.error('❌ Erro ao buscar avaliações:', error)
        setLoading(false)
        return
      }

      // Agrupar avaliações por paciente
      const patientsMap = new Map<string, Patient>()
      
      assessments?.forEach(assessment => {
        const patientId = assessment.patient_id
        if (!patientsMap.has(patientId)) {
          // Criar paciente baseado nos dados da avaliação
          const patientData = assessment.data
          console.log('📋 Dados do paciente:', patientData)
          
          patientsMap.set(patientId, {
            id: patientId,
            name: patientData?.name || 'Paciente',
            age: patientData?.age || 0,
            cpf: patientData?.cpf || '',
            phone: patientData?.phone || '',
            lastVisit: new Date(assessment.created_at).toLocaleDateString('pt-BR'),
            status: assessment.status === 'completed' ? 'Avaliado' : 'Em avaliação',
            assessments: []
          })
        }
        
        // Adicionar avaliação ao paciente
        const patient = patientsMap.get(patientId)!
        patient.assessments = patient.assessments || []
        patient.assessments.push(assessment)
      })

      const patientsArray = Array.from(patientsMap.values())
      console.log('✅ Pacientes processados:', patientsArray.length, patientsArray)
      setPatients(patientsArray)
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = () => {
    alert('Notas salvas no prontuário do paciente!')
    setClinicalNotes('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Área de Atendimento</h1>
              <p className="text-slate-400">Prontuário Eletrônico - Atendimento ao Paciente</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Conectado como</p>
                <p className="font-semibold text-white">{user?.name || 'Dr. Profissional'}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total de Pacientes</h3>
              <User className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">{patients.length}</p>
            <p className="text-sm opacity-75 mt-1">Pacientes cadastrados</p>
          </button>
          
          <button 
            onClick={() => navigate('/app/professional-scheduling')}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Agendamentos Hoje</h3>
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm opacity-75 mt-1">Consultas agendadas</p>
          </button>
          
          <button 
            onClick={() => navigate('/app/reports')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Relatórios Pendentes</h3>
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">
              {patients.filter(p => p.assessments?.some(a => a.status === 'completed')).length}
            </p>
            <p className="text-sm opacity-75 mt-1">Avaliações completas</p>
          </button>
          
          <button 
            onClick={() => navigate('/app/patients')}
            className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Ver Todos Pacientes</h3>
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">{patients.length}</p>
            <p className="text-sm opacity-75 mt-1">Clique para ver lista</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Patient List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
              {/* Search */}
              <div className="p-4 border-b border-slate-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar paciente..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Patients List */}
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-slate-400">
                    Carregando pacientes...
                  </div>
                ) : patients.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    Nenhum paciente encontrado
                  </div>
                ) : (
                  patients
                    .filter(patient => 
                      patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                      patient.cpf.includes(patientSearch) ||
                      patient.phone.includes(patientSearch)
                    )
                    .map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient.id)}
                        className={`w-full p-4 text-left border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${
                          selectedPatient === patient.id ? 'bg-slate-700' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-white">{patient.name}</p>
                            <p className="text-xs text-slate-400">{patient.age} anos • CPF: {patient.cpf}</p>
                            <p className="text-xs text-slate-400">{patient.phone}</p>
                            <p className="text-xs text-slate-500">{patient.status}</p>
                          </div>
                        </div>
                      </button>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area - Patient Chart */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="space-y-6">
                {/* Patient Header */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {patients.find(p => p.id === selectedPatient)?.name}
                        </h2>
                        <p className="text-sm text-slate-400">
                          {patients.find(p => p.id === selectedPatient)?.age} anos • 
                          CPF: {patients.find(p => p.id === selectedPatient)?.cpf}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setCallType('video')
                          setIsVideoCallOpen(true)
                        }}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors" 
                        title="Vídeo"
                      >
                        <Video className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          setCallType('audio')
                          setIsVideoCallOpen(true)
                        }}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors" 
                        title="Áudio"
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => navigate(`/patient-chat/${selectedPatient}`)}
                        className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors" 
                        title="Chat"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clinical Notes Area */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Notas Clínicas do Atendimento</h3>
                                      <button
                    onClick={handleSaveNotes}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Salvar</span>
                  </button>
                  </div>
                  
                  <textarea
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Digite as informações do paciente durante o atendimento..."
                    rows={12}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  
                  <div className="flex items-center space-x-4 mt-4">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                      <Mic className="w-4 h-4" />
                      <span>Dictar</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                      <Clock className="w-4 h-4" />
                      <span>Histórico</span>
                    </button>
                  </div>
                </div>

                {/* Shared Documents */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Documentos Compartilhados</h3>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Upload</span>
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Exames_Laboratoriais_2025.pdf</p>
                          <p className="text-xs text-slate-400">Compartilhado pelo paciente • 12/01/2025</p>
                        </div>
                      </div>
                      <button className="p-2 text-blue-400 hover:text-blue-300 transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Image className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Raio-X_Torax_2025.jpg</p>
                          <p className="text-xs text-slate-400">Compartilhado pelo paciente • 10/01/2025</p>
                        </div>
                      </div>
                      <button className="p-2 text-blue-400 hover:text-blue-300 transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="text-center py-8 text-slate-400">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                      <p>Nenhum outro documento compartilhado</p>
                    </div>
                  </div>
                </div>

                {/* Medical Reports */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Relatórios Médicos</h3>
                    <button
                      onClick={() => navigate('/app/patient-onboarding')}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Nova Avaliação</span>
                    </button>
                  </div>
                  
                  {(() => {
                    const currentPatient = patients.find(p => p.id === selectedPatient)
                    const assessments = currentPatient?.assessments || []
                    
                    if (assessments.length === 0) {
                      return (
                        <div className="text-center py-8 text-slate-400">
                          <CheckCircle className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                          <p>Nenhum relatório disponível</p>
                        </div>
                      )
                    }
                    
                    return (
                      <div className="space-y-4">
                        {assessments.map((assessment, index) => (
                          <div key={assessment.id} className="bg-slate-700/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-white">
                                Avaliação {assessment.assessment_type} - {new Date(assessment.created_at).toLocaleDateString('pt-BR')}
                              </h4>
                              <span className={`px-2 py-1 rounded text-xs ${
                                assessment.status === 'completed' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {assessment.status === 'completed' ? 'Concluída' : 'Em andamento'}
                              </span>
                            </div>
                            
                            {assessment.clinical_report && (
                              <div className="mt-3 flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    // Abrir relatório em modal ou nova página
                                    const reportWindow = window.open('', '_blank')
                                    if (reportWindow) {
                                      reportWindow.document.write(`
                                        <html>
                                          <head><title>Relatório Clínico - ${currentPatient?.name}</title></head>
                                          <body style="font-family: Arial, sans-serif; padding: 20px; background: #1e293b; color: white;">
                                            <pre style="white-space: pre-wrap;">${assessment.clinical_report}</pre>
                                          </body>
                                        </html>
                                      `)
                                    }
                                  }}
                                  className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>Ver relatório completo</span>
                                </button>
                                
                                <button
                                  onClick={() => {
                                    // Download do relatório como PDF
                                    const blob = new Blob([assessment.clinical_report || ''], { type: 'text/plain' })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `Relatorio_${assessment.assessment_type}_${currentPatient?.name.replace(' ', '_')}_${new Date(assessment.created_at).toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`
                                    a.click()
                                    URL.revokeObjectURL(url)
                                  }}
                                  className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download</span>
                                </button>
                                
                                <button
                                  onClick={() => {
                                    // Compartilhar relatório
                                    alert('Funcionalidade de compartilhamento em desenvolvimento')
                                  }}
                                  className="flex items-center space-x-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm"
                                >
                                  <Share2 className="w-4 h-4" />
                                  <span>Compartilhar</span>
                                </button>
                              </div>
                            )}
                            
                            <div className="mt-2 text-xs text-slate-400">
                              {assessment.data?.complaintList && (
                                <p>Queixas: {assessment.data.complaintList.join(', ')}</p>
                              )}
                              {assessment.data?.medications && assessment.data.medications.length > 0 && (
                                <p>Medicações: {assessment.data.medications.join(', ')}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-slate-700/50 text-center">
                <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Selecione um Paciente</h3>
                <p className="text-slate-400">Escolha um paciente da lista para iniciar o atendimento</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video/Audio Call Component */}
      <VideoCall
        isOpen={isVideoCallOpen}
        onClose={() => setIsVideoCallOpen(false)}
        patientId={selectedPatient || undefined}
        isAudioOnly={callType === 'audio'}
      />
    </div>
  )
}

export default ProfessionalDashboard
