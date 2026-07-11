import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { listRoleRequests, reviewRoleRequest } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/requests")({
  head: () => ({ meta: [{ title: "Role requests · Admin · SkillBridge Africa" }] }),
  component: AdminRequests,
});

function AdminRequests() {
  const listFn = useServerFn(listRoleRequests);
  const reviewFn = useServerFn(reviewRoleRequest);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-role-requests"],
    queryFn: () => listFn(),
  });

  const review = async (id: string, approve: boolean) => {
    try {
      await reviewFn({ data: { id, approve } });
      toast.success(approve ? "Approved" : "Rejected");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold">Role requests</h1>
        <p className="text-sm text-brand-navy/60">Approve or reject users applying to be teacher, moderator, or partner.</p>
      </header>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-20 rounded-xl bg-brand-navy/5 animate-pulse" />))}</div>
      ) : (
        <div className="space-y-3">
          {data?.requests.length === 0 && (
            <div className="rounded-2xl border border-brand-navy/5 bg-white p-8 text-center text-brand-navy/50">No requests yet.</div>
          )}
          {data?.requests.map((req: any) => (
            <div key={req.id} className="rounded-2xl border border-brand-navy/5 bg-white p-4 flex items-start gap-4">
              {req.profiles?.avatar_url ? (
                <img src={req.profiles.avatar_url} alt="" className="size-10 rounded-full object-cover" />
              ) : (
                <div className="size-10 rounded-full bg-brand-clay flex items-center justify-center font-bold">{req.profiles?.display_name?.[0] ?? "?"}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{req.profiles?.display_name ?? "Unknown"}</p>
                  <span className="px-2 py-0.5 rounded-full bg-brand-mint/15 text-brand-mint text-xs font-bold capitalize">{req.requested_role}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${req.status === "pending" ? "bg-brand-orange/15 text-brand-orange" : req.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{req.status}</span>
                </div>
                {req.note && <p className="mt-1 text-sm text-brand-navy/70 whitespace-pre-wrap">{req.note}</p>}
                <p className="mt-1 text-xs text-brand-navy/40">{new Date(req.created_at).toLocaleString()}</p>
              </div>
              {req.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => review(req.id, true)} className="px-3 py-2 rounded-lg bg-brand-mint text-white text-sm font-semibold">Approve</button>
                  <button onClick={() => review(req.id, false)} className="px-3 py-2 rounded-lg bg-white border border-brand-navy/10 text-sm font-semibold">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
