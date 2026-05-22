import React from 'react'
import { X, Brain, FileText, Lock, Calendar, Shield } from 'lucide-react'

interface JourneyManualModalProps {
    isOpen: boolean
    onClose: () => void
}

const JourneyManualModal: React.FC<JourneyManualModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-brand-bg border border-brand-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-brand-border p-5 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-lg font-bold text-brand-text">Sua Jornada de Cuidado</h2>
                        <p className="text-brand-text-muted text-xs mt-1">
                            Para garantir o melhor atendimento, seguimos uma jornada estruturada.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-brand-surface rounded-lg text-brand-text-muted hover:text-brand-text transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-6">

                    <div className="relative pl-6 border-l-2 border-brand-border space-y-6">

                        {/* Step 1 */}
                        <div className="relative">
                            <div className="absolute -left-[35px] bg-brand-bg p-1">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-brand-text text-xs">
                                    1
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-3 border border-brand-border hover:border-emerald-500/30 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Brain className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-brand-text mb-1">Avaliação Clínica Inicial</h3>
                                        <p className="text-brand-text-secondary text-xs leading-relaxed">
                                            Realize uma avaliação clínica completa com a IA Residente Nôa Esperança usando o protocolo IMRE. Esta avaliação é privada e confidencial.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative">
                            <div className="absolute -left-[35px] bg-brand-bg p-1">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center font-bold text-brand-text text-xs">
                                    2
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-3 border border-brand-border hover:border-blue-500/30 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-brand-text mb-1">Relatório Gerado</h3>
                                        <p className="text-brand-text-secondary text-xs leading-relaxed">
                                            Após a avaliação, a IA gera um relatório clínico completo que fica disponível no seu histórico de saúde sem compartilhamento automático.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative">
                            <div className="absolute -left-[35px] bg-brand-bg p-1">
                                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center font-bold text-brand-text text-xs">
                                    3
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-3 border border-brand-border hover:border-purple-500/30 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Lock className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-brand-text mb-1">Compartilhamento Seguro</h3>
                                        <p className="text-brand-text-secondary text-xs leading-relaxed">
                                            Ao agendar consulta, você pode compartilhar o relatório. O profissional só vê o conteúdo se você permitir explicitamente.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="relative">
                            <div className="absolute -left-[35px] bg-brand-bg p-1">
                                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center font-bold text-brand-text text-xs">
                                    4
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-3 border border-brand-border hover:border-amber-500/30 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-lg">
                                        <Calendar className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-brand-text mb-1">Agendar Consulta</h3>
                                        <p className="text-brand-text-secondary text-xs leading-relaxed">
                                            Agende sua consulta com profissionais da plataforma. Após a solicitação, o agendamento ficará pendente até a confirmação do profissional.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer - NFT & Consent */}
                    <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-700/50 mb-3">
                        <p className="text-xs text-brand-text-secondary mb-1 font-semibold">
                            🔐 Consentimento Informado & NFT Escute-se
                        </p>
                        <p className="text-[10px] text-brand-text-muted leading-relaxed">
                            Ao agendar, você concorda com o processamento de seus dados pela IA Residente e reconhece o vínculo com o <strong className="text-purple-300">NFT Escute-se</strong>, garantindo seus direitos de privacidade e propriedade dos dados.
                        </p>
                    </div>

                    {/* Footer - Security Note */}
                    <div className="bg-slate-800/30 rounded-lg p-3 flex items-center gap-3 border border-slate-700/50">
                        <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <p className="text-[10px] text-brand-text-muted">
                            <span className="text-emerald-400 font-semibold">Segurança LGPD:</span> Seus dados são protegidos por sigilo médico. Controle total sobre o compartilhamento.
                        </p>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-brand-border p-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-brand-surface-subtle hover:bg-slate-600 text-brand-text rounded-lg text-sm font-semibold transition-colors"
                    >
                        Entendi
                    </button>
                </div>
            </div>

        </div >
    )
}

export default JourneyManualModal
