import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

const Patients: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [patientsPerPage] = useState(8)
  const [showPatientDetails, setShowPatientDetails] = useState<number | null>(null)

  React.useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clinical_assessments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const formattedPatients = data.map(p => {
          const patientData = (p.data as any) || {}
          return {
            id: p.id,
            name: patientData.patient_name || 'Paciente s/ nome',
            age: patientData.patient_age || 0,
            gender: patientData.patient_gender || 'Outro',
            email: patientData.patient_email || 'paciente@medcann.lab',
            phone: patientData.patient_phone || '(00) 00000-0000',
            address: 'Brasil',
            diagnosis: p.clinical_report ? p.clinical_report.substring(0, 50) + '...' : 'Em avaliação',
            status: p.status || 'pendente',
            priority: patientData.priority || 'medium',
            lastVisit: new Date(p.created_at || '').toLocaleDateString(),
            nextVisit: 'A definir',
            crm: 'IMRE-AEC'
          }
        })
        setPatients(formattedPatients)
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus

    return matchesSearch && matchesFilter
  })

  // Paginação
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage)
  const startIndex = (currentPage - 1) * patientsPerPage
  const endIndex = startIndex + patientsPerPage
  const currentPatients = filteredPatients.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleChatWithPatient = (patientId: number) => {
    // Navegar para o chat exclusivo com o paciente
    navigate(`/patient-chat/${patientId}`)
  }

  const handleGenerateReport = (patientId: number) => {
    // Gerar relatório do paciente
    console.log('Gerando relatório para paciente:', patientId)
    // Navegar para página de relatórios com filtro do paciente
    navigate(`/reports?patient=${patientId}`)
  }

  const handleScheduleAppointment = (patientId: number) => {
    // Agendar consulta para o paciente
    console.log('Agendando consulta para paciente:', patientId)
    // Navegar para perfil do paciente na aba de agendamentos
    navigate(`/patient/${patientId}?tab=appointments`)
  }

  const handleEditPatient = (patientId: number) => {
    // Editar dados do paciente
    console.log('Editando paciente:', patientId)
    // Navegar para perfil do paciente na aba de perfil com modo de edição
    navigate(`/patient/${patientId}?tab=profile&edit=true`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-500/20 text-green-400'
      case 'pendente': return 'bg-yellow-500/20 text-yellow-400'
      case 'nova': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-slate-500/20 text-brand-text-muted'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400'
      case 'low': return 'bg-green-500/20 text-green-400'
      default: return 'bg-slate-500/20 text-brand-text-muted'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo': return <CheckCircle className="w-4 h-4" />
      case 'pendente': return <Clock className="w-4 h-4" />
      case 'nova': return <AlertCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-text mb-2">👥 Meus Pacientes</h1>
          <p className="text-brand-text-secondary">Gerencie seus pacientes e acompanhe o tratamento</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => navigate('/app/new-patient')}
            className="bg-blue-600 hover:bg-blue-700 text-brand-text px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-slate-800/80 rounded-lg p-6 border border-brand-border">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-text-muted w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou diagnóstico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-brand-surface-subtle border border-slate-600 rounded-lg text-brand-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-brand-text-muted" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-brand-surface-subtle border border-slate-600 rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="pendente">Pendente</option>
              <option value="nova">Nova</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/80 rounded-lg p-6 border border-brand-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-text-muted text-sm">Total de Pacientes</p>
              <p className="text-2xl font-bold text-brand-text">{patients.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-6 border border-brand-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-text-muted text-sm">Pacientes Ativos</p>
              <p className="text-2xl font-bold text-brand-text">{patients.filter(p => p.status === 'ativo').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-6 border border-brand-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-text-muted text-sm">Pendentes</p>
              <p className="text-2xl font-bold text-brand-text">{patients.filter(p => p.status === 'pendente').length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-6 border border-brand-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-text-muted text-sm">Novos</p>
              <p className="text-2xl font-bold text-brand-text">{patients.filter(p => p.status === 'nova').length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Lista de Pacientes */}
      <div className="bg-slate-800/80 rounded-lg border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-brand-text-secondary">Paciente</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-brand-text-secondary">Contato</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-brand-text-secondary">Diagnóstico</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-brand-text-secondary">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-brand-text-secondary">Última Consulta</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-brand-text-secondary">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {currentPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/patient/${patient.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#00c16a] to-[#00a85a] rounded-full flex items-center justify-center">
                        <span className="text-brand-text font-bold text-sm">
                          {patient.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-brand-text font-semibold">{patient.name}</p>
                        <p className="text-brand-text-muted text-sm">{patient.age} anos • {patient.gender}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(patient.priority)}`}>
                            {patient.priority === 'high' ? 'Alta' : patient.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-brand-text-muted" />
                        <span className="text-brand-text-secondary text-sm">{patient.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-brand-text-muted" />
                        <span className="text-brand-text-secondary text-sm">{patient.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-brand-text-muted" />
                        <span className="text-brand-text-secondary text-sm">{patient.address}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <p className="text-brand-text font-medium">{patient.diagnosis}</p>
                      <p className="text-brand-text-muted text-sm">CRM: {patient.crm}</p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(patient.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                        {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <p className="text-brand-text">{patient.lastVisit}</p>
                      <p className="text-brand-text-muted text-sm">Próxima: {patient.nextVisit}</p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleChatWithPatient(patient.id)
                        }}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                        title="Chat Exclusivo"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/patient/${patient.id}`)
                        }}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Ver Perfil Completo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditPatient(patient.id)
                        }}
                        className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerateReport(patient.id)
                        }}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                        title="Relatório"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleScheduleAppointment(patient.id)
                        }}
                        className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-colors"
                        title="Agendar"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="bg-slate-800/80 rounded-lg p-6 border border-brand-border">
          <div className="flex items-center justify-between">
            <div className="text-brand-text-secondary">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredPatients.length)} de {filteredPatients.length} pacientes
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-brand-text-muted hover:text-brand-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${currentPage === page
                      ? 'bg-blue-600 text-brand-text'
                      : 'text-brand-text-muted hover:text-brand-text hover:bg-slate-700/50'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-brand-text-muted hover:text-brand-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/80 rounded-lg p-6 border border-brand-border">
          <h3 className="text-lg font-bold text-brand-text mb-4">📊 Resumo por Diagnóstico</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-brand-text-secondary">Hipertensão</span>
              <span className="text-blue-400 font-bold">1 paciente</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brand-text-secondary">Diabetes Tipo 2</span>
              <span className="text-green-400 font-bold">1 paciente</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brand-text-secondary">Câncer de Próstata</span>
              <span className="text-red-400 font-bold">1 paciente</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brand-text-secondary">Avaliação Inicial</span>
              <span className="text-yellow-400 font-bold">1 paciente</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-6 border border-brand-border">
          <h3 className="text-lg font-bold text-brand-text mb-4">⚠️ Alertas Importantes</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-brand-text font-medium">João Santos - Exames Pendentes</p>
                <p className="text-brand-text-muted text-sm">Aguardando resultados há 5 dias</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-brand-text font-medium">Ana Costa - Primeira Consulta</p>
                <p className="text-brand-text-muted text-sm">Avaliação completa em andamento</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Patients
