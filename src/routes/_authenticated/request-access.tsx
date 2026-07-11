import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { requestRole, listMyRoleRequests } from "@/lib/api/admin.functions";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
const ROLES: { value: AppRole; label: string; desc: string }[] = [
  { value: "teacher", label: "Teacher", desc: "Publish and manage courses, lessons, and quizzes." },
  { value: "partner", label: "Partner", desc: "Post opportunities and review applications from learners." },
  { value: "moderator", label: "Moderator", desc: "Help keep community discussions and projects healthy." },
];

export const Route = createFileRoute("/_authenticated/request-access")({
  head: () => ({ meta: [{ title: "Request access · SkillBridge Africa" }] }),
  component: RequestAccessPage,
});

function RequestAccessPage() {
  const requestFn = useServerFn(requestRole);
  const listFn = useServerFn(listMyRoleRequests);
  const { data, refetch } = useQuery({ queryKey: ["my-role-requests"], queryFn: () => listFn() });

  const [role, setRole] = useState<AppRole>("teacher");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await requestFn({ data: { role, note: note.trim() || undefined } });
      if ((res as any).alreadyPending) toast.info("You already have a pending request for this role.");
      else toast.success("Request submitted. An admin will review it soon.");
      setNote("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-dvh bg-brand-bg text-brand-navy">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header>
          <h1 className="font-display text-3xl font-bold">Request extra access</h1>
          <p className="mt-2 text-brand-navy/60">Everyone starts as a learner. Apply here if you want to teach, post opportunities, or help moderate the community. If you already have an invite link, <Link to="/dashboard" className="text-brand-orange font-semibold">open it directly</Link> instead.</p>
        </header>

        <form onSubmit={submit} className="rounded-2xl border border-brand-navy/5 bg-white p-5 space-y-4">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-2">Which role?</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`text-left p-3 rounded-xl border transition-colors ${role === r.value ? "border-brand-orange bg-brand-orange/5" : "border-brand-navy/10 hover:border-brand-navy/30"}`}
                >
                  <p className="font-bold">{r.label}</p>
                  <p className="text-xs text-brand-navy/60 mt-1">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-2">Why should we grant this? (optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={1000} placeholder="Tell us about your background, organization, or what you'd like to contribute…" className="w-full px-3 py-2 rounded-xl border border-brand-navy/10 bg-white focus:outline-none focus:border-brand-orange" />
          </label>
          <button type="submit" disabled={submitting} className="px-5 py-3 rounded-full bg-brand-orange text-white font-semibold disabled:opacity-60">
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </form>

        <section>
          <h2 className="font-display text-lg font-bold mb-3">Your requests</h2>
          {(!data || data.requests.length === 0) ? (
            <p className="text-sm text-brand-navy/50">No requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.requests.map((r) => (
                <li key={r.id} className="rounded-xl border border-brand-navy/5 bg-white p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold capitalize">{r.requested_role}</p>
                    <p className="text-xs text-brand-navy/50">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${r.status === "pending" ? "bg-brand-orange/15 text-brand-orange" : r.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
