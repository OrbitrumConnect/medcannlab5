// =====================================================
// 🌿 EDGE FUNCTION: CANNABIS RELATO EXTRACTOR (V1.9.613) — "Cannabis no Relato"
// =====================================================
// Captura a RELAÇÃO do paciente com a cannabis na FALA dele: vontade/curiosidade,
// uso atual/prévio, receio/barreira. É a autonomia do paciente (querer/curiosidade)
// trazida ao médico — sem card, esse sinal some. Poucos hoje, mas alto valor + cresce.
//
// FILOSOFIA (Pedro 07/06): NÃO é indicação/sugestão do app. É o que o PACIENTE
// EXPRESSOU sobre cannabis, espontaneamente (AEC ou chat). Z2: sinaliza a fala, não
// prescreve. Fase 2: cruzar com prescrições (quem aderiu após o relato = eficácia).
//
// Mesma arquitetura do report-signal-extractor (V1.9.612): fonte = RELATÓRIO
// consolidado, GPT-4o-mini, tabela clinical_cannabis_signals. ZERO regressão.
//
// Feature flag: cannabis_relato=true. dry_run bypassa. Idempotente.
// =====================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CANNABIS_MAP_PROMPT = `Você é um EXTRATOR de sinais sobre a RELAÇÃO do paciente com a cannabis (vontade, uso, receio) no relato dele.
Você NÃO indica, NÃO recomenda e NÃO prescreve. Apenas SINALIZA o que o paciente EXPRESSOU sobre cannabis, na fala dele.

Analise EXCLUSIVAMENTE as falas do PACIENTE abaixo. Ignore texto que pareça resposta da IA, recomendação do relatório, ou citação de artigo. Capture só o que o PACIENTE disse espontaneamente.

=== VONTADE (intenção/procura) — 4 categorias ===
- vontade_iniciar: "quero tomar cbd"/"quero usar cannabis"/"gostaria de experimentar"/"quero começar canabidiol"
- curiosidade: "será que cannabis ajuda?"/"ouvi falar do cbd"/"tenho curiosidade sobre cannabis"
- substituir_medicacao: "quero substituir por algo natural"/"trocar meu remédio por canabidiol"/"parar o remédio e usar cbd"
- busca_para_sintoma: "quero cbd pra dor"/"cannabis pra ansiedade"/"cbd pra dormir"/"canabidiol pra minha dor"

=== USO (atual/prévio) — 2 categorias ===
- uso_atual: "já uso óleo de cbd"/"faço uso de canabidiol"/"uso maconha"/"tomo cannabis"/"uso óleo"
- experiencia_previa: "já usei cbd e ajudou"/"já tentei cannabis"/"usei no passado"/"experimentei antes"

=== RECEIO (barreiras) — 3 categorias ===
- medo_dependencia: "medo de dependência"/"medo de viciar"/"receio de vício"
- barreira_familiar_estigma: "família é contra"/"preconceito"/"vergonha de usar"/"medo do que vão pensar"
- medo_efeito: "medo do efeito"/"medo de ficar chapado"/"receio dos efeitos colaterais"

REGRAS:
1. fala_literal = trecho EXATO do paciente (verbatim).
2. confianca = 0-100. Só inclua se >= 40.
3. sujeito = "proprio_paciente" (default) | "filho_menor" | "outro_familiar".
4. ambiguidade_clinica = true se a fala for compatível com mais de um domínio.
5. Se NÃO houver fala do paciente sobre cannabis, retorne {"signals":[]}. NÃO invente nem capture a recomendação do médico/app.

