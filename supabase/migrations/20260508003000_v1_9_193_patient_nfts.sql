-- V1.9.193 — Galeria de Assinaturas Visuais (NFT lógico clínico)
-- ====================================================================
-- Sem blockchain externa. Cadeia de confiança via ICP-Brasil PKCS#7
-- (signature_hash do clinical_report) + SHA-256 da imagem (integridade)
-- + seed determinística (unicidade) + RLS soulbound (não-transferível).
--
-- Conceito: cada relatório clínico finalizado pode gerar UMA assinatura
-- visual única, criptograficamente ancorada ao report ICP-signed.
-- Funciona como "NFT lógico" sem custo de chain pública, sem wallet,
-- sem fricção regulatória, com LGPD compliance nativo.
--
-- Pipeline (FASE 2, separada):
--   report content → LLM extrai emoção/símbolos → prompt FLUX
--   → imagem 512x512 → SHA-256 da imagem → upload bucket nfts
--   → row em patient_nfts criada via Edge Function service_role
--
-- Pra FASE 1 (esta migration): só schema + bucket + RLS.
-- Geração real virá em V1.9.194+ (Edge Function FLUX).

-- ──────────────────────────────────────────────────────────────────
-- 1. TABELA patient_nfts
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.patient_nfts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ⚠️ clinical_reports.id é TEXT (não UUID) — verificado live banco
  report_id       TEXT NOT NULL REFERENCES public.clinical_reports(id) ON DELETE CASCADE,

  -- Visual (cache em 2 resoluções para performance galeria)
  image_url       TEXT NOT NULL,         -- 512x512 PNG (full)
  thumbnail_url   TEXT,                  -- 128x128 WebP (galeria grid)
  image_hash      TEXT NOT NULL,         -- SHA-256 da imagem bytes (integridade)

  -- Cadeia de confiança herdada (snapshot defensivo no momento da geração)
  signature_hash  TEXT,                  -- copiado de clinical_reports.signature_hash
                                          -- (snapshot — não FK pra evitar drift)

  -- Identidade visual longitudinal
  style           TEXT NOT NULL,         -- 'neuro-organic'|'healing-fractals'|...
  emotional_sig   TEXT,                  -- 'reconnection'|'exhaustion'|...
  palette         TEXT[] DEFAULT '{}',   -- ['indigo','amber','cyan']
  symbols         TEXT[] DEFAULT '{}',   -- ['fragmented_moon','warm_threads']

  -- Determinismo + reprodutibilidade
  seed            TEXT NOT NULL,         -- sha256(patient_id::text || report_id)
  prompt          TEXT,                  -- prompt completo enviado ao FLUX
  model           TEXT DEFAULT 'flux-schnell',

  -- Rastreabilidade pipeline (Pedro feedback 08/05)
  -- Permite saber qual versão do pipeline gerou cada peça
  -- Útil pra pesquisa longitudinal: quais prompts/estilos/modelos
  -- engajam mais? Quais correlacionam melhor com biomarcadores?
  generation_version TEXT DEFAULT 'v1_neuro_organic',

  -- Janela peri-event (Pedro feedback 08/05 — conecta com tese Muhdo)
  -- Permite ancorar NFT em eventos clínicos específicos
  -- (T-15 baseline / T0 evento / T+15 follow-up)
  narrative_window JSONB DEFAULT '{}'::jsonb,
  -- Exemplo:
  -- {
  --   "t_minus_15": true,
  --   "t0_event": "antibiotic_course",
  --   "t_plus_15": false,
  --   "event_date": "2026-05-01"
  -- }

  -- Metadata
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata        JSONB DEFAULT '{}'::jsonb,

  -- Garantia: 1 NFT por relatório (evita regerar acidentalmente)
  CONSTRAINT unique_nft_per_report UNIQUE (report_id),

  -- Garantia: image_hash único globalmente (anti-duplicação)
  CONSTRAINT unique_image_hash UNIQUE (image_hash)
);

COMMENT ON TABLE public.patient_nfts IS
  'V1.9.193 — Galeria de Assinaturas Visuais. NFT lógico clínico sem blockchain. Cadeia de confiança via signature_hash do clinical_report ICP-signed + image_hash SHA-256 + seed determinística. Soulbound por RLS.';

COMMENT ON COLUMN public.patient_nfts.signature_hash IS
  'Snapshot defensivo do clinical_reports.signature_hash no momento da geração. Não é FK para evitar drift histórico se o report for migrado/anonimizado.';

