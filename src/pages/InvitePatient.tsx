import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { UserPlus, Loader2, CheckCircle, AlertCircle, Stethoscope, Shield } from 'lucide-react'

const InvitePatient: React.FC = () => {
    const [searchParams] = useSearchParams()
    const { user, isLoading } = useAuth()
    const navigate = useNavigate()
    const doctorId = searchParams.get('doctor_id')

    const [doctorName, setDoctorName] = useState<string | null>(null)
    const [status, setStatus] = useState<'loading' | 'login-required' | 'confirm' | 'already-linked' | 'success' | 'error'>('loading')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (!doctorId) {
            setStatus('error')
            setErrorMessage('Link de convite inválido (ID do profissional ausente).')
            return
        }

        const loadDoctor = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', doctorId)
                    .single()

                if (error || !data) {
                    throw new Error('Profissional não encontrado.')
                }

                setDoctorName(data.name)

                // Se usuário já está logado, verificar se já está vinculado
                if (user) {
                    const { data: existing } = await supabase
                        .from('users')
                        .select('invited_by')
                        .eq('id', user.id)
                        .single()

                    if (existing?.invited_by === doctorId) {
                        setStatus('already-linked')
                    } else {
                        setStatus('confirm')
                    }
                } else if (!isLoading) {
                    setStatus('login-required')
                }
            } catch (err: any) {
                setStatus('error')
                setErrorMessage(err.message || 'Erro ao buscar dados do profissional.')
            }
        }

        if (!isLoading) {
            loadDoctor()
        }
    }, [doctorId, user, isLoading])

    const handleConnect = async () => {
        if (!user || !doctorId) return

        setStatus('loading')
        try {
            // Atualizar invited_by do paciente
            await supabase
                .from('users')
                .update({ invited_by: doctorId, updated_at: new Date().toISOString() })
                .eq('id', user.id)

            // Criar sala de chat
            const { data, error } = await supabase.rpc('create_chat_room_for_patient_uuid', {
                p_patient_id: user.id,
                p_professional_id: doctorId
            })

            if (error) throw error

            setStatus('success')

            setTimeout(() => {
                navigate('/app/clinica/paciente/dashboard')
            }, 2500)

        } catch (err: any) {
            console.error('Erro ao conectar via convite:', err)
            setStatus('error')
            setErrorMessage(err.message || 'Falha ao criar conexão.')
        }
    }

    // Salvar doctor_id no localStorage para redirecionar após login/cadastro
    const saveRedirectAndGo = (path: string) => {
        localStorage.setItem('invite_redirect', window.location.pathname + window.location.search)
        navigate(path)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4">
            <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full border border-slate-700/50 shadow-2xl">
                
                {status === 'loading' && (
                    <div className="text-center py-8">
                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                        <p className="text-slate-300">Processando convite...</p>
                    </div>
                )}

                {status === 'login-required' && (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Stethoscope className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Convite Médico</h2>
                        <p className="text-slate-300 mb-2">
                            Você foi convidado(a) por
                        </p>
                        <p className="text-lg font-semibold text-emerald-400 mb-6">
                            Dr(a). {doctorName || '...'}
                        </p>
                        <div className="bg-slate-800/60 rounded-xl p-4 mb-6 border border-slate-700/50">
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                <span>Plataforma certificada LGPD</span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Crie sua conta ou faça login para se conectar ao seu profissional de saúde.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => saveRedirectAndGo('/')}
                                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                            >
                                Criar Conta / Fazer Login
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-4">
                            Use o <strong>mesmo email</strong> informado ao seu médico para vincular automaticamente.
                        </p>
                    </div>
                )}

                {status === 'confirm' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <UserPlus className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Conectar com Profissional</h2>
                        <p className="text-slate-300 mb-6">
                            Deseja se conectar com <strong className="text-emerald-400">Dr(a). {doctorName}</strong> e iniciar seu acompanhamento?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/app/clinica/paciente/dashboard')}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConnect}
                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold hover:from-emerald-500 hover:to-green-500 transition-all"
                            >
                                Conectar Agora
                            </button>
                        </div>
                    </div>
                )}

                {status === 'already-linked' && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Já Conectado!</h2>
                        <p className="text-slate-300 mb-6">
                            Você já está vinculado(a) ao <strong className="text-emerald-400">Dr(a). {doctorName}</strong>.
                        </p>
                        <button
                            onClick={() => navigate('/app/clinica/paciente/dashboard')}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold py-3 rounded-xl transition-all"
                        >
                            Ir para o Dashboard
                        </button>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Conectado com Sucesso!</h2>
                        <p className="text-slate-300 mb-4">
                            Redirecionando para seu painel...
                        </p>
                        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin mx-auto" />
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Ops! Algo deu errado.</h2>
                        <p className="text-slate-300 mb-6">{errorMessage}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors"
                        >
                            Voltar ao Início
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default InvitePatient
