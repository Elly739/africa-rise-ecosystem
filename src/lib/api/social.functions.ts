import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const [profile, stats, projects, discussions, certificates, followers, following, score] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,display_name,avatar_url,country,bio,interests,skill_level,headline,university,study_year,skills,github_url,linkedin_url,website_url,open_to").eq("id", data.userId).maybeSingle(),
      supabaseAdmin.from("user_stats").select("xp,level,streak_days").eq("user_id", data.userId).maybeSingle(),
      supabaseAdmin.from("projects").select("id,title,slug,summary,status,tags,looking_for_collaborators").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(6),
      supabaseAdmin.from("discussions").select("id,title,topic,created_at").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("certificates").select("id,code,issued_at,courses(title)").eq("user_id", data.userId).order("issued_at", { ascending: false }).limit(6),
      supabaseAdmin.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", data.userId),
      supabaseAdmin.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", data.userId),
      (supabaseAdmin.from as unknown as (t: string) => {
        select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, number> | null }> } };
      })("innovation_scores").select("score,projects_count,likes_received,submissions_count,certificates_count,lessons_completed,community_contributions").eq("user_id", data.userId).maybeSingle(),
    ]);
    if (!profile.data) return null;
    return {
      profile: profile.data,
      stats: stats.data ?? { xp: 0, level: 1, streak_days: 0 },
      innovation: score.data ?? {
        score: 0, projects_count: 0, likes_received: 0, submissions_count: 0,
        certificates_count: 0, lessons_completed: 0, community_contributions: 0,
      },
      projects: projects.data ?? [],
      discussions: discussions.data ?? [],
      certificates: certificates.data ?? [],
      followerCount: followers.count ?? 0,
      followingCount: following.count ?? 0,
    };
  });


export const isFollowing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", context.userId)
      .eq("following_id", data.userId)
      .maybeSingle();
    return { following: !!row };
  });

export const toggleFollow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    if (data.userId === context.userId) throw new Error("You can't follow yourself");
    const { data: existing } = await context.supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", context.userId)
      .eq("following_id", data.userId)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("follows").delete().eq("follower_id", context.userId).eq("following_id", data.userId);
      return { following: false };
    }
    await context.supabase.from("follows").insert({ follower_id: context.userId, following_id: data.userId });
    return { following: true };
  });
