import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listAnnouncements, createAnnouncement, deleteAnnouncement } from "@/lib/api/admin.functions";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
const AUDIENCE_ROLES: AppRole[] = ["student", "teacher", "partner", "moderator"];

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  head: () => ({ meta: [{ title: "Announcements · Admin · Pioneer Africa Hub" }] }),
  component: AdminAnnouncements,
});

function AdminAnnouncements() {
  const listFn = useServerFn(listAnnouncements);
  const createFn = useServerFn(createAnnouncement);
  const deleteFn = useServerFn(deleteAnnouncement);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["admin-announcements"], queryFn: () => listFn() });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<Set<AppRole>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const toggleRole = (role: AppRole) => {
    setAudience((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role); else next.add(role);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const res = await createFn({ data: {
        title, body, link: link.trim() || undefined,
        targetRoles: audience.size > 0 ? Array.from(audience) : undefined,
      } });
      toast.success(`Announcement sent to ${res.notified} ${res.notified === 1 ? "person" : "people"}.`);
      setTitle(""); setBody(""); setLink(""); setAudience(new Set());
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setSubmitting(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement? Notifications already sent will remain.")) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-brand-navy/60">Broadcast an in-app notification to everyone or a specific audience.</p>
      </header>

      <form onSubmit={submit} className="rounded-2xl border border-brand-navy/5 bg-white p-5 space-y-4">
        <label className="block">
          <span className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-2">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="What's new?" className="w-full px-3 py-2 rounded-xl border border-brand-navy/10 focus:outline-none focus:border-brand-orange" />
        </label>
        <label className="block">
          <span className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-2">Message</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={2000} placeholder="Share the details…" className="w-full px-3 py-2 rounded-xl border border-brand-navy/10 focus:outline-none focus:border-brand-orange" />
        </label>
        <label className="block">
          <span className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-2">Link (optional)</span>
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/courses/example or https://…" className="w-full px-3 py-2 rounded-xl border border-brand-navy/10 focus:outline-none focus:border-brand-orange" />
        </label>
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-2">Audience</span>
          <p className="text-xs text-brand-navy/50 mb-2">Leave blank to notify everyone.</p>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_ROLES.map((r) => (
              <button key={r} type="button" onClick={() => toggleRole(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${audience.has(r) ? "bg-brand-orange text-white" : "bg-brand-navy/5 text-brand-navy/70 hover:bg-brand-navy/10"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={submitting || !title.trim() || !body.trim()} className="px-5 py-3 rounded-full bg-brand-orange text-white font-semibold disabled:opacity-60">
          {submitting ? "Sending…" : "Send announcement"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Recent announcements</h2>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-brand-navy/5 animate-pulse" />)}</div>
        ) : data?.announcements.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-brand-navy/15 p-8 text-center text-brand-navy/50">No announcements yet.</p>
        ) : (
          <ul className="space-y-2">
            {data?.announcements.map((a: any) => (
              <li key={a.id} className="rounded-2xl border border-brand-navy/5 bg-white p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-brand-navy/70 mt-0.5 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-[11px] text-brand-navy/40 mt-2">
                    {new Date(a.created_at).toLocaleString()} · by {a.profiles?.display_name ?? "Admin"}
                    {a.target_roles?.length ? ` · to ${a.target_roles.join(", ")}` : " · to everyone"}
                  </p>
                </div>
                <button onClick={() => remove(a.id)} className="text-xs font-semibold text-red-600 hover:underline shrink-0">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
