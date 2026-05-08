// =====================================================
// 🎨 EDGE FUNCTION: GENERATE NFT FROM CLINICAL REPORT
// =====================================================
// V1.9.194 — Galeria de Assinaturas Visuais (FASE 2)
//
// Pipeline:
//   1. Recebe { report_id }
//   2. Valida usuário autenticado é dono do report (RLS)
//   3. Idempotência: se patient_nfts já tem row pra esse report, retorna existente
//   4. Extrai narrativa do report.content (queixa, histórico, sintomas)
//   5. Heurística simples → emotional_sig + symbols + palette
//   6. Seleção de estilo: hash(patient_id) % 6 (consistência visual longitudinal)
//   7. Constrói prompt artístico
//   8. seed = sha256(patient_id + report_id) — determinístico
//   9. Fetch Pollinations.ai (zero-cost, zero-auth) → PNG bytes
//  10. SHA-256 da imagem (integridade)
//  11. Upload Storage 'nfts/<patient_id>/<report_id>.png'
//  12. INSERT em patient_nfts (service_role, bypassa RLS de INSERT)
//  13. Retorna { id, image_url }
//
// Provider: Pollinations.ai (free, sem auth, sem rate limit dia-a-dia)
// Migração futura pra fal.ai/Cloudflare = trocar URL na função buildImageUrl()

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ──────────────────────────────────────────────────────────────────
// 6 ESTILOS-BASE (Pedro feedback — manter identidade visual paciente)
// ──────────────────────────────────────────────────────────────────

const STYLES = [
  {
    id: 'neuro-organic',
    label: 'Neuro-Organic',
    base_prompt: 'dreamlike neuro-organic landscape, fractal neural networks, warm bioluminescent threads, abstract sci-fi healing archive, non-human composition, unique cinematic lighting, soft volumetric glow',
    palette: ['deep indigo', 'amber', 'cyan'],
    symbols: ['neural_roots', 'memory_particles', 'fractured_moon'],
  },
  {
    id: 'healing-fractals',
    label: 'Healing Fractals',
    base_prompt: 'sacred healing fractals, recursive self-similar patterns, soft cyan and gold light filaments, abstract therapeutic symbolism, ethereal calm energy, no human face, no medical iconography',
    palette: ['gold', 'cyan', 'soft white'],
    symbols: ['mandala_recursion', 'breath_spiral', 'dawn_lattice'],
  },
  {
    id: 'orbit-consciousness',
    label: 'Orbit Consciousness',
    base_prompt: 'sci-fi consciousness orbits, planetary memory rings, cosmic neural archive, soft purple and emerald nebulae, abstract human awareness, cinematic deep space lighting, no humans visible',
    palette: ['purple', 'emerald', 'midnight blue'],
    symbols: ['orbital_rings', 'memory_planets', 'neural_constellation'],
  },
  {
    id: 'dreamcore-medical',
    label: 'Dreamcore',
    base_prompt: 'dreamcore therapeutic memory archive, soft pastel surrealism, floating subjective fragments, gentle lo-fi atmosphere, abstract emotional symbolism, no faces, no hospitals, no medical imagery',
    palette: ['pink', 'lavender', 'soft yellow'],
    symbols: ['floating_objects', 'memory_fragments', 'distant_warmth'],
  },
  {
    id: 'emotional-archive',
    label: 'Emotional Archive',
    base_prompt: 'emotional archive abstract painting, layered translucent textures, warm and cool palette interplay, human experience as visual stratigraphy, no faces, no figurative elements',
    palette: ['warm amber', 'cold steel', 'deep crimson'],
    symbols: ['layered_strata', 'translucent_veils', 'temporal_threads'],
  },
  {
    id: 'cognitive-nebula',
    label: 'Cognitive Nebula',
    base_prompt: 'cognitive nebula in deep space, swirling thought patterns, gas clouds of memory, electric blue and violet hues, abstract mind landscape, no humans, no medical equipment',
    palette: ['electric blue', 'violet', 'silver'],
    symbols: ['thought_clouds', 'mind_streams', 'cognitive_stars'],
  },
]

// ──────────────────────────────────────────────────────────────────
// HELPERS — extração heurística de emoção (pré-LLM)
// ──────────────────────────────────────────────────────────────────

