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
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
    setErrorMsg(null)
    try {
      // V1.9.420 — fix bug class "consent loop": o .update() do Supabase NÃO
      // lança exceção em erro de RLS nem em 0 linhas afetadas — devolve
      // { data, error }. O código antigo dava window.location.reload() SEM
      // checar nada → se a conta não tem registro em public.users (trigger
      // handle_new_user falhou no signup), o update afeta 0 linhas,
      // consent_accepted_at fica null, recarrega, mostra o modal de novo →
      // LOOP INFINITO. Agora: .select() pra contar linhas, e só recarrega
      // se o update REALMENTE gravou.
      const { data, error } = await supabase
        .from('users')
        .update({ consent_accepted_at: new Date().toISOString() } as any)
        .eq('id', user.id)
        .select('id')

      if (error) {
        console.error('[ConsentGuard] erro ao salvar consentimento:', error)
        setErrorMsg('Não foi possível salvar o consentimento. Tente novamente em instantes.')
        return
      }

      if (!data || data.length === 0) {
        // 0 linhas = a conta não existe em public.users. NÃO recarregar —
        // recarregar aqui é o que prende o usuário no loop infinito.
        console.error('[ConsentGuard] update afetou 0 linhas — conta sem registro em public.users. user.id:', user.id)
        setErrorMsg('Sua conta está com um registro incompleto e não foi possível concluir aqui. NÃO recarregue a página — contate o suporte informando o e-mail usado no login.')
        return
      }

      // Sucesso confirmado — só agora recarrega pra atualizar os dados do usuário.
      window.location.reload()
    } catch (err) {
      console.error('[ConsentGuard] exceção ao salvar consentimento:', err)
      setErrorMsg('Erro inesperado ao salvar. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-brand-surface border border-brand-border rounded-2xl max-w-2xl w-full p-8 shadow-2xl my-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">
            Termos de Uso e LGPD
          </h1>
          <p className="text-brand-text-muted">
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
                <h3 className="text-brand-text font-semibold text-sm mb-1">Termos de Uso da Plataforma</h3>
                <p className="text-brand-text-muted text-xs mb-3">
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
                  <span className="text-brand-text-secondary text-sm">Li e aceito os Termos de Uso</span>
                </label>
              </div>
            </div>
          </div>

          {/* LGPD */}
          <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-brand-text font-semibold text-sm mb-1">Consentimento LGPD — Dados Sensíveis</h3>
                <p className="text-brand-text-muted text-xs mb-3">
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
                  <span className="text-brand-text-secondary text-sm">Autorizo o tratamento de dados sensíveis</span>
                </label>
              </div>
            </div>
          </div>

          {/* Consultas */}
          <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-brand-text font-semibold text-sm mb-1">Consultas Médicas Especializadas</h3>
                <p className="text-brand-text-muted text-xs mb-3">
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
                  <span className="text-brand-text-secondary text-sm">Autorizo consultas médicas na plataforma</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAcceptAll}
            className="flex-1 bg-slate-600 hover:bg-slate-500 text-brand-text px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Aceitar Todos
          </button>

          <button
            onClick={handleConfirm}
            disabled={!canProceed || isSaving}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
              canProceed
                ? 'bg-emerald-600 hover:bg-emerald-500 text-brand-text'
                : 'bg-brand-surface-subtle text-slate-500 cursor-not-allowed'
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

        {errorMsg && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <p className="text-red-300 text-sm leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <p className="text-xs text-slate-500 mt-4 text-center">
          Você pode revogar seu consentimento a qualquer momento nas configurações da conta
        </p>
      </motion.div>
    </div>
  )
}

export default ConsentGuard
