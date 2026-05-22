import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUserRoutes, getBreadcrumbs } from '../lib/rotasIndividualizadas'

const NavegacaoIndividualizada: React.FC = () => {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return null

  // Determinar eixo e tipo baseado na rota atual
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const eixo = pathSegments[1] // app/[eixo]/...
  const tipo = pathSegments[2] // app/eixo/[tipo]/...

  const userRoutes = getUserRoutes(eixo, tipo)
  const breadcrumbs = getBreadcrumbs(location.pathname)

  if (!userRoutes) return null

  return (
    <div className="bg-brand-surface border-b border-brand-border">
      {/* Breadcrumbs */}
      <div className="px-6 py-3">
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-slate-500">/</span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-brand-text font-medium">{crumb.label}</span>
              ) : (
                <Link 
                  to={crumb.path} 
                  className="text-brand-text-muted hover:text-brand-text transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Navegação por Eixo e Tipo */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-brand-text">
              {userRoutes.eixo === 'clinica' && '🏥 Eixo Clínica'}
              {userRoutes.eixo === 'ensino' && '🎓 Eixo Ensino'}
              {userRoutes.eixo === 'pesquisa' && '🔬 Eixo Pesquisa'}
            </h1>
            <p className="text-brand-text-muted text-sm mt-1">
              {userRoutes.tipo === 'profissional' && 'Área do Profissional'}
              {userRoutes.tipo === 'paciente' && 'Área do Paciente'}
              {userRoutes.tipo === 'aluno' && 'Área do Aluno'}
            </p>
          </div>
          
          {/* Seletor de Eixo */}
          <div className="flex space-x-2">
            <Link
              to="/app/clinica/profissional/dashboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                eixo === 'clinica' 
                  ? 'bg-blue-600 text-brand-text' 
                  : 'bg-brand-surface-subtle text-brand-text-secondary hover:bg-slate-600'
              }`}
            >
              🏥 Clínica
            </Link>
            <Link
              to="/app/ensino/aluno/dashboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                eixo === 'ensino' 
                  ? 'bg-green-600 text-brand-text' 
                  : 'bg-brand-surface-subtle text-brand-text-secondary hover:bg-slate-600'
              }`}
            >
              🎓 Ensino
            </Link>
            <Link
              to="/app/pesquisa/profissional/dashboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                eixo === 'pesquisa' 
                  ? 'bg-purple-600 text-brand-text' 
                  : 'bg-brand-surface-subtle text-brand-text-secondary hover:bg-slate-600'
              }`}
            >
              🔬 Pesquisa
            </Link>
          </div>
        </div>
      </div>

      {/* Menu de Navegação */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {userRoutes.rotas.map((rota) => {
            const isActive = location.pathname === rota.path
            return (
              <Link
                key={rota.path}
                to={rota.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-brand-text'
                    : 'bg-brand-surface-subtle text-brand-text-secondary hover:bg-slate-600'
                }`}
              >
                <span>{rota.icon}</span>
                <span>{rota.title}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default NavegacaoIndividualizada
