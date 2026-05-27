import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText as DollarSign,
  ArrowLeft,
  CheckCircle,
  BookOpen,
  MessageCircle,
  FileText as FlaskConical,
  BarChart3,
  Heart,
  Activity,
  Globe
} from 'lucide-react'

/**
 * CidadeAmigaDosRinsInstitucional — V1.9.463 (27/05/2026)
 *
 * Página separada B2B / Institucional / ESG — extraída de CidadeAmigaDosRins.tsx
 * conforme decisão Pedro 27/05 noite² ("oq sobrear high-tech pro elit prossiga").
 *
 * Contém conteúdo PARQUEADO ate Marco 1+ (CNPJ João Vidal regularizado):
 *   1. Sistema de Captação de Recursos (R$ 50k-200k investimento, modelos B2B)
 *   2. Implementação Atividades Sustentabilidade (5 cards genéricos COP26/ESG)
 *   3. Parcerias Institucionais CTA (Investir/Aderir/Apresentar)
 *
 * Princípios aplicados:
 *  - feedback_uso_zero_nao_e_morto: preservar trabalho histórico Ricardo (não destruir)
 *  - feedback_doc_institucional_sem_pat_nao_e_valido_23_05: marcar claramente como
 *    "Visão Institucional / B2B" pra leitor entender contexto
 *  - feedback_anti_overclaim_endorsements: badges "Em desenvolvimento" / "Planejado"
 *    preservados onde existem
 *  - project_marca_medcannlab_brandbook_v3_22_05: paleta cool preservada
 *
 * Origem do conteúdo: provavelmente herdou pitch MUHDO 08/05 + agenda ESG
 * (artigo "After COP26 NEJM") trazida pelo Dr. Ricardo em fase anterior.
 *
 * Trigger pra reativar conteúdo no produto principal: CNPJ regularizado
 * + decisão estratégica Pedro+Ricardo+João Vidal sobre pitch B2B.
 */
