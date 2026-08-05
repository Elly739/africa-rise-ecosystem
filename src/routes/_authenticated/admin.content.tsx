import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listContentForModeration, moderateContent } from "@/lib/api/admin.functions";
import { Route as AdminRoute } from "./admin";

export const Route = createFileRoute("/_authenticated/admin/content")({
  head: () => ({ meta: [{ title: "Content · Admin · Pioneer Africa Hub" }] }),
  component: AdminContent,
});

function AdminContent() {
  const { roles } = AdminRoute.useRouteContext();
  const canModerate = roles.includes("admin") || roles.includes("moderator");

  const listFn = useServerFn(listContentForModeration);
  const moderateFn = useServerFn(moderateContent);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-content"],
    queryFn: () => listFn(),
  });

  const handleModerate = async (type: "project" | "discussion", id: string, action: "delete" | "approve") => {
    await moderateFn({ data: { type, id, action } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Content moderation</h1>
        <p className="text-sm text-brand-navy/60">Review projects and discussions.</p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-brand-navy/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold">Projects</h2>
            <div className="grid gap-4">
              {data?.projects.map((project: any) => (
                <div key={project.id} className="p-4 rounded-2xl bg-white border border-brand-navy/5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-brand-navy/10 text-brand-navy text-[10px] font-bold uppercase">{project.status}</span>
                        <Link to="/innovate/$projectSlug" params={{ projectSlug: project.slug }} className="font-display font-bold hover:text-brand-orange">{project.title}</Link>
                      </div>
                      <p className="text-sm text-brand-navy/60 mt-1 line-clamp-2">{project.summary}</p>
                      <p className="text-xs text-brand-navy/40 mt-2">By {project.profiles?.display_name ?? "Unknown"} · {new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                    {canModerate && (
                      <div className="flex gap-2 shrink-0">
                        {project.status !== "launched" && (
                          <button
                            onClick={() => handleModerate("project", project.id, "approve")}
                            className="px-3 py-2 rounded-lg bg-brand-mint/15 text-brand-mint text-xs font-bold hover:bg-brand-mint/25"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleModerate("project", project.id, "delete")}
                          className="px-3 py-2 rounded-lg bg-brand-orange/15 text-brand-orange text-xs font-bold hover:bg-brand-orange/25"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {data?.projects.length === 0 && <p className="text-brand-navy/50 text-sm">No projects to review.</p>}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold">Discussions</h2>
            <div className="grid gap-4">
              {data?.discussions.map((discussion: any) => (
                <div key={discussion.id} className="p-4 rounded-2xl bg-white border border-brand-navy/5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] font-bold uppercase">{discussion.topic}</span>
                        <Link to="/community/$discussionId" params={{ discussionId: discussion.id }} className="font-display font-bold hover:text-brand-orange">{discussion.title}</Link>
                      </div>
                      <p className="text-xs text-brand-navy/40 mt-2">By {discussion.profiles?.display_name ?? "Unknown"} · {new Date(discussion.created_at).toLocaleDateString()}</p>
                    </div>
                    {canModerate && (
                      <button
                        onClick={() => handleModerate("discussion", discussion.id, "delete")}
                        className="px-3 py-2 rounded-lg bg-brand-orange/15 text-brand-orange text-xs font-bold hover:bg-brand-orange/25 shrink-0"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {data?.discussions.length === 0 && <p className="text-brand-navy/50 text-sm">No discussions to review.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
