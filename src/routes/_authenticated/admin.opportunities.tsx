import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listOpportunitiesAdmin, listApplicationsAdmin, updateApplicationStatus } from "@/lib/api/admin.functions";
import { Route as AdminRoute } from "./admin";
import type { Database } from "@/integrations/supabase/types";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];

const STATUSES: ApplicationStatus[] = ["submitted", "under_review", "interview", "offer", "rejected", "withdrawn"];

export const Route = createFileRoute("/_authenticated/admin/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities · Admin · SkillBridge Africa" }] }),
  component: AdminOpportunities,
});

function AdminOpportunities() {
  const { roles } = AdminRoute.useRouteContext();
  const canManage = roles.includes("admin") || roles.includes("partner");

  const [selectedOpportunity, setSelectedOpportunity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | "all">("all");

  const oppFn = useServerFn(listOpportunitiesAdmin);
  const appsFn = useServerFn(listApplicationsAdmin);
  const updateStatusFn = useServerFn(updateApplicationStatus);

  const { data: opportunities } = useQuery({ queryKey: ["admin-opportunities"], queryFn: () => oppFn() });
  const { data: applications, refetch } = useQuery({
    queryKey: ["admin-applications", selectedOpportunity, selectedStatus],
    queryFn: () => appsFn({ data: { opportunityId: selectedOpportunity, status: selectedStatus } }),
  });

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    await updateStatusFn({ data: { applicationId: id, status } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Opportunities & applications</h1>
        <p className="text-sm text-brand-navy/60">Track opportunities and manage application statuses.</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Opportunities</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities?.opportunities.map((opp: any) => (
            <div key={opp.id} className="p-4 rounded-2xl bg-white border border-brand-navy/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">{opp.type}</p>
              <p className="font-display font-bold mt-1">{opp.title}</p>
              <p className="text-xs text-brand-navy/60 mt-1">{opp.organization}{opp.location ? ` · ${opp.location}` : ""}</p>
              <p className="text-xs text-brand-mint font-bold mt-2">{opp.applications?.[0]?.count ?? 0} applications</p>
            </div>
          ))}
          {opportunities?.opportunities.length === 0 && <p className="text-brand-navy/50 text-sm">No opportunities yet.</p>}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Applications</h2>
          <div className="flex items-center gap-2">
            <select
              value={selectedOpportunity}
              onChange={(e) => setSelectedOpportunity(e.target.value)}
              className="px-3 py-2 rounded-xl border border-brand-navy/10 text-sm bg-white"
            >
              <option value="all">All opportunities</option>
              {opportunities?.opportunities.map((opp: any) => (
                <option key={opp.id} value={opp.id}>{opp.title}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ApplicationStatus | "all")}
              className="px-3 py-2 rounded-xl border border-brand-navy/10 text-sm bg-white"
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-brand-navy/5 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-brand-navy/5 text-left text-[10px] uppercase tracking-widest text-brand-navy/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Opportunity</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Applied</th>
                {canManage && <th className="px-4 py-3 font-semibold">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy/5">
              {applications?.applications.map((app: any) => (
                <tr key={app.id} className="hover:bg-brand-navy/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {app.profiles?.avatar_url ? (
                        <img src={app.profiles.avatar_url} alt="" className="size-8 rounded-full object-cover" />
                      ) : (
                        <div className="size-8 rounded-full bg-brand-clay flex items-center justify-center text-xs font-bold">{app.profiles?.display_name?.[0] ?? "?"}</div>
                      )}
                      <div>
                        <p className="font-semibold">{app.profiles?.display_name ?? "Unknown"}</p>
                        <Link to="/u/$userId" params={{ userId: app.user_id }} className="text-xs text-brand-navy/50 hover:text-brand-orange">View profile</Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{app.opportunities?.title ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-brand-mint/15 text-brand-mint text-xs font-bold capitalize">{app.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-brand-navy/60">{new Date(app.created_at).toLocaleDateString()}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <select
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                        className="px-2 py-1 rounded-lg border border-brand-navy/10 text-xs bg-white"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
              {applications?.applications.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-4 py-8 text-center text-brand-navy/50">No applications match.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
