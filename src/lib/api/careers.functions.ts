import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("applications")
      .select("id,status,notes,created_at,opportunity_id,opportunities(title,organization,type,location,remote,apply_url)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const applyToOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ opportunityId: z.string().uuid(), notes: z.string().max(1000).optional() }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("applications")
      .select("id")
      .eq("opportunity_id", data.opportunityId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) return { ok: true, alreadyApplied: true };

    const { data: cv } = await context.supabase.from("cvs").select("user_id").eq("user_id", context.userId).maybeSingle();
    if (!cv) throw new Error("Build your CV first at /cv");

    const { error } = await context.supabase.from("applications").insert({
      user_id: context.userId,
      opportunity_id: data.opportunityId,
      status: "submitted",
      notes: data.notes ?? null,
    });
    if (error) throw error;
    return { ok: true, alreadyApplied: false };
  });
