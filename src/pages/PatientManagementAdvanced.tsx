import React from 'react'
import { Users, Upload, FileText, BarChart3 } from 'lucide-react'

const PatientManagementAdvanced: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-700 border-b border-blue-600/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-text">👥 Gestão Avançada de Pacientes</h1>
              <p className="text-blue-200 text-sm">Sistema integrado com Ninsaúde e digitalização de documentos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-brand-text mb-4">Sistema de Gestão Avançada</h2>
          <p className="text-brand-text-secondary text-lg mb-8">
            Página de gestão avançada de pacientes em desenvolvimento
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-slate-800/80 rounded-lg p-6 border border-brand-border">
              <Upload className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-brand-text mb-2">Upload CSV</h3>
              <p className="text-brand-text-muted">Importar pacientes do Ninsaúde</p>
            </div>
            
            <div className="bg-slate-800/80 rounded-lg p-6 border border-brand-border">
              <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-brand-text mb-2">Documentos</h3>
              <p className="text-brand-text-muted">Digitalizar e organizar documentos</p>
            </div>
            
            <div className="bg-slate-800/80 rounded-lg p-6 border border-brand-border">
              <BarChart3 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-brand-text mb-2">Analytics</h3>
              <p className="text-brand-text-muted">Relatórios e estatísticas</p>
            </div>
          </div>
          
          <div className="mt-8">
            <button className="bg-blue-600 hover:bg-blue-700 text-brand-text px-8 py-3 rounded-lg font-semibold transition-colors">
              Em Breve - Funcionalidades Completas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientManagementAdvanced