import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Trash2, Brain, Globe } from 'lucide-react'

const PoliticaPrivacidade: React.FC = () => {
  return (
    <div className="min-h-screen text-brand-text font-sans" style={{ background: 'linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #0A192F 100%)' }}>
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-brand-text-muted hover:text-brand-text transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-brand-text">MedCannLab</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-brand-text-muted">Em conformidade com a Lei nº 13.709/2018 (LGPD)</p>
          <p className="text-slate-500 text-sm mt-1">Última atualização: 01 de Abril de 2026</p>
        </div>

        <div className="space-y-8">
          {/* Controlador */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              1. Controlador de Dados
            </h2>
            <div className="space-y-3 text-brand-text-secondary text-sm leading-relaxed">
              <p><strong className="text-brand-text">MedCannLab Tecnologia em Saúde</strong></p>
              <p>CNPJ: Em processo de registro</p>
              <p>Encarregado de Proteção de Dados (DPO): dpo@medcannlab.com.br</p>
              <p>Endereço: Rio de Janeiro, RJ — Brasil</p>
            </div>
          </section>

          {/* Dados Coletados */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-400" />
              2. Dados Pessoais Coletados
            </h2>
            <div className="space-y-4 text-brand-text-secondary text-sm leading-relaxed">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                <h3 className="font-bold text-brand-text mb-2">Dados Cadastrais</h3>
                <p>Nome completo, e-mail, telefone, CPF (quando necessário), tipo de perfil, registro profissional (CRM/CRO/CRP/CRF), instituição de ensino.</p>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <h3 className="font-bold text-red-400 mb-2">Dados Sensíveis de Saúde (Art. 11, LGPD)</h3>
                <p>Histórico médico, sintomas, queixas clínicas, resultados de avaliações, relatórios AEC/IMRE, prescrições, dados de exames, informações de tratamento com cannabis medicinal. Estes dados são tratados <strong className="text-brand-text">exclusivamente</strong> mediante consentimento explícito do titular.</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                <h3 className="font-bold text-brand-text mb-2">Dados de Uso</h3>
                <p>Logs de acesso, interações com a IA Nôa Esperanza, métricas de uso, dados de sessão, cookies técnicos essenciais.</p>
              </div>
            </div>
          </section>

          {/* Finalidade */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-brand-text mb-4">3. Finalidade do Tratamento</h2>
            <div className="space-y-3 text-brand-text-secondary text-sm leading-relaxed">
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-brand-text">Prestação de serviço:</strong> Facilitar avaliações clínicas estruturadas e gerar relatórios para profissionais de saúde;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-brand-text">Agendamento:</strong> Intermediar a conexão entre pacientes e profissionais parceiros;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-brand-text">Educação:</strong> Prover acesso a conteúdo educacional e simuladores clínicos;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-brand-text">Segurança:</strong> Autenticação, prevenção de fraudes e integridade da plataforma;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-brand-text">Melhoria contínua:</strong> Análise agregada e anonimizada para aprimoramento dos algoritmos de IA.</li>
              </ul>
            </div>
          </section>

          {/* Base Legal */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-brand-text mb-4">4. Base Legal (Art. 7 e 11, LGPD)</h2>
            <div className="space-y-3 text-brand-text-secondary text-sm leading-relaxed">
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
            <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              5. Compartilhamento de Dados
            </h2>
            <div className="space-y-3 text-brand-text-secondary text-sm leading-relaxed">
              <p>Os dados pessoais podem ser compartilhados com:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-brand-text">Profissionais de saúde parceiros:</strong> Apenas dados clínicos do paciente que expressamente consentiu, para fins de consulta;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-brand-text">Processadores de pagamento:</strong> Stripe (dados financeiros) / Gateway PIX nacional;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-brand-text">Infraestrutura:</strong> Supabase (banco de dados com RLS), provedores de nuvem com certificação SOC 2;</li>
                <li className="flex gap-2"><span className="text-emerald-400">•</span><strong className="text-brand-text">Autoridades:</strong> Quando exigido por lei ou decisão judicial.</li>
              </ul>
              <p className="mt-3"><strong className="text-brand-text">NÃO vendemos, alugamos ou comercializamos dados pessoais.</strong></p>
            </div>
          </section>

          {/* Transferência Internacional — V1.9.X 18/05 patch pós-audit */}
          <section className="bg-amber-500/5 backdrop-blur-md border border-amber-500/30 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-3">
              <Globe className="w-5 h-5 text-amber-400" />
              5.1. Transferência Internacional de Dados (Art. 33-36, LGPD)
            </h2>
            <div className="space-y-3 text-brand-text-secondary text-sm leading-relaxed">
              <p>
                Alguns serviços essenciais à plataforma envolvem transferência de dados para fora do território nacional.
                Em conformidade com os artigos 33 a 36 da LGPD, declaramos transparentemente:
              </p>

              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-brand-text mb-1">OpenAI Inc. (Estados Unidos)</h3>
                  <p className="text-xs">
                    Conteúdo de mensagens, contexto clínico e relatórios estruturados são processados pela
                    OpenAI (modelo GPT-4o) via Edge Functions servidor-a-servidor. Não há armazenamento permanente
                    pela OpenAI. <strong className="text-brand-text">Base legal:</strong> Art. 33, IV (cumprimento
                    de obrigação contratual mediante consentimento específico do titular — vide ConsentGuard inicial).
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-brand-text mb-1">Stripe Inc. (Estados Unidos)</h3>
                  <p className="text-xs">
                    Dados financeiros (cartão, valor, identificação para transação) processados pela Stripe.
                    Não compartilhamos dados clínicos com a Stripe. <strong className="text-brand-text">Base legal:</strong>
                    Art. 33, II + V (execução contratual + obrigação legal de pagamento).
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-brand-text mb-1">Supabase Inc. (Estados Unidos — região de processamento configurável)</h3>
                  <p className="text-xs">
                    Banco de dados principal. Aplicamos Row Level Security (RLS) e isolamento por usuário.
                    Dados em repouso criptografados pela infraestrutura Supabase (AES-256).
                    <strong className="text-brand-text"> Base legal:</strong> Art. 33, II (execução contratual).
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-brand-text mb-1">Vercel Inc. (Estados Unidos)</h3>
                  <p className="text-xs">
                    Hospedagem do frontend (servidor de aplicação). Não armazena dados pessoais —
                    apenas serve arquivos estáticos e roteamento. <strong className="text-brand-text">Base legal:</strong>
                    Art. 33, II (execução contratual).
                  </p>
                </div>
              </div>

              <p className="text-xs mt-3">
                <strong className="text-brand-text">Mecanismos de proteção aplicados:</strong> Cláusulas contratuais padrão exigidas
                a cada provedor (DPA — Data Processing Agreement), minimização de dados transmitidos, criptografia
                em trânsito (TLS 1.3), e consentimento explícito do titular antes da primeira operação clínica
                via ConsentGuard bloqueante.
              </p>

              <p className="text-xs mt-2">
                <strong className="text-amber-300">Direito de oposição:</strong> Você pode solicitar à plataforma
                a interrupção do processamento de seus dados por provedores externos (sujeito à inviabilidade técnica
                de prosseguir com o serviço). Contato: <strong className="text-amber-300">dpo@medcannlab.com.br</strong>
              </p>
            </div>
          </section>

          {/* Uso de IA — V1.9.X 18/05 patch pós-audit */}
          <section className="bg-blue-500/5 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-3">
              <Brain className="w-5 h-5 text-blue-400" />
              5.2. Uso de Inteligência Artificial Generativa
            </h2>
            <div className="space-y-3 text-brand-text-secondary text-sm leading-relaxed">
              <p>
                A plataforma utiliza modelos de IA generativa (GPT-4o da OpenAI) como apoio em fluxos clínicos
                — entrevista guiada (AEC), análise multi-racional, organização narrativa. Em transparência ativa,
                declaramos:
              </p>
              <ul className="space-y-2 ml-4 text-xs">
                <li className="flex gap-2"><span className="text-blue-400">•</span><strong className="text-brand-text">A IA não diagnostica, não prescreve, não substitui o ato médico.</strong> Toda decisão clínica final é do profissional humano (CRM ativo).</li>
                <li className="flex gap-2"><span className="text-blue-400">•</span><strong className="text-brand-text">Saídas da IA são auditáveis</strong> — logs completos em <code className="bg-brand-surface px-1 rounded text-xs">ai_chat_interactions</code> + <code className="bg-brand-surface px-1 rounded text-xs">cognitive_events</code> + <code className="bg-brand-surface px-1 rounded text-xs">noa_logs</code>.</li>
                <li className="flex gap-2"><span className="text-blue-400">•</span><strong className="text-brand-text">Conteúdo gerado para o paciente</strong> passa por hierarquização semântica (técnico vs leigo) — paciente não lê brainstorm clínico bruto.</li>
                <li className="flex gap-2"><span className="text-blue-400">•</span><strong className="text-brand-text">Revisão humana</strong> — relatórios são revisados pelo médico responsável antes de devolução ao paciente.</li>
                <li className="flex gap-2"><span className="text-blue-400">•</span><strong className="text-brand-text">Você pode solicitar revisão humana</strong> de qualquer interação automatizada (Art. 20, LGPD — direito de revisão de decisão automatizada).</li>
              </ul>
            </div>
          </section>

          {/* Segurança */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-400" />
              6. Medidas de Segurança
            </h2>
            <div className="space-y-3 text-brand-text-secondary text-sm leading-relaxed">
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
            <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-3">
              <Eye className="w-5 h-5 text-emerald-400" />
              7. Direitos do Titular (Art. 18, LGPD)
            </h2>
            <div className="space-y-3 text-brand-text-secondary text-sm leading-relaxed">
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
            <h2 className="text-xl font-bold text-brand-text mb-4">8. Retenção e Eliminação</h2>
            <div className="space-y-3 text-brand-text-secondary text-sm leading-relaxed">
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
            <h2 className="text-xl font-bold text-brand-text mb-4">9. Cookies e Tecnologias de Rastreamento</h2>
            <div className="space-y-3 text-brand-text-secondary text-sm leading-relaxed">
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
            <h2 className="text-xl font-bold text-brand-text mb-4">10. Contato e Canal de Denúncias</h2>
            <div className="space-y-3 text-brand-text-secondary text-sm leading-relaxed">
              <p>Para dúvidas, solicitações ou denúncias relacionadas à proteção de dados:</p>
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mt-3">
                <p><strong className="text-brand-text">Encarregado (DPO):</strong> dpo@medcannlab.com.br</p>
                <p className="mt-1"><strong className="text-brand-text">Autoridade Nacional de Proteção de Dados (ANPD):</strong> <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">www.gov.br/anpd</a></p>
              </div>
            </div>
          </section>

          {/* Footer Links */}
          <div className="text-center pt-8 border-t border-brand-border-subtle">
            <div className="flex items-center justify-center gap-6 text-sm">
              <Link to="/termos" className="text-emerald-400 hover:text-emerald-300 transition-colors">Termos de Uso</Link>
              <span className="text-slate-600">|</span>
              <Link to="/" className="text-brand-text-muted hover:text-brand-text transition-colors">Voltar à página inicial</Link>
            </div>
            <p className="text-xs text-slate-600 mt-4">© 2026 MedCannLab. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PoliticaPrivacidade
