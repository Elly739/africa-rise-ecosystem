import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];
type ApplicationStatus = Database["public"]["Enums"]["application_status"];

const ROLES: AppRole[] = ["admin", "moderator", "teacher", "partner"];

async function hasRole(supabase: any, userId: string, role: AppRole): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: role });
  if (error) throw error;
  return !!data;
}

async function assertAnyRole(supabase: any, userId: string, roles: AppRole[]): Promise<AppRole> {
  for (const role of roles) {
    if (await hasRole(supabase, userId, role)) return role;
  }
  throw new Error("Forbidden");
}

async function loadAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// Dashboard stats — available to any privileged role
export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAnyRole(supabase, userId, ROLES);
    const admin = await loadAdmin();

    const [
      { count: users },
      { count: courses },
      { count: lessons },
      { count: quizzes },
      { count: opportunities },
      { count: projects },
      { count: discussions },
      { count: applications },
      { count: challengeSubmissions },
    ] = await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("courses").select("*", { count: "exact", head: true }),
      admin.from("lessons").select("*", { count: "exact", head: true }),
      admin.from("quizzes").select("*", { count: "exact", head: true }),
      admin.from("opportunities").select("*", { count: "exact", head: true }),
      admin.from("projects").select("*", { count: "exact", head: true }),
      admin.from("discussions").select("*", { count: "exact", head: true }),
      admin.from("applications").select("*", { count: "exact", head: true }),
      admin.from("challenge_submissions").select("*", { count: "exact", head: true }),
    ]);

    return {
      users: users ?? 0,
      courses: courses ?? 0,
      lessons: lessons ?? 0,
      quizzes: quizzes ?? 0,
      opportunities: opportunities ?? 0,
      projects: projects ?? 0,
      discussions: discussions ?? 0,
      applications: applications ?? 0,
      challengeSubmissions: challengeSubmissions ?? 0,
    };
  });

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { page?: number; pageSize?: number; search?: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAnyRole(supabase, userId, ["admin"]);
    const admin = await loadAdmin();

    const page = Math.max(1, data.page ?? 1);
    const pageSize = Math.max(5, Math.min(50, data.pageSize ?? 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin.from("profiles").select("*", { count: "exact" });
    if (data.search?.trim()) {
      const term = data.search.trim();
      query = query.ilike("display_name", `%${term}%`);
    }

    const { data: profiles, error, count } = await query.range(from, to).order("created_at", { ascending: false });
    if (error) throw error;

    const userIds = profiles?.map((p) => p.id) ?? [];
    const { data: roles } = await admin.from("user_roles").select("user_id, role").in("user_id", userIds);

    const rolesByUser = new Map<string, AppRole[]>();
    for (const r of roles ?? []) {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    }

    return {
      users: profiles?.map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] })) ?? [],
      count: count ?? 0,
      page,
      pageSize,
    };
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; role: AppRole; action: "add" | "remove" }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAnyRole(supabase, userId, ["admin"]);
    const admin = await loadAdmin();

    if (data.action === "add") {
      const { error } = await admin.from("user_roles").insert({ user_id: data.userId, role: data.role });
      if (error) throw error;
    } else {
      const { error } = await admin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
      if (error) throw error;
    }
    return { ok: true };
  });

export const listContentForModeration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAnyRole(supabase, userId, ["admin", "moderator"]);
    const admin = await loadAdmin();

    const [{ data: projects }, { data: discussions }] = await Promise.all([
      admin
        .from("projects")
        .select("id, title, slug, summary, status, user_id, created_at, profiles:profiles!user_id(display_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("discussions")
        .select("id, title, topic, user_id, created_at, profiles:profiles!user_id(display_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return {
      projects: projects ?? [],
      discussions: discussions ?? [],
    };
  });

export const moderateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { type: "project" | "discussion"; id: string; action: "delete" | "approve" }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAnyRole(supabase, userId, ["admin", "moderator"]);
    const admin = await loadAdmin();

    if (data.type === "project") {
      if (data.action === "delete") {
        const { error } = await admin.from("projects").delete().eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await admin.from("projects").update({ status: "launched" as ProjectStatus }).eq("id", data.id);
        if (error) throw error;
      }
    } else {
      if (data.action === "delete") {
        const { error } = await admin.from("discussions").delete().eq("id", data.id);
        if (error) throw error;
      } else {
        // Discussions have no status; approve is a no-op for now.
        return { ok: true };
      }
    }
    return { ok: true };
  });

export const listOpportunitiesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAnyRole(supabase, userId, ["admin", "partner"]);
    const admin = await loadAdmin();

    const { data: opportunities, error } = await admin
      .from("opportunities")
      .select("id, title, organization, location, type, tags, created_at, applications:applications(count)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return { opportunities: opportunities ?? [] };
  });

export const listApplicationsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { opportunityId?: string; status?: ApplicationStatus | "all" }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAnyRole(supabase, userId, ["admin", "partner"]);
    const admin = await loadAdmin();

    let query = admin
      .from("applications")
      .select(
        "id, status, notes, created_at, opportunity_id, user_id, opportunities:opportunity_id(title, organization), profiles:user_id(display_name, avatar_url)",
      )
      .order("created_at", { ascending: false });

    if (data.opportunityId && data.opportunityId !== "all") {
      query = query.eq("opportunity_id", data.opportunityId);
    }
    if (data.status && data.status !== "all") {
      query = query.eq("status", data.status);
    }

    const { data: applications, error } = await query.limit(100);
    if (error) throw error;

    return { applications: applications ?? [] };
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { applicationId: string; status: ApplicationStatus }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAnyRole(supabase, userId, ["admin", "partner"]);
    const admin = await loadAdmin();

    const { error } = await admin.from("applications").update({ status: data.status }).eq("id", data.applicationId);
    if (error) throw error;
    return { ok: true };
  });

export const listCoursesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAnyRole(supabase, userId, ["admin", "teacher"]);
    const admin = await loadAdmin();

    const { data: courses, error } = await admin
      .from("courses")
      .select("id, title, slug, level, summary, cover_url, subject_id, subjects:subject_id(title), lessons:lessons(count), quizzes:quizzes(count)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return { courses: courses ?? [] };
  });
