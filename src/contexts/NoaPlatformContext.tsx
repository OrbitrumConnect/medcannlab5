// =====================================================
// CONTEXTO: INTEGRAÇÃO IA-PLATAFORMA EM TEMPO REAL
// =====================================================
// Sincroniza dados da plataforma com a IA Nôa Esperança

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface PlatformData {
  user: {
    id: string
    name: string
    email: string
    user_type: string
    crm?: string | null
    cro?: string | null
  }
  dashboard: {
    activeSection: string
    totalPatients: number
    recentReports: number
    pendingNotifications: number
    lastUpdate: string
  }
  totalPatients: number
  completedAssessments: number
  aecProtocols: number
  activeClinics: number
  currentRoute?: string
}

interface NoaPlatformContextType {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  sendInitialMessage: (message: string) => void
  pendingMessage: string | null
  clearPendingMessage: () => void
  platformData: PlatformData | null
  refreshPlatformData: () => Promise<void>
  isSyncing: boolean
}

const NoaPlatformContext = createContext<NoaPlatformContextType | undefined>(undefined)

export const useNoaPlatform = () => {
  const context = useContext(NoaPlatformContext)
  if (!context) {
    throw new Error('useNoaPlatform must be used within a NoaPlatformProvider')
  }
  return context
}

interface NoaPlatformProviderProps {
  children: ReactNode
}

export const NoaPlatformProvider: React.FC<NoaPlatformProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [platformData, setPlatformData] = useState<PlatformData | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Buscar dados da plataforma
  const refreshPlatformData = useCallback(async () => {
    if (!user) {
      setPlatformData(null)
      return
    }

    setIsSyncing(true)
    try {
      // Buscar dados do Supabase com tratamento de erro individual
      let patientsResult = { data: [], error: null }
      try {
        const result = await supabase.from('profiles').select('id').eq('type', 'patient')
        patientsResult = result
      } catch (err) {
        console.warn('⚠️ Erro ao buscar pacientes:', err)
      }
      
      let reportsResult = { data: [], error: null }
      try {
        const result = await supabase.from('clinical_reports').select('id').eq('doctor_id', user.id)
        reportsResult = result
      } catch (err) {
        console.warn('⚠️ Erro ao buscar relatórios:', err)
      }
      
      // Query de notificações com tratamento especial para is_read
      let notificationsResult = { data: [], error: null }
      try {
        const result = await supabase.from('notifications').select('id').eq('user_id', user.id).eq('is_read', false)
        notificationsResult = result
      } catch (err: any) {
        // Se a tabela ou coluna não existir, usar query sem filtro is_read
        try {
          const result = await supabase.from('notifications').select('id').eq('user_id', user.id)
          notificationsResult = result
        } catch {
          notificationsResult = { data: [], error: null }
        }
      }
      
      let assessmentsResult = { data: [], error: null }
      try {
        const result = await supabase.from('imre_assessments').select('id').eq('user_id', user.id).eq('completion_status', 'completed')
        assessmentsResult = result
      } catch (err) {
        console.warn('⚠️ Erro ao buscar avaliações:', err)
      }

      const data: PlatformData = {
        user: {
          id: user.id,
          name: user.name || 'Usuário',
          email: user.email || '',
          user_type: user.type || 'paciente',
          crm: user.crm ?? null,
          cro: user.cro ?? null
        },
        dashboard: {
          activeSection: location.pathname,
          totalPatients: patientsResult.data?.length || 0,
          recentReports: reportsResult.data?.length || 0,
          pendingNotifications: notificationsResult.data?.length || 0,
          lastUpdate: new Date().toISOString()
        },
        totalPatients: patientsResult.data?.length || 0,
        completedAssessments: assessmentsResult.data?.length || 0,
        aecProtocols: 0, // TODO: Buscar de tabela específica
        activeClinics: 3, // TODO: Buscar de tabela específica
        currentRoute: location.pathname
      }

      setPlatformData(data)

      // Atualizar localStorage e window para compatibilidade
      localStorage.setItem('platformData', JSON.stringify(data))
      ;(window as any).getPlatformData = () => data

    } catch (error) {
      console.error('❌ Erro ao buscar dados da plataforma:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [user, location.pathname])

  // Sincronizar dados periodicamente (a cada 30 segundos)
  useEffect(() => {
    if (!user) return

    // Sincronizar imediatamente
    refreshPlatformData()

    // Sincronizar periodicamente
    const interval = setInterval(() => {
      refreshPlatformData()
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [user, refreshPlatformData])

  // Atualizar quando rota mudar
  useEffect(() => {
    if (platformData) {
      const updated = {
        ...platformData,
        dashboard: {
          ...platformData.dashboard,
          activeSection: location.pathname
        },
        currentRoute: location.pathname
      }
      setPlatformData(updated)
      localStorage.setItem('platformData', JSON.stringify(updated))
      ;(window as any).getPlatformData = () => updated
    }
  }, [location.pathname])

  const openChat = () => {
    setIsOpen(true)
  }

  const closeChat = () => {
    setIsOpen(false)
  }

  const sendInitialMessage = (message: string) => {
    setPendingMessage(message)
    setIsOpen(true)
  }

  const clearPendingMessage = () => {
    setPendingMessage(null)
  }

  return (
    <NoaPlatformContext.Provider value={{
      isOpen,
      openChat,
      closeChat,
      sendInitialMessage,
      pendingMessage,
      clearPendingMessage,
      platformData,
      refreshPlatformData,
      isSyncing
    }}>
      {children}
    </NoaPlatformContext.Provider>
  )
}
