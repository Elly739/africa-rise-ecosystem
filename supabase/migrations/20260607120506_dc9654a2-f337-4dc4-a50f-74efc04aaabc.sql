
-- Notifications
CREATE TYPE public.notification_type AS ENUM ('project_like','discussion_reply','application_status','system');

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT WITH CHECK (true);

CREATE INDEX notifications_user_created_idx ON public.notifications(user_id, created_at DESC);

-- Trigger: project like → notify project owner
CREATE OR REPLACE FUNCTION public.notify_project_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid; proj_title text; proj_slug text; liker_name text;
BEGIN
  SELECT user_id, title, slug INTO owner_id, proj_title, proj_slug FROM public.projects WHERE id = NEW.project_id;
  IF owner_id IS NULL OR owner_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT display_name INTO liker_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (owner_id, 'project_like', 'Someone liked your project',
          COALESCE(liker_name,'A learner') || ' liked "' || proj_title || '"',
          '/innovate/' || proj_slug);
  RETURN NEW;
END $$;
CREATE TRIGGER project_like_notify AFTER INSERT ON public.project_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_project_like();

-- Trigger: discussion reply → notify discussion owner
CREATE OR REPLACE FUNCTION public.notify_discussion_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid; disc_title text; replier_name text;
BEGIN
  SELECT user_id, title INTO owner_id, disc_title FROM public.discussions WHERE id = NEW.discussion_id;
  IF owner_id IS NULL OR owner_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT display_name INTO replier_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (owner_id, 'discussion_reply', 'New reply in your discussion',
          COALESCE(replier_name,'Someone') || ' replied to "' || disc_title || '"',
          '/community/' || NEW.discussion_id);
  RETURN NEW;
END $$;
CREATE TRIGGER discussion_reply_notify AFTER INSERT ON public.discussion_replies
  FOR EACH ROW EXECUTE FUNCTION public.notify_discussion_reply();

-- Applications table
CREATE TYPE public.application_status AS ENUM ('submitted','under_review','interview','offer','rejected','withdrawn');

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'submitted',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own applications" ON public.applications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: application status change → notify user
CREATE OR REPLACE FUNCTION public.notify_application_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE opp_title text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT title INTO opp_title FROM public.opportunities WHERE id = NEW.opportunity_id;
  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (NEW.user_id, 'application_status',
          'Application update: ' || NEW.status,
          'Your application to "' || COALESCE(opp_title,'an opportunity') || '" is now ' || NEW.status,
          '/careers');
  RETURN NEW;
END $$;
CREATE TRIGGER applications_status_notify AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_status();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
