import React from 'react'
import { AlertCircle } from 'lucide-react'
import { stripPlatformInjectionNoise } from '../lib/clinicalAssessmentFlow'
import { unwrapAecContent } from '../lib/clinicalScoreCalculator'

/**
 * Visualização SOBERANA E IMUTÁVEL do relatório clínico.
 * Estética bloqueada (referência: foto enviada pelo Pedro em 22/04/2026):
 *  - Bordas verticais coloridas por seção (verde, azul, roxo, âmbar, laranja, rosa, teal, ciano, índigo)
 *  - Headers em uppercase tracking-wider
 *  - Indicadores ▲ Melhora / ▼ Piora
 *  - Blocos sempre nessa ordem: Queixa → Lista Indiciária → Desenvolvimento → História → HPP → Familiar → Hábitos → Perguntas Objetivas → Consenso → Avaliação → Plano
 *
 * Reutilizado em ClinicalReports.tsx e PatientAnalytics.tsx para garantir
 * uma única fonte visual da verdade.
 */

function strip(s: unknown): string {
  return stripPlatformInjectionNoise(String(s ?? ''))
}

function stripList(arr: unknown): string[] {
  if (!Array.isArray(arr)) return []
  return arr.map((x) => strip(x)).filter((t) => t.length > 0)
}

function stripListaIndiciariaItem(item: unknown): string {
  if (item && typeof item === 'object' && 'label' in item && (item as { label?: unknown }).label != null) {
    return strip((item as { label: unknown }).label)
  }
  return strip(typeof item === 'object' ? JSON.stringify(item) : item)
}

interface RichClinicalReportViewProps {
  /** Conteúdo do relatório (pode ser legado ou Pipeline Master v2 nested) */
  content: Record<string, any> | null | undefined
  /** Avaliação livre (assessment) e Plano - opcionais (campos mapeados pelo backend) */
  assessment?: string
  plan?: string
}

