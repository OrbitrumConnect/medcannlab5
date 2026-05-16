// =====================================================
// 🩺 EDGE FUNCTION: RENAL SIGNAL EXTRACTOR (V1.9.307)
// =====================================================
// Varre noa_logs.captation_extra com classification='laboratorios_inline',
// extrai creatinina/proteinúria/eGFR via regex, calcula CKD-EPI 2021, persiste
// sugestão em renal_inline_suggestions (pending). Médico aprova via UI →
// vira renal_exams oficial.
//
// ZERO regressão: pipeline paralelo, read-only nos noa_logs, escreve só na
// nova tabela renal_inline_suggestions. Não toca AEC FSM nem Pipeline V1.9.95.
//
// Trigger: invocação HTTP (manual ou via pg_cron futuro). Idempotente: pula
// se já existe sugestão pra mesmo source_turn_id+creatinine (UNIQUE INDEX).
//
// Feature flag: renal_inline_suggestions=true (verificado antes de processar).
// =====================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =====================================================
// CKD-EPI 2021 — espelho de src/lib/renalCalculations.ts
// =====================================================
function calculateEGFR(creatinine: number, age: number, sex: 'male' | 'female'): number {
  const K = sex === 'female' ? 0.7 : 0.9
  const alphaFactor = sex === 'female' ? -0.241 : -0.302
  const genderFactor = sex === 'female' ? 1.012 : 1
  const scrOverK = creatinine / K
  const minPart = Math.min(scrOverK, 1) ** alphaFactor
  const maxPart = Math.max(scrOverK, 1) ** -1.2
  const egfr = 142 * minPart * maxPart * (0.9938 ** age) * genderFactor
  return parseFloat(egfr.toFixed(1))
}

function classifyStage(egfr: number): string {
  if (egfr >= 90) return 'G1'
  if (egfr >= 60) return 'G2'
  if (egfr >= 45) return 'G3a'
  if (egfr >= 30) return 'G3b'
  if (egfr >= 15) return 'G4'
  return 'G5'
}

// =====================================================
// REGEX PARSERS — detecta valores laboratoriais inline na fala do paciente
// =====================================================
interface ExtractedLabs {
  creatinine_mg_dl?: number
  proteinuria_acr_mg_g?: number
  egfr_mentioned?: number
  source_text: string
}

function parseLaboratoriosInline(text: string): ExtractedLabs | null {
  if (!text) return null
  const result: ExtractedLabs = { source_text: text }
  let foundAny = false

  // Creatinina: "creatinina 1.61", "creatinina: 1,61 mg/dL", "Cr 1.61"
  const creatRe = /\b(?:creatinina|cr)\s*[:=]?\s*(\d+[.,]\d+)\s*(?:mg\/?dl)?/i
  const creatMatch = text.match(creatRe)
  if (creatMatch) {
    const val = parseFloat(creatMatch[1].replace(',', '.'))
    if (val >= 0.3 && val <= 20) {  // range fisiológico
      result.creatinine_mg_dl = val
      foundAny = true
    }
  }

  // Proteinúria A/Cr (albumina/creatinina ratio): "1924 mg/g", "ACR 1924"
  const acrRe = /(?:albumina[\/\s]?creatinina|a\/cr|acr|rel[aã][cç][aã]o[^.]*albumin[^.]*creatinin[^.]*)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:mg\/?g)?/i
  const acrMatch = text.match(acrRe)
  if (acrMatch) {
    const val = parseFloat(acrMatch[1].replace(',', '.'))
    if (val >= 1 && val <= 100000) {
      result.proteinuria_acr_mg_g = val
      foundAny = true
    }
  }

  // eGFR mencionada explicitamente: "eGFR 32", "TFG 30 mL/min"
  const egfrRe = /\b(?:egfr|tfg|filtrac[aã]o\s*glomerular)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i
  const egfrMatch = text.match(egfrRe)
  if (egfrMatch) {
    const val = parseFloat(egfrMatch[1].replace(',', '.'))
    if (val >= 1 && val <= 200) {
      result.egfr_mentioned = val
      foundAny = true
    }
  }

  return foundAny ? result : null
}

