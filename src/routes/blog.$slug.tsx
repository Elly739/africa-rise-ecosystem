import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { getPost } from "@/lib/api/blog.functions";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { CATEGORY_LABELS, formatDate } from "./blog.index";

const SITE = "https://pioneer-africa-hub.lovable.app";

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog-post", slug],
    queryFn: () => getPost({ data: { slug } }),
  });

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const result = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!result) throw notFound();
    return result;
  },
  head: ({ params, loaderData }) => {
    const post = loaderData?.post;
    const title = post ? `${post.title} | Pioneer Africa Hub` : "Article | Pioneer Africa Hub";
    const description = post?.excerpt ?? "Ideas on innovation, AI and African startups.";
    const url = `${SITE}/blog/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: post?.title ?? title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: post
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: post.title,
                description: post.excerpt,
                datePublished: post.published_at,
                author: { "@type": "Person", name: post.author_name },
                publisher: { "@type": "Organization", name: "Pioneer Africa Hub" },
                mainEntityOfPage: url,
              }),
            },
          ]
        : [],
    };
  },
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(postQuery(slug));
  if (!data) return null;
  const { post, related } = data;

  return (
    <div className="min-h-dvh bg-brand-bg text-brand-navy">
      <SiteNav />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16">
        <Link to="/blog" className="text-sm font-semibold text-brand-navy/60 hover:text-brand-navy">
          ← All articles
        </Link>

        <span className="mt-6 inline-block px-2.5 py-1 rounded-full bg-brand-orange/15 text-brand-orange text-[11px] font-bold uppercase tracking-wide">
          {CATEGORY_LABELS[post.category] ?? post.category}
        </span>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.08] mt-4">{post.title}</h1>
        <p className="mt-4 text-lg text-brand-navy/70">{post.excerpt}</p>
        <p className="mt-6 pb-8 border-b border-brand-navy/10 text-sm font-semibold text-brand-navy/60">
          {post.author_name} · {formatDate(post.published_at)} · {post.read_minutes} min read
        </p>

        <div className="prose prose-lg max-w-none mt-8 prose-headings:font-display prose-headings:text-brand-navy prose-p:text-brand-navy/80 prose-li:text-brand-navy/80 prose-strong:text-brand-navy prose-a:text-brand-orange">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </article>

      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="font-display text-2xl font-bold mb-6">Keep reading</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map((p) => (
              <Link
                key={p.id}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="bg-white border border-brand-navy/5 p-6 rounded-3xl hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <h3 className="font-display font-bold leading-snug">{p.title}</h3>
                <p className="mt-2 text-sm text-brand-navy/70 line-clamp-3">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
