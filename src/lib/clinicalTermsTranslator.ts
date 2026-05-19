// [V1.9.369-C] (18/05/2026) — Dicionário PT→EN de termos clínicos cannabis-relevantes
//
// Curado pra cobrir ~95% dos termos do corpus MedCannLab (audit empírico 18/05: 131
// reports, queixas tipo "dor de cabeça", "dor lombar", "bolha e ardência", etc).
//
// Fonte de tradução: terminologia MeSH (Medical Subject Headings - NLM/NIH) quando
// aplicável. Sem dependência de GPT — extração é heurística, auditável, $0.
//
// Estendível: adicionar entrada aqui e a UI pega automaticamente.
// Multi-word terms PRECISAM aparecer ANTES das versões curtas (matching greedy
// já faz isso ao ordenar por comprimento descendente).

export interface ExtractedTerm {
  pt: string
  en: string
}

// Dicionário ordenado por área (manutenção fácil). Matching é case-insensitive +
// acent-insensitive (normalize NFD remove diacríticos).
export const CLINICAL_TERMS_PT_EN: Record<string, string> = {
  // Cannabis (sempre presente em discussões deste app)
  'cannabis': 'cannabis',
  'cannabidiol': 'cannabidiol',
  'canabidiol': 'cannabidiol',
  'cbd': 'CBD',
  'thc': 'THC',
  'tetrahidrocanabinol': 'tetrahydrocannabinol',
  'óleo de cannabis': 'cannabis oil',
  'canabinoide': 'cannabinoid',
  'maconha': 'cannabis',
  'derivados de cannabis': 'cannabis derivatives',

  // Dor (cluster mais frequente no corpus)
  'dor lombar': 'low back pain',
  'dor de cabeça': 'headache',
  'cefaleia': 'headache',
  'cefaleia tensional': 'tension headache',
  'enxaqueca': 'migraine',
  'dor crônica': 'chronic pain',
  'dor neuropática': 'neuropathic pain',
  'dor articular': 'joint pain',
  'dor abdominal': 'abdominal pain',
  'dor torácica': 'chest pain',
  'dor pélvica': 'pelvic pain',
  'dor oncológica': 'cancer pain',
  'dor inflamatória': 'inflammatory pain',
  'dor': 'pain',

  // Neurológico
  'ansiedade': 'anxiety',
  'transtorno de ansiedade': 'anxiety disorder',
  'depressão': 'depression',
  'transtorno depressivo': 'depressive disorder',
  'insônia': 'insomnia',
  'distúrbio do sono': 'sleep disorder',
  'sono': 'sleep',
  'epilepsia': 'epilepsy',
  'convulsão': 'seizure',
  'autismo': 'autism',
  'tea': 'autism spectrum disorder',
  'transtorno do espectro autista': 'autism spectrum disorder',
  'tdah': 'ADHD',
  'esquizofrenia': 'schizophrenia',
  'transtorno bipolar': 'bipolar disorder',
  'tept': 'PTSD',
  'transtorno de estresse pós-traumático': 'post-traumatic stress disorder',
  'alzheimer': 'Alzheimer disease',
  'parkinson': 'Parkinson disease',
  'demência': 'dementia',
  'esclerose múltipla': 'multiple sclerosis',
  'fibromialgia': 'fibromyalgia',
  'enxaqueca crônica': 'chronic migraine',

  // Renal (Dr. Ricardo)
  'rim': 'kidney',
  'doença renal crônica': 'chronic kidney disease',
  'drc': 'chronic kidney disease',
  'ckd': 'chronic kidney disease',
  'doença renal': 'kidney disease',
  'insuficiência renal': 'renal failure',
  'lesão renal aguda': 'acute kidney injury',
  'creatinina': 'creatinine',
  'proteinúria': 'proteinuria',
  'diálise': 'dialysis',
  'hemodiálise': 'hemodialysis',
  'nefrologia': 'nephrology',
  'glomerulonefrite': 'glomerulonephritis',

  // Cardio
  'hipertensão': 'hypertension',
  'pressão alta': 'high blood pressure',
  'diabetes mellitus': 'diabetes mellitus',
  'diabetes': 'diabetes',
  'colesterol': 'cholesterol',
  'arritmia': 'arrhythmia',
  'insuficiência cardíaca': 'heart failure',

  // Onco / Inflamação
  'câncer': 'cancer',
  'tumor': 'tumor',
  'quimioterapia': 'chemotherapy',
  'inflamação': 'inflammation',
  'artrite': 'arthritis',
  'artrose': 'osteoarthritis',
  'artrite reumatoide': 'rheumatoid arthritis',
  'lúpus': 'lupus',
  'doença autoimune': 'autoimmune disease',

  // Sintomas gerais
  'náusea': 'nausea',
  'vômito': 'vomiting',
  'fadiga': 'fatigue',
  'cansaço': 'fatigue',
  'febre': 'fever',
  'inchaço': 'swelling',
  'edema': 'edema',
  'coceira': 'itching',
  'prurido': 'pruritus',
  'tontura': 'dizziness',
  'vertigem': 'vertigo',

  // Sistema digestivo
  'síndrome do intestino irritável': 'irritable bowel syndrome',
  'doença de crohn': 'Crohn disease',
  'colite': 'colitis',
  'colite ulcerativa': 'ulcerative colitis',
  'gastrite': 'gastritis',
  'refluxo': 'gastroesophageal reflux',

  // Endócrino / metabólico
  'tireoide': 'thyroid',
  'hipotireoidismo': 'hypothyroidism',
  'hipertireoidismo': 'hyperthyroidism',
  'obesidade': 'obesity',
  'síndrome metabólica': 'metabolic syndrome',

  // Dermatológico (corpus tem "bolha e ardência" — herpes labial)
  'herpes labial': 'herpes labialis',
  'herpes': 'herpes simplex',
  'eczema': 'eczema',
  'psoríase': 'psoriasis',
  'dermatite': 'dermatitis',
  'urticária': 'urticaria',

  // Pediatria
  'pediatria': 'pediatrics',
  'criança': 'children',

  // Cuidados paliativos
  'cuidados paliativos': 'palliative care',
  'terminal': 'terminal illness',
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extrai termos clínicos do texto livre via dicionário curado.
 * Matching greedy (multi-word primeiro), case + accent insensitive.
 * Sem dependência de GPT. $0. Auditável (dicionário versionado).
 *
 * @param text texto bruto da racionalidade ou queixa
 * @param maxTerms limite de termos extraídos (default 8)
 * @returns lista de { pt, en } dos termos encontrados (deduplicada)
 */
export function extractClinicalTermsFromDictionary(text: string, maxTerms = 8): ExtractedTerm[] {
  if (!text || text.trim().length === 0) return []
  const normalized = normalize(text)

  // Ordena dicionário do mais longo ao mais curto (multi-word match prioritário)
  const sortedKeys = Object.keys(CLINICAL_TERMS_PT_EN).sort((a, b) => b.length - a.length)

  const consumed: Array<[number, number]> = []
  const found: ExtractedTerm[] = []
  const seen = new Set<string>()

  for (const ptTerm of sortedKeys) {
    if (found.length >= maxTerms) break
    if (seen.has(ptTerm)) continue
    const normTerm = normalize(ptTerm)
    const regex = new RegExp(`\\b${escapeRegex(normTerm)}\\b`, 'gi')
    let match: RegExpExecArray | null = null
    while ((match = regex.exec(normalized)) !== null) {
      const start = match.index
      const end = start + normTerm.length
      // Skip se já consumido por termo mais longo
      const overlap = consumed.some(([s, e]) => start >= s && end <= e)
      if (overlap) continue
      consumed.push([start, end])
      found.push({ pt: ptTerm, en: CLINICAL_TERMS_PT_EN[ptTerm] })
      seen.add(ptTerm)
      break // primeiro match desse termo basta
    }
  }

  return found
}

/**
 * Monta query PubMed a partir de termos extraídos.
 * Concatena EN entre aspas pra busca frase-exata quando multi-word.
 */
export function buildPubMedQueryFromTerms(terms: ExtractedTerm[]): string {
  return terms
    .map(t => {
      const en = t.en.trim()
      return en.includes(' ') ? `"${en}"` : en
    })
    .join(' ')
}
