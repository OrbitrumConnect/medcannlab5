// =====================================================
// 🧠 EDGE FUNCTION: NEURO SIGNAL EXTRACTOR (V1.9.611 — Fase D)
// =====================================================
// Sidecar cognitivo neuro (TEA + TOD + TDAH) — espelho arquitetural do
// renal-signal-extractor (V1.9.307). Diferença: detecção é SEMÂNTICA (não
// regex), então usa GPT-4o-mini classificando o RELATO do paciente contra o
// mapa das 20 categorias (Fase A, 27/05). Output JSON conforme spec da memória
// `project_universo_sinais_neuro_tea_tod_tdah_mapa_completo_27_05`.
//
// FONTE = O RELATÓRIO (clinical_reports.content), decisão Pedro 07/06. Mais
// limpo e correto que ler o chat cru: o report é 1:1 com a AEC, JÁ consolidado,
// consent JÁ dado, sem o problema de escopo do chat (session_id é per-turno e
// inútil pra agrupar; lifetime tem 283 turnos de várias sessões). A
// lista_indiciaria/queixa/desenvolvimento trazem as falas VERBATIM do paciente
// (NUNCA resposta da Nôa nem RAG) → fala_literal exata + anti cross-session.
//
// PRINCÍPIO Z2: NÃO diagnostica. Marca todos os transtornos plausíveis +
// confiança + fala literal. Eduardo (neurologista) interpreta o diferencial.
//
// ZERO regressão: pipeline paralelo, read-only em ai_chat_interactions, escreve
// só na nova tabela clinical_neuro_signals. Não toca AEC FSM, Pipeline, nem o
// card hardcoded atual (NeuroSuggestionsCardPlaceholder continua até GO Eduardo).
//
// Feature flag: neuro_inline_suggestions=true (kill switch, default OFF até Fase B).
// Idempotente: UNIQUE (source_interaction_id, transtorno, subcategoria).
// =====================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =====================================================
// MAPA 20 CATEGORIAS (Fase A 27/05) — embutido no prompt de classificação.
// Fonte: project_universo_sinais_neuro_tea_tod_tdah_mapa_completo_27_05.md
// =====================================================
const NEURO_MAP_PROMPT = `Você é um EXTRATOR de sinais neuro-comportamentais para triagem clínica (TEA, TOD, TDAH).
Você NÃO diagnostica. Você apenas SINALIZA falas compatíveis com categorias, para um neurologista interpretar.

Analise EXCLUSIVAMENTE as falas do PACIENTE/CUIDADOR abaixo. Ignore qualquer texto que pareça resposta da IA, citação de artigo, ou contexto técnico injetado.

Classifique cada fala relevante nas categorias abaixo. Uma fala pode disparar MÚLTIPLOS transtornos (comorbidade é real — marque todos os plausíveis).

=== TEA (Espectro Autista) — 8 categorias ===
- comunicacao_social, comportamentos_repetitivos, sensorialidade, sono, agressividade_autolesao, diagnosticos, medicacoes_tea, estresse_cuidador

=== TOD (Opositivo Desafiador) — 6 categorias ===
- desafio_autoridade: "não obedece"/"contesta tudo"/"questiona regras"/"desrespeita"/"recusa fazer"
- raiva_irritabilidade: "perde a cabeça fácil"/"explosivo"/"qualquer coisa irrita"/"mau humor constante"
- agressividade_reativa: "agride quando contrariado"/"bate quando frustrado"/"crise de raiva"
- vinganca_rancor: "guarda rancor"/"se vinga"/"não esquece"/"fica magoado dias"
- mentir_manipular: "mente com facilidade"/"manipula"/"culpa os outros"/"inventa histórias"
- recusa_regras: "não cumpre rotina"/"foge das tarefas"/"não aceita limites"/"ignora avisos"

=== TDAH (Déficit Atenção/Hiperatividade) — 6 categorias ===
- desatencao: "não presta atenção"/"distraído"/"esquece tudo"/"perde coisas"/"não termina tarefas"/"sonha acordado"/"dificuldade de me concentrar"
- hiperatividade_motora: "agitado"/"não para quieto"/"vive em movimento"/"mexe pernas o tempo todo"
- impulsividade: "age sem pensar"/"interrompe"/"fala fora de hora"/"compra por impulso"/"decisão precipitada"
- procrastinacao_desorganizacao: "adia tudo"/"deixa pra última hora"/"bagunçado"/"perde prazos"/"não consegue planejar"
- hiperfoco_paradoxal: "foco extremo em X"/"fica horas em uma coisa"/"obsessivo com Y"
- comorbidade_emocional: "ansiedade desde criança"/"dificuldade na escola"/"dislexia"/"baixa autoestima"/"depressão"/"ansiedade adulto refratária"/"burnout precoce/recorrente"

REGRAS:
1. fala_literal = trecho EXATO do paciente (verbatim, sem parafrasear).
2. confianca = 0-100 (quão claro o sinal é). Só inclua se >= 40.
3. sujeito = quem a fala descreve: "proprio_paciente" | "filho_menor" | "filho_adulto" | "irmao" | "outro_familiar".
4. ambiguidade_clinica = true se a fala for compatível com mais de um transtorno.
5. Se NÃO houver sinais, retorne {"signals":[]}. NÃO invente.

Responda APENAS JSON válido neste formato:
{"signals":[{"transtorno":"TDAH","subcategoria":"desatencao","fala_literal":"...","confianca":92,"sujeito":"proprio_paciente","ambiguidade_clinica":false}]}`

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
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Variáveis Supabase ausentes')
    if (!openaiKey) throw new Error('OPENAI_API_KEY ausente')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Body: { report_id (req), dry_run? }
    let body: any = {}
    try { body = await req.json() } catch { /* ok */ }
    const reportId = body.report_id
    const dryRun = !!body.dry_run
    if (!reportId) throw new Error('report_id obrigatório')

    // Feature flag (kill switch) — default OFF até Fase B (Eduardo validar).
    // dry_run BYPASSA a flag: é preview read-only (não escreve), serve pra
    // validação empírica antes de ligar o pipeline em produção.
    if (!dryRun) {
      const { data: flag } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('flag', 'neuro_inline_suggestions')
        .maybeSingle()

      if (!flag?.enabled) {
        return new Response(JSON.stringify({ success: true, skipped: true, reason: 'feature_flag_disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // -----------------------------------------------------
    // FONTE = O RELATÓRIO (não o chat cru). Decisão arquitetural Pedro 07/06:
    // o report é 1:1 com a AEC, JÁ consolidado, consent JÁ dado (report existe =
    // AEC completou = termos aceitos), e SEM o problema de escopo do chat
    // (session_id é per-turno, inútil pra agrupar a sessão). A lista_indiciaria +
    // queixa + desenvolvimento trazem as falas VERBATIM → fala_literal exata.
    // Anti cross-session por construção (o report delimita a AEC).
    // -----------------------------------------------------
    const { data: report, error: repErr } = await supabase
      .from('clinical_reports')
      .select('id, patient_id, content')
      .eq('id', reportId)
      .maybeSingle()
    if (repErr) throw repErr
    if (!report) throw new Error('report não encontrado')

    const patientId = report.patient_id
    const c: any = report.content || {}

    // Monta o relato a partir das seções VERBATIM do report
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

    const relatoCapped = parts.join('\n').substring(0, 12000) // cost-control
    if (relatoCapped.trim().length === 0) {
      return new Response(JSON.stringify({ success: true, signals_created: 0, reason: 'report_sem_relato' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // -----------------------------------------------------
    // Classificação GPT-4o-mini (temperature baixa, JSON mode)
    // -----------------------------------------------------
    const gptResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: NEURO_MAP_PROMPT },
          { role: 'user', content: `FALAS DO PACIENTE:\n${relatoCapped}` }
        ]
      })
    })
    if (!gptResp.ok) throw new Error(`OpenAI ${gptResp.status}: ${await gptResp.text()}`)
    const gptData = await gptResp.json()
    let parsed: any = { signals: [] }
    try { parsed = JSON.parse(gptData.choices?.[0]?.message?.content || '{"signals":[]}') } catch { /* keep empty */ }
    const signals = Array.isArray(parsed.signals) ? parsed.signals : []

    // Filtra confiança mínima + valida shape
    const valid = signals.filter((s: any) =>
      s && typeof s.transtorno === 'string' && typeof s.subcategoria === 'string' &&
      typeof s.fala_literal === 'string' && s.fala_literal.length > 0 &&
      typeof s.confianca === 'number' && s.confianca >= 40 &&
      ['TEA', 'TOD', 'TDAH'].includes(s.transtorno)
    )

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true, dry_run: true,
        report_id: reportId,
        relato_chars: relatoCapped.length,
        signals_detected: valid.length,
        signals: valid
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // -----------------------------------------------------
    // Persistência idempotente (UNIQUE report_id+transtorno+subcategoria+fala)
    // -----------------------------------------------------
    let created = 0
    let skippedDup = 0
    const errors: string[] = []

    for (const s of valid) {
      const { error: insErr } = await supabase
        .from('clinical_neuro_signals')
        .insert({
          patient_id: patientId,
          report_id: reportId,
          transtorno: s.transtorno,
          subcategoria: s.subcategoria,
          fala_literal: s.fala_literal.substring(0, 1000),
          confianca: Math.round(s.confianca),
          sujeito: s.sujeito || 'proprio_paciente',
          ambiguidade_clinica: !!s.ambiguidade_clinica,
          source_text: s.fala_literal.substring(0, 500),
          model: 'gpt-4o-mini',
          parser_version: 'V1.9.611',
          status: 'pending'
        })

      if (insErr) {
        if (insErr.code === '23505') skippedDup++
        else errors.push(insErr.message)
      } else {
        created++
      }
    }

    return new Response(JSON.stringify({
      success: true,
      report_id: reportId,
      signals_detected: valid.length,
      signals_created: created,
      skipped_duplicates: skippedDup,
      errors_count: errors.length,
      errors: errors.slice(0, 5)
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('❌ [neuro-signal-extractor]', error?.message)
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
