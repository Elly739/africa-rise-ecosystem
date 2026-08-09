import pioneerLogo from "@/assets/pioneer-logo.png.asset.json";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional().default("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in · Pioneer Africa Hub" },
      { name: "description", content: "Sign in or create your Pioneer Africa Hub account to start learning." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name },
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-brand-bg grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-brand-navy text-white p-12">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={pioneerLogo.url} alt="Pioneer Africa Hub logo" className="size-9 object-contain" />
          <span className="font-display text-lg font-bold tracking-tight">Pioneer Africa Hub</span>
        </Link>
        <div className="space-y-6 max-w-md">
          <h2 className="font-display text-5xl font-bold leading-tight">
            Bridging the gap between <span className="text-brand-orange">learning</span> and opportunity.
          </h2>
          <p className="text-white/60 text-lg">Join a community of young African builders mastering the skills of the new economy.</p>
        </div>
        <div className="text-xs text-white/40 uppercase tracking-widest">© Pioneer Africa Hub</div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={pioneerLogo.url} alt="Pioneer Africa Hub logo" className="size-9 object-contain" />
              <span className="font-display text-lg font-bold tracking-tight">Pioneer Africa Hub</span>
            </Link>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-4xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
            <p className="text-brand-navy/60 text-sm">
              {mode === "signup" ? "Start your learning journey today." : "Sign in to continue learning."}
            </p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 rounded-xl border border-brand-navy/10 bg-white font-semibold flex items-center justify-center gap-3 hover:bg-brand-clay/50 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-brand-navy/10" />
            <span className="text-xs uppercase tracking-wider text-brand-navy/40">or</span>
            <div className="flex-1 h-px bg-brand-navy/10" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-white focus:outline-none focus:border-brand-orange"
                  placeholder="Ada Lovelace"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-white focus:outline-none focus:border-brand-orange"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-2">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-white focus:outline-none focus:border-brand-orange"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-orange text-white rounded-xl font-bold hover:scale-[1.01] transition-transform disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-brand-navy/60 text-center">
            {mode === "signup" ? "Already have an account? " : "New to Pioneer Africa Hub? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="font-bold text-brand-orange hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
          {mode === "signup" && (
            <p className="text-xs text-brand-navy/50 text-center">
              Everyone starts as a learner. Teachers, partners, and moderators can request access from their dashboard after signing in — or use an invite link if you have one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