const CidadeAmigaDosRinsInstitucional: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#00E5B2]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#00E5B2] font-mono font-semibold">
                Visão Institucional · B2B · ESG
              </span>
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Cidade Amiga dos Rins — Modelos de Negócio Sustentável
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-3xl">
            Conteúdo institucional alinhado com princípios do artigo
            <em> "After COP26 — Putting Health and Equity at the Center of the Climate Movement"</em>.
            Modelos de captação de recursos, parcerias público-privadas, programas educacionais e
            implementação de atividades sustentáveis. <strong>Aguardando regularização institucional para ativação operacional.</strong>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">

        {/* Sistema de Captação de Recursos — movido de CidadeAmigaDosRins.tsx linhas 1027-1097 */}
        <div className="bg-slate-800 rounded-xl p-6 md:p-8 border border-slate-700">
          <div className="flex items-center space-x-3 mb-6">
            <DollarSign className="w-7 h-7 text-[#00E5B2]" />
            <h3 className="text-xl md:text-2xl font-bold text-white">Sistema de Captação de Recursos</h3>
          </div>

          <div className="bg-[rgba(0,229,178,0.06)] rounded-lg p-5 mb-6 border border-[rgba(0,229,178,0.25)]">
            <h4 className="text-base md:text-lg font-semibold text-white mb-3">Modelos de Negócio Sustentável</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Estratégias de desenvolvimento sustentável alinhadas com os princípios de equidade, inovação e mobilização
              de organizações públicas e privadas, baseadas em evidências científicas do artigo "After COP26 — Putting
              Health and Equity at the Center of the Climate Movement".
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-slate-700/40 rounded-lg p-5 border border-[rgba(0,229,178,0.25)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-white">Plataforma de Assinaturas Educacional</h4>
                <span className="px-2.5 py-0.5 bg-[rgba(0,229,178,0.15)] border border-[rgba(0,229,178,0.4)] text-[#00E5B2] rounded-full text-[10px] font-semibold uppercase tracking-wider">Ativo</span>
              </div>
              <div className="space-y-3 mb-4">
                <p className="text-sm text-slate-300">Investimento estimado: R$ 50.000 – R$ 200.000</p>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className="bg-[#00E5B2] h-1.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-[11px] text-slate-400">Progresso de Implementação: 85%</p>
                <p className="text-sm text-slate-300">Conteúdo exclusivo sobre saúde sustentável e práticas ecológicas</p>
                <div className="bg-slate-800/60 rounded p-3 border border-slate-700">
                  <p className="text-[11px] font-semibold text-slate-300 mb-2 uppercase tracking-wider">Benefícios Principais</p>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li>• Receita contínua</li>
                    <li>• Disseminação de conhecimento</li>
                    <li>• Educação continuada</li>
                  </ul>
                </div>
              </div>
              <button
                disabled
                className="w-full bg-[rgba(0,229,178,0.10)] border border-[rgba(0,229,178,0.45)] text-[#00E5B2] px-4 py-2 rounded-lg font-semibold transition-all opacity-60 cursor-not-allowed"
                title="Aguardando regularização institucional"
              >
                Em breve — Aguardando CNPJ
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-700/40 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-white">Consultoria em Sustentabilidade para Saúde</h5>
                  <span className="px-2 py-0.5 bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 rounded-full text-[10px] font-semibold uppercase tracking-wider">Em dev</span>
                </div>
              </div>
              <div className="bg-slate-700/40 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-white">Marketplace de Produtos Sustentáveis</h5>
                  <span className="px-2 py-0.5 bg-purple-500/15 border border-purple-500/40 text-purple-300 rounded-full text-[10px] font-semibold uppercase tracking-wider">Planejado</span>
                </div>
              </div>
              <div className="bg-slate-700/40 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-white">Licenciamento de IA para Saúde Sustentável</h5>
                  <span className="px-2 py-0.5 bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 rounded-full text-[10px] font-semibold uppercase tracking-wider">Em dev</span>
                </div>
              </div>
              <div className="bg-slate-700/40 rounded-lg p-4 border border-[rgba(0,229,178,0.25)]">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-white">Parcerias Público-Privadas</h5>
                  <span className="px-2 py-0.5 bg-[rgba(0,229,178,0.15)] border border-[rgba(0,229,178,0.4)] text-[#00E5B2] rounded-full text-[10px] font-semibold uppercase tracking-wider">Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Implementação das Atividades Alinhadas com Sustentabilidade — movido linhas 1185-1318 */}
        <div className="bg-slate-800 rounded-xl p-6 md:p-8 border border-slate-700">
          <div className="flex items-center space-x-3 mb-6">
            <Activity className="w-7 h-7 text-[#00E5B2]" />
            <h3 className="text-xl md:text-2xl font-bold text-white">Implementação das Atividades Alinhadas com Sustentabilidade</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[
              { icon: BookOpen, title: 'Programas Educacionais', desc: 'Treinamento em práticas sustentáveis e equidade na saúde', items: ['Workshops presenciais', 'Seminários online', 'Cursos especializados'] },
              { icon: MessageCircle, title: 'Plataforma de Interação Comunitária', desc: 'Discussão e troca sobre saúde e sustentabilidade', items: ['Fóruns de discussão', 'Sessões Q&A', 'Grupos temáticos'] },
              { icon: FlaskConical, title: 'Pesquisa Colaborativa', desc: 'Colaboração entre instituições de pesquisa e ONGs', items: ['Conferências', 'Grupos de trabalho', 'Publicações conjuntas'] },
              { icon: BarChart3, title: 'Ferramentas de Monitoramento', desc: 'Ferramentas digitais para práticas sustentáveis', items: ['Aplicativos móveis', 'Sistemas software', 'Dashboards'] },
              { icon: Heart, title: 'Saúde Comunitária', desc: 'Programas com foco em equidade e sustentabilidade', items: ['Organizações locais', 'Serviços acessíveis', 'Iniciativas populares'] }
            ].map(({ icon: Icon, title, desc, items }) => (
              <div key={title} className="bg-slate-700/40 rounded-lg p-5 border border-[rgba(0,229,178,0.20)]">
                <div className="flex items-center space-x-3 mb-3">
                  <Icon className="w-5 h-5 text-[#00E5B2]" />
                  <h4 className="text-sm font-semibold text-white">{title}</h4>
                </div>
                <p className="text-slate-400 text-xs mb-3">{desc}</p>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {items.map((it) => (
                    <li key={it} className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-[#00E5B2] flex-shrink-0" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Parcerias Institucionais CTA — movido linhas 1320-1345 */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/60 rounded-xl p-6 md:p-8 border border-[rgba(0,229,178,0.25)]">
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Parcerias Institucionais</h3>
            <p className="text-slate-400 text-sm md:text-base max-w-3xl mx-auto">
              Modelo de negócio sustentável baseado nos princípios do artigo "After COP26",
              promovendo saúde, equidade e sustentabilidade através de parcerias estratégicas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto">
            <button
              disabled
              className="bg-[rgba(0,229,178,0.10)] border border-[rgba(0,229,178,0.45)] text-[#00E5B2] px-4 py-3 rounded-lg font-semibold transition-all opacity-60 cursor-not-allowed text-sm"
              title="Aguardando regularização institucional"
            >
              Investir na Plataforma
            </button>
            <button
              disabled
              className="bg-[rgba(0,229,178,0.10)] border border-[rgba(0,229,178,0.45)] text-[#00E5B2] px-4 py-3 rounded-lg font-semibold transition-all opacity-60 cursor-not-allowed text-sm"
              title="Aguardando regularização institucional"
            >
              Aderir a um Plano
            </button>
            <button
              disabled
              className="bg-[rgba(0,229,178,0.10)] border border-[rgba(0,229,178,0.45)] text-[#00E5B2] px-4 py-3 rounded-lg font-semibold transition-all opacity-60 cursor-not-allowed text-sm"
              title="Aguardando regularização institucional"
            >
              Agendar Apresentação
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-500 mt-5 italic">
            Botões serão ativados após regularização institucional (CNPJ + estrutura fiscal MedCannLab).
          </p>
        </div>

        {/* Footer nav */}
        <div className="pt-4 border-t border-slate-700/50">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#00E5B2] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Cidade Amiga dos Rins
          </button>
        </div>
      </div>
    </div>
  )
}

export default CidadeAmigaDosRinsInstitucional
