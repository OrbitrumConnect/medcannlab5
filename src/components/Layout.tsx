import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-slate-900">
        {/* Sidebar */}
        <Sidebar userType={user?.type} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 bg-slate-900">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default Layout