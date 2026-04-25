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
  // [V1.9.52] Identidade do admin logado — fix do bug "Nôa não me identifica
  // pelo nome". Antes a IA tinha role+métricas mas não o nome, respondia
  // genérico "está logado como administrador" mesmo após "me identifique".
  identity: {
    name: string | null   // users.name (Pedro Henrique Passos Galluf)
    email: string | null
    type: string | null   // raw users.type (admin/master)
  }
  users: {
    total: number
    byRole: Record<string, number> // { patient: 14, professional: 8, admin: 5, ... }
  }
  // [V1.9.52] Métricas de relatórios clínicos — fix do bug "como adm, quantos
  // relatórios temos no total?" que caía em "fora do escopo" porque dado não
  // estava no contexto.
  clinical: {
    totalReports: number       // todos clinical_reports
    completedCount: number     // status='completed'
    sharedCount: number        // status='shared'
    last30d: number            // generated_at >= now-30d
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
      identityRes,        // [V1.9.52]
      usersRes,
      apptLast30dRes,
      pendingTxRes,
      walletsCountRes,
      docsPublishedRes,
      docsTotalRes,
      cogEventsRes,
      clinicalReportsRes, // [V1.9.52]
    ] = await Promise.all([
      // 0. [V1.9.52] Identidade do admin logado (nome, email, type)
      supabase.from('users').select('name, email, type').eq('id', userId).maybeSingle(),

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

      // 8. [V1.9.52] Clinical reports breakdown (status + last30d via agregação client-side)
      supabase
        .from('clinical_reports')
        .select('status, generated_at'),
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

    // --- [V1.9.52] Clinical reports breakdown ---
    const clinicalRows = (clinicalReportsRes.data ?? []) as Array<{ status: string | null; generated_at: string | null }>
    let clinicalCompleted = 0
    let clinicalShared = 0
    let clinicalLast30d = 0
    for (const r of clinicalRows) {
      const s = (r?.status ?? '').toLowerCase()
      if (s === 'completed') clinicalCompleted++
      else if (s === 'shared') clinicalShared++
      if (r?.generated_at && r.generated_at >= thirtyDaysAgoIso) clinicalLast30d++
    }

    // --- [V1.9.52] Identidade do admin logado ---
    const identityRow = (identityRes.data ?? null) as { name: string | null; email: string | null; type: string | null } | null

    const ctx: AdminContext = {
      role: 'admin',
      identity: {
        name: identityRow?.name ?? null,
        email: identityRow?.email ?? null,
        type: identityRow?.type ?? null,
      },
      users: {
        total: userRows.length,
        byRole,
      },
      clinical: {
        totalReports: clinicalRows.length,
        completedCount: clinicalCompleted,
        sharedCount: clinicalShared,
        last30d: clinicalLast30d,
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
