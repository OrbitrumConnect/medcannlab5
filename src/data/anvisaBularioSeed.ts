// [V1.9.465] (27/05/2026) — Seed manual top ~50 bulas BR pra Aba Literatura
//
// Decisão arquitetural HONESTA: seed estático em vez de scraping Cloudflare
// (validado empiricamente 27/05 madrugada: ANVISA 403 Forbidden).
//
// Princípio fronteira info farmacológica (memory cristalizada 27/05):
//   ✅ ZERO conteúdo de bula armazenado aqui — só metadados + link oficial
//   ✅ Médico clica → abre portal ANVISA externa → lê bula ORIGINAL
//   ✅ Sistema é INDEX/CATÁLOGO, não substitui bulário oficial
//   ✅ Sem risco de dados clínicos desatualizados (ANVISA atualiza, link permanece)
//
// Princípio polir-não-inventar: JSON estático em vez de tabela Supabase pra MVP.
// Atualização = git commit (auditável). Quando >200 bulas, migrar pra tabela.
//
// Trigger pra desparquear Fase 2-Pleno (scraping + OCR cron):
//   - Ricardo bater empíricamente "preciso de bula Y que não está no seed"
//   - >10 buscas falhando por bula faltante na telemetria
//   - Marco 2 paciente externo real
//
// Categorias selecionadas pra contexto MedCannLab:
//   - Cannabis medicinal BR (Mevatyl + canabidióis registrados)
//   - Anti-convulsivantes (epilepsia refratária — uso cannabis comum)
//   - Psicotrópicos (ansiedade/depressão — comorbidade comum cannabis)
//   - Analgésicos/anti-inflamatórios (dor crônica — comorbidade comum)
//   - Nefro (Dr. Ricardo wedge clínico — DRC + cannabis)

export type BularioCategoria =
  | 'cannabis'
  | 'anticonvulsivante'
  | 'psicotropico'
  | 'analgesico'
  | 'nefro'
  | 'antibiotico'        // V1.9.467 — Ricardo pediu cefalexina (clínica geral comum)
  | 'cardiovascular'     // V1.9.467 — anticoagulantes + antiarrítmicos + estatinas + antihipertensivos extras
  | 'metabolico'         // V1.9.467 — antidiabéticos + hormônios + corticoides
  | 'gastrointestinal'   // V1.9.467 — IBPs, anti-eméticos, antidiarreicos
  | 'outros'

export interface BularioEntry {
  /** ID único (slug nome comercial) */
  id: string
  /** Nome comercial principal */
  nomeComercial: string
  /** Princípio ativo (DCB português ou nome internacional) */
  principioAtivo: string
  /** Concentração + forma farmacêutica resumidas */
  apresentacao: string
  /** Classe terapêutica ou mecanismo (texto curto) */
  classeTerapeutica: string
  /** Laboratório registrante ANVISA (pode ter múltiplos genéricos — listamos o principal) */
  laboratorio: string
  /** Categoria pra filtro UI */
  categoria: BularioCategoria
  /** Indicação resumida (1-2 linhas, NÃO bula completa) */
  indicacaoResumida: string
  /** URL bulário oficial ANVISA (busca pelo nome) */
  bularioUrl: string
  /** URL DailyMed FDA se equivalente americano existe */
  dailymedUrl?: string
  /** Tarja: branca / vermelha / preta (controle especial) */
  tarja?: 'branca' | 'vermelha' | 'preta' | 'amarela'
  /** Observação clínica curta (interações, atenções relevantes) — sem síntese GPT */
  observacao?: string
}

/**
 * Helper: gera URL Google Search restrita ao Bulário Eletrônico ANVISA.
 *
 * [V1.9.467-C] (27/05/2026) — Trocado de URL direta SPA Angular pra Google Search
 * pattern. Motivo empírico: portal `consultas.anvisa.gov.br/#/bulario/q/` é SPA
 * Angular frágil — várias bulas (Antak descontinuado, Aspirina, outras) carregam
 * página branca mesmo com nomeProduto válido. Google Search SERP é robusto:
 * curl empírico 27/05 confirmou HTTP 200 + ~90KB pra Mevatyl/Cefalexina/Antak.
 *
 * Trade-off: usuário cai em SERP (precisa 1 clique extra) em vez de bula direta,
 * mas elimina 100% dos casos página branca. Aceitável pra MVP — quando >50 bulas
 * com PDF direto extraído (Fase 2-Pleno scraping), trocar pra link PDF.
 */
const anvisa = (nomeProduto: string): string =>
  `https://www.google.com/search?q=${encodeURIComponent(`bula ${nomeProduto} site:consultas.anvisa.gov.br`)}`

