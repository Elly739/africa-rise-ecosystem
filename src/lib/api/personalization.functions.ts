import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    interests: z.array(z.string().max(40)).max(20),
    skill_level: z.enum(["beginner", "intermediate", "advanced"]),
    primary_goal: z.enum(["learn", "job", "build", "network"]),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        interests: data.interests,
        skill_level: data.skill_level,
        primary_goal: data.primary_goal,
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const getForYou = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("interests,skill_level,primary_goal")
      .eq("id", userId)
      .maybeSingle();
    const interests = (profile?.interests ?? []) as string[];

    const [courses, opps, challenges, enrolled] = await Promise.all([
      supabaseAdmin.from("courses").select("id,title,slug,summary,level").limit(20),
      supabaseAdmin.from("opportunities").select("id,title,organization,type,tags,location,remote,apply_url").order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("challenges").select("id,title,slug,summary,status,tags").eq("status", "open").limit(10),
      supabase.from("enrollments").select("course_id"),
    ]);

    const enrolledIds = new Set((enrolled.data ?? []).map((e) => e.course_id));
    const interestSet = new Set(interests.map((i) => i.toLowerCase()));
    const score = (tags: string[] | null | undefined) =>
      (tags ?? []).reduce((s, t) => (interestSet.has(t.toLowerCase()) ? s + 1 : s), 0);

    const recCourses = (courses.data ?? [])
      .filter((c) => !enrolledIds.has(c.id))
      .slice(0, 6);

    const recOpps = (opps.data ?? [])
      .map((o) => ({ o, s: score(o.tags as string[] | null) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 4)
      .map((x) => x.o);

    const recChallenges = (challenges.data ?? [])
      .map((c) => ({ c, s: score(c.tags as string[] | null) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map((x) => x.c);

    return { courses: recCourses, opportunities: recOpps, challenges: recChallenges, interests };
  });
