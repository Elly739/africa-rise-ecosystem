
-- ============ CHALLENGES ============
CREATE TYPE public.challenge_status AS ENUM ('draft','open','judging','closed');

CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 4 AND 140),
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  prize text,
  cover_url text,
  tags text[] NOT NULL DEFAULT '{}',
  status public.challenge_status NOT NULL DEFAULT 'open',
  deadline timestamptz,
  created_by uuid NOT NULL,
  winner_submission_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT SELECT ON public.challenges TO anon;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges_select_all" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "challenges_insert_auth" ON public.challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "challenges_update_owner" ON public.challenges FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "challenges_delete_owner" ON public.challenges FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER challenges_updated_at BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TEAMS ============
CREATE TABLE public.challenge_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  pitch text NOT NULL DEFAULT '',
  looking_for text[] NOT NULL DEFAULT '{}',
  lead_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_teams TO authenticated;
GRANT SELECT ON public.challenge_teams TO anon;
GRANT ALL ON public.challenge_teams TO service_role;
ALTER TABLE public.challenge_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_select_all" ON public.challenge_teams FOR SELECT USING (true);
CREATE POLICY "teams_insert_auth" ON public.challenge_teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = lead_user_id);
CREATE POLICY "teams_update_lead" ON public.challenge_teams FOR UPDATE TO authenticated USING (auth.uid() = lead_user_id) WITH CHECK (auth.uid() = lead_user_id);
CREATE POLICY "teams_delete_lead" ON public.challenge_teams FOR DELETE TO authenticated USING (auth.uid() = lead_user_id);

CREATE TABLE public.challenge_team_members (
  team_id uuid NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_team_members TO authenticated;
GRANT SELECT ON public.challenge_team_members TO anon;
GRANT ALL ON public.challenge_team_members TO service_role;
ALTER TABLE public.challenge_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_all" ON public.challenge_team_members FOR SELECT USING (true);
CREATE POLICY "members_join_self" ON public.challenge_team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_leave_self" ON public.challenge_team_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Auto-add lead as team member
CREATE OR REPLACE FUNCTION public.add_team_lead_as_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.challenge_team_members(team_id, user_id, role) VALUES (NEW.id, NEW.lead_user_id, 'lead')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER team_lead_member AFTER INSERT ON public.challenge_teams FOR EACH ROW EXECUTE FUNCTION public.add_team_lead_as_member();

-- ============ SUBMISSIONS ============
CREATE TABLE public.challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 140),
  description text NOT NULL DEFAULT '',
  demo_url text,
  repo_url text,
  file_url text,
  submitted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, team_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_submissions TO authenticated;
GRANT SELECT ON public.challenge_submissions TO anon;
GRANT ALL ON public.challenge_submissions TO service_role;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_select_all" ON public.challenge_submissions FOR SELECT USING (true);
CREATE POLICY "subs_insert_team" ON public.challenge_submissions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.challenge_team_members m WHERE m.team_id = team_id AND m.user_id = auth.uid()));
CREATE POLICY "subs_update_team" ON public.challenge_submissions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_team_members m WHERE m.team_id = team_id AND m.user_id = auth.uid()));
CREATE POLICY "subs_delete_team" ON public.challenge_submissions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenge_team_members m WHERE m.team_id = team_id AND m.user_id = auth.uid()));
CREATE TRIGGER subs_updated_at BEFORE UPDATE ON public.challenge_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ VOTES ============
CREATE TABLE public.challenge_votes (
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.challenge_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_votes TO authenticated;
GRANT SELECT ON public.challenge_votes TO anon;
GRANT ALL ON public.challenge_votes TO service_role;
ALTER TABLE public.challenge_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_select_all" ON public.challenge_votes FOR SELECT USING (true);
CREATE POLICY "votes_delete_self" ON public.challenge_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Vote eligibility: must have community activity (a discussion or reply)
CREATE OR REPLACE FUNCTION public.has_community_activity(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.discussions WHERE user_id = _user_id)
      OR EXISTS(SELECT 1 FROM public.discussion_replies WHERE user_id = _user_id)
$$;

CREATE POLICY "votes_insert_active" ON public.challenge_votes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_community_activity(auth.uid())
    AND NOT EXISTS (SELECT 1 FROM public.challenge_submissions s
                    JOIN public.challenge_team_members m ON m.team_id = s.team_id
                    WHERE s.id = submission_id AND m.user_id = auth.uid())
  );

-- Notify on vote
CREATE OR REPLACE FUNCTION public.notify_challenge_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sub_title text; ch_slug text; voter_name text; team uuid;
BEGIN
  SELECT s.title, c.slug, s.team_id INTO sub_title, ch_slug, team
    FROM public.challenge_submissions s
    JOIN public.challenges c ON c.id = s.challenge_id
    WHERE s.id = NEW.submission_id;
  SELECT display_name INTO voter_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications(user_id, type, title, body, link)
  SELECT m.user_id, 'challenge_vote', 'New vote on your submission',
         COALESCE(voter_name,'Someone') || ' voted for "' || sub_title || '"',
         '/challenges/' || ch_slug
  FROM public.challenge_team_members m WHERE m.team_id = team AND m.user_id <> NEW.user_id;
  RETURN NEW;
END $$;
CREATE TRIGGER challenge_vote_notify AFTER INSERT ON public.challenge_votes
  FOR EACH ROW EXECUTE FUNCTION public.notify_challenge_vote();

-- Notify on challenge status change
CREATE OR REPLACE FUNCTION public.notify_challenge_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  INSERT INTO public.notifications(user_id, type, title, body, link)
  SELECT DISTINCT m.user_id, 'challenge_status',
         'Challenge "' || NEW.title || '" is now ' || NEW.status,
         'Status update on a challenge you joined',
         '/challenges/' || NEW.slug
  FROM public.challenge_teams t
  JOIN public.challenge_team_members m ON m.team_id = t.id
  WHERE t.challenge_id = NEW.id;
  RETURN NEW;
END $$;
CREATE TRIGGER challenge_status_notify AFTER UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.notify_challenge_status();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_votes;

-- Storage bucket policies (bucket created via tool separately)
