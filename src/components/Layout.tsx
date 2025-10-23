import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'

const Layout: React.FC = () => {
  const { user } = useAuth()

  return (
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
  )
}

export default Layout