import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listPosts } from "@/lib/api/blog.functions";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

const postsQuery = queryOptions({
  queryKey: ["blog-posts"],
  queryFn: () => listPosts({ data: {} }),
});

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Innovation, AI & African startups | Pioneer Africa Hub" },
      {
        name: "description",
        content:
          "Essays and field notes on applied AI, responsible AI, technology and the African startup ecosystem — written for builders on the continent.",
      },
      { property: "og:title", content: "Blog — Innovation, AI & African startups" },
      { property: "og:description", content: "Field notes on applied AI, responsible AI and African startups." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://pioneer-africa-hub.lovable.app/blog" },
    ],
    links: [{ rel: "canonical", href: "https://pioneer-africa-hub.lovable.app/blog" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  component: BlogIndex,
});

export const CATEGORY_LABELS: Record<string, string> = {
  ai: "AI",
  "ai-industry": "AI industry",
  "responsible-ai": "Responsible AI",
  innovation: "Innovation",
  startups: "African startups",
};

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function BlogIndex() {
  const { data: posts } = useSuspenseQuery(postsQuery);
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(posts.map((p) => p.category))), [posts]);
  const filtered = useMemo(
    () => (category ? posts.filter((p) => p.category === category) : posts),
    [posts, category]
  );
  const [lead, ...rest] = filtered;

  return (
    <div className="min-h-dvh bg-brand-bg text-brand-navy">
      <SiteNav />

      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-orange mb-3">The Pioneer Journal</p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] max-w-3xl">
          Ideas on innovation, AI and the future African economy.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-brand-navy/70 max-w-2xl">
          Field notes from builders, teachers and partners across the continent — what's working, what's funded, and
          what to learn next.
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
            !category ? "bg-brand-navy text-white border-brand-navy" : "bg-white text-brand-navy border-brand-navy/10 hover:border-brand-navy/30"
          }`}
        >
          All topics
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
              category === c ? "bg-brand-navy text-white border-brand-navy" : "bg-white text-brand-navy border-brand-navy/10 hover:border-brand-navy/30"
            }`}
          >
            {CATEGORY_LABELS[c] ?? c}
          </button>
        ))}
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {filtered.length === 0 ? (
          <div className="bg-white border border-brand-navy/5 rounded-3xl p-12 text-center">
            <h2 className="font-display text-2xl font-bold">Nothing published here yet</h2>
            <p className="mt-2 text-brand-navy/70">New pieces land every couple of weeks. Try another topic.</p>
          </div>
        ) : (
          <>
            {lead && (
              <Link
                to="/blog/$slug"
                params={{ slug: lead.slug }}
                className="group block bg-brand-clay rounded-[2rem] p-8 sm:p-12 mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy"
              >
                <span className="inline-block px-2.5 py-1 rounded-full bg-brand-navy/10 text-[11px] font-bold uppercase tracking-wide">
                  {CATEGORY_LABELS[lead.category] ?? lead.category}
                </span>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-5 max-w-3xl leading-[1.08] group-hover:underline decoration-2 underline-offset-4">
                  {lead.title}
                </h2>
                <p className="mt-4 text-brand-navy/75 max-w-2xl">{lead.excerpt}</p>
                <p className="mt-6 text-sm font-semibold text-brand-navy/60">
                  {formatDate(lead.published_at)} · {lead.read_minutes} min read
                </p>
              </Link>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {rest.map((p) => (
                <Link
                  key={p.id}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group bg-white border border-brand-navy/5 p-7 rounded-3xl hover:shadow-xl hover:shadow-brand-navy/5 transition-all flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  <span className="self-start px-2 py-0.5 rounded bg-brand-mint/20 text-brand-mint text-[10px] font-bold uppercase">
                    {CATEGORY_LABELS[p.category] ?? p.category}
                  </span>
                  <h3 className="text-xl font-display font-bold mt-4 mb-2 leading-snug">{p.title}</h3>
                  <p className="text-brand-navy/70 text-sm flex-1">{p.excerpt}</p>
                  <div className="pt-5 mt-5 border-t border-brand-navy/10 flex items-center justify-between text-sm font-semibold">
                    <span className="text-brand-navy/60">
                      {formatDate(p.published_at)} · {p.read_minutes} min
                    </span>
                    <span aria-hidden className="text-brand-orange">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
