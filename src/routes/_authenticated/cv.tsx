import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site-nav";
import { getMyCV, saveMyCV } from "@/lib/api/ecosystem.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cv")({
  head: () => ({ meta: [{ title: "CV Builder — Pioneer Africa Hub" }] }),
  component: CVPage,
});

type CV = {
  fullName: string; headline: string; email: string; phone: string; location: string;
  summary: string; skills: string; experience: string; education: string; projects: string; links: string;
};

const EMPTY: CV = { fullName: "", headline: "", email: "", phone: "", location: "", summary: "", skills: "", experience: "", education: "", projects: "", links: "" };

function CVPage() {
  const load = useServerFn(getMyCV);
  const save = useServerFn(saveMyCV);
  const [cv, setCv] = useState<CV>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load().then((row) => { if (row?.data) setCv({ ...EMPTY, ...(row.data as Partial<CV>) }); }).finally(() => setLoading(false));
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try { await save({ data: { data: cv } }); toast.success("CV saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen bg-brand-bg"><SiteNav /><div className="p-10 text-brand-navy/40">Loading…</div></div>;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy">
      <SiteNav />
      <div className="px-6 py-10 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-block px-3 py-1 bg-brand-orange/15 text-brand-orange rounded-full text-xs font-bold uppercase tracking-wider mb-3">Career Bridge</div>
            <h1 className="font-display text-4xl font-bold">CV Builder</h1>
            <p className="text-brand-navy/60 mt-1">Craft a CV that bridges your skills to opportunities.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-brand-orange text-white rounded-full font-bold disabled:opacity-60">
            {saving ? "Saving…" : "Save CV"}
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div className="space-y-4">
            <Row label="Full name"><input value={cv.fullName} onChange={(e) => setCv({ ...cv, fullName: e.target.value })} className={inp} /></Row>
            <Row label="Headline"><input placeholder="e.g. Full-stack engineer · Lagos" value={cv.headline} onChange={(e) => setCv({ ...cv, headline: e.target.value })} className={inp} /></Row>
            <div className="grid grid-cols-2 gap-4">
              <Row label="Email"><input type="email" value={cv.email} onChange={(e) => setCv({ ...cv, email: e.target.value })} className={inp} /></Row>
              <Row label="Phone"><input value={cv.phone} onChange={(e) => setCv({ ...cv, phone: e.target.value })} className={inp} /></Row>
            </div>
            <Row label="Location"><input value={cv.location} onChange={(e) => setCv({ ...cv, location: e.target.value })} className={inp} /></Row>
            <Row label="Summary"><textarea rows={4} value={cv.summary} onChange={(e) => setCv({ ...cv, summary: e.target.value })} className={inp} /></Row>
            <Row label="Skills (comma-separated)"><textarea rows={2} value={cv.skills} onChange={(e) => setCv({ ...cv, skills: e.target.value })} className={inp} /></Row>
            <Row label="Experience"><textarea rows={6} value={cv.experience} onChange={(e) => setCv({ ...cv, experience: e.target.value })} className={inp} /></Row>
            <Row label="Education"><textarea rows={4} value={cv.education} onChange={(e) => setCv({ ...cv, education: e.target.value })} className={inp} /></Row>
            <Row label="Projects"><textarea rows={4} value={cv.projects} onChange={(e) => setCv({ ...cv, projects: e.target.value })} className={inp} /></Row>
            <Row label="Links (one per line)"><textarea rows={3} value={cv.links} onChange={(e) => setCv({ ...cv, links: e.target.value })} className={inp} /></Row>
          </div>

          {/* Preview */}
          <div className="bg-white border border-brand-navy/5 rounded-3xl p-10 sticky top-24 self-start max-h-[80vh] overflow-y-auto">
            <h2 className="font-display text-3xl font-bold">{cv.fullName || "Your name"}</h2>
            <p className="text-brand-orange font-semibold">{cv.headline || "Your headline"}</p>
            <p className="text-sm text-brand-navy/60 mt-1">{[cv.email, cv.phone, cv.location].filter(Boolean).join(" · ")}</p>
            {cv.summary && <Section title="Summary"><p className="whitespace-pre-wrap">{cv.summary}</p></Section>}
            {cv.skills && <Section title="Skills"><div className="flex flex-wrap gap-1.5">{cv.skills.split(",").map((s, i) => s.trim() && <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-brand-clay">{s.trim()}</span>)}</div></Section>}
            {cv.experience && <Section title="Experience"><p className="whitespace-pre-wrap">{cv.experience}</p></Section>}
            {cv.education && <Section title="Education"><p className="whitespace-pre-wrap">{cv.education}</p></Section>}
            {cv.projects && <Section title="Projects"><p className="whitespace-pre-wrap">{cv.projects}</p></Section>}
            {cv.links && <Section title="Links"><p className="whitespace-pre-wrap text-brand-orange">{cv.links}</p></Section>}
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-white focus:outline-none focus:border-brand-orange";
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-2">{label}</span>{children}</label>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mt-6"><h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/50 mb-2">{title}</h3><div className="text-sm text-brand-navy/80">{children}</div></div>;
}
