/**
 * V1.9.186-C/D/E — Clinical Team Command Center
 * ─────────────────────────────────────────────
 * Antes (V1.9.x pré-186): lista plana add/remove/toggle.
 *
 * Agora (Triple-A): status realtime via Supabase Presence + last_seen_at,
 * analytics inline (v_video_call_recipient_response, V1.9.174), Team Health
 * Score, Mapa de Carga, Quick Actions (WhatsApp template + Chat interno),
 * Drawer Modo Comando lateral, glow dinâmico por status.
 *
 * Reuso 95% — zero migration nova além de last_seen_at (V1.9.186-A).
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, X, UserPlus, Loader2, UserCheck, AlertTriangle,
  Phone, MessageCircle, Activity, Star, TrendingUp,
  Zap, Shield, Crown, Award, ChevronRight,
  Clock, BarChart3, Heart, Mail, Check
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { useTeamPresence } from '../hooks/useTeamPresence'
// V1.9.274 — Direcionamento de pacientes consent-first (Pedro+Ricardo+João 13/05)
import { ReferralsManager } from './team/ReferralsManager'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type PresenceStatus = 'online' | 'recently' | 'today' | 'offline' | 'never'

interface TeamMember {
  // base professional_teams
  id: string                    // pk de professional_teams
  team_member_id: string        // FK pro user
  relationship_type: string
  is_active: boolean
  notes: string | null
  // V1.9.188 — accepted_at NULL = convite pendente
  accepted_at: string | null
  // enriched users
  member_name: string
  member_email: string
  member_specialty: string
  member_phone: string | null
  member_avatar: string | null
  member_is_official: boolean
  // V1.9.186 — presence + métricas
  presence_status: PresenceStatus
  minutes_since_seen: number | null
  // métricas v_video_call_recipient_response
  total_received: number
  accepted: number
  expired: number
  accept_rate_pct: number | null
  avg_accept_latency_min: number | null
}

// V1.9.188 — convite pendente que o user atual recebeu
interface PendingInvite {
  id: string
  inviter_id: string
  relationship_type: string
  notes: string | null
  created_at: string
  inviter_name: string | null
  inviter_email: string | null
  inviter_specialty: string | null
  inviter_avatar: string | null
}

interface AvailableProfessional {
  id: string
  name: string
  email: string
  type: string
}

const RELATIONSHIP_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  colleague: { label: 'Colega', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: UserCheck },
  backup: { label: 'Backup', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-400/40', icon: Shield },
  supervisor: { label: 'Supervisor', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30', icon: Crown },
  resident: { label: 'Residente', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: Award },
}

const PRESENCE_LABELS: Record<PresenceStatus, { label: string; dotColor: string; ringColor: string }> = {
  online:   { label: 'Online agora',     dotColor: 'bg-emerald-400', ringColor: 'ring-emerald-500/40' },
  recently: { label: 'Ativo há pouco',   dotColor: 'bg-emerald-300', ringColor: 'ring-emerald-500/20' },
  today:    { label: 'Ativo hoje',       dotColor: 'bg-amber-400',   ringColor: 'ring-amber-500/20' },
  offline:  { label: 'Offline',          dotColor: 'bg-slate-500',   ringColor: 'ring-slate-700/40' },
  never:    { label: 'Nunca acessou',    dotColor: 'bg-slate-600',   ringColor: 'ring-slate-700/30' },
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatMinutes(min: number | null): string {
  if (min == null) return '—'
  if (min < 1) return 'agora'
  if (min < 60) return `há ${Math.floor(min)}min`
  if (min < 1440) return `há ${Math.floor(min / 60)}h`
  return `há ${Math.floor(min / 1440)}d`
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

function buildWhatsAppText(memberName: string, ownName: string): string {
  return encodeURIComponent(
    `Olá Dr(a). ${memberName.trim()},\n\n` +
    `Sou ${ownName.trim()} do MedCannLab. Tenho um paciente disponível para encaminhamento.\n\n` +
    `Você pode assumir? Posso compartilhar o relatório AEC pelo app se confirmar.`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function TeamHealthBadge({ score, memberCount }: { score: number; memberCount: number }) {
  const tier = score >= 85 ? { color: 'emerald', label: 'Excelente' }
              : score >= 70 ? { color: 'amber', label: 'Bom' }
              : score >= 50 ? { color: 'orange', label: 'Atenção' }
              : { color: 'red', label: 'Crítico' }
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-700/10 border-emerald-500/30 text-emerald-300',
    amber:   'from-amber-500/20 to-amber-700/10 border-amber-500/30 text-amber-300',
    orange:  'from-orange-500/20 to-orange-700/10 border-orange-500/30 text-orange-300',
    red:     'from-red-500/20 to-red-700/10 border-red-500/30 text-red-300',
  }[tier.color]
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br ${colorClasses} border`}>
      <Heart className="w-5 h-5" />
      <div>
        <div className="text-[10px] uppercase tracking-wide opacity-70">Saúde da Equipe</div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tabular-nums">{score}%</span>
          <span className="text-xs">· {tier.label}</span>
        </div>
      </div>
      {memberCount < 30 && (
        <div className="ml-2 text-[10px] text-slate-400 max-w-[120px] leading-tight" title="Estatística refinada quando atingir 30+ profissionais">
          Indicativo (n={memberCount})
        </div>
      )}
    </div>
  )
}

function CapacityBar({ member }: { member: TeamMember }) {
  // Simulação de carga baseada em total_received nas últimas 7d (sem volume real ainda)
  // Cap visual: 0-20 = baixa, 20-40 = média, >40 = alta
  const load = Math.min(100, Math.round((member.total_received / 50) * 100))
  const color = load >= 80 ? 'from-red-500 to-red-600'
              : load >= 50 ? 'from-amber-500 to-amber-600'
              : 'from-emerald-500 to-emerald-600'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-400 truncate min-w-[120px] max-w-[200px]">{member.member_name}</span>
      <div className="flex-1 h-2 bg-slate-800/60 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} transition-all`} style={{ width: `${load}%` }} />
      </div>
      <span className="text-slate-500 w-10 text-right tabular-nums">{load}%</span>
    </div>
  )
}

function TeamMemberCard({
  member, isOnline, isTopPerformer,
  onWhatsApp, onChat, onCommand, onToggleBackup, onRemove
}: {
  member: TeamMember
  isOnline: boolean
  isTopPerformer: boolean
  onWhatsApp: () => void
  onChat: () => void
  onCommand: () => void
  onToggleBackup: () => void
  onRemove: () => void
}) {
  // V1.9.188 — convite pendente (não aceito ainda pelo membro)
  const isPending = member.accepted_at == null
  const rel = RELATIONSHIP_LABELS[member.relationship_type] || RELATIONSHIP_LABELS.colleague
  const RelIcon = rel.icon
  const effectiveStatus: PresenceStatus = isOnline ? 'online' : member.presence_status
  const presence = PRESENCE_LABELS[effectiveStatus]
  const isBackup = member.relationship_type === 'backup'

  const acceptRateColor = (member.accept_rate_pct ?? 0) >= 80 ? 'text-emerald-400'
                       : (member.accept_rate_pct ?? 0) >= 50 ? 'text-amber-400'
                       : 'text-red-400'

  return (
    <div className={`group relative bg-slate-800/40 backdrop-blur-md border rounded-xl p-4 transition-all flex flex-col h-full
      ${member.is_active ? 'border-slate-700/50 hover:border-slate-600 hover:shadow-xl hover:-translate-y-0.5' : 'border-slate-700/30 opacity-70'}
      ${isBackup ? 'ring-2 ring-yellow-400/30 shadow-lg shadow-yellow-500/10' : ''}
      ${effectiveStatus === 'online' ? `ring-2 ${presence.ringColor} shadow-lg shadow-emerald-500/10` : ''}
      ${isTopPerformer ? 'border-emerald-400/40' : ''}
    `}>
      {/* Glow top accent */}
      <div className={`absolute top-0 left-0 right-0 h-px ${
        isBackup ? 'bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent' :
        isTopPerformer ? 'bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent' :
        effectiveStatus === 'online' ? 'bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent' :
        'bg-gradient-to-r from-transparent via-slate-600/30 to-transparent'
      }`} />

      {/* TOP — Avatar + Nome + Tags */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {member.member_avatar ? (
            <img src={member.member_avatar} alt={member.member_name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {getInitials(member.member_name)}
            </div>
          )}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-slate-900 ${presence.dotColor} ${effectiveStatus === 'online' ? 'animate-pulse' : ''}`} />
          {isTopPerformer && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center ring-2 ring-slate-900" title="Top Performer">
              <Award className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <button
            onClick={onCommand}
            className="text-white font-semibold truncate hover:text-emerald-300 transition-colors text-left text-sm w-full"
            title="Abrir Modo Comando"
          >
            {member.member_name}
          </button>
          <p className="text-[11px] text-slate-400 truncate">{member.member_specialty}</p>
        </div>
      </div>

      {/* Tags row */}
      <div className="flex items-center gap-1.5 flex-wrap mt-2">
        <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${rel.color}`}>
          <RelIcon className="w-2.5 h-2.5" />
          {rel.label}
        </span>
        {member.member_is_official && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
            OFICIAL
          </span>
        )}
        {isTopPerformer && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 inline-flex items-center gap-0.5">
            🏆 TOP
          </span>
        )}
        {!member.is_active && !isPending && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-red-400 bg-red-500/20 border border-red-500/30">
            INATIVO
          </span>
        )}
        {isPending && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-amber-300 bg-amber-500/20 border border-amber-500/40 inline-flex items-center gap-0.5" title="Aguardando aceite do profissional">
            ⏳ AGUARDANDO ACEITE
          </span>
        )}
      </div>

      {/* Status line */}
      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
        <Activity className="w-3 h-3" />
        <span>
          {effectiveStatus === 'online' ? presence.label : `${presence.label} ${formatMinutes(member.minutes_since_seen)}`}
        </span>
      </div>

      {/* Métricas */}
      {member.total_received > 0 ? (
        <div className="flex items-center justify-between gap-2 mt-3 px-3 py-2 bg-slate-900/40 rounded-lg border border-slate-700/30">
          <div className="text-center" title="Pacientes recebidos">
            <div className="text-base font-bold text-white tabular-nums">{member.total_received}</div>
            <div className="text-[9px] uppercase text-slate-500 tracking-wider">Recebidos</div>
          </div>
          <div className="w-px h-8 bg-slate-700/50" />
          <div className="text-center" title="Taxa de aceite">
            <div className={`text-base font-bold tabular-nums ${acceptRateColor}`}>
              {member.accept_rate_pct?.toFixed(0) ?? '—'}<span className="text-xs">%</span>
            </div>
            <div className="text-[9px] uppercase text-slate-500 tracking-wider">Aceite</div>
          </div>
          {member.avg_accept_latency_min != null && (
            <>
              <div className="w-px h-8 bg-slate-700/50" />
              <div className="text-center" title="Tempo médio de resposta">
                <div className="text-base font-bold text-white tabular-nums">
                  {member.avg_accept_latency_min.toFixed(1)}<span className="text-xs">min</span>
                </div>
                <div className="text-[9px] uppercase text-slate-500 tracking-wider">Latência</div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-3 px-3 py-2 bg-slate-900/30 rounded-lg border border-slate-700/20 text-center">
          <p className="text-[10px] text-slate-500">Sem chamadas registradas</p>
        </div>
      )}

      {/* Notes (truncated) */}
      {member.notes && (
        <p className="text-[10px] text-slate-500 mt-2 italic line-clamp-1" title={member.notes}>
          "{member.notes}"
        </p>
      )}

      {/* Quick actions horizontais com label (V1.9.187) */}
      <div className="grid grid-cols-5 gap-1.5 mt-auto pt-3 border-t border-slate-700/30">
        {member.member_phone ? (
          <button
            onClick={onWhatsApp}
            className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400 transition-all"
            title="WhatsApp · template CFM"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="text-[8px] uppercase tracking-wider font-semibold">Zap</span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/20 text-slate-600 cursor-not-allowed" title="Sem telefone cadastrado">
            <Phone className="w-3.5 h-3.5" />
            <span className="text-[8px] uppercase tracking-wider font-semibold">—</span>
          </div>
        )}
        <button
          onClick={onChat}
          className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/20 hover:border-blue-500/50 text-blue-400 transition-all"
          title="Chat interno"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="text-[8px] uppercase tracking-wider font-semibold">Chat</span>
        </button>
        <button
          onClick={onToggleBackup}
          className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg border transition-all ${
            isBackup
              ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300'
              : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:border-yellow-500/40 hover:text-yellow-400'
          }`}
          title={isBackup ? 'Desativar Backup' : 'Ativar Backup'}
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="text-[8px] uppercase tracking-wider font-semibold">Backup</span>
        </button>
        <button
          onClick={onCommand}
          className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/20 hover:border-purple-500/50 text-purple-400 transition-all"
          title="Modo Comando · drawer detalhado"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="text-[8px] uppercase tracking-wider font-semibold">Comando</span>
        </button>
        <button
          onClick={onRemove}
          className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/50 text-red-400 transition-all"
          title="Remover da equipe"
        >
          <X className="w-3.5 h-3.5" />
          <span className="text-[8px] uppercase tracking-wider font-semibold">Remover</span>
        </button>
      </div>
    </div>
  )
}

function CommandDrawer({
  member, onClose, onWhatsApp, onChat
}: {
  member: TeamMember
  onClose: () => void
  onWhatsApp: () => void
  onChat: () => void
}) {
  const rel = RELATIONSHIP_LABELS[member.relationship_type] || RELATIONSHIP_LABELS.colleague
  const presence = PRESENCE_LABELS[member.presence_status]

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
      <div
        className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-700/50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="flex items-center gap-3">
            {member.member_avatar ? (
              <img src={member.member_avatar} alt={member.member_name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {getInitials(member.member_name)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate">{member.member_name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block w-2 h-2 rounded-full ${presence.dotColor}`} />
                <span className="text-xs text-slate-400">{presence.label}</span>
                {member.minutes_since_seen != null && (
                  <span className="text-xs text-slate-500">· {formatMinutes(member.minutes_since_seen)}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Identidade */}
          <section>
            <h4 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Identidade</h4>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 space-y-1.5 text-xs">
              <div><span className="text-slate-500">Especialidade:</span> <span className="text-white">{member.member_specialty}</span></div>
              <div><span className="text-slate-500">Email:</span> <span className="text-white">{member.member_email}</span></div>
              {member.member_phone && (
                <div><span className="text-slate-500">Telefone:</span> <span className="text-white">{member.member_phone}</span></div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rel.color}`}>
                  {rel.label}
                </span>
                {member.member_is_official && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
                    OFICIAL
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Métricas */}
          <section>
            <h4 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3" /> Métricas (videocall)
            </h4>
            {member.total_received === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500">Sem chamadas registradas ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                  <div className="text-[9px] uppercase text-slate-500">Recebidos</div>
                  <div className="text-lg font-bold text-white tabular-nums">{member.total_received}</div>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                  <div className="text-[9px] uppercase text-slate-500">Aceite</div>
                  <div className={`text-lg font-bold tabular-nums ${
                    (member.accept_rate_pct ?? 0) >= 80 ? 'text-emerald-400' :
                    (member.accept_rate_pct ?? 0) >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {member.accept_rate_pct?.toFixed(0) ?? '—'}%
                  </div>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                  <div className="text-[9px] uppercase text-slate-500">Latência</div>
                  <div className="text-lg font-bold text-white tabular-nums">
                    {member.avg_accept_latency_min?.toFixed(1) ?? '—'}<span className="text-xs text-slate-400">min</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Notes */}
          {member.notes && (
            <section>
              <h4 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Observações</h4>
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 text-xs text-slate-300 italic">
                "{member.notes}"
              </div>
            </section>
          )}
        </div>

        {/* Footer fixo: ações principais */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 p-4 grid grid-cols-2 gap-2">
          {member.member_phone && (
            <button
              onClick={onWhatsApp}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm font-medium transition-colors"
            >
              <Phone className="w-4 h-4" /> WhatsApp
            </button>
          )}
          <button
            onClick={onChat}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 rounded-lg text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Chat Interno
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const TeamManagement: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const { confirm } = useConfirm()
  const { isOnline } = useTeamPresence()

  const [team, setTeam] = useState<TeamMember[]>([])
  const [availableProfessionals, setAvailableProfessionals] = useState<AvailableProfessional[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProfId, setSelectedProfId] = useState('')
  const [selectedRelationship, setSelectedRelationship] = useState('colleague')
  const [addNotes, setAddNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [drawerMember, setDrawerMember] = useState<TeamMember | null>(null)

  // V1.9.188 — convites pendentes que o user atual recebeu
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  const loadPendingInvites = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data, error } = await (supabase as any)
        .from('v_team_pending_invites_for_me')
        .select('id, inviter_id, relationship_type, notes, created_at, inviter_name, inviter_email, inviter_specialty, inviter_avatar')
      if (error) throw error
      setPendingInvites((data || []) as PendingInvite[])
    } catch (err: any) {
      console.error('[V1.9.188] erro ao carregar convites pendentes:', err)
    }
  }, [user?.id])

  const handleAcceptInvite = async (invite: PendingInvite) => {
    setAcceptingId(invite.id)
    try {
      const { error } = await (supabase as any)
        .from('professional_teams')
        .update({ accepted_at: new Date().toISOString(), is_active: true })
        .eq('id', invite.id)
      if (error) {
        // Trigger fn_team_member_limit retorna ERRCODE 'check_violation' se já em 2 equipes
        if (error.message?.includes('Limite') || error.message?.includes('limite') || error.code === '23514') {
          toast.warning('Limite atingido', 'Você já está em 2 equipes ativas. Saia de uma antes de aceitar nova.')
          return
        }
        throw error
      }
      await Promise.all([loadPendingInvites(), loadTeam()])
      toast.success('Convite aceito', `Você agora faz parte da equipe de ${invite.inviter_name || 'colega'}.`)
    } catch (err: any) {
      toast.error('Erro ao aceitar', err?.message || 'Falha desconhecida.')
    } finally {
      setAcceptingId(null)
    }
  }

  const handleRejectInvite = async (invite: PendingInvite) => {
    const ok = await confirm({
      title: 'Recusar convite?',
      message: `Você não fará parte da equipe de ${invite.inviter_name || 'este colega'}. Pode pedir pra ele convidar de novo depois.`,
      type: 'warning',
      confirmText: 'Recusar',
      cancelText: 'Cancelar'
    })
    if (!ok) return
    try {
      const { error } = await supabase.from('professional_teams').delete().eq('id', invite.id)
      if (error) throw error
      await loadPendingInvites()
      toast.success('Convite recusado', '')
    } catch (err: any) {
      toast.error('Erro', err?.message || 'Falha ao recusar')
    }
  }

  const loadTeam = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      // 1. base professional_teams
      const { data: links, error: linkErr } = await supabase
        .from('professional_teams')
        .select('id, team_member_id, relationship_type, is_active, notes, accepted_at')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: true })
      if (linkErr) throw linkErr

      const memberIds = (links || []).map((d: any) => d.team_member_id)
      if (memberIds.length === 0) {
        setTeam([])
        setIsLoading(false)
        return
      }

      // 2. enrich users + presence (v_team_member_overview)
      const { data: overview } = await (supabase as any)
        .from('v_team_member_overview')
        .select('id, name, email, type, specialty, phone, avatar_url, is_official, last_seen_at, presence_status, minutes_since_seen')
        .in('id', memberIds)

      const overviewMap = new Map<string, any>((overview || []).map((u: any) => [u.id, u]))

      // 3. enrich métricas (v_video_call_recipient_response — V1.9.174)
      const { data: metrics } = await (supabase as any)
        .from('v_video_call_recipient_response')
        .select('recipient_id, total_received, accepted, expired, accept_rate_pct, avg_accept_latency_min')
        .in('recipient_id', memberIds)

      const metricsMap = new Map<string, any>((metrics || []).map((m: any) => [m.recipient_id, m]))

      // Compose
      const enriched: TeamMember[] = (links || []).map((d: any) => {
        const u = overviewMap.get(d.team_member_id) || {}
        const m = metricsMap.get(d.team_member_id) || {}
        return {
          id: d.id,
          team_member_id: d.team_member_id,
          relationship_type: d.relationship_type,
          is_active: d.is_active,
          notes: d.notes,
          accepted_at: d.accepted_at || null,
          member_name: u.name || 'Profissional',
          member_email: u.email || '',
          member_specialty: u.specialty || 'Especialista',
          member_phone: u.phone || null,
          member_avatar: u.avatar_url || null,
          member_is_official: !!u.is_official,
          presence_status: (u.presence_status || 'never') as PresenceStatus,
          minutes_since_seen: u.minutes_since_seen != null ? Number(u.minutes_since_seen) : null,
          total_received: Number(m.total_received || 0),
          accepted: Number(m.accepted || 0),
          expired: Number(m.expired || 0),
          accept_rate_pct: m.accept_rate_pct != null ? Number(m.accept_rate_pct) : null,
          avg_accept_latency_min: m.avg_accept_latency_min != null ? Number(m.avg_accept_latency_min) : null,
        }
      })
      setTeam(enriched)
    } catch (err: any) {
      console.error('Erro ao carregar equipe:', err)
      toast.error('Erro ao carregar equipe', err?.message || 'Falha desconhecida.')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, toast])

  useEffect(() => {
    if (user?.id) {
      loadTeam()
      loadPendingInvites()
    }
  }, [user?.id, loadTeam, loadPendingInvites])

  // Team Health Score — só mostra se há membros
  const teamHealthScore = useMemo(() => {
    if (team.length === 0) return null
    const acceptRates = team.map(m => m.accept_rate_pct ?? 0).filter(v => v > 0)
    const onlineCount = team.filter(m => isOnline(m.team_member_id) || m.presence_status === 'online' || m.presence_status === 'recently').length
    const onlineRatio = team.length > 0 ? (onlineCount / team.length) : 0
    const latencies = team.map(m => m.avg_accept_latency_min).filter((v): v is number => v != null && v > 0)
    const acceptScore = acceptRates.length > 0 ? acceptRates.reduce((a, b) => a + b, 0) / acceptRates.length : 50
    const avgLatencyMin = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 5
    const latencyScore = Math.max(0, Math.min(100, 100 - avgLatencyMin * 5))
    return Math.round(acceptScore * 0.4 + onlineRatio * 100 * 0.3 + latencyScore * 0.3)
  }, [team, isOnline])

  // V1.9.187 — Top Performer detection (accept_rate >= 80% E recebidos >= 5)
  const topPerformerIds = useMemo(() => {
    return new Set(
      team
        .filter(m => (m.accept_rate_pct ?? 0) >= 80 && m.total_received >= 5)
        .map(m => m.team_member_id)
    )
  }, [team])

  // V1.9.187 — Filter + pagination
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'backup' | 'official'>('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6  // 2x3 ou 3x2 grid responsivo

  const filteredTeam = useMemo(() => {
    let list = team
    if (filterMode === 'online') {
      list = team.filter(m =>
        isOnline(m.team_member_id) ||
        m.presence_status === 'online' ||
        m.presence_status === 'recently'
      )
    } else if (filterMode === 'backup') {
      list = team.filter(m => m.relationship_type === 'backup')
    } else if (filterMode === 'official') {
      list = team.filter(m => m.member_is_official)
    }
    return list
  }, [team, filterMode, isOnline])

  const totalPages = Math.max(1, Math.ceil(filteredTeam.length / PAGE_SIZE))
  const pagedTeam = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredTeam.slice(start, start + PAGE_SIZE)
  }, [filteredTeam, page])

  // Reset page quando filtro muda
  useEffect(() => { setPage(1) }, [filterMode, team.length])

  const loadAvailableProfessionals = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, name, email, type')
      .in('type', ['profissional', 'admin'])
      .neq('id', user!.id)
      .order('name')
    const currentMemberIds = new Set(team.map(t => t.team_member_id))
    setAvailableProfessionals((data || []).filter((p: any) => !currentMemberIds.has(p.id)))
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
      // V1.9.188 — INSERT cria CONVITE (accepted_at=NULL, is_active=false)
      // Trigger fn_team_invite_notification dispara notification realtime no convidado.
      // Convidado precisa aceitar pra entrar na equipe ativa (limite 2 ativas).
      const { error } = await (supabase as any)
        .from('professional_teams')
        .insert({
          professional_id: user!.id,
          team_member_id: selectedProfId,
          relationship_type: selectedRelationship,
          notes: addNotes || null,
          accepted_at: null,    // pendente até aceite
          is_active: false      // ativa só após aceite
        })
      if (error) throw error
      setShowAddModal(false)
      await loadTeam()
      toast.success(
        'Convite enviado',
        'O profissional receberá uma notificação no app pra aceitar. Aparecerá na sua lista quando aceitar.'
      )
    } catch (err: any) {
      toast.error('Erro ao adicionar', err?.message || 'Falha desconhecida.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveMember = async (member: TeamMember) => {
    const ok = await confirm({
      title: 'Remover da equipe?',
      message: `${member.member_name} não receberá mais seus pacientes em fallback. Pode adicionar de novo depois.`,
      type: 'danger',
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    })
    if (!ok) return
    try {
      await supabase.from('professional_teams').delete().eq('id', member.id)
      await loadTeam()
      toast.success('Removido', 'Profissional removido da equipe.')
    } catch (err: any) {
      toast.error('Erro ao remover', err?.message || 'Falha desconhecida.')
    }
  }

  const handleToggleActive = async (member: TeamMember) => {
    try {
      await supabase
        .from('professional_teams')
        .update({ is_active: !member.is_active })
        .eq('id', member.id)
      await loadTeam()
    } catch (err: any) {
      toast.error('Erro', err?.message || 'Falha ao atualizar status')
    }
  }

  const handleToggleBackup = async (member: TeamMember) => {
    const newRel = member.relationship_type === 'backup' ? 'colleague' : 'backup'
    try {
      await supabase
        .from('professional_teams')
        .update({ relationship_type: newRel })
        .eq('id', member.id)
      await loadTeam()
      toast.success(
        newRel === 'backup' ? 'Modo Backup ativado' : 'Backup desativado',
        newRel === 'backup'
          ? `${member.member_name} agora recebe pacientes prioritariamente quando sua agenda enche.`
          : `${member.member_name} voltou a Colega.`
      )
    } catch (err: any) {
      toast.error('Erro', err?.message || 'Falha ao atualizar relação')
    }
  }

  const handleWhatsApp = (member: TeamMember) => {
    if (!member.member_phone) {
      toast.warning('Telefone não cadastrado', `${member.member_name} ainda não tem telefone no perfil.`)
      return
    }
    const phone = member.member_phone.replace(/\D/g, '')
    const text = buildWhatsAppText(member.member_name, user?.name || 'Colega')
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  const handleChat = (member: TeamMember) => {
    navigate(`/app/clinica/profissional/dashboard?section=chat-profissionais&peer=${member.team_member_id}`)
  }

  // Avoid unused-suppress lint by referencing handler
  void handleToggleActive

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    // V1.9.276 — Aproveita largura ultra-wide: max-w-5xl (1024px) → max-w-7xl (1280px, +25%).
    // Padding mais generoso (p-4 → p-6) pra respiração lateral.
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* V1.9.188 — Banner Convites Recebidos (sino + banner inline) */}
      {pendingInvites.length > 0 && (
        <div className="rounded-xl border border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-indigo-600/10 backdrop-blur-md p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Convites Recebidos
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200">
                  {pendingInvites.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Profissionais te convidaram pra equipe clínica deles. Aceite quando puder.
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            {pendingInvites.map((invite) => {
              const rel = RELATIONSHIP_LABELS[invite.relationship_type] || RELATIONSHIP_LABELS.colleague
              const RelIcon = rel.icon
              return (
                <div key={invite.id} className="flex items-center gap-3 bg-slate-900/40 border border-slate-700/40 rounded-lg p-3">
                  {invite.inviter_avatar ? (
                    <img src={invite.inviter_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {getInitials(invite.inviter_name || '??')}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">{invite.inviter_name || 'Profissional'}</span>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${rel.color}`}>
                        <RelIcon className="w-2.5 h-2.5" />
                        {rel.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {invite.inviter_specialty || 'Especialista'}
                      {invite.notes && <span className="text-slate-500 italic"> · "{invite.notes}"</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAcceptInvite(invite)}
                      disabled={acceptingId === invite.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 hover:border-emerald-500/60 text-emerald-300 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                    >
                      {acceptingId === invite.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Aceitar
                    </button>
                    <button
                      onClick={() => handleRejectInvite(invite)}
                      disabled={acceptingId === invite.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-300 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Recusar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Centro de Comando da Equipe
              <Star className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400">
              Profissionais que recebem seus pacientes em fallback · status em tempo real · analytics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {teamHealthScore != null && team.length > 0 && (
            <TeamHealthBadge score={teamHealthScore} memberCount={team.length} />
          )}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-900/20 hover:scale-105"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Info banner — preservado */}
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-300">
          <p>Quando sua agenda estiver cheia, pacientes verão os membros da sua equipe como alternativa.</p>
          <p className="text-slate-400 mt-1">
            Membros com status <strong>Backup</strong> são priorizados ·
            <span className="text-yellow-400"> ⚡ glow dourado</span> ·
            <span className="text-emerald-400"> 🟢 online em tempo real</span>
          </p>
        </div>
      </div>

      {/* Mapa de Carga */}
      {team.length > 0 && team.some(m => m.total_received > 0) && (
        <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700/40 rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" /> Mapa de Carga (chamadas recebidas históricas)
          </h3>
          <div className="space-y-2">
            {team.map((m) => <CapacityBar key={m.id} member={m} />)}
          </div>
        </div>
      )}

      {/* V1.9.274 — Direcionamento de pacientes consent-first.
          Mostrado se médico tem equipe formada (mesmo critério do botão "Sugerir"
          que fica disabled sem membros). Aprovado Pedro+Ricardo+João 13/05. */}
      <ReferralsManager
        teamMembers={team
          .filter(m => m.is_active && m.accepted_at)
          .map(m => ({
            team_member_id: m.team_member_id,
            member_name: m.member_name,
            member_specialty: m.member_specialty,
          }))}
      />

      {/* V1.9.187 — Filtros + contador */}
      {team.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/40 border border-slate-700/40 rounded-full">
            {([
              { id: 'all', label: 'Todos', count: team.length },
              { id: 'online', label: 'Online', count: team.filter(m => isOnline(m.team_member_id) || m.presence_status === 'online' || m.presence_status === 'recently').length },
              { id: 'backup', label: 'Backup', count: team.filter(m => m.relationship_type === 'backup').length },
              { id: 'official', label: 'Oficial', count: team.filter(m => m.member_is_official).length },
            ] as const).map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterMode(opt.id as any)}
                className={`px-3 py-1 text-[11px] font-medium rounded-full transition-all whitespace-nowrap ${
                  filterMode === opt.id
                    ? 'bg-emerald-600 text-white shadow shadow-emerald-900/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {opt.label} <span className="opacity-70 tabular-nums">({opt.count})</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            Mostrando {pagedTeam.length} de {filteredTeam.length}
            {totalPages > 1 && ` · Página ${page}/${totalPages}`}
          </p>
        </div>
      )}

      {/* Team Cards — grid responsivo side-by-side V1.9.187 */}
      {team.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum membro na equipe ainda</p>
          <p className="text-slate-500 text-sm mt-1">Adicione profissionais para montar sua rede de referência</p>
        </div>
      ) : pagedTeam.length === 0 ? (
        <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-slate-700/30">
          <p className="text-slate-400 text-sm">Nenhum membro neste filtro.</p>
          <button onClick={() => setFilterMode('all')} className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline">
            Mostrar todos
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {pagedTeam.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                isOnline={isOnline(member.team_member_id)}
                isTopPerformer={topPerformerIds.has(member.team_member_id)}
                onWhatsApp={() => handleWhatsApp(member)}
                onChat={() => handleChat(member)}
                onCommand={() => setDrawerMember(member)}
                onToggleBackup={() => handleToggleBackup(member)}
                onRemove={() => handleRemoveMember(member)}
              />
            ))}
          </div>

          {/* V1.9.187 — Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/40 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 text-xs font-medium rounded-lg transition-all tabular-nums ${
                      page === n
                        ? 'bg-emerald-600 text-white shadow shadow-emerald-900/20'
                        : 'text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/40'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/40 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modo Comando Drawer */}
      {drawerMember && (
        <CommandDrawer
          member={drawerMember}
          onClose={() => setDrawerMember(null)}
          onWhatsApp={() => handleWhatsApp(drawerMember)}
          onChat={() => { handleChat(drawerMember); setDrawerMember(null) }}
        />
      )}

      {/* Add Modal — preservado V1.9.181 styled */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
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
                className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
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
                className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="colleague">Colega</option>
                <option value="backup">Backup (priorizado quando agenda cheia · glow dourado)</option>
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
                className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
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
