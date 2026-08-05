import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_discussions",
  title: "List community discussions",
  description: "List recent community discussions on Pioneer Africa Hub.",
  inputSchema: {
    search: z.string().trim().optional().describe("Match text in discussion title or body."),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let q = supabase
      .from("discussions")
      .select("id,title,body,created_at,author_id")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (search) q = q.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { discussions: data ?? [] },
    };
  },
});
