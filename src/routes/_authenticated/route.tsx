import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { mode: "signin" } });
    }
    // First-run onboarding gate
    if (!location.pathname.startsWith("/welcome")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile && !profile.onboarded_at) {
        throw redirect({ to: "/welcome" });
      }
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
