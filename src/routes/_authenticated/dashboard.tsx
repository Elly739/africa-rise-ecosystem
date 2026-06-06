import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/lib/api/learn.functions";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · SkillBridge Africa" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy">
      <SiteNav />
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-orange">Welcome back</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            {data?.profile?.display_name ?? "Learner"}
          </h1>
          <p className="text-brand-navy/60">Keep your momentum — your future self will thank you.</p>
        </header>

        {/* Ecosystem quick-jump */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Courses", to: "/courses" as const, icon: "📘" },
            { label: "Careers", to: "/careers" as const, icon: "🚀" },
            { label: "Innovate", to: "/innovate" as const, icon: "🧑‍💻" },
            { label: "Community", to: "/community" as const, icon: "🌍" },
            { label: "AI Mentor", to: "/mentor" as const, icon: "🤖" },
          ].map((m) => (
            <Link key={m.label} to={m.to} className="bg-white border border-brand-navy/5 rounded-2xl p-4 hover:shadow-md transition-shadow text-center">
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="text-xs font-bold">{m.label}</div>
            </Link>
          ))}
        </section>

        {isLoading && <p className="text-brand-navy/60">Loading…</p>}

        {data && (
          <>
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold">Your courses</h2>
                <Link to="/courses" className="text-sm font-bold text-brand-orange">Browse all →</Link>
              </div>
              {data.enrollments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-brand-navy/15 p-12 text-center bg-white">
                  <p className="font-display text-xl font-bold">No courses yet</p>
                  <p className="text-brand-navy/60 text-sm mt-2">Pick your first course to get started.</p>
                  <Link to="/courses" className="mt-6 inline-flex px-6 py-3 bg-brand-orange text-white rounded-full font-bold">
                    Explore courses
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.enrollments.map((e: any) => {
                    const total = data.lessonsByCourse[e.course_id] ?? 0;
                    const done = data.completedByCourse[e.course_id] ?? 0;
                    const pct = total ? Math.round((done / total) * 100) : 0;
                    return (
                      <Link
                        key={e.course_id}
                        to="/courses/$courseId"
                        params={{ courseId: e.course_id }}
                        className="bg-white p-6 rounded-3xl border border-brand-navy/5 hover:shadow-xl hover:shadow-brand-navy/5 transition-all"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-orange mb-2">{e.courses?.level}</p>
                        <h3 className="font-display text-lg font-bold mb-2">{e.courses?.title}</h3>
                        <p className="text-sm text-brand-navy/60 mb-6 line-clamp-2">{e.courses?.summary}</p>
                        <div className="flex items-center justify-between text-xs font-semibold text-brand-navy/60 mb-2">
                          <span>{done}/{total} lessons</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-brand-clay rounded-full overflow-hidden">
                          <div className="h-full bg-brand-orange" style={{ width: `${pct}%` }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold">Certificates</h2>
                <Link to="/certificates" className="text-sm font-bold text-brand-orange">View all →</Link>
              </div>
              {data.certificates.length === 0 ? (
                <p className="text-brand-navy/60 text-sm">Pass a course quiz to earn your first certificate.</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {data.certificates.slice(0, 3).map((c: any) => (
                    <div key={c.id} className="p-6 rounded-3xl bg-brand-navy text-white">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-mint mb-2">Certified</p>
                      <p className="font-display font-bold text-lg">{c.courses?.title}</p>
                      <p className="font-mono text-xs text-white/40 mt-3">{c.code}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
