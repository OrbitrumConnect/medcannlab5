import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ResearchWorkstation from '../components/ResearchWorkstation'
import { useDashboardTriggers } from '../contexts/DashboardTriggersContext'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'

interface PesquisaDashboardProps {
  initialTab?: string
}

const PesquisaDashboard: React.FC<PesquisaDashboardProps> = ({ initialTab }) => {
  // Limpar triggers antigos ao montar, já que o Workstation tem sua própria navegação
  const { setDashboardTriggers } = useDashboardTriggers()
  const { openChat, closeChat, isOpen } = useNoaPlatform()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Definir triggers mínimos ou nulos, já que o workstation é autocontido
    setDashboardTriggers(null)
    return () => setDashboardTriggers(null)
  }, [setDashboardTriggers])

  // V1.9.382 — Query param ?section= override do initialTab da rota.
  // Permite trigger Terminal de Atendimento → Nôa Matrix navegar via:
  //   /app/pesquisa/profissional/dashboard?section=noa-matrix&patientId=X
  // Sem precisar criar rota dedicada. Cores existentes preservadas.
  const sectionOverride = searchParams.get('section') || undefined
  const effectiveTab = sectionOverride || initialTab

  return <ResearchWorkstation initialTab={effectiveTab} />
}

export default PesquisaDashboard
