/**
 * V1.9.121-B — AEC Promotion Hint (FASE 1+2 polish)
 *
 * Card sugestão azul informativo. Aparece quando aecPromotionDetector
 * dispara. Click envia texto canônico ASSESSMENT_START (P8 reuso).
 *
 * V1.9.121-B: texto explicita "modo livre" (sem registro) e "reiniciar"
 * (transparência) — feedback empírico Ricardo 04/05/2026 testando como
 * Carolina. Princípio P10 anti-substituição-silenciosa: paciente sabe
 * que vai reiniciar e que ficará salvo oficialmente.
 */
import { RefreshCw, Sparkles } from 'lucide-react'

interface Props {
  onAccept: () => void
  onDismiss?: () => void
}

export function AecPromotionHint({ onAccept, onDismiss }: Props) {
  return (
    <div
      className="flex justify-start w-full my-2 animate-in fade-in slide-in-from-bottom-2"
      data-testid="aec-promotion-hint"
    >
      <div className="w-full max-w-[85%] sm:max-w-[80%] bg-blue-500/10 border border-blue-500/30 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-full flex-shrink-0">
              <Sparkles className="w-6 h-6 text-blue-300" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-blue-100 text-base">
                Sugestão da Nôa
              </h3>
              <p className="text-blue-200/90 text-sm leading-relaxed">
                Estamos em <strong>chat livre</strong> — esta conversa <em>não fica registrada</em> como avaliação clínica.
              </p>
              <p className="text-blue-200/90 text-sm leading-relaxed">
                Posso <strong>reiniciar</strong> como uma <strong>Avaliação Clínica Inicial</strong> estruturada? Você confirma cada parte e ela fica salva oficialmente para compartilhar com seu médico.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-blue-950/30 p-3 sm:p-4 border-t border-blue-500/20 flex justify-end gap-2">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-2 text-blue-300/70 hover:text-blue-200 text-sm rounded-lg transition-colors"
            >
              Agora não
            </button>
          )}
          <button
            onClick={onAccept}
            className="bg-blue-500/30 hover:bg-blue-500/50 text-blue-100 border border-blue-400/40 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reiniciar como Avaliação Clínica Inicial
          </button>
        </div>
      </div>
    </div>
  )
}
