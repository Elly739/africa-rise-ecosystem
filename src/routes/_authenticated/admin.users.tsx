import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listUsers, updateUserRole } from "@/lib/api/admin.functions";
import { Route as AdminRoute } from "./admin";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ALL_ROLES: AppRole[] = ["admin", "moderator", "teacher", "partner", "student"];

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users · Admin · SkillBridge Africa" }] }),
  component: AdminUsers,
});

function AdminUsers() {
  const { roles } = AdminRoute.useRouteContext();
  const isAdmin = roles.includes("admin");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const listFn = useServerFn(listUsers);
  const updateRoleFn = useServerFn(updateUserRole);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: () => listFn({ data: { page, pageSize: 20, search } }),
  });

  const toggleRole = async (userId: string, role: AppRole, hasRole: boolean) => {
    await updateRoleFn({ data: { userId, role, action: hasRole ? "remove" : "add" } });
    refetch();
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Users</h1>
          <p className="text-sm text-brand-navy/60">Manage platform users and roles.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-brand-navy/10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-brand-navy/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-brand-navy/5 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-brand-navy/5 text-left text-[10px] uppercase tracking-widest text-brand-navy/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Roles</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-navy/5">
                {data?.users.map((user) => (
                  <tr key={user.id} className="hover:bg-brand-navy/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="size-8 rounded-full object-cover" />
                        ) : (
                          <div className="size-8 rounded-full bg-brand-clay flex items-center justify-center text-xs font-bold">{user.display_name?.[0] ?? "?"}</div>
                        )}
                        <div>
                          <p className="font-semibold">{user.display_name ?? "Unnamed"}</p>
                          <Link to="/u/$userId" params={{ userId: user.id }} className="text-xs text-brand-navy/50 hover:text-brand-orange">View profile</Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-navy/60">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(user.roles as AppRole[]).map((role) => (
                          <span key={role} className="px-2 py-0.5 rounded-full bg-brand-mint/15 text-brand-mint text-xs font-bold capitalize">{role}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <div className="flex flex-wrap gap-1">
                          {ALL_ROLES.filter((r) => r !== "student").map((role) => {
                            const hasRole = (user.roles as AppRole[]).includes(role);
                            return (
                              <button
                                key={role}
                                onClick={() => toggleRole(user.id, role, hasRole)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                                  hasRole
                                    ? "bg-brand-navy text-white border-brand-navy"
                                    : "bg-white text-brand-navy/60 border-brand-navy/10 hover:border-brand-navy/30"
                                }`}
                              >
                                {hasRole ? "Remove" : "Add"} {role}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {data?.users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-brand-navy/50">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-brand-navy/60">{data?.count ?? 0} users total</p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-2 rounded-lg bg-white border border-brand-navy/10 text-sm font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={!data || page * 20 >= data.count}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-2 rounded-lg bg-white border border-brand-navy/10 text-sm font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
