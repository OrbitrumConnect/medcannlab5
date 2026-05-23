/**
 * useForumPublish — F4.2-A (V1.9.403, 21/05/2026).
 *
 * Publica um dossiê (physician_research_dossiers) no Fórum: cria uma linha em
 * public.forum_posts com dossier_id linkado e status='pending_review' — o post
 * cai na análise do conselho (Ricardo + Eduardo) antes de virar debate.
 *
 * Caminho B (PLANO_F4): o dossiê é a FONTE; o form manual "Novo Caso" é
 * aposentado. Este hook é o trigger "Enviar ao Fórum".
 *
 * Consent: o médico ATESTA no publish que o paciente consentiu a discussão
 * pseudonimizada (consent_attested=true). Modelo MVP decidido 21/05.
 *
 * Schema forum_posts pós-F4.1: dossier_id, status, consent_attested,
 * patient_pseudonym já existem. RLS INSERT exige author_id = auth.uid().
 */
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { SavedDossier } from './useDossierPersist'

export interface UseForumPublishReturn {
  publishing: boolean
  error: string | null
  /** Publica o dossiê no fórum (status pending_review). Retorna true em sucesso. */
  publishDossier: (dossier: SavedDossier) => Promise<boolean>
}

export function useForumPublish(): UseForumPublishReturn {
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const publishDossier = useCallback(async (dossier: SavedDossier): Promise<boolean> => {
    setPublishing(true)
    setError(null)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const authorId = authData?.user?.id
      if (!authorId) {
        setError('Sessão não detectada. Faça login novamente.')
        return false
      }

      const snap = dossier.content
      const msgs = snap?.messages || []
      // content do post = a síntese (última fala da Matrix) — o dossiê completo
      // fica em physician_research_dossiers, linkado por dossier_id.
      const lastMatrix = [...msgs].reverse().find((m) => m.role === 'noa-matrix')
      const content = lastMatrix?.content?.trim()
        || 'Dossiê de pesquisa estruturado na Nôa Matrix (Z2). Conteúdo completo no dossiê vinculado.'
      const nCards = snap?.selectedCards?.length ?? 0
      const nPapers = snap?.attachedPapers?.length ?? 0

      // V1.9.437 — Camada 2a: bloquear publish sem pseudônimo (LGPD)
      const pseudonym = (snap?.patientPseudonym || (dossier as any).patient_pseudonym || '').toString().trim()
      if (!pseudonym) {
        setError('Dossiê sem pseudônimo de paciente não pode ser publicado no Fórum. Gere o dossiê a partir de um paciente em foco (Terminal de Atendimento → Paciente em foco → Nôa Matrix).')
        return false
      }

      // V1.9.437 — Camada 2b: detector heurístico de nome real no conteúdo
      // (lookup dos primeiros nomes dos pacientes vinculados ao médico via clinical_reports)
      try {
        const { data: reportRows } = await (supabase as any)
          .from('clinical_reports')
          .select('patient_id')
          .eq('doctor_id', authorId)
          .limit(500)
        const patientIds = Array.from(new Set(
          (reportRows || []).map((r: any) => r.patient_id).filter(Boolean)
        )) as string[]
        if (patientIds.length > 0) {
          const { data: usersRows } = await (supabase as any)
            .from('users')
            .select('full_name')
            .in('id', patientIds)
          const riskyFirstNames = Array.from(new Set(
            (usersRows || [])
              .map((u: any) => (u.full_name || '').split(/\s+/)[0]?.trim())
              .filter((name: string) =>
                !!name && name.length >= 3 &&
                !/^(paciente|dr|dra|sr|sra|test|teste|noa|nao|nada)$/i.test(name)
              )
          )) as string[]
          const namesFound = riskyFirstNames.filter((name) =>
            new RegExp(`\\b${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i').test(content)
          )
          if (namesFound.length > 0) {
            const proceed = typeof window !== 'undefined' && window.confirm(
              `⚠️ Detectamos possível nome real no conteúdo do dossiê:\n\n${namesFound.join(', ')}\n\n` +
              `Recomendado: CANCELAR e editar o dossiê removendo nomes próprios antes de publicar.\n\n` +
              `Confirma mesmo assim que o conteúdo está pseudonimizado adequadamente?`
            )
            if (!proceed) {
              setError('Publicação cancelada — edite o dossiê removendo nomes próprios e tente novamente.')
              return false
            }
          }
        }
      } catch (e) {
        // Falha no lookup NÃO bloqueia publish — é defesa adicional, não crítica
        console.warn('[useForumPublish] lookup de nomes falhou (publicação prossegue):', e)
      }

      const { error: insErr } = await (supabase as any)
        .from('forum_posts')
        .insert({
          author_id: authorId,
          dossier_id: dossier.id,
          title: dossier.title,
          content,
          description: `Dossiê de pesquisa — ${nCards} ${nCards === 1 ? 'item marcado' : 'itens marcados'}, ${nPapers} paper(s).`,
          category: 'caso-clinico',
          tags: [],
          status: 'pending_review',
          consent_attested: true,
          patient_pseudonym: pseudonym,
          allowed_roles: ['profissional', 'admin'],
          is_active: true,
        })
      if (insErr) {
        console.warn('[useForumPublish] erro ao publicar:', insErr)
        setError(insErr.message || 'Erro ao enviar ao Fórum.')
        return false
      }
      return true
    } catch (e: any) {
      console.error('[useForumPublish] publishDossier:', e)
      setError(e?.message || 'Erro inesperado ao enviar ao Fórum.')
      return false
    } finally {
      setPublishing(false)
    }
  }, [])

  return { publishing, error, publishDossier }
}
