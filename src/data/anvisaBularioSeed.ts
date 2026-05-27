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
 * Helper: gera URL padrão de busca no Bulário Eletrônico ANVISA.
 * Portal aceita query string `?nomeProduto=X`.
 */
const anvisa = (nomeProduto: string): string =>
  `https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=${encodeURIComponent(nomeProduto)}`

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
    categoria: 'outros',
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
    categoria: 'outros',
    indicacaoResumida: 'Hipotireoidismo, supressão TSH em câncer tireoide.',
    bularioUrl: anvisa('Puran'),
    tarja: 'vermelha',
    observacao: 'Janela estreita. Jejum 30-60min. Múltiplas interações absorção.',
  },
]

/**
 * Lista de categorias disponíveis para UI (filtro dropdown).
 */
export const BULARIO_CATEGORIAS: Array<{ value: BularioCategoria | 'all'; label: string; count?: number }> = [
  { value: 'all', label: 'Todas categorias' },
  { value: 'cannabis', label: '🌿 Cannabis medicinal' },
  { value: 'anticonvulsivante', label: '⚡ Anti-convulsivantes' },
  { value: 'psicotropico', label: '🧠 Psicotrópicos' },
  { value: 'analgesico', label: '💊 Analgésicos / Anti-inflamatórios' },
  { value: 'nefro', label: '🫘 Nefro / Cardiovascular' },
  { value: 'outros', label: '📋 Outros' },
]
