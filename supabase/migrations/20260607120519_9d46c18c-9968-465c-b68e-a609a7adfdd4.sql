
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;

REVOKE EXECUTE ON FUNCTION public.notify_project_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_discussion_reply() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_application_status() FROM PUBLIC, anon, authenticated;
