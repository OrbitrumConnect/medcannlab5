import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Eye,
  Edit,
  Trash2,
  Plus,
  TrendingUp,
  Activity,
  Database,
  FileText,
  Brain,
  Search,
  CheckCircle,
  Heart,
  AlertTriangle,
  Shield,
  Target,
  Zap,
  Clock,
  TrendingDown,
  Award,
  Pin,
  Flag
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { imreMigration } from '../lib/imreMigration'
import { noaIntegration } from '../lib/noaIntegration'
import { unifiedAssessment } from '../lib/unifiedAssessment'
// import { useDashboardData } from '../hooks/useDashboardData'
// import { useFinancialData } from '../hooks/useFinancialData'

const AdminDashboard: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [libraryDocuments, setLibraryDocuments] = useState<any[]>([])
  
  // Hooks para dados reais (comentados temporariamente)
  // const { stats: dashboardStats, userRanking, achievements, loading: dashboardLoading } = useDashboardData()
  // const { stats: financialStats, revenueHistory, paymentMethods, recentTransactions, loading: financialLoading } = useFinancialData()
  
  // Estados para Unificação 3.0→5.0
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'completed' | 'error'>('idle')
  const [migrationProgress, setMigrationProgress] = useState<number>(0)
  const [migrationResults, setMigrationResults] = useState<any>(null)
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredDocs, setFilteredDocs] = useState<any[]>([])
  const [courseEditorMode, setCourseEditorMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingCourse, setEditingCourse] = useState<any>(null)

  // Carregar documentos da biblioteca
  useEffect(() => {
    loadLibraryDocuments()
  }, [])

  // =====================================================
  // FUNÇÕES DE UNIFICAÇÃO 3.0→5.0
  // =====================================================

  const handleIMREMigration = async () => {
    try {
      setMigrationStatus('migrating')
      setMigrationProgress(0)
      
      console.log('🔄 Iniciando migração IMRE...')
      const results = await imreMigration.migrateIndexedDBToSupabase()
      
      setMigrationResults(results)
      setMigrationStatus('completed')
      setMigrationProgress(100)
      
      console.log('✅ Migração IMRE concluída:', results)
    } catch (error) {
      console.error('❌ Erro na migração IMRE:', error)
      setMigrationStatus('error')
    }
  }

  const handleNOAIntegration = async () => {
    try {
      console.log('🤖 Inicializando integração NOA...')
      const success = await noaIntegration.initializeNOA('current-user', 'current-session')
      
      if (success) {
        console.log('✅ NOA integrado com sucesso')
      } else {
        console.error('❌ Erro na integração NOA')
      }
    } catch (error) {
      console.error('❌ Erro na integração NOA:', error)
    }
  }

  const handleUnifiedAssessment = async () => {
    try {
      console.log('🔄 Inicializando avaliação unificada...')
      const assessment = await unifiedAssessment.initializeUnifiedAssessment('current-user', 'current-patient')
      
      console.log('✅ Avaliação unificada inicializada:', assessment)
    } catch (error) {
      console.error('❌ Erro na avaliação unificada:', error)
    }
  }

  const validateMigration = async () => {
    try {
      console.log('🔍 Validando migração...')
      const validation = await imreMigration.validateMigration()
      
      console.log('✅ Validação concluída:', validation)
      return validation
    } catch (error) {
      console.error('❌ Erro na validação:', error)
      return null
    }
  }

  // Ler parâmetro da URL para definir tab ativa
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Filtrar documentos baseado na busca
  useEffect(() => {
    if (searchTerm) {
      const filtered = libraryDocuments.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.keywords?.some((keyword: string) => 
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      setFilteredDocs(filtered)
    } else {
      setFilteredDocs(libraryDocuments)
    }
  }, [searchTerm, libraryDocuments])

  const loadLibraryDocuments = async () => {
    try {
      // Carregar documentos
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (docsError) {
        console.error('Erro ao carregar documentos:', docsError)
        return
      }

      setLibraryDocuments(docsData || [])
      setFilteredDocs(docsData || [])

      // Usar dados mockados temporariamente até as tabelas estarem prontas
      setRecentUsers([])

      // Usar dados mockados para estatísticas
      const totalUsers = 0

      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact' })

      const { count: totalDocuments } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })

      // Carregar cursos
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (coursesError) {
        console.error('Erro ao carregar cursos:', coursesError)
      } else {
        setCourses(coursesData || [])
      }

      // Atualizar estatísticas
      setStats([
        { label: 'Usuários Totais', value: totalUsers?.toString() || '0', icon: <Users className="w-5 h-5" />, color: 'text-primary-400' },
        { label: 'Usuários Ativos', value: recentUsers?.length?.toString() || '0', icon: <Activity className="w-5 h-5" />, color: 'text-green-400' },
        { label: 'Cursos Disponíveis', value: totalCourses?.toString() || '0', icon: <BookOpen className="w-5 h-5" />, color: 'text-purple-400' },
        { label: 'Documentos', value: totalDocuments?.toString() || '0', icon: <Activity className="w-5 h-5" />, color: 'text-orange-400' }
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', name: 'Usuários', icon: <Users className="w-4 h-4" /> },
    { id: 'courses', name: 'Cursos', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'financial', name: 'Financeiro', icon: <Database className="w-4 h-4" /> },
    { id: 'chat', name: 'Chat Global', icon: <Users className="w-4 h-4" /> },
    { id: 'forum', name: 'Moderação Fórum', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'gamification', name: 'Ranking & Gamificação', icon: <Award className="w-4 h-4" /> },
    { id: 'upload', name: 'Upload', icon: <FileText className="w-4 h-4" /> },
    { id: 'analytics', name: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'renal', name: 'Função Renal', icon: <Heart className="w-4 h-4" /> },
    { id: 'unification', name: 'Unificação 3.0→5.0', icon: <Brain className="w-4 h-4" /> },
    { id: 'settings', name: 'Sistema', icon: <Settings className="w-4 h-4" /> }
  ]

  const [stats, setStats] = useState([
    { label: 'Usuários Totais', value: '0', icon: <Users className="w-5 h-5" />, color: 'text-primary-400' },
    { label: 'Usuários Ativos', value: '0', icon: <Activity className="w-5 h-5" />, color: 'text-green-400' },
    { label: 'Cursos Disponíveis', value: '0', icon: <BookOpen className="w-5 h-5" />, color: 'text-purple-400' },
    { label: 'Avaliações Hoje', value: '0', icon: <Activity className="w-5 h-5" />, color: 'text-orange-400' }
  ])

  const [recentUsers, setRecentUsers] = useState<any[]>([])

  const [courses, setCourses] = useState<any[]>([])

  // Dados para Função Renal
  const renalStats = [
    { label: 'Pacientes Monitorados', value: '2,847', icon: <Heart className="w-5 h-5" />, color: 'text-primary-400' },
    { label: 'Alto Risco DRC', value: '156', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-400' },
    { label: 'Função Renal Estável', value: '2,691', icon: <Shield className="w-5 h-5" />, color: 'text-green-400' },
    { label: 'Alertas Hoje', value: '23', icon: <Zap className="w-5 h-5" />, color: 'text-orange-400' }
  ]

  const renalRiskData = [
    { age: '18-30', risk: 'Baixo', patients: 1247, percentage: 43.8 },
    { age: '31-45', risk: 'Médio', patients: 892, percentage: 31.3 },
    { age: '46-60', risk: 'Alto', patients: 456, percentage: 16.0 },
    { age: '60+', risk: 'Crítico', patients: 252, percentage: 8.9 }
  ]

  const renalAlerts = [
    { id: 1, patient: 'Maria Silva', age: 45, creatinine: 1.8, tfg: 45, risk: 'Alto', lastCheck: '2 horas atrás', status: 'urgent' },
    { id: 2, patient: 'João Santos', age: 52, creatinine: 1.5, tfg: 58, risk: 'Médio', lastCheck: '4 horas atrás', status: 'warning' },
    { id: 3, patient: 'Ana Costa', age: 38, creatinine: 1.2, tfg: 72, risk: 'Baixo', lastCheck: '6 horas atrás', status: 'stable' },
    { id: 4, patient: 'Carlos Lima', age: 60, creatinine: 2.1, tfg: 38, risk: 'Crítico', lastCheck: '1 hora atrás', status: 'critical' }
  ]

  const renalTrends = [
    { month: 'Jan', tfg: 65, creatinine: 1.2, patients: 2847 },
    { month: 'Fev', tfg: 64, creatinine: 1.3, patients: 2891 },
    { month: 'Mar', tfg: 63, creatinine: 1.4, patients: 2934 },
    { month: 'Abr', tfg: 62, creatinine: 1.5, patients: 2978 },
    { month: 'Mai', tfg: 61, creatinine: 1.6, patients: 3021 },
    { month: 'Jun', tfg: 60, creatinine: 1.7, patients: 3065 }
  ]

  // Dados do Fórum
  const [forumStats, setForumStats] = useState([
    { label: 'Debates Ativos', value: '0', icon: <BookOpen className="w-5 h-5" />, color: 'text-primary-400' },
    { label: 'Posts Hoje', value: '0', icon: <FileText className="w-5 h-5" />, color: 'text-green-400' },
    { label: 'Usuários Participando', value: '0', icon: <Users className="w-5 h-5" />, color: 'text-purple-400' },
    { label: 'Reportes Pendentes', value: '0', icon: <Flag className="w-5 h-5" />, color: 'text-red-400' }
  ])

  const [forumDebates, setForumDebates] = useState([])

  // Dados de Gamificação e Ranking (será populado com dados reais do Supabase)
  const gamificationStats = [
    { 
      label: 'Pontos Totais Distribuídos', 
      value: '0', 
      icon: <Award className="w-5 h-5" />, 
      color: 'text-yellow-400' 
    },
    { 
      label: 'Usuários Ativos', 
      value: '0', 
      icon: <Users className="w-5 h-5" />, 
      color: 'text-primary-400' 
    },
    { 
      label: 'Conquistas Desbloqueadas', 
      value: '0', 
      icon: <Target className="w-5 h-5" />, 
      color: 'text-green-400' 
    },
    { 
      label: 'Níveis Completados', 
      value: '0', 
      icon: <TrendingUp className="w-5 h-5" />, 
      color: 'text-purple-400' 
    }
  ]

  // Ranking de usuários (será populado com dados reais do Supabase)
  const userRankings = [
    {
      id: 1,
      name: 'Carregando...',
      type: 'professional',
      specialty: '',
      crm: '',
      points: 0,
      level: 0,
      achievements: 0,
      rank: 1,
      avatar: '...',
      badges: [],
      activity: 'Ativo',
      lastActivity: 'Carregando...'
    }
  ]

  // Conquistas (será populado com dados reais do Supabase)
  const achievementsData = [
    { id: 1, name: 'Carregando...', description: 'Dados serão carregados do Supabase', icon: '⏳', points: 0, unlocked: 0 }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getStatusClasses = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
      inactive: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
    }
    return statusColors[status as keyof typeof statusColors] || statusColors.active
  }

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          🏥 MedCannLab 3.0 - Dashboard Administrativo
        </h1>
        <p className="text-slate-300 text-lg">
          Plataforma completa de cannabis medicinal com IA, gestão de pacientes e educação médica
        </p>
      </div>

      {/* Stats Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {gamificationStats.map((stat, index) => (
          <div key={index} className="bg-slate-800/80 rounded-lg p-6 text-center border border-slate-700">
            <div className={`${stat.color} mb-2`}>
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-slate-300">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Métricas Avançadas do Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6">⚡ Performance do Sistema</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Uptime do Servidor</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-slate-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '99.9%'}}></div>
                </div>
                <span className="text-green-400 font-bold">99.9%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Tempo de Resposta</span>
              <span className="text-primary-400 font-bold">120ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">CPU Usage</span>
              <span className="text-purple-400 font-bold">45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Memória RAM</span>
              <span className="text-orange-400 font-bold">2.1GB / 8GB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Armazenamento</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-slate-700 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
                <span className="text-yellow-400 font-bold">75%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6">🤖 IA & Tecnologia</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Chat NOA Ativo</span>
              <span className="text-green-400 font-bold">✅ Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Consultas IA Hoje</span>
              <span className="text-primary-400 font-bold">1,247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Precisão NOA</span>
              <span className="text-purple-400 font-bold">94.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Modelos Ativos</span>
              <span className="text-orange-400 font-bold">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Processamento RAG</span>
              <span className="text-green-400 font-bold">2.3s</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6">🏥 Atividade Médica</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Avaliações Hoje</span>
              <span className="text-green-400 font-bold">156</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Casos Ativos</span>
              <span className="text-primary-400 font-bold">892</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Chats Médicos</span>
              <span className="text-purple-400 font-bold">47</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Relatórios Gerados</span>
              <span className="text-orange-400 font-bold">89</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Tempo Médio Consulta</span>
              <span className="text-yellow-400 font-bold">12min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Analytics */}
        <div className="bg-slate-800/80 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-6">📊 Analytics em Tempo Real</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Usuários Online</span>
              <span className="text-green-400 font-bold">247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Avaliações Hoje</span>
              <span className="text-primary-400 font-bold">156</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Chats Ativos</span>
              <span className="text-purple-400 font-bold">89</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Sistema</span>
              <span className="text-green-400 font-bold">✅ Saudável</span>
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div className="bg-slate-800/80 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-6">💰 Financeiro</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Receita Mensal</span>
              <span className="text-green-400 font-bold">R$ 45.230</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Assinaturas Ativas</span>
              <span className="text-primary-400 font-bold">892</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Taxa de Conversão</span>
              <span className="text-purple-400 font-bold">23.4%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Churn Rate</span>
              <span className="text-orange-400 font-bold">2.1%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Global Admin */}
      <div className="bg-slate-800/80 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-6">💬 Chat Global - Monitoramento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary-400 mb-2">89</div>
            <div className="text-slate-300">Chats Ativos</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">1,247</div>
            <div className="text-slate-300">Mensagens Hoje</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-2">23</div>
            <div className="text-slate-300">Moderadores Online</div>
          </div>
        </div>
      </div>

      {/* Upload de Documentos */}
      <div className="bg-slate-800/80 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-6">📁 Upload de Documentos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-3">📚</div>
            <div className="text-white font-medium mb-2">Ebooks</div>
            <div className="text-slate-400 text-sm">Upload de PDFs</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-3">🎥</div>
            <div className="text-white font-medium mb-2">Vídeo Aulas</div>
            <div className="text-slate-400 text-sm">YouTube/Upload</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-3">📄</div>
            <div className="text-white font-medium mb-2">Documentos</div>
            <div className="text-slate-400 text-sm">PDFs, Docs</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-3">🎓</div>
            <div className="text-white font-medium mb-2">Cursos</div>
            <div className="text-slate-400 text-sm">Materiais Completos</div>
          </div>
        </div>
      </div>

      {/* Status dos Serviços */}
      <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-6">🔧 Status dos Serviços</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <div className="text-white font-medium">Supabase Database</div>
              <div className="text-slate-400 text-sm">Operacional</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <div className="text-white font-medium">IA NOA Engine</div>
              <div className="text-slate-400 text-sm">Processando</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <div className="text-white font-medium">Chat Global</div>
              <div className="text-slate-400 text-sm">247 usuários online</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <div className="text-white font-medium">Backup Automático</div>
              <div className="text-slate-400 text-sm">Próximo: 02:00</div>
            </div>
          </div>
        </div>
      </div>

      {/* Atividade Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6">📈 Atividade Recente</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">👤</span>
              </div>
              <div className="flex-1">
                <div className="text-white text-sm">Dr. João Silva fez login</div>
                <div className="text-slate-400 text-xs">2 minutos atrás</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="flex-1">
                <div className="text-white text-sm">NOA respondeu 47 consultas</div>
                <div className="text-slate-400 text-xs">5 minutos atrás</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
              <div className="flex-1">
                <div className="text-white text-sm">Nova avaliação clínica concluída</div>
                <div className="text-slate-400 text-xs">8 minutos atrás</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">💬</span>
              </div>
              <div className="flex-1">
                <div className="text-white text-sm">12 mensagens no Chat Global</div>
                <div className="text-slate-400 text-xs">10 minutos atrás</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6">🚨 Alertas & Notificações</h3>
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 font-medium text-sm">Sistema Operacional</span>
              </div>
              <div className="text-slate-300 text-xs">Todos os serviços funcionando normalmente</div>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-400 font-medium text-sm">Backup Pendente</span>
              </div>
              <div className="text-slate-300 text-xs">Backup automático agendado para 02:00</div>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-primary-400 font-medium text-sm">Atualização Disponível</span>
              </div>
              <div className="text-slate-300 text-xs">Nova versão 3.0.2 disponível</div>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-purple-400 font-medium text-sm">Relatório Mensal</span>
              </div>
              <div className="text-slate-300 text-xs">Relatório de performance disponível</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas Expandidas */}
      <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-6">⚡ Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/app/admin/users"
            className="bg-slate-700/50 hover:bg-slate-600/50 rounded-lg p-4 text-center transition-colors duration-200 border border-slate-600"
          >
            <div className="text-3xl mb-3">👥</div>
            <div className="text-white font-medium mb-1">Gerenciar Usuários</div>
            <div className="text-slate-400 text-sm">1,247 usuários ativos</div>
          </Link>
          <Link
            to="/app/admin/courses"
            className="bg-slate-700/50 hover:bg-slate-600/50 rounded-lg p-4 text-center transition-colors duration-200 border border-slate-600"
          >
            <div className="text-3xl mb-3">🎓</div>
            <div className="text-white font-medium mb-1">Gerenciar Cursos</div>
            <div className="text-slate-400 text-sm">28 cursos disponíveis</div>
          </Link>
          <Link
            to="/app/admin/analytics"
            className="bg-slate-700/50 hover:bg-slate-600/50 rounded-lg p-4 text-center transition-colors duration-200 border border-slate-600"
          >
            <div className="text-3xl mb-3">📊</div>
            <div className="text-white font-medium mb-1">Analytics</div>
            <div className="text-slate-400 text-sm">Métricas detalhadas</div>
          </Link>
          <Link
            to="/app/admin/upload"
            className="bg-slate-700/50 hover:bg-slate-600/50 rounded-lg p-4 text-center transition-colors duration-200 border border-slate-600"
          >
            <div className="text-3xl mb-3">📁</div>
            <div className="text-white font-medium mb-1">Upload Documentos</div>
            <div className="text-slate-400 text-sm">156 documentos</div>
          </Link>
          <Link
            to="/app/chat"
            className="bg-slate-700/50 hover:bg-slate-600/50 rounded-lg p-4 text-center transition-colors duration-200 border border-slate-600"
          >
            <div className="text-3xl mb-3">💬</div>
            <div className="text-white font-medium mb-1">Chat Global</div>
            <div className="text-slate-400 text-sm">247 usuários online</div>
          </Link>
          <Link
            to="/app/forum"
            className="bg-slate-700/50 hover:bg-slate-600/50 rounded-lg p-4 text-center transition-colors duration-200 border border-slate-600"
          >
            <div className="text-3xl mb-3">🏛️</div>
            <div className="text-white font-medium mb-1">Moderar Fórum</div>
            <div className="text-slate-400 text-sm">47 debates ativos</div>
          </Link>
          <Link
            to="/app/gamificacao"
            className="bg-slate-700/50 hover:bg-slate-600/50 rounded-lg p-4 text-center transition-colors duration-200 border border-slate-600"
          >
            <div className="text-3xl mb-3">🏆</div>
            <div className="text-white font-medium mb-1">Ranking & Gamificação</div>
            <div className="text-slate-400 text-sm">45,230 pontos distribuídos</div>
          </Link>
          <Link
            to="/app/admin"
            className="bg-slate-700/50 hover:bg-slate-600/50 rounded-lg p-4 text-center transition-colors duration-200 border border-slate-600"
          >
            <div className="text-3xl mb-3">⚙️</div>
            <div className="text-white font-medium mb-1">Configurações</div>
            <div className="text-slate-400 text-sm">Sistema e segurança</div>
          </Link>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">👥 Gerenciar Usuários</h2>
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      <div className="bg-slate-800/80 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Último Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {recentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">{user.name}</div>
                      <div className="text-sm text-slate-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getColorClasses('blue')}`}>
                      {user.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusClasses(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-primary-400 hover:text-blue-300">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-400 hover:text-green-300">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderCourses = () => {
    if (courseEditorMode === 'list') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">🎓 Editor de Cursos</h2>
            <div className="flex space-x-3">
              <button 
                onClick={() => setCourseEditorMode('create')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Brain className="w-4 h-4" />
                <span>Criar da Biblioteca</span>
              </button>
              <button 
                onClick={() => setCourseEditorMode('create')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Curso</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-slate-800/80 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">{course.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    course.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                  }`}>
                    {course.status}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Estudantes:</span>
                    <span className="text-white">{course.students}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Criado:</span>
                    <span className="text-white">{course.created}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      setEditingCourse(course)
                      setCourseEditorMode('edit')
                    }}
                    className="flex-1 bg-primary-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm"
                  >
                    Editar
                  </button>
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm">
                    Ver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (courseEditorMode === 'create' || courseEditorMode === 'edit') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              {courseEditorMode === 'create' ? '🎓 Criar Novo Curso' : '✏️ Editar Curso'}
            </h2>
            <button 
              onClick={() => setCourseEditorMode('list')}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              ← Voltar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Seleção de Documentos */}
            <div className="space-y-6">
              <div className="bg-slate-800/80 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📚 Selecionar Documentos da Biblioteca</h3>
                
                {/* Busca */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar documentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Lista de Documentos */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedDocs.includes(doc.id)
                          ? 'bg-primary-600 border-blue-500'
                          : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                      }`}
                      onClick={() => {
                        if (selectedDocs.includes(doc.id)) {
                          setSelectedDocs(selectedDocs.filter(id => id !== doc.id))
                        } else {
                          setSelectedDocs([...selectedDocs, doc.id])
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-sm">{doc.title}</h4>
                          {doc.summary && (
                            <p className="text-slate-300 text-xs mt-1 line-clamp-2">{doc.summary}</p>
                          )}
                          {doc.keywords && doc.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doc.keywords.slice(0, 3).map((keyword: string, idx: number) => (
                                <span key={idx} className="bg-slate-600 text-slate-300 text-xs px-2 py-1 rounded">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="ml-2">
                          {selectedDocs.includes(doc.id) ? (
                            <CheckCircle className="w-5 h-5 text-primary-400" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-slate-400 rounded"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-slate-400 mt-4">
                  {selectedDocs.length} documento(s) selecionado(s)
                </div>
              </div>
            </div>

            {/* Configuração do Curso */}
            <div className="space-y-6">
              <div className="bg-slate-800/80 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">⚙️ Configuração do Curso</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Título do Curso
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Cannabis Medicinal Avançada"
                      defaultValue={editingCourse?.title || ''}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      placeholder="Descreva o conteúdo e objetivos do curso..."
                      rows={4}
                      defaultValue={editingCourse?.description || ''}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Categoria
                      </label>
                      <select 
                        defaultValue={editingCourse?.category || 'clinical'}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="clinical">Clínica</option>
                        <option value="cannabis">Cannabis Medicinal</option>
                        <option value="interview">Entrevista Clínica</option>
                        <option value="certification">Certificações</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Nível
                      </label>
                      <select 
                        defaultValue={editingCourse?.level || 'intermediate'}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="beginner">Iniciante</option>
                        <option value="intermediate">Intermediário</option>
                        <option value="advanced">Avançado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Duração (horas)
                      </label>
                      <input
                        type="number"
                        placeholder="8"
                        defaultValue={editingCourse?.duration || ''}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Preço (R$)
                      </label>
                      <input
                        type="number"
                        placeholder="299"
                        defaultValue={editingCourse?.price || ''}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Incluir Prova/Quiz?
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input type="radio" name="quiz" value="yes" className="mr-2" defaultChecked />
                        <span className="text-slate-300">Sim, gerar automaticamente</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="quiz" value="no" className="mr-2" />
                        <span className="text-slate-300">Não</span>
                      </label>
                    </div>
                  </div>

                  {/* Preview do Curso */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">📋 Preview do Curso</h4>
                    <div className="text-sm text-slate-300 space-y-1">
                      <div>📚 {selectedDocs.length} documentos selecionados</div>
                      <div>🎯 Conteúdo baseado na biblioteca</div>
                      <div>🧠 IA gerará aulas e provas automaticamente</div>
                      <div>📊 Análise cruzada de similaridades</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setCourseEditorMode('list')}
                  className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  disabled={selectedDocs.length === 0}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  {courseEditorMode === 'create' ? '🧠 Criar Curso com IA' : '💾 Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  const renderUnification = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          🧬 MedCannLab 3.0 → 5.0 Unificação
        </h1>
        <p className="text-slate-300 text-lg">
          Unindo a "alma" semântica do 3.0 com o "corpo" real do 5.0
        </p>
      </div>

      {/* Status da Migração */}
      <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-6">📊 Status da Unificação</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                migrationStatus === 'completed' ? 'bg-green-500' : 
                migrationStatus === 'migrating' ? 'bg-yellow-500 animate-pulse' : 
                migrationStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
              }`}></div>
              <span className="text-white font-medium">Migração IMRE</span>
            </div>
            <div className="text-slate-400 text-sm">
              {migrationStatus === 'completed' ? 'Concluída' : 
               migrationStatus === 'migrating' ? 'Em andamento...' : 
               migrationStatus === 'error' ? 'Erro' : 'Pendente'}
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-white font-medium">Integração NOA</span>
            </div>
            <div className="text-slate-400 text-sm">Conectado ao banco real</div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-white font-medium">Avaliação Unificada</span>
            </div>
            <div className="text-slate-400 text-sm">IMRE + Clínico integrados</div>
          </div>
        </div>

        {/* Barra de Progresso */}
        {migrationStatus === 'migrating' && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span>Progresso da Migração</span>
              <span>{migrationProgress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${migrationProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Resultados da Migração */}
      {migrationResults && (
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6">📈 Resultados da Migração</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {migrationResults.migratedAssessments || 0}
              </div>
              <div className="text-slate-300 text-sm">Avaliações Migradas</div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary-400 mb-1">
                {migrationResults.migratedBlocks || 0}
              </div>
              <div className="text-slate-300 text-sm">Blocos Semânticos</div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {migrationResults.migratedInteractions || 0}
              </div>
              <div className="text-slate-300 text-sm">Interações NOA</div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {migrationResults.errors?.length || 0}
              </div>
              <div className="text-slate-300 text-sm">Erros</div>
            </div>
          </div>
        </div>
      )}

      {/* Ações de Unificação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FASE 1: Preservar a Alma */}
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6">🧬 FASE 1: Preservar a Alma</h3>
          
          <div className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Sistema IMRE Triaxial</h4>
              <p className="text-slate-300 text-sm mb-3">
                Migrar dados semânticos do IndexedDB para Supabase preservando toda funcionalidade
              </p>
              <button
                onClick={handleIMREMigration}
                disabled={migrationStatus === 'migrating'}
                className="bg-primary-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {migrationStatus === 'migrating' ? 'Migrando...' : 'Migrar IMRE'}
              </button>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">NOA Multimodal</h4>
              <p className="text-slate-300 text-sm mb-3">
                Conectar avatar com escuta real ao banco de dados real
              </p>
              <button
                onClick={handleNOAIntegration}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Integrar NOA
              </button>
            </div>
          </div>
        </div>

        {/* FASE 2: Unificar Corpo e Alma */}
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6">🔄 FASE 2: Unificar Corpo e Alma</h3>
          
          <div className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Avaliação Unificada</h4>
              <p className="text-slate-300 text-sm mb-3">
                Integrar avaliação IMRE com monitoramento renal no mesmo prontuário
              </p>
              <button
                onClick={handleUnifiedAssessment}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Inicializar Avaliação
              </button>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Validação da Migração</h4>
              <p className="text-slate-300 text-sm mb-3">
                Verificar integridade dos dados migrados e correlações
              </p>
              <button
                onClick={validateMigration}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Validar Migração
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Arquitetura da Unificação */}
      <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-6">🏗️ Arquitetura da Unificação</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-white font-medium mb-4">MedCannLab 3.0 (A "Alma")</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">Sistema IMRE Triaxial (37 blocos)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">NOA Multimodal com escuta real</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">IndexedDB com persistência semântica</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">Avaliação clínica profunda</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">MedCannLab 5.0 (O "Corpo")</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">Supabase com estrutura real</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">Usuários reais e relacionamentos</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">Chat Global e fóruns</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-300 text-sm">Monitoramento renal e gamificação</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="text-2xl font-bold text-white mb-2">🧬 = 🏥</div>
          <p className="text-slate-300">
            Unindo a escuta semântica profunda com dados clínicos reais
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-slate-900">
      {/* Main Content */}
      <div className="p-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'courses' && renderCourses()}
          {activeTab === 'financial' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">💰 Dashboard Financeiro</h2>
                <p className="text-slate-300">Gerencie receitas, despesas e métricas financeiras</p>
              </div>

              {/* Métricas Financeiras */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">R$ 0</div>
                  <div className="text-slate-300">Receita Mensal</div>
                  <div className="text-green-400 text-sm">Dados do Supabase</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-primary-400 mb-2">R$ 0</div>
                  <div className="text-slate-300">Despesas Mensais</div>
                  <div className="text-primary-400 text-sm">Dados do Supabase</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">R$ 0</div>
                  <div className="text-slate-300">Lucro Líquido</div>
                  <div className="text-purple-400 text-sm">Dados do Supabase</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">0</div>
                  <div className="text-slate-300">Assinaturas Ativas</div>
                  <div className="text-orange-400 text-sm">Dados do Supabase</div>
                </div>
              </div>

              {/* Gráficos e Análises */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">📈 Receita por Período</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Janeiro 2024</span>
                      <span className="text-green-400 font-bold">R$ 45.230</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Dezembro 2023</span>
                      <span className="text-primary-400 font-bold">R$ 40.180</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Novembro 2023</span>
                      <span className="text-purple-400 font-bold">R$ 38.920</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Outubro 2023</span>
                      <span className="text-orange-400 font-bold">R$ 35.640</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">💳 Tipos de Pagamento</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Cartão de Crédito</span>
                      <span className="text-green-400 font-bold">65%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">PIX</span>
                      <span className="text-primary-400 font-bold">25%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Boleto</span>
                      <span className="text-purple-400 font-bold">8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Outros</span>
                      <span className="text-orange-400 font-bold">2%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela de Transações */}
              <div className="bg-slate-800/80 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-6">📋 Transações Recentes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-300">Data</th>
                        <th className="px-4 py-3 text-left text-slate-300">Cliente</th>
                        <th className="px-4 py-3 text-left text-slate-300">Valor</th>
                        <th className="px-4 py-3 text-left text-slate-300">Status</th>
                        <th className="px-4 py-3 text-left text-slate-300">Método</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      <tr>
                        <td className="px-4 py-3 text-slate-300">15/01/2024</td>
                        <td className="px-4 py-3 text-white">Dr. João Silva</td>
                        <td className="px-4 py-3 text-green-400">R$ 299,00</td>
                        <td className="px-4 py-3">
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                            Pago
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">Cartão</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-slate-300">14/01/2024</td>
                        <td className="px-4 py-3 text-white">Maria Santos</td>
                        <td className="px-4 py-3 text-green-400">R$ 199,00</td>
                        <td className="px-4 py-3">
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                            Pago
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">PIX</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-slate-300">13/01/2024</td>
                        <td className="px-4 py-3 text-white">Carlos Oliveira</td>
                        <td className="px-4 py-3 text-yellow-400">R$ 149,00</td>
                        <td className="px-4 py-3">
                          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
                            Pendente
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">Boleto</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'forum' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">🏛️ Moderação do Fórum</h2>
                <p className="text-slate-300">Gerencie debates, modere conteúdo e monitore atividade do fórum</p>
              </div>

              {/* Estatísticas do Fórum */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {forumStats.map((stat, index) => (
                  <div key={index} className="bg-slate-800/80 rounded-lg p-6 text-center">
                    <div className={`${stat.color} mb-2`}>
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-slate-300">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Debates que Precisam de Moderação */}
              <div className="bg-slate-800/80 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-6">🚨 Debates que Precisam de Atenção</h3>
                <div className="space-y-4">
                  {forumDebates.length > 0 ? forumDebates.map((debate: any) => (
                    <div key={debate.id} className={`p-4 rounded-lg border ${
                      debate.reports > 0 ? 'bg-red-500/10 border-red-500/20' :
                      debate.priority === 'high' ? 'bg-orange-500/10 border-orange-500/20' :
                      'bg-slate-700/50 border-slate-600'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-white font-semibold">{debate.title}</h4>
                            {debate.isPinned && <Pin className="w-4 h-4 text-yellow-400" />}
                            {debate.isHot && <TrendingUp className="w-4 h-4 text-red-400" />}
                            {debate.reports > 0 && (
                              <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">
                                {debate.reports} reportes
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              debate.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              debate.status === 'moderated' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {debate.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-400 mb-2">
                            <span>Por: {debate.author}</span>
                            <span>•</span>
                            <span>{debate.category}</span>
                            <span>•</span>
                            <span>{debate.participants} participantes</span>
                            <span>•</span>
                            <span>{debate.views} visualizações</span>
                            <span>•</span>
                            <span>{debate.lastActivity}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-4 h-4 text-green-400" />
                              <span className="text-green-400">{debate.votes.up}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingDown className="w-4 h-4 text-red-400" />
                              <span className="text-red-400">{debate.votes.down}</span>
                            </div>
                            <span className="text-slate-400">{debate.replies} respostas</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="bg-primary-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                            Ver Debate
                          </button>
                          <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm">
                            Moderar
                          </button>
                          <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                            Fechar
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <div className="text-slate-400 mb-2">📝</div>
                      <div className="text-slate-300">Nenhum debate encontrado</div>
                      <div className="text-slate-400 text-sm">Os debates aparecerão aqui quando houver atividade</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Analytics do Fórum */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">📊 Atividade por Categoria</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Cannabis Medicinal</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                        </div>
                        <span className="text-primary-400 font-bold">85%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Casos Clínicos</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '72%'}}></div>
                        </div>
                        <span className="text-green-400 font-bold">72%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Protocolos</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{width: '68%'}}></div>
                        </div>
                        <span className="text-purple-400 font-bold">68%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Farmacologia</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{width: '45%'}}></div>
                        </div>
                        <span className="text-orange-400 font-bold">45%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">📈 Tendências de Engajamento</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Posts por Dia</span>
                      <span className="text-green-400 font-bold">+23%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Usuários Ativos</span>
                      <span className="text-primary-400 font-bold">+15%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Tempo Médio de Resposta</span>
                      <span className="text-purple-400 font-bold">2.4h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Taxa de Resolução</span>
                      <span className="text-orange-400 font-bold">89%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'gamification' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">🏆 Sistema de Gamificação & Ranking</h2>
                <p className="text-slate-300">Monitore pontuações, conquistas e engajamento dos usuários</p>
              </div>

              {/* Estatísticas de Gamificação */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {gamificationStats.map((stat, index) => (
                  <div key={index} className="bg-slate-800/80 rounded-lg p-6 text-center">
                    <div className={`${stat.color} mb-2`}>
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-slate-300">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Ranking de Usuários */}
              <div className="bg-slate-800/80 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-6">🏅 Ranking de Usuários</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-300">Posição</th>
                        <th className="px-4 py-3 text-left text-slate-300">Usuário</th>
                        <th className="px-4 py-3 text-left text-slate-300">Tipo</th>
                        <th className="px-4 py-3 text-left text-slate-300">Pontos</th>
                        <th className="px-4 py-3 text-left text-slate-300">Nível</th>
                        <th className="px-4 py-3 text-left text-slate-300">Conquistas</th>
                        <th className="px-4 py-3 text-left text-slate-300">Atividade</th>
                        <th className="px-4 py-3 text-left text-slate-300">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {userRankings.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-700/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              {user.rank <= 3 && (
                                <span className="text-2xl">
                                  {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                                </span>
                              )}
                              <span className="text-white font-bold">#{user.rank}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{user.avatar}</span>
                              </div>
                              <div>
                                <div className="text-white font-medium">{user.name}</div>
                                {user.crm && <div className="text-slate-400 text-sm">{user.crm}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.type === 'professional' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                              user.type === 'student' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200'
                            }`}>
                              {user.type === 'professional' ? 'Profissional' :
                               user.type === 'student' ? 'Estudante' : 'Paciente'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-yellow-400 font-bold">{user.points.toLocaleString()}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-bold">Nível {user.level}</span>
                              <div className="w-16 bg-slate-700 rounded-full h-2">
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{width: `${(user.level / 20) * 100}%`}}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {user.badges.slice(0, 2).map((badge, idx) => (
                                <span key={idx} className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded">
                                  {badge}
                                </span>
                              ))}
                              {user.badges.length > 2 && (
                                <span className="text-slate-400 text-xs">+{user.badges.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.activity === 'Muito Ativo' ? 'bg-green-500/20 text-green-400' :
                              user.activity === 'Ativo' ? 'bg-blue-500/20 text-primary-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {user.activity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <button className="text-primary-400 hover:text-blue-300">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-green-400 hover:text-green-300">
                                <Award className="w-4 h-4" />
                              </button>
                              <button className="text-purple-400 hover:text-purple-300">
                                <TrendingUp className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sistema de Conquistas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">🎖️ Conquistas Disponíveis</h3>
                  <div className="space-y-4">
                      {achievementsData.map((achievement) => (
                      <div key={achievement.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{achievement.icon}</span>
                          <div>
                            <div className="text-white font-medium">{achievement.name}</div>
                            <div className="text-slate-400 text-sm">{achievement.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-400 font-bold">{achievement.points} pts</div>
                          <div className="text-slate-400 text-sm">{achievement.unlocked} desbloqueadas</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">📊 Distribuição de Pontos</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Profissionais</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: '65%'}}></div>
                        </div>
                        <span className="text-primary-400 font-bold">65%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Estudantes</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '25%'}}></div>
                        </div>
                        <span className="text-green-400 font-bold">25%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Pacientes</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{width: '10%'}}></div>
                        </div>
                        <span className="text-purple-400 font-bold">10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'chat' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">💬 Monitoramento Chat Global</h2>
                <p className="text-slate-300">Gerencie conversas, modere conteúdo e monitore atividade</p>
              </div>

              {/* Estatísticas do Chat */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-primary-400 mb-2">89</div>
                  <div className="text-slate-300">Chats Ativos</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">1,247</div>
                  <div className="text-slate-300">Mensagens Hoje</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">23</div>
                  <div className="text-slate-300">Moderadores Online</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">5</div>
                  <div className="text-slate-300">Reportes Pendentes</div>
                </div>
              </div>

              {/* Conversas Ativas */}
              <div className="bg-slate-800/80 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-6">💬 Conversas Ativas</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">JS</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">Dr. João Silva</div>
                        <div className="text-slate-400 text-sm">Última mensagem: 2 min atrás</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                        Online
                      </span>
                      <button className="bg-primary-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                        Ver Chat
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">MS</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">Maria Santos</div>
                        <div className="text-slate-400 text-sm">Última mensagem: 5 min atrás</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
                        Aguardando
                      </span>
                      <button className="bg-primary-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                        Ver Chat
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reportes e Moderação */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">🚨 Reportes Pendentes</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-white font-medium">Conteúdo Inapropriado</div>
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">
                          Urgente
                        </span>
                      </div>
                      <div className="text-slate-400 text-sm mb-2">
                        Usuário reportou mensagem com linguagem inadequada
                      </div>
                      <div className="flex space-x-2">
                        <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                          Remover
                        </button>
                        <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                          Ignorar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">👥 Moderadores Online</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">A</span>
                        </div>
                        <div>
                          <div className="text-white text-sm">Admin Principal</div>
                          <div className="text-slate-400 text-xs">Ativo há 2h</div>
                        </div>
                      </div>
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">M</span>
                        </div>
                        <div>
                          <div className="text-white text-sm">Moderador 1</div>
                          <div className="text-slate-400 text-xs">Ativo há 30min</div>
                        </div>
                      </div>
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                        Online
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'upload' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">📁 Sistema de Upload</h2>
                <p className="text-slate-300">Gerencie documentos, cursos, vídeos e conteúdo educacional</p>
              </div>

              {/* Estatísticas de Upload */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-primary-400 mb-2">156</div>
                  <div className="text-slate-300">Documentos</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">42</div>
                  <div className="text-slate-300">Vídeos</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">28</div>
                  <div className="text-slate-300">Cursos</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">2.3GB</div>
                  <div className="text-slate-300">Espaço Usado</div>
                </div>
              </div>

              {/* Upload de Arquivos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">📤 Upload de Arquivos</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Selecione o arquivo
                      </label>
                      <input
                        type="file"
                        className="block w-full text-sm text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary-50 file:text-primary-700
                          hover:file:bg-primary-100"
                        multiple
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Categoria
                      </label>
                      <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                        <option>Curso</option>
                        <option>Documento</option>
                        <option>Vídeo</option>
                        <option>E-book</option>
                        <option>Protocolo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Título
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do arquivo/conteúdo"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Descrição
                      </label>
                      <textarea
                        placeholder="Descrição do conteúdo"
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
                      />
                    </div>
                    <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg">
                      📤 Enviar Arquivo
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">🔗 Upload por URL</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        URL do YouTube/Vimeo
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Título do Vídeo
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do vídeo"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Duração (minutos)
                      </label>
                      <input
                        type="number"
                        placeholder="120"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Categoria
                      </label>
                      <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                        <option>Aula</option>
                        <option>Palestra</option>
                        <option>Demonstração</option>
                        <option>Entrevista</option>
                      </select>
                    </div>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg">
                      🔗 Adicionar URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Arquivos Recentes */}
              <div className="bg-slate-800/80 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-6">📋 Arquivos Recentes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-300">Nome</th>
                        <th className="px-4 py-3 text-left text-slate-300">Tipo</th>
                        <th className="px-4 py-3 text-left text-slate-300">Tamanho</th>
                        <th className="px-4 py-3 text-left text-slate-300">Data</th>
                        <th className="px-4 py-3 text-left text-slate-300">Status</th>
                        <th className="px-4 py-3 text-left text-slate-300">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      <tr>
                        <td className="px-4 py-3 text-white">Guia Cannabis Medicinal.pdf</td>
                        <td className="px-4 py-3 text-slate-300">PDF</td>
                        <td className="px-4 py-3 text-slate-300">2.5 MB</td>
                        <td className="px-4 py-3 text-slate-300">15/01/2024</td>
                        <td className="px-4 py-3">
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                            Publicado
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-primary-400 hover:text-blue-300 mr-2">👁️</button>
                          <button className="text-yellow-400 hover:text-yellow-300 mr-2">✏️</button>
                          <button className="text-red-400 hover:text-red-300">🗑️</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-white">Aula 1 - Entrevista Clínica.mp4</td>
                        <td className="px-4 py-3 text-slate-300">Vídeo</td>
                        <td className="px-4 py-3 text-slate-300">120 MB</td>
                        <td className="px-4 py-3 text-slate-300">14/01/2024</td>
                        <td className="px-4 py-3">
                          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
                            Processando
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-primary-400 hover:text-blue-300 mr-2">👁️</button>
                          <button className="text-yellow-400 hover:text-yellow-300 mr-2">✏️</button>
                          <button className="text-red-400 hover:text-red-300">🗑️</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">📊 Analytics Avançados</h2>
                <p className="text-slate-300">Análise detalhada de uso, engajamento e performance</p>
              </div>

              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-primary-400 mb-2">89.2%</div>
                  <div className="text-slate-300">Taxa de Engajamento</div>
                  <div className="text-green-400 text-sm">+5.3% vs mês anterior</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">2.4h</div>
                  <div className="text-slate-300">Tempo Médio Sessão</div>
                  <div className="text-green-400 text-sm">+12min vs mês anterior</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">67%</div>
                  <div className="text-slate-300">Taxa de Retenção</div>
                  <div className="text-purple-400 text-sm">+8.1% vs mês anterior</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">4.7</div>
                  <div className="text-slate-300">Satisfação (1-5)</div>
                  <div className="text-orange-400 text-sm">+0.3 vs mês anterior</div>
                </div>
              </div>

              {/* Gráficos e Análises */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">📈 Uso por Perfil</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Profissionais</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                        </div>
                        <span className="text-primary-400 font-bold">85%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Pacientes</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '72%'}}></div>
                        </div>
                        <span className="text-green-400 font-bold">72%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Estudantes</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{width: '68%'}}></div>
                        </div>
                        <span className="text-purple-400 font-bold">68%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">🎯 Funcionalidades Mais Usadas</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Avaliação Clínica</span>
                      <span className="text-green-400 font-bold">1,247 usos</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Chat com Nôa</span>
                      <span className="text-primary-400 font-bold">892 usos</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Biblioteca</span>
                      <span className="text-purple-400 font-bold">634 usos</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Chat Global</span>
                      <span className="text-orange-400 font-bold">520 usos</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Análise Temporal */}
              <div className="bg-slate-800/80 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-6">📅 Atividade por Período</h3>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
                    <div key={day} className="text-center">
                      <div className="text-slate-300 text-sm mb-2">{day}</div>
                      <div className="bg-slate-700 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white mb-1">
                          {Math.floor(Math.random() * 200) + 50}
                        </div>
                        <div className="text-xs text-slate-400">usuários</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relatórios de Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">⚡ Performance do Sistema</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Tempo de Resposta</span>
                      <span className="text-green-400 font-bold">245ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Uptime</span>
                      <span className="text-green-400 font-bold">99.9%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Erros 404</span>
                      <span className="text-yellow-400 font-bold">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Erros 500</span>
                      <span className="text-red-400 font-bold">3</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">📱 Dispositivos</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Desktop</span>
                      <span className="text-primary-400 font-bold">65%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Mobile</span>
                      <span className="text-green-400 font-bold">28%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Tablet</span>
                      <span className="text-purple-400 font-bold">7%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'renal' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">🫀 Função Renal - DRC</h2>
                <p className="text-slate-300 text-lg">Mapeamento populacional de risco para Doença Renal Crônica</p>
              </div>

              {/* Estatísticas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {renalStats.map((stat, index) => (
                  <div key={index} className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </div>
                      <div className={stat.color}>
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Alertas Críticos */}
              <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">🚨 Alertas de Risco Renal</h3>
                <div className="space-y-4">
                  {renalAlerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border ${
                      alert.status === 'critical' ? 'bg-red-500/20 border-red-500' :
                      alert.status === 'urgent' ? 'bg-orange-500/20 border-orange-500' :
                      alert.status === 'warning' ? 'bg-yellow-500/20 border-yellow-500' :
                      'bg-green-500/20 border-green-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            alert.status === 'critical' ? 'bg-red-500' :
                            alert.status === 'urgent' ? 'bg-orange-500' :
                            alert.status === 'warning' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}></div>
                          <div>
                            <p className="text-white font-semibold">{alert.patient}</p>
                            <p className="text-slate-400 text-sm">{alert.age} anos • {alert.lastCheck}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">Creatinina: {alert.creatinine} mg/dL</p>
                          <p className="text-white font-bold">TFG: {alert.tfg} mL/min</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.risk === 'Crítico' ? 'bg-red-500/20 text-red-400' :
                            alert.risk === 'Alto' ? 'bg-orange-500/20 text-orange-400' :
                            alert.risk === 'Médio' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            Risco {alert.risk}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mapeamento por Idade */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4">📊 Distribuição de Risco por Idade</h3>
                  <div className="space-y-4">
                    {renalRiskData.map((data, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${
                            data.risk === 'Crítico' ? 'bg-red-500' :
                            data.risk === 'Alto' ? 'bg-orange-500' :
                            data.risk === 'Médio' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}></div>
                          <span className="text-white font-medium">{data.age} anos</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{data.patients} pacientes</p>
                          <p className="text-slate-400 text-sm">{data.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4">📈 Tendências da Função Renal</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">TFG Médio</span>
                      <span className="text-white font-bold">62 mL/min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Creatinina Médio</span>
                      <span className="text-white font-bold">1.5 mg/dL</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Pacientes Monitorados</span>
                      <span className="text-white font-bold">3,065</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Taxa de Estabilidade</span>
                      <span className="text-green-400 font-bold">94.5%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Relatórios de Pesquisa */}
              <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">🔬 Relatórios de Pesquisa</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <Target className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                    <h4 className="text-white font-semibold mb-2">Prevenção DRC</h4>
                    <p className="text-slate-400 text-sm">Identificação precoce de fatores de risco</p>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <h4 className="text-white font-semibold mb-2">Proteção Renal</h4>
                    <p className="text-slate-400 text-sm">Monitoramento contínuo da função renal</p>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <h4 className="text-white font-semibold mb-2">Dados Científicos</h4>
                    <p className="text-slate-400 text-sm">Geração de evidências em larga escala</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'unification' && renderUnification()}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">⚙️ Configurações do Sistema</h2>
                <p className="text-slate-300">Gerencie configurações, integrações e segurança da plataforma</p>
              </div>

              {/* Status do Sistema */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">Online</div>
                  <div className="text-slate-300">Status do Servidor</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-primary-400 mb-2">v3.0.1</div>
                  <div className="text-slate-300">Versão Atual</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">99.9%</div>
                  <div className="text-slate-300">Uptime</div>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">2.3GB</div>
                  <div className="text-slate-300">Espaço Usado</div>
                </div>
              </div>

              {/* Configurações Gerais */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">🔧 Configurações Gerais</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Nome da Plataforma
                      </label>
                      <input
                        type="text"
                        value="MedCannLab 3.0"
                        readOnly
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        URL Base
                      </label>
                      <input
                        type="url"
                        value="https://medcannlab.com"
                        readOnly
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Timezone
                      </label>
                      <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                        <option>America/Sao_Paulo</option>
                        <option>UTC</option>
                        <option>America/New_York</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="maintenance" className="w-4 h-4" />
                      <label htmlFor="maintenance" className="text-slate-300">
                        Modo Manutenção
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">🔐 Segurança</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Força da Senha
                      </label>
                      <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                        <option>Alta (8+ caracteres, símbolos)</option>
                        <option>Média (6+ caracteres)</option>
                        <option>Baixa (4+ caracteres)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Sessão Timeout (minutos)
                      </label>
                      <input
                        type="number"
                        value="30"
                        readOnly
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="2fa" className="w-4 h-4" />
                      <label htmlFor="2fa" className="text-slate-300">
                        Autenticação 2FA
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="logs" className="w-4 h-4" />
                      <label htmlFor="logs" className="text-slate-300">
                        Logs de Segurança
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Integrações */}
              <div className="bg-slate-800/80 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-6">🔗 Integrações</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">Supabase</h4>
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                        Ativo
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">Banco de dados e autenticação</p>
                    <button className="w-full bg-primary-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm">
                      Configurar
                    </button>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">Email Service</h4>
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
                        Pendente
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">Envio de notificações</p>
                    <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded text-sm">
                      Configurar
                    </button>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">Analytics</h4>
                      <span className="bg-blue-500/20 text-primary-400 px-2 py-1 rounded-full text-xs">
                        Ativo
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">Google Analytics</p>
                    <button className="w-full bg-primary-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm">
                      Configurar
                    </button>
                  </div>
                </div>
              </div>

              {/* Backup e Manutenção */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">💾 Backup</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Último Backup</span>
                      <span className="text-green-400">15/01/2024 14:30</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Tamanho do Backup</span>
                      <span className="text-primary-400">1.2GB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Próximo Backup</span>
                      <span className="text-purple-400">16/01/2024 02:00</span>
                    </div>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg">
                      🔄 Executar Backup Agora
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6">🛠️ Manutenção</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Cache Status</span>
                      <span className="text-green-400">Limpo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Logs Antigos</span>
                      <span className="text-yellow-400">15 dias</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Otimização DB</span>
                      <span className="text-primary-400">Pendente</span>
                    </div>
                    <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg">
                      🧹 Limpeza Completa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  )

}

export default AdminDashboard