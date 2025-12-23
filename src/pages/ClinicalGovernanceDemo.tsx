/**
 * Clinical Governance Demo - ATUALIZADA com Especialidades
 * Mostra diferentes especialidades analisando os mesmos pacientes
 */

import { useState } from 'react'
import { ContextAnalysisCard } from '../components/ClinicalGovernance/ContextAnalysisCard'
import { useClinicalGovernance } from '../hooks/useClinicalGovernance'
import type { PatientContext } from '../lib/clinicalGovernance'
import type { Specialty } from '../lib/clinicalGovernance/utils/specialtyConfigs'
import { Brain, Stethoscope, Activity, Heart } from 'lucide-react'

// Mock data
const mockPatientStable: PatientContext = {
    patientId: 'patient-stable',
    currentAssessment: {
        id: 'assess-1',
        imreData: {
            integrativa: {},
            multidimensional: {},
            renal: {
                creatinina: 1.2,
                tfg: 75,
                proteinuria: 'negativa'
            },
            existencial: {}
        },
        createdAt: new Date(),
        professionalId: 'prof-1'
    },
    prescriptionHistory: [],
    kpiHistory: [
        { type: 'creatinina', value: 1.2, date: new Date(), trend: 'stable' as const }
    ],
    timeContext: {
        treatmentDuration: 60,
        lastModification: new Date(),
        changeFrequency: 1,
        daysSinceLastChange: 30
    }
}

const mockPatientCritical: PatientContext = {
    patientId: 'patient-critical',
    currentAssessment: {
        id: 'assess-2',
        imreData: {
            integrativa: {},
            multidimensional: {},
            renal: {
                creatinina: 2.5,
                tfg: 45,
                proteinuria: 'positiva'
            },
            existencial: {}
        },
        createdAt: new Date(),
        professionalId: 'prof-1'
    },
    prescriptionHistory: [
        { id: '1', medications: {}, protocolType: 'cannabis', createdAt: new Date('2024-09-01') },
        { id: '2', medications: {}, protocolType: 'cannabis', createdAt: new Date('2024-10-01') },
        { id: '3', medications: {}, protocolType: 'cannabis', createdAt: new Date('2024-11-01') }
    ],
    kpiHistory: [
        { type: 'creatinina', value: 2.0, date: new Date('2024-10-01'), trend: 'up' as const },
        { type: 'creatinina', value: 2.3, date: new Date('2024-11-01'), trend: 'up' as const },
        { type: 'creatinina', value: 2.5, date: new Date('2024-12-01'), trend: 'up' as const },
        { type: 'tfg', value: 60, date: new Date('2024-10-01'), trend: 'down' as const },
        { type: 'tfg', value: 50, date: new Date('2024-11-01'), trend: 'down' as const },
        { type: 'tfg', value: 45, date: new Date('2024-12-01'), trend: 'down' as const }
    ],
    timeContext: {
        treatmentDuration: 90,
        lastModification: new Date('2024-11-01'),
        changeFrequency: 3,
        daysSinceLastChange: 50
    }
}

const mockPatientCannabis: PatientContext = {
    patientId: 'patient-cannabis',
    currentAssessment: {
        id: 'assess-cannabis',
        imreData: { integrativa: {}, multidimensional: {}, renal: { creatinina: 1.0, tfg: 90, proteinuria: 'negativa' }, existencial: {} },
        createdAt: new Date(),
        professionalId: 'prof-cannabis'
    },
    prescriptionHistory: [
        { id: '1', medications: {}, protocolType: 'cannabis', createdAt: new Date('2024-10-01') },
        { id: '2', medications: {}, protocolType: 'cannabis', createdAt: new Date('2024-11-01') }
    ],
    kpiHistory: [
        { type: 'dose_thc', value: 10, date: new Date('2024-10-01'), trend: 'stable' },
        { type: 'dose_thc', value: 25, date: new Date('2024-11-01'), trend: 'up' }, // Dose subiu muito
        { type: 'eva_dor', value: 8, date: new Date('2024-10-01'), trend: 'stable' },
        { type: 'eva_dor', value: 8, date: new Date('2024-11-01'), trend: 'stable' }, // Dor não melhorou
        { type: 'efeitos_colaterais', value: 2, date: new Date('2024-10-01'), trend: 'stable' },
        { type: 'efeitos_colaterais', value: 6, date: new Date('2024-11-01'), trend: 'up' } // Efeitos colaterais subiram
    ],
    timeContext: {
        treatmentDuration: 60,
        lastModification: new Date('2024-11-01'),
        changeFrequency: 2,
        daysSinceLastChange: 30
    }
}

