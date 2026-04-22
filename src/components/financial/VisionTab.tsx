import { Lightbulb, Users, Target, Zap } from 'lucide-react'

export function VisionTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-500/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">🌱 Modelo de Negócio Sustentável - Nôa Esperanza</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-5 border border-green-500/20">
            <h3 className="text-lg font-bold text-green-400 mb-4">💰 Receitas Sustentáveis</h3>
            <div className="space-y-3">
              {[
                ['Assinaturas Educacionais', 'Conteúdo exclusivo sobre saúde sustentável e práticas ecológicas'],
                ['Consultoria em Sustentabilidade', 'Serviços para reduzir pegada de carbono no setor de saúde'],
                ['Marketplace Sustentável', 'Plataforma para produtos e serviços ecológicos'],
                ['Licenciamento de IA', 'Tecnologia Nôa Esperanza para instituições parceiras'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-2">
                  <span className="text-green-400 text-lg">✓</span>
                  <div>
                    <h4 className="text-white font-semibold text-sm">{title}</h4>
                    <p className="text-gray-400 text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-blue-500/20">
            <h3 className="text-lg font-bold text-blue-400 mb-4">🤝 Impacto Social e Equidade</h3>
            <div className="space-y-3">
              {[
                [Lightbulb, 'Programas Educacionais', 'Workshops e capacitação em práticas sustentáveis'],
                [Users, 'Plataforma Comunitária', 'Fóruns de discussão e troca de conhecimento'],
                [Target, 'Iniciativas de Saúde Comunitária', 'Programas focados em equidade e acessibilidade'],
                [Zap, 'Parcerias Público-Privadas', 'Colaboração com governos e organizações'],
              ].map(([Icon, title, desc]: any) => (
                <div key={title} className="flex items-start gap-2">
                  <Icon className="text-blue-400 mt-1" size={18} />
                  <div>
                    <h4 className="text-white font-semibold text-sm">{title}</h4>
                    <p className="text-gray-400 text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800 rounded-lg p-4 border border-green-500/20">
            <h4 className="text-gray-400 text-xs mb-1">Receita Recorrente</h4>
            <p className="text-2xl font-bold text-green-400">0%</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-blue-500/20">
            <h4 className="text-gray-400 text-xs mb-1">Parcerias Ativas</h4>
            <p className="text-2xl font-bold text-blue-400">12+</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-purple-500/20">
            <h4 className="text-gray-400 text-xs mb-1">Redução Carbono</h4>
            <p className="text-2xl font-bold text-purple-400">-23%</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-orange-500/20">
            <h4 className="text-gray-400 text-xs mb-1">Impacto Social</h4>
            <p className="text-2xl font-bold text-orange-400">850+</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-blue-400 font-semibold mb-3">💡 Visão Estratégica: Marketplace Médico Sustentável</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p className="font-semibold mb-2">Receitas Diversificadas:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 text-xs">
              <li>Assinaturas mensais (R$150-350)</li>
              <li>Consultas virtuais e presenciais</li>
              <li>Licenciamento de IA Nôa Esperanza</li>
              <li>Consultoria em sustentabilidade</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Impacto Mensurável:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 text-xs">
              <li>Redução de deslocamentos (telemedicina)</li>
              <li>Acesso democratizado à saúde</li>
              <li>Educação continuada em práticas ecológicas</li>
              <li>Parcerias público-privadas escaláveis</li>
            </ul>
          </div>
        </div>
        <p className="text-gray-300 text-xs mt-4 pt-4 border-t border-blue-500/20">
          <strong>Escalabilidade:</strong> O modelo combina receita recorrente (assinaturas), receita transacional (consultas) e receita de impacto (licenciamento). <strong>Nôa Esperanza</strong> é o diferencial que conecta todos os atores deste ecossistema.
        </p>
      </div>
    </div>
  )
}
