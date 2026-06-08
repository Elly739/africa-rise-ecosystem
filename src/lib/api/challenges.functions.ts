import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) + "-" + Math.random().toString(36).slice(2, 6);
}

// ============ LIST / GET ============
export const listChallenges = createServerFn({ method: "GET" }).handler(async () => {
  const { data: challenges, error } = await supabaseAdmin
    .from("challenges")
    .select("id,title,slug,description,prize,cover_url,tags,status,deadline,created_at,winner_submission_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const ids = (challenges ?? []).map((c) => c.id);
  if (ids.length === 0) return [];
  const [{ data: teams }, { data: subs }] = await Promise.all([
    supabaseAdmin.from("challenge_teams").select("challenge_id").in("challenge_id", ids),
    supabaseAdmin.from("challenge_submissions").select("challenge_id").in("challenge_id", ids),
  ]);
  const teamCount: Record<string, number> = {};
  const subCount: Record<string, number> = {};
  for (const t of teams ?? []) teamCount[t.challenge_id] = (teamCount[t.challenge_id] ?? 0) + 1;
  for (const s of subs ?? []) subCount[s.challenge_id] = (subCount[s.challenge_id] ?? 0) + 1;
  return (challenges ?? []).map((c) => ({ ...c, team_count: teamCount[c.id] ?? 0, submission_count: subCount[c.id] ?? 0 }));
});

export const getChallenge = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const { data: challenge } = await supabaseAdmin.from("challenges").select("*").eq("slug", data.slug).maybeSingle();
    if (!challenge) return null;
    const [{ data: teams }, { data: members }, { data: subs }, { data: votes }] = await Promise.all([
      supabaseAdmin.from("challenge_teams").select("*").eq("challenge_id", challenge.id).order("created_at"),
      supabaseAdmin.from("challenge_team_members").select("team_id,user_id,role"),
      supabaseAdmin.from("challenge_submissions").select("*").eq("challenge_id", challenge.id).order("created_at", { ascending: false }),
      supabaseAdmin.from("challenge_votes").select("submission_id,user_id").eq("challenge_id", challenge.id),
    ]);
    const teamIds = new Set((teams ?? []).map((t) => t.id));
    const teamMembers: Record<string, { user_id: string; role: string }[]> = {};
    for (const m of members ?? []) {
      if (!teamIds.has(m.team_id)) continue;
      (teamMembers[m.team_id] ||= []).push({ user_id: m.user_id, role: m.role });
    }
    const allUserIds = Array.from(new Set([
      challenge.created_by,
      ...(teams ?? []).map((t) => t.lead_user_id),
      ...Object.values(teamMembers).flat().map((m) => m.user_id),
      ...(subs ?? []).map((s) => s.submitted_by),
    ]));
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id,display_name,avatar_url").in("id", allUserIds);
    const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const voteCounts: Record<string, number> = {};
    for (const v of votes ?? []) voteCounts[v.submission_id] = (voteCounts[v.submission_id] ?? 0) + 1;
    return {
      challenge: { ...challenge, creator: profMap.get(challenge.created_by) ?? null },
      teams: (teams ?? []).map((t) => ({
        ...t,
        lead: profMap.get(t.lead_user_id) ?? null,
        members: (teamMembers[t.id] ?? []).map((m) => ({ ...m, profile: profMap.get(m.user_id) ?? null })),
      })),
      submissions: (subs ?? []).map((s) => ({
        ...s,
        votes: voteCounts[s.id] ?? 0,
        submitter: profMap.get(s.submitted_by) ?? null,
      })),
      votes: votes ?? [],
    };
  });

// ============ CREATE CHALLENGE ============
export const createChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    title: z.string().min(4).max(140),
    description: z.string().max(5000).default(""),
    prize: z.string().max(280).optional().or(z.literal("")),
    deadline: z.string().optional().or(z.literal("")),
    tags: z.array(z.string().max(40)).max(10).default([]),
    cover_url: z.string().url().optional().or(z.literal("")),
  }))
  .handler(async ({ data, context }) => {
    const slug = slugify(data.title);
    const { data: row, error } = await context.supabase.from("challenges").insert({
      title: data.title,
      slug,
      description: data.description,
      prize: data.prize || null,
      deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
      tags: data.tags,
      cover_url: data.cover_url || null,
      created_by: context.userId,
    }).select("slug").single();
    if (error) throw error;
    return row;
  });