Responda APENAS JSON válido:
{"signals":[{"dominio":"VONTADE","subcategoria":"substituir_medicacao","fala_literal":"...","confianca":85,"sujeito":"proprio_paciente","ambiguidade_clinica":false}]}`

// VERBATIM GUARD (V1.9.616): garante fala_literal 100% verbatim — só aceita se for
// substring REAL do relato (enforça, não só pede no prompt). Retorna fala limpa OU null.
function verbatimGuard(fala: string, relato: string): string | null {
  const stripped = String(fala || '').replace(/^[\s."'…]+|[\s."'…]+$/g, '').trim()
  if (stripped.length < 3) return null
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  return norm(relato).includes(norm(stripped)) ? stripped : null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Variáveis Supabase ausentes')
    if (!openaiKey) throw new Error('OPENAI_API_KEY ausente')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let body: any = {}
    try { body = await req.json() } catch { /* ok */ }
    const reportId = body.report_id
    const dryRun = !!body.dry_run
    if (!reportId) throw new Error('report_id obrigatório')

    if (!dryRun) {
      const { data: flag } = await supabase
        .from('feature_flags').select('enabled').eq('flag', 'cannabis_relato').maybeSingle()
      if (!flag?.enabled) {
        return new Response(JSON.stringify({ success: true, skipped: true, reason: 'feature_flag_disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    const { data: report, error: repErr } = await supabase
      .from('clinical_reports').select('id, patient_id, content').eq('id', reportId).maybeSingle()
    if (repErr) throw repErr
    if (!report) throw new Error('report não encontrado')

    const patientId = report.patient_id
    const c: any = report.content || {}

    const parts: string[] = []
    if (Array.isArray(c.lista_indiciaria) && c.lista_indiciaria.length)
      parts.push('QUEIXAS (verbatim): ' + c.lista_indiciaria.join(' | '))
    if (c.queixa_principal)
      parts.push('QUEIXA PRINCIPAL: ' + (typeof c.queixa_principal === 'string' ? c.queixa_principal : JSON.stringify(c.queixa_principal)))
    if (c.desenvolvimento_queixa)
      parts.push('DESENVOLVIMENTO DA QUEIXA: ' + JSON.stringify(c.desenvolvimento_queixa))
    if (Array.isArray(c.habitos_vida) && c.habitos_vida.length)
      parts.push('HÁBITOS DE VIDA: ' + c.habitos_vida.join(' | '))
    if (c.historia_patologica_pregressa)
      parts.push('HISTÓRIA PATOLÓGICA: ' + JSON.stringify(c.historia_patologica_pregressa))
    if (c.perguntas_objetivas)
      parts.push('PERGUNTAS OBJETIVAS: ' + JSON.stringify(c.perguntas_objetivas))

    const relatoCapped = parts.join('\n').substring(0, 12000)
    if (relatoCapped.trim().length === 0) {
      return new Response(JSON.stringify({ success: true, signals_created: 0, reason: 'report_sem_relato' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const gptResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: CANNABIS_MAP_PROMPT },
          { role: 'user', content: `FALAS DO PACIENTE:\n${relatoCapped}` }
        ]
      })
    })
    if (!gptResp.ok) throw new Error(`OpenAI ${gptResp.status}: ${await gptResp.text()}`)
    const gptData = await gptResp.json()
    let parsed: any = { signals: [] }
    try { parsed = JSON.parse(gptData.choices?.[0]?.message?.content || '{"signals":[]}') } catch { /* keep empty */ }
    const signals = Array.isArray(parsed.signals) ? parsed.signals : []

    const valid = signals.filter((s: any) =>
      s && typeof s.dominio === 'string' && typeof s.subcategoria === 'string' &&
      typeof s.fala_literal === 'string' && s.fala_literal.length > 0 &&
      typeof s.confianca === 'number' && s.confianca >= 40 &&
      ['VONTADE', 'USO', 'RECEIO'].includes(s.dominio)
    )

    // VERBATIM GUARD: só mantém o sinal se fala_literal for substring REAL do relato.
    const guarded = valid.map((s: any) => {
      const fv = verbatimGuard(s.fala_literal, relatoCapped)
      return fv ? { ...s, fala_literal: fv } : null
    }).filter(Boolean) as any[]
    const droppedNonVerbatim = valid.length - guarded.length

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true, dry_run: true, report_id: reportId,
        relato_chars: relatoCapped.length, signals_detected: guarded.length,
        dropped_non_verbatim: droppedNonVerbatim, signals: guarded
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let created = 0, skippedDup = 0
    const errors: string[] = []
    for (const s of guarded) {
      const { error: insErr } = await supabase
        .from('clinical_cannabis_signals')
        .insert({
          patient_id: patientId,
          report_id: reportId,
          dominio: s.dominio,
          subcategoria: s.subcategoria,
          fala_literal: s.fala_literal.substring(0, 1000),
          confianca: Math.round(s.confianca),
          sujeito: s.sujeito || 'proprio_paciente',
          ambiguidade_clinica: !!s.ambiguidade_clinica,
          source_text: s.fala_literal.substring(0, 500),
          model: 'gpt-4o-mini',
          parser_version: 'V1.9.613',
          status: 'pending'
        })
      if (insErr) {
        if (insErr.code === '23505') skippedDup++
        else errors.push(insErr.message)
      } else created++
    }

    return new Response(JSON.stringify({
      success: true, report_id: reportId,
      signals_detected: guarded.length, dropped_non_verbatim: droppedNonVerbatim,
      signals_created: created,
      skipped_duplicates: skippedDup, errors_count: errors.length, errors: errors.slice(0, 5)
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('❌ [cannabis-relato-extractor]', error?.message)
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
