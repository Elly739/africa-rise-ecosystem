import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://pioneer-africa-hub.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/courses", changefreq: "weekly", priority: "0.9" },
          { path: "/blog", changefreq: "weekly", priority: "0.9" },
          { path: "/careers", changefreq: "daily", priority: "0.8" },
          { path: "/innovate", changefreq: "weekly", priority: "0.7" },
          { path: "/challenges", changefreq: "weekly", priority: "0.7" },
          { path: "/community", changefreq: "daily", priority: "0.7" },
          { path: "/auth", changefreq: "monthly", priority: "0.3" },
        ];

        const [{ data: posts }, { data: courses }, { data: projects }, { data: challenges }] = await Promise.all([
          supabaseAdmin.from("blog_posts").select("slug,updated_at").eq("published", true),
          supabaseAdmin.from("courses").select("id"),
          supabaseAdmin.from("projects").select("slug"),
          supabaseAdmin.from("challenges").select("slug"),
        ]);

        for (const p of posts ?? [])
          entries.push({ path: `/blog/${p.slug}`, lastmod: p.updated_at?.slice(0, 10), changefreq: "monthly", priority: "0.8" });
        for (const c of courses ?? []) entries.push({ path: `/courses/${c.id}`, changefreq: "monthly", priority: "0.7" });
        for (const p of projects ?? []) entries.push({ path: `/innovate/${p.slug}`, changefreq: "monthly", priority: "0.6" });
        for (const c of challenges ?? []) entries.push({ path: `/challenges/${c.slug}`, changefreq: "weekly", priority: "0.6" });

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
