ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT SELECT ON public.blog_posts TO anon;
GRANT ALL ON public.blog_posts TO service_role;

DROP POLICY IF EXISTS "Admins manage blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Partners write own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Partners update own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Partners delete own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors read own blog posts" ON public.blog_posts;

CREATE POLICY "Admins manage blog posts" ON public.blog_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors read own blog posts" ON public.blog_posts FOR SELECT TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Partners write own blog posts" ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'partner') AND author_id = auth.uid());

CREATE POLICY "Partners update own blog posts" ON public.blog_posts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'partner') AND author_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'partner') AND author_id = auth.uid());

CREATE POLICY "Partners delete own blog posts" ON public.blog_posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'partner') AND author_id = auth.uid());