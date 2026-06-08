
CREATE POLICY "challenge_files_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'challenge-submissions');
CREATE POLICY "challenge_files_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'challenge-submissions' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "challenge_files_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'challenge-submissions' AND owner = auth.uid());
CREATE POLICY "challenge_files_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'challenge-submissions' AND owner = auth.uid());
