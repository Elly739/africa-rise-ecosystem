import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SiteNav() {
  const [signedIn, setSignedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-brand-bg/85 backdrop-blur-md border-b border-brand-navy/5">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="size-9 bg-brand-orange rounded-xl flex items-center justify-center text-white font-bold">S</div>
          <span className="font-display text-lg font-bold tracking-tight">SkillBridge<span className="text-brand-orange">.</span></span>
        </Link>
        <div className="hidden md:flex gap-6 font-medium text-sm">
          <Link to="/courses" className="text-brand-navy/60 hover:text-brand-navy" activeProps={{ className: "text-brand-navy" }}>Learn</Link>
          <Link to="/careers" className="text-brand-navy/60 hover:text-brand-navy" activeProps={{ className: "text-brand-navy" }}>Careers</Link>
          <Link to="/innovate" className="text-brand-navy/60 hover:text-brand-navy" activeProps={{ className: "text-brand-navy" }}>Innovate</Link>
          <Link to="/community" className="text-brand-navy/60 hover:text-brand-navy" activeProps={{ className: "text-brand-navy" }}>Community</Link>
          {signedIn && <Link to="/mentor" className="text-brand-mint hover:text-brand-mint/80 font-semibold">AI Mentor</Link>}
        </div>
        {signedIn ? (
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-brand-navy">Dashboard</Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
              className="px-5 py-2.5 bg-brand-navy text-white rounded-full text-sm font-semibold hover:bg-brand-navy/90"
            >Sign out</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/auth" search={{ mode: "signin" }} className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-brand-navy">Sign in</Link>
            <Link to="/auth" search={{ mode: "signup" }} className="px-5 py-2.5 bg-brand-navy text-white rounded-full text-sm font-semibold hover:bg-brand-navy/90">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
