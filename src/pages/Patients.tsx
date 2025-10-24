import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [patientsPerPage] = useState(8)
  const [showPatientDetails, setShowPatientDetails] = useState<number | null>(null)

  const patients = [
    {
      id: 1,
      name: 'Maria Silva',
      age: 45,
      gender: 'Feminino',
      email: 'maria.silva@email.com',
      phone: '(11) 99999-9999',
      address: 'São Paulo, SP',
      lastVisit: '15/01/2024',
      nextVisit: '22/01/2024',
      diagnosis: 'Hipertensão',
      status: 'ativo',
      priority: 'medium',
      crm: '12345-SP',
      notes: 'Paciente estável, seguindo tratamento corretamente.',
      bloodType: 'O+',
      allergies: ['Penicilina'],
      medications: ['Losartana 50mg', 'Hidroclorotiazida 25mg']
    },
    {
      id: 2,
      name: 'João Santos',
      age: 52,
      gender: 'Masculino',
      email: 'joao.santos@email.com',
      phone: '(11) 88888-8888',
      address: 'São Paulo, SP',
      lastVisit: '10/01/2024',
      nextVisit: '20/01/2024',
      diagnosis: 'Diabetes Tipo 2',
      status: 'pendente',
      priority: 'high',
      crm: '12345-SP',
      notes: 'Aguardando resultados de exames laboratoriais.',
      bloodType: 'A+',
      allergies: ['Nenhuma'],
      medications: ['Metformina 850mg', 'Gliclazida 80mg']
    },
    {
      id: 3,
      name: 'Ana Costa',
      age: 38,
      gender: 'Feminino',
      email: 'ana.costa@email.com',
      phone: '(11) 77777-7777',
      address: 'São Paulo, SP',
      lastVisit: 'Hoje',
      nextVisit: '28/01/2024',
      diagnosis: 'Avaliação Inicial',
      status: 'nova',
      priority: 'low',
      crm: '12345-SP',
      notes: 'Primeira consulta, avaliação completa em andamento.',
      bloodType: 'B+',
      allergies: ['Nenhuma'],
      medications: ['Nenhuma']
    },
    {
      id: 4,
      name: 'Carlos Lima',
      age: 60,
      gender: 'Masculino',
      email: 'carlos.lima@email.com',
      phone: '(11) 66666-6666',
      address: 'São Paulo, SP',
      lastVisit: '12/01/2024',
      nextVisit: '25/01/2024',
      diagnosis: 'Câncer de Próstata',
      status: 'ativo',
      priority: 'high',
      crm: '12345-SP',
      notes: 'Em tratamento oncológico, acompanhamento especializado.',
      bloodType: 'AB+',
      allergies: ['Contraste iodado'],
      medications: ['Bicalutamida 50mg', 'Leuprorelina 3.75mg']
    },
    {
      id: 5,
      name: 'Fernanda Oliveira',
      age: 35,
      gender: 'Feminino',
      email: 'fernanda.oliveira@email.com',
      phone: '(11) 55555-5555',
      address: 'São Paulo, SP',
      lastVisit: '08/01/2024',
      nextVisit: '18/01/2024',
      diagnosis: 'Ansiedade',
      status: 'ativo',
      priority: 'medium',
      crm: '12345-SP',
      notes: 'Seguindo tratamento com CBD, boa resposta.',
      bloodType: 'O-',
      allergies: ['Nenhuma'],
      medications: ['CBD 20mg', 'Lorazepam 1mg']
    },
    {
      id: 6,
      name: 'Roberto Santos',
      age: 48,
      gender: 'Masculino',
      email: 'roberto.santos@email.com',
      phone: '(11) 44444-4444',
      address: 'São Paulo, SP',
      lastVisit: '05/01/2024',
      nextVisit: '15/01/2024',
      diagnosis: 'Dor Crônica',
      status: 'pendente',
      priority: 'high',
      crm: '12345-SP',
      notes: 'Aguardando ajuste de dosagem de THC.',
      bloodType: 'A-',
      allergies: ['Nenhuma'],
      medications: ['THC 5mg', 'CBD 10mg']
    },
    {
      id: 7,
      name: 'Lucia Ferreira',
      age: 42,
      gender: 'Feminino',
      email: 'lucia.ferreira@email.com',
      phone: '(11) 33333-3333',
      address: 'São Paulo, SP',
      lastVisit: '03/01/2024',
      nextVisit: '13/01/2024',
      diagnosis: 'Epilepsia',
      status: 'ativo',
      priority: 'high',
      crm: '12345-SP',
      notes: 'Controle de crises com CBD, evolução positiva.',
      bloodType: 'B-',
      allergies: ['Nenhuma'],
      medications: ['CBD 25mg', 'Levetiracetam 500mg']
    },
    {
      id: 8,
      name: 'Paulo Costa',
      age: 55,
      gender: 'Masculino',
      email: 'paulo.costa@email.com',
      phone: '(11) 22222-2222',
      address: 'São Paulo, SP',
      lastVisit: '01/01/2024',
      nextVisit: '11/01/2024',
      diagnosis: 'Parkinson',
      status: 'ativo',
      priority: 'high',
      crm: '12345-SP',
      notes: 'Melhora dos tremores com THC, acompanhamento neurológico.',
      bloodType: 'AB-',
      allergies: ['Nenhuma'],
      medications: ['THC 2.5mg', 'Levodopa 100mg']
    },
    {
      id: 9,
      name: 'Sandra Alves',
      age: 29,
      gender: 'Feminino',
      email: 'sandra.alves@email.com',
      phone: '(11) 11111-1111',
      address: 'São Paulo, SP',
      lastVisit: 'Hoje',
      nextVisit: '09/01/2024',
      diagnosis: 'Avaliação Inicial',
      status: 'nova',
      priority: 'low',
      crm: '12345-SP',
      notes: 'Primeira consulta, interesse em cannabis medicinal.',
      bloodType: 'O+',
      allergies: ['Nenhuma'],
      medications: ['Nenhuma']
    }
  ]

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
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400'
      case 'low': return 'bg-green-500/20 text-green-400'
      default: return 'bg-slate-500/20 text-slate-400'
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
          <h1 className="text-3xl font-bold text-white mb-2">👥 Meus Pacientes</h1>
          <p className="text-slate-300">Gerencie seus pacientes e acompanhe o tratamento</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus className="w-5 h-5" />
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou diagnóstico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total de Pacientes</p>
              <p className="text-2xl font-bold text-white">{patients.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pacientes Ativos</p>
              <p className="text-2xl font-bold text-white">{patients.filter(p => p.status === 'ativo').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pendentes</p>
              <p className="text-2xl font-bold text-white">{patients.filter(p => p.status === 'pendente').length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Novos</p>
              <p className="text-2xl font-bold text-white">{patients.filter(p => p.status === 'nova').length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Lista de Pacientes */}
      <div className="bg-slate-800/80 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Paciente</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Contato</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Diagnóstico</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Última Consulta</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Ações</th>
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
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">{patient.name}</p>
                        <p className="text-slate-400 text-sm">{patient.age} anos • {patient.gender}</p>
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
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm">{patient.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm">{patient.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm">{patient.address}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{patient.diagnosis}</p>
                      <p className="text-slate-400 text-sm">CRM: {patient.crm}</p>
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
                      <p className="text-white">{patient.lastVisit}</p>
                      <p className="text-slate-400 text-sm">Próxima: {patient.nextVisit}</p>
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
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="text-slate-300">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredPatients.length)} de {filteredPatients.length} pacientes
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">📊 Resumo por Diagnóstico</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Hipertensão</span>
              <span className="text-blue-400 font-bold">1 paciente</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Diabetes Tipo 2</span>
              <span className="text-green-400 font-bold">1 paciente</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Câncer de Próstata</span>
              <span className="text-red-400 font-bold">1 paciente</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Avaliação Inicial</span>
              <span className="text-yellow-400 font-bold">1 paciente</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">⚠️ Alertas Importantes</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-white font-medium">João Santos - Exames Pendentes</p>
                <p className="text-slate-400 text-sm">Aguardando resultados há 5 dias</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-white font-medium">Ana Costa - Primeira Consulta</p>
                <p className="text-slate-400 text-sm">Avaliação completa em andamento</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Patients
