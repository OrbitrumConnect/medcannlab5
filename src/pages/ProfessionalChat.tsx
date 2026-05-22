import React from 'react'
import ProfessionalChatSystem from '../components/ProfessionalChatSystem'

const ProfessionalChat: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-text mb-2">👥 Chat com Profissionais</h1>
        <p className="text-brand-text-muted">
          Comunicação segura entre consultórios da plataforma MedCannLab
        </p>
      </div>

      <ProfessionalChatSystem />
    </div>
  )
}

export default ProfessionalChat
