import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Share2, 
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  Stethoscope,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Mail,
  Printer
} from 'lucide-react'

const Reports: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('all')

  const reports = [
    {
      id: 1,
      title: 'Relatório IMRE - Maria Silva',
      patientName: 'Maria Silva',
      patientId: 1,
      type: 'IMRE',
      date: '15/01/2024',
      status: 'concluido',
      size: '2.3 MB',
      pages: 8,
      doctor: 'Dr. Passos Mir',
      crm: '12345-SP',
      summary: 'Avaliação completa da paciente com hipertensão arterial sistêmica. Análise detalhada dos sintomas e recomendações terapêuticas.',
      keyFindings: ['Pressão arterial elevada', 'Boa adesão ao tratamento', 'Necessidade de ajuste medicamentoso'],
      recommendations: ['Continuar Losartana 50mg', 'Reduzir consumo de sal', 'Exercícios regulares'],
      nextSteps: ['Retorno em 30 dias', 'Monitoramento da PA', 'Exames laboratoriais'],
      attachments: ['Exames laboratoriais', 'Prescrição médica', 'Orientações nutricionais']
    },
    {
      id: 2,
      title: 'Relatório AEC - João Santos',
      patientName: 'João Santos',
      patientId: 2,
      type: 'AEC',
      date: '14/01/2024',
      status: 'em_andamento',
      size: '1.8 MB',
      pages: 6,
      doctor: 'Dr. Passos Mir',
      crm: '12345-SP',
      summary: 'Avaliação inicial do paciente com suspeita de diabetes mellitus tipo 2. Análise dos sintomas e solicitação de exames complementares.',
      keyFindings: ['Glicemia elevada', 'Poliúria e polidipsia', 'Perda de peso inexplicada'],
      recommendations: ['Exames laboratoriais urgentes', 'Consulta com endocrinologista', 'Dieta controlada'],
      nextSteps: ['Aguardar resultados', 'Retorno em 7 dias', 'Início do tratamento'],
      attachments: ['Solicitação de exames', 'Encaminhamento endocrinologia']
    },
    {
      id: 3,
      title: 'Relatório de Retorno - Ana Costa',
      patientName: 'Ana Costa',
      patientId: 3,
      type: 'Retorno',
      date: '13/01/2024',
      status: 'concluido',
      size: '1.5 MB',
      pages: 4,
      doctor: 'Dr. Passos Mir',
      crm: '12345-SP',
      summary: 'Consulta de retorno da paciente com transtorno de ansiedade. Avaliação da evolução e ajuste do tratamento.',
      keyFindings: ['Melhora significativa da ansiedade', 'Boa resposta ao tratamento', 'Sono normalizado'],
      recommendations: ['Continuar terapia atual', 'Técnicas de relaxamento', 'Acompanhamento psicológico'],
      nextSteps: ['Retorno em 60 dias', 'Manutenção do tratamento', 'Monitoramento contínuo'],
      attachments: ['Prescrição atualizada', 'Orientações terapêuticas']
    },
    {
      id: 4,
      title: 'Relatório IMRE - Carlos Lima',
      patientName: 'Carlos Lima',
      patientId: 4,
      type: 'IMRE',
      date: '12/01/2024',
      status: 'pendente',
      size: '3.2 MB',
      pages: 12,
      doctor: 'Dr. Passos Mir',
      crm: '12345-SP',
      summary: 'Avaliação completa do paciente oncológico. Análise multidisciplinar e plano de cuidados integrado.',
      keyFindings: ['Câncer de próstata em tratamento', 'Boa resposta à quimioterapia', 'Suporte psicológico necessário'],
      recommendations: ['Continuar tratamento oncológico', 'Suporte nutricional', 'Acompanhamento psicológico'],
      nextSteps: ['Retorno oncológico', 'Exames de controle', 'Suporte familiar'],
      attachments: ['Prontuário oncológico', 'Exames de imagem', 'Prescrições especializadas']
    }
  ]

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || report.type === filterType
    const matchesPeriod = filterPeriod === 'all' || true // Implementar filtro de período se necessário
    
    return matchesSearch && matchesType && matchesPeriod
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-500/20 text-green-400'
      case 'em_andamento': return 'bg-yellow-500/20 text-yellow-400'
      case 'pendente': return 'bg-blue-500/20 text-blue-400'
      case 'cancelado': return 'bg-red-500/20 text-red-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido': return <CheckCircle className="w-4 h-4" />
      case 'em_andamento': return <Clock className="w-4 h-4" />
      case 'pendente': return <AlertCircle className="w-4 h-4" />
      case 'cancelado': return <AlertCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IMRE': return <Stethoscope className="w-5 h-5 text-blue-400" />
      case 'AEC': return <FileText className="w-5 h-5 text-red-400" />
      case 'Retorno': return <Users className="w-5 h-5 text-green-400" />
      default: return <FileText className="w-5 h-5 text-slate-400" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">📈 Relatórios</h1>
          <p className="text-slate-300">Visualize e gerencie os relatórios dos seus pacientes</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus className="w-5 h-5" />
            <span>Gerar Relatório</span>
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por paciente, tipo ou título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro de Tipo */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Tipos</option>
              <option value="IMRE">IMRE</option>
              <option value="AEC">AEC</option>
              <option value="Retorno">Retorno</option>
            </select>
          </div>

          {/* Filtro de Período */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="year">Este Ano</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total de Relatórios</p>
              <p className="text-2xl font-bold text-white">{reports.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Concluídos</p>
              <p className="text-2xl font-bold text-white">{reports.filter(r => r.status === 'concluido').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Em Andamento</p>
              <p className="text-2xl font-bold text-white">{reports.filter(r => r.status === 'em_andamento').length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Páginas Totais</p>
              <p className="text-2xl font-bold text-white">{reports.reduce((acc, r) => acc + r.pages, 0)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Lista de Relatórios */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div key={report.id} className="bg-slate-800/80 rounded-lg p-6 border border-slate-700 hover:bg-slate-800/90 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              {/* Informações Principais */}
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(report.type)}
                    <span className="text-lg font-bold text-white">{report.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(report.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ').charAt(0).toUpperCase() + report.status.replace('_', ' ').slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-sm">Paciente</p>
                    <p className="text-white font-medium">{report.patientName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Data</p>
                    <p className="text-white font-medium">{report.date}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Tamanho</p>
                    <p className="text-white font-medium">{report.size}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Páginas</p>
                    <p className="text-white font-medium">{report.pages}</p>
                  </div>
                </div>

                {/* Resumo */}
                <div className="mb-4">
                  <p className="text-slate-400 text-sm mb-2">Resumo</p>
                  <p className="text-slate-300 text-sm">{report.summary}</p>
                </div>

                {/* Principais Achados */}
                <div className="mb-4">
                  <p className="text-slate-400 text-sm mb-2">Principais Achados</p>
                  <div className="flex flex-wrap gap-2">
                    {report.keyFindings.map((finding, index) => (
                      <span key={index} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
                        {finding}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recomendações */}
                <div className="mb-4">
                  <p className="text-slate-400 text-sm mb-2">Recomendações</p>
                  <div className="flex flex-wrap gap-2">
                    {report.recommendations.map((recommendation, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        {recommendation}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Próximos Passos */}
                <div className="mb-4">
                  <p className="text-slate-400 text-sm mb-2">Próximos Passos</p>
                  <div className="flex flex-wrap gap-2">
                    {report.nextSteps.map((step, index) => (
                      <span key={index} className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        {step}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Anexos */}
                <div>
                  <p className="text-slate-400 text-sm mb-2">Anexos</p>
                  <div className="flex flex-wrap gap-2">
                    {report.attachments.map((attachment, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        {attachment}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col space-y-2 lg:ml-6 mt-4 lg:mt-0">
                <div className="flex space-x-2">
                  <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors" title="Visualizar">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-colors" title="Compartilhar">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <button className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 rounded-lg transition-colors" title="Imprimir">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors" title="Enviar por Email">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo por Tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">📊 Relatórios por Tipo</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">IMRE</span>
              <span className="text-blue-400 font-bold">2 relatórios</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">AEC</span>
              <span className="text-red-400 font-bold">1 relatório</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Retorno</span>
              <span className="text-green-400 font-bold">1 relatório</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">📈 Estatísticas</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Taxa de Conclusão</span>
              <span className="text-green-400 font-bold">75%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Páginas Médias</span>
              <span className="text-blue-400 font-bold">7.5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Tamanho Médio</span>
              <span className="text-purple-400 font-bold">2.2 MB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
