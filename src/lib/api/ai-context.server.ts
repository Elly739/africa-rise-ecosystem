import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Builds a compact, grounded snapshot of the learner so the AI coach can give
 * advice based on their real profile, projects, courses and live opportunities.
 */
export async function buildLearnerContext(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
): Promise<string> {
  const [profile, projects, enrollments, certs, saved, opps] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name,headline,university,skills,interests,skill_level,primary_goal,location")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("projects").select("title,summary,status,tags").eq("user_id", userId).limit(6),
    supabase.from("enrollments").select("courses(title,level)").limit(10),
    supabase.from("certificates").select("courses(title)").limit(10),
    supabase.from("saved_opportunities").select("opportunity_id").limit(10),
    supabaseAdmin
      .from("opportunities")
      .select("title,organization,type,location,remote,deadline,tags")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const p = (profile.data ?? {}) as Record<string, any>;
  const lines: string[] = [];

  lines.push("LEARNER PROFILE (use this to personalize every answer):");
  lines.push(
    `- Name: ${p.display_name ?? "unknown"} | Headline: ${p.headline ?? "—"} | University: ${p.university ?? "—"} | Location: ${p.location ?? "—"}`,
  );
  lines.push(
    `- Level: ${p.skill_level ?? "unknown"} | Goal: ${p.primary_goal ?? "unknown"} | Interests: ${(p.interests ?? []).join(", ") || "none set"} | Skills: ${(p.skills ?? []).join(", ") || "none set"}`,
  );

  const projRows = (projects.data ?? []) as Array<Record<string, any>>;
  lines.push(
    projRows.length
      ? `PROJECTS BUILT:\n${projRows.map((r) => `- ${r.title} (${r.status}) — ${r.summary ?? ""} [${(r.tags ?? []).join(", ")}]`).join("\n")}`
      : "PROJECTS BUILT: none yet — nudge them to ship one in the Innovation Hub.",
  );

  const courseTitles = ((enrollments.data ?? []) as Array<any>)
    .map((e) => e.courses?.title)
    .filter(Boolean);
  const certTitles = ((certs.data ?? []) as Array<any>)
    .map((c) => c.courses?.title)
    .filter(Boolean);
  lines.push(`COURSES ENROLLED: ${courseTitles.join(", ") || "none"}`);
  lines.push(`CERTIFICATES EARNED: ${certTitles.join(", ") || "none"}`);
  lines.push(`SAVED OPPORTUNITIES: ${(saved.data ?? []).length}`);

  const oppRows = (opps.data ?? []) as Array<Record<string, any>>;
  if (oppRows.length) {
    lines.push(
      `LIVE OPPORTUNITIES ON PIONEER AFRICA HUB (only recommend from this list; never invent listings):\n${oppRows
        .map(
          (o) =>
            `- ${o.title} @ ${o.organization} (${o.type}) — ${o.remote ? "Remote" : o.location ?? "On-site"}${o.deadline ? `, deadline ${o.deadline}` : ""} [${(o.tags ?? []).join(", ")}]`,
        )
        .join("\n")}`,
    );
  }

  lines.push(
    "PLATFORM ROUTES you can point them to: /courses, /careers, /innovate, /challenges, /community, /portfolio, /applications, /certificates.",
  );

  return lines.join("\n");
}