// =====================================================
// HANDLER PRINCIPAL
// =====================================================
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente ausentes')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Feature flag check (kill switch)
    const { data: flag } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('flag', 'renal_inline_suggestions')
      .maybeSingle()

    if (!flag?.enabled) {
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        reason: 'feature_flag_disabled'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Body opcional: { since_minutes: 30, dry_run: false }
    let body: any = {}
    try { body = await req.json() } catch { /* ok */ }
    const sinceMinutes = body.since_minutes || 30
    const dryRun = !!body.dry_run
    const userIdFilter = body.user_id  // opcional, processa só 1 user

    const sinceIso = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString()

    // Buscar captation_extras recentes com laboratorios_inline
    let query = supabase
      .from('noa_logs')
      .select('id, user_id, payload, created_at')
      .eq('interaction_type', 'captation_extra')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(100)

    if (userIdFilter) query = query.eq('user_id', userIdFilter)

    const { data: logs, error: logsError } = await query
    if (logsError) throw logsError

    let processedCount = 0
    let suggestionsCreated = 0
    let skippedDuplicates = 0
    let skippedNoMatch = 0
    const errors: string[] = []

    for (const log of (logs || [])) {
      const extras = log?.payload?.extras
      if (!Array.isArray(extras)) continue

      // Filtra apenas classification=laboratorios_inline
      const labExtras = extras.filter((e: any) => e?.classification === 'laboratorios_inline' && e?.text)
      if (labExtras.length === 0) continue

      processedCount++

      // Combina texto de todos os extras laboratoriais do mesmo turn
      const combinedText = labExtras.map((e: any) => e.text).join('. ')
      const labs = parseLaboratoriosInline(combinedText)
      if (!labs) {
        skippedNoMatch++
        continue
      }

      // Buscar metadados do paciente (idade + sexo) — necessários pra CKD-EPI
      const { data: patient } = await supabase
        .from('users')
        .select('id, birth_date, name')
        .eq('id', log.user_id)
        .maybeSingle()

      let age: number | null = null
      let sex: 'male' | 'female' | null = null

      if (patient?.birth_date) {
        const birth = new Date(patient.birth_date)
        const today = new Date()
        age = today.getFullYear() - birth.getFullYear()
        if (today.getMonth() < birth.getMonth() ||
            (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
          age--
        }
      }

      // Buscar sexo em user_profiles ou similar (fallback null)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('gender')
        .eq('user_id', log.user_id)
        .maybeSingle()
      if (profile?.gender === 'female' || profile?.gender === 'male') {
        sex = profile.gender as 'male' | 'female'
      }

      // Calcula eGFR + estágio se temos creatinina + idade + sexo
      let egfrCalc: number | null = null
      let stageSuggested: string | null = null
      if (labs.creatinine_mg_dl && age && sex) {
        egfrCalc = calculateEGFR(labs.creatinine_mg_dl, age, sex)
        stageSuggested = classifyStage(egfrCalc)
      } else if (labs.egfr_mentioned) {
        // Paciente mencionou eGFR diretamente
        egfrCalc = labs.egfr_mentioned
        stageSuggested = classifyStage(labs.egfr_mentioned)
      }

      // Confiança baseada em quantos sinais detectamos
      let confidence = 0.5
      if (labs.creatinine_mg_dl) confidence += 0.2
      if (age && sex) confidence += 0.15
      if (labs.proteinuria_acr_mg_g) confidence += 0.1
      if (egfrCalc) confidence += 0.05
      confidence = Math.min(confidence, 0.99)

      if (dryRun) {
        suggestionsCreated++
        continue
      }

      // INSERT (ON CONFLICT DO NOTHING via UNIQUE INDEX — idempotente)
      const { error: insertError } = await supabase
        .from('renal_inline_suggestions')
        .insert({
          patient_id: log.user_id,
          creatinine_mg_dl: labs.creatinine_mg_dl,
          egfr_calculated: egfrCalc,
          drc_stage_suggested: stageSuggested,
          proteinuria_acr_mg_g: labs.proteinuria_acr_mg_g,
          patient_age: age,
          patient_sex: sex,
          confidence_score: confidence,
          source_turn_id: log.payload?.interaction_id || log.id,
          source_text: combinedText.substring(0, 500),
          source_noa_log_id: log.id,
          ckd_epi_version: '2021',
          parser_version: 'V1.9.307',
          status: 'pending'
        })

      if (insertError) {
        if (insertError.code === '23505') {
          // unique violation = duplicata, ignora
          skippedDuplicates++
        } else {
          errors.push(`log ${log.id}: ${insertError.message}`)
        }
      } else {
        suggestionsCreated++
        console.log(`🩺 [RENAL] Sugestão criada pra paciente ${patient?.name || log.user_id} — eGFR=${egfrCalc} estágio=${stageSuggested}`)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      since_minutes: sinceMinutes,
      logs_scanned: logs?.length || 0,
      processed_with_labs: processedCount,
      suggestions_created: suggestionsCreated,
      skipped_duplicates: skippedDuplicates,
      skipped_no_match: skippedNoMatch,
      errors_count: errors.length,
      errors: errors.slice(0, 5),
      dry_run: dryRun
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('❌ [renal-signal-extractor] Erro:', error?.message)
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
