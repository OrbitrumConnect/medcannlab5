import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Stethoscope, Users, Brain, Shield, Award, Zap } from 'lucide-react'

const Home: React.FC = () => {
  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Cursos Especializados',
      description: 'Arte da Entrevista Clínica e Pós-Graduação Cannabis com metodologia AEC',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'IA Residente Nôa',
      description: 'Assistente médica multimodal com chat, voz e vídeo integrados',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <Stethoscope className="w-8 h-8" />,
      title: 'Avaliação Clínica',
      description: 'Sistema IMRE Triaxial com 28 blocos clínicos especializados',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Dashboards Especializados',
      description: 'Interfaces personalizadas para pacientes, médicos e administradores',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Privacidade Blockchain',
      description: 'NFTs "Escute-se" para compartilhamento seguro de dados sensíveis',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Certificações',
      description: 'Sistema de progresso, badges e certificações profissionais',
      color: 'from-yellow-500 to-yellow-600'
    }
  ]

  const stats = [
    { number: '240+', label: 'Artigos Científicos' },
    { number: '28', label: 'Blocos Clínicos IMRE' },
    { number: '520h', label: 'Pós-Graduação Cannabis' },
    { number: '100%', label: 'LGPD Compliant' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-6">
              <span className="text-gradient">MedCannLab 3.0</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
              A plataforma mais avançada de avaliação clínica, ensino médico e IA residente
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 italic">
              "Bons ventos soprem" - Transformando a medicina com tecnologia e humanização
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center group"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                to="/courses"
                className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center"
              >
                Ver Cursos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-100/50 dark:bg-slate-800/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-4">
              Funcionalidades Avançadas
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Uma plataforma completa que integra ensino, pesquisa e prática clínica
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card card-hover p-6 group"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center text-slate-900 dark:text-white mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
            Pronto para revolucionar sua prática médica?
          </h2>
          <p className="text-xl text-slate-900 dark:text-white/90 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de profissionais que já transformaram sua forma de aprender e praticar medicina
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="bg-slate-800 text-primary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-colors duration-200 inline-flex items-center justify-center group"
            >
              Começar Gratuitamente
              <Zap className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform duration-200" />
            </Link>
            <Link
              to="/clinical-assessment"
              className="border-2 border-white text-slate-900 dark:text-white hover:bg-slate-800 hover:text-primary-600 font-semibold py-4 px-8 rounded-lg transition-colors duration-200"
            >
              Testar Avaliação Clínica
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