export const updateChallengeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    challengeId: z.string().uuid(),
    status: z.enum(["draft", "open", "judging", "closed"]),
  }))
  .handler(async ({ data, context }) => {
    const patch: { status: "draft" | "open" | "judging" | "closed"; winner_submission_id?: string | null } = { status: data.status };
    if (data.status === "closed") {
      // auto-pick winner with most votes
      const { data: votes } = await context.supabase.from("challenge_votes")
        .select("submission_id").eq("challenge_id", data.challengeId);
      const counts: Record<string, number> = {};
      for (const v of votes ?? []) counts[v.submission_id] = (counts[v.submission_id] ?? 0) + 1;
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      patch.winner_submission_id = sorted[0]?.[0] ?? null;
    }
    const { error } = await context.supabase.from("challenges").update(patch).eq("id", data.challengeId);
    if (error) throw error;
    return { ok: true };
  });

// ============ TEAMS ============
export const createTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    challengeId: z.string().uuid(),
    name: z.string().min(2).max(80),
    pitch: z.string().max(1000).default(""),
    looking_for: z.array(z.string().max(40)).max(10).default([]),
  }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("challenge_teams").insert({
      challenge_id: data.challengeId,
      name: data.name,
      pitch: data.pitch,
      looking_for: data.looking_for,
      lead_user_id: context.userId,
    }).select("id").single();
    if (error) throw error;
    return row;
  });

export const joinTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ teamId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("challenge_team_members")
      .insert({ team_id: data.teamId, user_id: context.userId, role: "member" });
    if (error && !error.message.includes("duplicate")) throw error;
    return { ok: true };
  });

export const leaveTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ teamId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("challenge_team_members")
      .delete().eq("team_id", data.teamId).eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ============ SUBMISSIONS ============
export const submitToChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    challengeId: z.string().uuid(),
    teamId: z.string().uuid(),
    title: z.string().min(3).max(140),
    description: z.string().max(5000).default(""),
    demo_url: z.string().url().optional().or(z.literal("")),
    repo_url: z.string().url().optional().or(z.literal("")),
    file_url: z.string().optional().or(z.literal("")),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("challenge_submissions").upsert({
      challenge_id: data.challengeId,
      team_id: data.teamId,
      title: data.title,
      description: data.description,
      demo_url: data.demo_url || null,
      repo_url: data.repo_url || null,
      file_url: data.file_url || null,
      submitted_by: context.userId,
    }, { onConflict: "challenge_id,team_id" });
    if (error) throw error;
    return { ok: true };
  });

export const uploadSubmissionFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ path: z.string(), base64: z.string(), contentType: z.string() }))
  .handler(async ({ data, context }) => {
    const fullPath = `${context.userId}/${data.path}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const { error } = await context.supabase.storage.from("challenge-submissions")
      .upload(fullPath, bytes, { contentType: data.contentType, upsert: true });
    if (error) throw error;
    const { data: signed } = await context.supabase.storage.from("challenge-submissions")
      .createSignedUrl(fullPath, 60 * 60 * 24 * 365);
    return { path: fullPath, url: signed?.signedUrl ?? "" };
  });

// ============ VOTES ============
export const castVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ challengeId: z.string().uuid(), submissionId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    // remove prior vote in same challenge then insert (one vote per challenge per user)
    await context.supabase.from("challenge_votes")
      .delete().eq("challenge_id", data.challengeId).eq("user_id", context.userId);
    const { error } = await context.supabase.from("challenge_votes").insert({
      challenge_id: data.challengeId,
      submission_id: data.submissionId,
      user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const myVoteEligibility = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ count: d }, { count: r }] = await Promise.all([
      context.supabase.from("discussions").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
      context.supabase.from("discussion_replies").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
    ]);
    return { eligible: (d ?? 0) + (r ?? 0) > 0, activity: (d ?? 0) + (r ?? 0) };
  });
