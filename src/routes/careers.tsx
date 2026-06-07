import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
      { name: "description", content: "Search internships, jobs, and scholarships across Africa — filter by remote, location, and skill tags." },
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
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const locations = useMemo(() => {
    const set = new Set<string>();
    opps.forEach((o: any) => o.location && set.add(o.location));
    return Array.from(set).sort();
  }, [opps]);

  const allTags = useMemo(() => {
    const m = new Map<string, number>();
    opps.forEach((o: any) => (o.tags ?? []).forEach((t: string) => m.set(t, (m.get(t) ?? 0) + 1)));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [opps]);

  const filtered = opps.filter((o: any) => {
    if (tab !== "all" && o.type !== tab) return false;
    if (remoteOnly && !o.remote) return false;
    if (location !== "all" && o.location !== location) return false;
    if (activeTag && !(o.tags ?? []).includes(activeTag)) return false;
    if (q.trim()) {
      const needle = q.toLowerCase();
      const hay = `${o.title} ${o.organization} ${o.description} ${(o.tags ?? []).join(" ")}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  const clearAll = () => { setTab("all"); setQ(""); setLocation("all"); setRemoteOnly(false); setActiveTag(null); };
  const hasFilters = tab !== "all" || q || location !== "all" || remoteOnly || activeTag;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy">
      <SiteNav />

      <header className="px-4 sm:px-6 pt-12 sm:pt-16 pb-10 max-w-7xl mx-auto">
        <div className="inline-block px-3 py-1 bg-brand-orange/15 text-brand-orange rounded-full text-xs font-bold uppercase tracking-wider mb-5">
          Career Bridge
        </div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight max-w-3xl">
          Turn your skills into <span className="text-brand-orange">opportunities</span>.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-brand-navy/60 max-w-2xl">
          Curated internships, jobs, and scholarships from organizations building the future across Africa.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/cv" className="px-5 py-2.5 bg-brand-navy text-white rounded-full text-sm font-semibold hover:bg-brand-navy/90">Build your CV</Link>
          <Link to="/advisor" className="px-5 py-2.5 bg-brand-clay text-brand-navy rounded-full text-sm font-semibold border border-brand-navy/10 hover:bg-brand-clay/70">Talk to AI Advisor</Link>
        </div>
      </header>

      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Search + filters bar */}
        <div className="bg-white rounded-3xl border border-brand-navy/5 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search role, company, skill…"
                className="w-full pl-11 pr-4 h-12 rounded-xl bg-brand-bg border border-brand-navy/10 text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-12 px-4 rounded-xl bg-brand-bg border border-brand-navy/10 text-sm font-medium focus:outline-none focus:border-brand-orange"
            >
              <option value="all">All locations</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <label className="flex items-center gap-2 px-4 h-12 rounded-xl bg-brand-bg border border-brand-navy/10 cursor-pointer text-sm font-medium">
              <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} className="accent-brand-orange" />
              Remote only
            </label>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-colors ${
                  tab === t.id ? "bg-brand-navy text-white" : "bg-brand-clay text-brand-navy hover:bg-brand-clay/70"
                }`}
              >{t.label}</button>
            ))}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-brand-navy/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy/40 self-center mr-1">Skills:</span>
              {allTags.map(([t]) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    activeTag === t ? "bg-brand-orange text-white border-brand-orange" : "border-brand-navy/10 text-brand-navy/70 hover:border-brand-orange"
                  }`}
                >{t}</button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6 mb-4">
          <p className="text-sm text-brand-navy/60"><span className="font-bold text-brand-navy">{filtered.length}</span> {filtered.length === 1 ? "opportunity" : "opportunities"}</p>
          {hasFilters && (
            <button onClick={clearAll} className="text-xs font-bold text-brand-orange hover:underline">Clear filters</button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-brand-navy/15 p-12 text-center bg-white">
            <p className="font-display text-lg font-bold">No matches</p>
            <p className="text-sm text-brand-navy/60 mt-1">Try clearing some filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 sm:gap-5 pb-24">
            {filtered.map((o: any) => (
              <article key={o.id} className="bg-white border border-brand-navy/5 rounded-2xl p-5 sm:p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    o.type === "scholarship" ? "bg-brand-mint/20 text-brand-mint" :
                    o.type === "internship" ? "bg-brand-orange/20 text-brand-orange" :
                    "bg-brand-navy/10 text-brand-navy"
                  }`}>{o.type}</span>
                  {o.remote && <span className="text-[10px] font-bold uppercase tracking-wider text-brand-mint">● Remote</span>}
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold leading-snug mb-1">{o.title}</h3>
                <p className="text-sm text-brand-navy/60 mb-3">{o.organization}{o.location ? ` · ${o.location}` : ""}</p>
                <p className="text-sm text-brand-navy/70 line-clamp-2 mb-4">{o.description}</p>
                {(o.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(o.tags ?? []).slice(0, 4).map((t: string) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-brand-clay rounded-full text-brand-navy/70">{t}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-brand-navy/5">
                  <span className="text-xs text-brand-navy/40">
                    {o.deadline ? `By ${new Date(o.deadline).toLocaleDateString()}` : "Rolling"}
                  </span>
                  {o.apply_url && (
                    <a href={o.apply_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-brand-orange hover:underline">Apply →</a>
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
