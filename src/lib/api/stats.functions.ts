import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_stats")
      .select("xp,level,streak_days,last_active")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data ?? { xp: 0, level: 1, streak_days: 0, last_active: null };
  });

export const getUserStats = createServerFn({ method: "GET" })
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from("user_stats")
      .select("xp,level,streak_days")
      .eq("user_id", data.userId)
      .maybeSingle();
    return row ?? { xp: 0, level: 1, streak_days: 0 };
  });
