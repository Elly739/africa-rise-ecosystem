
-- 1. profiles onboarding fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skill_level text,
  ADD COLUMN IF NOT EXISTS primary_goal text,
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

-- 2. quiz_questions explanation
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS explanation text;

-- 3. user_stats
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak_days integer NOT NULL DEFAULT 0,
  last_active date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_stats TO authenticated, anon;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats readable by all" ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "user updates own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

-- 4. follows
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT ON public.follows TO anon;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows readable by all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "user follows others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "user unfollows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- 5. XP helper
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _amount int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE today date := current_date; cur_last date; cur_streak int;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_stats(user_id, xp, streak_days, last_active)
  VALUES (_user_id, _amount, 1, today)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT last_active, streak_days INTO cur_last, cur_streak FROM public.user_stats WHERE user_id = _user_id;
  IF cur_last IS DISTINCT FROM today THEN
    IF cur_last = today - 1 THEN cur_streak := COALESCE(cur_streak,0) + 1;
    ELSE cur_streak := 1;
    END IF;
  END IF;

  UPDATE public.user_stats SET
    xp = xp + _amount,
    streak_days = cur_streak,
    last_active = today,
    level = greatest(1, 1 + ((xp + _amount) / 100)),
    updated_at = now()
  WHERE user_id = _user_id;
END $$;

-- 6. XP triggers
CREATE OR REPLACE FUNCTION public.xp_on_lesson() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp(NEW.user_id, 10); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_xp_lesson ON public.lesson_progress;
CREATE TRIGGER trg_xp_lesson AFTER INSERT ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.xp_on_lesson();

CREATE OR REPLACE FUNCTION public.xp_on_quiz() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN IF NEW.passed THEN PERFORM public.award_xp(NEW.user_id, 25); END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_xp_quiz ON public.quiz_attempts;
CREATE TRIGGER trg_xp_quiz AFTER INSERT ON public.quiz_attempts FOR EACH ROW EXECUTE FUNCTION public.xp_on_quiz();

CREATE OR REPLACE FUNCTION public.xp_on_project_like() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  SELECT user_id INTO owner_id FROM public.projects WHERE id = NEW.project_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN PERFORM public.award_xp(owner_id, 5); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_xp_project_like ON public.project_likes;
CREATE TRIGGER trg_xp_project_like AFTER INSERT ON public.project_likes FOR EACH ROW EXECUTE FUNCTION public.xp_on_project_like();

CREATE OR REPLACE FUNCTION public.xp_on_reply() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp(NEW.user_id, 3); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_xp_reply ON public.discussion_replies;
CREATE TRIGGER trg_xp_reply AFTER INSERT ON public.discussion_replies FOR EACH ROW EXECUTE FUNCTION public.xp_on_reply();

CREATE OR REPLACE FUNCTION public.xp_on_submission() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp(NEW.submitted_by, 50); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_xp_submission ON public.challenge_submissions;
CREATE TRIGGER trg_xp_submission AFTER INSERT ON public.challenge_submissions FOR EACH ROW EXECUTE FUNCTION public.xp_on_submission();

-- 7. Follow notification
CREATE OR REPLACE FUNCTION public.notify_new_follower() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE follower_name text;
BEGIN
  SELECT display_name INTO follower_name FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (NEW.following_id, 'new_follower', 'New follower',
          COALESCE(follower_name,'Someone') || ' started following you',
          '/u/' || NEW.follower_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_follower ON public.follows;
CREATE TRIGGER trg_notify_follower AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();
