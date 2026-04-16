import React, { useState } from 'react'
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Target,
    Brain,
    Shield,
    Clock,
    Plus,
    ChevronRight as ChevronRightIcon
} from 'lucide-react'
import { Appointment } from '../../../hooks/dashboard/usePatientDashboard'
import { supabase } from '../../../lib/supabase'

interface PatientAppointmentsProps {
    appointments: Appointment[]
    onRefresh: () => void
    onStartAssessment: () => void
    onScheduleNew: () => void
}

export const PatientAppointments: React.FC<PatientAppointmentsProps> = ({
    appointments,
    onRefresh,
    onStartAssessment,
    onScheduleNew
}) => {
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDay = firstDay.getDay()

        const days = []
        for (let i = startingDay - 1; i >= 0; i--) {
            const prevDate = new Date(year, month, -i)
            days.push({ date: prevDate.getDate(), fullDate: prevDate, isCurrentMonth: false })
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day)
            const isToday = date.toDateString() === new Date().toDateString()
            const hasAppointment = appointments.some(apt => new Date(apt.date).toDateString() === date.toDateString() && apt.status !== 'cancelled')
            days.push({ date: day, fullDate: date, isCurrentMonth: true, isToday, hasAppointment })
        }

        const remaining = 42 - days.length
        for (let day = 1; day <= remaining; day++) {
            const nextDate = new Date(year, month + 1, day)
            days.push({ date: nextDate.getDate(), fullDate: nextDate, isCurrentMonth: false })
        }

        return days
    }

    const handleCancel = async (id: string) => {
        if (!confirm('Deseja realmente cancelar?')) return
        const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
        if (!error) onRefresh()
    }

    const calendarDays = generateCalendarDays()

    return (
        <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Meus Agendamentos</h1>
                <p className="text-slate-300 text-sm md:text-base">Gerencie suas consultas e visualize seu calendário</p>
            </div>

            <div className="flex gap-2">
                <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg font-semibold transition-all ${viewMode === 'calendar' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'}`}>Calendário</button>
                <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg font-semibold transition-all ${viewMode === 'list' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'}`}>Lista</button>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-500/10 rounded-xl border border-primary-500/20">
                            <Target className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Avaliação Clínica</h2>
                            <p className="text-slate-400 text-sm">Realize sua avaliação completa com a IA Nôa</p>
                        </div>
                    </div>
                    <button onClick={onStartAssessment} className="px-6 py-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-primary-500/25">
                        <Brain className="w-4 h-4" /> Iniciar
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary-400" /> Próximas Consultas
                    </h2>
                    <button onClick={onScheduleNew} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-all border border-white/10 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Agendar
                    </button>
                </div>

                <div className="grid gap-3">
                    {appointments.slice(0, 3).map(apt => (
                        <div key={apt.id} className="group bg-white/5 hover:bg-white/10 rounded-2xl p-4 border border-white/5 transition-all flex items-center justify-between backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Calendar className="w-6 h-6 text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">{apt.professional}</p>
                                    <p className="text-slate-400 text-sm">{new Date(apt.date).toLocaleDateString('pt-BR')} às {apt.time}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${apt.status === 'scheduled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        apt.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                    {apt.status === 'scheduled' ? 'Agendado' : apt.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                                </span>
                                {apt.status === 'scheduled' && (
                                    <button onClick={() => handleCancel(apt.id)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Cancelar</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {viewMode === 'calendar' && (
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-bold text-white">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"><ChevronLeft className="w-5 h-5" /></button>
                            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {dayNames.map(d => <div key={d} className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(day.fullDate)}
                                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border ${!day.isCurrentMonth ? 'opacity-20 pointer-events-none' :
                                        day.isToday ? 'bg-primary-500/20 border-primary-500/50 text-white' :
                                            selectedDate?.toDateString() === day.fullDate.toDateString() ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/40' :
                                                'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                <span className="text-sm font-bold">{day.date}</span>
                                {day.hasAppointment && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"></div>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
