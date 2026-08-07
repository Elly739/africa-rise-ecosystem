import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Owner toggles "looking for collaborators" + the roles they need. */
export const updateProjectCollab = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      looking_for_collaborators: z.boolean(),
      roles_needed: z.array(z.string().min(1).max(40)).max(8).default([]),
    }),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("projects")
      .update({
        looking_for_collaborators: data.looking_for_collaborators,
        roles_needed: data.roles_needed,
      })
      .eq("id", data.projectId)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const requestCollaboration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ projectId: z.string().uuid(), message: z.string().min(10).max(600) }))
  .handler(async ({ data, context }) => {
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("user_id,looking_for_collaborators")
      .eq("id", data.projectId)
      .maybeSingle();
    if (!project) throw new Error("Project not found");
    if (project.user_id === context.userId) throw new Error("This is your own project");
    if (!project.looking_for_collaborators) throw new Error("This project isn't open to collaborators right now");

    const { error } = await context.supabase.from("collaboration_requests").insert({
      project_id: data.projectId,
      requester_id: context.userId,
      message: data.message,
    });
    if (error) {
      if (error.code === "23505") return { ok: true, alreadyRequested: true };
      throw error;
    }
    return { ok: true, alreadyRequested: false };
  });

/** Requests visible to me: ones I sent + ones on projects I own. */
export const listMyCollabRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("collaboration_requests")
      .select("id,project_id,requester_id,message,status,created_at,projects(title,slug,user_id)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = data ?? [];
    const requesterIds = Array.from(new Set(rows.map((r) => r.requester_id)));
    const names: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    if (requesterIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", requesterIds);
      for (const p of profiles ?? []) names[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
    }

    return rows.map((r) => ({
      ...r,
      requester: names[r.requester_id] ?? null,
      incoming: (r.projects as { user_id?: string } | null)?.user_id === context.userId,
    }));
  });

export const respondToCollabRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ requestId: z.string().uuid(), status: z.enum(["accepted", "declined"]) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("collaboration_requests")
      .update({ status: data.status })
      .eq("id", data.requestId);
    if (error) throw error;
    return { ok: true };
  });

/** Has the signed-in person already asked to join this project? */
export const getMyCollabStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ projectId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("collaboration_requests")
      .select("status")
      .eq("project_id", data.projectId)
      .eq("requester_id", context.userId)
      .maybeSingle();
    return { status: (row?.status as string | undefined) ?? null };
  });
