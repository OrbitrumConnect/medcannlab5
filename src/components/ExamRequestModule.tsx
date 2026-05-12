import React, { useState, useEffect } from 'react';
import { FileText, Plus, Printer, X, Save, Search, Settings, AlertCircle, Check, Send, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { notificationService } from '../services/notificationService';

// Tipos
type ExamTemplate = {
    id: string;
    title: string;
    content: string;
    category: string;
    is_public: boolean;
};

// V1.9.231 — campos ICP-Brasil adicionados (espelho de cfm_prescriptions).
// status: draft | signed | sent | cancelled. digital_signature populado pela Edge.
type ExamRequest = {
    id: string;
    content: string;
    status: string;
    created_at: string;
    digital_signature?: string | null;
    iti_validation_code?: string | null;
    iti_validation_url?: string | null;
    signature_timestamp?: string | null;
};

type ExamRequestModuleProps = {
    patientId?: string;
    patientName?: string;
    className?: string;
};

export const ExamRequestModule: React.FC<ExamRequestModuleProps> = ({
    patientId,
    patientName,
    className = ''
}) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'library' | 'history'>('library');
    const [selectedTemplate, setSelectedTemplate] = useState<ExamTemplate | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [showEditor, setShowEditor] = useState(false);

    // Estados de Dados
    const [templates, setTemplates] = useState<ExamTemplate[]>([]);
    const [history, setHistory] = useState<ExamRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    // V1.9.231 — id em assinatura corrente (botao por item) pra UX feedback granular.
    const [signingId, setSigningId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Carregar Templates ao montar (e ao mudar aba)
    useEffect(() => {
        if (activeTab === 'library') {
            loadTemplates();
        } else if (activeTab === 'history' && patientId) {
            loadHistory();
        }
    }, [activeTab, patientId]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('exam_request_templates')
                .select('*')
                .order('title'); // Ajuste conforme campos reais

            if (error) throw error;

            // Se vazio, usar mocks como fallback visual ou seed inicial
            if (!data || data.length === 0) {
                // Fallback silencioso ou manter vazio
            } else {
                setTemplates(data.map(t => ({ ...t, category: t.category ?? '', is_public: t.is_public ?? false })));
            }
        } catch (err) {
            console.error('Erro ao carregar templates:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            // V1.9.231 — select inclui campos ICP pra badge de status + idempotencia botao assinar.
            const { data, error } = await supabase
                .from('patient_exam_requests')
                .select('id, content, status, created_at, digital_signature, iti_validation_code, iti_validation_url, signature_timestamp')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHistory((data || []).map((d: any) => ({
                ...d,
                status: d.status ?? 'pending',
                created_at: d.created_at ?? new Date().toISOString()
            })));
        } catch (err) {
            console.error('Erro ao carregar histórico:', err);
        } finally {
            setLoading(false);
        }
    };

    // V1.9.231 — Assinatura digital ICP-Brasil (espelha PatientPrescriptions V1.9.137).
    // Chama Edge `digital-signature` com documentType='exam_request' (param backward-compat).
    // Idempotente: bloqueia re-assinar se status='signed' OU digital_signature ja populado.
    const handleSign = async (req: ExamRequest) => {
        if (!user || !req.id) return;
        // Idempotencia local antes do call (Edge tambem valida)
        if (req.status === 'signed' || req.digital_signature) {
            setFeedback({ type: 'error', message: 'Solicitacao ja assinada (idempotencia CFM 2.314).' });
            return;
        }
        setSigningId(req.id);
        setFeedback(null);
        try {
            const { data, error } = await supabase.functions.invoke('digital-signature', {
                body: {
                    documentId: req.id,
                    documentLevel: 'level_2', // exam_request = level_2 (entre atestado e prescricao)
                    professionalId: user.id,
                    documentType: 'exam_request', // V1.9.231 — rota Edge pra patient_exam_requests
                    userConfirmed: true
                }
            });

            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Falha desconhecida ao assinar');

            setFeedback({ type: 'success', message: 'Solicitacao assinada com ICP-Brasil. Codigo ITI gerado.' });
            // Recarregar pra refletir status=signed + iti_validation_code
            await loadHistory();
        } catch (err: any) {
            const msg = err?.message || 'Erro ao assinar';
            // Sem cert -> banner pra configurar
            if (msg.toLowerCase().includes('certificado')) {
                setFeedback({ type: 'error', message: 'Configure seu certificado ICP-Brasil em Certificados Digitais antes de assinar.' });
            } else {
                setFeedback({ type: 'error', message: `Erro ao assinar: ${msg}` });
            }
        } finally {
            setSigningId(null);
        }
    };

    const handleOpenTemplate = (template: ExamTemplate) => {
        setSelectedTemplate(template);
        setEditorContent(template.content);
        setShowEditor(true);
        setFeedback(null);
    };

    const handleCreateNew = () => {
        setSelectedTemplate(null);
        setEditorContent('');
        setShowEditor(true);
        setFeedback(null);
    };

    const handleSaveRequest = async () => {
        if (!patientId || !user) {
            setFeedback({ type: 'error', message: 'Paciente ou Profissional não identificados.' });
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.from('patient_exam_requests').insert({
                patient_id: patientId,
                professional_id: user.id, // Auth Context user ID
                content: editorContent,
                status: 'draft'
            });

            if (error) throw error;

            // Enviar notificação para o paciente (sininho)
            try {
                await notificationService.createNotification({
                    user_id: patientId,
                    title: 'Nova Solicitação de Exame',
                    message: `Seu médico solicitou novos exames. Acesse sua área de Evolução para ver os detalhes.`,
                    type: 'clinical',
                    is_read: false,
                });
            } catch (notifErr) {
                console.warn('Não foi possível enviar notificação ao paciente:', notifErr);
            }

            setFeedback({ type: 'success', message: 'Pedido salvo com sucesso!' });
            setTimeout(() => {
                setShowEditor(false);
                setActiveTab('history'); // Mudar para histórico para ver o novo item
            }, 1000);

        } catch (err: any) {
            setFeedback({ type: 'error', message: `Erro ao salvar: ${err.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAsTemplate = async () => {
        if (!editorContent) return;
        const title = prompt("Nome do novo modelo:");
        if (!title) return;

        try {
            // Tentar salvar como template privado
            const { error } = await supabase.from('exam_request_templates').insert({
                title: title,
                content: editorContent,
                category: 'Personalizado',
                created_by: user?.id,
                is_public: false
            });

            if (error) throw error;
            alert("Modelo salvo na sua biblioteca!");
            loadTemplates(); // Recarregar
        } catch (err: any) {
            alert("Erro ao criar modelo: " + err.message);
        }
    };

    // V1.9.231 — handlePrint aceita req opcional. Sem req = print do editor (modal novo pedido)
    // -> sempre RASCUNHO (sem ICP). Com req = print de pedido existente -> contextual ao status.
    const handlePrint = (req?: ExamRequest) => {
        const isSigned = !!(req && (req.status === 'signed' || req.status === 'sent') && req.digital_signature);
        const contentToPrint = req?.content ?? editorContent;
        const itiCode = req?.iti_validation_code || '';
        const itiUrl = req?.iti_validation_url || '';
        const sigTs = req?.signature_timestamp ? new Date(req.signature_timestamp).toLocaleString('pt-BR') : '';

        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Pedido de Exame - ${patientName || 'Paciente'}</title>
                        <style>
                            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; position: relative; }
                            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                            .logo { font-size: 24px; font-weight: bold; color: #000; }
                            .patient-info { margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
                            .content { white-space: pre-wrap; line-height: 1.6; font-size: 14px; min-height: 300px; }
                            .footer { margin-top: 60px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px; font-size: 12px; color: #666; }
                            .warn-banner { background: #fff3cd; border: 2px solid #f0ad4e; color: #856404; padding: 12px; margin-bottom: 20px; border-radius: 6px; font-weight: bold; text-align: center; }
                            .signed-banner { background: #d4edda; border: 2px solid #28a745; color: #155724; padding: 12px; margin-bottom: 20px; border-radius: 6px; font-weight: bold; text-align: center; }
                            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; color: rgba(240, 173, 78, 0.18); font-weight: bold; pointer-events: none; z-index: 999; user-select: none; }
                            @media print {
                                body { padding: 0; }
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        ${!isSigned ? '<div class="watermark">RASCUNHO</div>' : ''}
                        ${!isSigned ? '<div class="warn-banner">⚠ RASCUNHO — Sem valor legal. Assine digitalmente (ICP-Brasil) antes de entregar ao paciente. CFM 2.314/2022.</div>' : '<div class="signed-banner">✓ Documento assinado digitalmente com ICP-Brasil — valor legal pleno (CFM 2.314/2022).</div>'}
                        <div class="header">
                            <div class="logo">MedCannLab</div>
                            <p>Dr(a). ${user?.email?.split('@')[0] || 'Profissional'}</p>
                        </div>
                        <div class="patient-info">
                            <p><strong>Paciente:</strong> ${patientName || 'Não Informado'}</p>
                            <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div class="content">
                            ${contentToPrint}
                        </div>
                        <div class="footer">
                            ${isSigned ? `<p><strong>Assinado digitalmente em:</strong> ${sigTs}</p><p><strong>Codigo ITI:</strong> ${itiCode}</p>${itiUrl ? `<p><strong>Validacao:</strong> ${itiUrl}</p>` : ''}` : '<p>Este documento eh um RASCUNHO sem assinatura digital.</p>'}
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
        }
    };

    const handleSend = () => {
        // Simulação de envio
        const email = prompt("Digite o e-mail do paciente para envio:", "paciente@exemplo.com");
        if (email) {
            alert(`Pedido de exame enviado com sucesso para ${email}!`);
        }
    };

    return (
        <div className={`space-y-6 ${className} w-full`}>
            {/* Header */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-2">Solicitações e Laudos</p>
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                            <FileText className="w-6 h-6 text-cyan-300" />
                            Solicitação de Exames
                        </h2>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('library')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'library' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
                                }`}
                        >
                            Biblioteca
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
                                }`}
                        >
                            Histórico
                        </button>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-center">
                    <p className="text-sm text-slate-400">
                        {activeTab === 'library'
                            ? 'Selecione um modelo abaixo ou crie um novo pedido.'
                            : 'Histórico de exames solicitados para este paciente.'}
                    </p>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-medium shadow-lg transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Pedido
                    </button>
                </div>
            </div>

            {/* Library View */}
            {activeTab === 'library' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full py-10 text-center text-slate-500">
                            Carregando biblioteca...
                        </div>
                    ) : templates.length > 0 ? (
                        templates.map(template => (
                            <button
                                key={template.id}
                                onClick={() => handleOpenTemplate(template)}
                                className="group flex flex-col items-start text-left p-5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-cyan-900/10 transition-all"
                            >
                                <div className="mb-3 w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                    <FileText className="w-5 h-5 text-cyan-400" />
                                </div>
                                <h3 className="font-semibold text-white mb-1 group-hover:text-cyan-300 transition-colors">{template.title}</h3>
                                <p className="text-sm text-slate-400 line-clamp-2">{template.content}</p>
                                <div className="mt-4 w-full pt-3 border-t border-slate-700/50 flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{template.category || 'Geral'}</span>
                                    <span className="text-xs text-cyan-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Usar modelo →</span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="col-span-full py-10 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                            <p>Nenhum modelo encontrado.</p>
                            <button onClick={handleCreateNew} className="text-cyan-400 hover:underline mt-2 text-sm">Crie seu primeiro modelo</button>
                        </div>
                    )}
                </div>
            )}

            {/* History View */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    {/* V1.9.231 — feedback global do handleSign (separado do feedback do modal) */}
                    {feedback && !showEditor && (
                        <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300' : 'bg-red-500/10 border border-red-500/40 text-red-300'}`}>
                            {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {feedback.message}
                        </div>
                    )}
                    {/* V1.9.231 — Banner de aviso CFM 2.314/2022 se houver drafts (espelha V1.9.137 prescriptions) */}
                    {history.some(r => (r.status === 'draft' || r.status === 'pending') && !r.digital_signature) && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2">
                            <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <strong>Aviso CFM 2.314/2022:</strong> Solicitações em <strong>rascunho</strong> não têm valor legal. Assine digitalmente (ICP-Brasil) antes de entregar ao paciente.
                            </div>
                        </div>
                    )}
                    {loading ? (
                        <div className="py-10 text-center text-slate-500">Carregando histórico...</div>
                    ) : history.length > 0 ? (
                        history.map(req => {
                            const isSigned = (req.status === 'signed' || req.status === 'sent') && !!req.digital_signature;
                            const isDraft = !isSigned;
                            return (
                                <div key={req.id} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium line-clamp-1">{req.content.substring(0, 80)}{req.content.length > 80 ? '...' : ''}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                            <span className="text-slate-400">{new Date(req.created_at).toLocaleString('pt-BR')}</span>
                                            <span className="text-slate-600">•</span>
                                            {/* V1.9.231 — badge contextual: rascunho amarelo, assinado verde */}
                                            {isSigned ? (
                                                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    Assinado ICP-Brasil
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    Rascunho — sem valor legal
                                                </span>
                                            )}
                                            {req.iti_validation_code && (
                                                <span className="text-cyan-400/80 font-mono text-[10px]">{req.iti_validation_code}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {/* V1.9.231 — Botão Assinar (só draft, idempotente) */}
                                        {isDraft && (
                                            <button
                                                onClick={() => handleSign(req)}
                                                disabled={signingId === req.id}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                                title="Assinar digitalmente com ICP-Brasil (CFM 2.314/2022)"
                                            >
                                                {signingId === req.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                )}
                                                {signingId === req.id ? 'Assinando...' : 'Assinar'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handlePrint(req)}
                                            className={`p-2 rounded-lg ${isDraft ? 'text-amber-400 hover:bg-amber-900/20' : 'text-cyan-400 hover:bg-cyan-900/20'}`}
                                            title={isDraft ? 'Imprimir RASCUNHO (sem valor legal)' : 'Imprimir documento assinado'}
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                            <Printer className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Nenhuma solicitação encontrada no histórico deste paciente.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Editor Modal */}
            {showEditor && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {selectedTemplate ? `Editar: ${selectedTemplate.title}` : 'Novo Pedido de Exame'}
                                </h3>
                                <p className="text-sm text-slate-400">Paciente: <span className="text-white font-medium">{patientName || 'Não selecionado'}</span></p>
                            </div>
                            <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body (Editor) */}
                        <div className="flex-1 p-6 overflow-y-auto relative">
                            {/* Feedback Toast Overlay */}
                            {feedback && (
                                <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-red-500/20 text-red-300 border border-red-500/50'}`}>
                                    {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {feedback.message}
                                </div>
                            )}

                            <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">Conteúdo da Solicitação</label>
                            <textarea
                                value={editorContent}
                                onChange={(e) => setEditorContent(e.target.value)}
                                className="w-full h-96 bg-slate-950 text-slate-200 border border-slate-700 rounded-xl p-5 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none resize-none"
                                placeholder="Digite os exames solicitados aqui..."
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => alert("Configuração de Certificado Digital (A3/A1) não detectada. Em produção, isso abriria o modal de seleção do certificado via Web PKI.")}
                                    className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1"
                                >
                                    <Settings className="w-3 h-3" /> Configurar Assinatura Digital
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-slate-700 bg-slate-800/30 rounded-b-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={handleSaveAsTemplate}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors flex-1 md:flex-none"
                                >
                                    Salvar como Modelo
                                </button>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto justify-end">
                                <button
                                    onClick={() => handlePrint()}
                                    className="px-4 py-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    title="Imprimir RASCUNHO (sem valor legal — salve e assine no histórico)"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span className="hidden sm:inline">Imprimir</span>
                                </button>
                                <button
                                    onClick={handleSend}
                                    className="px-4 py-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    title="Enviar por E-mail"
                                >
                                    <Send className="w-4 h-4" />
                                    <span className="hidden sm:inline">Enviar</span>
                                </button>
                                <div className="w-px h-8 bg-slate-700 mx-1 hidden sm:block"></div>
                                <button
                                    onClick={handleSaveRequest}
                                    disabled={saving}
                                    className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-bold shadow-lg shadow-cyan-900/20 transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Salvar Pedido
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
