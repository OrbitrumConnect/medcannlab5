import { useNavigate } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { LandingHeader } from '../components/landing/LandingHeader'
import { PerfilSwitcher } from '../components/landing/PerfilSwitcher'
import { HeroSection } from '../components/landing/HeroSection'
import { ProofBlock } from '../components/landing/ProofBlock'
import { PricingBlock } from '../components/landing/PricingBlock'
import { CTABlock } from '../components/landing/CTABlock'

const LandingMedico = () => {
  const navigate = useNavigate()

  useSEO({
    title: 'Plataforma para Médicos Cannabis Medicinal | MedCannLab Pro',
    description: 'Atenda pacientes pré-organizados pelo método AEC. Receita CFM digital ICP-Brasil, teleconsulta CFM 2.314 compliant, split automático 70/30. Sua consulta começa onde a entrevista terminou.',
    keywords: 'médico cannabis medicinal, prescrição CFM digital, teleconsulta médica, telemedicina, ICP-Brasil receita, prontuário médico',
    canonical: 'https://medcannlab.com.br/medico',
  })

  const goToRegister = () => navigate('/?cadastro=profissional')
  const goToLogin = () => navigate('/?login=1')

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      <LandingHeader onLoginClick={goToLogin} />
      <div className="pt-16">
        <PerfilSwitcher ativo="medico" />

        <HeroSection
          perfil="medico"
          badge="Para profissionais"
          headline="Sua consulta começa onde a entrevista terminou."
          subhead="Cada paciente chega com história clínica organizada pelo método AEC — queixa, histórico, alergias e medicações já estruturados. Você foca no que importa: decisão clínica."
          ctaPrimary={{ label: 'Solicitar acesso profissional', onClick: goToRegister }}
          ctaSecondary={{ label: 'Já tenho conta', onClick: goToLogin }}
        />

        <ProofBlock
          perfil="medico"
          title="Pré-consulta estruturada + execução clínica"
          subtitle="Médicos gastam 15-20 min por consulta organizando informação básica. Em 20 atendimentos/semana, são 5h perdidas."
          items={[
            'Relatório clínico estruturado antes da consulta',
            'Prescrição digital conforme CFM (ICP-Brasil, nível 3)',
            'Teleconsulta integrada (CFM 2.314/2022 compliant)',
            'Split automático 70/30 — sem secretária, sem operação manual',
          ]}
        />

        <PricingBlock
          perfil="medico"
          title="Pro MedCannLab"
          subtitle="Ferramenta clínica completa para profissionais independentes"
          price="R$ 99,90"
          priceUnit="/mês"
          priceNote="Consultas: você recebe 70% automaticamente — R$ 245 líquido por consulta R$ 350"
          includes={[
            'Prontuário NLP estruturado pré-consulta',
            'Assinatura digital ICP-Brasil + Receita CFM',
            'Agenda + teleconsulta integradas',
            'Liquidação Connect 70/30 automática',
            'Sem limite de pacientes ou agendamentos',
          ]}
          ctaLabel="Solicitar análise (48h)"
          onCtaClick={goToRegister}
          highlight="ACESSO PROFISSIONAL"
        />

        <CTABlock
          perfil="medico"
          title="Atenda quem já sabe o que precisa."
          subtitle="Pacientes que chegam pré-organizados. Sua agenda livre de coleta repetida. Sua consulta no seu controle."
          ctaLabel="Solicitar acesso"
          onCtaClick={goToRegister}
        />
      </div>
    </div>
  )
}

export default LandingMedico
