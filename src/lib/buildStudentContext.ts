// =============================================================================
// buildStudentContext — V1.9.17
// =============================================================================
// Contexto factual do aluno logado. Completa o conjunto de context-enrichment
// (paciente + profissional + admin + aluno). Segue mesmo padrão:
//
//   - Fail-open: qualquer erro → retorna null, Core responde como antes.
//   - Só SELECT agregados, RLS-safe.
//   - Campos ausentes viram 0/null; Nôa admite em vez de inventar.
//
// NOTA: hoje a base tem 0 alunos cadastrados e 0 lessons publicadas. Ainda
// assim o builder existe para Nôa responder honestamente ("você ainda não
// começou nenhuma aula") quando o conjunto for exercitado.
//
// Uso:
//   const ctx = await buildStudentContext(userId)
//   if (ctx) payload.userContext = ctx
// =============================================================================

import { supabase } from './supabase'

export interface StudentContext {
  role: 'student'
  // [V1.9.65] Identity unification
  identity: {
    name: string | null
    email: string | null
    type: string | null
  }
  daysOnPlatform: number | null
  progress: {
    points: number
    level: number
    totalSessions: number | null
    totalTimeSpentMinutes: number | null
    lastActivityAt: string | null
  }
  courses: {
    enrolledCount: number
    completedCount: number
    inProgressCount: number
  }
  content: {
    lessonsPublishedCount: number
    availableDocsCount: number // docs com 'student' em audience + is_published
  }
}

export async function buildStudentContext(userId: string): Promise<StudentContext | null> {
  if (!userId) return null

  try {
    const [userRes, profileRes, enrollmentsRes, lessonsRes, docsRes] = await Promise.all([
      // 1. created_at do user + identity (V1.9.65)
      supabase.from('users').select('created_at, name, email, type').eq('id', userId).maybeSingle(),

      // 2. Profile com progresso
      supabase
        .from('user_profiles')
        .select('points, level, total_sessions, total_time_spent, last_activity')
        .eq('user_id', userId)
        .maybeSingle(),

      // 3. Matrículas do aluno
      supabase
        .from('course_enrollments')
        .select('status, completed_at, progress')
        .eq('user_id', userId),

      // 4. Lessons publicadas no catálogo geral
      supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true),

      // 5. Documentos disponíveis pra aluno (audience contém 'student' + is_published)
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)
        .contains('target_audience', ['student']),
    ])

    // --- Dias na plataforma ---
    const createdAt = (userRes.data as any)?.created_at ?? null
    const daysOnPlatform = createdAt
      ? Math.max(
          0,
          Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        )
      : null

    // --- Progress ---
    const prof = (profileRes.data ?? {}) as {
      points?: number | null
      level?: number | null
      total_sessions?: number | null
      total_time_spent?: number | null
      last_activity?: string | null
    }
    const progress = {
      points: Number(prof.points ?? 0),
      level: Number(prof.level ?? 1),
      totalSessions: prof.total_sessions ?? null,
      totalTimeSpentMinutes: prof.total_time_spent ?? null,
      lastActivityAt: prof.last_activity ?? null,
    }

    // --- Courses breakdown ---
    const enrollments = (enrollmentsRes.data ?? []) as Array<{
      status: string | null
      completed_at: string | null
      progress: number | null
    }>
    let completedCount = 0
    let inProgressCount = 0
    for (const e of enrollments) {
      if (e?.completed_at) completedCount++
      else if (e?.status && e.status.toLowerCase() !== 'completed') inProgressCount++
    }

    const ctx: StudentContext = {
      role: 'student',
      identity: {
        name: (userRes.data as any)?.name ?? null,
        email: (userRes.data as any)?.email ?? null,
        type: (userRes.data as any)?.type ?? null,
      },
      daysOnPlatform,
      progress,
      courses: {
        enrolledCount: enrollments.length,
        completedCount,
        inProgressCount,
      },
      content: {
        lessonsPublishedCount: lessonsRes.count ?? 0,
        availableDocsCount: docsRes.count ?? 0,
      },
    }

    return ctx
  } catch (err) {
    console.warn('[buildStudentContext] falhou (fail-open, Core responde sem contexto):', err)
    return null
  }
}
