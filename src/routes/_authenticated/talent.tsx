import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { canBrowseTalent, searchTalent } from "@/lib/api/talent.functions";

export const Route = createFileRoute("/_authenticated/talent")({
  head: () => ({
    meta: [
      { title: "Talent directory · Pioneer Africa Hub" },
      { name: "description", content: "Discover African student builders by skill, university and proven innovation activity." },
    ],
  }),
  component: TalentPage,
});

const OPEN_TO = [
  { id: "", label: "Anything" },
  { id: "internship", label: "Internships" },
  { id: "job", label: "Graduate roles" },
  { id: "collaboration", label: "Collaboration" },
  { id: "mentorship", label: "Mentorship" },
];

function TalentPage() {
  const accessFn = useServerFn(canBrowseTalent);
  const searchFn = useServerFn(searchTalent);

  const { data: access, isLoading: accessLoading } = useQuery({ queryKey: ["talent-access"], queryFn: () => accessFn() });

  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const [openTo, setOpenTo] = useState("");
  const [minScore, setMinScore] = useState(0);

  const { data: people, isFetching } = useQuery({
    queryKey: ["talent", q, skill, openTo, minScore],
    queryFn: () => searchFn({ data: { q, skill, openTo: openTo as "" | "internship", minScore } }),
    enabled: !!access?.allowed,
  });

  if (accessLoading) {
    return (
      <div className="min-h-dvh bg-brand-bg text-brand-navy">
        <SiteNav />
        <p className="max-w-3xl mx-auto px-6 py-16 text-brand-navy/60">Checking access…</p>
      </div>
    );
  }

  if (!access?.allowed) {
    return (
      <div className="min-h-dvh bg-brand-bg text-brand-navy">
        <SiteNav />
        <main className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4">
          <h1 className="font-display text-3xl font-bold">Talent directory is for partners</h1>
          <p className="text-brand-navy/70">
            Organisations hiring interns, funding projects or scouting for hackathons get access to browse opted-in student builders.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link to="/request-access" className="px-6 py-3 rounded-full bg-brand-navy text-white font-semibold">Request partner access</Link>
            <Link to="/portfolio" className="px-6 py-3 rounded-full bg-brand-clay font-semibold">Get listed instead</Link>
          </div>
        </main>
      </div>
    );
  }

  const field = "h-12 px-4 rounded-xl bg-white border border-brand-navy/10 text-sm focus:outline-none focus:border-brand-orange";

  return (
    <div className="min-h-dvh bg-brand-bg text-brand-navy">
      <SiteNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-orange">Partner tools</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">Talent directory</h1>
          <p className="text-brand-navy/70 max-w-2xl">
            Every person here opted in. Ranked by innovation score — real projects shipped, challenges entered, courses finished and community contribution.
          </p>
        </header>

        <div className="bg-white rounded-3xl border border-brand-navy/5 p-4 sm:p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className={field} placeholder="Name, headline, university…" value={q} onChange={(e) => setQ(e.target.value)} />
          <input className={field} placeholder="Skill (e.g. Python)" value={skill} onChange={(e) => setSkill(e.target.value)} />
          <select className={field} value={openTo} onChange={(e) => setOpenTo(e.target.value)}>
            {OPEN_TO.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <label className="flex flex-col justify-center text-xs font-semibold text-brand-navy/60">
            Min innovation score: <span className="text-brand-navy">{minScore}</span>
            <input type="range" min={0} max={200} step={10} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="accent-brand-orange" />
          </label>
        </div>

        {isFetching && <p className="text-sm text-brand-navy/60">Searching…</p>}

        {people && people.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-brand-navy/15 p-12 text-center bg-white">
            <p className="font-display text-lg font-bold">No builders match yet</p>
            <p className="text-sm text-brand-navy/70 mt-1">Loosen the filters — the directory grows as students opt in.</p>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(people ?? []).map((p) => (
              <li key={p.user_id}>
                <Link
                  to="/u/$userId"
                  params={{ userId: p.user_id }}
                  className="block h-full bg-white rounded-3xl border border-brand-navy/5 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="size-12 rounded-full bg-brand-clay flex items-center justify-center font-display font-bold text-brand-navy/50 overflow-hidden">
                      {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.display_name ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-brand-orange/15 text-brand-orange text-xs font-bold" title="Innovation score">
                      {p.score} pts
                    </span>
                  </div>
                  <p className="font-display font-bold mt-3">{p.display_name ?? "Builder"}</p>
                  {p.headline && <p className="text-sm text-brand-navy/70 mt-1 line-clamp-2">{p.headline}</p>}
                  <p className="text-xs text-brand-navy/50 mt-2">
                    {[p.university, p.study_year, p.country].filter(Boolean).join(" · ")}
                  </p>
                  {(p.skills ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {p.skills.slice(0, 4).map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-clay text-brand-navy/70">{s}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-brand-navy/50 mt-3">{p.projects_count} project{p.projects_count === 1 ? "" : "s"} shipped</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
