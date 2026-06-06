import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { listOpportunities } from "@/lib/api/ecosystem.functions";

const oppsQuery = queryOptions({
  queryKey: ["opportunities", "all"],
  queryFn: () => listOpportunities({ data: {} }),
});

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Career Bridge — SkillBridge Africa" },
      { name: "description", content: "Internships, jobs, and scholarships across Africa — turn your skills into opportunities." },
      { property: "og:title", content: "Career Bridge — SkillBridge Africa" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(oppsQuery),
  component: CareersPage,
});

type Tab = "all" | "internship" | "job" | "scholarship";
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "internship", label: "Internships" },
  { id: "job", label: "Jobs" },
  { id: "scholarship", label: "Scholarships" },
];

function CareersPage() {
  const { data: opps } = useSuspenseQuery(oppsQuery);
  const [tab, setTab] = useState<Tab>("all");
  const filtered = tab === "all" ? opps : opps.filter((o) => o.type === tab);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy">
      <SiteNav />

      <header className="px-6 pt-16 pb-12 max-w-7xl mx-auto">
        <div className="inline-block px-3 py-1 bg-brand-orange/15 text-brand-orange rounded-full text-xs font-bold uppercase tracking-wider mb-6">
          Career Bridge
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight max-w-3xl">
          Turn your skills into <span className="text-brand-orange">opportunities</span>.
        </h1>
        <p className="mt-6 text-lg text-brand-navy/60 max-w-2xl">
          Curated internships, jobs, and scholarships from organizations building the future across Africa.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/cv" className="px-6 py-3 bg-brand-navy text-white rounded-full font-semibold hover:bg-brand-navy/90">
            Build your CV
          </Link>
          <Link to="/advisor" className="px-6 py-3 bg-brand-clay text-brand-navy rounded-full font-semibold border border-brand-navy/10 hover:bg-brand-clay/70">
            Talk to AI Career Advisor
          </Link>
        </div>
      </header>

      <div className="px-6 max-w-7xl mx-auto">
        <div className="flex gap-2 border-b border-brand-navy/10 mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 font-semibold text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t.id ? "border-brand-orange text-brand-navy" : "border-transparent text-brand-navy/50 hover:text-brand-navy"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-20 text-center text-brand-navy/50">No opportunities in this category yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-5 pb-24">
            {filtered.map((o) => (
              <article key={o.id} className="bg-white border border-brand-navy/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    o.type === "scholarship" ? "bg-brand-mint/20 text-brand-mint" :
                    o.type === "internship" ? "bg-brand-orange/20 text-brand-orange" :
                    "bg-brand-navy/10 text-brand-navy"
                  }`}>{o.type}</span>
                  {o.remote && <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy/40">Remote</span>}
                </div>
                <h3 className="font-display text-xl font-bold leading-snug mb-1">{o.title}</h3>
                <p className="text-sm text-brand-navy/60 mb-3">{o.organization}{o.location ? ` · ${o.location}` : ""}</p>
                <p className="text-sm text-brand-navy/70 line-clamp-2 mb-4">{o.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-navy/40">
                    {o.deadline ? `Apply by ${new Date(o.deadline).toLocaleDateString()}` : "Rolling"}
                  </span>
                  {o.apply_url && (
                    <a href={o.apply_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-brand-orange hover:underline">
                      Apply →
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
