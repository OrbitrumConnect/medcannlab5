import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Trash2, Brain, Globe } from 'lucide-react'

const PoliticaPrivacidade: React.FC = () => {
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
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-slate-400">Em conformidade com a Lei nº 13.709/2018 (LGPD)</p>
          <p className="text-slate-500 text-sm mt-1">Última atualização: 01 de Abril de 2026</p>
        </div>

        <div className="space-y-8">
          {/* Controlador */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              1. Controlador de Dados
            </h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p><strong className="text-white">MedCannLab Tecnologia em Saúde</strong></p>
              <p>CNPJ: Em processo de registro</p>
              <p>Encarregado de Proteção de Dados (DPO): dpo@medcannlab.com.br</p>
              <p>Endereço: Rio de Janeiro, RJ — Brasil</p>
            </div>
          </section>

          {/* Dados Coletados */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-400" />
              2. Dados Pessoais Coletados
            </h2>
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                <h3 className="font-bold text-white mb-2">Dados Cadastrais</h3>
                <p>Nome completo, e-mail, telefone, CPF (quando necessário), tipo de perfil, registro profissional (CRM/CRO/CRP/CRF), instituição de ensino.</p>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <h3 className="font-bold text-red-400 mb-2">Dados Sensíveis de Saúde (Art. 11, LGPD)</h3>
                <p>Histórico médico, sintomas, queixas clínicas, resultados de avaliações, relatórios AEC/IMRE, prescrições, dados de exames, informações de tratamento com cannabis medicinal. Estes dados são tratados <strong className="text-white">exclusivamente</strong> mediante consentimento explícito do titular.</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                <h3 className="font-bold text-white mb-2">Dados de Uso</h3>
                <p>Logs de acesso, interações com a IA Nôa Esperanza, métricas de uso, dados de sessão, cookies técnicos essenciais.</p>
              </div>
            </div>
          </section>

          {/* Finalidade */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">3. Finalidade do Tratamento</h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-white">Prestação de serviço:</strong> Facilitar avaliações clínicas estruturadas e gerar relatórios para profissionais de saúde;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-white">Agendamento:</strong> Intermediar a conexão entre pacientes e profissionais parceiros;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-white">Educação:</strong> Prover acesso a conteúdo educacional e simuladores clínicos;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-white">Segurança:</strong> Autenticação, prevenção de fraudes e integridade da plataforma;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-white">Melhoria contínua:</strong> Análise agregada e anonimizada para aprimoramento dos algoritmos de IA.</li>
              </ul>
            </div>
          </section>

          {/* Base Legal */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">4. Base Legal (Art. 7 e 11, LGPD)</h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-2">Consentimento (Art. 7, I)</h3>
                  <p className="text-xs">Dados sensíveis de saúde, compartilhamento com profissionais, uso de relatórios IA.</p>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-2">Execução Contratual (Art. 7, V)</h3>
                  <p className="text-xs">Dados cadastrais para prestação do serviço SaaS e processamento de pagamentos.</p>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-2">Legítimo Interesse (Art. 7, IX)</h3>
                  <p className="text-xs">Analytics agregados, prevenção de fraudes, segurança da plataforma.</p>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-2">Tutela da Saúde (Art. 11, II, f)</h3>
                  <p className="text-xs">Tratamento de dados sensíveis em procedimentos realizados por profissionais de saúde.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Compartilhamento */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              5. Compartilhamento de Dados
            </h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>Os dados pessoais podem ser compartilhados com:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-white">Profissionais de saúde parceiros:</strong> Apenas dados clínicos do paciente que expressamente consentiu, para fins de consulta;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-white">Processadores de pagamento:</strong> Stripe/gateway PIX para transações financeiras (dados financeiros apenas);</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-white">Infraestrutura:</strong> Supabase (banco de dados com RLS), provedores de nuvem com certificação SOC 2;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-white">Autoridades:</strong> Quando exigido por lei ou decisão judicial.</li>
              </ul>
              <p className="mt-3"><strong className="text-white">NÃO vendemos, alugamos ou comercializamos dados pessoais.</strong></p>
            </div>
          </section>

          {/* Segurança */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-400" />
              6. Medidas de Segurança
            </h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Criptografia em trânsito (TLS 1.3) e em repouso (AES-256);</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Row Level Security (RLS) em 100% das tabelas do banco de dados;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Isolamento de dados entre profissionais (cada médico só acessa seus próprios pacientes);</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Autenticação segura via Supabase Auth com políticas de senha forte;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Proteção contra escalação de privilégios via triggers de banco de dados;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Logs de auditoria para acessos sensíveis.</li>
              </ul>
            </div>
          </section>

          {/* Direitos do Titular */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Eye className="w-5 h-5 text-emerald-400" />
              7. Direitos do Titular (Art. 18, LGPD)
            </h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>Você tem o direito de, a qualquer momento:</p>
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                {[
                  { icon: Eye, text: 'Confirmar e acessar seus dados' },
                  { icon: UserCheck, text: 'Corrigir dados incompletos ou desatualizados' },
                  { icon: Trash2, text: 'Solicitar anonimização ou eliminação' },
                  { icon: Globe, text: 'Portabilidade dos dados' },
                  { icon: Lock, text: 'Revogar consentimento' },
                  { icon: Database, text: 'Informação sobre compartilhamento' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-900/50 border border-slate-700/50 rounded-xl p-3">
                    <item.icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs">{item.text}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4">Para exercer seus direitos, entre em contato com nosso DPO: <strong className="text-emerald-400">dpo@medcannlab.com.br</strong></p>
            </div>
          </section>

          {/* Retenção */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">8. Retenção e Eliminação</h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Dados cadastrais: mantidos enquanto a conta estiver ativa + 5 anos após encerramento (obrigação legal);</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Dados clínicos/prontuário: mínimo de 20 anos conforme Resolução CFM nº 1.821/2007;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Dados financeiros: 5 anos conforme legislação tributária;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Logs de acesso: 6 meses conforme Marco Civil da Internet (Lei nº 12.965/2014).</li>
              </ul>
            </div>
          </section>

          {/* Cookies */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">9. Cookies e Tecnologias de Rastreamento</h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>Utilizamos apenas cookies estritamente necessários para:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Autenticação e manutenção de sessão;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Preferências de idioma e tema;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span>Segurança e prevenção de fraudes.</li>
              </ul>
              <p className="mt-2">Não utilizamos cookies de publicidade ou rastreamento de terceiros.</p>
            </div>
          </section>

          {/* Contato */}
          <section className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">10. Contato e Canal de Denúncias</h2>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>Para dúvidas, solicitações ou denúncias relacionadas à proteção de dados:</p>
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mt-3">
                <p><strong className="text-white">Encarregado (DPO):</strong> dpo@medcannlab.com.br</p>
                <p className="mt-1"><strong className="text-white">Autoridade Nacional de Proteção de Dados (ANPD):</strong> <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">www.gov.br/anpd</a></p>
              </div>
            </div>
          </section>

          {/* Footer Links */}
          <div className="text-center pt-8 border-t border-slate-800">
            <div className="flex items-center justify-center gap-6 text-sm">
              <Link to="/termos" className="text-emerald-400 hover:text-emerald-300 transition-colors">Termos de Uso</Link>
              <span className="text-slate-600">|</span>
              <Link to="/" className="text-slate-400 hover:text-white transition-colors">Voltar à página inicial</Link>
            </div>
            <p className="text-xs text-slate-600 mt-4">© 2026 MedCannLab. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PoliticaPrivacidade
