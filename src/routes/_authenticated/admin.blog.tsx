import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { listEditablePosts, upsertPost, deletePost, getEditablePost } from "@/lib/api/blog-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  head: () => ({ meta: [{ title: "Articles · Pioneer Africa Hub Admin" }] }),
  component: AdminBlogPage,
});

const EMPTY = { id: undefined as string | undefined, title: "", slug: "", excerpt: "", body: "", category: "innovation", cover_url: "", read_minutes: 4, published: false };

function AdminBlogPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listEditablePosts);
  const getFn = useServerFn(getEditablePost);
  const saveFn = useServerFn(upsertPost);
  const delFn = useServerFn(deletePost);
  const { data: posts, isLoading } = useQuery({ queryKey: ["admin-blog"], queryFn: () => listFn() });
  const [form, setForm] = useState({ ...EMPTY });
  const [editing, setEditing] = useState(false);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { ...form, cover_url: form.cover_url || "" } }),
    onSuccess: () => {
      toast.success("Article saved");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      setForm({ ...EMPTY });
      setEditing(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-blog"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete"),
  });

  async function edit(id: string) {
    const p: any = await getFn({ data: { id } });
    if (!p) return;
    setForm({
      id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, body: p.body,
      category: p.category, cover_url: p.cover_url ?? "", read_minutes: p.read_minutes, published: p.published,
    });
    setEditing(true);
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-orange">Content</p>
        <h1 className="font-display text-3xl font-bold">Articles</h1>
        <p className="text-sm text-brand-navy/60">Admins and partners can publish stories on innovation, AI and African startups.</p>
      </header>

      <section className="bg-white rounded-3xl border border-brand-navy/5 p-6 space-y-4">
        <h2 className="font-display text-xl font-bold">{editing ? "Edit article" : "New article"}</h2>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-bg text-sm" />
        <div className="grid sm:grid-cols-3 gap-3">
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug (optional)" className="px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-bg text-sm" />
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-bg text-sm" />
          <input type="number" min={1} max={60} value={form.read_minutes} onChange={(e) => setForm({ ...form, read_minutes: Number(e.target.value) })} placeholder="Read minutes" className="px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-bg text-sm" />
        </div>
        <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="Cover image URL (optional)" className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-bg text-sm" />
        <textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Excerpt (shown in the blog list)" className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-bg text-sm" />
        <textarea rows={12} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Body (markdown supported)" className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-bg text-sm font-mono" />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="accent-brand-orange" />
          Published
        </label>
        <div className="flex gap-3">
          {editing && <button onClick={() => { setForm({ ...EMPTY }); setEditing(false); }} className="px-5 py-3 rounded-full border border-brand-navy/10 font-semibold">Cancel</button>}
          <button onClick={() => save.mutate()} disabled={save.isPending} className="px-6 py-3 rounded-full bg-brand-orange text-white font-bold disabled:opacity-60">
            {save.isPending ? "Saving…" : editing ? "Save changes" : "Create article"}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        {isLoading && <p className="text-brand-navy/60 text-sm">Loading…</p>}
        {!isLoading && (posts?.length ?? 0) === 0 && (
          <div className="rounded-3xl border border-dashed border-brand-navy/15 p-10 text-center bg-white">
            <p className="font-display font-bold">No articles yet</p>
            <p className="text-sm text-brand-navy/60 mt-1">Write the first story above.</p>
          </div>
        )}
        {(posts ?? []).map((p: any) => (
          <div key={p.id} className="bg-white rounded-2xl border border-brand-navy/5 p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display font-bold truncate">{p.title}</p>
              <p className="text-xs text-brand-navy/50">{p.category} · {p.published ? "Published" : "Draft"} · {p.author_name}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => void edit(p.id)} className="px-4 py-2 rounded-full bg-brand-clay text-xs font-bold">Edit</button>
              <button onClick={() => remove.mutate(p.id)} className="px-4 py-2 rounded-full border border-brand-navy/10 text-xs font-bold text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
