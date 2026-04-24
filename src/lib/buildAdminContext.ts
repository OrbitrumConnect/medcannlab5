// =============================================================================
// buildAdminContext — V1.9.16
// =============================================================================
// Contexto factual do admin logado — métricas da plataforma MedCannLab.
// Segue o padrão de buildPatientContext e buildProfessionalContext:
//
//   - Fail-open: qualquer erro → retorna null, Core responde como antes.
//   - Só SELECT agregados, nada de INSERT/UPDATE.
//   - RLS-safe: admin tem policies que permitem leitura ampla; se um SELECT
//     específico falhar por RLS, o campo vira 0/null em vez de quebrar tudo.
//   - Campos ausentes viram null/0; Nôa admite em vez de inventar.
//
// Uso:
//   const ctx = await buildAdminContext(userId)
//   if (ctx) payload.userContext = ctx
// =============================================================================

import { supabase } from './supabase'

export interface AdminContext {
  role: 'admin'
  users: {
    total: number
    byRole: Record<string, number> // { patient: 14, professional: 8, admin: 5, ... }
  }
  appointmentsLast30d: {
    total: number
    completed: number
    scheduled: number
    cancelled: number
  }
  monetization: {
    pendingTxCount: number
    pendingAmountTotal: number // soma de amount dos wallet_transactions status='pending'
    walletsCount: number
  }
  library: {
    publishedCount: number
    totalCount: number
  }
  activityLast24h: {
    cognitiveEvents: number
  }
}

export async function buildAdminContext(userId: string): Promise<AdminContext | null> {
  if (!userId) return null

  try {
    const now = Date.now()
    const thirtyDaysAgoIso = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
    const twentyFourHoursAgoIso = new Date(now - 24 * 60 * 60 * 1000).toISOString()

    const [
      usersRes,
      apptLast30dRes,
      pendingTxRes,
      walletsCountRes,
      docsPublishedRes,
      docsTotalRes,
      cogEventsRes,
    ] = await Promise.all([
      // 1. Users + type (agregação client-side)
      supabase.from('users').select('type'),

      // 2. Appointments últimos 30d — buscar só status (agregação client-side)
      supabase
        .from('appointments')
        .select('status')
        .gte('appointment_date', thirtyDaysAgoIso),

      // 3. Pending wallet transactions (amount via agregação client-side)
      supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('status', 'pending'),

      // 4. Wallets count
      supabase.from('wallets').select('id', { count: 'exact', head: true }),

      // 5. Documents publicados
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true),

      // 6. Documents totais (para contraste com publicados)
      supabase.from('documents').select('id', { count: 'exact', head: true }),

      // 7. cognitive_events últimas 24h
      supabase
        .from('cognitive_events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgoIso),
    ])

    // --- Users breakdown por type ---
    const userRows = (usersRes.data ?? []) as Array<{ type: string | null }>
    const byRole: Record<string, number> = {}
    for (const r of userRows) {
      const key = (r?.type ?? 'unknown').toLowerCase()
      byRole[key] = (byRole[key] ?? 0) + 1
    }

    // --- Appointments breakdown por status ---
    const apptRows = (apptLast30dRes.data ?? []) as Array<{ status: string | null }>
    let apptCompleted = 0
    let apptScheduled = 0
    let apptCancelled = 0
    for (const r of apptRows) {
      const s = (r?.status ?? '').toLowerCase()
      if (s === 'completed') apptCompleted++
      else if (s === 'scheduled') apptScheduled++
      else if (s === 'cancelled') apptCancelled++
    }

    // --- Pending transactions soma ---
    const pendingRows = (pendingTxRes.data ?? []) as Array<{ amount: number | string | null }>
    const pendingAmountTotal = pendingRows.reduce((acc, r) => {
      const v = Number(r?.amount ?? 0)
      return acc + (isNaN(v) ? 0 : v)
    }, 0)

    const ctx: AdminContext = {
      role: 'admin',
      users: {
        total: userRows.length,
        byRole,
      },
      appointmentsLast30d: {
        total: apptRows.length,
        completed: apptCompleted,
        scheduled: apptScheduled,
        cancelled: apptCancelled,
      },
      monetization: {
        pendingTxCount: pendingRows.length,
        pendingAmountTotal,
        walletsCount: walletsCountRes.count ?? 0,
      },
      library: {
        publishedCount: docsPublishedRes.count ?? 0,
        totalCount: docsTotalRes.count ?? 0,
      },
      activityLast24h: {
        cognitiveEvents: cogEventsRes.count ?? 0,
      },
    }

    return ctx
  } catch (err) {
    console.warn('[buildAdminContext] falhou (fail-open, Core responde sem contexto):', err)
    return null
  }
}
