// =====================================================
// 🗣️ EDGE FUNCTION: REPORT SIGNAL EXTRACTOR (V1.9.612) — "Sinais do Relato"
// =====================================================
// Sidecar "Sinais do Relato": DOR + SONO + ANSIEDADE — os 3 sinais mais frequentes
// no relato espontâneo do paciente (e as 3 indicações centrais da cannabis, mas o
// app NÃO indica — só ESCUTA e REPASSA). Mesma arquitetura do neuro-signal-extractor
// (V1.9.611): fonte = RELATÓRIO consolidado, GPT-4o-mini classifica o relato verbatim.
//
// FILOSOFIA (Pedro 07/06): não é "indicação" nem "sugestão" do app. É a fala/semântica
// do PRÓPRIO paciente, captada e repassada fielmente ao médico (paciente → app → pro).
// Alinhado ao MIMRE / relato espontâneo. Z2: sinaliza o que o paciente RELATOU, NÃO
// prescreve. A decisão CBD/THC/dose continua 100% do médico.
//
// ZERO regressão: pipeline paralelo, read-only no report, escreve só na nova tabela
// clinical_reported_signals. Não toca AEC FSM, Pipeline, Core, nem outros sidecars.
//
// Feature flag: reported_signals=true (kill switch). dry_run bypassa (preview).
// Idempotente: UNIQUE (report_id, dominio, subcategoria, md5(fala_literal)).
// =====================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REPORT_MAP_PROMPT = `Você é um EXTRATOR de sinais de DOR, SONO e ANSIEDADE no RELATO do paciente.
Você NÃO indica, NÃO recomenda e NÃO prescreve nada. Apenas SINALIZA o que o paciente RELATOU, para o médico decidir.

Analise EXCLUSIVAMENTE as falas do PACIENTE abaixo. Ignore qualquer texto que pareça resposta da IA, citação de artigo, ou contexto técnico injetado.

Classifique cada fala relevante. Uma fala pode disparar MÚLTIPLOS domínios (comorbidade é a REGRA — dor + insônia + ansiedade juntos é o padrão).

=== DOR — 9 categorias ===
- dor_neuropatica: "queimação"/"choque"/"formigamento doloroso"/"dor que irradia"/"agulhadas"/"dormência dolorosa"
- dor_inflamatoria_articular: "dor nas articulações"/"artrite"/"artrose"/"inflamação"/"rigidez matinal"/"dor no joelho"
- dor_lombar: "dor nas costas"/"lombar"/"coluna"/"hérnia de disco"/"ciática"
- dor_cefaleia_enxaqueca: "enxaqueca"/"dor de cabeça"/"cefaleia"/"crise de enxaqueca"
- dor_oncologica: "dor do câncer"/"dor oncológica"/"dor do tumor"/"dor da quimioterapia"
- dor_visceral: "cólica"/"dor abdominal"/"dor pélvica"/"dor de barriga forte"
- dor_difusa_fibromialgia: "dor no corpo todo"/"fibromialgia"/"dor difusa"/"dói tudo"/"dores generalizadas"
- dor_cronica_refrataria: "dor há anos"/"dor crônica"/"nada resolve a dor"/"já tentei de tudo pra dor"
- impacto_funcional_dor: "dor me impede de trabalhar"/"não durmo por causa da dor"/"a dor limita minha vida"

=== SONO — 5 categorias ===
- insonia_inicial: "demoro pra pegar no sono"/"não consigo dormir"/"fico rolando na cama"/"demora pra dormir"
- insonia_manutencao: "acordo no meio da noite"/"durmo picado"/"acordo várias vezes"/"sono interrompido"
- despertar_precoce: "acordo muito cedo"/"acordo de madrugada e não durmo mais"/"acordo antes da hora"
- sono_nao_reparador: "acordo cansado"/"sono não descansa"/"durmo mas não recupero"/"acordo sem energia"
- uso_indutores_sono: "tomo remédio pra dormir"/"clonazepam pra dormir"/"zolpidem"/"melatonina"/"chá pra dormir"

=== ANSIEDADE/HUMOR — 8 categorias ===
- ansiedade_generalizada: "ansiedade"/"preocupação constante"/"mente acelerada"/"tensão"/"nervosismo"
- crise_panico: "crise de pânico"/"taquicardia súbita"/"falta de ar com medo"/"sensação de morte iminente"
- ansiedade_social: "medo de falar em público"/"ansiedade social"/"evito gente"/"vergonha extrema"
- estresse_burnout: "burnout"/"estresse no trabalho"/"esgotamento"/"sobrecarga"/"exaustão"
- depressao: "depressão"/"tristeza profunda"/"sem vontade"/"desânimo"/"deprimido"
- irritabilidade_humor: "irritado"/"pavio curto"/"mau humor"/"explodo fácil"/"impaciente"
- anedonia: "não sinto prazer"/"perdi o interesse"/"nada me anima"/"apatia"
- uso_psicotropicos: "tomo antidepressivo"/"sertralina"/"fluoxetina"/"bupropiona"/"ansiolítico"/"rivotril"/"escitalopram"

REGRAS:
1. fala_literal = trecho EXATO do paciente (verbatim, sem parafrasear).
2. confianca = 0-100 (quão claro o sinal é). Só inclua se >= 40.
3. sujeito = "proprio_paciente" (default) | "filho_menor" | "outro_familiar".
4. ambiguidade_clinica = true se a fala for compatível com mais de um domínio.
5. Se NÃO houver sinais, retorne {"signals":[]}. NÃO invente.

Responda APENAS JSON válido:
{"signals":[{"dominio":"DOR","subcategoria":"dor_neuropatica","fala_literal":"...","confianca":85,"sujeito":"proprio_paciente","ambiguidade_clinica":false}]}`

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
        .from('feature_flags').select('enabled').eq('flag', 'reported_signals').maybeSingle()
      if (!flag?.enabled) {
        return new Response(JSON.stringify({ success: true, skipped: true, reason: 'feature_flag_disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // FONTE = o relatório consolidado (mesma decisão do neuro V1.9.611)
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
          { role: 'system', content: REPORT_MAP_PROMPT },
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
      ['DOR', 'SONO', 'ANSIEDADE'].includes(s.dominio)
    )

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true, dry_run: true, report_id: reportId,
        relato_chars: relatoCapped.length, signals_detected: valid.length, signals: valid
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let created = 0, skippedDup = 0
    const errors: string[] = []
    for (const s of valid) {
      const { error: insErr } = await supabase
        .from('clinical_reported_signals')
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
          parser_version: 'V1.9.612',
          status: 'pending'
        })
      if (insErr) {
        if (insErr.code === '23505') skippedDup++
        else errors.push(insErr.message)
      } else created++
    }

    return new Response(JSON.stringify({
      success: true, report_id: reportId,
      signals_detected: valid.length, signals_created: created,
      skipped_duplicates: skippedDup, errors_count: errors.length, errors: errors.slice(0, 5)
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('❌ [report-signal-extractor]', error?.message)
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
