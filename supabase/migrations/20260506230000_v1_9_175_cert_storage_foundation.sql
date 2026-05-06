-- V1.9.175 — Foundation ICP-Brasil real: storage + colunas medical_certificates
-- =====================================================================
-- Adiciona infra pra cert .pfx REAL (upload + senha cifrada). Coexiste com
-- modo simulação atual (Edge cai em fallback se file_path/encrypted_password
-- ausentes). ZERO regressão: medical_certificates vazia, então nenhuma row
-- existente quebra.
--
-- Camada 0 (irreversível): valida ANTES de mexer em CFM real.

-- 1) Adicionar 3 colunas nullable em medical_certificates
ALTER TABLE public.medical_certificates
  ADD COLUMN IF NOT EXISTS certificate_file_path TEXT,
  ADD COLUMN IF NOT EXISTS encrypted_password    TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_at           TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.medical_certificates.certificate_file_path IS
  'Path do .pfx no bucket certificates (formato: {professional_id}/{cert_id}.pfx). NULL = modo simulação (V1.9.175+).';

COMMENT ON COLUMN public.medical_certificates.encrypted_password IS
  'Senha do .pfx cifrada via _shared/crypto.ts (AES-GCM com ENCRYPTION_KEY). Formato: iv:ciphertext em base64.';

COMMENT ON COLUMN public.medical_certificates.uploaded_at IS
  'Timestamp do upload do .pfx pro Storage (NULL = nunca uploaded, registro só metadados legacy).';

-- 2) Criar bucket private certificates (idempotente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false,
  10485760,  -- 10 MB max (.pfx típico < 100 KB; folga generosa)
  ARRAY['application/x-pkcs12', 'application/pkcs12', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3) RLS policies bucket certificates: dono-only por path-prefix
-- Path convention: {professional_id}/{cert_id}.pfx
DO $$
BEGIN
  -- SELECT (download): só o próprio profissional baixa seu cert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'cert_owner_select'
  ) THEN
    CREATE POLICY "cert_owner_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'certificates'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- INSERT (upload): só pro próprio diretório
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'cert_owner_insert'
  ) THEN
    CREATE POLICY "cert_owner_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'certificates'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- UPDATE: só o dono (renovação)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'cert_owner_update'
  ) THEN
    CREATE POLICY "cert_owner_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'certificates'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'certificates'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- DELETE: só o dono (remover cert revogado)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'cert_owner_delete'
  ) THEN
    CREATE POLICY "cert_owner_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'certificates'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- 4) Index pra lookup rápido em digital-signature Edge
CREATE INDEX IF NOT EXISTS idx_medical_certificates_active_lookup
  ON public.medical_certificates (professional_id, is_active, expires_at)
  WHERE is_active = true;

-- 5) Adicionar 'DigitalSign' implicitamente (ac_provider é text, sem enum)
-- Frontend vai listar 'DigitalSign' no dropdown via V1.9.178.

-- 6) View diagnóstica: certs que upgrade pendente (file_path NULL)
CREATE OR REPLACE VIEW public.v_medical_certificates_status WITH (security_invoker = true) AS
SELECT
  c.id,
  c.professional_id,
  u.name                                      AS professional_name,
  c.certificate_type,
  c.ac_provider,
  c.is_active,
  c.expires_at,
  CASE
    WHEN c.expires_at < NOW()                     THEN 'expired'
    WHEN c.expires_at < NOW() + INTERVAL '30 d'   THEN 'expiring_soon'
    WHEN c.certificate_file_path IS NULL          THEN 'metadata_only'    -- precisa upgrade
    WHEN c.encrypted_password IS NULL             THEN 'no_password'      -- meia-implementação
    ELSE 'real_signing_ready'
  END                                         AS status_real,
  c.uploaded_at,
  c.created_at
FROM public.medical_certificates c
LEFT JOIN public.users u ON u.id = c.professional_id
ORDER BY c.created_at DESC;

COMMENT ON VIEW public.v_medical_certificates_status IS
  'V1.9.175 — diagnóstico estado certs: metadata_only/no_password/real_signing_ready/expired/expiring_soon';

GRANT SELECT ON public.v_medical_certificates_status TO authenticated;
