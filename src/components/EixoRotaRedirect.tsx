import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface EixoRotaParams {
  eixo: 'ensino' | 'pesquisa' | 'clinica'
  tipo: 'profissional' | 'aluno' | 'paciente'
}

const EixoRotaRedirect: React.FC = () => {
  const { eixo, tipo } = useParams() as unknown as EixoRotaParams
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/" replace />
  }

  // Verificar se o usuário tem acesso ao eixo/tipo solicitado
  const temAcesso = verificarAcesso(user.type, eixo, tipo)

  if (!temAcesso) {
    console.warn(`⚠️ Usuário ${user.type} não tem acesso a ${eixo}/${tipo}`)
    return <Navigate to="/app/dashboard" replace />
  }

  // Redirecionar para o dashboard específico baseado no eixo e tipo
  const rotaDestino = determinarRotaDestino(eixo, tipo)

  console.log(`🔄 Redirecionando ${user.type} para ${eixo}/${tipo} → ${rotaDestino}`)
  return <Navigate to={rotaDestino} replace />
}

const verificarAcesso = (userType: string, eixo?: string, tipo?: string): boolean => {
  // Admin tem acesso a tudo
  if (userType === 'admin') return true

  // Verificar acesso específico por eixo e tipo
  if (!eixo || !tipo) return false

  // Lógica de acesso baseada na metodologia AEC
  switch (eixo) {
    case 'clinica':
      // Clínica: Profissional e Paciente têm acesso
      return tipo === 'profissional' || tipo === 'paciente'
    case 'ensino':
      // Ensino: Profissional e Aluno têm acesso
      return tipo === 'profissional' || tipo === 'aluno'
    case 'pesquisa':
      // Pesquisa: Profissional e Aluno têm acesso
      return tipo === 'profissional' || tipo === 'aluno'
    default:
      return false
  }
}

const determinarRotaDestino = (eixo?: string, tipo?: string): string => {
  if (!eixo || !tipo) return '/app/dashboard'

  // Rotas específicas por eixo e tipo
  switch (eixo) {
    case 'clinica':
      switch (tipo) {
        case 'profissional':
          return '/app/clinica/profissional/dashboard'
        case 'paciente':
          return '/app/clinica/paciente/dashboard'
        default:
          return '/app/dashboard'
      }
    case 'ensino':
      switch (tipo) {
        case 'profissional':
          return '/app/ensino/profissional/dashboard'
        case 'aluno':
          return '/app/ensino/aluno/dashboard'
        default:
          return '/app/dashboard'
      }
    case 'pesquisa':
      switch (tipo) {
        case 'profissional':
          return '/app/pesquisa/profissional/dashboard'
        case 'aluno':
          return '/app/pesquisa/aluno/dashboard'
        default:
          return '/app/dashboard'
      }
    default:
      return '/app/dashboard'
  }
}

export default EixoRotaRedirect
