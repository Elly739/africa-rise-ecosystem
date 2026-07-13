
-- Announcements: admin broadcasts fanned out to notifications
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  target_roles app_role[] DEFAULT NULL, -- null = everyone
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed-in can read announcements"
  ON public.announcements FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Only admins can create announcements"
  ON public.announcements FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fan-out helper: create notification rows for the announcement's audience
CREATE OR REPLACE FUNCTION public.fanout_announcement(_announcement_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.announcements%ROWTYPE;
  inserted int;
BEGIN
  SELECT * INTO a FROM public.announcements WHERE id = _announcement_id;
  IF a.id IS NULL THEN RAISE EXCEPTION 'Announcement not found'; END IF;

  IF a.target_roles IS NULL OR array_length(a.target_roles, 1) IS NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, link)
    SELECT p.id, 'announcement', a.title, a.body, a.link FROM public.profiles p;
  ELSE
    INSERT INTO public.notifications(user_id, type, title, body, link)
    SELECT DISTINCT ur.user_id, 'announcement', a.title, a.body, a.link
    FROM public.user_roles ur
    WHERE ur.role = ANY(a.target_roles);
  END IF;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;