export const ANVISA_BULARIO_SEED: BularioEntry[] = [
  // ────────────────────────────────────────────────────────────────────
  // CANNABIS MEDICINAL BR (prioridade 1 — wedge clínico MedCannLab)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'mevatyl',
    nomeComercial: 'Mevatyl',
    principioAtivo: 'Tetrahidrocanabinol (THC) + Canabidiol (CBD)',
    apresentacao: '2,7 mg THC + 2,5 mg CBD por dose · Spray oromucoso 10mL',
    classeTerapeutica: 'Cannabinoide (canabinoides exógenos)',
    laboratorio: 'GW Pharma / Ipsen',
    categoria: 'cannabis',
    indicacaoResumida: 'Espasticidade moderada-grave em esclerose múltipla refratária a outros tratamentos.',
    bularioUrl: anvisa('Mevatyl'),
    tarja: 'preta',
    observacao: 'Único cannabinoide com registro ANVISA stricto sensu como medicamento (RDC 327/2019 + 660/2022).',
  },
  {
    id: 'canabidiol-prati-donaduzzi',
    nomeComercial: 'Canabidiol Prati-Donaduzzi',
    principioAtivo: 'Canabidiol (CBD)',
    apresentacao: '50 mg/mL · Solução oral 30mL',
    classeTerapeutica: 'Cannabinoide isolado',
    laboratorio: 'Prati-Donaduzzi',
    categoria: 'cannabis',
    indicacaoResumida: 'Epilepsia refratária. Uso compassivo via prescrição CFM + autorização ANVISA paciente.',
    bularioUrl: anvisa('Canabidiol'),
    dailymedUrl: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=cannabidiol',
    tarja: 'preta',
    observacao: 'Produto cannabis primeiro registrado ANVISA com RDC 327/2019. Importação dispensada via Prati-Donaduzzi.',
  },
  {
    id: 'canabidiol-ease-labs',
    nomeComercial: 'CBD Ease Labs',
    principioAtivo: 'Canabidiol (CBD)',
    apresentacao: '50 mg/mL · Solução oral 30mL',
    classeTerapeutica: 'Cannabinoide isolado',
    laboratorio: 'Ease Labs',
    categoria: 'cannabis',
    indicacaoResumida: 'Epilepsia refratária + uso compassivo aprovado ANVISA.',
    bularioUrl: anvisa('Ease+Labs+CBD'),
    tarja: 'preta',
  },
  {
    id: 'epidiolex-importado',
    nomeComercial: 'Epidiolex (importado)',
    principioAtivo: 'Canabidiol (CBD)',
    apresentacao: '100 mg/mL · Solução oral 100mL',
    classeTerapeutica: 'Cannabinoide isolado anti-convulsivante',
    laboratorio: 'Jazz Pharmaceuticals (importado autorização paciente)',
    categoria: 'cannabis',
    indicacaoResumida: 'Síndrome de Lennox-Gastaut, Dravet, Esclerose Tuberosa (≥1 ano).',
    bularioUrl: anvisa('Epidiolex'),
    dailymedUrl: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=09b86133-1c91-4f6c-bc6b-3568d6048e10',
    tarja: 'preta',
    observacao: 'FDA-approved 2018 (LGS/Dravet) e 2020 (TSC). Importação via autorização ANVISA paciente.',
  },

  // ────────────────────────────────────────────────────────────────────
  // ANTI-CONVULSIVANTES (prioridade 2 — epilepsia refratária + cannabis comum)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'gabapentina-neurontin',
    nomeComercial: 'Neurontin (Gabapentina)',
    principioAtivo: 'Gabapentina',
    apresentacao: 'Cápsulas 300 mg, 400 mg · Comprimidos 600 mg, 800 mg',
    classeTerapeutica: 'Anti-convulsivante / Analgésico neuropático',
    laboratorio: 'Pfizer',
    categoria: 'anticonvulsivante',
    indicacaoResumida: 'Epilepsia parcial, dor neuropática (neuralgia pós-herpética, neuropatia diabética).',
    bularioUrl: anvisa('Neurontin'),
    tarja: 'vermelha',
  },
  {
    id: 'pregabalina-lyrica',
    nomeComercial: 'Lyrica (Pregabalina)',
    principioAtivo: 'Pregabalina',
    apresentacao: 'Cápsulas 25, 50, 75, 100, 150, 300 mg',
    classeTerapeutica: 'Anti-convulsivante / Analgésico neuropático',
    laboratorio: 'Pfizer',
    categoria: 'anticonvulsivante',
    indicacaoResumida: 'Dor neuropática, fibromialgia, epilepsia parcial adjuvante, TAG.',
    bularioUrl: anvisa('Lyrica'),
    tarja: 'vermelha',
  },
  {
    id: 'lamotrigina-lamictal',
    nomeComercial: 'Lamictal (Lamotrigina)',
    principioAtivo: 'Lamotrigina',
    apresentacao: 'Comprimidos 25, 50, 100, 200 mg',
    classeTerapeutica: 'Anti-convulsivante / Estabilizador de humor',
    laboratorio: 'GSK',
    categoria: 'anticonvulsivante',
    indicacaoResumida: 'Epilepsia parcial e generalizada (incluindo Lennox-Gastaut), transtorno bipolar.',
    bularioUrl: anvisa('Lamictal'),
    tarja: 'vermelha',
    observacao: 'Atenção a rash cutâneo (Stevens-Johnson) — titulação lenta obrigatória.',
  },
  {
    id: 'valproato-depakene',
    nomeComercial: 'Depakene (Valproato de Sódio)',
    principioAtivo: 'Ácido Valproico / Valproato de Sódio',
    apresentacao: 'Cápsulas 250 mg · Xarope 50 mg/mL · Comprimidos liberação prolongada',
    classeTerapeutica: 'Anti-convulsivante de amplo espectro',
    laboratorio: 'Abbott / AbbVie',
    categoria: 'anticonvulsivante',
    indicacaoResumida: 'Epilepsia generalizada e parcial, mania bipolar, enxaqueca profilaxia.',
    bularioUrl: anvisa('Depakene'),
    tarja: 'vermelha',
    observacao: 'Hepatotoxicidade + teratogenicidade alta (categoria D gestação).',
  },
  {
    id: 'topiramato-topamax',
    nomeComercial: 'Topamax (Topiramato)',
    principioAtivo: 'Topiramato',
    apresentacao: 'Comprimidos 25, 50, 100 mg',
    classeTerapeutica: 'Anti-convulsivante / Profilaxia enxaqueca',
    laboratorio: 'Janssen',
    categoria: 'anticonvulsivante',
    indicacaoResumida: 'Epilepsia parcial/generalizada, profilaxia enxaqueca, transtorno bipolar adjuvante.',
    bularioUrl: anvisa('Topamax'),
    tarja: 'vermelha',
  },
  {
    id: 'levetiracetam-keppra',
    nomeComercial: 'Keppra (Levetiracetam)',
    principioAtivo: 'Levetiracetam',
    apresentacao: 'Comprimidos 250, 500, 750, 1000 mg · Solução oral 100 mg/mL',
    classeTerapeutica: 'Anti-convulsivante (SV2A modulador)',
    laboratorio: 'UCB Pharma',
    categoria: 'anticonvulsivante',
    indicacaoResumida: 'Epilepsia parcial e generalizada (mioclônica juvenil, tônico-clônica).',
    bularioUrl: anvisa('Keppra'),
    tarja: 'vermelha',
  },
  {
    id: 'clonazepam-rivotril',
    nomeComercial: 'Rivotril (Clonazepam)',
    principioAtivo: 'Clonazepam',
    apresentacao: 'Comprimidos 0,5 e 2 mg · Gotas 2,5 mg/mL',
    classeTerapeutica: 'Benzodiazepínico anti-convulsivante / Ansiolítico',
    laboratorio: 'Roche',
    categoria: 'anticonvulsivante',
    indicacaoResumida: 'Epilepsia (ausência, mioclonias, LGS), pânico, ansiedade severa.',
    bularioUrl: anvisa('Rivotril'),
    tarja: 'preta',
    observacao: 'Controle especial B1 (psicotrópico). Risco dependência alto. Tarja preta.',
  },
  {
    id: 'fenitoina-hidantal',
    nomeComercial: 'Hidantal (Fenitoína)',
    principioAtivo: 'Fenitoína Sódica',
    apresentacao: 'Comprimidos 100 mg · Suspensão oral · Ampola injetável',
    classeTerapeutica: 'Anti-convulsivante (bloqueador canal sódio)',
    laboratorio: 'Sanofi',
    categoria: 'anticonvulsivante',
    indicacaoResumida: 'Epilepsia tônico-clônica e parcial, status epilepticus.',
    bularioUrl: anvisa('Hidantal'),
    tarja: 'vermelha',
    observacao: 'Janela terapêutica estreita. Múltiplas interações (indutor citocromo).',
  },
  {
    id: 'carbamazepina-tegretol',
    nomeComercial: 'Tegretol (Carbamazepina)',
    principioAtivo: 'Carbamazepina',
    apresentacao: 'Comprimidos 200, 400 mg · Suspensão oral 20 mg/mL',
    classeTerapeutica: 'Anti-convulsivante / Estabilizador humor / Analgésico neuralgia',
    laboratorio: 'Novartis',
    categoria: 'anticonvulsivante',
    indicacaoResumida: 'Epilepsia parcial, neuralgia trigeminal, transtorno bipolar.',
    bularioUrl: anvisa('Tegretol'),
    tarja: 'vermelha',
    observacao: 'Indutor enzimático forte — múltiplas interações. Risco Stevens-Johnson HLA-B*1502.',
  },

  // ────────────────────────────────────────────────────────────────────
  // PSICOTRÓPICOS (prioridade 3 — comorbidade ansiedade/depressão cannabis)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'fluoxetina-prozac',
    nomeComercial: 'Prozac (Fluoxetina)',
    principioAtivo: 'Cloridrato de Fluoxetina',
    apresentacao: 'Cápsulas 10 e 20 mg · Solução oral 20 mg/5mL',
    classeTerapeutica: 'Antidepressivo ISRS',
    laboratorio: 'Eli Lilly',
    categoria: 'psicotropico',
    indicacaoResumida: 'Depressão maior, TOC, bulimia nervosa, TPM, ataques de pânico.',
    bularioUrl: anvisa('Prozac'),
    tarja: 'vermelha',
  },
  {
    id: 'sertralina-zoloft',
    nomeComercial: 'Zoloft (Sertralina)',
    principioAtivo: 'Cloridrato de Sertralina',
    apresentacao: 'Comprimidos 25, 50, 100 mg',
    classeTerapeutica: 'Antidepressivo ISRS',
    laboratorio: 'Pfizer',
    categoria: 'psicotropico',
    indicacaoResumida: 'Depressão maior, TOC, pânico, TEPT, TAS, TDPM.',
    bularioUrl: anvisa('Zoloft'),
    tarja: 'vermelha',
  },
  {
    id: 'escitalopram-lexapro',
    nomeComercial: 'Lexapro (Escitalopram)',
    principioAtivo: 'Oxalato de Escitalopram',
    apresentacao: 'Comprimidos 10, 15, 20 mg · Gotas 20 mg/mL',
    classeTerapeutica: 'Antidepressivo ISRS',
    laboratorio: 'Lundbeck',
    categoria: 'psicotropico',
    indicacaoResumida: 'Depressão maior, TAG, TOC, pânico, fobia social.',
    bularioUrl: anvisa('Lexapro'),
    tarja: 'vermelha',
  },
  {
    id: 'alprazolam-frontal',
    nomeComercial: 'Frontal (Alprazolam)',
    principioAtivo: 'Alprazolam',
    apresentacao: 'Comprimidos 0,25; 0,5; 1; 2 mg · XR liberação prolongada',
    classeTerapeutica: 'Benzodiazepínico ansiolítico',
    laboratorio: 'Pfizer',
    categoria: 'psicotropico',
    indicacaoResumida: 'Ansiedade generalizada, pânico, ansiedade associada à depressão.',
    bularioUrl: anvisa('Frontal'),
    tarja: 'preta',
    observacao: 'Controle especial B1. Alto potencial dependência. Curto prazo.',
  },
  {
    id: 'diazepam-valium',
    nomeComercial: 'Valium (Diazepam)',
    principioAtivo: 'Diazepam',
    apresentacao: 'Comprimidos 5, 10 mg · Ampola 10 mg/2mL',
    classeTerapeutica: 'Benzodiazepínico ansiolítico/relaxante muscular',
    laboratorio: 'Roche',
    categoria: 'psicotropico',
    indicacaoResumida: 'Ansiedade, espasmo muscular, abstinência alcoólica, sedação, status epilepticus.',
    bularioUrl: anvisa('Valium'),
    tarja: 'preta',
    observacao: 'Controle especial B1. Meia-vida longa (acumulativo em idosos).',
  },
  {
    id: 'mirtazapina-remeron',
    nomeComercial: 'Remeron (Mirtazapina)',
    principioAtivo: 'Mirtazapina',
    apresentacao: 'Comprimidos 15, 30, 45 mg',
    classeTerapeutica: 'Antidepressivo tetracíclico (NaSSA)',
    laboratorio: 'Organon',
    categoria: 'psicotropico',
    indicacaoResumida: 'Depressão maior, particularmente com insônia ou perda de peso associada.',
    bularioUrl: anvisa('Remeron'),
    tarja: 'vermelha',
  },
  {
    id: 'bupropiona-wellbutrin',
    nomeComercial: 'Wellbutrin (Bupropiona)',
    principioAtivo: 'Cloridrato de Bupropiona',
    apresentacao: 'Comprimidos 150, 300 mg (XR / SR)',
    classeTerapeutica: 'Antidepressivo (inibidor recaptação NA/DA)',
    laboratorio: 'GSK',
    categoria: 'psicotropico',
    indicacaoResumida: 'Depressão maior, cessação tabágica, depressão sazonal.',
    bularioUrl: anvisa('Wellbutrin'),
    tarja: 'vermelha',
    observacao: 'Reduz limiar convulsivo — contraindicado epilepsia, anorexia/bulimia.',
  },
  {
    id: 'venlafaxina-efexor',
    nomeComercial: 'Efexor XR (Venlafaxina)',
    principioAtivo: 'Cloridrato de Venlafaxina',
    apresentacao: 'Cápsulas 37,5; 75; 150 mg (liberação prolongada)',
    classeTerapeutica: 'Antidepressivo dual (IRSN)',
    laboratorio: 'Pfizer',
    categoria: 'psicotropico',
    indicacaoResumida: 'Depressão maior, TAG, fobia social, pânico.',
    bularioUrl: anvisa('Efexor'),
    tarja: 'vermelha',
  },
  {
    id: 'risperidona-risperdal',
    nomeComercial: 'Risperdal (Risperidona)',
    principioAtivo: 'Risperidona',
    apresentacao: 'Comprimidos 0,5; 1; 2; 3; 4 mg · Solução oral 1 mg/mL',
    classeTerapeutica: 'Antipsicótico atípico',
    laboratorio: 'Janssen',
    categoria: 'psicotropico',
    indicacaoResumida: 'Esquizofrenia, mania bipolar aguda, irritabilidade no autismo.',
    bularioUrl: anvisa('Risperdal'),
    tarja: 'vermelha',
  },

  // ────────────────────────────────────────────────────────────────────
  // ANALGÉSICOS / ANTI-INFLAMATÓRIOS (prioridade 4 — dor crônica + cannabis)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'dipirona-novalgina',
    nomeComercial: 'Novalgina (Dipirona)',
    principioAtivo: 'Dipirona Sódica (Metamizol)',
    apresentacao: 'Comprimidos 500, 1000 mg · Gotas 500 mg/mL · Ampola 500 mg/mL',
    classeTerapeutica: 'Analgésico/Antipirético não-opioide',
    laboratorio: 'Sanofi',
    categoria: 'analgesico',
    indicacaoResumida: 'Dor aguda leve a moderada, febre.',
    bularioUrl: anvisa('Novalgina'),
    tarja: 'branca',
    observacao: 'Proibida em vários países (agranulocitose rara). Uso amplo BR.',
  },
  {
    id: 'paracetamol-tylenol',
    nomeComercial: 'Tylenol (Paracetamol)',
    principioAtivo: 'Paracetamol (Acetaminofeno)',
    apresentacao: 'Comprimidos 500, 750 mg · Gotas 200 mg/mL · Comprimido efervescente',
    classeTerapeutica: 'Analgésico/Antipirético não-opioide',
    laboratorio: 'Janssen',
    categoria: 'analgesico',
    indicacaoResumida: 'Dor aguda leve a moderada, febre.',
    bularioUrl: anvisa('Tylenol'),
    tarja: 'branca',
    observacao: 'Hepatotoxicidade dose-dependente. Máx 4g/dia (3g hepatopata).',
  },
  {
    id: 'ibuprofeno-advil',
    nomeComercial: 'Advil / Ibuprofeno',
    principioAtivo: 'Ibuprofeno',
    apresentacao: 'Comprimidos 200, 400, 600 mg · Suspensão oral · Gel tópico',
    classeTerapeutica: 'AINE (anti-inflamatório não-esteroidal)',
    laboratorio: 'Pfizer Consumer Health',
    categoria: 'analgesico',
    indicacaoResumida: 'Dor leve-moderada, febre, processos inflamatórios.',
    bularioUrl: anvisa('Ibuprofeno'),
    tarja: 'branca',
    observacao: 'Risco gastro + renal + cardiovascular. Cautela DRC + idoso.',
  },
  {
    id: 'diclofenaco-voltaren',
    nomeComercial: 'Voltaren (Diclofenaco)',
    principioAtivo: 'Diclofenaco Sódico/Potássico',
    apresentacao: 'Comprimidos 50 mg · Gel/Pomada tópica · Ampola',
    classeTerapeutica: 'AINE',
    laboratorio: 'Novartis / GSK',
    categoria: 'analgesico',
    indicacaoResumida: 'Dor músculo-esquelética, artrites, dismenorreia.',
    bularioUrl: anvisa('Voltaren'),
    tarja: 'vermelha',
    observacao: 'Risco cardiovascular alto entre AINEs. Cautela HAS, DRC.',
  },
  {
    id: 'codeina-tylex',
    nomeComercial: 'Tylex (Paracetamol + Codeína)',
    principioAtivo: 'Paracetamol 500 mg + Fosfato de Codeína 30 mg',
    apresentacao: 'Comprimidos 500 mg + 7,5 mg / 500 mg + 30 mg',
    classeTerapeutica: 'Analgésico opioide fraco combinado',
    laboratorio: 'Janssen',
    categoria: 'analgesico',
    indicacaoResumida: 'Dor moderada não responsiva a analgésico simples.',
    bularioUrl: anvisa('Tylex'),
    tarja: 'amarela',
    observacao: 'Controle A2 (entorpecente). Codeína metabolizada CYP2D6 — variabilidade interindividual.',
  },
  {
    id: 'tramadol-tramal',
    nomeComercial: 'Tramal (Tramadol)',
    principioAtivo: 'Cloridrato de Tramadol',
    apresentacao: 'Cápsulas 50 mg · Comprimidos LP 100, 150, 200 mg · Gotas 100 mg/mL · Ampola',
    classeTerapeutica: 'Analgésico opioide fraco / IRSN',
    laboratorio: 'Grünenthal',
    categoria: 'analgesico',
    indicacaoResumida: 'Dor moderada a severa.',
    bularioUrl: anvisa('Tramal'),
    tarja: 'amarela',
    observacao: 'Controle A2. Reduz limiar convulsivo. Síndrome serotoninérgica com ISRS.',
  },
  {
    id: 'morfina-dimorf',
    nomeComercial: 'Dimorf (Morfina)',
    principioAtivo: 'Sulfato de Morfina',
    apresentacao: 'Comprimidos 10, 30 mg (IR/LP) · Solução oral · Ampola',
    classeTerapeutica: 'Analgésico opioide forte',
    laboratorio: 'Cristália',
    categoria: 'analgesico',
    indicacaoResumida: 'Dor severa (oncológica, pós-operatória, crônica refratária).',
    bularioUrl: anvisa('Dimorf'),
    tarja: 'amarela',
    observacao: 'Controle A1 (entorpecente). Tolerância + dependência.',
  },
  {
    id: 'naproxeno-flanax',
    nomeComercial: 'Flanax (Naproxeno)',
    principioAtivo: 'Naproxeno Sódico',
    apresentacao: 'Comprimidos 220, 275, 500, 550 mg',
    classeTerapeutica: 'AINE',
    laboratorio: 'Bayer',
    categoria: 'analgesico',
    indicacaoResumida: 'Dor leve-moderada, artrites, dismenorreia, enxaqueca.',
    bularioUrl: anvisa('Flanax'),
    tarja: 'branca',
  },

  // ────────────────────────────────────────────────────────────────────
  // NEFRO (prioridade 5 — Dr. Ricardo wedge clínico DRC + cannabis)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'losartana-cozaar',
    nomeComercial: 'Cozaar (Losartana)',
    principioAtivo: 'Losartana Potássica',
    apresentacao: 'Comprimidos 25, 50, 100 mg',
    classeTerapeutica: 'BRA (bloqueador receptor angiotensina II)',
    laboratorio: 'MSD',
    categoria: 'nefro',
    indicacaoResumida: 'HAS, nefropatia diabética, insuficiência cardíaca.',
    bularioUrl: anvisa('Cozaar'),
    tarja: 'vermelha',
    observacao: 'Renoprotetor. Contraindicado bilateral renal stenosis + gestação.',
  },
  {
    id: 'enalapril-renitec',
    nomeComercial: 'Renitec (Enalapril)',
    principioAtivo: 'Maleato de Enalapril',
    apresentacao: 'Comprimidos 5, 10, 20 mg',
    classeTerapeutica: 'IECA (inibidor enzima conversora angiotensina)',
    laboratorio: 'MSD',
    categoria: 'nefro',
    indicacaoResumida: 'HAS, nefropatia diabética, insuficiência cardíaca.',
    bularioUrl: anvisa('Renitec'),
    tarja: 'vermelha',
    observacao: 'Renoprotetor. Risco hipercalemia + tosse + angioedema. Monitorar K+ e creatinina.',
  },
  {
    id: 'furosemida-lasix',
    nomeComercial: 'Lasix (Furosemida)',
    principioAtivo: 'Furosemida',
    apresentacao: 'Comprimidos 40 mg · Ampola 20 mg/2mL',
    classeTerapeutica: 'Diurético de alça',
    laboratorio: 'Sanofi',
    categoria: 'nefro',
    indicacaoResumida: 'Edema (ICC, hepático, renal), HAS, hipertensão crise.',
    bularioUrl: anvisa('Lasix'),
    tarja: 'vermelha',
    observacao: 'Ototoxicidade dose-dependente. Distúrbios eletrolíticos (Na, K, Mg).',
  },
  {
    id: 'hidroclorotiazida-clorana',
    nomeComercial: 'Clorana (Hidroclorotiazida)',
    principioAtivo: 'Hidroclorotiazida (HCTZ)',
    apresentacao: 'Comprimidos 25, 50 mg',
    classeTerapeutica: 'Diurético tiazídico',
    laboratorio: 'Sanofi',
    categoria: 'nefro',
    indicacaoResumida: 'HAS, edema leve a moderado.',
    bularioUrl: anvisa('Clorana'),
    tarja: 'vermelha',
    observacao: 'Hipocalemia + hipomagnesemia + hiperuricemia + intolerância glicídica.',
  },
  {
    id: 'espironolactona-aldactone',
    nomeComercial: 'Aldactone (Espironolactona)',
    principioAtivo: 'Espironolactona',
    apresentacao: 'Comprimidos 25, 50, 100 mg',
    classeTerapeutica: 'Diurético poupador de potássio / Antagonista aldosterona',
    laboratorio: 'Pfizer',
    categoria: 'nefro',
    indicacaoResumida: 'ICC NYHA III-IV, cirrose hepática com ascite, hiperaldosteronismo, HAS resistente.',
    bularioUrl: anvisa('Aldactone'),
    tarja: 'vermelha',
    observacao: 'Hipercalemia + ginecomastia. Cautela DRC + IECA/BRA concomitante.',
  },
  {
    id: 'atorvastatina-lipitor',
    nomeComercial: 'Lipitor (Atorvastatina)',
    principioAtivo: 'Atorvastatina Cálcica',
    apresentacao: 'Comprimidos 10, 20, 40, 80 mg',
    classeTerapeutica: 'Estatina (inibidor HMG-CoA redutase)',
    laboratorio: 'Pfizer',
    categoria: 'nefro',
    indicacaoResumida: 'Hipercolesterolemia, prevenção cardiovascular primária e secundária.',
    bularioUrl: anvisa('Lipitor'),
    tarja: 'vermelha',
    observacao: 'Miopatia + rabdomiólise rara. Hepatotoxicidade. Interação CYP3A4.',
  },
  {
    id: 'amlodipina-norvasc',
    nomeComercial: 'Norvasc (Amlodipina)',
    principioAtivo: 'Besilato de Amlodipina',
    apresentacao: 'Comprimidos 2,5; 5; 10 mg',
    classeTerapeutica: 'Bloqueador canal cálcio diidropiridínico',
    laboratorio: 'Pfizer',
    categoria: 'nefro',
    indicacaoResumida: 'HAS, angina estável crônica, angina vasoespástica (Prinzmetal).',
    bularioUrl: anvisa('Norvasc'),
    tarja: 'vermelha',
    observacao: 'Edema MMII dose-dependente. Cefaleia, rubor facial.',
  },
  {
    id: 'metformina-glifage',
    nomeComercial: 'Glifage (Metformina)',
    principioAtivo: 'Cloridrato de Metformina',
    apresentacao: 'Comprimidos 500, 850, 1000 mg (XR / IR)',
    classeTerapeutica: 'Antidiabético biguanida',
    laboratorio: 'Merck',
    categoria: 'nefro',
    indicacaoResumida: 'Diabetes mellitus tipo 2, síndrome ovários policísticos.',
    bularioUrl: anvisa('Glifage'),
    tarja: 'vermelha',
    observacao: 'Acidose láctica (rara). Suspender se TFG <30 mL/min/1,73m².',
  },

  // ────────────────────────────────────────────────────────────────────
  // OUTROS (relevantes contexto cannabis BR)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'omeprazol-losec',
    nomeComercial: 'Losec (Omeprazol)',
    principioAtivo: 'Omeprazol',
    apresentacao: 'Cápsulas 10, 20, 40 mg',
    classeTerapeutica: 'Inibidor bomba de prótons (IBP)',
    laboratorio: 'AstraZeneca',
    categoria: 'gastrointestinal',
    indicacaoResumida: 'DRGE, úlcera gástrica/duodenal, gastrite, H. pylori (adjuvante).',
    bularioUrl: anvisa('Losec'),
    tarja: 'branca',
    observacao: 'Uso crônico → hipomagnesemia + osteoporose + B12 deficit + risco DRC.',
  },
  {
    id: 'levotiroxina-puran',
    nomeComercial: 'Puran T4 (Levotiroxina)',
    principioAtivo: 'Levotiroxina Sódica',
    apresentacao: 'Comprimidos 25, 50, 75, 88, 100, 112, 125, 137, 150, 175, 200 mcg',
    classeTerapeutica: 'Hormônio tireoidiano T4 sintético',
    laboratorio: 'Sanofi (Aché distribuidor BR)',
    categoria: 'metabolico',
    indicacaoResumida: 'Hipotireoidismo, supressão TSH em câncer tireoide.',
    bularioUrl: anvisa('Puran'),
    tarja: 'vermelha',
    observacao: 'Janela estreita. Jejum 30-60min. Múltiplas interações absorção.',
  },

  // ════════════════════════════════════════════════════════════════════
  // V1.9.467 EXPANSÃO (27/05) — +80 bulas em 4 categorias novas + 6 extras
  // ════════════════════════════════════════════════════════════════════
  // Princípio honestidade: pra medicamentos onde não tenho 100% confiança em
  // interação farmacológica específica, observação fica null (só metadados +
  // link ANVISA oficial = bula completa). Médico vê tarja + classe + link.
  // ────────────────────────────────────────────────────────────────────
  // ANTIBIÓTICOS / ANTIMICROBIANOS (25 — Ricardo pediu cefalexina como exemplo)
  // ────────────────────────────────────────────────────────────────────
  { id: 'cefalexina-keflex', nomeComercial: 'Keflex (Cefalexina)', principioAtivo: 'Cefalexina', apresentacao: 'Cápsulas 250, 500 mg · Suspensão oral 250 mg/5mL · Comprimidos 1 g', classeTerapeutica: 'Antibiótico cefalosporina 1ª geração', laboratorio: 'EMS / Sanofi', categoria: 'antibiotico', indicacaoResumida: 'Infecções pele/tecidos moles, ITU, faringoamigdalite estreptocócica.', bularioUrl: anvisa('Keflex'), tarja: 'vermelha', observacao: 'Ajuste DRC: TFG <50 reduzir frequência. Alergia cruzada penicilina ~5-10%.' },
  { id: 'amoxicilina-amoxil', nomeComercial: 'Amoxil (Amoxicilina)', principioAtivo: 'Amoxicilina', apresentacao: 'Cápsulas 500 mg · Suspensão oral 250 mg/5mL e 500 mg/5mL', classeTerapeutica: 'Antibiótico penicilina aminopenicilina', laboratorio: 'GSK', categoria: 'antibiotico', indicacaoResumida: 'Infecções respiratórias, ITU, otite, sinusite, H. pylori (combinação).', bularioUrl: anvisa('Amoxil'), tarja: 'vermelha', observacao: 'Ajuste DRC: TFG <30 espaçar doses. Alergia penicilina = contraindicação.' },
  { id: 'amoxicilina-clavulanato-clavulin', nomeComercial: 'Clavulin (Amoxicilina + Clavulanato)', principioAtivo: 'Amoxicilina + Clavulanato de Potássio', apresentacao: 'Comprimidos 500/125 mg, 875/125 mg · Suspensão oral · BD (Bis in die)', classeTerapeutica: 'Antibiótico penicilina + inibidor beta-lactamase', laboratorio: 'GSK', categoria: 'antibiotico', indicacaoResumida: 'Infecções resistentes a amoxicilina pura (otite, sinusite, ITU complicada).', bularioUrl: anvisa('Clavulin'), tarja: 'vermelha', observacao: 'Diarreia + colite C. difficile (clavulanato). Hepatotoxicidade rara.' },
  { id: 'azitromicina-zitromax', nomeComercial: 'Zitromax (Azitromicina)', principioAtivo: 'Azitromicina', apresentacao: 'Comprimidos 500 mg · Suspensão oral 200 mg/5mL', classeTerapeutica: 'Antibiótico macrolídeo', laboratorio: 'Pfizer', categoria: 'antibiotico', indicacaoResumida: 'Pneumonia atípica, faringoamigdalite, infecções respiratórias, DSTs (clamídia).', bularioUrl: anvisa('Zitromax'), tarja: 'vermelha', observacao: 'Prolonga QT. Cautela cardiopata + arritmia. Interação warfarina.' },
  { id: 'claritromicina-klaricid', nomeComercial: 'Klaricid (Claritromicina)', principioAtivo: 'Claritromicina', apresentacao: 'Comprimidos 250, 500 mg (IR e LP) · Suspensão oral 125, 250 mg/5mL', classeTerapeutica: 'Antibiótico macrolídeo', laboratorio: 'Abbott / AbbVie', categoria: 'antibiotico', indicacaoResumida: 'H. pylori (combinação), pneumonia, sinusite, infecções respiratórias.', bularioUrl: anvisa('Klaricid'), tarja: 'vermelha', observacao: 'Forte inibidor CYP3A4 — múltiplas interações graves (statinas, BZD).' },
  { id: 'eritromicina-pantomicina', nomeComercial: 'Pantomicina (Eritromicina)', principioAtivo: 'Estearato de Eritromicina', apresentacao: 'Comprimidos 500 mg · Suspensão oral · Gel/Pomada tópica', classeTerapeutica: 'Antibiótico macrolídeo', laboratorio: 'EMS', categoria: 'antibiotico', indicacaoResumida: 'Alternativa em alérgicos penicilina. Acne (tópica).', bularioUrl: anvisa('Pantomicina'), tarja: 'vermelha' },
  { id: 'ciprofloxacino-cipro', nomeComercial: 'Cipro (Ciprofloxacino)', principioAtivo: 'Cloridrato de Ciprofloxacino', apresentacao: 'Comprimidos 250, 500, 750 mg · Suspensão oral · Ampola IV · Colírio', classeTerapeutica: 'Antibiótico fluoroquinolona', laboratorio: 'Bayer', categoria: 'antibiotico', indicacaoResumida: 'ITU complicada, prostatite, infecções intra-abdominais, gastrointestinais.', bularioUrl: anvisa('Cipro'), tarja: 'vermelha', observacao: 'Rotura tendão Aquiles (idoso + corticoide). Prolonga QT. Evitar <18 anos.' },
  { id: 'levofloxacino-levaquin', nomeComercial: 'Levaquin (Levofloxacino)', principioAtivo: 'Levofloxacino', apresentacao: 'Comprimidos 250, 500, 750 mg · Ampola IV', classeTerapeutica: 'Antibiótico fluoroquinolona respiratória', laboratorio: 'Janssen', categoria: 'antibiotico', indicacaoResumida: 'Pneumonia, sinusite bacteriana, exacerbação DPOC, ITU complicada.', bularioUrl: anvisa('Levaquin'), tarja: 'vermelha', observacao: 'Mesmas advertências quinolonas: tendão + QT + neuropatia.' },
  { id: 'norfloxacino-floxacin', nomeComercial: 'Floxacin (Norfloxacino)', principioAtivo: 'Norfloxacino', apresentacao: 'Comprimidos 400 mg', classeTerapeutica: 'Antibiótico fluoroquinolona', laboratorio: 'EMS', categoria: 'antibiotico', indicacaoResumida: 'ITU não complicada, prostatite bacteriana.', bularioUrl: anvisa('Floxacin'), tarja: 'vermelha', observacao: 'Não usar em pneumonia (baixa concentração pulmonar).' },
  { id: 'bactrim-smx-tmp', nomeComercial: 'Bactrim (Sulfametoxazol + Trimetoprima)', principioAtivo: 'Sulfametoxazol 400 mg + Trimetoprima 80 mg (F: 800/160 mg)', apresentacao: 'Comprimidos · Suspensão oral · Ampola IV', classeTerapeutica: 'Antibiótico sulfonamida + trimetoprima', laboratorio: 'Roche', categoria: 'antibiotico', indicacaoResumida: 'ITU não complicada, profilaxia Pneumocystis (HIV), nocardiose.', bularioUrl: anvisa('Bactrim'), tarja: 'vermelha', observacao: 'Hipercalemia (cuidado IRC + IECA). Stevens-Johnson raro.' },
  { id: 'doxiciclina-vibramicina', nomeComercial: 'Vibramicina (Doxiciclina)', principioAtivo: 'Doxiciclina', apresentacao: 'Cápsulas 100 mg · Comprimidos 100 mg', classeTerapeutica: 'Antibiótico tetraciclina', laboratorio: 'Pfizer', categoria: 'antibiotico', indicacaoResumida: 'Acne, riquetsiose, DSTs (clamídia, sífilis), malária profilaxia.', bularioUrl: anvisa('Vibramicina'), tarja: 'vermelha', observacao: 'Contraindicado <8 anos (manchas dentárias). Fotossensibilidade.' },
  { id: 'tetraciclina', nomeComercial: 'Tetraciclina', principioAtivo: 'Cloridrato de Tetraciclina', apresentacao: 'Cápsulas 250, 500 mg', classeTerapeutica: 'Antibiótico tetraciclina', laboratorio: 'EMS / Genéricos', categoria: 'antibiotico', indicacaoResumida: 'Acne, infecções respiratórias, DSTs.', bularioUrl: anvisa('Tetraciclina'), tarja: 'vermelha', observacao: 'Pouco usado atualmente (preferir doxiciclina). Manchas dentárias <8 anos.' },
  { id: 'metronidazol-flagyl', nomeComercial: 'Flagyl (Metronidazol)', principioAtivo: 'Metronidazol', apresentacao: 'Comprimidos 250, 400 mg · Suspensão oral · Geleia vaginal · Ampola IV', classeTerapeutica: 'Antibiótico nitroimidazol (anaeróbicos + protozoários)', laboratorio: 'Sanofi', categoria: 'antibiotico', indicacaoResumida: 'Infecções anaeróbicas, giardíase, tricomoníase, vaginose, C. difficile.', bularioUrl: anvisa('Flagyl'), tarja: 'vermelha', observacao: 'Efeito antabuse com álcool (vômito). Gosto metálico.' },
  { id: 'nitrofurantoina-macrodantina', nomeComercial: 'Macrodantina (Nitrofurantoína)', principioAtivo: 'Nitrofurantoína', apresentacao: 'Cápsulas 100 mg', classeTerapeutica: 'Antibiótico urinário', laboratorio: 'Aché', categoria: 'antibiotico', indicacaoResumida: 'ITU não complicada, profilaxia ITU recorrente.', bularioUrl: anvisa('Macrodantina'), tarja: 'vermelha', observacao: 'Contraindicado TFG <60 (não atinge urina). Fibrose pulmonar uso crônico.' },
  { id: 'ceftriaxona-rocefin', nomeComercial: 'Rocefin (Ceftriaxona)', principioAtivo: 'Ceftriaxona Sódica', apresentacao: 'Frasco-ampola 250, 500 mg, 1 g IV/IM', classeTerapeutica: 'Antibiótico cefalosporina 3ª geração', laboratorio: 'Roche', categoria: 'antibiotico', indicacaoResumida: 'Pneumonia hospitalar, meningite, sepse, gonorreia, pielonefrite.', bularioUrl: anvisa('Rocefin'), tarja: 'vermelha', observacao: 'NÃO misturar com cálcio IV (precipitação fatal em RN).' },
  { id: 'ampicilina', nomeComercial: 'Ampicilina', principioAtivo: 'Ampicilina', apresentacao: 'Cápsulas 500 mg · Frasco-ampola 500 mg, 1 g IV', classeTerapeutica: 'Antibiótico penicilina aminopenicilina', laboratorio: 'EMS / Genéricos', categoria: 'antibiotico', indicacaoResumida: 'Endocardite (enterococos), meningite por Listeria, pielonefrite.', bularioUrl: anvisa('Ampicilina'), tarja: 'vermelha' },
  { id: 'benzetacil-penicilina-g', nomeComercial: 'Benzetacil (Penicilina G Benzatina)', principioAtivo: 'Penicilina G Benzatina', apresentacao: 'Frasco-ampola 600.000 UI, 1.200.000 UI IM', classeTerapeutica: 'Antibiótico penicilina depósito', laboratorio: 'EMS', categoria: 'antibiotico', indicacaoResumida: 'Sífilis (todas as fases), faringoamigdalite estreptocócica, profilaxia febre reumática.', bularioUrl: anvisa('Benzetacil'), tarja: 'vermelha', observacao: 'Aplicação IM profunda. Risco anafilaxia (teste prévio). Dor local intensa.' },
  { id: 'cefuroxima-zinnat', nomeComercial: 'Zinnat (Cefuroxima)', principioAtivo: 'Cefuroxima Axetil', apresentacao: 'Comprimidos 250, 500 mg · Suspensão oral 125, 250 mg/5mL', classeTerapeutica: 'Antibiótico cefalosporina 2ª geração', laboratorio: 'GSK', categoria: 'antibiotico', indicacaoResumida: 'Otite média, sinusite, pneumonia comunitária, ITU.', bularioUrl: anvisa('Zinnat'), tarja: 'vermelha' },
  { id: 'cefadroxila-cefamox', nomeComercial: 'Cefamox (Cefadroxila)', principioAtivo: 'Cefadroxila', apresentacao: 'Cápsulas 500 mg · Comprimidos 1 g · Suspensão oral', classeTerapeutica: 'Antibiótico cefalosporina 1ª geração', laboratorio: 'Bristol-Myers Squibb / EMS', categoria: 'antibiotico', indicacaoResumida: 'Infecções pele/tecidos moles, ITU, faringoamigdalite.', bularioUrl: anvisa('Cefamox'), tarja: 'vermelha' },
  { id: 'clindamicina-dalacin', nomeComercial: 'Dalacin (Clindamicina)', principioAtivo: 'Clindamicina', apresentacao: 'Cápsulas 150, 300 mg · Ampola IV · Gel/Creme tópico/vaginal', classeTerapeutica: 'Antibiótico lincosamida (anaeróbicos + Gram+)', laboratorio: 'Pfizer', categoria: 'antibiotico', indicacaoResumida: 'Infecções pele/tecidos moles, abscessos, vaginose bacteriana, acne (tópico).', bularioUrl: anvisa('Dalacin'), tarja: 'vermelha', observacao: 'Risco alto de colite por C. difficile. Suspender se diarreia.' },
  { id: 'vancomicina', nomeComercial: 'Vancomicina', principioAtivo: 'Cloridrato de Vancomicina', apresentacao: 'Frasco-ampola 500 mg, 1 g IV · Cápsulas 125, 250 mg (oral)', classeTerapeutica: 'Antibiótico glicopeptídeo', laboratorio: 'EMS / Genéricos', categoria: 'antibiotico', indicacaoResumida: 'Infecções graves por Gram+ (MRSA), endocardite, C. difficile grave (oral).', bularioUrl: anvisa('Vancomicina'), tarja: 'vermelha', observacao: 'Nefrotoxicidade + ototoxicidade. Monitorar nível sérico. Red man syndrome (infusão rápida).' },
  { id: 'linezolida-zyvox', nomeComercial: 'Zyvox (Linezolida)', principioAtivo: 'Linezolida', apresentacao: 'Comprimidos 600 mg · Ampola IV', classeTerapeutica: 'Antibiótico oxazolidinona (Gram+ resistentes)', laboratorio: 'Pfizer', categoria: 'antibiotico', indicacaoResumida: 'Infecções por MRSA, VRE, pneumonia hospitalar resistente.', bularioUrl: anvisa('Zyvox'), tarja: 'vermelha', observacao: 'Síndrome serotoninérgica com ISRS/IMAO. Trombocitopenia uso prolongado >14d.' },
  { id: 'cefepima-maxcef', nomeComercial: 'Maxcef (Cefepima)', principioAtivo: 'Cefepima', apresentacao: 'Frasco-ampola 1 g, 2 g IV', classeTerapeutica: 'Antibiótico cefalosporina 4ª geração', laboratorio: 'Cristália', categoria: 'antibiotico', indicacaoResumida: 'Infecções graves nosocomiais, neutropenia febril, sepse.', bularioUrl: anvisa('Maxcef'), tarja: 'vermelha', observacao: 'Neurotoxicidade (encefalopatia) em IRC sem ajuste dose.' },
  { id: 'meropenem-meronem', nomeComercial: 'Meronem (Meropenem)', principioAtivo: 'Meropenem', apresentacao: 'Frasco-ampola 500 mg, 1 g IV', classeTerapeutica: 'Antibiótico carbapenêmico', laboratorio: 'AstraZeneca / Pfizer', categoria: 'antibiotico', indicacaoResumida: 'Infecções graves hospitalares, meningite, sepse, ESBL +.', bularioUrl: anvisa('Meronem'), tarja: 'vermelha', observacao: 'Reduz limiar convulsivo. Cautela epilepsia + IRC.' },
  { id: 'fluconazol-zoltec', nomeComercial: 'Zoltec (Fluconazol)', principioAtivo: 'Fluconazol', apresentacao: 'Cápsulas 50, 100, 150 mg · Ampola IV', classeTerapeutica: 'Antifúngico triazólico', laboratorio: 'Pfizer', categoria: 'antibiotico', indicacaoResumida: 'Candidíase oral/vaginal/esofagiana/sistêmica, criptococose.', bularioUrl: anvisa('Zoltec'), tarja: 'vermelha', observacao: 'Inibidor CYP3A4/CYP2C9. Múltiplas interações (statinas, warfarina, fenitoína).' },

  // ────────────────────────────────────────────────────────────────────
  // CARDIOVASCULAR (15 — anticoagulantes + antiarrítmicos + estatinas + beta-bloq)
  // ────────────────────────────────────────────────────────────────────
  { id: 'varfarina-marevan', nomeComercial: 'Marevan (Varfarina)', principioAtivo: 'Varfarina Sódica', apresentacao: 'Comprimidos 1, 2.5, 5 mg', classeTerapeutica: 'Anticoagulante oral cumarínico (antagonista vitamina K)', laboratorio: 'Farmoquímica', categoria: 'cardiovascular', indicacaoResumida: 'FA não-valvar, TVP/TEP, próteses valvares mecânicas.', bularioUrl: anvisa('Marevan'), tarja: 'vermelha', observacao: 'Monitorar INR (alvo 2-3 ou 2.5-3.5). Múltiplas interações alimento+medicamento.' },
  { id: 'rivaroxabana-xarelto', nomeComercial: 'Xarelto (Rivaroxabana)', principioAtivo: 'Rivaroxabana', apresentacao: 'Comprimidos 2.5, 10, 15, 20 mg', classeTerapeutica: 'Anticoagulante oral direto (DOAC - inibidor Fator Xa)', laboratorio: 'Bayer', categoria: 'cardiovascular', indicacaoResumida: 'FA não-valvar, TVP/TEP, prevenção AVC.', bularioUrl: anvisa('Xarelto'), tarja: 'vermelha', observacao: 'Ajuste DRC: TFG <50 reduzir dose. CI TFG <15. Tomar com refeição (15/20mg).' },
  { id: 'apixabana-eliquis', nomeComercial: 'Eliquis (Apixabana)', principioAtivo: 'Apixabana', apresentacao: 'Comprimidos 2.5, 5 mg', classeTerapeutica: 'Anticoagulante oral direto (DOAC - inibidor Fator Xa)', laboratorio: 'Pfizer / BMS', categoria: 'cardiovascular', indicacaoResumida: 'FA não-valvar, TVP/TEP, profilaxia TEV pós-cirurgia ortopédica.', bularioUrl: anvisa('Eliquis'), tarja: 'vermelha', observacao: 'Menor risco sangramento que outros DOAC. Reduzir se 2 de 3: idade ≥80 / peso ≤60kg / Cr ≥1.5.' },
  { id: 'dabigatrana-pradaxa', nomeComercial: 'Pradaxa (Dabigatrana)', principioAtivo: 'Etexilato de Dabigatrana', apresentacao: 'Cápsulas 75, 110, 150 mg', classeTerapeutica: 'Anticoagulante oral direto (DOAC - inibidor trombina)', laboratorio: 'Boehringer Ingelheim', categoria: 'cardiovascular', indicacaoResumida: 'FA não-valvar, TVP/TEP.', bularioUrl: anvisa('Pradaxa'), tarja: 'vermelha', observacao: 'Antídoto disponível (Idarucizumabe). CI TFG <30.' },
  { id: 'enoxaparina-clexane', nomeComercial: 'Clexane (Enoxaparina)', principioAtivo: 'Enoxaparina Sódica', apresentacao: 'Seringa preenchida 20, 40, 60, 80, 100 mg', classeTerapeutica: 'Heparina de baixo peso molecular (HBPM)', laboratorio: 'Sanofi', categoria: 'cardiovascular', indicacaoResumida: 'Profilaxia TVP, TEP, IAM, SCA, ponte anticoagulação.', bularioUrl: anvisa('Clexane'), tarja: 'vermelha', observacao: 'Ajuste dose IRC (TFG <30). Monitorar plaquetas (HIT).' },
  { id: 'aas-baixa-dose-aspirina-prevent', nomeComercial: 'AAS / Aspirina Prevent', principioAtivo: 'Ácido Acetilsalicílico (baixa dose)', apresentacao: 'Comprimidos 100 mg (revestidos)', classeTerapeutica: 'Antiagregante plaquetário', laboratorio: 'Bayer / Genéricos', categoria: 'cardiovascular', indicacaoResumida: 'Prevenção secundária AVC/IAM, pós-stent (dual com clopidogrel).', bularioUrl: anvisa('Aspirina'), tarja: 'branca', observacao: 'Risco sangramento GI. Suspender 7d pré-cirurgia se eletiva.' },
  { id: 'clopidogrel-plavix', nomeComercial: 'Plavix (Clopidogrel)', principioAtivo: 'Clopidogrel', apresentacao: 'Comprimidos 75, 300 mg', classeTerapeutica: 'Antiagregante plaquetário (inibidor P2Y12)', laboratorio: 'Sanofi', categoria: 'cardiovascular', indicacaoResumida: 'SCA, pós-stent, prevenção IAM/AVC em alérgicos AAS.', bularioUrl: anvisa('Plavix'), tarja: 'vermelha', observacao: 'Interação omeprazol (reduz ativação CYP2C19 — preferir pantoprazol).' },
  { id: 'digoxina-digoxina', nomeComercial: 'Digoxina', principioAtivo: 'Digoxina', apresentacao: 'Comprimidos 0.25 mg · Elixir 0.05 mg/mL · Ampola IV', classeTerapeutica: 'Cardiotônico digitálico', laboratorio: 'GSK / Genéricos', categoria: 'cardiovascular', indicacaoResumida: 'ICC sistólica refratária, FA controle frequência.', bularioUrl: anvisa('Digoxina'), tarja: 'vermelha', observacao: 'Janela terapêutica MUITO estreita. Toxicidade: arritmia, visão amarelada. Ajuste DRC.' },
  { id: 'amiodarona-atlansil', nomeComercial: 'Atlansil (Amiodarona)', principioAtivo: 'Cloridrato de Amiodarona', apresentacao: 'Comprimidos 200 mg · Ampola IV 150 mg/3mL', classeTerapeutica: 'Antiarrítmico classe III', laboratorio: 'Libbs / Genéricos', categoria: 'cardiovascular', indicacaoResumida: 'FA persistente, taquicardia ventricular, parada cardíaca refratária.', bularioUrl: anvisa('Atlansil'), tarja: 'vermelha', observacao: 'Toxicidade pulmonar + tireoide + hepática + córnea. Monitorar TSH 6/6 meses.' },
  { id: 'propafenona-ritmonorm', nomeComercial: 'Ritmonorm (Propafenona)', principioAtivo: 'Cloridrato de Propafenona', apresentacao: 'Comprimidos 150, 300 mg', classeTerapeutica: 'Antiarrítmico classe IC', laboratorio: 'Abbott', categoria: 'cardiovascular', indicacaoResumida: 'FA paroxística sem cardiopatia estrutural ("pill in the pocket").', bularioUrl: anvisa('Ritmonorm'), tarja: 'vermelha', observacao: 'Contraindicado pós-IAM (estudo CAST: aumenta mortalidade).' },
  { id: 'sinvastatina', nomeComercial: 'Sinvastatina', principioAtivo: 'Sinvastatina', apresentacao: 'Comprimidos 10, 20, 40, 80 mg', classeTerapeutica: 'Estatina (inibidor HMG-CoA redutase)', laboratorio: 'Genéricos / MSD (Zocor)', categoria: 'cardiovascular', indicacaoResumida: 'Hipercolesterolemia, prevenção cardiovascular.', bularioUrl: anvisa('Sinvastatina'), tarja: 'vermelha', observacao: 'Tomar à noite (síntese colesterol noturna). Miopatia + rabdomiólise. Evitar suco grapefruit.' },
  { id: 'rosuvastatina-crestor', nomeComercial: 'Crestor (Rosuvastatina)', principioAtivo: 'Rosuvastatina Cálcica', apresentacao: 'Comprimidos 5, 10, 20, 40 mg', classeTerapeutica: 'Estatina potente', laboratorio: 'AstraZeneca', categoria: 'cardiovascular', indicacaoResumida: 'Hipercolesterolemia (LDL ↓50-60%), prevenção CV secundária.', bularioUrl: anvisa('Crestor'), tarja: 'vermelha', observacao: 'Menor interação CYP que sinvastatina. Asiáticos: dose máxima 20mg.' },
  { id: 'carvedilol', nomeComercial: 'Carvedilol', principioAtivo: 'Carvedilol', apresentacao: 'Comprimidos 3.125, 6.25, 12.5, 25 mg', classeTerapeutica: 'Beta-bloqueador não-seletivo + alfa-bloqueador', laboratorio: 'Genéricos / GSK (Coreg)', categoria: 'cardiovascular', indicacaoResumida: 'ICC sistólica (FE reduzida), HAS, pós-IAM.', bularioUrl: anvisa('Carvedilol'), tarja: 'vermelha', observacao: 'Iniciar dose baixa em ICC (titulação lenta). Tomar com alimentos.' },
  { id: 'atenolol-atenol', nomeComercial: 'Atenol (Atenolol)', principioAtivo: 'Atenolol', apresentacao: 'Comprimidos 25, 50, 100 mg', classeTerapeutica: 'Beta-bloqueador cardioseletivo (β1)', laboratorio: 'AstraZeneca', categoria: 'cardiovascular', indicacaoResumida: 'HAS, angina, pós-IAM, taquiarritmias.', bularioUrl: anvisa('Atenol'), tarja: 'vermelha', observacao: 'Eliminação renal — ajuste DRC. Não suspender abruptamente.' },
  { id: 'bisoprolol-concor', nomeComercial: 'Concor (Bisoprolol)', principioAtivo: 'Fumarato de Bisoprolol', apresentacao: 'Comprimidos 1.25, 2.5, 5, 10 mg', classeTerapeutica: 'Beta-bloqueador cardioseletivo β1 (alta seletividade)', laboratorio: 'Merck', categoria: 'cardiovascular', indicacaoResumida: 'ICC sistólica (FE reduzida), HAS, angina estável.', bularioUrl: anvisa('Concor'), tarja: 'vermelha', observacao: 'Menos broncoespasmo que atenolol. Iniciar dose baixa em ICC.' },

  // ────────────────────────────────────────────────────────────────────
  // METABÓLICO (12 antidiabéticos + 8 hormônios/corticoides = 20)
  // ────────────────────────────────────────────────────────────────────
  { id: 'glibenclamida-daonil', nomeComercial: 'Daonil (Glibenclamida)', principioAtivo: 'Glibenclamida', apresentacao: 'Comprimidos 5 mg', classeTerapeutica: 'Antidiabético sulfonilureia 2ª geração', laboratorio: 'Sanofi', categoria: 'metabolico', indicacaoResumida: 'Diabetes tipo 2 não controlado com metformina + dieta.', bularioUrl: anvisa('Daonil'), tarja: 'vermelha', observacao: 'Hipoglicemia prolongada em idoso + IRC. Evitar TFG <30.' },
  { id: 'glimepirida-amaryl', nomeComercial: 'Amaryl (Glimepirida)', principioAtivo: 'Glimepirida', apresentacao: 'Comprimidos 1, 2, 3, 4, 6 mg', classeTerapeutica: 'Antidiabético sulfonilureia 3ª geração', laboratorio: 'Sanofi', categoria: 'metabolico', indicacaoResumida: 'Diabetes tipo 2 (monoterapia ou combinada).', bularioUrl: anvisa('Amaryl'), tarja: 'vermelha', observacao: 'Menor risco hipoglicemia que glibenclamida.' },
  { id: 'gliclazida-diamicron', nomeComercial: 'Diamicron MR (Gliclazida)', principioAtivo: 'Gliclazida (liberação modificada)', apresentacao: 'Comprimidos 30, 60 mg MR', classeTerapeutica: 'Antidiabético sulfonilureia', laboratorio: 'Servier', categoria: 'metabolico', indicacaoResumida: 'Diabetes tipo 2 (preferida em idoso pela meia-vida e menor hipo).', bularioUrl: anvisa('Diamicron'), tarja: 'vermelha' },
  { id: 'insulina-nph-humulin-n', nomeComercial: 'Humulin N (Insulina NPH)', principioAtivo: 'Insulina Humana NPH', apresentacao: 'Frasco 100 UI/mL · Refil 3mL · Caneta', classeTerapeutica: 'Insulina ação intermediária', laboratorio: 'Lilly / Novo Nordisk', categoria: 'metabolico', indicacaoResumida: 'Diabetes tipo 1 e tipo 2 (basal). Esquema 2x/dia ou bedtime.', bularioUrl: anvisa('Humulin'), tarja: 'vermelha', observacao: 'Homogeneizar antes de aplicar (suspensão). Pico em 4-10h.' },
  { id: 'insulina-regular-humulin-r', nomeComercial: 'Humulin R (Insulina Regular)', principioAtivo: 'Insulina Humana Regular', apresentacao: 'Frasco 100 UI/mL · Refil 3mL · Caneta', classeTerapeutica: 'Insulina ação rápida (não-análogo)', laboratorio: 'Lilly / Novo Nordisk', categoria: 'metabolico', indicacaoResumida: 'Cetoacidose diabética IV, controle glicêmico pós-prandial.', bularioUrl: anvisa('Humulin'), tarja: 'vermelha', observacao: 'Aplicar 30min antes da refeição. Pico em 2-4h.' },
  { id: 'insulina-glargina-lantus', nomeComercial: 'Lantus (Insulina Glargina)', principioAtivo: 'Insulina Glargina', apresentacao: 'Frasco 100 UI/mL · Refil 3mL · Caneta SoloStar', classeTerapeutica: 'Insulina análoga ação longa (basal)', laboratorio: 'Sanofi', categoria: 'metabolico', indicacaoResumida: 'Insulinização basal DM1 e DM2 (1x/dia).', bularioUrl: anvisa('Lantus'), tarja: 'vermelha', observacao: 'Sem pico definido. NÃO misturar com outras insulinas.' },
  { id: 'insulina-lispro-humalog', nomeComercial: 'Humalog (Insulina Lispro)', principioAtivo: 'Insulina Lispro', apresentacao: 'Frasco · Refil · Caneta KwikPen', classeTerapeutica: 'Insulina análoga ultra-rápida (prandial)', laboratorio: 'Lilly', categoria: 'metabolico', indicacaoResumida: 'Controle glicêmico pós-prandial (5-15min antes refeição).', bularioUrl: anvisa('Humalog'), tarja: 'vermelha' },
  { id: 'dapagliflozina-forxiga', nomeComercial: 'Forxiga (Dapagliflozina)', principioAtivo: 'Dapagliflozina', apresentacao: 'Comprimidos 5, 10 mg', classeTerapeutica: 'Antidiabético iSGLT2 (inibidor cotransportador sódio-glicose 2)', laboratorio: 'AstraZeneca', categoria: 'metabolico', indicacaoResumida: 'DM2, ICC com FE reduzida, DRC com proteinúria.', bularioUrl: anvisa('Forxiga'), tarja: 'vermelha', observacao: 'Renoprotetor. Cetoacidose euglicêmica rara. ITU+candidíase genital.' },
  { id: 'empagliflozina-jardiance', nomeComercial: 'Jardiance (Empagliflozina)', principioAtivo: 'Empagliflozina', apresentacao: 'Comprimidos 10, 25 mg', classeTerapeutica: 'Antidiabético iSGLT2', laboratorio: 'Boehringer Ingelheim / Lilly', categoria: 'metabolico', indicacaoResumida: 'DM2, ICC (FE reduzida e preservada), DRC.', bularioUrl: anvisa('Jardiance'), tarja: 'vermelha', observacao: 'Único iSGLT2 com benefício em ICC FE preservada.' },
  { id: 'linagliptina-trajenta', nomeComercial: 'Trajenta (Linagliptina)', principioAtivo: 'Linagliptina', apresentacao: 'Comprimidos 5 mg', classeTerapeutica: 'Antidiabético iDPP4 (inibidor dipeptidil peptidase 4)', laboratorio: 'Boehringer Ingelheim / Lilly', categoria: 'metabolico', indicacaoResumida: 'DM2 monoterapia ou combinada (segurança CV neutra).', bularioUrl: anvisa('Trajenta'), tarja: 'vermelha', observacao: 'NÃO precisa ajuste DRC (eliminação biliar). Pancreatite raro.' },
  { id: 'sitagliptina-januvia', nomeComercial: 'Januvia (Sitagliptina)', principioAtivo: 'Sitagliptina', apresentacao: 'Comprimidos 25, 50, 100 mg', classeTerapeutica: 'Antidiabético iDPP4', laboratorio: 'MSD', categoria: 'metabolico', indicacaoResumida: 'DM2 monoterapia ou combinada com metformina/insulina.', bularioUrl: anvisa('Januvia'), tarja: 'vermelha', observacao: 'Ajuste DRC: TFG <50 reduzir dose.' },
  { id: 'acarbose-glucobay', nomeComercial: 'Glucobay (Acarbose)', principioAtivo: 'Acarbose', apresentacao: 'Comprimidos 50, 100 mg', classeTerapeutica: 'Antidiabético inibidor alfa-glicosidase', laboratorio: 'Bayer', categoria: 'metabolico', indicacaoResumida: 'DM2 (controle glicemia pós-prandial).', bularioUrl: anvisa('Glucobay'), tarja: 'vermelha', observacao: 'Flatulência + diarreia (efeito local intestinal). Tomar no início da refeição.' },
  { id: 'prednisona-meticorten', nomeComercial: 'Meticorten (Prednisona)', principioAtivo: 'Prednisona', apresentacao: 'Comprimidos 5, 20 mg', classeTerapeutica: 'Corticoide sistêmico (glicocorticoide)', laboratorio: 'MSD', categoria: 'metabolico', indicacaoResumida: 'Doenças inflamatórias, autoimunes, alergias, crise asma, transplante.', bularioUrl: anvisa('Meticorten'), tarja: 'vermelha', observacao: 'Síndrome de Cushing, osteoporose, hiperglicemia, HAS, supressão adrenal. Desmame se uso >2 semanas.' },
  { id: 'prednisolona-prelone', nomeComercial: 'Prelone (Prednisolona)', principioAtivo: 'Prednisolona', apresentacao: 'Comprimidos 5, 20 mg · Solução oral 3 mg/mL', classeTerapeutica: 'Corticoide sistêmico (forma ativa)', laboratorio: 'Sanofi', categoria: 'metabolico', indicacaoResumida: 'Igual prednisona (preferida em hepatopata — não precisa ativação hepática).', bularioUrl: anvisa('Prelone'), tarja: 'vermelha', observacao: 'Mesmas advertências corticoide sistêmico.' },
  { id: 'dexametasona-decadron', nomeComercial: 'Decadron (Dexametasona)', principioAtivo: 'Dexametasona', apresentacao: 'Comprimidos 0.5, 0.75, 4 mg · Elixir · Ampola IV/IM', classeTerapeutica: 'Corticoide sistêmico potência alta', laboratorio: 'Aché', categoria: 'metabolico', indicacaoResumida: 'Edema cerebral, crise anti-emética (quimio), COVID grave, doenças autoimunes graves.', bularioUrl: anvisa('Decadron'), tarja: 'vermelha', observacao: '~25x mais potente que hidrocortisona. Sem ação mineralocorticoide.' },
  { id: 'hidrocortisona-solu-cortef', nomeComercial: 'Solu-Cortef (Hidrocortisona)', principioAtivo: 'Hidrocortisona Succinato Sódico', apresentacao: 'Frasco-ampola 100, 500 mg IV', classeTerapeutica: 'Corticoide sistêmico (cortisol exógeno)', laboratorio: 'Pfizer', categoria: 'metabolico', indicacaoResumida: 'Insuficiência adrenal aguda, choque séptico refratário, edema laríngeo.', bularioUrl: anvisa('Solu-Cortef'), tarja: 'vermelha' },
  { id: 'metilprednisolona-solu-medrol', nomeComercial: 'Solu-Medrol (Metilprednisolona)', principioAtivo: 'Metilprednisolona Succinato Sódico', apresentacao: 'Frasco-ampola 40, 125, 500 mg IV', classeTerapeutica: 'Corticoide sistêmico potência intermediária', laboratorio: 'Pfizer', categoria: 'metabolico', indicacaoResumida: 'Pulsoterapia (vasculites, rejeição transplante, SCA-IAM), broncoespasmo grave.', bularioUrl: anvisa('Solu-Medrol'), tarja: 'vermelha' },
  { id: 'betametasona-celestone', nomeComercial: 'Celestone (Betametasona)', principioAtivo: 'Betametasona', apresentacao: 'Comprimidos 0.5, 2 mg · Elixir · Ampola IM/IV', classeTerapeutica: 'Corticoide sistêmico potência alta', laboratorio: 'MSD', categoria: 'metabolico', indicacaoResumida: 'Inflamação, alergia, doenças reumatológicas, maturação pulmonar fetal.', bularioUrl: anvisa('Celestone'), tarja: 'vermelha' },
  { id: 'tiamazol-tapazol', nomeComercial: 'Tapazol (Tiamazol)', principioAtivo: 'Tiamazol (Metimazol)', apresentacao: 'Comprimidos 5, 10 mg', classeTerapeutica: 'Antitireoidiano de síntese', laboratorio: 'Sanofi', categoria: 'metabolico', indicacaoResumida: 'Hipertireoidismo (Doença de Graves), preparação pré-cirúrgica/I131.', bularioUrl: anvisa('Tapazol'), tarja: 'vermelha', observacao: 'Agranulocitose rara mas grave. Hepatotoxicidade. Teratogênico 1º trimestre.' },

  // ────────────────────────────────────────────────────────────────────
  // GASTROINTESTINAL (10 — IBPs + anti-eméticos + antidiarreicos)
  // ────────────────────────────────────────────────────────────────────
  { id: 'esomeprazol-nexium', nomeComercial: 'Nexium (Esomeprazol)', principioAtivo: 'Esomeprazol Magnésio', apresentacao: 'Comprimidos 20, 40 mg · Sachê granulado', classeTerapeutica: 'Inibidor bomba de prótons (IBP)', laboratorio: 'AstraZeneca', categoria: 'gastrointestinal', indicacaoResumida: 'DRGE refratária, esofagite erosiva, Zollinger-Ellison, H. pylori.', bularioUrl: anvisa('Nexium'), tarja: 'branca', observacao: 'Mesmas observações IBP crônico (hipomag + B12 + DRC + osteoporose).' },
  { id: 'pantoprazol-pantozol', nomeComercial: 'Pantozol (Pantoprazol)', principioAtivo: 'Pantoprazol Sódico', apresentacao: 'Comprimidos 20, 40 mg · Ampola IV', classeTerapeutica: 'Inibidor bomba de prótons (IBP)', laboratorio: 'Takeda', categoria: 'gastrointestinal', indicacaoResumida: 'DRGE, úlcera péptica, profilaxia úlcera de estresse (UTI).', bularioUrl: anvisa('Pantozol'), tarja: 'branca', observacao: 'Preferido quando paciente em clopidogrel (menos interação CYP2C19).' },
  { id: 'lansoprazol-ogastro', nomeComercial: 'Ogastro (Lansoprazol)', principioAtivo: 'Lansoprazol', apresentacao: 'Cápsulas 15, 30 mg', classeTerapeutica: 'Inibidor bomba de prótons (IBP)', laboratorio: 'Takeda', categoria: 'gastrointestinal', indicacaoResumida: 'DRGE, úlcera péptica, H. pylori (combinação).', bularioUrl: anvisa('Ogastro'), tarja: 'branca' },
  // [V1.9.467-C] Antak (Ranitidina) removido — descontinuado mercado mundial (NDMA 2019-20)
  // + portal ANVISA retorna página branca. Famox (Famotidina) é o substituto clínico padrão.
  { id: 'famotidina-famox', nomeComercial: 'Famox (Famotidina)', principioAtivo: 'Famotidina', apresentacao: 'Comprimidos 20, 40 mg · Ampola IV', classeTerapeutica: 'Anti-H2', laboratorio: 'EMS / Genéricos', categoria: 'gastrointestinal', indicacaoResumida: 'DRGE, dispepsia, úlcera péptica (substituiu ranitidina pós-NDMA).', bularioUrl: anvisa('Famox'), tarja: 'branca' },
  { id: 'ondansetrona-zofran', nomeComercial: 'Zofran (Ondansetrona)', principioAtivo: 'Cloridrato de Ondansetrona', apresentacao: 'Comprimidos 4, 8 mg · Solução oral · Ampola IV/IM', classeTerapeutica: 'Anti-emético antagonista 5-HT3', laboratorio: 'GSK', categoria: 'gastrointestinal', indicacaoResumida: 'Náusea/vômito por quimioterapia, radioterapia, pós-operatório, hiperêmese gravídica.', bularioUrl: anvisa('Zofran'), tarja: 'vermelha', observacao: 'Prolonga QT. Cautela cardiopata. Constipação efeito comum.' },
  { id: 'metoclopramida-plasil', nomeComercial: 'Plasil (Metoclopramida)', principioAtivo: 'Cloridrato de Metoclopramida', apresentacao: 'Comprimidos 10 mg · Gotas 4 mg/mL · Ampola IV/IM', classeTerapeutica: 'Anti-emético procinético (antagonista D2)', laboratorio: 'Sanofi', categoria: 'gastrointestinal', indicacaoResumida: 'Náusea, vômito, gastroparesia diabética, refluxo gastroesofágico.', bularioUrl: anvisa('Plasil'), tarja: 'vermelha', observacao: 'Risco distonia aguda + síndrome neuroléptica + discinesia tardia (uso >12 semanas).' },
  { id: 'domperidona-motilium', nomeComercial: 'Motilium (Domperidona)', principioAtivo: 'Domperidona', apresentacao: 'Comprimidos 10 mg · Suspensão oral', classeTerapeutica: 'Anti-emético procinético (antagonista D2 periférico)', laboratorio: 'Janssen', categoria: 'gastrointestinal', indicacaoResumida: 'Dispepsia funcional, náusea/vômito não associado a quimio, gastroparesia.', bularioUrl: anvisa('Motilium'), tarja: 'vermelha', observacao: 'Prolonga QT. Não atravessa BHE (menos efeitos extrapiramidais que plasil).' },
  { id: 'bromoprida-plamet', nomeComercial: 'Plamet (Bromoprida)', principioAtivo: 'Bromoprida', apresentacao: 'Comprimidos 10 mg · Gotas 4 mg/mL · Ampola IV/IM', classeTerapeutica: 'Anti-emético procinético', laboratorio: 'EMS / Sanofi', categoria: 'gastrointestinal', indicacaoResumida: 'Náusea, vômito, dispepsia, refluxo.', bularioUrl: anvisa('Plamet'), tarja: 'branca' },
  { id: 'loperamida-imosec', nomeComercial: 'Imosec (Loperamida)', principioAtivo: 'Cloridrato de Loperamida', apresentacao: 'Cápsulas 2 mg · Comprimidos 2 mg', classeTerapeutica: 'Antidiarreico (opioide periférico)', laboratorio: 'Janssen', categoria: 'gastrointestinal', indicacaoResumida: 'Diarreia aguda não-infecciosa, redução débito ileostomia.', bularioUrl: anvisa('Imosec'), tarja: 'branca', observacao: 'NÃO usar em colite C. difficile / diarreia com sangue / febre. Dose alta → arritmia cardíaca.' },

  // ────────────────────────────────────────────────────────────────────
  // EXTRAS — antipsicóticos + antidepressivos extras + anti-histamínicos (10)
  // ────────────────────────────────────────────────────────────────────
  { id: 'olanzapina-zyprexa', nomeComercial: 'Zyprexa (Olanzapina)', principioAtivo: 'Olanzapina', apresentacao: 'Comprimidos 2.5, 5, 10 mg · Sublingual Zydis', classeTerapeutica: 'Antipsicótico atípico', laboratorio: 'Lilly', categoria: 'psicotropico', indicacaoResumida: 'Esquizofrenia, mania bipolar, depressão bipolar (combinação fluoxetina).', bularioUrl: anvisa('Zyprexa'), tarja: 'vermelha', observacao: 'Ganho de peso + síndrome metabólica + diabetes. Monitorar glicemia.' },
  { id: 'quetiapina-seroquel', nomeComercial: 'Seroquel (Quetiapina)', principioAtivo: 'Fumarato de Quetiapina', apresentacao: 'Comprimidos 25, 50, 100, 200, 300 mg (IR/XR)', classeTerapeutica: 'Antipsicótico atípico', laboratorio: 'AstraZeneca', categoria: 'psicotropico', indicacaoResumida: 'Esquizofrenia, mania/depressão bipolar, depressão maior (adjuvante).', bularioUrl: anvisa('Seroquel'), tarja: 'vermelha', observacao: 'Sedação + hipotensão ortostática. Cautela idoso (queda).' },
  { id: 'aripiprazol-abilify', nomeComercial: 'Abilify (Aripiprazol)', principioAtivo: 'Aripiprazol', apresentacao: 'Comprimidos 10, 15, 20, 30 mg', classeTerapeutica: 'Antipsicótico atípico (agonista parcial D2/5-HT1A)', laboratorio: 'Otsuka / BMS', categoria: 'psicotropico', indicacaoResumida: 'Esquizofrenia, mania bipolar, depressão maior (adjuvante), irritabilidade autismo.', bularioUrl: anvisa('Abilify'), tarja: 'vermelha', observacao: 'Menor ganho peso que olanzapina/quetiapina. Risco impulso (jogo, compras).' },
  { id: 'paroxetina-aropax', nomeComercial: 'Aropax (Paroxetina)', principioAtivo: 'Cloridrato de Paroxetina', apresentacao: 'Comprimidos 10, 20, 25 mg (CR)', classeTerapeutica: 'Antidepressivo ISRS', laboratorio: 'GSK', categoria: 'psicotropico', indicacaoResumida: 'Depressão maior, TAG, TOC, pânico, TEPT, fobia social, TDPM.', bularioUrl: anvisa('Aropax'), tarja: 'vermelha', observacao: 'Síndrome retirada intensa (titular saída). Categoria D gestação.' },
  { id: 'citalopram-cipramil', nomeComercial: 'Cipramil (Citalopram)', principioAtivo: 'Bromidrato de Citalopram', apresentacao: 'Comprimidos 20, 40 mg', classeTerapeutica: 'Antidepressivo ISRS', laboratorio: 'Lundbeck', categoria: 'psicotropico', indicacaoResumida: 'Depressão maior, pânico.', bularioUrl: anvisa('Cipramil'), tarja: 'vermelha', observacao: 'Dose máxima 40mg (20mg em idoso/CYP2C19 lento) — prolonga QT em dose alta.' },
  { id: 'duloxetina-cymbalta', nomeComercial: 'Cymbalta (Duloxetina)', principioAtivo: 'Cloridrato de Duloxetina', apresentacao: 'Cápsulas 30, 60 mg', classeTerapeutica: 'Antidepressivo dual IRSN', laboratorio: 'Lilly', categoria: 'psicotropico', indicacaoResumida: 'Depressão maior, TAG, dor neuropática diabética, fibromialgia, dor crônica.', bularioUrl: anvisa('Cymbalta'), tarja: 'vermelha', observacao: 'Hepatotoxicidade rara. Hipertensão dose-dependente.' },
  { id: 'loratadina-claritin', nomeComercial: 'Claritin (Loratadina)', principioAtivo: 'Loratadina', apresentacao: 'Comprimidos 10 mg · Xarope 1 mg/mL', classeTerapeutica: 'Anti-histamínico H1 2ª geração (não-sedante)', laboratorio: 'MSD', categoria: 'outros', indicacaoResumida: 'Rinite alérgica, urticária, prurido.', bularioUrl: anvisa('Claritin'), tarja: 'branca' },
  { id: 'desloratadina-desalex', nomeComercial: 'Desalex (Desloratadina)', principioAtivo: 'Desloratadina', apresentacao: 'Comprimidos 5 mg · Xarope 0.5 mg/mL', classeTerapeutica: 'Anti-histamínico H1 3ª geração', laboratorio: 'MSD', categoria: 'outros', indicacaoResumida: 'Rinite alérgica, urticária crônica.', bularioUrl: anvisa('Desalex'), tarja: 'branca' },
  { id: 'cetirizina-zyrtec', nomeComercial: 'Zyrtec (Cetirizina)', principioAtivo: 'Dicloridrato de Cetirizina', apresentacao: 'Comprimidos 10 mg · Solução oral · Gotas', classeTerapeutica: 'Anti-histamínico H1 2ª geração', laboratorio: 'UCB Pharma', categoria: 'outros', indicacaoResumida: 'Rinite alérgica, urticária, conjuntivite alérgica.', bularioUrl: anvisa('Zyrtec'), tarja: 'branca', observacao: 'Levemente sedante (mais que loratadina).' },
  { id: 'fexofenadina-allegra', nomeComercial: 'Allegra (Fexofenadina)', principioAtivo: 'Cloridrato de Fexofenadina', apresentacao: 'Comprimidos 60, 120, 180 mg · Suspensão pediátrica', classeTerapeutica: 'Anti-histamínico H1 2ª geração (não-sedante)', laboratorio: 'Sanofi', categoria: 'outros', indicacaoResumida: 'Rinite alérgica sazonal/perene, urticária crônica idiopática.', bularioUrl: anvisa('Allegra'), tarja: 'branca' },
]

