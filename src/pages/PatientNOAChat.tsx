import React from 'react'
import NOAChatBox from '../components/NOAChatBox'

const PatientNOAChat: React.FC = () => {
  return (
    <div className="bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">🤖 NOA Esperanza</h1>
            <p className="text-slate-300 text-lg">Sua Assistente Médica Inteligente</p>
          </div>
          
          <NOAChatBox />
        </div>
      </div>
    </div>
  )
}

export default PatientNOAChat
