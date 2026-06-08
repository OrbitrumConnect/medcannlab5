/**
 * RenalSuggestionsCardElite — V1.9.609 (preview, gated).
 *
 * Wrapper ELITE do Sidecar Renal: soma 2 camadas ao RenalSuggestionsCard SEM TOCÁ-LO.
 *   ① Sinais Precoces (pré-laboratório) — Oportunidade A da reunião 05/06 (capta risco
 *      ANTES da creatinina: cálculo/IRA de repetição/dor lombar/disúria). SCAFFOLD —
 *      a captação real (parser do renal-signal-extractor) aguarda GO Ricardo + slug-test.
 *   ② Estagiamento (RenalSuggestionsCard existente, BYTE-IDÊNTICO) — eGFR → G1-G5.
 *   ③ Conduta & Evidência (referência) — Oportunidade B: CBD p/ sintomas em DRC com
 *      CITAÇÃO REAL do corpus (Ho et al 2019, indexado na Curadoria) + alerta AINEs +
 *      CBG marcado como INVESTIGAÇÃO (não recomendação). Validação Dr. Ricardo pendente.
 *
 * ZERO REGRESSÃO: o card real (camada ②) é renderizado intacto. Live só mostra esta versão
 * com `?renal_elite=1` (default = card normal). Conteúdo clínico é DRAFT auditor-safe.
 * Anti-overclaim: nada aqui é diagnóstico nem prescrição; CBG é hipótese (1 menção no corpus).
 *
 * ⏳ GATE TEMPORÁRIO — TRIGGER DE REMOÇÃO (evita flag "almost-merged forever"):
 *   • POSITIVO: remover o gate (virar default) quando Ricardo aprovar o conteúdo empíricamente
 *   • NEGATIVO: se não houver decisão até 13/06/2026, REVERTER este wrapper e voltar ao card
 *     original (não deixar gate inativo apodrecendo no código). Decisão registrada na memória.
 */
import RenalSuggestionsCard from './RenalSuggestionsCard'
import { Activity, FlaskConical, ShieldAlert, BookOpen, Sparkles } from 'lucide-react'

const SINAIS_PRECOCES = ['Cálculo renal', 'IRA de repetição', 'Dor lombar', 'Disúria']

export default function RenalSuggestionsCardElite() {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/50 via-emerald-950/10 to-slate-900/50 p-3 flex flex-col gap-3">

      {/* ① SINAIS PRECOCES — pré-laboratório (Oportunidade A, scaffold) */}
      {/* V1.9.620 fontes acessiveis (Ricardo mal enxergava no laptop) */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <h4 className="text-sm font-semibold text-emerald-200 uppercase tracking-wide">Sinais precoces</h4>
          <span className="text-xs text-emerald-300/60 italic">risco antes da creatinina</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SINAIS_PRECOCES.map((s) => (
            <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-slate-800/60 border border-emerald-500/20 text-slate-300">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-start gap-1.5">
          <FlaskConical className="w-3.5 h-3.5 text-emerald-400/70 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed italic">
            Captação semântica do relato — <strong>em desenvolvimento</strong> (aguarda validação clínica + parser). Estágios 1-3 não-DM/HAS.
          </p>
        </div>
      </div>

      {/* ② ESTAGIAMENTO — card real, INTOCADO */}
      <RenalSuggestionsCard compact />

      {/* ③ CONDUTA & EVIDÊNCIA — referência (Oportunidade B, auditor-safe) */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-3">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Conduta &amp; evidência</h4>
          <span className="text-xs text-slate-500 italic">referência — não é prescrição</span>
        </div>

        {/* base sólida: CBD p/ sintomas (corpus) */}
        <div className="flex items-start gap-2 mb-2">
          <Activity className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-emerald-200">CBD</strong> — manejo de sintomas em DRC (dor, prurido, náusea, insônia)
            <span className="text-slate-500"> · Ho et al 2019, revisão sistemática</span>
          </p>
        </div>

        {/* alerta de segurança (fato) */}
        <div className="flex items-start gap-2 mb-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-300 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200/90 leading-relaxed">
            <strong>AINEs contraindicados</strong> em DRC ≥ G3b · THC: cautela
          </p>
        </div>

        {/* fronteira de pesquisa: CBG (investigação, NÃO recomendação) */}
        <div className="flex items-start gap-2 mb-3">
          <FlaskConical className="w-3.5 h-3.5 text-cyan-300 mt-0.5 shrink-0" />
          <p className="text-xs text-cyan-200/80 leading-relaxed">
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold">🔬 investigação</span>{' '}
            CBG — potencial anti-inflamatório <strong>em estudo</strong> (não recomendação)
          </p>
        </div>

        <a
          href="/app/clinica/profissional/dashboard?section=knowledge"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 hover:scale-[1.02] transition-all"
        >
          <BookOpen className="w-4 h-4" /> Ver evidência na Curadoria
        </a>

        <p className="mt-2 text-xs text-slate-500 italic leading-relaxed">
          Referência clínica — não constitui diagnóstico nem prescrição. Validação Dr. Ricardo Valença pendente. CBG: hipótese (evidência limitada).
        </p>
      </div>
    </div>
  )
}
