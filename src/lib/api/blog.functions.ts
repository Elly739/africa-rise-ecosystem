import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const POST_FIELDS = "id,title,slug,excerpt,category,cover_url,author_name,read_minutes,published_at";

export const listPosts = createServerFn({ method: "GET" })
  .inputValidator(z.object({ category: z.string().optional() }).optional().default({}))
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("blog_posts")
      .select(POST_FIELDS)
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(60);
    if (data?.category) q = q.eq("category", data.category);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const getPost = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw error;
    if (!post) return null;
    const { data: related } = await supabaseAdmin
      .from("blog_posts")
      .select(POST_FIELDS)
      .eq("published", true)
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3);
    return { post, related: related ?? [] };
  });
