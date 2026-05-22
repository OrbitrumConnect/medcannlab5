import { useNavigate } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { LandingHeader } from '../components/landing/LandingHeader'
import { PerfilSwitcher } from '../components/landing/PerfilSwitcher'
import { HeroSection } from '../components/landing/HeroSection'
import { ProofBlock } from '../components/landing/ProofBlock'
import { PricingBlock } from '../components/landing/PricingBlock'
import { CTABlock } from '../components/landing/CTABlock'

const LandingAluno = () => {
  const navigate = useNavigate()

  useSEO({
    title: 'Simulador Clínico Médico Grátis | 20 Personas-Pacientes — MedCannLab',
    description: 'Treine entrevista clínica gratuitamente com 20 personas-pacientes. Método AEC do Dr. Ricardo Valença, 40 anos de prática. Validação por matrícula universitária.',
    keywords: 'simulador clínico, simulador médico online, anamnese, entrevista clínica, método AEC, estudante medicina, treino médico',
    canonical: 'https://medcannlab.com.br/aluno',
  })

  const goToRegister = () => navigate('/?cadastro=aluno')
  const goToLogin = () => navigate('/?login=1')

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      <LandingHeader onLoginClick={goToLogin} />
      <div className="pt-16">
        <PerfilSwitcher ativo="aluno" />

        <HeroSection
          perfil="aluno"
          badge="Para estudantes de medicina"
          headline="Treine a entrevista clínica com 20 personas-pacientes."
          subhead="Simulador clínico autêntico baseado no método AEC do Dr. Ricardo Valença. Faça 1 simulação e 1 teste de nivelamento gratuitos — basta validar sua matrícula."
          ctaPrimary={{ label: 'Treinar gratuitamente', onClick: goToRegister }}
          ctaSecondary={{ label: 'Já tenho conta', onClick: goToLogin }}
        />

        <ProofBlock
          perfil="aluno"
          title="O simulador médico mais real que você vai treinar"
          subtitle="20 personas-pacientes desenvolvidas com 40 anos de método clínico — não é roteiro decorado, é entrevista real."
          items={[
            'Simulador interativo com 20 personas (Paula, João, Maria...)',
            'Teste de nivelamento adaptativo (20 questões, 30 min)',
            'Relatório de desempenho personalizado pós-simulação',
            'Acesso à biblioteca clínica curada por especialistas',
          ]}
        />

        <PricingBlock
          perfil="aluno"
          title="Plano Acadêmico"
          subtitle="Acesso completo aos cursos EAD, simulador e biblioteca"
          price="R$ 149,90"
          priceUnit="/mês"
          priceNote="Acesso vitalício à base Biblioteca MedCannLab"
          includes={[
            'Todos os cursos EAD (familiares e clínicos)',
            'Simulador completo com 20 personas',
            'Testes de nivelamento ilimitados',
            'Biblioteca avançada e fórum educacional',
            'Certificados ao concluir cursos',
          ]}
          ctaLabel="Acessar formação"
          onCtaClick={goToRegister}
          highlight="ACESSO EDUCACIONAL"
        />

        <CTABlock
          perfil="aluno"
          title="Pratique antes de atender."
          subtitle="Treine entrevista clínica de verdade — gratuitamente — com validação da sua matrícula universitária."
          ctaLabel="Começar simulação grátis"
          onCtaClick={goToRegister}
        />
      </div>
    </div>
  )
}

export default LandingAluno
