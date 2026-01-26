import React, { createContext, useContext, useState } from 'react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    // 🛑 SUPRESSÃO DE NOTIFICAÇÕES NO CHAT
    // Se o usuário já está na seção de chat, não mostrar notificações de novas mensagens (tipo info)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const section = params.get('section')

      // Se estiver na seção de chat ou na página de chat direto
      if (
        (section === 'chat-profissionais' || window.location.pathname.includes('/chat-profissional')) &&
        (toast.type === 'info' || toast.title?.toLowerCase().includes('mensagem'))
      ) {
        console.log('🔇 Notificação suprimida (usuário já está no chat):', toast.title)
        return
      }
    }

    const id = Date.now().toString()
    const newToast = { ...toast, id }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id)
    }, toast.duration || 5000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (title: string, message?: string) => {
    addToast({ type: 'success', title, message })
  }

  const error = (title: string, message?: string) => {
    addToast({ type: 'error', title, message })
  }

  const warning = (title: string, message?: string) => {
    addToast({ type: 'warning', title, message })
  }

  const info = (title: string, message?: string) => {
    addToast({ type: 'info', title, message })
  }

  const value: ToastContextType = {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer: React.FC<{ toasts: Toast[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg max-w-sm ${toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
                toast.type === 'warning' ? 'bg-yellow-500 text-white' :
                  'bg-blue-500 text-white'
            }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{toast.title}</h4>
              {toast.message && <p className="text-sm opacity-90">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}