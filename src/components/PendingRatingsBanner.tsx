import React, { useState } from 'react'
import { Star, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePendingRatings, type PendingRating } from '../hooks/usePendingRatings'
import RatingModal from './RatingModal'

/**
 * V1.9.145 — PendingRatingsBanner
 *
 * Banner CTA mostrado pro paciente quando há consulta concluída aguardando avaliação.
 * Usa usePendingRatings hook (Realtime subscribe) + RatingModal pra avaliar.
 *
 * Pacient sees:
 *   - Banner com nome do profissional + CTA "Avaliar agora"
 *   - Click → abre RatingModal
 *   - Pós-submit → hook atualiza via Realtime, banner desaparece
 *   - Click X → dismiss local (banco continua pending até paciente avaliar OU expirar 7d)
 *
 * Uso típico:
 *   <PendingRatingsBanner />  (em Layout, PatientDashboard, ou qualquer página paciente)
 */

const PendingRatingsBanner: React.FC = () => {
  const { user } = useAuth()
  const { pendingRatings, dismiss, refresh } = usePendingRatings(user?.id)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPending, setSelectedPending] = useState<PendingRating | null>(null)

  // Só exibe pra paciente
  if (!user?.id || user?.type !== 'patient') return null
  if (pendingRatings.length === 0) return null

  const next = pendingRatings[0]
  const remaining = pendingRatings.length

  const openModal = (p: PendingRating) => {
    setSelectedPending(p)
    setModalOpen(true)
  }

  const handleSuccess = () => {
    if (selectedPending) {
      dismiss(selectedPending.appointment_id)
    }
    refresh()
  }

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-amber-100 text-sm font-semibold truncate">
            Avalie sua consulta com {next.professional_name}
          </p>
          <p className="text-amber-200/70 text-[11px] mt-0.5">
            Sua opinião nos ajuda a melhorar.{' '}
            {remaining > 1 && `(+${remaining - 1} pendente${remaining > 2 ? 's' : ''})`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal(next)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-950 bg-amber-300 hover:bg-amber-200 transition-colors shrink-0"
        >
          Avaliar
        </button>
        <button
          type="button"
          onClick={() => dismiss(next.appointment_id)}
          className="text-amber-300/60 hover:text-amber-100 transition-colors shrink-0"
          aria-label="Dispensar (você ainda pode avaliar depois)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {selectedPending && (
        <RatingModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedPending(null)
          }}
          appointmentId={selectedPending.appointment_id}
          patientId={selectedPending.patient_id}
          professionalId={selectedPending.professional_id}
          professionalName={selectedPending.professional_name ?? 'Profissional'}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}

export default PendingRatingsBanner
