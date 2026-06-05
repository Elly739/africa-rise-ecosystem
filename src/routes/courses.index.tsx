import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { listCourses, listSubjects } from "@/lib/api/learn.functions";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

const dataQuery = queryOptions({
  queryKey: ["catalogue"],
  queryFn: async () => {
    const [courses, subjects] = await Promise.all([listCourses(), listSubjects()]);
    return { courses, subjects };
  },
});

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "Courses · SkillBridge Africa" },
      { name: "description", content: "Browse expert-led courses across engineering, design, data, and business — built for African innovators." },
      { property: "og:title", content: "Courses · SkillBridge Africa" },
      { property: "og:description", content: "Expert-led learning paths for the African digital economy." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dataQuery),
  component: CoursesPage,
});

const levelLabel: Record<string, string> = { fundamental: "Fundamental", intermediate: "Intermediate", advanced: "Advanced" };

function CoursesPage() {
  const { data } = useSuspenseQuery(dataQuery);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  const filtered = useMemo(
    () => (subjectFilter ? data.courses.filter((c) => c.subject_id === subjectFilter) : data.courses),
    [data.courses, subjectFilter]
  );

  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy">
      <SiteNav />

      <header className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-orange mb-3">Learn module</p>
        <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight max-w-2xl">
          Skills designed for Africa's digital economy.
        </h1>
        <p className="mt-4 text-lg text-brand-navy/60 max-w-xl">
          Pick a subject and start with a single lesson. Earn certificates as you go.
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setSubjectFilter(null)}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            !subjectFilter
              ? "bg-brand-navy text-white border-brand-navy"
              : "bg-white text-brand-navy border-brand-navy/10 hover:border-brand-navy/30"
          }`}
        >
          All subjects
        </button>
        {data.subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => setSubjectFilter(s.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              subjectFilter === s.id
                ? "bg-brand-navy text-white border-brand-navy"
                : "bg-white text-brand-navy border-brand-navy/10 hover:border-brand-navy/30"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c, i) => {
            const accent = i % 2 === 0 ? "mint" : "orange";
            return (
              <Link
                key={c.id}
                to="/courses/$courseId"
                params={{ courseId: c.id }}
                className="group bg-white border border-brand-navy/5 p-8 rounded-3xl hover:shadow-xl hover:shadow-brand-navy/5 transition-all flex flex-col"
              >
                <div className={`size-12 ${accent === "mint" ? "bg-brand-mint/20" : "bg-brand-orange/20"} rounded-2xl flex items-center justify-center mb-6`}>
                  <div className={`size-6 border-2 ${accent === "mint" ? "border-brand-mint rounded-md" : "border-brand-orange rounded-full"}`}></div>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-0.5 rounded ${accent === "mint" ? "bg-brand-mint/20 text-brand-mint" : "bg-brand-orange/20 text-brand-orange"} text-[10px] font-bold uppercase`}>
                    {levelLabel[c.level] ?? c.level}
                  </span>
                </div>
                <h3 className="text-xl font-display font-bold mb-2">{c.title}</h3>
                <p className="text-brand-navy/60 text-sm mb-8 flex-1">{c.summary}</p>
                <div className="pt-6 border-t border-brand-navy/10 flex items-center justify-between text-sm font-semibold">
                  <span>Open course</span>
                  <span aria-hidden className="text-brand-orange">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
