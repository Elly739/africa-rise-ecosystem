import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats, getAdminOverview, getTeacherWorkspace, getPartnerWorkspace } from "@/lib/api/admin.functions";
import { Route as AdminRoute } from "./admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin · SkillBridge Africa" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { roles } = AdminRoute.useRouteContext();
  const isAdmin = roles.includes("admin");
  const isModerator = isAdmin || roles.includes("moderator");
  const isTeacher = isAdmin || roles.includes("teacher");
  const isPartner = isAdmin || roles.includes("partner");

  const statsFn = useServerFn(getAdminStats);
  const overviewFn = useServerFn(getAdminOverview);
  const teacherFn = useServerFn(getTeacherWorkspace);
  const partnerFn = useServerFn(getPartnerWorkspace);

  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn() });
  const { data: overview } = useQuery({ queryKey: ["admin-overview"], queryFn: () => overviewFn(), enabled: isAdmin });
  const { data: teacher } = useQuery({ queryKey: ["teacher-workspace"], queryFn: () => teacherFn(), enabled: isTeacher });
  const { data: partner } = useQuery({ queryKey: ["partner-workspace"], queryFn: () => partnerFn(), enabled: isPartner });

  const roleTitle = isAdmin ? "Admin control room" : isTeacher && isPartner ? "Teacher + Partner workspace" : isTeacher ? "Teacher workspace" : isPartner ? "Partner workspace" : isModerator ? "Moderator workspace" : "Workspace";

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-gradient-to-br from-brand-navy to-brand-navy/80 text-white p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-mint">{roles.map((r: string) => r).join(" · ")}</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">{roleTitle}</h1>
        <p className="text-sm text-white/70 mt-2 max-w-2xl">Welcome back. Here's what needs your attention today.</p>
      </header>

      {/* Admin queue tiles */}
      {isAdmin && overview && (
        <section aria-labelledby="queue-heading" className="space-y-3">
          <h2 id="queue-heading" className="font-display text-lg font-bold">Needs your attention</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <QueueTile label="Pending role requests" value={overview.pendingRoleRequests} href="/admin/requests" tone="orange" />
            <QueueTile label="Active invites" value={overview.activeInvites} href="/admin/invites" tone="mint" />
            <QueueTile label="Pending applications" value={overview.pendingApplications} href="/admin/opportunities" tone="navy" />
          </div>
        </section>
      )}

      {/* Teacher workspace */}
      {isTeacher && teacher && (
        <section aria-labelledby="teacher-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="teacher-heading" className="font-display text-lg font-bold">Teaching impact</h2>
            <Link to="/admin/courses" className="text-xs font-bold text-brand-orange">Manage courses →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Courses" value={teacher.totalCourses} />
            <Stat label="Lessons" value={teacher.totalLessons} />
            <Stat label="Enrolments" value={teacher.totalEnrollments} />
            <Stat label="Quizzes passed" value={teacher.passedQuizzes} />
          </div>
        </section>
      )}

      {/* Partner workspace */}
      {isPartner && partner && (
        <section aria-labelledby="partner-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="partner-heading" className="font-display text-lg font-bold">Opportunities pipeline</h2>
            <Link to="/admin/opportunities" className="text-xs font-bold text-brand-orange">Manage →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Opportunities" value={partner.opportunities} />
            <Stat label="New applications" value={partner.pendingApplications} />
            <Stat label="Interviews" value={partner.interviews} />
            <Stat label="Offers" value={partner.offers} />
          </div>
        </section>
      )}

      {/* Platform stats — always visible to privileged roles */}
      {stats && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">Platform</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {isAdmin && <Stat label="Users" value={stats.users} />}
            <Stat label="Courses" value={stats.courses} />
            <Stat label="Opportunities" value={stats.opportunities} />
            <Stat label="Projects" value={stats.projects} />
            <Stat label="Discussions" value={stats.discussions} />
            <Stat label="Applications" value={stats.applications} />
            <Stat label="Challenge submissions" value={stats.challengeSubmissions} />
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Quick actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {isAdmin && <ActionCard title="Post an announcement" desc="Notify everyone or a specific role in-app." href="/admin/announcements" tone="orange" />}
          {isAdmin && <ActionCard title="Create an invite" desc="Grant teacher, partner, or moderator access." href="/admin/invites" tone="mint" />}
          {isAdmin && <ActionCard title="Review role requests" desc="Approve teacher, partner and moderator applicants." href="/admin/requests" tone="navy" />}
          {isModerator && <ActionCard title="Moderate content" desc="Review projects and discussions." href="/admin/content" tone="orange" />}
          {isTeacher && <ActionCard title="Course catalogue" desc="Manage learning content." href="/admin/courses" tone="mint" />}
          {isPartner && <ActionCard title="Applications inbox" desc="Move candidates through your pipeline." href="/admin/opportunities" tone="navy" />}
        </div>
      </section>

      {/* Recent announcements sidebar */}
      {isAdmin && overview && overview.recentAnnouncements.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">Latest broadcasts</h2>
          <ul className="rounded-2xl border border-brand-navy/5 bg-white divide-y divide-brand-navy/5">
            {overview.recentAnnouncements.map((a: any) => (
              <li key={a.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="font-semibold text-sm truncate">{a.title}</span>
                <span className="text-xs text-brand-navy/40 shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-brand-navy/5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{label}</p>
      <p className="font-display text-2xl sm:text-3xl font-bold mt-1">{value.toLocaleString()}</p>
    </div>
  );
}

function QueueTile({ label, value, href, tone }: { label: string; value: number; href: string; tone: "orange" | "mint" | "navy" }) {
  const bg = tone === "orange" ? "bg-brand-orange/10 text-brand-orange" : tone === "mint" ? "bg-brand-mint/15 text-brand-mint" : "bg-brand-navy/5 text-brand-navy";
  return (
    <Link to={href as any} className="block p-4 rounded-2xl bg-white border border-brand-navy/5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-navy/60">{label}</p>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${bg}`}>{value}</span>
      </div>
      <p className="font-display text-2xl font-bold mt-2">{value.toLocaleString()}</p>
    </Link>
  );
}

function ActionCard({ title, desc, href, tone }: { title: string; desc: string; href: string; tone: "orange" | "mint" | "navy" }) {
  const bg = tone === "orange" ? "bg-brand-orange/10 hover:bg-brand-orange/15" : tone === "mint" ? "bg-brand-mint/10 hover:bg-brand-mint/15" : "bg-brand-navy/5 hover:bg-brand-navy/10";
  return (
    <Link to={href as any} className={`block p-5 rounded-2xl border border-brand-navy/5 transition-colors ${bg}`}>
      <p className="font-display font-bold">{title}</p>
      <p className="text-sm mt-1 text-brand-navy/70">{desc}</p>
    </Link>
  );
}
