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

  // V1.9.306 — Labels canônicos pras Perguntas Objetivas (antes era key.replace
  // '_' → ' ' que deixava "medicacoes regulares" em lowercase sem acento).
  // Pedro identificou pós-retrofix Maria 16/05.
  const PERGUNTA_LABELS: Record<string, string> = {
    alergias: 'Alergias',
    medicacoes_regulares: 'Medicações Regulares',
    medicacoes_esporadicas: 'Medicações Esporádicas',
    cirurgias: 'Cirurgias Prévias',
    historico_familiar: 'Histórico Familiar',
    historico_pessoal: 'Histórico Pessoal'
  }
  const labelFromKey = (key: string): string =>
    PERGUNTA_LABELS[key] ||
    key.replace(/_/g, ' ').replace(/(^|\s)\S/g, t => t.toUpperCase())
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
    <div className="space-y-3 text-sm text-brand-text-secondary">
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
              <p><span className="text-brand-text-muted">Descrição:</span> {strip(dev.descricao)}</p>
            )}
            {dev.localizacao && (
              <p><span className="text-brand-text-muted">Localização:</span> {strip(dev.localizacao)}</p>
            )}
            {dev.inicio && (
              <p><span className="text-brand-text-muted">Início:</span> {strip(dev.inicio)}</p>
            )}
            {/* V1.9.305 — múltiplos sintomas/fatores em bullet (antes join vírgula virava texto corrido) */}
            {Array.isArray(dev.sintomas_associados) && dev.sintomas_associados.length > 0 && (
              <div>
                <span className="text-brand-text-muted">Sintomas Associados:</span>
                <ul className="ml-3 mt-0.5 space-y-0.5">
                  {stripList(dev.sintomas_associados).map((s: string, i: number) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-slate-500 mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(dev.fatores_melhora) && dev.fatores_melhora.length > 0 && (
              <div>
                <span className="text-green-400">▲ Melhora:</span>
                <ul className="ml-3 mt-0.5 space-y-0.5">
                  {stripList(dev.fatores_melhora).map((s: string, i: number) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-green-500/60 mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(dev.fatores_piora) && dev.fatores_piora.length > 0 && (
              <div>
                <span className="text-red-400">▼ Piora:</span>
                <ul className="ml-3 mt-0.5 space-y-0.5">
                  {stripList(dev.fatores_piora).map((s: string, i: number) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-red-500/60 mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* V1.9.304 (16/05) — Bloco "História / Anamnese (legado)" REMOVIDO.
          Redundante com "História Patológica Pregressa" abaixo + formatação
          pipes (|) confundia clinicamente. Pedro identificou após retrofix Maria.
          Memory: feedback_dry_run_mental + project_v1_9_303_captation_buffer.
          historyLegacy ainda é populado pelo parser pra compatibilidade — só
          não renderizamos mais visualmente. */}

      {/* História Patológica Pregressa */}
      {/* V1.9.305 — itens em bullet list (antes era join(', ') que virava texto
          corrido de 1500+ chars quando tinham >5 doenças crônicas. Caso Maria
          16/05: 13 itens incluindo DRC + cardiopatia + polimialgia ficavam
          ilegíveis. Pedro identificou empíricamente. */}
      {hpp.length > 0 && (
        <div className="border-l-2 border-orange-500/50 pl-3">
          <strong className="text-orange-400 text-xs uppercase tracking-wider">
            História Patológica Pregressa ({hpp.length})
          </strong>
          <ul className="mt-1 space-y-1">
            {stripList(hpp).map((item: string, i: number) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* História Familiar */}
      {/* V1.9.305 — bullet quando >1 item por lado (antes vírgula concatenada) */}
      {(matSide.length > 0 || patSide.length > 0) && (
        <div className="border-l-2 border-pink-500/50 pl-3">
          <strong className="text-pink-400 text-xs uppercase tracking-wider">História Familiar</strong>
          <div className="mt-1 space-y-2">
            {matSide.length > 0 && (
              <div>
                <span className="text-brand-text-muted">Materno:</span>
                {matSide.length === 1 ? (
                  <span> {stripList(matSide)[0]}</span>
                ) : (
                  <ul className="ml-3 mt-0.5 space-y-0.5">
                    {stripList(matSide).map((s: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-pink-500/60 mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {patSide.length > 0 && (
              <div>
                <span className="text-brand-text-muted">Paterno:</span>
                {patSide.length === 1 ? (
                  <span> {stripList(patSide)[0]}</span>
                ) : (
                  <ul className="ml-3 mt-0.5 space-y-0.5">
                    {stripList(patSide).map((s: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-pink-500/60 mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
                  <span className="text-brand-text-muted">{labelFromKey(key)}:</span> {strip(val)}
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
