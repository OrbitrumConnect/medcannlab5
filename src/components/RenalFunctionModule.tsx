import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { calculateEGFR, classifyStage, getStageDescription } from '../lib/renalCalculations';
import { Activity, AlertCircle, Save, TrendingUp, History, Info, Search, User, X, ChevronDown, Settings2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RenalExam {
    id: string;
    exam_date: string;
    creatinine: number;
    urea: number;
    egfr: number;
    drc_stage: string;
}

interface PatientOption {
    id: string;
    name: string;
}

interface RenalFunctionModuleProps {
    patientId?: string;
    patientAge?: number;
    patientGender?: 'male' | 'female';
    onPatientSelect?: (id: string) => void;
}

const RenalFunctionModule: React.FC<RenalFunctionModuleProps> = ({ patientId, patientAge, patientGender, onPatientSelect }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState<RenalExam[]>([]);

    // Patient selector state
    const [patients, setPatients] = useState<PatientOption[]>([]);
    const [patientsLoading, setPatientsLoading] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Demographic config state (overrides props when set)
    const [localAge, setLocalAge] = useState<number>(patientAge ?? 40);
    const [localGender, setLocalGender] = useState<'male' | 'female'>(patientGender ?? 'male');
    const [showConfig, setShowConfig] = useState(false);

    // Form State
    const [creatinine, setCreatinine] = useState('');
    const [urea, setUrea] = useState('');
    const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);

    // Calculated Preview
    const [previewEgfr, setPreviewEgfr] = useState<number | null>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        if (dropdownOpen) document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, [dropdownOpen]);

    // Load patient list
    useEffect(() => {
        if (!user?.id) return;
        const load = async () => {
            setPatientsLoading(true);
            try {
                const isAdmin = (user as any)?.type === 'admin';
                let list: PatientOption[] = [];
                if (isAdmin) {
                    const { data } = await supabase
                        .from('users')
                        .select('id, name')
                        .in('type', ['patient', 'paciente'])
                        .order('name', { ascending: true });
                    if (data) list = data.map((u: any) => ({ id: u.id, name: u.name || 'Sem nome' }));
                } else {
                    const { data: assessments } = await supabase
                        .from('clinical_assessments')
                        .select('patient_id')
                        .eq('doctor_id', user.id);
                    const ids = Array.from(new Set((assessments || []).map(a => a.patient_id).filter((id): id is string => id !== null)));
                    if (ids.length > 0) {
                        const { data } = await supabase
                            .from('users')
                            .select('id, name')
                            .in('id', ids);
                        if (data) list = data.map((u: any) => ({ id: u.id, name: u.name || 'Sem nome' }));
                    }
                }
                setPatients(list);
                // If a patientId is already selected, find its name
                if (patientId) {
                    const match = list.find(p => p.id === patientId);
                    if (match) {
                        setSelectedPatientName(match.name);
                        setPatientSearch(match.name);
                    }
                }
            } catch (err) {
                console.error('Erro ao carregar pacientes para módulo renal:', err);
            } finally {
                setPatientsLoading(false);
            }
        };
        load();
    }, [user?.id]);

    // Load patient demographics when patient changes
    useEffect(() => {
        if (!patientId) {
            setSelectedPatientName(null);
            return;
        }
        let cancelled = false;
        const loadDemo = async () => {
            try {
                const { data } = await supabase
                    .from('users')
                    .select('name, date_of_birth, gender')
                    .eq('id', patientId)
                    .maybeSingle();
                if (cancelled || !data) return;
                setSelectedPatientName((data as any).name || null);
                // Calculate age from date_of_birth
                if ((data as any).date_of_birth) {
                    const dob = new Date((data as any).date_of_birth);
                    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                    if (age > 0 && age < 150) setLocalAge(age);
                }
                // Map gender
                const g = ((data as any).gender || '').toLowerCase();
                if (g === 'female' || g === 'feminino' || g === 'f') setLocalGender('female');
                else setLocalGender('male');
            } catch { /* ignore */ }
        };
        loadDemo();
        return () => { cancelled = true; };
    }, [patientId]);

    // Load exams
    useEffect(() => {
        if (patientId) {
            loadExams();
        } else {
            setExams([]);
        }
    }, [patientId]);

    // Real-time calculation preview
    useEffect(() => {
        if (creatinine && localAge) {
            const val = parseFloat(creatinine);
            if (!isNaN(val)) {
                const result = calculateEGFR({
                    creatinine: val,
                    age: localAge,
                    sex: localGender
                });
                setPreviewEgfr(result);
            }
        } else {
            setPreviewEgfr(null);
        }
    }, [creatinine, localAge, localGender]);

    const loadExams = async () => {
        if (!patientId) return;
        try {
            const { data, error } = await supabase
                .from('renal_exams')
                .select('*')
                .eq('patient_id', patientId)
                .order('exam_date', { ascending: false });

            if (error) throw error;
            setExams((data || []).map(e => ({ ...e, creatinine: e.creatinine ?? 0, egfr: e.egfr ?? 0, urea: e.urea ?? 0, drc_stage: e.drc_stage ?? '' })) as any);
        } catch (err) {
            console.error('Error loading renal exams:', err);
        }
    };

    const handleSave = async () => {
        if (!creatinine || !previewEgfr || !patientId) return;

        setLoading(true);
        try {
            const stage = classifyStage(previewEgfr);

            // Save to renal_exams (local table)
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

            // Also persist via server-side RPC (saves to patient_lab_results + validates CKD-EPI)
            try {
                await supabase.rpc('calculate_ckd_stage', {
                    p_creatinine: parseFloat(creatinine),
                    p_age: localAge,
                    p_sex: localGender,
                    p_patient_id: patientId
                });
            } catch (rpcErr) {
                console.warn('RPC calculate_ckd_stage fallback:', rpcErr);
            }

            setCreatinine('');
            setUrea('');
            loadExams();
        } catch (err) {
            console.error('Error saving exam:', err);
            alert('Erro ao salvar exame.');
        } finally {
            setLoading(false);
        }
    };

    const getStageColor = (stage: string) => {
        if (['G1', 'G2'].includes(stage)) return 'bg-green-900/40 text-green-300 border-green-800';
        if (['G3a', 'G3b'].includes(stage)) return 'bg-yellow-900/40 text-yellow-300 border-yellow-800';
        return 'bg-red-900/40 text-red-300 border-red-800';
    };

    const filteredPatients = patientSearch.trim()
        ? patients.filter(p => p.name.toLowerCase().includes(patientSearch.trim().toLowerCase()))
        : patients;

    const handleSelectPatient = (p: PatientOption) => {
        setSelectedPatientName(p.name);
        setPatientSearch(p.name);
        setDropdownOpen(false);
        if (onPatientSelect) onPatientSelect(p.id);
    };

    const handleClearPatient = () => {
        setSelectedPatientName(null);
        setPatientSearch('');
        if (onPatientSelect) onPatientSelect('');
    };

    // ─── RENDER ──────────────────────────────────────────────────────

    return (
        <div className="bg-[#0f172a] min-h-[400px] flex flex-col">
            {/* ─── Header ─── */}
            <div className="border-b border-slate-700/50 bg-slate-800/30 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                            <Activity className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Módulo de Função Renal</h2>
                            <p className="text-slate-400 text-xs">Protocolo CKD-EPI 2021 • Cálculo de TFG em tempo real</p>
                        </div>
                    </div>

                    {/* ─── Patient Selector ─── */}
                    <div className="flex items-center gap-2">
                        <div className="relative" ref={dropdownRef}>
                            <div className="flex items-center gap-1">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={patientSearch}
                                        onChange={(e) => { setPatientSearch(e.target.value); setDropdownOpen(true); }}
                                        onFocus={() => setDropdownOpen(true)}
                                        placeholder={patientsLoading ? 'Carregando...' : 'Buscar paciente...'}
                                        className="w-56 pl-8 pr-8 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                    />
                                    {selectedPatientName && (
                                        <button
                                            type="button"
                                            onClick={handleClearPatient}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Dropdown */}
                            {dropdownOpen && filteredPatients.length > 0 && (
                                <div className="absolute top-full right-0 mt-1 w-72 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-50 max-h-52 overflow-y-auto scrollbar-hide animate-in fade-in zoom-in-95 duration-200">
                                    {filteredPatients.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handleSelectPatient(p)}
                                            className={`w-full px-3 py-2.5 text-left text-sm hover:bg-emerald-500/10 flex items-center gap-2.5 transition-colors ${patientId === p.id ? 'bg-emerald-500/15 text-emerald-300' : 'text-white'
                                                }`}
                                        >
                                            <span className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                                                {p.name.charAt(0).toUpperCase()}
                                            </span>
                                            <span className="truncate">{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {dropdownOpen && !patientsLoading && filteredPatients.length === 0 && patientSearch.trim() && (
                                <div className="absolute top-full right-0 mt-1 w-72 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-50 p-4 text-center text-sm text-slate-500">
                                    Nenhum paciente encontrado
                                </div>
                            )}
                        </div>

                        {/* Config toggle */}
                        {patientId && (
                            <button
                                type="button"
                                onClick={() => setShowConfig(!showConfig)}
                                className={`p-2 rounded-lg border transition-all ${showConfig ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                                    }`}
                                title="Configurar idade e sexo do paciente"
                            >
                                <Settings2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Selected patient badge */}
                {patientId && selectedPatientName && (
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-sm text-emerald-300 font-medium">{selectedPatientName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{localAge} anos</span>
                            <span>•</span>
                            <span>{localGender === 'female' ? 'Feminino' : 'Masculino'}</span>
                        </div>
                    </div>
                )}

                {/* Config panel */}
                {patientId && showConfig && (
                    <div className="mt-3 flex items-center gap-4 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50 animate-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-400 font-medium">Idade:</label>
                            <input
                                type="number"
                                min={1}
                                max={120}
                                value={localAge}
                                onChange={(e) => setLocalAge(parseInt(e.target.value) || 40)}
                                className="w-16 px-2 py-1 rounded-md bg-slate-700 border border-slate-600 text-sm text-white focus:ring-1 focus:ring-emerald-500/50 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-400 font-medium">Sexo:</label>
                            <select
                                value={localGender}
                                onChange={(e) => setLocalGender(e.target.value as 'male' | 'female')}
                                className="px-2 py-1 rounded-md bg-slate-700 border border-slate-600 text-sm text-white focus:ring-1 focus:ring-emerald-500/50 focus:outline-none"
                            >
                                <option value="male">Masculino</option>
                                <option value="female">Feminino</option>
                            </select>
                        </div>
                        <p className="text-[10px] text-slate-500 ml-auto">Valores usados no cálculo CKD-EPI</p>
                    </div>
                )}
            </div>

            {/* ─── No Patient Selected ─── */}
            {!patientId && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-5 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                        <Activity className="w-8 h-8 text-emerald-400 opacity-70" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight mb-2">Selecione um paciente</h3>
                    <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                        Use o campo de busca acima para selecionar um paciente e visualizar ou registrar exames de função renal.
                    </p>
                </div>
            )}

            {/* ─── Main Content (when patient is selected) ─── */}
            {patientId && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                    {/* Left Column: Input */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-slate-300 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Novo Registro
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Creatinina (mg/dL)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={creatinine}
                                    onChange={(e) => setCreatinine(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-700 rounded-md border border-slate-600 text-sm text-white focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                                    placeholder="Ex: 0.9"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Ureia (mg/dL)</label>
                                <input
                                    type="number"
                                    value={urea}
                                    onChange={(e) => setUrea(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-700 rounded-md border border-slate-600 text-sm text-white focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                                    placeholder="Ex: 35"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Data do Exame</label>
                            <input
                                type="date"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 rounded-md border border-slate-600 text-sm text-white focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>

                        {/* Calculator Result Preview */}
                        {previewEgfr && (
                            <div className={`p-4 rounded-lg border flex items-center justify-between animate-in fade-in duration-300 ${previewEgfr >= 60 ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'
                                }`}>
                                <div>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">eTFG Estimada</p>
                                    <div className="text-2xl font-bold text-white">
                                        {previewEgfr} <span className="text-sm font-normal text-slate-400">mL/min/1.73m²</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        Calculado com {localAge} anos, {localGender === 'female' ? 'feminino' : 'masculino'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${classifyStage(previewEgfr).startsWith('G3') || classifyStage(previewEgfr).startsWith('G4') || classifyStage(previewEgfr).startsWith('G5')
                                        ? 'bg-red-900/50 text-red-300'
                                        : 'bg-green-900/50 text-green-300'
                                        }`}>
                                        Estágio {classifyStage(previewEgfr)}
                                    </span>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        {getStageDescription(classifyStage(previewEgfr)).desc}
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={!creatinine || loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
                        >
                            {loading ? 'Salvando...' : <><Save className="w-4 h-4" /> Registrar Exame</>}
                        </button>
                    </div>

                    {/* Right Column: History */}
                    <div className="border-l border-slate-700/50 pl-8 space-y-4">
                        <h4 className="font-medium text-slate-300 flex items-center gap-2">
                            <History className="w-4 h-4" /> Histórico Renal
                            {exams.length > 0 && (
                                <span className="text-xs text-slate-500 ml-auto">{exams.length} exame{exams.length > 1 ? 's' : ''}</span>
                            )}
                        </h4>

                        {exams.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <Info className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Nenhum exame registrado</p>
                                <p className="text-xs text-slate-600 mt-1">Registre o primeiro exame usando o formulário ao lado</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                {exams.map((exam) => {
                                    const stageInfo = getStageDescription(exam.drc_stage);
                                    return (
                                        <div key={exam.id} className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 transition-colors group">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-slate-400">{new Date(exam.exam_date).toLocaleDateString('pt-BR')}</p>
                                                    <p className="text-sm font-medium text-slate-200">
                                                        Cr: {exam.creatinine} <span className="text-slate-600">|</span> eTFG: {exam.egfr}
                                                        <span className="text-slate-600 ml-1">|</span>
                                                        <span className="text-slate-500 ml-1">Ureia: {exam.urea}</span>
                                                    </p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded font-medium border ${getStageColor(exam.drc_stage)}`}>
                                                    {exam.drc_stage}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {stageInfo.desc} — {stageInfo.action}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ─── Animated Renal Health Ring ─── */}
                    {(() => {
                        const latestExam = exams.length > 0 ? exams[0] : null;
                        const displayEgfr = previewEgfr ?? latestExam?.egfr ?? null;
                        const displayStage = displayEgfr ? classifyStage(displayEgfr) : null;
                        const displaySource = previewEgfr ? 'preview' : 'exam';

                        if (!displayEgfr || !displayStage) return null;

                        const stageInfo = getStageDescription(displayStage);
                        // Normalize eGFR to 0-100% (cap at 120)
                        const pct = Math.min(100, Math.max(0, (displayEgfr / 120) * 100));
                        // Ring SVG params
                        const radius = 80;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDashoffset = circumference - (pct / 100) * circumference;

                        // Color by stage
                        const stageColors: Record<string, { stroke: string; glow: string; text: string; bg: string; pulse: string }> = {
                            G1: { stroke: '#34d399', glow: 'rgba(52,211,153,0.35)', text: 'text-emerald-300', bg: 'bg-emerald-500/10', pulse: '#34d399' },
                            G2: { stroke: '#a3e635', glow: 'rgba(163,230,53,0.3)', text: 'text-lime-300', bg: 'bg-lime-500/10', pulse: '#a3e635' },
                            G3a: { stroke: '#fbbf24', glow: 'rgba(251,191,36,0.35)', text: 'text-amber-300', bg: 'bg-amber-500/10', pulse: '#fbbf24' },
                            G3b: { stroke: '#f97316', glow: 'rgba(249,115,22,0.35)', text: 'text-orange-300', bg: 'bg-orange-500/10', pulse: '#f97316' },
                            G4: { stroke: '#ef4444', glow: 'rgba(239,68,68,0.4)', text: 'text-red-300', bg: 'bg-red-500/10', pulse: '#ef4444' },
                            G5: { stroke: '#dc2626', glow: 'rgba(220,38,38,0.5)', text: 'text-red-400', bg: 'bg-red-600/10', pulse: '#dc2626' }
                        };
                        const colors = stageColors[displayStage] || stageColors.G1;

                        // Pulse speed: healthy=slow, critical=fast
                        const pulseSpeed = ['G1', 'G2'].includes(displayStage) ? '3s' : ['G3a', 'G3b'].includes(displayStage) ? '2s' : '1.2s';

                        // Sparkline from exam history (last 6 exams, reversed for chronological order)
                        const sparklineExams = [...exams].slice(0, 6).reverse();

                        return (
                            <div className="mt-6 p-6 rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 via-slate-900/30 to-slate-800/40 backdrop-blur-sm relative overflow-hidden">
                                {/* Background glow */}
                                <div
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
                                    style={{ background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)` }}
                                />

                                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                    {/* Ring */}
                                    <div className="relative flex-shrink-0">
                                        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                                            {/* Background ring */}
                                            <circle
                                                cx="100" cy="100" r={radius}
                                                fill="none"
                                                stroke="rgba(51,65,85,0.4)"
                                                strokeWidth="10"
                                            />
                                            {/* Animated progress ring */}
                                            <circle
                                                cx="100" cy="100" r={radius}
                                                fill="none"
                                                stroke={colors.stroke}
                                                strokeWidth="10"
                                                strokeLinecap="round"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={strokeDashoffset}
                                                style={{
                                                    transition: 'stroke-dashoffset 1.5s ease-out, stroke 0.8s ease',
                                                    filter: `drop-shadow(0 0 8px ${colors.glow})`
                                                }}
                                            />
                                        </svg>

                                        {/* Center content: Kidney + Score */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            {/* Pulsing kidney silhouette */}
                                            <svg
                                                width="40" height="44" viewBox="0 0 40 44"
                                                className="mb-1"
                                                style={{
                                                    animation: `renalPulse ${pulseSpeed} ease-in-out infinite`,
                                                    filter: `drop-shadow(0 0 6px ${colors.glow})`
                                                }}
                                            >
                                                {/* Kidney shape */}
                                                <path
                                                    d="M12 4 C5 4 2 10 2 16 C2 22 5 28 10 32 C14 35 16 38 18 40 C19 41 21 41 22 40 C24 38 26 35 30 32 C35 28 38 22 38 16 C38 10 35 4 28 4 C24 4 22 7 20 9 C18 7 16 4 12 4 Z"
                                                    fill={colors.stroke}
                                                    fillOpacity="0.25"
                                                    stroke={colors.stroke}
                                                    strokeWidth="1.5"
                                                    strokeLinejoin="round"
                                                />
                                                {/* Inner detail */}
                                                <path
                                                    d="M15 14 C13 18 14 22 17 24 M25 14 C27 18 26 22 23 24"
                                                    fill="none"
                                                    stroke={colors.stroke}
                                                    strokeWidth="1"
                                                    strokeOpacity="0.5"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <span className="text-2xl font-black text-white leading-none">{displayEgfr}</span>
                                            <span className="text-[10px] text-slate-400 mt-0.5">mL/min</span>
                                        </div>
                                    </div>

                                    {/* Info panel */}
                                    <div className="flex-1 min-w-0 text-center md:text-left">
                                        <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{
                                                    backgroundColor: colors.stroke,
                                                    boxShadow: `0 0 10px ${colors.glow}`,
                                                    animation: `renalDotPulse ${pulseSpeed} ease-in-out infinite`
                                                }}
                                            />
                                            <span className={`text-lg font-bold ${colors.text}`}>
                                                Estágio {displayStage}
                                            </span>
                                            {displaySource === 'preview' && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                                    Preview
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-300 font-medium">{stageInfo.desc}</p>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm">{stageInfo.action}</p>

                                        {/* Mini sparkline */}
                                        {sparklineExams.length >= 2 && (
                                            <div className="mt-4">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Tendência eTFG</p>
                                                <svg width="180" height="40" viewBox="0 0 180 40" className="opacity-80">
                                                    {/* Sparkline */}
                                                    {(() => {
                                                        const maxVal = Math.max(...sparklineExams.map(e => e.egfr), 120);
                                                        const minVal = Math.min(...sparklineExams.map(e => e.egfr), 0);
                                                        const range = maxVal - minVal || 1;
                                                        const points = sparklineExams.map((exam, i) => {
                                                            const x = (i / (sparklineExams.length - 1)) * 170 + 5;
                                                            const y = 35 - ((exam.egfr - minVal) / range) * 30;
                                                            return `${x},${y}`;
                                                        }).join(' ');
                                                        const areaPoints = points + ` 175,38 5,38`;
                                                        return (
                                                            <>
                                                                <polygon points={areaPoints} fill={colors.stroke} fillOpacity="0.08" />
                                                                <polyline points={points} fill="none" stroke={colors.stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                                                                {sparklineExams.map((exam, i) => {
                                                                    const x = (i / (sparklineExams.length - 1)) * 170 + 5;
                                                                    const y = 35 - ((exam.egfr - minVal) / range) * 30;
                                                                    return (
                                                                        <circle key={i} cx={x} cy={y} r="2.5" fill={colors.stroke} stroke="#0f172a" strokeWidth="1">
                                                                            <title>{exam.egfr} mL/min — {new Date(exam.exam_date).toLocaleDateString('pt-BR')}</title>
                                                                        </circle>
                                                                    );
                                                                })}
                                                            </>
                                                        );
                                                    })()}
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* CSS animations */}
                                <style>{`
                                @keyframes renalPulse {
                                    0%, 100% { transform: scale(1); opacity: 0.9; }
                                    50% { transform: scale(1.12); opacity: 1; }
                                }
                                @keyframes renalDotPulse {
                                    0%, 100% { transform: scale(1); box-shadow: 0 0 6px ${colors.glow}; }
                                    50% { transform: scale(1.3); box-shadow: 0 0 16px ${colors.glow}; }
                                }
                            `}</style>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default RenalFunctionModule;
