import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { supabase } from '../lib/supabase'
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Video,
  Phone,
  Plus,
  Edit,
  Trash2,
  Star,
  TrendingUp,
  BarChart3,
  Users,
  CheckCircle,
  AlertCircle,
  Heart,
  ThumbsUp,
  MessageSquare,
  FileText,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
  Bell,
  Award,
  Target,
  Zap,
  Activity,
  PieChart,
  LineChart,
  X
} from 'lucide-react'
import {
  SCHEDULING_CONFIG,
  clampToSchedulingStartDate,
  generateAppointmentSlots,
  isSchedulingWorkingDay
} from '../lib/schedulingConfig'
import { emailService } from '../services/emailService'
import { backgroundGradient, cardStyle, secondarySurfaceStyle } from '../constants/designSystem'

const ProfessionalScheduling: React.FC = () => {
  const { user } = useAuth()
  const toast = useToast()
  const { confirm } = useConfirm()
  const schedulingStartDate = useMemo(() => {
    const date = new Date(SCHEDULING_CONFIG.startDateISO)
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const [currentDate, setCurrentDate] = useState(() => clampToSchedulingStartDate(new Date()))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'analytics'>('calendar')
  const [showDayDetailsModal, setShowDayDetailsModal] = useState(false)
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<any[]>([])
  const [appointmentData, setAppointmentData] = useState({
    patientId: '',
    patientName: '',
    date: '',
    time: '',
    type: 'online',
    specialty: '',
    service: 'Primeira consulta',
    room: '',
    notes: '',
    duration: 60,
    priority: 'normal'
  })

  const [patients, setPatients] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [isCreatingPatient, setIsCreatingPatient] = useState(false)
  const [isSavingPatient, setIsSavingPatient] = useState(false)
  const [createPatientError, setCreatePatientError] = useState<string | null>(null)
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  const findNextWorkingDate = (base: Date): Date => {
    const candidate = clampToSchedulingStartDate(new Date(base))
    candidate.setHours(0, 0, 0, 0)

    let guard = 0
    while (!isSchedulingWorkingDay(candidate)) {
      candidate.setDate(candidate.getDate() + 1)
      guard += 1
      if (guard > 21) break
    }

    return candidate
  }

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(findNextWorkingDate(currentDate))
    }
  }, [selectedDate, currentDate])

  // Carregar dados do Supabase
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      // Buscar agendamentos do profissional (SEM relação FK - não existe no schema)
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', user.id)
        .order('appointment_date', { ascending: true })

      if (appointmentsError) {
        console.error('Erro ao carregar agendamentos:', appointmentsError)
        return
      }

      // Buscar pacientes disponíveis (todos pacientes cadastrados)
      const { data: patientsData, error: patientsError } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .eq('type', 'patient')
        .order('name', { ascending: true })

      if (patientsError) {
        console.error('Erro ao carregar pacientes:', patientsError)
      }

      // Transformar agendamentos
      const formattedAppointments = (appointmentsData || []).map((apt: any) => {
        const appointmentDate = new Date(apt.appointment_date)
        const patient = apt.patient || patientsData?.find((p: any) => p.id === apt.patient_id)
        return {
          id: apt.id,
          patientId: apt.patient_id,
          patientName: patient?.name || 'Paciente',
          date: appointmentDate.toISOString().split('T')[0],
          time: appointmentDate.toTimeString().slice(0, 5),
          type: apt.is_remote ? 'online' : 'presencial',
          specialty: apt.specialty || apt.type || 'Cannabis Medicinal',
          service: apt.title || 'Consulta',
          room: apt.location || (apt.is_remote ? 'Plataforma digital' : 'Sala'),
          status: apt.status,
          duration: Number(apt.duration) || 60,
          priority: 'normal',
          notes: apt.description || apt.notes,
          rating: apt.rating,
          patientComment: apt.comment,
          createdAt: new Date(apt.created_at).toISOString().split('T')[0],
          createdBy: apt.created_by
        }
      })

      // Separar agendamentos confirmados e solicitações pendentes
      const confirmedAppointments = formattedAppointments.filter(apt =>
        apt.status === 'scheduled' || apt.status === 'confirmed' || apt.status === 'completed'
      )
      const pending = formattedAppointments.filter(apt => {
        // Solicitações pendentes: status pending/requested OU criadas por pacientes (não pelo profissional)
        const isPendingStatus = apt.status === 'pending' || apt.status === 'requested'
        const isCreatedByPatient = apt.createdBy && apt.createdBy !== user.id
        return isPendingStatus || isCreatedByPatient
      })

      // Debug: log para verificar solicitações
      if (pending.length > 0) {
        console.log('📋 Solicitações pendentes encontradas:', pending.length, pending)
      } else {
        console.log('ℹ️ Nenhuma solicitação pendente encontrada. Total de agendamentos:', formattedAppointments.length)
      }

      setAppointments(confirmedAppointments)
      setPendingRequests(pending)
      setPatients(patientsData || [])

      // Calcular analytics
      const totalAppointments = formattedAppointments.length
      const completedAppointments = formattedAppointments.filter(a => a.status === 'completed').length
      const cancelledAppointments = formattedAppointments.filter(a => a.status === 'cancelled').length
      const ratings = formattedAppointments.filter(a => a.rating).map(a => a.rating)
      const averageRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0

      // Buscar transações para calcular receita (com tratamento de erro)
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'completed')

      if (transactionsError) {
        console.warn('⚠️ Erro ao buscar transações (tabela pode não existir ou sem acesso):', transactionsError.message)
      }

      const totalRevenue = transactions?.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0) || 0

      // Calcular estatísticas mensais
      const appointmentsByMonth = formattedAppointments.reduce((acc: any, curr: any) => {
        const date = new Date(curr.date);
        // Ajustar fuso horário para evitar erro de dia/mês
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

        const month = adjustedDate.toLocaleString('pt-BR', { month: 'short' });
        const key = month.charAt(0).toUpperCase() + month.slice(1); // Capitalizar
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const monthlyStats = Object.keys(appointmentsByMonth).map(month => ({
        name: month,
        appointments: appointmentsByMonth[month]
      }));

      // Calcular estatísticas por especialidade
      const appointmentsBySpecialty = formattedAppointments.reduce((acc: any, curr: any) => {
        const spec = curr.specialty || 'Geral';
        acc[spec] = (acc[spec] || 0) + 1;
        return acc;
      }, {});

      const specialtyStats = Object.keys(appointmentsBySpecialty).map(spec => ({
        name: spec,
        value: appointmentsBySpecialty[spec]
      }));

      // Calcular estatísticas por horário
      const appointmentsByTime = formattedAppointments.reduce((acc: any, curr: any) => {
        const time = curr.time.substring(0, 5); // HH:MM
        acc[time] = (acc[time] || 0) + 1;
        return acc;
      }, {});

      const timeSlotStats = Object.keys(appointmentsByTime).map(time => ({
        name: time,
        bookings: appointmentsByTime[time]
      })).sort((a: any, b: any) => a.name.localeCompare(b.name));

      setAnalyticsData({
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRevenue,
        monthlyStats,
        specialtyStats,
        timeSlotStats
      })
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  // Horários disponíveis
  const timeSlots = useMemo(
    () =>
      generateAppointmentSlots(
        SCHEDULING_CONFIG.startTime,
        SCHEDULING_CONFIG.endTime,
        SCHEDULING_CONFIG.appointmentDurationMinutes,
        SCHEDULING_CONFIG.bufferMinutes
      ),
    []
  )

  // Especialidades
  const specialties = [
    'Neurologia',
    'Nefrologia',
    'Homeopatia'
  ]

  const specialtyConsultorioMap: Record<string, string[]> = {
    Neurologia: ['Consultório Escola Eduardo Faveret'],
    Nefrologia: ['Consultório Escola Ricardo Valença'],
    Homeopatia: ['Consultório Escola Ricardo Valença']
  }

  // Salas disponíveis (consultórios) - Baseado no profissional logado
  const professionalRoom = useMemo(() => {
    if (!user?.name) return 'Consultório'
    // Criar nome da sala baseado no nome do profissional
    const professionalName = user.name
    // Se for Dr. Ricardo Valença ou similar
    if (professionalName.toLowerCase().includes('ricardo') || professionalName.toLowerCase().includes('valença')) {
      return 'Consultório Escola Ricardo Valença'
    }
    // Se for Dr. Eduardo Faveret ou similar
    if (professionalName.toLowerCase().includes('eduardo') || professionalName.toLowerCase().includes('faveret')) {
      return 'Consultório Escola Eduardo Faveret'
    }
    // Para outros profissionais, usar o nome dele
    return `Consultório ${professionalName}`
  }, [user?.name])

  const rooms = useMemo(() => {
    // Sempre incluir a sala do profissional logado como primeira opção
    const baseRooms = [professionalRoom]

    // Adicionar outras salas se necessário baseado na especialidade
    if (appointmentData.specialty && specialtyConsultorioMap[appointmentData.specialty]) {
      const specialtyRooms = specialtyConsultorioMap[appointmentData.specialty]
      specialtyRooms.forEach(room => {
        if (!baseRooms.includes(room)) {
          baseRooms.push(room)
        }
      })
    } else {
      // Se não houver especialidade selecionada, adicionar as outras salas padrão
      if (!baseRooms.includes('Consultório Escola Ricardo Valença')) {
        baseRooms.push('Consultório Escola Ricardo Valença')
      }
      if (!baseRooms.includes('Consultório Escola Eduardo Faveret')) {
        baseRooms.push('Consultório Escola Eduardo Faveret')
      }
    }

    return baseRooms
  }, [appointmentData.specialty, professionalRoom])

  useEffect(() => {
    // Sempre definir a sala do profissional como padrão
    if (professionalRoom && (!appointmentData.room || appointmentData.room !== professionalRoom)) {
      setAppointmentData(prev => ({
        ...prev,
        room: professionalRoom
      }))
    } else if (rooms.length > 0 && !rooms.includes(appointmentData.room)) {
      setAppointmentData(prev => ({
        ...prev,
        room: rooms[0]
      }))
    }
  }, [rooms, professionalRoom, appointmentData.room])

  const resetNewPatientForm = () => {
    setNewPatientData({
      name: '',
      email: '',
      phone: ''
    })
    setCreatePatientError(null)
    setIsSavingPatient(false)
  }

  const handleCreatePatient = async () => {
    if (isSavingPatient) return

    const name = newPatientData.name.trim()
    const email = newPatientData.email.trim().toLowerCase()
    const phone = newPatientData.phone.trim()

    if (!name || !email) {
      setCreatePatientError('Informe pelo menos nome e email do paciente.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setCreatePatientError('Informe um email válido.')
      return
    }

    try {
      setIsSavingPatient(true)
      setCreatePatientError(null)

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existing) {
        setCreatePatientError('Já existe um paciente cadastrado com este email.')
        setIsSavingPatient(false)
        return
      }

      const patientId = crypto.randomUUID()
      const now = new Date().toISOString()

      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          id: patientId,
          name,
          email,
          phone: phone || null,
          type: 'patient',
          created_at: now,
          updated_at: now
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setPatients(prev => [...prev, newUser])
      setAppointmentData(prev => ({
        ...prev,
        patientId: newUser.id,
        patientName: newUser.name
      }))
      setIsCreatingPatient(false)
      resetNewPatientForm()
    } catch (error: any) {
      console.error('Erro ao criar paciente:', error)
      setCreatePatientError(error?.message || 'Não foi possível criar o paciente. Tente novamente.')
    } finally {
      setIsSavingPatient(false)
    }
  }

  // Função para gerar dias do mês
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []
    // Dias do mês anterior
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevMonth = new Date(year, month - 1, 0)
      prevMonth.setHours(0, 0, 0, 0)
      const fullDate = new Date(year, month - 1, prevMonth.getDate() - i)
      fullDate.setHours(0, 0, 0, 0)
      days.push({
        date: fullDate.getDate(),
        fullDate,
        isCurrentMonth: false,
        isToday: false,
        appointments: [],
        isDisabled: true
      })
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      date.setHours(0, 0, 0, 0)
      const isToday = date.toDateString() === new Date().toDateString()
      const dayAppointments = appointments.filter(apt =>
        apt.date === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      )
      const isBeforeStart = date < schedulingStartDate
      const isWorking = isSchedulingWorkingDay(date)

      days.push({
        date: day,
        fullDate: date,
        isCurrentMonth: true,
        isToday,
        appointments: dayAppointments,
        isDisabled: isBeforeStart || !isWorking
      })
    }

    // Dias do próximo mês
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const fullDate = new Date(year, month + 1, day)
      fullDate.setHours(0, 0, 0, 0)
      days.push({
        date: fullDate.getDate(),
        fullDate,
        isCurrentMonth: false,
        isToday: false,
        appointments: [],
        isDisabled: true
      })
    }

    return days
  }

  // Função para navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      newDate.setDate(1)
      newDate.setHours(0, 0, 0, 0)
      if (newDate < schedulingStartDate) {
        return new Date(schedulingStartDate)
      }
      return newDate
    })
  }

  // Função para selecionar data
  const handleDateSelect = (day: any) => {
    if (day.isCurrentMonth && !day.isDisabled) {
      setSelectedDate(new Date(day.fullDate))
      setSelectedTime(null)

      // Se o dia tem agendamentos, abrir modal de detalhes
      if (day.appointments && day.appointments.length > 0) {
        setSelectedDayAppointments(day.appointments)
        setShowDayDetailsModal(true)
      }
    }
  }

  // Função para selecionar horário
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setAppointmentData(prev => ({
      ...prev,
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
      time
    }))
    setShowAppointmentModal(true)
  }

  // Função para salvar agendamento
  const handleSaveAppointment = async () => {
    if (
      !appointmentData.patientId ||
      !appointmentData.date ||
      !appointmentData.time ||
      !appointmentData.specialty ||
      !appointmentData.service ||
      !appointmentData.room ||
      !user
    ) {
      toast.showToast('warning', 'Preecha todos os campos obrigatórios antes de salvar o agendamento.')
      return
    }

    try {
      // 1. Verificar disponibilidade do horário
      const appointmentDateTime = new Date(`${appointmentData.date}T${appointmentData.time}`)

      // Verificar conflitos
      const { data: conflicting } = await supabase
        .from('appointments')
        .select('id')
        .eq('professional_id', user.id)
        .eq('appointment_date', appointmentDateTime.toISOString())
        .in('status', ['scheduled', 'confirmed'])
        .maybeSingle()

      if (conflicting) {
        toast.showToast('warning', 'Este horário já está ocupado. Por favor, escolha outro horário.')
        return
      }

      // 2. Salvar no Supabase
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: appointmentData.patientId,
          professional_id: user.id,
          appointment_date: appointmentDateTime.toISOString(),
          appointment_time: appointmentData.time,
          appointment_type: appointmentData.service,
          specialty: appointmentData.specialty || 'Neurologia',
          status: 'scheduled',
          type: 'consultation',
          is_remote: true,
          duration: appointmentData.duration || 60,
          description: appointmentData.notes || '',
          location: appointmentData.room || professionalRoom,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // 3. Recarregar dados
      await loadData()

      // 4. Enviar e-mail de confirmação (Manifesto 5.0)
      const patient = patients.find(p => p.id === appointmentData.patientId)
      if (patient?.email) {
        emailService.sendTemplateEmail('appointment_confirmed', patient.email, {
          userName: patient.name,
          appointmentDate: new Date(appointmentData.date).toLocaleDateString('pt-BR'),
          appointmentTime: appointmentData.time,
          professionalName: user.name || 'Médico Responsável',
          location: appointmentData.room || 'Teleconsulta'
        }).catch(err => console.error('Erro ao enviar e-mail ao paciente:', err))
      }

      // Notificar profissional também (opcional, mas recomendado no polimento)
      if (user?.email) {
        emailService.sendEmail({
          to: user.email,
          subject: `Novo Agendamento: ${patient?.name || 'Paciente'}`,
          html: `<h3>Novo agendamento confirmado!</h3>
                 <p><b>Paciente:</b> ${patient?.name || 'Não identificado'}</p>
                 <p><b>Data:</b> ${new Date(appointmentData.date).toLocaleDateString('pt-BR')}</p>
                 <p><b>Horário:</b> ${appointmentData.time}</p>
                 <p>Acesse seu dashboard para mais detalhes.</p>`
        }).catch(err => console.error('Erro ao enviar e-mail ao profissional:', err))
      }

      // 5. Fechar modal e limpar formulário
      setShowAppointmentModal(false)
      setAppointmentData({
        patientId: '',
        patientName: '',
        date: '',
        time: '',
        type: 'online',
        specialty: '',
        service: 'Primeira consulta',
        room: professionalRoom || rooms[0] || '',
        notes: '',
        duration: 60,
        priority: 'normal'
      })

      toast.showToast('success', 'Agendamento criado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error)
      toast.showToast('error', error.message || 'Tente novamente.')
    }
  }

  // Função para renderizar calendário
  const renderCalendar = () => {
    const days = generateCalendarDays()
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    return (
      <div className="rounded-xl p-6" style={cardStyle}>
        {/* Header do calendário */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ background: 'rgba(15, 36, 60, 0.5)' }}
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ background: 'rgba(15, 36, 60, 0.5)' }}
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
              {day}
            </div>
          ))}
        </div>

        {/* Dias do calendário */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDateSelect(day)}
              className={`p-2 h-20 border border-slate-700 rounded-lg cursor-pointer transition-colors ${day.isCurrentMonth
                ? 'hover:opacity-80'
                : 'text-slate-500'
                } ${day.isToday
                  ? 'bg-primary-600/20 border-primary-500'
                  : ''
                } ${day.isDisabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''
                } ${selectedDate &&
                  day.isCurrentMonth &&
                  selectedDate.toDateString() === day.fullDate.toDateString()
                  ? 'bg-primary-600 border-primary-500'
                  : ''
                }`}
            >
              <div className="text-sm font-medium mb-1">
                {day.date}
              </div>
              {day.appointments.length > 0 && (
                <div className="space-y-1">
                  {day.appointments.slice(0, 2).map(apt => (
                    <div
                      key={apt.id}
                      className={`text-xs px-1 py-0.5 rounded ${apt.priority === 'high'
                        ? 'bg-red-500/20 text-red-400'
                        : apt.priority === 'normal'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-green-500/20 text-green-400'
                        }`}
                    >
                      {apt.time} - {apt.patientName.split(' ')[0]}
                    </div>
                  ))}
                  {day.appointments.length > 2 && (
                    <div className="text-xs text-slate-400">
                      +{day.appointments.length - 2} mais
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Função para renderizar horários disponíveis
  const renderTimeSlots = () => {
    if (!selectedDate) return null

    const selectedDateStr = selectedDate.toISOString().split('T')[0]
    const dayAppointments = appointments.filter(apt => apt.date === selectedDateStr)
    const bookedTimes = dayAppointments.map(apt => apt.time)

    return (
      <div className="rounded-xl p-6" style={cardStyle}>
        <h3 className="text-xl font-semibold text-white mb-4">
          Horários Disponíveis - {selectedDate.toLocaleDateString('pt-BR')}
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {timeSlots.map(time => {
            const isBooked = bookedTimes.includes(time)
            return (
              <button
                key={time}
                onClick={() => !isBooked && handleTimeSelect(time)}
                disabled={isBooked}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${isBooked
                  ? 'text-slate-500 cursor-not-allowed'
                  : 'hover:bg-primary-600 text-slate-300 hover:text-white'
                  }`}
              >
                {time}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Função para renderizar modal de detalhes do dia
  const renderDayDetailsModal = () => {
    if (!showDayDetailsModal || !selectedDate) return null

    const formattedDate = selectedDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={cardStyle}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white capitalize">{formattedDate}</h2>
              <p className="text-slate-400 mt-1">
                {selectedDayAppointments.length} agendamento(s) neste dia
              </p>
            </div>
            <button
              onClick={() => setShowDayDetailsModal(false)}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Lista de agendamentos */}
          <div className="space-y-4 mb-6">
            {selectedDayAppointments.length > 0 ? (
              selectedDayAppointments.map((apt) => {
                const patient = patients.find((p: any) => p.id === apt.patientId)
                return (
                  <div
                    key={apt.id}
                    className="rounded-lg p-5 border border-slate-700/50"
                    style={secondarySurfaceStyle}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-primary-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {apt.patientName || patient?.name || 'Paciente'}
                            </h3>
                            <p className="text-sm text-slate-400">{patient?.email || ''}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400 mb-1">Horário</p>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-primary-400" />
                              <p className="text-white font-medium">{apt.time}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-slate-400 mb-1">Especialidade</p>
                            <p className="text-white font-medium">{apt.specialty}</p>
                          </div>

                          <div>
                            <p className="text-slate-400 mb-1">Tipo</p>
                            <div className="flex items-center space-x-2">
                              {apt.type === 'online' ? (
                                <Video className="w-4 h-4 text-sky-400" />
                              ) : (
                                <MapPin className="w-4 h-4 text-emerald-400" />
                              )}
                              <p className="text-white font-medium">
                                {apt.type === 'online' ? 'Online' : 'Presencial'}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-slate-400 mb-1">Status</p>
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${apt.status === 'confirmed' || apt.status === 'scheduled'
                                ? 'bg-green-500/20 text-green-400'
                                : apt.status === 'completed'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : apt.status === 'cancelled'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                            >
                              {apt.status === 'scheduled' || apt.status === 'confirmed'
                                ? 'Confirmado'
                                : apt.status === 'completed'
                                  ? 'Concluído'
                                  : apt.status === 'cancelled'
                                    ? 'Cancelado'
                                    : 'Pendente'}
                            </span>
                          </div>
                        </div>

                        {apt.notes && (
                          <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(15, 36, 60, 0.3)' }}>
                            <p className="text-sm text-slate-300">{apt.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          className="p-2 rounded-lg hover:bg-primary-600/20 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5 text-primary-400" />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-red-600/20 transition-colors"
                          title="Cancelar"
                        >
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum agendamento neste dia</p>
              </div>
            )}
          </div>

          {/* Botão para novo agendamento */}
          <button
            onClick={() => {
              setShowDayDetailsModal(false)
              setAppointmentData(prev => ({
                ...prev,
                date: selectedDate.toISOString().split('T')[0],
                time: ''
              }))
              // Scroll para a seção de horários
              setSelectedTime(null)
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-sky-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:from-emerald-500 hover:to-sky-400 transition-all flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Agendamento Neste Dia</span>
          </button>
        </div>
      </div>
    )
  }

  // Função para renderizar analytics
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl p-6" style={cardStyle}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total de Consultas</p>
              <p className="text-2xl font-bold text-white">{analyticsData.totalAppointments}</p>
            </div>
            <Calendar className="w-8 h-8 text-primary-400" />
          </div>
        </div>

        <div className="rounded-xl p-6" style={cardStyle}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Taxa de Conclusão</p>
              <p className="text-2xl font-bold text-white">
                {Math.round((analyticsData.completedAppointments / analyticsData.totalAppointments) * 100)}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="rounded-xl p-6" style={cardStyle}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Avaliação Média</p>
              <p className="text-2xl font-bold text-white">{analyticsData.averageRating}/5</p>
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="rounded-xl p-6" style={cardStyle}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Receita Total</p>
              <p className="text-2xl font-bold text-white">R$ {analyticsData.totalRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de especialidades */}
        <div className="rounded-xl p-6" style={cardStyle}>
          <h3 className="text-lg font-semibold text-white mb-4">Consultas por Especialidade</h3>
          <div className="space-y-3">
            {analyticsData.specialtyStats.map((specialty: any) => (
              <div key={specialty.specialty} className="flex items-center justify-between">
                <span className="text-slate-300">{specialty.specialty}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 rounded-full h-2" style={{ background: 'rgba(15, 36, 60, 0.7)' }}>
                    <div
                      className="bg-primary-500 h-2 rounded-full"
                      style={{ width: `${(specialty.appointments / 50) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-medium">{specialty.appointments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de horários */}
        <div className="rounded-xl p-6" style={cardStyle}>
          <h3 className="text-lg font-semibold text-white mb-4">Ocupação por Horário</h3>
          <div className="space-y-3">
            {analyticsData.timeSlotStats.map((slot: any) => (
              <div key={slot.time} className="flex items-center justify-between">
                <span className="text-slate-300">{slot.time}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 rounded-full h-2" style={{ background: 'rgba(15, 36, 60, 0.7)' }}>
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${slot.utilization}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-medium">{slot.utilization}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: backgroundGradient }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Sistema de Agendamento</h1>
            <p className="text-slate-400">Gerencie consultas, visualize analytics e acompanhe performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedDate(findNextWorkingDate(new Date()))
                setSelectedTime(null)
                setAppointmentData({
                  patientId: '',
                  patientName: '',
                  date: findNextWorkingDate(new Date()).toISOString().split('T')[0],
                  time: '',
                  type: 'online',
                  specialty: '',
                  service: 'Primeira consulta',
                  room: professionalRoom || rooms[0] || '',
                  notes: '',
                  duration: 60,
                  priority: 'normal'
                })
                setShowAppointmentModal(true)
              }}
              className="bg-gradient-to-r from-emerald-600 to-sky-500 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg hover:from-emerald-500 hover:to-sky-400 transition-all flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Agendar Paciente</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'calendar'
                ? 'bg-primary-600 text-white'
                : 'text-slate-300 hover:opacity-80'
                }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendário
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'list'
                ? 'bg-primary-600 text-white'
                : 'text-slate-300 hover:opacity-80'
                }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'analytics'
                ? 'bg-primary-600 text-white'
                : 'text-slate-300 hover:opacity-80'
                }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </button>
          </div>
        </div>

        {/* Solicitações Pendentes - Visível apenas quando houver solicitações */}
        {pendingRequests.length > 0 && (
          <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-xl p-6 border border-amber-700/50 mb-6 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-amber-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">Solicitações de Agendamento Pendentes</h2>
                  <p className="text-sm text-amber-200/80">
                    {pendingRequests.length} solicitação(ões) aguardando aprovação
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {pendingRequests.map((request) => {
                const patient = patients.find((p: any) => p.id === request.patientId)
                return (
                  <div
                    key={request.id}
                    className="rounded-lg p-4 border border-amber-600/30"
                    style={cardStyle}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-amber-600/20 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">{request.patientName || patient?.name || 'Paciente'}</h4>
                            <p className="text-slate-400 text-sm">{patient?.email || ''}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm ml-13">
                          <div>
                            <p className="text-slate-400">Data</p>
                            <p className="text-white font-medium">{new Date(request.date).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Horário</p>
                            <p className="text-white font-medium">{request.time}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Tipo</p>
                            <p className="text-white capitalize">{request.type || 'Online'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Especialidade</p>
                            <p className="text-white">{request.specialty || 'Não especificada'}</p>
                          </div>
                        </div>
                        {request.notes && (
                          <div className="mt-3 ml-13">
                            <p className="text-slate-400 text-sm">Observações do paciente:</p>
                            <p className="text-slate-300 text-sm p-2 rounded mt-1" style={secondarySurfaceStyle}>{request.notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('appointments')
                                .update({ status: 'scheduled' })
                                .eq('id', request.id)

                              if (error) throw error
                              await loadData()
                              toast.showToast('success', 'Solicitação aprovada com sucesso!')
                            } catch (error: any) {
                              console.error('Erro ao aprovar solicitação:', error)
                              toast.showToast('error', error.message)
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Aprovar</span>
                        </button>
                        <button
                          onClick={async () => {
                            const shouldReject = await confirm({
                              title: 'Rejeitar solicitação',
                              message: 'Tem certeza que deseja rejeitar esta solicitação?',
                              type: 'danger',
                              confirmText: 'Rejeitar',
                              cancelText: 'Cancelar'
                            })
                            if (!shouldReject) return
                            try {
                              const { error } = await supabase
                                .from('appointments')
                                .update({ status: 'cancelled' })
                                .eq('id', request.id)

                              if (error) throw error
                              await loadData()
                              toast.showToast('info', 'Solicitação rejeitada.')
                            } catch (error: any) {
                              console.error('Erro ao rejeitar solicitação:', error)
                              toast.showToast('error', error.message)
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>Rejeitar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Conteúdo baseado na visualização */}
        {viewMode === 'calendar' && (
          <div className="space-y-6">
            {renderCalendar()}
            {selectedDate && renderTimeSlots()}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="rounded-xl p-6" style={cardStyle}>
            <h3 className="text-xl font-semibold text-white mb-4">Próximas Consultas</h3>
            <div className="space-y-4">
              {appointments.map(appointment => (
                <div key={appointment.id} className="rounded-lg p-4" style={secondarySurfaceStyle}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{appointment.patientName}</h4>
                          <p className="text-slate-400 text-sm">{appointment.specialty}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Data</p>
                          <p className="text-white">{appointment.date}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Horário</p>
                          <p className="text-white">{appointment.time}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Tipo</p>
                          <p className="text-white capitalize">{appointment.type}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Sala</p>
                          <p className="text-white">{appointment.room}</p>
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-2">
                          <p className="text-slate-400 text-sm">Observações</p>
                          <p className="text-slate-300 text-sm">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {appointment.rating && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-yellow-400">{appointment.rating}</span>
                        </div>
                      )}
                      <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'analytics' && renderAnalytics()}

        {/* Modal de agendamento */}
        {showAppointmentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ ...cardStyle, background: 'rgba(15, 36, 60, 0.98)' }}>
              <h3 className="text-xl font-semibold text-white mb-4">Novo Agendamento</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Paciente</label>
                    <select
                      value={appointmentData.patientId}
                      onChange={(e) => {
                        const selectedId = e.target.value
                        const patient = patients.find((p: any) => String(p.id) === selectedId)
                        setAppointmentData({
                          ...appointmentData,
                          patientId: selectedId,
                          patientName: patient?.name || ''
                        })
                      }}
                      className="w-full rounded-lg px-3 py-2 text-white"
                      style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(0, 193, 106, 0.12)' }}
                    >
                      <option value="">Selecione um paciente</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>{patient.name}</option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCreatePatientError(null)
                          setIsCreatingPatient(prev => {
                            if (prev) {
                              resetNewPatientForm()
                              return false
                            }
                            return true
                          })
                        }}
                        className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        {isCreatingPatient ? 'Cancelar novo paciente' : '➕ Cadastrar novo paciente'}
                      </button>
                    </div>
                    {isCreatingPatient && (
                      <div className="mt-3 space-y-3 rounded-lg p-4" style={secondarySurfaceStyle}>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Nome completo</label>
                          <input
                            type="text"
                            value={newPatientData.name}
                            onChange={(e) => setNewPatientData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full rounded-lg px-3 py-2 text-white text-sm"
                            style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(0, 193, 106, 0.12)' }}
                            placeholder="Ex: Maria da Silva"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Email</label>
                          <input
                            type="email"
                            value={newPatientData.email}
                            onChange={(e) => setNewPatientData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full rounded-lg px-3 py-2 text-white text-sm"
                            style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(0, 193, 106, 0.12)' }}
                            placeholder="paciente@exemplo.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Telefone</label>
                          <input
                            type="tel"
                            value={newPatientData.phone}
                            onChange={(e) => setNewPatientData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full rounded-lg px-3 py-2 text-white text-sm"
                            style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(0, 193, 106, 0.12)' }}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        {createPatientError && (
                          <p className="text-xs text-red-400">{createPatientError}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCreatePatient}
                            disabled={isSavingPatient}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isSavingPatient ? 'Salvando...' : 'Salvar paciente'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingPatient(false)
                              resetNewPatientForm()
                            }}
                            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            Limpar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Data</label>
                    <input
                      type="date"
                      value={appointmentData.date}
                      onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-white"
                      style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(0, 193, 106, 0.12)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Horário</label>
                    <input
                      type="time"
                      value={appointmentData.time}
                      onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-white"
                      style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(0, 193, 106, 0.12)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Tipo</label>
                    <input
                      type="text"
                      value="Online"
                      readOnly
                      className="w-full rounded-lg px-3 py-2 text-white uppercase tracking-wide"
                      style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(0, 193, 106, 0.12)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Especialidade</label>
                    <select
                      value={appointmentData.specialty}
                      onChange={(e) => setAppointmentData({ ...appointmentData, specialty: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-white"
                      style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(0, 193, 106, 0.12)' }}
                      required
                    >
                      <option value="">Selecione</option>
                      {specialties.map(specialty => (
                        <option key={specialty} value={specialty}>{specialty}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Sala</label>
                    <select
                      value={appointmentData.room}
                      onChange={(e) => setAppointmentData({ ...appointmentData, room: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-white"
                      style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(0, 193, 106, 0.12)' }}
                    >
                      <option value="">Selecione</option>
                      {rooms.map(room => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Serviço</label>
                  <select
                    value={appointmentData.service}
                    onChange={(e) => setAppointmentData({ ...appointmentData, service: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-white"
                    style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(0, 193, 106, 0.12)' }}
                    required
                  >
                    <option value="Primeira consulta">Primeira consulta</option>
                    <option value="Retorno">Retorno</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Observações</label>
                  <textarea
                    value={appointmentData.notes}
                    onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
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
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Agendar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalhes do dia */}
      {renderDayDetailsModal()}
    </div>
  )
}

export default ProfessionalScheduling