const mockPatientPsychiatry: PatientContext = {
    patientId: 'patient-psych',
    currentAssessment: {
        id: 'assess-psych',
        imreData: {
            integrativa: {},
            multidimensional: {},
            renal: { creatinina: 1.0, tfg: 90, proteinuria: 'negativa' },
            existencial: {},
            psiquiatria: { ideacao_suicida: true } // Gatilho Crítico
        },
        createdAt: new Date(),
        professionalId: 'prof-psych'
    },
    prescriptionHistory: [],
    kpiHistory: [
        { type: 'gad7', value: 12, date: new Date('2024-10-01'), trend: 'stable' },
        { type: 'gad7', value: 18, date: new Date('2024-11-01'), trend: 'up' }, // Piora grave
        { type: 'ideacao_suicida', value: 1, date: new Date('2024-11-01'), trend: 'up' }
    ],
    timeContext: {
        treatmentDuration: 30,
        lastModification: new Date(),
        changeFrequency: 1,
        daysSinceLastChange: 10
    }
}

const SPECIALTY_OPTIONS: { value: Specialty; label: string; icon: any, color: string }[] = [
    { value: 'nefrologia', label: 'Nefrologia', icon: Stethoscope, color: 'blue' },
    { value: 'cannabis', label: 'Cannabis', icon: Activity, color: 'green' },
    { value: 'psiquiatria', label: 'Psiquiatria', icon: Brain, color: 'purple' },
    { value: 'dor_cronica', label: 'Dor Crônica', icon: Heart, color: 'red' },
    { value: 'odontologia', label: 'Odontologia', icon: Stethoscope, color: 'cyan' },
    { value: 'dermatologia', label: 'Dermatologia', icon: Activity, color: 'pink' },
    { value: 'geral', label: 'Clínico Geral', icon: Stethoscope, color: 'gray' }
]

export default function ClinicalGovernanceDemo() {
    const [selectedCase, setSelectedCase] = useState<'stable' | 'critical'>('stable')
    const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty>('nefrologia')

    // Lógica inteligente para escolher o paciente de teste baseado na especialidade e caso
    let patientContext = selectedCase === 'stable' ? mockPatientStable : mockPatientCritical

    // Override para especialidades específicas (para demonstrar a lógica)
    if (selectedSpecialty === 'cannabis') {
        patientContext = mockPatientCannabis
    } else if (selectedSpecialty === 'psiquiatria') {
        patientContext = mockPatientPsychiatry
    }

    const { analysis, loading } = useClinicalGovernance(patientContext, {
        specialty: selectedSpecialty
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Brain className="w-12 h-12 text-purple-400" />
                        <h1 className="text-4xl font-bold text-white">Clinical Governance Engine</h1>
                    </div>
                    <p className="text-gray-400">
                        Adaptive Clinical Decision Support System (ACDSS)
                    </p>
                    <p className="text-sm text-purple-400 mt-2 font-semibold">
                        ✨ NOVO: Análise personalizada por especialidade
                    </p>
                </div>

                {/* Specialty Selector */}
                <div className="mb-6">
                    <h3 className="text-white font-semibold mb-3 text-center">Selecione a Especialidade:</h3>
                    <div className="grid grid-cols-7 gap-2">
                        {SPECIALTY_OPTIONS.map(spec => {
                            const Icon = spec.icon
                            const isActive = selectedSpecialty === spec.value
                            return (
                                <button
                                    key={spec.value}
                                    onClick={() => setSelectedSpecialty(spec.value)}
                                    className={`p-4 rounded-lg transition-all ${isActive
                                        ? `bg-${spec.color}-600 shadow-lg shadow-${spec.color}-900/50`
                                        : 'bg-gray-800 hover:bg-gray-700'
                                        }`}
                                >
                                    <Icon className="w-6 h-6 mx-auto mb-2 text-white" />
                                    <p className="text-xs text-white font-medium text-center">{spec.label}</p>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Case Selector */}
                <div className="mb-8 flex gap-4 justify-center">
                    <button
                        onClick={() => setSelectedCase('stable')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${selectedCase === 'stable'
                            ? 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Caso Estável
                    </button>
                    <button
                        onClick={() => setSelectedCase('critical')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${selectedCase === 'critical'
                            ? 'bg-red-600 text-white shadow-lg shadow-red-900/50'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Caso Crítico
                    </button>
                </div>

                {/* Analysis Card */}
                <ContextAnalysisCard analysis={analysis} loading={loading} />

                {/* Raw Output */}
                {analysis && (
                    <div className="mt-8 p-6 bg-gray-900/50 rounded-lg border border-gray-700/30">
                        <h3 className="text-white font-semibold mb-3">Output Completo (Debug)</h3>
                        <pre className="text-xs text-gray-300 overflow-auto max-h-96">
                            {JSON.stringify(analysis, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Info */}
                <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
                    <p className="text-sm text-blue-300">
                        💡 <strong>Como funciona:</strong> O sistema analisa dados do paciente e personaliza a análise baseado na especialidade do profissional.
                        Cada especialidade vê apenas indicadores relevantes para sua área. Threshold conservador de 70%+ garante segurança.
                    </p>
                </div>
            </div>
        </div>
    )
}
