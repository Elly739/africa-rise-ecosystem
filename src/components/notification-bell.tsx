import { useEffect, useState } from "react";

import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listNotifications, markAllRead, markRead } from "@/lib/api/notifications.functions";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const qc = useQueryClient();
  const fetchFn = useServerFn(listNotifications);
  const markAllFn = useServerFn(markAllRead);
  const markFn = useServerFn(markRead);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchFn(),
    enabled: !!userId,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`notif-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["notifications"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, qc]);

  const unread = notifs.filter((n: any) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread > 0) markAllFn().then(() => qc.invalidateQueries({ queryKey: ["notifications"] }));
        }}
        className="relative size-10 flex items-center justify-center rounded-full hover:bg-brand-clay transition-colors"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-brand-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-auto bg-white rounded-2xl shadow-2xl border border-brand-navy/10 z-50">
            <div className="px-4 py-3 border-b border-brand-navy/5 flex items-center justify-between">
              <p className="font-display font-bold">Notifications</p>
              <span className="text-xs text-brand-navy/40">{notifs.length}</span>
            </div>
            {notifs.length === 0 ? (
              <div className="p-8 text-center text-sm text-brand-navy/50">You're all caught up 🎉</div>
            ) : (
              <ul className="divide-y divide-brand-navy/5">
                {notifs.map((n: any) => {
                  const Inner = (
                    <div className={`px-4 py-3 hover:bg-brand-bg transition-colors ${!n.read ? "bg-brand-orange/5" : ""}`}>
                      <p className="text-sm font-semibold leading-snug">{n.title}</p>
                      <p className="text-xs text-brand-navy/60 mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-[10px] text-brand-navy/40 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <a href={n.link} onClick={() => { markFn({ data: { id: n.id } }); setOpen(false); }}>
                          {Inner}
                        </a>
                      ) : Inner}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
