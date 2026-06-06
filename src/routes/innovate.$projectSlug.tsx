import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getProject, toggleProjectLike } from "@/lib/api/ecosystem.functions";
import { supabase } from "@/integrations/supabase/client";

const projectQuery = (slug: string) => queryOptions({
  queryKey: ["project", slug],
  queryFn: () => getProject({ data: { slug } }),
});

export const Route = createFileRoute("/innovate/$projectSlug")({
  head: ({ loaderData }) => ({
    meta: loaderData?.project ? [
      { title: `${loaderData.project.title} — SkillBridge Innovation Hub` },
      { name: "description", content: loaderData.project.summary },
      { property: "og:title", content: loaderData.project.title },
      { property: "og:description", content: loaderData.project.summary },
    ] : [{ title: "Project — SkillBridge Africa" }],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(projectQuery(params.projectSlug));
    if (!data) throw notFound();
    return data;
  },
  errorComponent: () => <div className="p-10">Failed to load project.</div>,
  notFoundComponent: () => <div className="p-10">Project not found.</div>,
  component: ProjectPage,
});

function ProjectPage() {
  const { projectSlug } = Route.useParams();
  const { data } = useSuspenseQuery(projectQuery(projectSlug));
  const qc = useQueryClient();
  const toggle = useServerFn(toggleProjectLike);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session)); }, []);

  const like = useMutation({
    mutationFn: () => toggle({ data: { projectId: data!.project.id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectSlug] }),
  });

  if (!data) return null;
  const { project, likes, author } = data;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy">
      <SiteNav />
      <div className="px-6 py-12 max-w-3xl mx-auto">
        <Link to="/innovate" className="text-sm text-brand-navy/60 hover:text-brand-navy">← Back to Innovation Hub</Link>
        <div className="mt-6 flex items-center gap-3 text-sm text-brand-navy/60">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-navy/5">{project.status}</span>
          {author?.display_name && <span>by {author.display_name}</span>}
          <span>· {new Date(project.created_at).toLocaleDateString()}</span>
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl font-bold leading-tight">{project.title}</h1>
        <p className="mt-4 text-xl text-brand-navy/70">{project.summary}</p>

        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={() => signedIn ? like.mutate() : null}
            disabled={!signedIn || like.isPending}
            className="px-5 py-2.5 bg-brand-clay rounded-full font-bold text-sm hover:bg-brand-clay/70 disabled:opacity-60"
          >
            ❤ {likes} {signedIn ? "Like" : "Sign in to like"}
          </button>
          {project.repo_url && <a href={project.repo_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-brand-orange hover:underline">Repo →</a>}
          {project.demo_url && <a href={project.demo_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-brand-orange hover:underline">Live demo →</a>}
        </div>

        {project.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {project.tags.map((t: string) => <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-brand-clay text-brand-navy/70">{t}</span>)}
          </div>
        )}

        {project.description && (
          <div className="prose prose-lg mt-10 whitespace-pre-wrap text-brand-navy/80">{project.description}</div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
