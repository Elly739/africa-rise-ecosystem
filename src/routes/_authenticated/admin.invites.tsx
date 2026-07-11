import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listRoleInvites, createRoleInvite, deleteRoleInvite } from "@/lib/api/admin.functions";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
const ROLES: AppRole[] = ["teacher", "moderator", "partner"];

export const Route = createFileRoute("/_authenticated/admin/invites")({
  head: () => ({ meta: [{ title: "Role invites · Admin · SkillBridge Africa" }] }),
  component: AdminInvites,
});

function AdminInvites() {
  const listFn = useServerFn(listRoleInvites);
  const createFn = useServerFn(createRoleInvite);
  const delFn = useServerFn(deleteRoleInvite);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-role-invites"],
    queryFn: () => listFn(),
  });

  const [role, setRole] = useState<AppRole>("teacher");
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(30);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFn({ data: { role, email: email.trim() || undefined, expiresInDays: days } });
      toast.success("Invite created");
      setEmail("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const copy = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this invite?")) return;
    await delFn({ data: { id } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Role invites</h1>
        <p className="text-sm text-brand-navy/60">Generate a link that grants a role when the recipient signs in and opens it.</p>
      </header>

      <form onSubmit={submit} className="rounded-2xl border border-brand-navy/5 bg-white p-4 grid gap-3 sm:grid-cols-4">
        <label className="text-sm">
          <span className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-1">Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as AppRole)} className="w-full px-3 py-2 rounded-lg border border-brand-navy/10 bg-white">
            {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-1">Reserve for email (optional)</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="anyone@ if empty" className="w-full px-3 py-2 rounded-lg border border-brand-navy/10 bg-white" />
        </label>
        <label className="text-sm">
          <span className="block text-xs font-bold uppercase tracking-wider text-brand-navy/60 mb-1">Expires (days)</span>
          <input type="number" min={1} max={365} value={days} onChange={(e) => setDays(parseInt(e.target.value) || 30)} className="w-full px-3 py-2 rounded-lg border border-brand-navy/10 bg-white" />
        </label>
        <div className="sm:col-span-4">
          <button type="submit" className="px-4 py-2 rounded-full bg-brand-orange text-white font-semibold text-sm">Create invite</button>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-16 rounded-xl bg-brand-navy/5 animate-pulse" />))}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-navy/5 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-brand-navy/5 text-left text-[10px] uppercase tracking-widest text-brand-navy/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy/5">
              {data?.invites.length === 0 && (<tr><td colSpan={5} className="px-4 py-8 text-center text-brand-navy/50">No invites yet.</td></tr>)}
              {data?.invites.map((inv: any) => {
                const expired = new Date(inv.expires_at) < new Date();
                const used = !!inv.used_by;
                return (
                  <tr key={inv.id}>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-brand-mint/15 text-brand-mint text-xs font-bold capitalize">{inv.role}</span></td>
                    <td className="px-4 py-3 text-brand-navy/70">{inv.email ?? <span className="italic text-brand-navy/40">any</span>}</td>
                    <td className="px-4 py-3">
                      {used ? <span className="text-green-700 text-xs font-bold">Used by {inv.profiles?.display_name ?? "user"}</span>
                        : expired ? <span className="text-red-700 text-xs font-bold">Expired</span>
                        : <span className="text-brand-orange text-xs font-bold">Active</span>}
                    </td>
                    <td className="px-4 py-3 text-brand-navy/60">{new Date(inv.expires_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!used && !expired && (
                          <button onClick={() => copy(inv.token)} className="px-2 py-1 rounded-lg bg-brand-navy text-white text-xs font-semibold">Copy link</button>
                        )}
                        <button onClick={() => remove(inv.id)} className="px-2 py-1 rounded-lg bg-white border border-brand-navy/10 text-xs font-semibold">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
