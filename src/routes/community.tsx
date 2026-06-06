import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { listDiscussions, createDiscussion } from "@/lib/api/ecosystem.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const discussionsQuery = queryOptions({
  queryKey: ["discussions"],
  queryFn: () => listDiscussions(),
});

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — SkillBridge Africa" },
      { name: "description", content: "Connect, discuss, and grow with young African builders. Study groups, peer mentorship, and conversations." },
      { property: "og:title", content: "SkillBridge Community" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(discussionsQuery),
  component: CommunityPage,
});

function CommunityPage() {
  const { data: threads } = useSuspenseQuery(discussionsQuery);
  const [signedIn, setSignedIn] = useState(false);
  const [composing, setComposing] = useState(false);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session)); }, []);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy">
      <SiteNav />
      <header className="px-6 pt-16 pb-10 max-w-4xl mx-auto">
        <div className="inline-block px-3 py-1 bg-brand-navy/10 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
          Community
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight">Grow together, not alone.</h1>
        <p className="mt-6 text-lg text-brand-navy/60 max-w-2xl">
          Ask questions, share wins, find study partners. Your peers across Africa are building right now.
        </p>
        <div className="mt-8">
          {signedIn ? (
            <button onClick={() => setComposing((v) => !v)} className="px-6 py-3 bg-brand-orange text-white rounded-full font-bold">
              {composing ? "Cancel" : "+ Start a discussion"}
            </button>
          ) : (
            <Link to="/auth" search={{ mode: "signup" }} className="px-6 py-3 bg-brand-orange text-white rounded-full font-bold">
              Sign in to post
            </Link>
          )}
        </div>
        {composing && <ComposeForm onDone={() => setComposing(false)} />}
      </header>

      <div className="px-6 max-w-4xl mx-auto pb-24 space-y-3">
        {threads.length === 0 ? (
          <p className="py-12 text-center text-brand-navy/50">No discussions yet. Be the first to start one.</p>
        ) : threads.map((t) => (
          <Link
            key={t.id}
            to="/community/$discussionId"
            params={{ discussionId: t.id }}
            className="block bg-white border border-brand-navy/5 rounded-2xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-clay text-brand-navy/70 uppercase font-bold tracking-wider">{t.topic}</span>
              <span className="text-xs text-brand-navy/40">{new Date(t.created_at).toLocaleDateString()}</span>
            </div>
            <h3 className="font-display text-xl font-bold mb-1.5">{t.title}</h3>
            <p className="text-sm text-brand-navy/60 line-clamp-2">{t.body}</p>
          </Link>
        ))}
      </div>
      <SiteFooter />
    </div>
  );
}

function ComposeForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createDiscussion);
  const m = useMutation({
    mutationFn: (vars: { title: string; body: string; topic: string }) => create({ data: vars }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["discussions"] }); toast.success("Posted!"); onDone(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const [form, setForm] = useState({ title: "", body: "", topic: "general" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); m.mutate(form); }} className="mt-6 bg-white border border-brand-navy/5 rounded-2xl p-6 space-y-4">
      <input required minLength={4} placeholder="Discussion title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 font-semibold" />
      <textarea required rows={4} placeholder="What's on your mind?" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-brand-navy/10" />
      <div className="flex items-center gap-3">
        <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="px-3 py-2 rounded-lg border border-brand-navy/10 text-sm">
          <option value="general">General</option><option value="careers">Careers</option><option value="learning">Learning</option><option value="building">Building</option>
        </select>
        <button type="submit" disabled={m.isPending} className="ml-auto px-5 py-2.5 bg-brand-navy text-white rounded-full font-bold text-sm disabled:opacity-60">
          {m.isPending ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
