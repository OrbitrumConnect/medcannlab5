import React, { useState, useEffect } from 'react'
import { Users, Plus, X, UserPlus, Shield, Loader2, UserCheck, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface TeamMember {
  id: string
  team_member_id: string
  member_name: string
  member_email: string
  member_specialty: string
  relationship_type: string
  is_active: boolean
  notes: string | null
}

interface AvailableProfessional {
  id: string
  name: string
  email: string
  type: string
}

const RELATIONSHIP_LABELS: Record<string, { label: string; color: string }> = {
  colleague: { label: 'Colega', color: 'text-blue-400 bg-blue-500/20' },
  backup: { label: 'Backup', color: 'text-amber-400 bg-amber-500/20' },
  supervisor: { label: 'Supervisor', color: 'text-purple-400 bg-purple-500/20' },
  resident: { label: 'Residente', color: 'text-green-400 bg-green-500/20' },
}

const TeamManagement: React.FC = () => {
  const { user } = useAuth()
  const [team, setTeam] = useState<TeamMember[]>([])
  const [availableProfessionals, setAvailableProfessionals] = useState<AvailableProfessional[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProfId, setSelectedProfId] = useState('')
  const [selectedRelationship, setSelectedRelationship] = useState('colleague')
  const [addNotes, setAddNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user?.id) loadTeam()
  }, [user?.id])

  const loadTeam = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('professional_teams')
        .select('id, team_member_id, relationship_type, is_active, notes')
        .eq('professional_id', user!.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Enrich with user data
      const memberIds = (data || []).map(d => d.team_member_id)
      if (memberIds.length === 0) {
        setTeam([])
        setIsLoading(false)
        return
      }

      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, type')
        .in('id', memberIds)

      const usersMap = new Map((users || []).map(u => [u.id, u]))

      const enriched: TeamMember[] = (data || []).map(d => {
        const u = usersMap.get(d.team_member_id)
        return {
          id: d.id,
          team_member_id: d.team_member_id,
          member_name: u?.name || 'Profissional',
          member_email: u?.email || '',
          member_specialty: (u as any)?.specialty || 'Especialista',
          relationship_type: d.relationship_type,
          is_active: d.is_active,
          notes: d.notes,
        }
      })

      setTeam(enriched)
    } catch (err) {
      console.error('Erro ao carregar equipe:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableProfessionals = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, name, email, type')
      .in('type', ['profissional', 'admin'])
      .neq('id', user!.id)
      .order('name')

    const currentMemberIds = new Set(team.map(t => t.team_member_id))
    setAvailableProfessionals((data || []).filter(p => !currentMemberIds.has(p.id)))
  }

  const handleOpenAdd = () => {
    loadAvailableProfessionals()
    setShowAddModal(true)
    setSelectedProfId('')
    setSelectedRelationship('colleague')
    setAddNotes('')
  }

  const handleAddMember = async () => {
    if (!selectedProfId) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('professional_teams')
        .insert({
          professional_id: user!.id,
          team_member_id: selectedProfId,
          relationship_type: selectedRelationship,
          notes: addNotes || null,
        })

      if (error) throw error
      setShowAddModal(false)
      await loadTeam()
    } catch (err) {
      console.error('Erro ao adicionar membro:', err)
      alert('Erro ao adicionar membro à equipe.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveMember = async (teamId: string) => {
    if (!confirm('Remover este profissional da sua equipe?')) return
    try {
      await supabase.from('professional_teams').delete().eq('id', teamId)
      await loadTeam()
    } catch (err) {
      console.error('Erro ao remover:', err)
    }
  }

  const handleToggleActive = async (teamId: string, currentActive: boolean) => {
    try {
      await supabase
        .from('professional_teams')
        .update({ is_active: !currentActive })
        .eq('id', teamId)
      await loadTeam()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Minha Equipe Clínica</h2>
            <p className="text-xs text-slate-400">
              Profissionais que podem receber seus pacientes quando sua agenda estiver cheia
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Info */}
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-300">
          <p>Quando sua agenda estiver cheia, pacientes verão os membros da sua equipe como alternativa.</p>
          <p className="text-slate-400 mt-1">Membros com status <strong>Backup</strong> são priorizados na sugestão.</p>
        </div>
      </div>

      {/* Team List */}
      {team.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum membro na equipe ainda</p>
          <p className="text-slate-500 text-sm mt-1">Adicione profissionais para montar sua rede de referência</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {team.map((member) => {
            const rel = RELATIONSHIP_LABELS[member.relationship_type] || RELATIONSHIP_LABELS.colleague
            return (
              <div
                key={member.id}
                className={`bg-slate-800/40 backdrop-blur-md border rounded-xl p-4 flex items-center gap-4 transition-all ${
                  member.is_active ? 'border-slate-700/50' : 'border-slate-700/30 opacity-60'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">
                  {member.member_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">{member.member_name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rel.color}`}>
                      {rel.label}
                    </span>
                    {!member.is_active && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-red-400 bg-red-500/20">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{member.member_email}</p>
                  {member.notes && <p className="text-xs text-slate-500 mt-1 truncate">{member.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(member.id, member.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      member.is_active
                        ? 'text-green-400 hover:bg-green-500/20'
                        : 'text-slate-500 hover:bg-slate-700'
                    }`}
                    title={member.is_active ? 'Desativar' : 'Ativar'}
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Remover da equipe"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                Adicionar à Equipe
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-sm text-slate-300 font-medium">Profissional</label>
              <select
                value={selectedProfId}
                onChange={(e) => setSelectedProfId(e.target.value)}
                className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Selecione...</option>
                {availableProfessionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-300 font-medium">Tipo de Relação</label>
              <select
                value={selectedRelationship}
                onChange={(e) => setSelectedRelationship(e.target.value)}
                className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="colleague">Colega</option>
                <option value="backup">Backup (priorizado quando agenda cheia)</option>
                <option value="supervisor">Supervisor</option>
                <option value="resident">Residente</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-300 font-medium">Observações (opcional)</label>
              <input
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                placeholder="Ex: Atende às quartas-feiras"
                className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddMember}
                disabled={!selectedProfId || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamManagement
