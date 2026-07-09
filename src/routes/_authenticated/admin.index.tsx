import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/api/admin.functions";
import { Route as AdminRoute } from "./admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin · SkillBridge Africa" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { roles } = AdminRoute.useRouteContext();
  const statsFn = useServerFn(getAdminStats);
  const { data: stats, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn() });

  const isAdmin = roles.includes("admin");
  const isModerator = roles.includes("admin") || roles.includes("moderator");
  const isTeacher = roles.includes("admin") || roles.includes("teacher");
  const isPartner = roles.includes("admin") || roles.includes("partner");

  const statCards = [
    { label: "Users", value: stats?.users ?? 0, visible: isAdmin, href: "/admin/users" },
    { label: "Courses", value: stats?.courses ?? 0, visible: isTeacher, href: "/admin/courses" },
    { label: "Lessons", value: stats?.lessons ?? 0, visible: isTeacher, href: "/admin/courses" },
    { label: "Quizzes", value: stats?.quizzes ?? 0, visible: isTeacher, href: "/admin/courses" },
    { label: "Opportunities", value: stats?.opportunities ?? 0, visible: isPartner, href: "/admin/opportunities" },
    { label: "Applications", value: stats?.applications ?? 0, visible: isPartner, href: "/admin/opportunities" },
    { label: "Projects", value: stats?.projects ?? 0, visible: isModerator, href: "/admin/content" },
    { label: "Discussions", value: stats?.discussions ?? 0, visible: isModerator, href: "/admin/content" },
    { label: "Challenge submissions", value: stats?.challengeSubmissions ?? 0, visible: isAdmin },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Admin dashboard</h1>
        <p className="text-sm text-brand-navy/60 mt-1">Manage users, content, opportunities, and courses.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-brand-navy/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {statCards.filter((s) => s.visible).map((s) => (
            <Link
              key={s.label}
              to={s.href ?? "/admin"}
              className="block p-5 rounded-2xl bg-white border border-brand-navy/5 hover:shadow-md transition-shadow"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{s.label}</p>
              <p className="font-display text-3xl font-bold mt-1">{s.value}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {isModerator && (
          <Link to="/admin/content" className="block p-5 rounded-2xl bg-brand-orange/10 text-brand-navy hover:bg-brand-orange/15 transition-colors">
            <p className="font-display font-bold">Moderate content</p>
            <p className="text-sm mt-1 opacity-80">Review projects and discussions.</p>
          </Link>
        )}
        {isPartner && (
          <Link to="/admin/opportunities" className="block p-5 rounded-2xl bg-brand-mint/10 text-brand-navy hover:bg-brand-mint/15 transition-colors">
            <p className="font-display font-bold">Manage opportunities</p>
            <p className="text-sm mt-1 opacity-80">Track applications and update statuses.</p>
          </Link>
        )}
        {isTeacher && (
          <Link to="/admin/courses" className="block p-5 rounded-2xl bg-brand-navy/5 text-brand-navy hover:bg-brand-navy/10 transition-colors">
            <p className="font-display font-bold">Course content</p>
            <p className="text-sm mt-1 opacity-80">Browse and manage courses, lessons, and quizzes.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