const EMOTION_KEYWORDS = {
  exhaustion: ['cansado', 'cansaço', 'exausto', 'fadiga', 'sem energia', 'esgotado'],
  pain: ['dor', 'ardor', 'queimação', 'lombar'],
  anxiety: ['ansioso', 'ansiedade', 'preocupado', 'medo', 'angústia'],
  sadness: ['triste', 'tristeza', 'choro', 'vazio', 'deprim'],
  insomnia: ['acordo', 'noite', 'sono', 'insônia', 'dormir'],
  cognitive_fog: ['esqueci', 'esquecer', 'não termin', 'desfoco', 'cabeça'],
  reconnection: ['família', 'esperança', 'melhor', 'voltar', 'retomar'],
  overload: ['acelerado', 'rápido demais', 'mente', 'pensamento'],
}

// V1.9.196 — Paletas modulares por emoção (3-4 variantes cada)
// Pseudo-random determinístico via slice do seed
// Mesma chamada → mesma escolha. Mesma emoção em reports diferentes
// = paletas diferentes (variação visual sem perder reprodutibilidade).
const EMOTION_PALETTES: Record<string, string[][]> = {
  exhaustion: [
    ['ash gray', 'dim slate', 'faded teal'],
    ['cold steel', 'muted indigo', 'pale grey'],
    ['twilight gray', 'deep ocean', 'subdued cyan'],
    ['weathered bronze', 'fog blue', 'silver mist'],
  ],
  pain: [
    ['crimson', 'deep purple', 'ember orange'],
    ['blood red', 'volcanic black', 'burnt sienna'],
    ['intense magenta', 'midnight violet', 'molten gold'],
  ],
  anxiety: [
    ['acid green', 'electric blue', 'fluorescent white'],
    ['sharp lime', 'cyber yellow', 'glitch teal'],
    ['unstable cyan', 'fragmented orange', 'restless violet'],
  ],
  sadness: [
    ['indigo dusk', 'soft lavender', 'muted blue'],
    ['rain gray', 'distant silver', 'pale rose'],
    ['twilight purple', 'cool mauve', 'whispered cyan'],
  ],
  insomnia: [
    ['midnight blue', 'silver moonlight', 'translucent white'],
    ['nocturnal violet', 'pale lunar', 'shadow indigo'],
    ['deep navy', 'ghostly cyan', 'starlit silver'],
  ],
  cognitive_fog: [
    ['blurred gray', 'soft beige', 'faded pearl'],
    ['watercolor mist', 'diffuse cream', 'translucent peach'],
    ['hazy lilac', 'morning fog', 'subdued cyan'],
  ],
  reconnection: [
    ['warm gold', 'amber', 'soft peach'],
    ['sunrise coral', 'honey', 'champagne'],
    ['rose gold', 'orange ember', 'warm cream'],
    ['terracotta', 'turmeric', 'gentle ivory'],
  ],
  overload: [
    ['neon magenta', 'electric violet', 'searing white'],
    ['fractured cyan', 'plasma pink', 'shock yellow'],
    ['intense orange', 'vivid teal', 'kinetic silver'],
  ],
  neutral: [
    ['soft sage', 'warm taupe', 'muted ivory'],
    ['gentle mint', 'sand', 'cloud white'],
    ['subdued teal', 'cream', 'pale gold'],
  ],
}

// Símbolos visuais por emoção (pool — escolhe 2-3 via seed slice)
const EMOTION_SYMBOLS: Record<string, string[]> = {
  exhaustion: ['dim_horizon', 'fading_light', 'gravitational_pull', 'sinking_threads', 'slowed_orbit', 'weighted_atmosphere'],
  pain: ['fractured_glass', 'stormy_clouds', 'restless_currents', 'jagged_pulses', 'pressure_waves', 'broken_lattice'],
  anxiety: ['scattered_particles', 'uncertain_geometries', 'rapid_oscillations', 'fragmented_mirrors', 'unstable_orbits'],
  sadness: ['distant_warmth', 'falling_leaves', 'vanishing_paths', 'silent_ocean', 'dimmed_stars', 'still_water'],
  insomnia: ['unblinking_eye', 'looping_mandala', 'watching_moon', 'restless_constellation', 'sleepless_corridor'],
  cognitive_fog: ['blurred_outlines', 'soft_obscurity', 'indistinct_forms', 'vanishing_words', 'dissolving_shapes'],
  reconnection: ['bridges', 'warm_threads', 'returning_paths', 'reaching_hands_metaphor', 'opening_doors', 'embracing_spirals'],
  overload: ['swirling_vortex', 'electric_storm', 'collision_waves', 'rapid_nebula', 'fractal_explosion', 'overlapping_layers'],
  neutral: ['steady_horizon', 'balanced_geometry', 'calm_sphere', 'centered_mandala'],
}

