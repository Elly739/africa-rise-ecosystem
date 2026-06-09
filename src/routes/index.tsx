import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listCourses } from "@/lib/api/learn.functions";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import heroImage from "@/assets/hero-student.jpg";
import learnImg from "@/assets/module-learn.jpg";
import careersImg from "@/assets/module-careers.jpg";
import innovateImg from "@/assets/module-innovate.jpg";
import communityImg from "@/assets/module-community.jpg";
import mentorImg from "@/assets/module-mentor.jpg";
import challengesImg from "@/assets/module-challenges.jpg";

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
          <h2 className="font-display text-4xl font-bold mb-6">The full growth loop</h2>
          <p className="text-brand-navy/60">
            Learn → Build → Connect → Apply → Innovate → Repeat. Every layer of the ecosystem is live.
          </p>
        </div>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[
            { img: learnImg, label: "Learn", desc: "Courses, quizzes, and certificates.", to: "/courses" as const, tag: "Step 01" },
            { img: careersImg, label: "Career Bridge", desc: "Internships, jobs, scholarships, CV builder, AI advisor.", to: "/careers" as const, tag: "Step 02" },
            { img: innovateImg, label: "Innovate", desc: "Showcase projects, find collaborators, ship ideas.", to: "/innovate" as const, tag: "Step 03" },
            { img: challengesImg, label: "Challenges", desc: "Compete in hackathons. Form teams. Win prizes.", to: "/challenges" as const, tag: "Step 04" },
            { img: communityImg, label: "Community", desc: "Discussions, peer mentorship, study groups.", to: "/community" as const, tag: "Step 05" },
            { img: mentorImg, label: "AI Mentor", desc: "Personalized learning paths and on-demand coaching.", to: "/auth" as const, tag: "Step 06" },
          ].map((p) => (
            <li key={p.label}>
              <Link
                to={p.to}
                {...(p.to === "/auth" ? { search: { mode: "signup" as const } } : {})}
                aria-label={`${p.label}: ${p.desc}`}
                className="group block bg-white border border-brand-clay rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-brand-clay">
                  <img src={p.img} alt="" aria-hidden="true" loading="lazy" width={800} height={500} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-[10px] font-bold uppercase tracking-wider text-brand-navy">{p.tag}</div>
                </div>
                <div className="p-6">
                  <h3 className="font-display font-bold text-lg">{p.label}</h3>
                  <p className="text-sm text-brand-navy/70 mt-2 leading-relaxed">{p.desc}</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-brand-orange">Open <span aria-hidden>→</span></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </div>
  );
}
