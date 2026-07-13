import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDashboard } from "@/lib/api/learn.functions";
import { getForYou } from "@/lib/api/personalization.functions";
import { SiteNav } from "@/components/site-nav";
import learnImg from "@/assets/module-learn.jpg";
import careersImg from "@/assets/module-careers.jpg";
import innovateImg from "@/assets/module-innovate.jpg";
import communityImg from "@/assets/module-community.jpg";
import mentorImg from "@/assets/module-mentor.jpg";
import challengesImg from "@/assets/module-challenges.jpg";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
const PRIVILEGED: AppRole[] = ["admin", "moderator", "teacher", "partner"];

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · SkillBridge Africa" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getDashboard);
  const forYouFn = useServerFn(getForYou);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });
  const { data: forYou } = useQuery({ queryKey: ["for-you"], queryFn: () => forYouFn() });

  return (
    <div className="min-h-dvh bg-brand-bg text-brand-navy">
      <SiteNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 sm:space-y-12">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-orange">Welcome back</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold break-words">
            {data?.profile?.display_name ?? "Learner"}
          </h1>
          <p className="text-brand-navy/70 text-sm sm:text-base">Keep your momentum — your future self will thank you.</p>
        </header>

        {/* Ecosystem quick-jump */}
        <section aria-labelledby="ecosystem-heading">
          <h2 id="ecosystem-heading" className="sr-only">Ecosystem quick links</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { label: "Courses", desc: "Learn", to: "/courses" as const, img: learnImg },
              { label: "Careers", desc: "Apply", to: "/careers" as const, img: careersImg },
              { label: "Innovate", desc: "Build", to: "/innovate" as const, img: innovateImg },
              { label: "Challenges", desc: "Compete", to: "/challenges" as const, img: challengesImg },
              { label: "Community", desc: "Connect", to: "/community" as const, img: communityImg },
              { label: "AI Mentor", desc: "Get coached", to: "/mentor" as const, img: mentorImg },
            ].map((m) => (
              <li key={m.label}>
                <Link
                  to={m.to}
                  aria-label={`${m.label} — ${m.desc}`}
                  className="group relative block aspect-[4/5] rounded-2xl overflow-hidden border border-brand-navy/5 hover:shadow-xl hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
                >
                  <img
                    src={m.img}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    width={800}
                    height={1000}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-brand-navy/10" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand-mint">{m.desc}</div>
                    <div className="font-display font-bold text-sm leading-tight mt-0.5">{m.label}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* For You — personalized recs */}
        {forYou && (forYou.opportunities.length > 0 || forYou.challenges.length > 0 || forYou.courses.length > 0) && (
          <section aria-labelledby="for-you-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="for-you-heading" className="font-display text-2xl font-bold">For you</h2>
                <p className="text-sm text-brand-navy/60">
                  {forYou.interests.length > 0
                    ? `Picked from your interests: ${forYou.interests.slice(0, 4).join(", ")}`
                    : "Pick your interests in settings to sharpen these picks."}
                </p>
              </div>
              <Link to="/welcome" className="text-xs font-bold text-brand-orange">Update interests →</Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {forYou.opportunities.slice(0, 3).map((o: any) => (
                <Link
                  key={o.id}
                  to="/careers"
                  className="p-5 rounded-3xl bg-white border border-brand-navy/5 hover:shadow-lg transition-all"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">{o.type}</p>
                  <p className="font-display font-bold mt-1 line-clamp-2">{o.title}</p>
                  <p className="text-xs text-brand-navy/60 mt-1">{o.organization}{o.location ? ` · ${o.location}` : ""}</p>
                </Link>
              ))}
              {forYou.challenges.slice(0, 2).map((c: any) => (
                <Link
                  key={c.id}
                  to="/challenges/$slug"
                  params={{ slug: c.slug }}
                  className="p-5 rounded-3xl bg-brand-navy text-white hover:shadow-lg transition-all"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-mint">Challenge</p>
                  <p className="font-display font-bold mt-1 line-clamp-2">{c.title}</p>
                  <p className="text-xs text-white/70 mt-1 line-clamp-2">{c.description}</p>
                </Link>
              ))}
              {forYou.courses.slice(0, 3).map((c: any) => (
                <Link
                  key={c.id}
                  to="/courses/$courseId"
                  params={{ courseId: c.id }}
                  className="p-5 rounded-3xl bg-brand-clay border border-brand-navy/5 hover:shadow-lg transition-all"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-navy/50">{c.level ?? "Course"}</p>
                  <p className="font-display font-bold mt-1 line-clamp-2">{c.title}</p>
                  <p className="text-xs text-brand-navy/60 mt-1 line-clamp-2">{c.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        )}


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
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {data.enrollments.map((e: any) => {
                    const total = data.lessonsByCourse[e.course_id] ?? 0;
                    const done = data.completedByCourse[e.course_id] ?? 0;
                    const pct = total ? Math.round((done / total) * 100) : 0;
                    return (
                      <Link
                        key={e.course_id}
                        to="/courses/$courseId"
                        params={{ courseId: e.course_id }}
                        aria-label={`${e.courses?.title} — ${pct}% complete`}
                        className="bg-white p-6 rounded-3xl border border-brand-navy/5 hover:shadow-xl hover:shadow-brand-navy/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-orange mb-2">{e.courses?.level}</p>
                        <h3 className="font-display text-lg font-bold mb-2">{e.courses?.title}</h3>
                        <p className="text-sm text-brand-navy/70 mb-6 line-clamp-2">{e.courses?.summary}</p>
                        <div className="flex items-center justify-between text-xs font-semibold text-brand-navy/70 mb-2">
                          <span>{done}/{total} lessons</span>
                          <span aria-hidden="true">{pct}%</span>
                        </div>
                        <div
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Course progress: ${pct} percent`}
                          className="h-1.5 bg-brand-clay rounded-full overflow-hidden"
                        >
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
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.certificates.slice(0, 3).map((c: any) => (
                    <li key={c.id} className="p-6 rounded-3xl bg-brand-navy text-white">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-mint mb-2">Certified</p>
                      <p className="font-display font-bold text-lg">{c.courses?.title}</p>
                      <p className="font-mono text-xs text-white/70 mt-3">{c.code}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