// Modificadores de composição (rando determinístico via seed)
const COMPOSITION_MODIFIERS = [
  'centered radial composition',
  'asymmetric flowing composition',
  'vertical ascending composition',
  'spiral inward composition',
  'horizontal stratified layers',
  'diagonal dynamic flow',
  'fragmented mosaic composition',
  'concentric expanding rings',
]

function extractEmotionalSignature(reportContent: any): {
  emotional_sig: string
  symbols: string[]
} {
  const text = JSON.stringify(reportContent || {}).toLowerCase()
  const matches: Record<string, number> = {}

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    let count = 0
    for (const kw of keywords) {
      const occ = (text.match(new RegExp(kw, 'g')) || []).length
      count += occ
    }
    if (count > 0) matches[emotion] = count
  }

  // Top 1 emoção
  const sorted = Object.entries(matches).sort(([, a], [, b]) => b - a)
  const top = sorted[0]?.[0] || 'neutral'

  // Top 2 = symbols extras
  const extra_symbols = sorted.slice(0, 2).map(([emo]) => emo)

  return {
    emotional_sig: top,
    symbols: extra_symbols,
  }
}

// ──────────────────────────────────────────────────────────────────
// SEED determinístico — sha256(patient_id || report_id)
// ──────────────────────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ──────────────────────────────────────────────────────────────────
// PROVIDER ABSTRACTION — Pollinations.ai (free)
// Trocar essa função pra migrar pra fal.ai/Cloudflare/etc
// ──────────────────────────────────────────────────────────────────

