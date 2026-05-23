import React, { useState, useMemo } from 'react'
import { Link2, Copy, Check, MessageCircle, Mail, X, QrCode } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

/**
 * QuickReferralModal — V1.9.440 (23/05/2026)
 *
 * Modal compacto reusavel pra compartilhar link de indicacao do medico.
 * Reuso da logica do IncentivosPanel.tsx (V1.9.270-271) extraida pra
 * componente standalone — chamavel de qualquer lugar do app.
 *
 * Origem: Pedro 23/05 — profissional Dayana precisou de atalho pra mandar
 * link sem preencher cadastro manual completo. Adicionado no menu "Novo
 * Paciente" do Terminal de Atendimento. Pode ser reusado em Risk Cockpit,
 * Dashboard, Quick Actions, etc.
 *
 * Fluxo: medico abre -> ve link + QR + share -> manda paciente -> paciente
 * clica -> cai em /invite?doctor_id=X -> RPC get_public_doctor_info
 * (SECURITY DEFINER, V1.9.440) puxa nome+especialidade publicos -> paciente
 * loga/cadastra -> vincula como invited_by do medico.
 */

export interface QuickReferralModalProps {
  open: boolean
  onClose: () => void
}

export const QuickReferralModal: React.FC<QuickReferralModalProps> = ({ open, onClose }) => {
  const { user } = useAuth()
  const [linkCopied, setLinkCopied] = useState(false)

  const inviteLink = user?.id
    ? `${window.location.origin}/invite?doctor_id=${user.id}`
    : ''

  const qrCodeUrl = useMemo(
    () => (inviteLink
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(inviteLink)}&bgcolor=0B1220&color=00E5B2`
      : ''
    ),
    [inviteLink]
  )

  const shareMessage = inviteLink
    ? `Olá! Convido você a se cadastrar na plataforma MedCannLab pelo meu link de indicação:\n\n${inviteLink}\n\nA plataforma oferece avaliação clínica integrativa com método autoral Dr. Ricardo Valença (AEC — Arte da Entrevista Clínica).`
    : ''

  if (!open) return null

  const handleCopyLink = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = inviteLink
      document.body.appendChild(textArea)
      textArea.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      document.body.removeChild(textArea)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    }
  }

  const handleShareWhatsApp = () => {
    if (!shareMessage) return
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank', 'noopener,noreferrer')
  }

  const handleShareEmail = () => {
    if (!shareMessage || !inviteLink) return
    const subject = encodeURIComponent('Convite MedCannLab — Plataforma Cannabis Medicinal')
    const body = encodeURIComponent(shareMessage)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleShareNative = async () => {
    if (!shareMessage || !inviteLink) return
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Convite MedCannLab',
          text: shareMessage,
          url: inviteLink,
        })
      } catch { /* user cancelou */ }
    } else {
      // Fallback: copia o link
      void handleCopyLink()
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-slate-900 border rounded-xl p-4 md:p-5 shadow-2xl"
        style={{
          borderColor: 'rgba(0, 229, 178, 0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0, 229, 178, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0, 229, 178, 0.12)', border: '1px solid rgba(0, 229, 178, 0.3)' }}
            >
              <Link2 className="w-4 h-4 text-[#00E5B2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Enviar Link de Indicação</h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Atalho rápido · sem cadastro manual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code centralizado */}
        <div className="flex flex-col items-center mb-3">
          <div
            className="p-2 rounded-lg bg-slate-800 border border-slate-700"
            style={{ boxShadow: '0 0 20px rgba(0, 229, 178, 0.1)' }}
          >
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code do link de indicação" className="w-40 h-40" />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center text-slate-500">
                <QrCode className="w-10 h-10 opacity-30" />
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 font-mono uppercase tracking-wider">Aponte a câmera</p>
        </div>

        {/* Link + Copy */}
        <div className="mb-3">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono mb-1 block">Seu link</label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 min-w-0 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-300 font-mono truncate focus:outline-none focus:border-[#00E5B2]/50"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopyLink}
              disabled={!inviteLink}
              className="shrink-0 px-2.5 py-1.5 rounded text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              style={{
                background: linkCopied ? 'rgba(0, 200, 83, 0.18)' : 'rgba(0, 229, 178, 0.12)',
                color: linkCopied ? '#00C853' : '#00E5B2',
                border: `1px solid ${linkCopied ? 'rgba(0, 200, 83, 0.4)' : 'rgba(0, 229, 178, 0.3)'}`,
              }}
              title="Copiar link"
            >
              {linkCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{linkCopied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={handleShareWhatsApp}
            disabled={!inviteLink}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-all disabled:opacity-40"
            title="Enviar pelo WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleShareEmail}
            disabled={!inviteLink}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium bg-slate-700/50 text-slate-200 border border-slate-600/50 hover:bg-slate-700/80 transition-all disabled:opacity-40"
            title="Enviar por email"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
          <button
            onClick={handleShareNative}
            disabled={!inviteLink}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium bg-[#4FE0C1]/15 text-[#4FE0C1] border border-[#4FE0C1]/30 hover:bg-[#4FE0C1]/25 transition-all disabled:opacity-40"
            title="Compartilhar (sistema)"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Outros</span>
          </button>
        </div>

        {/* Hint */}
        <div
          className="mt-3 px-2.5 py-1.5 rounded text-[10px] text-slate-400 leading-relaxed"
          style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(51, 65, 85, 0.5)' }}
        >
          💡 Quando o paciente clicar no link, ele cai numa tela de cadastro vinculada a você como médico indicador. Mais rápido que preencher cadastro manual aqui no app.
        </div>
      </div>
    </div>
  )
}
