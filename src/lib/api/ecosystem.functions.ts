import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ OPPORTUNITIES (Career Bridge) ============
export const listOpportunities = createServerFn({ method: "GET" })
  .inputValidator(z.object({ type: z.enum(["internship", "job", "scholarship"]).optional() }).optional().default({}))
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("opportunities").select("*").order("created_at", { ascending: false });
    if (data?.type) q = q.eq("type", data.type);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

// ============ CV ============
export const getMyCV = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("cvs").select("*").eq("user_id", context.userId).maybeSingle();
    if (error) throw error;
    return data;
  });

export const saveMyCV = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ data: z.record(z.string(), z.unknown()) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cvs")
      .upsert({ user_id: context.userId, data: data.data as never, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true };
  });

// ============ PROJECTS (Innovation Hub) ============
export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id,title,slug,summary,cover_url,status,tags,user_id,created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  // attach like counts
  const ids = (data ?? []).map((p) => p.id);
  let likeMap: Record<string, number> = {};
  if (ids.length) {
    const { data: likes } = await supabaseAdmin.from("project_likes").select("project_id").in("project_id", ids);
    for (const l of likes ?? []) likeMap[l.project_id] = (likeMap[l.project_id] ?? 0) + 1;
  }
  return (data ?? []).map((p) => ({ ...p, likes: likeMap[p.id] ?? 0 }));
});

export const getProject = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const { data: project, error } = await supabaseAdmin.from("projects").select("*").eq("slug", data.slug).maybeSingle();
    if (error) throw error;
    if (!project) return null;
    const [{ data: likes }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("project_likes").select("user_id").eq("project_id", project.id),
      supabaseAdmin.from("profiles").select("display_name,avatar_url").eq("id", project.user_id).maybeSingle(),
    ]);
    return { project, likes: likes?.length ?? 0, author: profile };
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    title: z.string().min(3).max(120),
    summary: z.string().min(10).max(280),
    description: z.string().max(5000).optional().default(""),
    status: z.enum(["idea", "building", "launched"]).default("idea"),
    tags: z.array(z.string().max(40)).max(10).default([]),
    repo_url: z.string().url().optional().or(z.literal("")),
    demo_url: z.string().url().optional().or(z.literal("")),
  }))
  .handler(async ({ data, context }) => {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) + "-" + Math.random().toString(36).slice(2, 7);
    const { data: row, error } = await context.supabase.from("projects").insert({
      user_id: context.userId,
      title: data.title,
      slug,
      summary: data.summary,
      description: data.description,
      status: data.status,
      tags: data.tags,
      repo_url: data.repo_url || null,
      demo_url: data.demo_url || null,
    }).select("slug").single();
    if (error) throw error;
    return row;
  });

export const toggleProjectLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ projectId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("project_likes").select("project_id").eq("project_id", data.projectId).eq("user_id", context.userId).maybeSingle();
    if (existing) {
      await context.supabase.from("project_likes").delete().eq("project_id", data.projectId).eq("user_id", context.userId);
      return { liked: false };
    }
    await context.supabase.from("project_likes").insert({ project_id: data.projectId, user_id: context.userId });
    return { liked: true };
  });

// ============ COMMUNITY ============
export const listDiscussions = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("discussions")
    .select("id,title,topic,body,user_id,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const [{ data: replies }, { data: profiles }] = await Promise.all([
    supabaseAdmin.from("discussion_replies").select("discussion_id,created_at,user_id").in("discussion_id", ids),
    supabaseAdmin.from("profiles").select("id,display_name,avatar_url").in("id", userIds),
  ]);
  const replyMap = new Map<string, { count: number; last: string; participants: Set<string> }>();
  for (const r of replies ?? []) {
    const e = replyMap.get(r.discussion_id) ?? { count: 0, last: "", participants: new Set<string>() };
    e.count++;
    if (r.created_at > e.last) e.last = r.created_at;
    e.participants.add(r.user_id);
    replyMap.set(r.discussion_id, e);
  }
  const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => {
    const re = replyMap.get(r.id);
    return {
      ...r,
      author: profMap.get(r.user_id) ?? null,
      reply_count: re?.count ?? 0,
      last_activity: re?.last || r.created_at,
      participants: re ? re.participants.size + 1 : 1,
    };
  });
});

export const getDiscussion = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const [{ data: d }, { data: replies }] = await Promise.all([
      supabaseAdmin.from("discussions").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("discussion_replies").select("*").eq("discussion_id", data.id).order("created_at"),
    ]);
    if (!d) return null;
    const userIds = Array.from(new Set([d.user_id, ...(replies ?? []).map((r) => r.user_id)]));
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id,display_name,avatar_url").in("id", userIds);
    const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    return {
      discussion: { ...d, author: profMap.get(d.user_id) ?? null },
      replies: (replies ?? []).map((r) => ({ ...r, author: profMap.get(r.user_id) ?? null })),
    };
  });

export const createDiscussion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    title: z.string().min(4).max(140),
    body: z.string().min(1).max(5000),
    topic: z.string().max(40).default("general"),
  }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("discussions").insert({
      user_id: context.userId, title: data.title, body: data.body, topic: data.topic,
    }).select("id").single();
    if (error) throw error;
    return row;
  });

export const replyToDiscussion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ discussionId: z.string().uuid(), body: z.string().min(1).max(3000) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("discussion_replies").insert({
      discussion_id: data.discussionId, user_id: context.userId, body: data.body,
    });
    if (error) throw error;
    return { ok: true };
  });
