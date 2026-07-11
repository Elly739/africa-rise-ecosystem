
-- 1. Admin lockdown: only iamellyokello@gmail.com (verified) may hold 'admin'
CREATE OR REPLACE FUNCTION public.enforce_admin_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE user_email text; email_confirmed timestamptz;
BEGIN
  IF NEW.role = 'admin' THEN
    SELECT email, email_confirmed_at INTO user_email, email_confirmed
      FROM auth.users WHERE id = NEW.user_id;
    IF lower(coalesce(user_email, '')) <> 'iamellyokello@gmail.com' OR email_confirmed IS NULL THEN
      RAISE EXCEPTION 'Only iamellyokello@gmail.com may hold the admin role';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_admin_email_trigger ON public.user_roles;
CREATE TRIGGER enforce_admin_email_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_email();

-- Purge any pre-existing admin rows that don't belong to the allowed email
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id NOT IN (
    SELECT id FROM auth.users
    WHERE lower(email) = 'iamellyokello@gmail.com'
      AND email_confirmed_at IS NOT NULL
  );

-- Auto-grant admin on signup / verification for the allowed email
CREATE OR REPLACE FUNCTION public.grant_admin_for_owner_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) = 'iamellyokello@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_owner_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_owner_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_owner_email();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_owner_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_owner_admin
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.grant_admin_for_owner_email();

-- Backfill: grant admin if the owner already exists and is verified
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE lower(email) = 'iamellyokello@gmail.com'
  AND email_confirmed_at IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. role_requests
CREATE TABLE public.role_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role app_role NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_requests TO authenticated;
GRANT ALL ON public.role_requests TO service_role;

ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests" ON public.role_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own requests" ON public.role_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND requested_role IN ('teacher','moderator','partner'));
CREATE POLICY "Admins can view all requests" ON public.role_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update requests" ON public.role_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_role_requests_updated_at
  BEFORE UPDATE ON public.role_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. role_invites
CREATE TABLE public.role_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  role app_role NOT NULL CHECK (role IN ('teacher','moderator','partner')),
  email text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  used_by uuid REFERENCES auth.users(id),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX role_invites_token_idx ON public.role_invites(token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_invites TO authenticated;
GRANT ALL ON public.role_invites TO service_role;

ALTER TABLE public.role_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invites" ON public.role_invites
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create invites" ON public.role_invites
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);
CREATE POLICY "Admins can delete invites" ON public.role_invites
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can look up invites by token" ON public.role_invites
  FOR SELECT TO authenticated USING (true);
