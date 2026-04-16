import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Shield, CheckCircle, FileText, Lock, Database, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * ConsentGuard — Bloqueia acesso ao app até o usuário aceitar os termos LGPD.
 * Renderiza um overlay modal sobre o Layout.
 * Se consent_accepted_at já estiver preenchido, renderiza children normalmente.
 */
const ConsentGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedDataSharing, setAcceptedDataSharing] = useState(false)
  const [acceptedMedicalConsultation, setAcceptedMedicalConsultation] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Se não há user ou já aceitou, libera
  if (!user || user.consent_accepted_at) {
    return <>{children}</>
  }

  const canProceed = acceptedTerms && acceptedDataSharing && acceptedMedicalConsultation

  const handleAcceptAll = () => {
    setAcceptedTerms(true)
    setAcceptedDataSharing(true)
    setAcceptedMedicalConsultation(true)
  }

  const handleConfirm = async () => {
    if (!canProceed || !user) return
    setIsSaving(true)
    try {
      await supabase
        .from('users')
        .update({ consent_accepted_at: new Date().toISOString() } as any)
        .eq('id', user.id)

      // Reload page to refresh user data
      window.location.reload()
    } catch (err) {
      console.error('Erro ao salvar consentimento:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl my-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Termos de Uso e LGPD
          </h1>
          <p className="text-slate-400">
            Consentimento obrigatório para uso da plataforma
          </p>
        </div>

        {/* Terms */}
        <div className="space-y-4 mb-8">
          {/* Termos de Uso */}
          <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">Termos de Uso da Plataforma</h3>
                <p className="text-slate-400 text-xs mb-3">
                  Ao utilizar a plataforma MedCannLab, você concorda com as regras de uso,
                  política de privacidade e responsabilidades do usuário.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-500 text-emerald-500 focus:ring-emerald-500 bg-slate-600"
                  />
                  <span className="text-slate-300 text-sm">Li e aceito os Termos de Uso</span>
                </label>
              </div>
            </div>
          </div>

          {/* LGPD */}
          <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">Consentimento LGPD — Dados Sensíveis</h3>
                <p className="text-slate-400 text-xs mb-3">
                  Conforme a Lei Geral de Proteção de Dados (LGPD), autorizo o tratamento de dados
                  sensíveis relacionados à minha saúde para fins clínicos e de pesquisa na plataforma.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedDataSharing}
                    onChange={(e) => setAcceptedDataSharing(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-500 text-emerald-500 focus:ring-emerald-500 bg-slate-600"
                  />
                  <span className="text-slate-300 text-sm">Autorizo o tratamento de dados sensíveis</span>
                </label>
              </div>
            </div>
          </div>

          {/* Consultas */}
          <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">Consultas Médicas Especializadas</h3>
                <p className="text-slate-400 text-xs mb-3">
                  Autorizo consultas médicas especializadas com profissionais parceiros da plataforma
                  e compartilhamento seguro de informações clínicas entre eles.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedMedicalConsultation}
                    onChange={(e) => setAcceptedMedicalConsultation(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-500 text-emerald-500 focus:ring-emerald-500 bg-slate-600"
                  />
                  <span className="text-slate-300 text-sm">Autorizo consultas médicas na plataforma</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAcceptAll}
            className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Aceitar Todos
          </button>

          <button
            onClick={handleConfirm}
            disabled={!canProceed || isSaving}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
              canProceed
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {isSaving ? 'Salvando...' : 'Confirmar e Continuar'}
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Você pode revogar seu consentimento a qualquer momento nas configurações da conta
        </p>
      </motion.div>
    </div>
  )
}

export default ConsentGuard
