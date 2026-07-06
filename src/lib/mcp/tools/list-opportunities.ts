import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_opportunities",
  title: "List career opportunities",
  description: "List internships, jobs, and scholarships posted on the Career Bridge board.",
  inputSchema: {
    kind: z.enum(["internship", "job", "scholarship"]).optional().describe("Filter by opportunity type."),
    search: z.string().trim().optional().describe("Match text in title, company, or location."),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ kind, search, limit }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let q = supabase.from("opportunities").select("*").limit(limit ?? 20);
    if (kind) q = q.eq("kind", kind);
    if (search) q = q.or(`title.ilike.%${search}%,company.ilike.%${search}%,location.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { opportunities: data ?? [] },
    };
  },
});
