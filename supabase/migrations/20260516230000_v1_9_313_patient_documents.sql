-- =====================================================
-- V1.9.313 (16/05/2026) — Patient Documents ("Meus Exames")
-- =====================================================
-- Paciente sobe exames antigos (laudo, ressonância, EEG, receita anterior, etc.)
-- pra ter histórico digital + opcionalmente compartilhar com médico vinculado.
--
-- Decisões arquiteturais:
-- 1. Bucket separado `patient_documents` (não reusar `documents` que é Library acadêmica)
-- 2. Tabela `patient_documents` com metadata rica (categoria + B-lite consent V1.9.311 pattern)
-- 3. RLS: paciente CRUD own; profissional vinculado via appointments OR shared_with_professional=true
-- 4. Default `shared_with_professional = false` — consent explícito (alinhado V1.9.311 NFT)
-- 5. Limite 20MB/arquivo, 5 mime types (PDF + 4 imagens médicas comuns)
--
-- Padrão recolocável pra futuros tipos de upload paciente (audio?, video?, formulários?).
-- =====================================================

-- ============================================================================
-- 1. Tabela patient_documents (metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL UNIQUE,             -- 'patient_documents/{patient_id}/{ts}_{filename}.{ext}'
  original_name text NOT NULL,                -- nome original que paciente subiu
  mime_type text,                             -- 'application/pdf' | 'image/jpeg' | etc
  size_bytes bigint,
  category text NOT NULL DEFAULT 'outros',    -- laudo|imagem|relatorio|receita_antiga|outros
  description text,                           -- nota livre do paciente
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  -- B-lite consent pattern (alinhado V1.9.311 NFT consent)
  shared_with_professional boolean NOT NULL DEFAULT false,
  shared_at timestamptz,
  shared_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT category_valid CHECK (category IN ('laudo','imagem','relatorio','receita_antiga','outros'))
);

COMMENT ON TABLE public.patient_documents IS
  'V1.9.313: documentos médicos que o PACIENTE sobe (exames antigos, laudos, ressonância, EEG). Distingue de `documents` (Library acadêmica curada por médicos).';

COMMENT ON COLUMN public.patient_documents.shared_with_professional IS
  'V1.9.313 + V1.9.311 pattern: paciente decide peça-a-peça se libera pro profissional. Default false = consent explícito.';

-- Index pra UI queries (listar por paciente, mais recente primeiro)
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient
  ON public.patient_documents (patient_id, uploaded_at DESC);

-- Index parcial pra ProfessionalPatientDocuments futuro (V1.9.314)
CREATE INDEX IF NOT EXISTS idx_patient_documents_shared
  ON public.patient_documents (patient_id, uploaded_at DESC)
  WHERE shared_with_professional = true;

-- ============================================================================
-- 2. Bucket storage patient_documents (privado, 20MB, mime restrito)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient_documents',
  'patient_documents',
  false,
  20971520,  -- 20MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 3. RLS — tabela patient_documents
-- ============================================================================
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- Paciente: CRUD completo nos próprios
DROP POLICY IF EXISTS "Patient CRUD own documents" ON public.patient_documents;
CREATE POLICY "Patient CRUD own documents"
  ON public.patient_documents
  FOR ALL
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Profissional: SELECT apenas dos pacientes vinculados via appointments
-- E apenas se paciente liberou (shared_with_professional = true)
DROP POLICY IF EXISTS "Professional reads patient-shared documents" ON public.patient_documents;
CREATE POLICY "Professional reads patient-shared documents"
  ON public.patient_documents
  FOR SELECT
  USING (
    shared_with_professional = true
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patient_documents.patient_id
        AND a.professional_id = auth.uid()
    )
  );

-- Admin: SELECT all (back office padrão indústria — alinhado decisão Opção A V1.9.311)
DROP POLICY IF EXISTS "Admin reads all patient documents" ON public.patient_documents;
CREATE POLICY "Admin reads all patient documents"
  ON public.patient_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 4. RLS — storage.objects pro bucket patient_documents
-- ============================================================================

-- Paciente: upload na própria pasta (foldername[1] = auth.uid())
DROP POLICY IF EXISTS "patient_docs_patient_upload" ON storage.objects;
CREATE POLICY "patient_docs_patient_upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'patient_documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Paciente: SELECT/UPDATE/DELETE na própria pasta
DROP POLICY IF EXISTS "patient_docs_patient_crud" ON storage.objects;
CREATE POLICY "patient_docs_patient_crud"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'patient_documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Profissional: SELECT se paciente liberou + médico vinculado via appointments
-- JOIN via patient_documents.file_path = storage.objects.name
DROP POLICY IF EXISTS "patient_docs_professional_read_shared" ON storage.objects;
CREATE POLICY "patient_docs_professional_read_shared"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'patient_documents'
    AND EXISTS (
      SELECT 1
      FROM public.patient_documents pd
      JOIN public.appointments a ON a.patient_id = pd.patient_id
      WHERE pd.file_path = storage.objects.name
        AND pd.shared_with_professional = true
        AND a.professional_id = auth.uid()
    )
  );

-- Admin: SELECT all (back office)
DROP POLICY IF EXISTS "patient_docs_admin_read" ON storage.objects;
CREATE POLICY "patient_docs_admin_read"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'patient_documents'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
