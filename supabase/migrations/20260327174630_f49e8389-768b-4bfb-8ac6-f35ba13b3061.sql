
-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-images', 'chat-images', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

-- RLS policy: anyone can view (public bucket)
CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');

-- RLS policy: users can delete their own uploads
CREATE POLICY "Users can delete own chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);