function buildImageUrl(prompt: string, seed: number): string {
  // Pollinations.ai: zero-auth, zero-cost
  // Doc: https://github.com/pollinations/pollinations
  const encoded = encodeURIComponent(prompt)
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&model=flux&seed=${seed}&nologo=true&enhance=true`
}

// ──────────────────────────────────────────────────────────────────
// HANDLER
// ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // 1. Auth — quem é o usuário chamando?
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Validar input
    const body = await req.json().catch(() => ({}))
    const reportId = body?.report_id
    if (!reportId || typeof reportId !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing report_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Service-role client (pra escrever em patient_nfts ignorando RLS de INSERT)
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // 4. Idempotência: NFT já existe pra esse report?
    const { data: existing } = await adminClient
      .from('patient_nfts')
      .select('id, image_url, thumbnail_url, image_hash, signature_hash, style, emotional_sig, palette, symbols, seed, model, generation_version, created_at')
      .eq('report_id', reportId)
      .maybeSingle()

    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          already_exists: true,
          nft: existing,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 5. Pegar report (validar que user é dono via auth.uid)
    const { data: report, error: reportError } = await userClient
      .from('clinical_reports')
      .select('id, patient_id, content, signature_hash, generated_at, professional_id, doctor_id')
      .eq('id', reportId)
      .maybeSingle()

    if (reportError || !report) {
      return new Response(
        JSON.stringify({ error: 'Report not found or not accessible', detail: reportError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Permissão: paciente owner OU profissional do report
    const isOwner = report.patient_id === user.id
    const isProfessional = report.professional_id === user.id || report.doctor_id === user.id
    if (!isOwner && !isProfessional) {
      return new Response(JSON.stringify({ error: 'Not authorized for this report' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const patientId = report.patient_id

    // 6. Extrair emoção heurística + selecionar estilo
    const { emotional_sig, symbols: emotion_symbols } = extractEmotionalSignature(report.content)

    // Estilo baseado no hash do patient_id (consistência visual longitudinal)
    const patientHashHex = await sha256Hex(patientId)
    const styleIdx = parseInt(patientHashHex.slice(0, 8), 16) % STYLES.length
    const style = STYLES[styleIdx]

    // 7. Seed determinístico = sha256(patient_id || report_id)
    //    Usado pra gerar imagem FLUX E pra rando determinístico de variantes
    const seedHex = await sha256Hex(`${patientId}_${reportId}`)
    const seedNum = parseInt(seedHex.slice(0, 9), 16) % 999999999 // Pollinations aceita seed numérico

    // 8. V1.9.196 — Variação visual modular dentro do estilo base
    //    Cada slice do seedHex escolhe uma variante (pseudo-random determinístico)
    //    → mesmo report sempre gera mesma escolha (idempotência)
    //    → reports diferentes do mesmo paciente+emoção = variações visuais distintas

    // Paleta: variante baseada na emoção (com fallback pra neutral)
    const palettesForEmotion = EMOTION_PALETTES[emotional_sig] || EMOTION_PALETTES.neutral
    const paletteIdx = parseInt(seedHex.slice(8, 16), 16) % palettesForEmotion.length
    const dynamic_palette = palettesForEmotion[paletteIdx]

    // Símbolos: combina pool da emoção + symbols do estilo, escolhe subset via seed
    const symbolPoolForEmotion = EMOTION_SYMBOLS[emotional_sig] || EMOTION_SYMBOLS.neutral
    const combinedPool = [...new Set([...symbolPoolForEmotion, ...style.symbols, ...emotion_symbols])]
    // Pseudo-shuffle determinístico: rotação baseada em seed slice
    const rotation = parseInt(seedHex.slice(16, 24), 16) % combinedPool.length
    const rotatedPool = [...combinedPool.slice(rotation), ...combinedPool.slice(0, rotation)]
    const symbols = rotatedPool.slice(0, 4)

    // Composição: modificador determinístico via seed
    const compositionIdx = parseInt(seedHex.slice(24, 32), 16) % COMPOSITION_MODIFIERS.length
    const composition = COMPOSITION_MODIFIERS[compositionIdx]

    // Construir prompt enriquecido
    const dynamic_palette_str = dynamic_palette.join(', ')
    const symbols_str = symbols.map(s => s.replace(/_/g, ' ')).join(', ')
    const prompt = `${style.base_prompt}, ${composition}, palette of ${dynamic_palette_str}, visual symbols: ${symbols_str}, emotional tone: ${emotional_sig.replace(/_/g, ' ')}, abstract therapeutic symbolism, 512x512 high quality digital art, no human faces, no medical iconography`

    // 9. Fetch Pollinations.ai
    const imageUrl = buildImageUrl(prompt, seedNum)
    const imageResp = await fetch(imageUrl)
    if (!imageResp.ok) {
      return new Response(
        JSON.stringify({ error: 'Image generation failed', status: imageResp.status }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }
    const imageBytes = new Uint8Array(await imageResp.arrayBuffer())
    if (imageBytes.length < 1000) {
      return new Response(JSON.stringify({ error: 'Image too small, possibly invalid' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 10. SHA-256 da imagem (integridade)
    const imageHash = await sha256Bytes(imageBytes)

    // 11. Upload Storage
    const storagePath = `${patientId}/${reportId}.png`
    const { error: uploadError } = await adminClient.storage
      .from('nfts')
      .upload(storagePath, imageBytes, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Upload failed', detail: uploadError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Signed URL longa (1 ano = 31536000 segundos)
    const { data: signedUrlData } = await adminClient.storage
      .from('nfts')
      .createSignedUrl(storagePath, 31536000)

    const finalImageUrl = signedUrlData?.signedUrl || ''

    // 12. INSERT em patient_nfts
    const insertPayload = {
      patient_id: patientId,
      report_id: reportId,
      image_url: finalImageUrl,
      thumbnail_url: finalImageUrl, // mesmo URL por enquanto (FASE 2 futura: gerar thumbnail real)
      image_hash: imageHash,
      signature_hash: report.signature_hash || null,
      style: style.id,
      emotional_sig,
      palette: dynamic_palette,           // V1.9.196 — paleta dinâmica por emoção
      symbols,                             // V1.9.196 — subset rotacionado via seed
      seed: seedHex,
      prompt,
      model: 'pollinations-flux',
      generation_version: 'v2_modular_palette_2026_05',
      narrative_window: {},
      metadata: {
        provider: 'pollinations.ai',
        style_label: style.label,
        composition_modifier: composition,  // V1.9.196 — rastreabilidade composição
        palette_variant_idx: paletteIdx,
        symbol_rotation: rotation,
        generated_at: new Date().toISOString(),
      },
    }

    const { data: inserted, error: insertError } = await adminClient
      .from('patient_nfts')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Insert failed', detail: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 13. Sucesso
    return new Response(
      JSON.stringify({
        success: true,
        already_exists: false,
        nft: inserted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Unexpected error',
        detail: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
