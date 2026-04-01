-- =====================================================
-- FIX: Storage Bucket Ownership Policies
-- Ensures users can only access their OWN files
-- (files stored under their user_id folder)
-- =====================================================

-- 1. Drop existing overly permissive policies for 'documents' bucket
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

-- 2. Drop existing overly permissive policies for 'chat-audio' bucket
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de áudios" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem ler seus próprios áudios" ON storage.objects;

-- 3. Recreate 'documents' policies with ownership check (user_id folder)
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Recreate 'chat-audio' policies with ownership check
CREATE POLICY "Users can upload own chat audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-audio'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can listen own chat audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-audio'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);