import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, FileText, AlertTriangle, Scale, Brain } from 'lucide-react'

const TermosDeUso: React.FC = () => {
  return (
    <div className="min-h-screen text-white font-sans" style={{ background: 'linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #0A192F 100%)' }}>
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-white">MedCannLab</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <FileText className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
          <p className="text-slate-400">Última atualização: 01 de Abril de 2026</p>
        </div>

        <div className="space-y-8">
          {/* Seção 1 */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              1. Objeto e Natureza do Serviço
            </h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>A <strong className="text-white">MedCannLab</strong> é uma plataforma de tecnologia SaaS (Software as a Service) que oferece ferramentas de inteligência artificial clínica, intermediação de agendamentos e suporte educacional na área de saúde.</p>
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mt-4">
                <p className="text-yellow-300 text-xs font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" /> AVISO FUNDAMENTAL
                </p>
                <p className="text-slate-300 text-sm">A MedCannLab <strong className="text-white">NÃO</strong> presta ato médico, <strong className="text-white">NÃO</strong> diagnostica doenças e <strong className="text-white">NÃO</strong> opera como Clínica Médica ou Plano de Saúde Suplementar. Todo ato terapêutico é de responsabilidade civil e autônoma do profissional parceiro conectado à plataforma.</p>
              </div>
            </div>
          </section>

          {/* Seção 2 */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">2. Elegibilidade e Cadastro</h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>Para utilizar a plataforma, o Usuário deve:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Ter no mínimo 18 (dezoito) anos de idade ou estar acompanhado de responsável legal;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Fornecer informações verdadeiras, completas e atualizadas no momento do cadastro;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Profissionais de saúde devem possuir registro ativo no conselho de classe competente (CRM, CRO, CRP, CRF);</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Manter a confidencialidade de suas credenciais de acesso.</li>
              </ul>
            </div>
          </section>

          {/* Seção 3 */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">3. Tipos de Usuário</h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>A plataforma reconhece os seguintes perfis:</p>
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                  <h3 className="font-bold text-emerald-400 mb-2">Paciente</h3>
                  <p className="text-xs">Acesso às avaliações clínicas com a IA Nôa Esperanza, relatórios estruturados AEC e agendamento de consultas.</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                  <h3 className="font-bold text-yellow-400 mb-2">Aluno</h3>
                  <p className="text-xs">Acesso à biblioteca educacional, simulador clínico e fórum comunitário para fins de aprendizagem.</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                  <h3 className="font-bold text-teal-400 mb-2">Profissional</h3>
                  <p className="text-xs">Prontuário NLP, agenda digital, assinatura ICP-Brasil, liquidação financeira automatizada (Split 70/30).</p>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">4. Inteligência Artificial (Nôa Esperanza)</h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>A Nôa Esperanza é um artefato cognitivo de IA projetado para escuta estruturada e geração de relatórios clínicos segundo o Protocolo IMRE (Investigação, Metodologia, Resultado, Evolução).</p>
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><span className="text-emerald-400">•</span>A IA <strong className="text-white">NÃO substitui</strong> o julgamento clínico do profissional de saúde;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Os relatórios gerados são documentos de apoio à decisão, não laudos médicos;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Todo relatório deve ser revisado e validado por profissional habilitado antes de qualquer decisão terapêutica;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>O Usuário reconhece que as respostas da IA podem conter imprecisões e não constituem aconselhamento médico.</li>
              </ul>
            </div>
          </section>

          {/* Seção 5 */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">5. Pagamentos e Assinaturas</h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>Os valores cobrados pela plataforma referem-se exclusivamente ao serviço tecnológico SaaS:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><span className="text-emerald-400">•</span>O pagamento é processado via gateway seguro (Stripe/PIX) com criptografia PCI-DSS;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Valores de consultas médicas são cobrados separadamente pelo profissional parceiro;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>A liquidação financeira entre profissional e plataforma segue o modelo Split 70/30;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Cancelamentos podem ser realizados a qualquer momento, com efeito no próximo ciclo de cobrança.</li>
              </ul>
            </div>
          </section>

          {/* Seção 6 */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">6. Propriedade Intelectual</h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>Todo o conteúdo da plataforma (código, design, textos, protocolos, modelos de IA) é de propriedade exclusiva da MedCannLab ou de seus licenciadores. É expressamente proibido:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Copiar, reproduzir ou distribuir qualquer conteúdo da plataforma;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Realizar engenharia reversa nos algoritmos de IA;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Utilizar a marca MedCannLab sem autorização prévia por escrito.</li>
              </ul>
            </div>
          </section>

          {/* Seção 7 */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">7. Limitação de Responsabilidade</h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>A MedCannLab não se responsabiliza por:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Decisões clínicas tomadas pelos profissionais com base nos relatórios gerados;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Indisponibilidade temporária dos serviços por motivos técnicos ou de força maior;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Uso indevido da plataforma pelo Usuário;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Conteúdo gerado por usuários em fóruns ou chats.</li>
              </ul>
            </div>
          </section>

          {/* Seção 8 */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Scale className="w-5 h-5 text-emerald-400" />
              8. Foro e Legislação Aplicável
            </h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da Comarca do Rio de Janeiro/RJ para dirimir eventuais controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
            </div>
          </section>

          {/* Footer Links */}
          <div className="text-center pt-8 border-t border-slate-800">
            <div className="flex items-center justify-center gap-6 text-sm">
              <Link to="/privacidade" className="text-emerald-400 hover:text-emerald-300 transition-colors">Política de Privacidade</Link>
              <span className="text-slate-600">|</span>
              <Link to="/" className="text-slate-400 hover:text-white transition-colors">Voltar à página inicial</Link>
            </div>
            <p className="text-xs text-slate-600 mt-4">© 2026 MedCannLab. Todos os direitos reservados. CNPJ em registro.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermosDeUso
