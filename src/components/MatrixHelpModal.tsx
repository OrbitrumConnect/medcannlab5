// =============================================================================
// MatrixHelpModal — V1.9.454
// =============================================================================
// Modal acionado pelo botão "?" no header da Nôa Matrix Z2 (research mode).
// Mostra modo de uso profissional/elite: como organizar corpus marcado, como
// a Matrix responde (3 cenários V1.9.453-A/B), o que ela NÃO faz, exemplos
// de perguntas úteis.
//
// Princípio polir-não-inventar: visual coerente com NoaChatHelpModal V1.9.54
// (mesma paleta emerald, mesma estrutura X header / sections / body), mas
// conteúdo dedicado a pesquisa Matrix Z2 (não confundir com chat Nôa).
//
// Pedro empíricamente pediu 25/05/2026: "trigger que abre card explicativo
// pro elit". Substitui bloco "Como funciona" fixo do topo do NoaMatrixView
// por linha compacta + ícone (?) clicável.
//
// Princípios cristalizados refletidos no conteúdo:
// - "Sustentar lacuna sem colapsar" (V1.9.453)
// - Taxonomia 3 cenários (V1.9.453-A)
// - Negação explícita ≠ campo ausente (V1.9.453-B)
// - "Matrix prolonga 1 contexto, Casos Similares infere entre contextos"
//   (memory feedback_matrix_prolonga_vs_casos_similares_infere_20_05)
// =============================================================================

import React from 'react'
import { X, Sparkles, Database, Search, ShieldAlert, MessageCircleQuestion, Lightbulb } from 'lucide-react'

interface MatrixHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Section {
  icon: React.ReactNode
  title: string
  items: Array<{ label?: string; text: string } | string>
}

const SECTIONS: Section[] = [
  {
    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
    title: 'O que é a Nôa Matrix Z2',
    items: [
      'Chat de pesquisa não-diretivo focado em organizar raciocínio clínico.',
      'Lê APENAS o material que você marcar — não acessa todo o banco.',
      'Ajuda a comparar, agrupar e citar casos/papers/documentos.',
      'NÃO sugere conduta, NÃO infere diagnóstico, NÃO substitui sua decisão.',
    ],
  },
  {
    icon: <Database className="w-5 h-5 text-emerald-400" />,
    title: 'Como montar o corpus marcado',
    items: [
      { label: 'Buscar paciente ou caso', text: 'No painel "Buscar paciente ou caso" no topo, busque por nome do paciente OU termo clínico (ex: "dor lombar"). Click no resultado seleciona o caso + carrega contexto longitudinal do paciente.' },
      { label: 'Casos Similares', text: 'Aba "Casos Similares" lista casos análogos com racionalidades aplicadas. Click no card marca como corpus.' },
      { label: 'PubMed', text: 'Painel "Buscar literatura PubMed" — busca artigos científicos por termo. Anexa papers ao corpus pra contextualizar.' },
      { label: 'Base de Conhecimento', text: 'Acervo institucional (Doc #A1, #A2...) anexável ao corpus pra referência estrutural.' },
      { label: 'Selecionar pra Matrix', text: 'IMPORTANTE: aparecer no "Material disponível" não basta. Click no card pra SELECIONAR (fica destacado roxo). Só selecionados vão pro contexto da conversa.' },
    ],
  },
  {
    icon: <MessageCircleQuestion className="w-5 h-5 text-emerald-400" />,
    title: 'Como a Matrix responde (3 cenários)',
    items: [
      { label: 'Ausência total', text: 'Se a seção pedida não aparece em nenhum card marcado, a Matrix diz "lacuna observacional" — honestidade epistemológica.' },
      { label: 'Presença parcial', text: 'Se há menção pontual em 1 card, a Matrix cita literal: "Há menção no Caso #X (data): \'...\'. É a única informação no corpus marcado."' },
      { label: 'Cobertura completa', text: 'Se há múltiplas menções, a Matrix estrutura por caso/data sem interpolar — cada caso é unidade narrativa separada.' },
      { label: 'Negação explícita', text: 'Se um campo tem "não" ou "nenhuma" (ex: "alergias: não"), isso É dado clínico relevante — a Matrix cita como Cenário B, não trata como ausência.' },
    ],
  },
  {
    icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
    title: 'O que a Matrix NÃO faz',
    items: [
      'NÃO diagnostica nem sugere hipótese clínica ("quadro compatível com X").',
      'NÃO prescreve conduta nem terapia.',
      'NÃO inventa dados que não estão no corpus marcado.',
      'NÃO conecta especulativamente itens diferentes do corpus.',
      'NÃO categoriza por doença antes que você o faça.',
      'NÃO age como chat clínico paciente — esta é pesquisa Z2 estrutural.',
    ],
  },
  {
    icon: <Lightbulb className="w-5 h-5 text-emerald-400" />,
    title: 'Exemplos de perguntas úteis',
    items: [
      '"Compare a queixa principal dos Casos #X e #Y ao longo do tempo."',
      '"Qual a evolução cronológica das racionalidades aplicadas nesse paciente?"',
      '"Quais fatores de melhora/piora aparecem em comum nos casos marcados?"',
      '"Há tensão entre a racionalidade Integrativa (data X) e Biomédica (data Y)?"',
      '"O que o Paper PMID NNN traz que pode informar minha leitura desse caso?"',
      '"Liste as menções de história familiar no corpus, citando casos."',
    ],
  },
  {
    icon: <Search className="w-5 h-5 text-emerald-400" />,
    title: 'Diferença: Matrix × Casos Similares',
    items: [
      { label: 'Casos Similares', text: 'Busca empírica — encontra casos análogos por termo/nome. Infere similaridade entre pacientes diferentes (operação cognitiva: extensão).' },
      { label: 'Nôa Matrix', text: 'Análise estrutural — organiza corpus marcado pelo médico. Prolonga um contexto único (operação cognitiva: profundidade).' },
      'Usa as duas combinadas: Casos Similares pra encontrar material → Matrix pra estruturar análise sobre material marcado.',
    ],
  },
]

export const MatrixHelpModal: React.FC<MatrixHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-emerald-500/20 bg-slate-900/95 backdrop-blur-md rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Nôa Matrix — Modo de uso profissional</h2>
              <p className="text-xs text-emerald-300/70 mt-0.5">
                Z2 estrutural · pesquisa não-diretiva · organiza corpus marcado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sections */}
        <div className="p-5 space-y-6">
          {SECTIONS.map((section, idx) => (
            <section key={idx} className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                {section.icon}
                <h3 className="text-base font-semibold text-emerald-100">{section.title}</h3>
              </div>
              <ul className="space-y-2 ml-1">
                {section.items.map((item, i) => {
                  if (typeof item === 'string') {
                    return (
                      <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                        <span className="text-emerald-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    )
                  }
                  return (
                    <li key={i} className="text-sm text-slate-300 leading-relaxed">
                      {item.label && (
                        <span className="text-emerald-300 font-medium">{item.label}: </span>
                      )}
                      <span>{item.text}</span>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}

          {/* Footer princípio */}
          <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <p className="text-sm text-emerald-200 italic leading-relaxed">
              <strong className="not-italic font-semibold">Princípio nuclear:</strong> Sustentar lacuna sem colapsar.
              A Matrix organiza o que existe no corpus marcado — NÃO preenche o que falta.
              Honestidade epistemológica &gt; parecer útil. Interpretação clínica é responsabilidade do médico.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
