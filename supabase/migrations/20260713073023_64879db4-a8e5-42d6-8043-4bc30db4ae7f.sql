REVOKE EXECUTE ON FUNCTION public.fanout_announcement(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fanout_announcement(uuid) TO service_role;