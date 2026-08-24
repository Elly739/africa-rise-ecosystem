import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Sb = SupabaseClient<any, any, any>;

/**
 * Actions the AI coach can actually perform on the learner's behalf.
 * Every tool is scoped to the authenticated user's own data.
 */
export function buildCoachTools(supabase: Sb, userId: string) {
  return {
    search_courses: tool({
      description:
        "Search the Pioneer Africa Hub course catalogue by keyword. Use before enrolling so you have a real course id.",
      inputSchema: z.object({ query: z.string().describe("Keywords, e.g. 'responsible ai'") }),
      execute: async ({ query }) => {
        const { data } = await supabaseAdmin
          .from("courses")
          .select("id,title,slug,summary,level")
          .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
          .limit(6);
        return { courses: data ?? [] };
      },
    }),

    enroll_in_course: tool({
      description: "Enrol the learner in a course. Requires a course id from search_courses.",
      inputSchema: z.object({ courseId: z.string(), courseTitle: z.string() }),
      execute: async ({ courseId, courseTitle }) => {
        const { error } = await supabase
          .from("enrollments")
          .upsert({ user_id: userId, course_id: courseId }, { onConflict: "user_id,course_id" });
        if (error) return { ok: false, error: error.message };
        return { ok: true, courseTitle, url: `/courses/${courseId}` };
      },
    }),

    search_opportunities: tool({
      description:
        "Search live opportunities (jobs, internships, hackathons, fellowships, grants, scholarships).",
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => {
        const { data } = await supabaseAdmin
          .from("opportunities")
          .select("id,title,organization,type,location,remote,deadline")
          .or(`title.ilike.%${query}%,organization.ilike.%${query}%`)
          .limit(6);
        return { opportunities: data ?? [] };
      },
    }),

    save_opportunity: tool({
      description: "Save an opportunity to the learner's shortlist. Requires an opportunity id.",
      inputSchema: z.object({ opportunityId: z.string(), title: z.string() }),
      execute: async ({ opportunityId, title }) => {
        const { error } = await supabase
          .from("saved_opportunities")
          .upsert({ user_id: userId, opportunity_id: opportunityId });
        if (error) return { ok: false, error: error.message };
        return { ok: true, title, url: "/careers" };
      },
    }),

    add_task: tool({
      description: "Add a single study task to the learner's plan.",
      inputSchema: z.object({
        title: z.string(),
        detail: z.string().optional(),
        dueDate: z.string().optional().describe("ISO date, e.g. 2026-09-01"),
      }),
      execute: async ({ title, detail, dueDate }) => {
        const { error } = await supabase.from("learning_tasks").insert({
          user_id: userId,
          title: title.slice(0, 200),
          detail: (detail ?? "").slice(0, 1000),
          due_date: dueDate || null,
        });
        if (error) return { ok: false, error: error.message };
        return { ok: true, title };
      },
    }),

    create_study_plan: tool({
      description:
        "Create a multi-step study plan. Adds each step as a task and sets the learner's current focus.",
      inputSchema: z.object({
        focus: z.string(),
        tasks: z.array(
          z.object({
            title: z.string(),
            detail: z.string().optional(),
            dueDate: z.string().optional(),
          }),
        ),
      }),
      execute: async ({ focus, tasks }) => {
        const rows = tasks.slice(0, 12).map((t) => ({
          user_id: userId,
          title: t.title.slice(0, 200),
          detail: (t.detail ?? "").slice(0, 1000),
          due_date: t.dueDate || null,
          source: "plan",
        }));
        const { error } = await supabase.from("learning_tasks").insert(rows);
        if (error) return { ok: false, error: error.message };
        await supabase
          .from("coach_memory")
          .upsert({ user_id: userId, current_focus: focus.slice(0, 300) }, { onConflict: "user_id" });
        return { ok: true, focus, added: rows.length, url: "/dashboard" };
      },
    }),

    list_my_tasks: tool({
      description: "List the learner's open study tasks.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data } = await supabase
          .from("learning_tasks")
          .select("id,title,due_date,done")
          .eq("user_id", userId)
          .eq("done", false)
          .limit(20);
        return { tasks: data ?? [] };
      },
    }),

    complete_task: tool({
      description: "Mark one of the learner's study tasks as done.",
      inputSchema: z.object({ taskId: z.string() }),
      execute: async ({ taskId }) => {
        const { error } = await supabase
          .from("learning_tasks")
          .update({ done: true })
          .eq("id", taskId)
          .eq("user_id", userId);
        return error ? { ok: false, error: error.message } : { ok: true };
      },
    }),

    remember: tool({
      description:
        "Persist coaching memory so future sessions continue where this one left off. Call this whenever the learner states a goal, a focus, or commits to something.",
      inputSchema: z.object({
        goals: z.string().optional(),
        currentFocus: z.string().optional(),
        lastCommitment: z.string().optional(),
        notes: z.string().optional(),
      }),
      execute: async ({ goals, currentFocus, lastCommitment, notes }) => {
        const patch: Record<string, unknown> = {
          user_id: userId,
          last_session_at: new Date().toISOString(),
        };
        if (goals) patch.goals = goals.slice(0, 500);
        if (currentFocus) patch.current_focus = currentFocus.slice(0, 300);
        if (lastCommitment) patch.last_commitment = lastCommitment.slice(0, 300);
        if (notes) patch.notes = notes.slice(0, 1500);
        const { error } = await supabase
          .from("coach_memory")
          .upsert(patch, { onConflict: "user_id" });
        return error ? { ok: false, error: error.message } : { ok: true };
      },
    }),
  };
}