const RichClinicalReportView: React.FC<RichClinicalReportViewProps> = ({ content, assessment, plan }) => {
  const aec = unwrapAecContent(content) || {}

  const queixaPrincipal = strip(aec.queixa_principal || aec.chief_complaint || aec.chiefComplaint || aec.mainComplaint || '')
  const listaIndiciaria = Array.isArray(aec.lista_indiciaria) ? aec.lista_indiciaria : []
  const dev = aec.desenvolvimento_queixa || {}
  const historyLegacy = strip(aec.history)
  const hpp = Array.isArray(aec.historia_patologica_pregressa) ? aec.historia_patologica_pregressa : []
  const familiar = aec.historia_familiar || {}
  const matSide = Array.isArray(familiar.lado_materno) ? familiar.lado_materno : []
  const patSide = Array.isArray(familiar.lado_paterno) ? familiar.lado_paterno : []
  const habitos = Array.isArray(aec.habitos_vida) ? aec.habitos_vida : []
  const perguntas = aec.perguntas_objetivas && typeof aec.perguntas_objetivas === 'object' ? aec.perguntas_objetivas : null
  const consenso = aec.consenso

  const isEmpty =
    !queixaPrincipal &&
    listaIndiciaria.length === 0 &&
    !dev?.descricao && !dev?.localizacao && !dev?.inicio &&
    !historyLegacy &&
    hpp.length === 0 &&
    matSide.length === 0 && patSide.length === 0 &&
    habitos.length === 0 &&
    !perguntas && !consenso &&
    !assessment && !plan

  if (isEmpty) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p className="text-amber-400 text-sm font-medium">Relatório sem dados clínicos</p>
        <p className="text-slate-500 text-xs mt-1">Este relatório foi gerado sem dados da avaliação AEC.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm text-slate-300">
      {/* Queixa Principal */}
      {queixaPrincipal && (
        <div className="border-l-2 border-emerald-500/50 pl-3">
          <strong className="text-emerald-400 text-xs uppercase tracking-wider">Queixa Principal</strong>
          <p className="mt-1">{queixaPrincipal}</p>
        </div>
      )}

      {/* Lista Indiciária */}
      {listaIndiciaria.length > 0 && (
        <div className="border-l-2 border-blue-500/50 pl-3">
          <strong className="text-blue-400 text-xs uppercase tracking-wider">
            Lista Indiciária ({listaIndiciaria.length} queixas)
          </strong>
          <ul className="mt-1 space-y-1">
            {listaIndiciaria.map((item: any, i: number) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{stripListaIndiciariaItem(item)}</span>
                {typeof item === 'object' && item?.intensity && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                    {strip(item.intensity)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Desenvolvimento da Queixa */}
      {(dev.descricao || dev.localizacao || dev.inicio ||
        (Array.isArray(dev.sintomas_associados) && dev.sintomas_associados.length > 0) ||
        (Array.isArray(dev.fatores_melhora) && dev.fatores_melhora.length > 0) ||
        (Array.isArray(dev.fatores_piora) && dev.fatores_piora.length > 0)) && (
        <div className="border-l-2 border-purple-500/50 pl-3">
          <strong className="text-purple-400 text-xs uppercase tracking-wider">Desenvolvimento da Queixa</strong>
          <div className="mt-1 space-y-1">
            {dev.descricao && (
              <p><span className="text-slate-400">Descrição:</span> {strip(dev.descricao)}</p>
            )}
            {dev.localizacao && (
              <p><span className="text-slate-400">Localização:</span> {strip(dev.localizacao)}</p>
            )}
            {dev.inicio && (
              <p><span className="text-slate-400">Início:</span> {strip(dev.inicio)}</p>
            )}
            {Array.isArray(dev.sintomas_associados) && dev.sintomas_associados.length > 0 && (
              <p>
                <span className="text-slate-400">Sintomas Associados:</span>{' '}
                {stripList(dev.sintomas_associados).join(', ')}
              </p>
            )}
            {Array.isArray(dev.fatores_melhora) && dev.fatores_melhora.length > 0 && (
              <p>
                <span className="text-green-400">▲ Melhora:</span>{' '}
                {stripList(dev.fatores_melhora).join(', ')}
              </p>
            )}
            {Array.isArray(dev.fatores_piora) && dev.fatores_piora.length > 0 && (
              <p>
                <span className="text-red-400">▼ Piora:</span>{' '}
                {stripList(dev.fatores_piora).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* História / Anamnese (legado) */}
      {historyLegacy && (
        <div className="border-l-2 border-amber-500/50 pl-3">
          <strong className="text-amber-400 text-xs uppercase tracking-wider">História / Anamnese</strong>
          <p className="mt-1 whitespace-pre-wrap">{historyLegacy}</p>
        </div>
      )}

      {/* História Patológica Pregressa */}
      {hpp.length > 0 && (
        <div className="border-l-2 border-orange-500/50 pl-3">
          <strong className="text-orange-400 text-xs uppercase tracking-wider">História Patológica Pregressa</strong>
          <p className="mt-1">{stripList(hpp).join(', ')}</p>
        </div>
      )}

      {/* História Familiar */}
      {(matSide.length > 0 || patSide.length > 0) && (
        <div className="border-l-2 border-pink-500/50 pl-3">
          <strong className="text-pink-400 text-xs uppercase tracking-wider">História Familiar</strong>
          <div className="mt-1 space-y-1">
            {matSide.length > 0 && (
              <p><span className="text-slate-400">Materno:</span> {stripList(matSide).join(', ')}</p>
            )}
            {patSide.length > 0 && (
              <p><span className="text-slate-400">Paterno:</span> {stripList(patSide).join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Hábitos de Vida */}
      {habitos.length > 0 && (
        <div className="border-l-2 border-teal-500/50 pl-3">
          <strong className="text-teal-400 text-xs uppercase tracking-wider">Hábitos de Vida</strong>
          <p className="mt-1">{stripList(habitos).join(', ')}</p>
        </div>
      )}

      {/* Perguntas Objetivas */}
      {perguntas && Object.keys(perguntas).length > 0 && (
        <div className="border-l-2 border-cyan-500/50 pl-3">
          <strong className="text-cyan-400 text-xs uppercase tracking-wider">Perguntas Objetivas</strong>
          <div className="mt-1 space-y-1">
            {Object.entries(perguntas).map(([key, val]: [string, any]) => (
              val && (
                <p key={key}>
                  <span className="text-slate-400">{key.replace(/_/g, ' ')}:</span> {strip(val)}
                </p>
              )
            ))}
          </div>
        </div>
      )}

      {/* Consenso */}
      {consenso && (
        <div className="border-l-2 border-indigo-500/50 pl-3">
          <strong className="text-indigo-400 text-xs uppercase tracking-wider">Consenso</strong>
          <p className="mt-1">
            {consenso.aceito ? '✅ Aceito pelo paciente' : '⏳ Pendente'}
            {typeof consenso.revisoes_realizadas === 'number' && consenso.revisoes_realizadas > 0 && ` • ${consenso.revisoes_realizadas} revisões`}
          </p>
        </div>
      )}

      {/* Avaliação */}
      {assessment && (
        <div className="border-l-2 border-amber-500/50 pl-3">
          <strong className="text-amber-400 text-xs uppercase tracking-wider">Avaliação</strong>
          <p className="mt-1 whitespace-pre-wrap">{assessment}</p>
        </div>
      )}

      {/* Plano */}
      {plan && (
        <div className="border-l-2 border-green-500/50 pl-3">
          <strong className="text-green-400 text-xs uppercase tracking-wider">Plano</strong>
          <p className="mt-1 whitespace-pre-wrap">{plan}</p>
        </div>
      )}
    </div>
  )
}

export default RichClinicalReportView
