import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listCourses } from "@/lib/api/learn.functions";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import heroImage from "@/assets/hero-student.jpg";

const coursesQuery = queryOptions({
  queryKey: ["courses", "landing"],
  queryFn: () => listCourses(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillBridge Africa — Bridging learning and opportunity" },
      { name: "description", content: "A digital growth ecosystem for African students and young innovators. Master in-demand skills, build real projects, launch your career." },
      { property: "og:title", content: "SkillBridge Africa" },
      { property: "og:description", content: "Bridging the gap between learning and opportunity for young Africans." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(coursesQuery),
  component: Landing,
});

const levelLabel: Record<string, string> = {
  fundamental: "Fundamental",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function Landing() {
  const { data: courses } = useSuspenseQuery(coursesQuery);
  const featured = courses.slice(0, 2);

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-navy">
      <SiteNav />

      {/* Hero */}
      <header className="px-6 pt-12 pb-20 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-block px-3 py-1 bg-brand-mint/20 text-brand-mint border border-brand-mint/30 rounded-full text-xs font-bold uppercase tracking-wider">
            Beta · Launching across Africa
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight text-balance">
            Bridging the gap between <span className="text-brand-orange">learning</span> and opportunity.
          </h1>
          <p className="text-lg md:text-xl text-brand-navy/70 max-w-lg">
            A digital growth ecosystem empowering the next generation of African innovators with industry-ready skills and direct career pathways.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/courses"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-transform"
            >
              Explore Courses
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-clay text-brand-navy rounded-2xl font-bold text-lg border border-brand-navy/5 hover:bg-brand-clay/80 transition-all"
            >
              Join the Community
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-brand-navy/10 outline outline-1 outline-black/5 -outline-offset-1 bg-brand-clay">
            <img
              src={heroImage}
              alt="A young African student working on a laptop in a modern co-working space"
              width={1024}
              height={1280}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-brand-clay max-w-[260px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-3 bg-brand-mint rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-brand-navy/40 uppercase tracking-wider">Live now</span>
            </div>
            <p className="font-semibold leading-snug">Digital Product Design Foundations</p>
            <div className="mt-4 h-1.5 w-full bg-brand-clay rounded-full overflow-hidden">
              <div className="h-full bg-brand-orange w-3/4"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Learn module */}
      <section className="bg-brand-navy text-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-4">
              <h2 className="font-display text-4xl md:text-5xl font-bold">The Learn Module</h2>
              <p className="text-white/60 max-w-md">
                Master in-demand skills through structured paths designed by industry experts across the continent.
              </p>
            </div>
            <Link to="/courses" className="text-brand-mint font-bold flex items-center gap-2 group hover:gap-3 transition-all">
              View all {courses.length} subjects <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featured.map((c, i) => (
              <Link
                key={c.id}
                to="/courses/$courseId"
                params={{ courseId: c.id }}
                className="group bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors flex flex-col"
              >
                <div className={`size-12 ${i === 0 ? "bg-brand-mint/20" : "bg-brand-orange/20"} rounded-2xl flex items-center justify-center mb-6`}>
                  <div className={`size-6 border-2 ${i === 0 ? "border-brand-mint rounded-md" : "border-brand-orange rounded-full"}`}></div>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-0.5 rounded ${i === 0 ? "bg-brand-mint/20 text-brand-mint" : "bg-brand-orange/20 text-brand-orange"} text-[10px] font-bold uppercase`}>
                    {levelLabel[c.level] ?? c.level}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 font-display">{c.title}</h3>
                <p className="text-white/50 text-sm mb-8 flex-1">{c.summary}</p>
                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/60">Start learning</span>
                  <span aria-hidden className="text-brand-mint">→</span>
                </div>
              </Link>
            ))}

            <div className="group bg-brand-orange p-8 rounded-3xl text-brand-navy flex flex-col">
              <h3 className="text-2xl font-display font-bold leading-tight mb-4">Ready to certify your expertise?</h3>
              <p className="text-brand-navy/80 text-sm mb-12 flex-1">
                Complete a course and a passing quiz to earn a verifiable SkillBridge certificate.
              </p>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="w-full py-4 bg-brand-navy text-white rounded-2xl font-bold text-center"
              >
                Join the Academy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="font-display text-4xl font-bold mb-6">A complete growth journey</h2>
          <p className="text-brand-navy/60">
            Beyond learning, we're building the infrastructure to build, connect with mentors, and launch your career — all in one ecosystem.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { icon: "📖", label: "Learn", desc: "Expert-led courses and interactive quizzes.", active: true },
            { icon: "🛠️", label: "Build", desc: "Sandbox environments for real-world projects.", active: false },
            { icon: "🤝", label: "Connect", desc: "Peer-to-peer mentoring and networking.", active: false },
            { icon: "🚀", label: "Launch", desc: "Job placement and venture incubation.", active: false },
          ].map((p) => (
            <div key={p.label} className={`text-center space-y-4 ${p.active ? "" : "opacity-40"}`}>
              <div className={`size-16 bg-white ${p.active ? "border-2 border-brand-clay" : "border border-brand-clay"} rounded-2xl flex items-center justify-center mx-auto text-2xl`}>
                {p.icon}
              </div>
              <h4 className="font-display font-bold text-lg">{p.label}</h4>
              <p className="text-xs text-brand-navy/50 max-w-[180px] mx-auto">{p.desc}</p>
              {!p.active && <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand-navy/40">Roadmap</span>}
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
