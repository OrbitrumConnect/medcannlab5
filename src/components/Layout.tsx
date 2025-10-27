import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'
import { NoaPlatformChat } from './NoaPlatformChat'
import Breadcrumbs from './Breadcrumbs'

const Layout: React.FC = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="loading-dots mb-4">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    )
  }

  // Verificar se o email não foi confirmado
  if (user?.type === 'unconfirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Confirme seu Email
          </h1>
          <p className="text-slate-300 mb-6">
            Enviamos um link de confirmação para <strong>{user.email}</strong>
          </p>
          <p className="text-slate-400 text-sm mb-8">
            Verifique sua caixa de entrada e clique no link para ativar sua conta.
            Se não encontrar o email, verifique a pasta de spam.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Voltar ao Início
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Já Confirmei - Atualizar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Layout para todos os usuários (incluindo pacientes)
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-900">
        {/* Sidebar */}
        <Sidebar userType={user?.type} />
        
        {/* Main Content */}
        <div className="flex flex-col min-h-screen lg:ml-80">
          <Header />
          
          <main className="flex-1 bg-slate-900 lg:ml-4" style={{ marginLeft: '2%', marginRight: '2%' }}>
            <Breadcrumbs />
            <Outlet />
          </main>
          <Footer />
        </div>
        
        {/* Avatar Nôa Esperança */}
        <NoaPlatformChat />
      </div>
    </ProtectedRoute>
  )
}

export default Layout