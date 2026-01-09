import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateEGFR, classifyStage, getStageDescription } from '../lib/renalCalculations';
import { Activity, AlertCircle, Save, TrendingUp, History, Info } from 'lucide-react';

interface RenalExam {
    id: string;
    exam_date: string;
    creatinine: number;
    urea: number;
    egfr: number;
    drc_stage: string;
}

interface RenalFunctionModuleProps {
    patientId?: string;
    patientAge?: number;
    patientGender?: 'male' | 'female';
}

const RenalFunctionModule: React.FC<RenalFunctionModuleProps> = ({ patientId, patientAge = 40, patientGender = 'male' }) => {
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState<RenalExam[]>([]);

    // Form State
    const [creatinine, setCreatinine] = useState('');
    const [urea, setUrea] = useState('');
    const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);

    // Calculated Preview
    const [previewEgfr, setPreviewEgfr] = useState<number | null>(null);

    useEffect(() => {
        if (patientId) {
            loadExams();
        } else {
            setExams([]);
        }
    }, [patientId]);

    // Real-time calculation preview
    useEffect(() => {
        if (creatinine && patientAge) {
            const val = parseFloat(creatinine);
            if (!isNaN(val)) {
                const result = calculateEGFR({
                    creatinine: val,
                    age: patientAge,
                    sex: patientGender
                });
                setPreviewEgfr(result);
            }
        } else {
            setPreviewEgfr(null);
        }
    }, [creatinine, patientAge, patientGender]);

    const loadExams = async () => {
        if (!patientId) return;
        try {
            const { data, error } = await supabase
                .from('renal_exams')
                .select('*')
                .eq('patient_id', patientId)
                .order('exam_date', { ascending: false });

            if (error) throw error;
            setExams(data || []);
        } catch (err) {
            console.error('Error loading renal exams:', err);
        }
    };

    const handleSave = async () => {
        if (!creatinine || !previewEgfr || !patientId) return;

        setLoading(true);
        try {
            const stage = classifyStage(previewEgfr);

            const { error } = await supabase.from('renal_exams').insert({
                patient_id: patientId,
                exam_date: examDate,
                creatinine: parseFloat(creatinine),
                urea: parseFloat(urea) || 0,
                egfr: previewEgfr,
                drc_stage: stage,
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            setCreatinine('');
            setUrea('');
            loadExams(); // Refresh list
        } catch (err) {
            console.error('Error saving exam:', err);
            alert('Erro ao salvar exame.');
        } finally {
            setLoading(false);
        }
    };

    const getStageColor = (stage: string) => {
        if (['G1', 'G2'].includes(stage)) return 'bg-green-100 text-green-800 border-green-200';
        if (['G3a', 'G3b'].includes(stage)) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    if (!patientId) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-700">Módulo de Função Renal</h3>
                <p className="text-slate-500 mt-2">Selecione um paciente na lista para visualizar o histórico de exames e calcular a TFG.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Módulo de Função Renal
                </h3>
                <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">
                    Protocolo CKD-EPI 2021
                </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Input */}
                <div className="space-y-4">
                    <h4 className="font-medium text-slate-700 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Novo Registro
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Creatinina (mg/dL)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={creatinine}
                                onChange={(e) => setCreatinine(e.target.value)}
                                className="w-full rounded-md border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ex: 0.9"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Ureia (mg/dL)</label>
                            <input
                                type="number"
                                value={urea}
                                onChange={(e) => setUrea(e.target.value)}
                                className="w-full rounded-md border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ex: 35"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Data do Exame</label>
                        <input
                            type="date"
                            value={examDate}
                            onChange={(e) => setExamDate(e.target.value)}
                            className="w-full rounded-md border-slate-200 text-sm"
                        />
                    </div>

                    {/* Calculator Result Preview */}
                    {previewEgfr && (
                        <div className={`p-4 rounded-lg border flex items-center justify-between animate-in fade-in ${previewEgfr >= 60 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">eTFG Estimada</p>
                                <div className="text-2xl font-bold text-slate-800">
                                    {previewEgfr} <span className="text-sm font-normal text-slate-500">mL/min/1.73m²</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${classifyStage(previewEgfr).startsWith('G3') || classifyStage(previewEgfr).startsWith('G4')
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                    }`}>
                                    Estágio {classifyStage(previewEgfr)}
                                </span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={!creatinine || loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : <><Save className="w-4 h-4" /> Registrar Exame</>}
                    </button>
                </div>

                {/* Right Column: History */}
                <div className="border-l border-slate-100 pl-8 space-y-4">
                    <h4 className="font-medium text-slate-700 flex items-center gap-2">
                        <History className="w-4 h-4" /> Histórico Renal
                    </h4>

                    {exams.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum exame registrado</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {exams.map((exam) => (
                                <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="text-xs text-slate-500">{new Date(exam.exam_date).toLocaleDateString('pt-BR')}</p>
                                        <p className="text-sm font-medium text-slate-800">
                                            Cr: {exam.creatinine} <span className="text-slate-400">|</span> eTFG: {exam.egfr}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded font-medium border ${getStageColor(exam.drc_stage)}`}>
                                        {exam.drc_stage}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RenalFunctionModule;
