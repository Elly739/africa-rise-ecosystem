import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Is the caller allowed to browse the talent directory? */
export const canBrowseTalent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role as string);
    return { allowed: roles.includes("partner") || roles.includes("admin"), roles };
  });

export const searchTalent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      q: z.string().max(80).optional().default(""),
      skill: z.string().max(40).optional().default(""),
      openTo: z.enum(["", "internship", "job", "collaboration", "mentorship"]).optional().default(""),
      minScore: z.number().int().min(0).max(1000).optional().default(0),
    }),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await (context.supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>)("search_talent", {
      _q: data.q,
      _skill: data.skill,
      _open_to: data.openTo,
      _min_score: data.minScore,
      _limit: 60,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Array<{
      user_id: string;
      display_name: string | null;
      avatar_url: string | null;
      headline: string | null;
      university: string | null;
      study_year: string | null;
      country: string | null;
      skills: string[];
      interests: string[];
      open_to: string[];
      score: number;
      projects_count: number;
    }>;
  });
