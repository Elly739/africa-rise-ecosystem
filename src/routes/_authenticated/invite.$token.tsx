import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { redeemRoleInvite } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated/invite/$token")({
  head: () => ({ meta: [{ title: "Redeem invite · SkillBridge Africa" }] }),
  component: RedeemInvite,
});

function RedeemInvite() {
  const { token } = Route.useParams();
  const redeemFn = useServerFn(redeemRoleInvite);
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");

  const redeem = async () => {
    setStatus("loading");
    try {
      const res = await redeemFn({ data: { token } });
      setRole(res.role);
      setStatus("done");
      toast.success(`You now have the "${res.role}" role.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to redeem");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-dvh bg-brand-bg text-brand-navy">
      <SiteNav />
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-brand-navy/5 bg-white p-8 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold">You've been invited</h1>
          {status === "idle" && (
            <>
              <p className="text-brand-navy/60">Click below to activate the role attached to this invite on your account.</p>
              <button onClick={redeem} className="px-6 py-3 rounded-full bg-brand-orange text-white font-semibold">Accept invite</button>
            </>
          )}
          {status === "loading" && <p className="text-brand-navy/60">Redeeming…</p>}
          {status === "done" && (
            <>
              <p className="text-brand-navy/80">Your <span className="font-bold capitalize">{role}</span> access is active.</p>
              <button onClick={() => navigate({ to: "/admin" })} className="px-6 py-3 rounded-full bg-brand-navy text-white font-semibold">Open admin</button>
            </>
          )}
          {status === "error" && (
            <>
              <p className="text-red-600">{message}</p>
              <Link to="/dashboard" className="inline-block px-6 py-3 rounded-full bg-brand-navy text-white font-semibold">Back to dashboard</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
