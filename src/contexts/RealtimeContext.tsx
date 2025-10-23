import React, { createContext, useContext, useState, useEffect } from 'react'

interface RealtimeData {
  // Dados do paciente
  patientStats: {
    totalConsultations: number
    pendingEvaluations: number
    availableReports: number
    nextAppointment: string
  }
  
  // Dados do profissional
  professionalStats: {
    activePatients: number
    todayEvaluations: number
    pendingReports: number
    completedCourses: number
  }
  
  // Dados do admin
  adminStats: {
    totalUsers: number
    activeUsers: number
    totalCourses: number
    systemHealth: 'healthy' | 'warning' | 'critical'
  }
  
  // Notificações em tempo real
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    timestamp: Date
    read: boolean
  }>
}

interface RealtimeContextType {
  data: RealtimeData
  updatePatientStats: (stats: Partial<RealtimeData['patientStats']>) => void
  updateProfessionalStats: (stats: Partial<RealtimeData['professionalStats']>) => void
  updateAdminStats: (stats: Partial<RealtimeData['adminStats']>) => void
  addNotification: (notification: Omit<RealtimeData['notifications'][0], 'id' | 'timestamp'>) => void
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export const useRealtime = () => {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<RealtimeData>({
    patientStats: {
      totalConsultations: 2,
      pendingEvaluations: 1,
      availableReports: 3,
      nextAppointment: '15/01/2024'
    },
    professionalStats: {
      activePatients: 24,
      todayEvaluations: 8,
      pendingReports: 3,
      completedCourses: 5
    },
    adminStats: {
      totalUsers: 1247,
      activeUsers: 892,
      totalCourses: 28,
      systemHealth: 'healthy'
    },
    notifications: [
      {
        id: '1',
        type: 'info',
        title: 'Nova Avaliação Disponível',
        message: 'Sua avaliação clínica com Nôa está pronta para ser iniciada.',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        type: 'success',
        title: 'Relatório Gerado',
        message: 'Seu relatório de exames foi gerado com sucesso.',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      }
    ]
  })

  // Simular atualizações em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        notifications: [
          ...prev.notifications,
          {
            id: Date.now().toString(),
            type: 'info',
            title: 'Atualização do Sistema',
            message: 'Novos recursos foram adicionados à plataforma.',
            timestamp: new Date(),
            read: false
          }
        ]
      }))
    }, 30000) // A cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  const updatePatientStats = (stats: Partial<RealtimeData['patientStats']>) => {
    setData(prev => ({
      ...prev,
      patientStats: { ...prev.patientStats, ...stats }
    }))
  }

  const updateProfessionalStats = (stats: Partial<RealtimeData['professionalStats']>) => {
    setData(prev => ({
      ...prev,
      professionalStats: { ...prev.professionalStats, ...stats }
    }))
  }

  const updateAdminStats = (stats: Partial<RealtimeData['adminStats']>) => {
    setData(prev => ({
      ...prev,
      adminStats: { ...prev.adminStats, ...stats }
    }))
  }

  const addNotification = (notification: Omit<RealtimeData['notifications'][0], 'id' | 'timestamp'>) => {
    setData(prev => ({
      ...prev,
      notifications: [
        ...prev.notifications,
        {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date()
        }
      ]
    }))
  }

  const markNotificationAsRead = (id: string) => {
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    }))
  }

  const clearNotifications = () => {
    setData(prev => ({
      ...prev,
      notifications: []
    }))
  }

  return (
    <RealtimeContext.Provider value={{
      data,
      updatePatientStats,
      updateProfessionalStats,
      updateAdminStats,
      addNotification,
      markNotificationAsRead,
      clearNotifications
    }}>
      {children}
    </RealtimeContext.Provider>
  )
}
