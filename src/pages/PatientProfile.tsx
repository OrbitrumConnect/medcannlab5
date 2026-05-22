import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  User,
  Clock,
  FileText,
  BarChart3,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  Heart,
  Activity,
  Plus,
  Video,
  Stethoscope,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface PatientData {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  blood_type: string | null
  allergies: string | null
  medications: string | null
  gender: string | null
  birth_date: string | null
  avatar_url: string | null
  crm: string | null
  status: string | null
  created_at: string | null
}

interface AppointmentData {
  id: string
  title: string
  appointment_date: string
  appointment_time: string | null
  appointment_type: string | null
  specialty: string | null
  location: string | null
  status: string | null
  notes: string | null
  is_remote: boolean | null
}

interface ClinicalReportData {
  id: string
  report_type: string
  protocol: string
  status: string
  generated_at: string
  content: any
}

const PatientProfile: React.FC = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'charts' | 'appointments' | 'chat' | 'files'>('profile')
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [appointments, setAppointments] = useState<AppointmentData[]>([])
  const [reports, setReports] = useState<ClinicalReportData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    type: 'presencial',
    specialty: '',
    service: '',
    room: '',
    notes: ''
  })

  // Calcular idade
  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  // Carregar dados reais do paciente
  useEffect(() => {
    if (!patientId) return
    loadPatientData()
  }, [patientId])

  const loadPatientData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Buscar dados do paciente
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, phone, address, blood_type, allergies, medications, gender, birth_date, avatar_url, crm, status, created_at')
        .eq('id', patientId)
        .maybeSingle()

      if (userError) throw userError
      if (!userData) {
        setError('Paciente não encontrado')
        setIsLoading(false)
        return
      }

      setPatient(userData)

      // Buscar agendamentos do paciente
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('id, title, appointment_date, appointment_time, appointment_type, specialty, location, status, notes, is_remote')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })
        .limit(20)

      if (appointmentsData) setAppointments(appointmentsData)

      // Buscar relatórios clínicos
      const { data: reportsData } = await supabase
        .from('clinical_reports')
        .select('id, report_type, protocol, status, generated_at, content')
        .eq('patient_id', patientId)
        .order('generated_at', { ascending: false })
        .limit(10)

      if (reportsData) setReports(reportsData)

    } catch (err: any) {
      console.error('Erro ao carregar dados do paciente:', err)
      setError('Erro ao carregar dados do paciente')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAppointment = async () => {
    if (!patientId || !user?.id) return
    try {
      const { error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        professional_id: user.id,
        title: appointmentData.service || 'Consulta',
        appointment_date: appointmentData.date,
        appointment_time: appointmentData.time,
        appointment_type: appointmentData.specialty,
        specialty: appointmentData.specialty,
        location: appointmentData.room,
        is_remote: appointmentData.type === 'online',
        notes: appointmentData.notes,
        status: 'agendado'
      })
      if (error) throw error
      setShowAppointmentModal(false)
      setAppointmentData({ date: '', time: '', type: 'presencial', specialty: '', service: '', room: '', notes: '' })
      loadPatientData() // Recarregar dados
    } catch (err: any) {
      console.error('Erro ao agendar:', err)
      alert('Erro ao salvar agendamento: ' + (err.message || 'Erro desconhecido'))
    }
  }

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: <User className="w-4 h-4" /> },
    { id: 'charts', name: 'Evolução', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'appointments', name: 'Agendamentos', icon: <Clock className="w-4 h-4" /> },
    { id: 'chat', name: 'Chat', icon: <Clock className="w-4 h-4" /> },
    { id: 'files', name: 'Relatórios', icon: <FileText className="w-4 h-4" /> }
  ]

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Carregando dados do paciente...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">{error || 'Paciente não encontrado'}</p>
          <button onClick={() => navigate(-1)} className="text-purple-400 hover:text-purple-300 flex items-center mx-auto gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </div>
    )
  }

  const age = calculateAge(patient.birth_date)
  const allergiesList = patient.allergies ? patient.allergies.split(',').map(a => a.trim()) : []
  const medicationsList = patient.medications ? patient.medications.split(',').map(m => m.trim()) : []

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Informações Básicas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <Mail className="w-4 h-4 text-slate-400 mr-3" />
              <span className="text-slate-300">{patient.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-slate-400 mr-3" />
              <span className="text-slate-300">{patient.phone || 'Não informado'}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-slate-400 mr-3" />
              <span className="text-slate-300">{patient.address || 'Não informado'}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center">
              <Heart className="w-4 h-4 text-slate-400 mr-3" />
              <span className="text-slate-300">Tipo Sanguíneo: {patient.blood_type || 'Não informado'}</span>
            </div>
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-slate-400 mr-3" />
              <span className="text-slate-300">Alergias: {allergiesList.length > 0 ? allergiesList.join(', ') : 'Nenhuma registrada'}</span>
            </div>
            <div className="flex items-center">
              <Stethoscope className="w-4 h-4 text-slate-400 mr-3" />
              <span className="text-slate-300">Medicamentos: {medicationsList.length > 0 ? medicationsList.join(', ') : 'Nenhum registrado'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Stethoscope className="w-5 h-5 mr-2" />
          Status do Paciente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-sm text-slate-400 mb-2">Status</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              patient.status === 'active' || patient.status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {patient.status || 'Sem status'}
            </span>
          </div>
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-sm text-slate-400 mb-2">Total de Consultas</h4>
            <p className="text-white font-medium text-2xl">{appointments.length}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-sm text-slate-400 mb-2">Relatórios Clínicos</h4>
            <p className="text-white font-medium text-2xl">{reports.length}</p>
          </div>
        </div>
      </div>

      {/* Última atividade */}
      {appointments.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Últimas Consultas
          </h3>
          <div className="space-y-4">
            {appointments.slice(0, 5).map((appt) => (
              <div key={appt.id} className="bg-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-2">
                      <Clock className="w-4 h-4 text-slate-400 mr-2" />
                      <span className="text-slate-300 text-sm">
                        {new Date(appt.appointment_date).toLocaleDateString('pt-BR')}
                        {appt.appointment_time && ` às ${appt.appointment_time}`}
                      </span>
                      {appt.specialty && (
                        <>
                          <span className="mx-2 text-slate-500">•</span>
                          <span className="text-slate-300 text-sm">{appt.specialty}</span>
                        </>
                      )}
                    </div>
                    <p className="text-white mb-1">{appt.title}</p>
                    {appt.notes && <p className="text-slate-400 text-sm">{appt.notes}</p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    appt.status === 'concluido' || appt.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    appt.status === 'agendado' || appt.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                    appt.status === 'cancelado' || appt.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {appt.status || 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderChartsTab = () => (
    <div className="space-y-6">
      {reports.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-white mb-2">Sem Relatórios Clínicos</h4>
          <p className="text-slate-400">Nenhum relatório clínico foi gerado para este paciente ainda.</p>
        </div>
      ) : (
        reports.map((report) => (
          <div key={report.id} className="bg-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{report.report_type}</h3>
                <p className="text-slate-400 text-sm">Protocolo: {report.protocol}</p>
                <p className="text-slate-400 text-sm">
                  Gerado em: {new Date(report.generated_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                report.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {report.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderAppointmentsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Agendamentos de {patient.name}</h3>
        <button
          onClick={() => setShowAppointmentModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div key={appt.id} className="bg-slate-800 rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Clock className="w-4 h-4 text-slate-400 mr-2" />
                    <span className="text-white font-medium">
                      {new Date(appt.appointment_date).toLocaleDateString('pt-BR')}
                    </span>
                    {appt.appointment_time && (
                      <>
                        <span className="mx-2 text-slate-500">•</span>
                        <span className="text-slate-300">{appt.appointment_time}</span>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appt.specialty && (
                      <div>
                        <p className="text-slate-400 text-sm">Especialidade</p>
                        <p className="text-white">{appt.specialty}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-400 text-sm">Serviço</p>
                      <p className="text-white">{appt.title}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Tipo</p>
                      <div className="flex items-center">
                        {appt.is_remote ? (
                          <Video className="w-4 h-4 text-slate-400 mr-2" />
                        ) : (
                          <MapPin className="w-4 h-4 text-slate-400 mr-2" />
                        )}
                        <span className="text-white">{appt.is_remote ? 'Online' : 'Presencial'}</span>
                      </div>
                    </div>
                    {appt.location && (
                      <div>
                        <p className="text-slate-400 text-sm">Local</p>
                        <p className="text-white">{appt.location}</p>
                      </div>
                    )}
                  </div>
                  {appt.notes && (
                    <div className="mt-4">
                      <p className="text-slate-400 text-sm">Observações</p>
                      <p className="text-slate-300">{appt.notes}</p>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    appt.status === 'agendado' || appt.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                    appt.status === 'concluido' || appt.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {appt.status || 'Pendente'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderChatTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Chat com {patient.name}</h3>
      </div>
      
      <div className="bg-slate-800 rounded-xl p-8 text-center">
        <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h4 className="text-xl font-semibold text-white mb-2">Chat Exclusivo</h4>
        <p className="text-slate-400 mb-6">
          Acesse o chat exclusivo para conversar diretamente com {patient.name}
        </p>
        <button
          onClick={() => navigate(`/app/clinica/paciente/chat-profissional/${patientId}`)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center mx-auto transition-colors"
        >
          <Clock className="w-5 h-5 mr-2" />
          Abrir Chat Exclusivo
        </button>
      </div>
    </div>
  )

  const renderFilesTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Relatórios e Documentos</h3>

      {reports.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">Nenhum documento encontrado para este paciente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-slate-400 mr-3" />
                  <div>
                    <p className="text-white font-medium">{report.report_type}</p>
                    <p className="text-slate-400 text-sm">{report.protocol}</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-white">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-slate-400 mr-2" />
                  <span className="text-slate-300 text-sm">
                    {new Date(report.generated_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  report.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {report.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mr-4 overflow-hidden">
                  {patient.avatar_url ? (
                    <img src={patient.avatar_url} alt={patient.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{patient.name}</h1>
                  <p className="text-slate-400">
                    {age ? `${age} anos` : ''}
                    {age && patient.gender ? ' • ' : ''}
                    {patient.gender || ''}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(`/app/clinica/paciente/chat-profissional/${patientId}`)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Clock className="w-4 h-4 mr-2" />
                Chat Exclusivo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 transition-colors flex items-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'charts' && renderChartsTab()}
        {activeTab === 'appointments' && renderAppointmentsTab()}
        {activeTab === 'chat' && renderChatTab()}
        {activeTab === 'files' && renderFilesTab()}
      </div>

      {/* Modal de Agendamento */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Novo Agendamento</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Data</label>
                <input
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Horário</label>
                <input
                  type="time"
                  value={appointmentData.time}
                  onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo</label>
                <select
                  value={appointmentData.type}
                  onChange={(e) => setAppointmentData({...appointmentData, type: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Especialidade</label>
                <select
                  value={appointmentData.specialty}
                  onChange={(e) => setAppointmentData({...appointmentData, specialty: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Selecione</option>
                  <option value="cardiologia">Cardiologia</option>
                  <option value="endocrinologia">Endocrinologia</option>
                  <option value="neurologia">Neurologia</option>
                  <option value="psiquiatria">Psiquiatria</option>
                  <option value="cannabis-medicinal">Cannabis Medicinal</option>
                  <option value="nefrologia">Nefrologia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Serviço</label>
                <input
                  type="text"
                  value={appointmentData.service}
                  onChange={(e) => setAppointmentData({...appointmentData, service: e.target.value})}
                  placeholder="Ex: Consulta de retorno"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Local / Sala</label>
                <input
                  type="text"
                  value={appointmentData.room}
                  onChange={(e) => setAppointmentData({...appointmentData, room: e.target.value})}
                  placeholder="Ex: Sala 201"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Observações</label>
                <textarea
                  value={appointmentData.notes}
                  onChange={(e) => setAppointmentData({...appointmentData, notes: e.target.value})}
                  placeholder="Observações adicionais..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white h-20"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAppointment}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientProfile
