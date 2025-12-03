// =====================================================
// SERVIÇO DE NOTIFICAÇÕES - MEDCANLAB 3.0
// =====================================================
// Sistema completo de notificações em tempo real

import { supabase } from '../lib/supabase'

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'clinical' 
  | 'prescription' 
  | 'report' 
  | 'appointment' 
  | 'message'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export type RelatedType = 
  | 'assessment' 
  | 'prescription' 
  | 'report' 
  | 'appointment' 
  | 'message' 
  | 'patient'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  related_type?: RelatedType
  related_id?: string
  action_url?: string
  is_read: boolean
  read_at?: string
  priority: NotificationPriority
  metadata?: Record<string, any>
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type?: NotificationType
  priority?: NotificationPriority
  relatedType?: RelatedType
  relatedId?: string
  actionUrl?: string
  metadata?: Record<string, any>
  expiresAt?: Date
}

export class NotificationService {
  private static instance: NotificationService
  private subscriptions: Map<string, any> = new Map()

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Criar uma nova notificação
   */
  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    try {
      const notificationData = {
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'info',
        priority: params.priority || 'normal',
        related_type: params.relatedType,
        related_id: params.relatedId,
        action_url: params.actionUrl,
        metadata: params.metadata || {},
        expires_at: params.expiresAt?.toISOString()
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single()

      if (error) throw error

      return data as Notification
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error)
      throw error
    }
  }

  /**
   * Buscar notificações de um usuário
   */
  async getUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean
      limit?: number
      offset?: number
      type?: NotificationType
    }
  ): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (options?.unreadOnly) {
        try {
          query = query.eq('is_read', false)
        } catch (err) {
          console.warn('Erro ao filtrar notificações não lidas:', err)
          // Continuar sem o filtro se houver erro
        }
      }

      if (options?.type) {
        query = query.eq('type', options.type)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
      }

      // NÃO usar expires_at - a coluna não existe na tabela notifications
      // Se precisar filtrar por expiração no futuro, adicione a coluna primeiro

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro ao buscar notificações:', error)
        throw error
      }

      return (data || []) as Notification[]
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error)
      return []
    }
  }

  /**
   * Contar notificações não lidas
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Tentar usar RPC se existir
      const { data, error } = await supabase
        .rpc('get_unread_notifications_count', { user_uuid: userId })

      if (error) {
        // Se a função RPC não existir (404) ou qualquer outro erro, usar fallback
        if (error.code === 'P0001' || error.code === '42883' || error.message?.includes('does not exist') || error.message?.includes('function') || error.code === '404') {
          console.warn('⚠️ Função RPC get_unread_notifications_count não existe, usando fallback')
        } else {
          console.warn('⚠️ Erro ao chamar RPC get_unread_notifications_count:', error)
        }
        // Fallback: contar manualmente
        const notifications = await this.getUserNotifications(userId, { unreadOnly: true })
        return notifications.length
      }

      return data || 0
    } catch (error: any) {
      console.error('❌ Erro ao contar notificações não lidas:', error)
      // Fallback: contar manualmente
      try {
        const notifications = await this.getUserNotifications(userId, { unreadOnly: true })
        return notifications.length
      } catch (fallbackError) {
        console.error('❌ Erro no fallback de contagem:', fallbackError)
        return 0
      }
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error)
      return false
    }
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('mark_all_notifications_read', { user_uuid: userId })

      if (error) {
        // Fallback: atualizar manualmente
        try {
          const { error: updateError } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('is_read', false)

          if (updateError) {
            console.warn('Erro ao marcar notificações como lidas:', updateError)
            // Tentar sem filtro is_read se a coluna não existir
            const { error: fallbackError } = await supabase
              .from('notifications')
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq('user_id', userId)
            
            if (fallbackError) throw fallbackError
          }
        } catch (err) {
          console.warn('Erro ao atualizar notificações:', err)
          throw err
        }
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error)
      return 0
    }
  }

  /**
   * Deletar notificação
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('❌ Erro ao deletar notificação:', error)
      return false
    }
  }

  /**
   * Notificar sobre novo relatório clínico
   */
  async notifyNewReport(userId: string, reportId: string, patientName: string, sendEmail: boolean = false): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Novo Relatório Clínico',
      message: `Relatório clínico de ${patientName} está disponível para revisão.`,
      type: 'report',
      priority: 'high',
      relatedType: 'report',
      relatedId: reportId,
      actionUrl: `/app/clinica/profissional/relatorios-clinicos?report=${reportId}`
    })

    // Enviar e-mail se solicitado
    if (sendEmail) {
      try {
        const { emailService } = await import('./emailService')
        const { supabase } = await import('../lib/supabase')
        
        // Buscar email do usuário
        const { data: user } = await supabase
          .from('profiles')
          .select('email, name')
          .eq('id', userId)
          .single()

        if (user?.email) {
          await emailService.sendTemplateEmail('report_ready', user.email, {
            userName: user.name || 'Usuário',
            reportId,
            reportTitle: `Relatório Clínico - ${patientName}`
          })
        }
      } catch (error) {
        console.error('Erro ao enviar e-mail de notificação:', error)
      }
    }
  }

  /**
   * Notificar sobre nova prescrição
   */
  async notifyNewPrescription(userId: string, prescriptionId: string, patientName: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Nova Prescrição',
      message: `Prescrição para ${patientName} foi criada.`,
      type: 'prescription',
      priority: 'normal',
      relatedType: 'prescription',
      relatedId: prescriptionId,
      actionUrl: `/app/clinica/profissional/prescricoes?prescription=${prescriptionId}`
    })
  }

  /**
   * Notificar sobre novo agendamento
   */
  async notifyNewAppointment(userId: string, appointmentId: string, patientName: string, date: Date): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Novo Agendamento',
      message: `Agendamento com ${patientName} em ${date.toLocaleDateString('pt-BR')}.`,
      type: 'appointment',
      priority: 'normal',
      relatedType: 'appointment',
      relatedId: appointmentId,
      actionUrl: `/app/clinica/profissional/agendamentos?appointment=${appointmentId}`
    })
  }

  /**
   * Notificar sobre nova avaliação IMRE
   */
  async notifyNewAssessment(userId: string, assessmentId: string, patientName: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Nova Avaliação IMRE',
      message: `Avaliação clínica de ${patientName} foi concluída.`,
      type: 'clinical',
      priority: 'high',
      relatedType: 'assessment',
      relatedId: assessmentId,
      actionUrl: `/app/clinica/profissional/avaliacao?assessment=${assessmentId}`
    })
  }

  /**
   * Inscrever em notificações em tempo real
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): () => void {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()

    this.subscriptions.set(userId, channel)

    // Retornar função de unsubscribe
    return () => {
      channel.unsubscribe()
      this.subscriptions.delete(userId)
    }
  }

  /**
   * Limpar todas as subscrições
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((channel) => {
      channel.unsubscribe()
    })
    this.subscriptions.clear()
  }
}

// Exportar instância singleton
export const notificationService = NotificationService.getInstance()

