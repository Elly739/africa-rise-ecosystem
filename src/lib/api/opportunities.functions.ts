import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const OPPORTUNITY_TYPES = [
  "internship",
  "job",
  "scholarship",
  "hackathon",
  "fellowship",
  "grant",
  "incubator",
] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

/** Public board — every opportunity type, newest first, deadline aware. */
export const listOpportunityBoard = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .select("id,type,title,organization,location,remote,description,apply_url,deadline,tags,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
});

export const listMySavedOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_opportunities")
      .select("opportunity_id");
    if (error) throw error;
    return (data ?? []).map((r) => r.opportunity_id);
  });

export const toggleSaveOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ opportunityId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("saved_opportunities")
      .select("opportunity_id")
      .eq("opportunity_id", data.opportunityId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (existing) {
      const { error } = await context.supabase
        .from("saved_opportunities")
        .delete()
        .eq("opportunity_id", data.opportunityId)
        .eq("user_id", context.userId);
      if (error) throw error;
      return { saved: false };
    }

    const { error } = await context.supabase
      .from("saved_opportunities")
      .insert({ opportunity_id: data.opportunityId, user_id: context.userId });
    if (error) throw error;
    return { saved: true };
  });

/** Opportunities ranked against the signed-in person's interests + skills. */
export const getMatchedOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("interests,skills")
      .eq("id", context.userId)
      .maybeSingle();

    const signals = new Set(
      [...((profile?.interests as string[] | null) ?? []), ...((profile?.skills as string[] | null) ?? [])].map((s) =>
        s.toLowerCase(),
      ),
    );

    const { data: opps } = await supabaseAdmin
      .from("opportunities")
      .select("id,type,title,organization,location,remote,tags,deadline,apply_url")
      .order("created_at", { ascending: false })
      .limit(120);

    const now = Date.now();
    const scored = (opps ?? [])
      .filter((o) => !o.deadline || new Date(o.deadline).getTime() >= now - 86_400_000)
      .map((o) => {
        const tags = (o.tags as string[] | null) ?? [];
        const overlap = tags.filter((t) => signals.has(t.toLowerCase()));
        return { ...o, matchedOn: overlap, matchScore: overlap.length };
      })
      .filter((o) => o.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

    return { matches: scored, hasSignals: signals.size > 0 };
  });
