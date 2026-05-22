import React, { useState } from 'react'
import { Send, CheckCircle, Loader2, MessageCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'
import { toast } from 'sonner'

interface PatientSupportProps {
    onSuccess?: () => void
}

export const PatientSupport: React.FC<PatientSupportProps> = ({ onSuccess }) => {
    const { user } = useAuth()
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSend = async () => {
        if (!message.trim() || !user?.id) return
        setSending(true)
        try {
            const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin').limit(10)
            if (!admins?.length) throw new Error('Nenhum admin encontrado')

            let roomId: string | undefined
            const { data: existing } = await supabase.from('chat_participants').select('room_id, chat_rooms!inner(type)').eq('user_id', user.id).eq('chat_rooms.type', 'admin-support').limit(1)

            if (existing?.length) {
                roomId = existing[0].room_id
            } else {
                const { data: newRoom } = await supabase.from('chat_rooms').insert({ name: `Suporte • ${user.name || 'Paciente'}`, type: 'admin-support', created_by: user.id }).select('id').single()
                if (newRoom) {
                    roomId = newRoom.id
                    const participants = [{ room_id: roomId, user_id: user.id, role: 'patient' }, ...admins.map(a => ({ room_id: roomId, user_id: a.user_id, role: 'admin' }))]
                    await supabase.from('chat_participants').upsert(participants as any)
                }
            }

            if (roomId) {
                await supabase.from('chat_messages').insert({ room_id: roomId, sender_id: user.id, message: message.trim(), message_type: 'text' })
                setSent(true)
                setMessage('')
                if (onSuccess) onSuccess()
                toast.success('Mensagem enviada com sucesso!')
            }
        } catch (error) {
            console.error('Support error:', error)
            toast.error('Erro ao enviar mensagem.')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl space-y-6">
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Reportar Problema</h3>
                <p className="text-slate-400 text-sm">Nossa equipe de suporte técnico e clínico está à disposição.</p>
            </div>

            <div className="space-y-4">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva o que está acontecendo..."
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-red-500/50 min-h-[150px] resize-none transition-all"
                />

                {sent && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 animate-in zoom-in-95 duration-300">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <p className="text-sm text-emerald-300">Mensagem enviada! Responderemos em breve no seu chat de suporte.</p>
                    </div>
                )}

                <button
                    onClick={handleSend}
                    disabled={!message.trim() || sending || sent}
                    className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
                >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : sent ? <CheckCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                    {sending ? 'Enviando...' : sent ? 'Enviado' : 'Enviar Mensagem'}
                </button>
            </div>
        </div>
    )
}
