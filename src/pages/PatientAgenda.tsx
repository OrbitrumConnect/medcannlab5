import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Video,
  Plus,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Interface para agendamentos do Supabase
interface Appointment {
  id: string
  title: string
  appointment_date: string
  duration: number
  status: string
  type: string
  location?: string
  is_remote?: boolean
  meeting_url?: string
  notes?: string
  professional?: {
    id: string
    name: string
    specialty?: string
  }
}

const PatientAgenda: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestNotes, setRequestNotes] = useState('')
  const [requesting, setRequesting] = useState(false)

  // Carregar agendamentos reais do Supabase
  useEffect(() => {
    if (user?.id) {
      loadAppointments()
    }
  }, [user?.id])

  const loadAppointments = async () => {
    try {
      setLoading(true)

      // Buscar agendamentos onde o paciente é o usuário logado
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          professional:professional_id (
            id,
            name,
            specialty
          )
        `)
        .eq('patient_id', user?.id)
        .order('appointment_date', { ascending: true })

      if (error) throw error

      setAppointments(data || [])
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAppointment = async () => {
    if (!user?.id) return
    setRequesting(true)

    try {
      // Criar solicitação de agendamento (pendente)
      // Como não temos um médico selecionado, atribuímos ao "Dr. Eduardo Faveret" ou deixamos null para triagem
      // Aqui vamos buscar o ID de um profissional padrão ou deixar null se a tabela permitir

      // Buscar um profissional padrão (Dr. Eduardo ou Ricardo)
      const { data: professionals } = await supabase
        .from('users')
        .select('id')
        .in('email', ['eduardoscfaveret@gmail.com', 'rrvalenca@gmail.com'])
        .limit(1)

      const professionalId = professionals?.[0]?.id

      if (!professionalId) {
        alert('Erro: Nenhum médico disponível para solicitação.')
        return
      }

      // Criar agendamento com status 'pending' (ou 'scheduled' se pending não existir no enum)
      // Ajuste: Vamos usar 'scheduled' com uma nota de "Solicitação do Paciente" se 'pending' não for suportado
      // Mas idealmente, deveria ser 'pending'. Vamos tentar 'scheduled' com titulo explicito.

      const requestedDate = new Date()
      requestedDate.setDate(requestedDate.getDate() + 1) // Amanhã
      requestedDate.setHours(9, 0, 0, 0) // 09:00

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          professional_id: professionalId,
          appointment_date: requestedDate.toISOString(),
          duration: 60,
          status: 'scheduled', // Usando scheduled pois é o enum padrão
          title: 'Solicitação de Consulta',
          type: 'Avaliação Inicial',
          description: requestNotes || 'Solicitado via Dashboard do Paciente',
          is_remote: true
        })

      if (error) throw error

      alert('Solicitação de consulta enviada com sucesso! Aguarde a confirmação.')
      setShowRequestModal(false)
      setRequestNotes('')
      loadAppointments()

    } catch (error: any) {
      console.error('Erro ao solicitar consulta:', error)
      alert(`Erro ao solicitar consulta: ${error.message}`)
    } finally {
      setRequesting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      case 'confirmed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/50'
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/50'
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/50'
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      weekday: date.toLocaleDateString('pt-BR', { weekday: 'long' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 p-4 sm:p-6 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <button
              onClick={() => navigate('/app/clinica/paciente/dashboard')}
              className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-emerald-400" />
                Minha Agenda
              </h1>
              <p className="text-sm text-slate-400">Gerencie suas consultas e acompanhamentos</p>
            </div>
          </div>

          <button
            onClick={() => setShowRequestModal(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 group"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Nova Consulta</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Filtros e Controles */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center font-medium text-lg px-4">
              Próximos Agendamentos
            </div>
            <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {['all', 'scheduled', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {status === 'all' ? 'Todos' : status === 'scheduled' ? 'Agendados' : 'Realizados'}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Agendamentos */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
            <p>Sincronizando sua agenda...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-700/50 border-dashed">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Calendar className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma consulta encontrada</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Você ainda não possui agendamentos registrados. Que tal marcar sua avaliação inicial?
            </p>
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-emerald-900/20"
            >
              Solicitar Agendamento
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {appointments
              .filter(app => filterStatus === 'all' || app.status === filterStatus)
              .map((appointment) => {
                const { date, time, weekday } = formatDateTime(appointment.appointment_date)
                return (
                  <div
                    key={appointment.id}
                    className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/30 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/10 group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start space-x-5">
                        {/* Data Badge */}
                        <div className="flex flex-col items-center justify-center bg-slate-700/50 rounded-xl p-3 min-w-[80px] border border-slate-600/30 group-hover:border-emerald-500/30 transition-colors">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{weekday.split('-')[0]}</span>
                          <span className="text-2xl font-bold text-white my-1">{date.split(' de ')[0]}</span>
                          <span className="text-xs text-slate-400">{time}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                              {appointment.title || 'Consulta Médica'}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(appointment.status)}`}>
                              {appointment.status === 'scheduled' ? 'Agendada' :
                               appointment.status === 'completed' ? 'Realizada' : appointment.status}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <User className="w-4 h-4 text-emerald-400" />
                              <span>Dr(a). {appointment.professional?.name || 'Não atribuído'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-emerald-400" />
                              <span>{appointment.duration} min</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {appointment.is_remote ? (
                                <Video className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <MapPin className="w-4 h-4 text-emerald-400" />
                              )}
                              <span>{appointment.is_remote ? 'Online' : 'Presencial'}</span>
                            </div>
                          </div>
                          
                          {appointment.notes && (
                            <p className="text-sm text-slate-400 mt-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Observações</span>
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                        {appointment.is_remote && appointment.meeting_url && (
                          <button
                            onClick={() => window.open(appointment.meeting_url, '_blank')}
                            className="flex-1 md:w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                          >
                            <Video className="w-4 h-4" />
                            Entrar na Sala
                          </button>
                        )}
                        <button className="flex-1 md:w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-slate-600 hover:border-slate-500">
                          Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Modal de Solicitação */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl p-6 transform transition-all scale-100">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6 text-emerald-400" />
              Solicitar Agendamento
            </h3>

            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-200">
                  Sua solicitação será enviada para a coordenação médica. Entraremos em contato para confirmar o horário exato.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Motivo da Consulta / Observações
                </label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Ex: Gostaria de agendar avaliação inicial..."
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors"
                  disabled={requesting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRequestAppointment}
                  disabled={requesting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                >
                  {requesting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Confirmar Solicitação'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientAgenda
