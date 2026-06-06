import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getDiscussion, replyToDiscussion } from "@/lib/api/ecosystem.functions";
import { supabase } from "@/integrations/supabase/client";

const threadQuery = (id: string) => queryOptions({
  queryKey: ["discussion", id],
  queryFn: () => getDiscussion({ data: { id } }),
});

export const Route = createFileRoute("/community/$discussionId")({
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.discussion.title ?? "Discussion"} — SkillBridge Community` }],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(threadQuery(params.discussionId));
    if (!data) throw notFound();
    return data;
  },
  errorComponent: () => <div className="p-10">Failed to load.</div>,
  notFoundComponent: () => <div className="p-10">Discussion not found.</div>,
  component: ThreadPage,
});

function ThreadPage() {
  const { discussionId } = Route.useParams();
  const { data } = useSuspenseQuery(threadQuery(discussionId));
  const qc = useQueryClient();
  const reply = useServerFn(replyToDiscussion);
  const [signedIn, setSignedIn] = useState(false);
  const [body, setBody] = useState("");
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session)); }, []);

  const m = useMutation({
    mutationFn: () => reply({ data: { discussionId, body } }),
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["discussion", discussionId] }); },
  });

  if (!data) return null;
  const { discussion, replies } = data;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy">
      <SiteNav />
      <div className="px-6 py-12 max-w-3xl mx-auto">
        <Link to="/community" className="text-sm text-brand-navy/60 hover:text-brand-navy">← Community</Link>
        <article className="mt-6 bg-white border border-brand-navy/5 rounded-2xl p-8">
          <div className="text-[10px] uppercase tracking-wider font-bold text-brand-navy/50 mb-2">{discussion.topic}</div>
          <h1 className="font-display text-3xl font-bold mb-3">{discussion.title}</h1>
          <p className="whitespace-pre-wrap text-brand-navy/80">{discussion.body}</p>
          <div className="mt-6 text-xs text-brand-navy/40">{new Date(discussion.created_at).toLocaleString()}</div>
        </article>

        <h2 className="font-display text-xl font-bold mt-10 mb-4">{replies.length} {replies.length === 1 ? "reply" : "replies"}</h2>
        <div className="space-y-3">
          {replies.map((r) => (
            <div key={r.id} className="bg-white border border-brand-navy/5 rounded-2xl p-5">
              <p className="whitespace-pre-wrap text-brand-navy/80 text-sm">{r.body}</p>
              <div className="mt-3 text-xs text-brand-navy/40">{new Date(r.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          {signedIn ? (
            <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-3">
              <textarea required rows={4} placeholder="Add to the conversation…" value={body} onChange={(e) => setBody(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-white" />
              <button type="submit" disabled={m.isPending || !body.trim()} className="px-5 py-2.5 bg-brand-navy text-white rounded-full font-bold text-sm disabled:opacity-60">
                {m.isPending ? "Sending…" : "Reply"}
              </button>
            </form>
          ) : (
            <Link to="/auth" search={{ mode: "signin" }} className="text-brand-orange font-bold">Sign in to reply →</Link>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
