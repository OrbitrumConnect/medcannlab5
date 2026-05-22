// =============================================================================
// NoaChatHelpModal — V1.9.54
// =============================================================================
// Modal acionado pelo botão "?" no header do chat da Nôa Esperança.
// Mostra apenas a aba do perfil ativo (paciente / professional / admin / aluno)
// para evitar confusão com instruções de outros papéis.
//
// Conteúdo coerente com:
//   - V1.9.49: gate de role em racionalidades (paciente nunca, profissional/admin sim)
//   - V1.9.52: identity + clinical no buildAdminContext
//   - V1.9.53: regra de ouro do prompt (escopo legítimo vs fora do escopo)
//   - Plano dos 3 modos: AEC coleta / Chat orienta / Racionalidade interpreta /
//     Pedagógico transversal
// =============================================================================

import React from 'react'
import { X, BookOpen, Stethoscope, ShieldCheck, GraduationCap, MessageSquare } from 'lucide-react'

export type NoaHelpRole = 'patient' | 'professional' | 'admin' | 'student' | 'unknown'

interface NoaChatHelpModalProps {
  isOpen: boolean
  onClose: () => void
  role: NoaHelpRole
}

const ROLE_TITLES: Record<NoaHelpRole, string> = {
  patient: 'Como usar a Nôa — Paciente',
  professional: 'Como usar a Nôa — Profissional / Médico',
  admin: 'Como usar a Nôa — Administrador',
  student: 'Como usar a Nôa — Aluno',
  unknown: 'Como usar a Nôa',
}

const ROLE_ICONS: Record<NoaHelpRole, React.ReactNode> = {
  patient: <BookOpen className="w-5 h-5 text-emerald-400" />,
  professional: <Stethoscope className="w-5 h-5 text-emerald-400" />,
  admin: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
  student: <GraduationCap className="w-5 h-5 text-emerald-400" />,
  unknown: <MessageSquare className="w-5 h-5 text-emerald-400" />,
}

interface Section {
  title: string
  items: Array<{ label?: string; text: string } | string>
}

const ROLE_SECTIONS: Record<NoaHelpRole, Section[]> = {
  patient: [
    {
      title: 'O que a Nôa faz',
      items: [
        'Ouve sua queixa de forma estruturada (Avaliação Clínica AEC).',
        'Organiza seu histórico para o médico ler antes da consulta.',
        'Te ajuda a agendar consultas e navegar pela plataforma.',
      ],
    },
    {
      title: 'Como iniciar uma avaliação',
      items: [
        { label: 'Comando', text: '"iniciar avaliação", "fazer entrevista clínica"' },
      ],
    },
    {
      title: 'Comandos úteis',
      items: [
        '"agendar consulta" — abre card de agendamento',
        '"abrir meus agendamentos" — vai para sua agenda',
        '"minha biblioteca" — abre material educativo',
        '"meus relatórios" — lista suas avaliações',
      ],
    },
    {
      title: 'O que ela NÃO faz',
      items: [
        'Não prescreve medicamentos.',
        'Não fecha diagnóstico.',
        'Não substitui consulta médica — toda orientação é educacional.',
      ],
    },
  ],
  professional: [
    {
      title: 'O que a Nôa faz',
      items: [
        'Assistente clínica para discussão de casos e gestão da plataforma.',
        'Aplica racionalidades médicas (biomédica, MTC, ayurvédica, homeopática, integrativa) sobre relatórios.',
      ],
    },
    {
      title: 'Comandos de navegação',
      items: [
        '"abrir terminal de atendimento"',
        '"ver pacientes ativos"',
        '"agenda do dia" / "abrir agendamentos"',
        '"ver relatórios" / "abrir relatórios clínicos"',
      ],
    },
    {
      title: 'Workflow clínico',
      items: [
        '"aplicar racionalidade [biomédica / MTC / ayurvédica / homeopática / integrativa]" — recebe insumo epistemológico (não conduta).',
        '"abrir prescrição" — vai para tela de receituário.',
        '"assinar documento" — fluxo ICP-Brasil.',
      ],
    },
    {
      title: 'O que ela NÃO faz',
      items: [
        'Não substitui sua decisão clínica.',
        'Racionalidades são conhecimento estruturado de cada escola médica, não conduta automática.',
      ],
    },
  ],
  admin: [
    {
      title: 'O que a Nôa faz',
      items: [
        'Assistente administrativa com métricas reais da plataforma.',
        'Identifica seu nome e perfil quando perguntada.',
      ],
    },
    {
      title: 'Identificação e métricas',
      items: [
        '"me identifique" / "quem sou eu" — diz seu nome e perfil.',
        '"quantos pacientes ativos"',
        '"quantos relatórios temos no total"',
        '"transações pendentes" / "atividade hoje"',
      ],
    },
    {
      title: 'Navegação',
      items: [
        '"abrir biblioteca", "ver agendamentos", "abrir terminal", "abrir relatórios".',
      ],
    },
    {
      title: 'Limites',
      items: [
        'Bloqueia tópicos fora do escopo (carros, política, futebol, etc.).',
        'Quando dado de plataforma não está disponível no contexto, redireciona para a tela do painel — não bloqueia.',
      ],
    },
  ],
  student: [
    {
      title: 'O que a Nôa faz',
      items: [
        'Assistente pedagógica para aprendizado do método AEC.',
        'Atua como paciente fictício em simulação (Paula, João, Maria, etc.) para você praticar a entrevista clínica.',
      ],
    },
    {
      title: 'Modos pedagógicos',
      items: [
        '"iniciar simulação" — Nôa vira paciente, você é o médico.',
        '"teste de nivelamento" — 20 questões adaptativas (~30min).',
        'Estudo livre: pode discutir doses, condutas, diagnósticos diferenciais como conteúdo educacional (modo aprendizado).',
      ],
    },
    {
      title: 'Cursos',
      items: [
        '"abrir catálogo de cursos"',
        '"abrir Jardins de Cura" — curso AEC essencial.',
      ],
    },
  ],
  unknown: [
    {
      title: 'Sobre a Nôa Esperança',
      items: [
        'IA Residente da plataforma MedCannLab.',
        'Para acessar instruções específicas do seu perfil, faça login com sua conta de Paciente, Profissional, Aluno ou Admin.',
      ],
    },
  ],
}

const NoaChatHelpModal: React.FC<NoaChatHelpModalProps> = ({ isOpen, onClose, role }) => {
  if (!isOpen) return null

  const title = ROLE_TITLES[role] ?? ROLE_TITLES.unknown
  const icon = ROLE_ICONS[role] ?? ROLE_ICONS.unknown
  const sections = ROLE_SECTIONS[role] ?? ROLE_SECTIONS.unknown

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-5 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              {icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Guia rápido de uso do chat da Nôa para o seu perfil.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-sm font-semibold text-emerald-400 mb-2">{section.title}</h3>
              <ul className="space-y-1.5">
                {section.items.map((item, j) => {
                  if (typeof item === 'string') {
                    return (
                      <li key={j} className="text-sm text-slate-300 leading-relaxed pl-4 relative before:content-['•'] before:text-emerald-500 before:absolute before:left-0">
                        {item}
                      </li>
                    )
                  }
                  return (
                    <li key={j} className="text-sm text-slate-300 leading-relaxed pl-4 relative before:content-['•'] before:text-emerald-500 before:absolute before:left-0">
                      {item.label && <span className="text-emerald-300 font-medium">{item.label}: </span>}
                      <span>{item.text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 italic">
              A Nôa coleta, organiza e orienta. Decisão clínica final pertence ao médico responsável.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoaChatHelpModal
