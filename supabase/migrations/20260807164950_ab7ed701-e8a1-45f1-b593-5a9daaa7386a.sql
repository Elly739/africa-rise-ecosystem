-- 1. Widen opportunity types
ALTER TYPE public.opportunity_type ADD VALUE IF NOT EXISTS 'hackathon';
ALTER TYPE public.opportunity_type ADD VALUE IF NOT EXISTS 'fellowship';
ALTER TYPE public.opportunity_type ADD VALUE IF NOT EXISTS 'grant';
ALTER TYPE public.opportunity_type ADD VALUE IF NOT EXISTS 'incubator';

-- notification types used by new features
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'collab_request';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'collab_response';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'talent_message';

-- 2. Profile portfolio + talent opt-in
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS university text,
  ADD COLUMN IF NOT EXISTS study_year text,
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS open_to text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS talent_visible boolean NOT NULL DEFAULT false;

-- 3. Projects looking for collaborators
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS looking_for_collaborators boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS roles_needed text[] NOT NULL DEFAULT '{}';

-- 4. Saved opportunities
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
  user_id uuid NOT NULL,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, opportunity_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_opportunities TO authenticated;
GRANT ALL ON public.saved_opportunities TO service_role;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved opportunities"
  ON public.saved_opportunities FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Collaboration requests
CREATE TABLE IF NOT EXISTS public.collaboration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, requester_id)
);
GRANT SELECT, INSERT, UPDATE ON public.collaboration_requests TO authenticated;
GRANT ALL ON public.collaboration_requests TO service_role;
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requester reads own requests"
  ON public.collaboration_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id);
CREATE POLICY "project owner reads requests"
  ON public.collaboration_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE POLICY "authenticated can request"
  ON public.collaboration_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "project owner updates requests"
  ON public.collaboration_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

CREATE TRIGGER collab_requests_updated_at
  BEFORE UPDATE ON public.collaboration_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_collab_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid; proj_title text; proj_slug text; who text;
BEGIN
  SELECT user_id, title, slug INTO owner_id, proj_title, proj_slug FROM public.projects WHERE id = NEW.project_id;
  IF owner_id IS NULL OR owner_id = NEW.requester_id THEN RETURN NEW; END IF;
  SELECT display_name INTO who FROM public.profiles WHERE id = NEW.requester_id;
  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (owner_id, 'collab_request', 'Someone wants to collaborate',
          COALESCE(who,'A builder') || ' asked to join "' || proj_title || '"',
          '/innovate/' || proj_slug);
  RETURN NEW;
END $$;

CREATE TRIGGER collab_request_notify
  AFTER INSERT ON public.collaboration_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_collab_request();

CREATE OR REPLACE FUNCTION public.notify_collab_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE proj_title text; proj_slug text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT title, slug INTO proj_title, proj_slug FROM public.projects WHERE id = NEW.project_id;
  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (NEW.requester_id, 'collab_response', 'Collaboration request ' || NEW.status,
          'Your request to join "' || proj_title || '" was ' || NEW.status,
          '/innovate/' || proj_slug);
  RETURN NEW;
END $$;

CREATE TRIGGER collab_response_notify
  AFTER UPDATE ON public.collaboration_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_collab_response();

-- 6. Innovation score
CREATE OR REPLACE VIEW public.innovation_scores AS
SELECT
  p.id AS user_id,
  COALESCE(pr.projects, 0)::int          AS projects_count,
  COALESCE(pl.likes, 0)::int             AS likes_received,
  COALESCE(cs.submissions, 0)::int       AS submissions_count,
  COALESCE(ce.certs, 0)::int             AS certificates_count,
  COALESCE(lp.lessons, 0)::int           AS lessons_completed,
  COALESCE(cm.contributions, 0)::int     AS community_contributions,
  (COALESCE(pr.projects,0) * 15
   + COALESCE(pl.likes,0) * 3
   + COALESCE(cs.submissions,0) * 20
   + COALESCE(ce.certs,0) * 10
   + COALESCE(lp.lessons,0) * 2
   + COALESCE(cm.contributions,0) * 2)::int AS score
FROM public.profiles p
LEFT JOIN (SELECT user_id, count(*) projects FROM public.projects GROUP BY 1) pr ON pr.user_id = p.id
LEFT JOIN (SELECT pj.user_id, count(*) likes FROM public.project_likes l JOIN public.projects pj ON pj.id = l.project_id GROUP BY 1) pl ON pl.user_id = p.id
LEFT JOIN (SELECT submitted_by user_id, count(*) submissions FROM public.challenge_submissions GROUP BY 1) cs ON cs.user_id = p.id
LEFT JOIN (SELECT user_id, count(*) certs FROM public.certificates GROUP BY 1) ce ON ce.user_id = p.id
LEFT JOIN (SELECT user_id, count(*) lessons FROM public.lesson_progress GROUP BY 1) lp ON lp.user_id = p.id
LEFT JOIN (
  SELECT user_id, count(*) contributions FROM (
    SELECT user_id FROM public.discussions
    UNION ALL
    SELECT user_id FROM public.discussion_replies
  ) x GROUP BY 1
) cm ON cm.user_id = p.id;

GRANT SELECT ON public.innovation_scores TO anon, authenticated, service_role;

-- 7. Talent directory (partners + admins only, opted-in profiles only)
CREATE OR REPLACE FUNCTION public.search_talent(
  _q text DEFAULT NULL,
  _skill text DEFAULT NULL,
  _open_to text DEFAULT NULL,
  _min_score int DEFAULT 0,
  _limit int DEFAULT 60
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  headline text,
  university text,
  study_year text,
  country text,
  skills text[],
  interests text[],
  open_to text[],
  score int,
  projects_count int
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'partner') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Only partners and admins can browse talent';
  END IF;

  RETURN QUERY
  SELECT p.id, p.display_name, p.avatar_url, p.headline, p.university, p.study_year,
         p.country, p.skills, p.interests, p.open_to,
         s.score, s.projects_count
  FROM public.profiles p
  JOIN public.innovation_scores s ON s.user_id = p.id
  WHERE p.talent_visible = true
    AND (_q IS NULL OR _q = '' OR p.display_name ILIKE '%'||_q||'%' OR COALESCE(p.headline,'') ILIKE '%'||_q||'%' OR COALESCE(p.university,'') ILIKE '%'||_q||'%')
    AND (_skill IS NULL OR _skill = '' OR EXISTS (SELECT 1 FROM unnest(p.skills) sk WHERE sk ILIKE _skill))
    AND (_open_to IS NULL OR _open_to = '' OR _open_to = ANY(p.open_to))
    AND s.score >= COALESCE(_min_score, 0)
  ORDER BY s.score DESC, p.display_name ASC
  LIMIT LEAST(COALESCE(_limit, 60), 200);
END $$;

REVOKE ALL ON FUNCTION public.search_talent(text, text, text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION public.search_talent(text, text, text, int, int) TO authenticated, service_role;