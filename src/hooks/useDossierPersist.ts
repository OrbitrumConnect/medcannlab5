/**
 * useDossierPersist — persistência de dossiês de pesquisa Nôa Matrix.
 *
 * V1.9.392 (F3-A.2 Sprint 2 — 20/05/2026): persistência completa.
 * Estende F3-A.1 (V1.9.390 dossierExport.ts — PDF cliente-side puro).
 *
 * Schema: public.physician_research_dossiers (criada via Management API).
 *  - RLS por physician_id (médico vê só os próprios + admin tudo)
 *  - content jsonb = snapshot IMUTÁVEL da sessão (cards + papers + conversa)
 *  - status: 'draft' | 'archived'
 *
 * Princípio "polir não inventar":
 *  - reusa tipos DossierData de dossierExport.ts (F3-A.1)
 *  - reusa supabase client existente
 *  - pattern RLS idêntico a clinical_reports
 *
 * Snapshot imutável: o content preserva o estado do MOMENTO da geração.
 * clinical_reports/clinical_rationalities podem mudar depois — o dossiê
 * é foto fixa do que o médico viu/estruturou. Re-gerar PDF a partir do
 * content salvo NÃO depende do estado atual do banco.
 *
 * Memory: project_visao_final_eixo_pesquisa_19_05 (F3 = fechar dossiê).
 */
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DossierData } from '../lib/dossierExport'

export interface SavedDossier {
  id: string
  physician_id: string
  patient_id: string | null
  patient_pseudonym: string | null
  title: string
  content: DossierData
  status: 'draft' | 'archived'
  generated_at: string
  updated_at: string
}

export interface UseDossierPersistReturn {
  saving: boolean
  loading: boolean
  error: string | null
  /** Persiste um dossiê. Retorna o id criado ou null em falha. */
  saveDossier: (data: DossierData, patientId?: string | null) => Promise<string | null>
  /** Lista dossiês do médico logado (mais recentes primeiro).
   *  V1.9.483 — parâmetro patientId opcional filtra apenas dossiês do paciente
   *  informado (continuidade interpretativa Matrix-Longitudinal). Sem patientId,
   *  comportamento original preservado (lista todos do médico). */
  listDossiers: (limit?: number, patientId?: string | null) => Promise<SavedDossier[]>
  /** Remove um dossiê (RLS garante que só o dono/admin consegue). */
  deleteDossier: (id: string) => Promise<boolean>
}

/**
 * Gera título legível pro dossiê a partir dos dados.
 * Ex: "Dossiê 20/05/2026 · Paciente #C0F4" ou "Dossiê 20/05/2026 · 3 casos"
 */
function buildTitle(data: DossierData): string {
  const dateStr = data.generatedAt.toLocaleDateString('pt-BR')
  if (data.patientPseudonym) {
    return `Dossiê ${dateStr} · Paciente #${data.patientPseudonym}`
  }
  const n = data.selectedCards.length
  return `Dossiê ${dateStr} · ${n} ${n === 1 ? 'item' : 'itens'} marcados`
}

export function useDossierPersist(): UseDossierPersistReturn {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveDossier = useCallback(async (data: DossierData, patientId?: string | null): Promise<string | null> => {
    setSaving(true)
    setError(null)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const physicianId = authData?.user?.id
      if (!physicianId) {
        setError('Sessão não detectada. Faça login novamente.')
        return null
      }
      const { data: row, error: insertErr } = await (supabase as any)
        .from('physician_research_dossiers')
        .insert({
          physician_id: physicianId,
          patient_id: patientId || null,
          patient_pseudonym: data.patientPseudonym || null,
          title: buildTitle(data),
          content: data,         // snapshot completo (jsonb)
          status: 'draft',
        })
        .select('id')
        .single()
      if (insertErr) {
        console.warn('[useDossierPersist] erro ao salvar:', insertErr)
        setError(insertErr.message || 'Erro ao salvar dossiê.')
        return null
      }
      return row?.id || null
    } catch (e: any) {
      console.error('[useDossierPersist] saveDossier:', e)
      setError(e?.message || 'Erro inesperado ao salvar.')
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const listDossiers = useCallback(async (limit = 10, patientId?: string | null): Promise<SavedDossier[]> => {
    setLoading(true)
    setError(null)
    try {
      // V1.9.483 — filtro opcional por patient_id. Quando informado, retorna
      // apenas dossiês do paciente para alimentar continuidade interpretativa
      // do Matrix-Longitudinal (camada 1.3). Sem patientId, lista todos do
      // médico (comportamento original V1.9.392 preservado pra "Meus Dossiês").
      let query = (supabase as any)
        .from('physician_research_dossiers')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(limit)
      if (patientId) {
        query = query.eq('patient_id', patientId)
      }
      const { data: rows, error: listErr } = await query
      if (listErr) {
        console.warn('[useDossierPersist] erro ao listar:', listErr)
        setError(listErr.message || 'Erro ao carregar dossiês.')
        return []
      }
      return (rows || []) as SavedDossier[]
    } catch (e: any) {
      console.error('[useDossierPersist] listDossiers:', e)
      setError(e?.message || 'Erro inesperado ao listar.')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteDossier = useCallback(async (id: string): Promise<boolean> => {
    setError(null)
    try {
      const { error: delErr } = await (supabase as any)
        .from('physician_research_dossiers')
        .delete()
        .eq('id', id)
      if (delErr) {
        console.warn('[useDossierPersist] erro ao deletar:', delErr)
        setError(delErr.message || 'Erro ao remover dossiê.')
        return false
      }
      return true
    } catch (e: any) {
      console.error('[useDossierPersist] deleteDossier:', e)
      setError(e?.message || 'Erro inesperado ao remover.')
      return false
    }
  }, [])

  return { saving, loading, error, saveDossier, listDossiers, deleteDossier }
}
