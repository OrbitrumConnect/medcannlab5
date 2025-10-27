import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const SmartDashboardRedirect: React.FC = () => {
  const { user } = useAuth()

  // Debug temporário
  console.log('🔍 SmartDashboardRedirect - User type:', user?.type, 'User name:', user?.name)

  if (!user) {
    return <Navigate to="/" replace />
  }

  // Redirecionar baseado no tipo de usuário
  switch (user.type) {
    case 'admin':
      return <Navigate to="/app/dashboard" replace />
    case 'professional':
      return <Navigate to="/app/professional-dashboard" replace />
    case 'patient':
      return <Navigate to="/app/patient-dashboard" replace />
    case 'aluno':
      return <Navigate to="/app/aluno-dashboard" replace />
    default:
      // Fallback para admin se tipo não reconhecido
      return <Navigate to="/app/dashboard" replace />
  }
}

export default SmartDashboardRedirect
