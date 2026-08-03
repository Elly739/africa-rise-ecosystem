import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listCourses } from "@/lib/api/learn.functions";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import heroCutout from "@/assets/hero-cutout.png";
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
      <header className="relative overflow-hidden">
        {/* decorative shape layer */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div className="sb-float-slow absolute -top-24 -left-24 size-[26rem] rounded-full bg-brand-mint/15 blur-2xl" />
          <div className="sb-float absolute top-32 right-[8%] size-40 rounded-full bg-brand-orange/15 blur-xl" />
          <div className="sb-dots absolute bottom-10 left-[4%] h-32 w-40 text-brand-navy/15" />
          <div className="sb-dots absolute top-8 right-[38%] h-24 w-28 text-brand-orange/30" />
          <svg className="sb-spin-slow absolute -bottom-20 right-[-4rem] size-72 text-brand-navy/10" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="48" strokeDasharray="6 8" />
            <circle cx="50" cy="50" r="34" strokeDasharray="3 10" />
          </svg>
        </div>

        <div className="relative px-6 pt-12 pb-20 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 sb-rise">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-mint/20 text-brand-mint border border-brand-mint/30 rounded-full text-xs font-bold uppercase tracking-wider">
              <span className="relative flex size-2">
                <span className="sb-ring absolute inline-flex size-full rounded-full bg-brand-mint" />
                <span className="relative inline-flex size-2 rounded-full bg-brand-mint" />
              </span>
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
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
              >
                Explore Courses
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center justify-center px-8 py-4 text-brand-navy rounded-2xl font-bold text-lg border-2 border-brand-navy/15 hover:border-brand-navy/40 hover:bg-brand-clay/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
              >
                Join the Community
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center items-end min-h-[26rem]">
            {/* flat shape behind the cut-out */}
            <div aria-hidden className="absolute bottom-8 left-1/2 -translate-x-1/2 size-[22rem] md:size-[26rem] rounded-full bg-brand-orange/90" />
            <div aria-hidden className="sb-spin-slow absolute bottom-4 left-1/2 -translate-x-1/2 size-[25rem] md:size-[30rem] rounded-full border-2 border-dashed border-brand-navy/15" />
            <img
              src={heroCutout}
              alt="A young African student holding a laptop, ready to start learning"
              width={1024}
              height={1280}
              className="relative z-10 w-[19rem] md:w-[24rem] drop-shadow-2xl"
            />

            <div className="sb-float absolute z-20 top-4 left-0 md:left-4 bg-white p-4 rounded-2xl shadow-xl border border-brand-clay max-w-[220px]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="size-2.5 bg-brand-mint rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-wider">Live now</span>
              </div>
              <p className="text-sm font-semibold leading-snug">Digital Product Design Foundations</p>
              <div className="mt-3 h-1.5 w-full bg-brand-clay rounded-full overflow-hidden">
                <div className="h-full bg-brand-orange w-3/4" />
              </div>
            </div>

            <div className="sb-float-slow absolute z-20 bottom-16 right-0 bg-brand-navy text-white px-4 py-3 rounded-2xl shadow-xl">
              <p className="text-2xl font-display font-bold leading-none">+12k</p>
              <p className="text-[10px] uppercase tracking-wider text-white/60 mt-1">Learners onboard</p>
            </div>
          </div>
        </div>

        {/* Moving ticker */}
        <div className="relative border-y border-brand-navy/10 bg-brand-navy text-white py-3 overflow-hidden">
          <div className="sb-marquee flex w-max gap-10 whitespace-nowrap">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex gap-10" aria-hidden={dup === 1}>
                {["Web Development", "Data Science", "UI/UX Design", "Cloud & DevOps", "Blockchain", "Product Management", "Cybersecurity", "AI & Machine Learning"].map((t) => (
                  <span key={t} className="flex items-center gap-10 text-sm font-bold uppercase tracking-widest text-white/80">
                    {t}
                    <span className="size-1.5 rounded-full bg-brand-orange" />
                  </span>
                ))}
              </div>
            ))}
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
