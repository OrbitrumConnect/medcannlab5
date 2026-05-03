import { useNavigate } from 'react-router-dom'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { PerfilSwitcher } from '@/components/landing/PerfilSwitcher'
import { HeroSection } from '@/components/landing/HeroSection'
import { ProofBlock } from '@/components/landing/ProofBlock'
import { PricingBlock } from '@/components/landing/PricingBlock'
import { CTABlock } from '@/components/landing/CTABlock'

const LandingPaciente = () => {
  const navigate = useNavigate()

  const goToRegister = () => navigate('/?cadastro=paciente')
  const goToLogin = () => navigate('/?login=1')

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      <LandingHeader onLoginClick={goToLogin} />
      <div className="pt-16">
        <PerfilSwitcher ativo="paciente" />

        <HeroSection
          perfil="paciente"
          badge="Para você que busca cuidado"
          headline="Organize sua história clínica antes da consulta."
          subhead="Em vez de pesquisar sintomas soltos no Google, converse com a Nôa Esperanza e leve um relatório estruturado para o seu médico — método AEC do Dr. Ricardo Valença, 40 anos validados."
          ctaPrimary={{ label: 'Iniciar avaliação grátis', onClick: goToRegister }}
          ctaSecondary={{ label: 'Já tenho conta', onClick: goToLogin }}
        />

        <ProofBlock
          perfil="paciente"
          title="Por que organizar sua história antes?"
          subtitle="Você ganha clareza. Seu médico ganha tempo. A consulta rende mais."
          items={[
            'Conversa guiada pela Nôa — sem julgamento, no seu ritmo',
            'Relatório clínico estruturado com sua queixa, histórico e contexto',
            'Compartilhamento direto com médicos parceiros da plataforma',
            'Acompanhamento contínuo com histórico cronológico completo',
          ]}
        />

        <PricingBlock
          perfil="paciente"
          title="Plano Paciente"
          subtitle="Acesso à plataforma + Nôa Esperanza + relatórios estruturados"
          price="R$ 60"
          priceUnit="/mês"
          priceNote="Consultas com médicos parceiros: a partir de R$ 350, cobradas pelo profissional"
          includes={[
            'Avaliação Clínica com método AEC',
            'Relatórios estruturados ilimitados',
            'Histórico criptografado e seu',
            'Agendamento direto com especialistas',
          ]}
          ctaLabel="Começar agora"
          onCtaClick={goToRegister}
        />

        <CTABlock
          perfil="paciente"
          title="Sua próxima consulta começa aqui."
          subtitle="Faça sua primeira avaliação gratuita. Em 5 minutos você tem um relatório estruturado pronto para um médico avaliar."
          ctaLabel="Começar grátis agora"
          onCtaClick={goToRegister}
        />
      </div>
    </div>
  )
}

export default LandingPaciente
