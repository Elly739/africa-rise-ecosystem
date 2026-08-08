DROP POLICY IF EXISTS "Users manage own project covers" ON storage.objects;
CREATE POLICY "Users manage own project covers" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'project-covers' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'project-covers' AND (storage.foldername(name))[1] = auth.uid()::text);