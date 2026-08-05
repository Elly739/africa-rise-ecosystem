import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/site-nav";
import { listMyApplications } from "@/lib/api/careers.functions";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({ meta: [{ title: "My Applications · Pioneer Africa Hub" }] }),
  component: MyApplicationsPage,
});

const COLUMNS: { id: string; label: string }[] = [
  { id: "submitted", label: "Submitted" },
  { id: "reviewing", label: "Reviewing" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
];

function MyApplicationsPage() {
  const fn = useServerFn(listMyApplications);
  const { data, isLoading } = useQuery({ queryKey: ["my-applications"], queryFn: () => fn() });

  const grouped = COLUMNS.map((c) => ({
    ...c,
    items: (data ?? []).filter((a: any) => (a.status || "submitted").toLowerCase() === c.id),
  }));

  return (
    <div className="min-h-dvh bg-brand-bg text-brand-navy">
      <SiteNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-orange">Career Bridge</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">My applications</h1>
          <p className="text-brand-navy/70 text-sm">Track every opportunity you've applied to in one place.</p>
        </header>

        {isLoading && <p className="text-brand-navy/60">Loading…</p>}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="rounded-3xl border border-dashed border-brand-navy/15 p-12 text-center bg-white">
            <p className="font-display text-xl font-bold">Nothing here yet</p>
            <p className="text-brand-navy/60 text-sm mt-2">Apply to your first opportunity to start tracking.</p>
            <Link to="/careers" className="mt-6 inline-flex px-6 py-3 bg-brand-orange text-white rounded-full font-bold">
              Browse careers
            </Link>
          </div>
        )}

        {(data?.length ?? 0) > 0 && (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {grouped.map((col) => (
              <section key={col.id} aria-label={col.label} className="bg-white rounded-3xl border border-brand-navy/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-bold text-sm uppercase tracking-wider">{col.label}</h2>
                  <span className="text-xs font-bold text-brand-navy/50">{col.items.length}</span>
                </div>
                <ul className="space-y-2">
                  {col.items.map((a: any) => (
                    <li key={a.id} className="p-3 rounded-2xl border border-brand-navy/5 bg-brand-bg">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">{a.opportunities?.type}</p>
                      <p className="font-display font-bold text-sm mt-0.5 line-clamp-2">{a.opportunities?.title}</p>
                      <p className="text-xs text-brand-navy/60 mt-1">{a.opportunities?.organization}</p>
                      <p className="text-[10px] text-brand-navy/40 mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
                    </li>
                  ))}
                  {col.items.length === 0 && <li className="text-xs text-brand-navy/40 italic px-1 py-2">None</li>}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