COMMENT ON COLUMN public.patient_nfts.seed IS
  'sha256(patient_id::text || report_id). Determinístico — mesmo input gera mesma imagem. Garante unicidade (cada paciente+report tem assinatura única) e reprodutibilidade.';

COMMENT ON COLUMN public.patient_nfts.generation_version IS
  'Versão do pipeline de geração (prompt+modelo+estilo). Permite rastrear qual versão gerou qual peça para pesquisa longitudinal visual futura.';

COMMENT ON COLUMN public.patient_nfts.narrative_window IS
  'Janela peri-event opcional (T-15/T0/T+15) para ancorar NFT em eventos clínicos específicos. Conecta com tese semantic drift longitudinal.';

-- ──────────────────────────────────────────────────────────────────
-- 2. INDEX para paginação eficiente
-- ──────────────────────────────────────────────────────────────────

-- Galeria por paciente (paginação 10/page) ordenada por data
CREATE INDEX IF NOT EXISTS idx_patient_nfts_patient_created
  ON public.patient_nfts (patient_id, created_at DESC);

-- Lookup por report (1:1 mas pode ter joins)
CREATE INDEX IF NOT EXISTS idx_patient_nfts_report
  ON public.patient_nfts (report_id);

-- Pesquisa por estilo (futuro: agrupar por estilo)
CREATE INDEX IF NOT EXISTS idx_patient_nfts_style
  ON public.patient_nfts (style);

-- ──────────────────────────────────────────────────────────────────
-- 3. RLS — soulbound by design (não-transferível, paciente só vê próprios)
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.patient_nfts ENABLE ROW LEVEL SECURITY;

-- Paciente vê próprios NFTs
CREATE POLICY "Patient sees own NFTs"
  ON public.patient_nfts
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Profissional vê NFTs de pacientes que atende (via clinical_reports)
CREATE POLICY "Professional sees patient NFTs via clinical reports"
  ON public.patient_nfts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clinical_reports cr
      WHERE cr.id = patient_nfts.report_id
      AND (cr.professional_id = auth.uid() OR cr.doctor_id = auth.uid())
    )
  );

-- Admin vê tudo (gestão)
CREATE POLICY "Admin sees all NFTs"
  ON public.patient_nfts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT/UPDATE/DELETE bloqueados via RLS (só service_role pode mutar)
-- Geração só via Edge Function com service_role key
-- Imutabilidade pós-geração: NFT nunca muda (mesmo princípio do CFM 2.314)
-- Soulbound: paciente NÃO pode deletar nem transferir

-- ──────────────────────────────────────────────────────────────────
-- 4. STORAGE BUCKET nfts
-- ──────────────────────────────────────────────────────────────────

-- Bucket privado com signed URLs longos (TTL 1 ano)
-- Pattern de imagens médicas/LGPD: nunca public=true
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nfts',
  'nfts',
  false,
  2097152,  -- 2MB max por imagem
  ARRAY['image/png', 'image/webp', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: paciente lê próprios via signed URL
CREATE POLICY "Patient reads own NFT files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'nfts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Estrutura esperada: nfts/<patient_id>/<report_id>.png
--                     nfts/<patient_id>/<report_id>_thumb.webp

-- Profissional lê via clinical_reports
CREATE POLICY "Professional reads patient NFT files via reports"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'nfts'
    AND EXISTS (
      SELECT 1 FROM public.patient_nfts pn
      JOIN public.clinical_reports cr ON cr.id = pn.report_id
      WHERE (storage.foldername(name))[1] = pn.patient_id::text
      AND (cr.professional_id = auth.uid() OR cr.doctor_id = auth.uid())
    )
  );

-- Admin lê tudo
CREATE POLICY "Admin reads all NFT files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'nfts'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ──────────────────────────────────────────────────────────────────
-- 5. SMOKE — verificar que tudo foi criado corretamente
-- ──────────────────────────────────────────────────────────────────

SELECT
  (SELECT count(*) FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'patient_nfts') AS table_exists,
  (SELECT count(*) FROM pg_indexes
   WHERE tablename = 'patient_nfts' AND schemaname = 'public') AS indexes_count,
  (SELECT count(*) FROM pg_policies
   WHERE tablename = 'patient_nfts' AND schemaname = 'public') AS rls_policies_count,
  (SELECT count(*) FROM storage.buckets WHERE id = 'nfts') AS bucket_exists,
  (SELECT count(*) FROM pg_policies
   WHERE tablename = 'objects' AND schemaname = 'storage'
   AND policyname ~* 'NFT') AS storage_policies_count;