/**
 * Lista de categorias disponíveis para UI (filtro dropdown).
 * V1.9.467 — 4 novas categorias (antibiotico + cardiovascular + metabolico + gastrointestinal).
 */
export const BULARIO_CATEGORIAS: Array<{ value: BularioCategoria | 'all'; label: string; count?: number }> = [
  { value: 'all', label: 'Todas categorias' },
  { value: 'cannabis', label: '🌿 Cannabis medicinal' },
  { value: 'anticonvulsivante', label: '⚡ Anti-convulsivantes' },
  { value: 'psicotropico', label: '🧠 Psicotrópicos' },
  { value: 'analgesico', label: '💊 Analgésicos / Anti-inflamatórios' },
  { value: 'antibiotico', label: '🦠 Antimicrobianos (antibióticos + antifúngicos)' },
  { value: 'cardiovascular', label: '❤️ Cardiovascular (anticoag, antiarrítmico, estatina)' },
  { value: 'metabolico', label: '🩸 Metabólico (antidiabéticos + corticoides + hormônios)' },
  { value: 'gastrointestinal', label: '🍃 Gastrointestinal (IBP, anti-eméticos)' },
  { value: 'nefro', label: '🫘 Nefro / Renal' },
  { value: 'outros', label: '📋 Outros' },
]
