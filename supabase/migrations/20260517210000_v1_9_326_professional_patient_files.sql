-- V1.9.326 — Médico anexa documentos ao prontuário (Pedro+Ricardo 17/05)
-- Reusa patient_documents (V1.9.313). Migration aditiva, 0 rows hoje.
-- Confirmação Pedro: opção A — paciente vê, não edita docs do médico.

-- 1. Colunas aditivas
ALTER TABLE public.patient_documents
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS uploaded_by_role text CHECK (uploaded_by_role IN ('patient','professional')),
  ADD COLUMN IF NOT EXISTS clinical_note text;

-- 2. Backfill defensivo (0 rows hoje, mas seguro)
UPDATE public.patient_documents
SET uploaded_by = COALESCE(uploaded_by, patient_id),
    uploaded_by_role = COALESCE(uploaded_by_role, 'patient')
WHERE uploaded_by IS NULL OR uploaded_by_role IS NULL;

-- 3. Substituir policy permissiva "Patient CRUD own" por policies separadas
DROP POLICY IF EXISTS "Patient CRUD own documents" ON public.patient_documents;

-- 3a. Paciente: SELECT/INSERT/UPDATE próprios
CREATE POLICY "Patient SELECT own documents"
  ON public.patient_documents FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Patient INSERT own documents"
  ON public.patient_documents FOR INSERT
  WITH CHECK (auth.uid() = patient_id AND uploaded_by_role = 'patient');

CREATE POLICY "Patient UPDATE own non-clinical documents"
  ON public.patient_documents FOR UPDATE
  USING (auth.uid() = patient_id AND uploaded_by_role = 'patient')
  WITH CHECK (auth.uid() = patient_id AND uploaded_by_role = 'patient');

-- 3b. Paciente: DELETE somente se ELE subiu (não pode apagar doc do médico)
CREATE POLICY "Patient DELETE own non-clinical documents"
  ON public.patient_documents FOR DELETE
  USING (auth.uid() = patient_id AND uploaded_by_role = 'patient');

-- 4. Profissional: INSERT/UPDATE/DELETE seus próprios uploads quando vinculado
CREATE POLICY "Professional INSERT documents for linked patient"
  ON public.patient_documents FOR INSERT
  WITH CHECK (
    uploaded_by_role = 'professional'
    AND auth.uid() = uploaded_by
    AND check_professional_patient_link(patient_id)
  );

CREATE POLICY "Professional UPDATE own uploaded documents"
  ON public.patient_documents FOR UPDATE
  USING (
    uploaded_by_role = 'professional'
    AND auth.uid() = uploaded_by
  )
  WITH CHECK (
    uploaded_by_role = 'professional'
    AND auth.uid() = uploaded_by
  );

CREATE POLICY "Professional DELETE own uploaded documents"
  ON public.patient_documents FOR DELETE
  USING (
    uploaded_by_role = 'professional'
    AND auth.uid() = uploaded_by
  );

-- 5. Professional SELECT estender: além de shared, vê o que ele mesmo subiu
DROP POLICY IF EXISTS "Professional reads patient-shared documents" ON public.patient_documents;

CREATE POLICY "Professional reads linked patient documents"
  ON public.patient_documents FOR SELECT
  USING (
    (shared_with_professional = true AND EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.patient_id = patient_documents.patient_id
        AND a.professional_id = auth.uid()
    ))
    OR
    (uploaded_by_role = 'professional' AND auth.uid() = uploaded_by)
    OR
    (uploaded_by_role = 'professional' AND check_professional_patient_link(patient_id))
  );

-- 6. Index pra queries por uploaded_by
CREATE INDEX IF NOT EXISTS idx_patient_documents_uploaded_by
  ON public.patient_documents(uploaded_by);

-- 7. Documentação
COMMENT ON COLUMN public.patient_documents.uploaded_by IS 'V1.9.326 — uuid de quem fez o upload';
COMMENT ON COLUMN public.patient_documents.uploaded_by_role IS 'V1.9.326 — patient|professional. Doc do médico é imutável pro paciente (opção A Pedro 17/05).';
COMMENT ON COLUMN public.patient_documents.clinical_note IS 'V1.9.326 — anotação clínica do médico ao anexar';

-- 8. Bucket storage policies — médico vinculado pode upload/read/delete em pasta do paciente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Professional uploads to linked patient folder'
  ) THEN
    CREATE POLICY "Professional uploads to linked patient folder"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'patient_documents'
        AND check_professional_patient_link(
          ((string_to_array(name, '/'))[1])::uuid
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Professional reads linked patient folder'
  ) THEN
    CREATE POLICY "Professional reads linked patient folder"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'patient_documents'
        AND check_professional_patient_link(
          ((string_to_array(name, '/'))[1])::uuid
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Professional deletes own uploads in patient folder'
  ) THEN
    CREATE POLICY "Professional deletes own uploads in patient folder"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'patient_documents'
        AND owner = auth.uid()
      );
  END IF;
END $$;
