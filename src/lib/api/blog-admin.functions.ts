import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAuthor(supabase: any, userId: string) {
  const [{ data: isAdmin }, { data: isPartner }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "partner" }),
  ]);
  if (!isAdmin && !isPartner) throw new Error("Only admins and partners can write articles");
  return { isAdmin: !!isAdmin };
}

export const canWriteBlog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: isAdmin }, { data: isPartner }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "partner" }),
    ]);
    return { canWrite: !!isAdmin || !!isPartner, isAdmin: !!isAdmin };
  });

export const listEditablePosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { isAdmin } = await assertAuthor(context.supabase, context.userId);
    let q = context.supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,category,cover_url,author_name,author_id,read_minutes,published,published_at,updated_at")
      .order("updated_at", { ascending: false });
    if (!isAdmin) q = q.eq("author_id", context.userId);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  });

export const getEditablePost = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAuthor(context.supabase, context.userId);
    const { data: post, error } = await context.supabase
      .from("blog_posts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return post;
  });

const postInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(6).max(160),
  slug: z.string().max(160).optional().default(""),
  excerpt: z.string().min(20).max(400),
  body: z.string().min(50).max(40000),
  category: z.string().min(2).max(40),
  cover_url: z.string().url().max(500).optional().or(z.literal("")),
  read_minutes: z.number().int().min(1).max(60).default(4),
  published: z.boolean().default(false),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}

export const upsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(postInput)
  .handler(async ({ data, context }) => {
    await assertAuthor(context.supabase, context.userId);
    const { data: profile } = await context.supabase
      .from("profiles").select("display_name").eq("id", context.userId).maybeSingle();

    const payload = {
      title: data.title,
      slug: data.slug ? slugify(data.slug) : `${slugify(data.title)}-${Math.random().toString(36).slice(2, 6)}`,
      excerpt: data.excerpt,
      body: data.body,
      category: data.category,
      cover_url: data.cover_url || null,
      read_minutes: data.read_minutes,
      published: data.published,
      author_name: profile?.display_name ?? "Pioneer Africa Hub",
      author_id: context.userId,
    };

    if (data.id) {
      const { error } = await context.supabase.from("blog_posts").update(payload).eq("id", data.id);
      if (error) throw error;
      return { id: data.id, slug: payload.slug };
    }
    const { data: row, error } = await context.supabase
      .from("blog_posts").insert(payload).select("id,slug").single();
    if (error) throw error;
    return row;
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAuthor(context.supabase, context.userId);
    const { error } = await context.supabase.from("blog_posts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
