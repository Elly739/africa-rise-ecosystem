import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM_PROMPTS: Record<"mentor" | "advisor", string> = {
  mentor: `You are the SkillBridge Africa AI Mentor — a warm, sharp learning coach for African students and young innovators.
- Help them pick what to learn next, break down hard concepts, and stay motivated.
- Reference real-world African context (fintech, agritech, climate, creative industries) when useful.
- Be concise and actionable. Use short paragraphs and bullet points. Avoid filler.`,
  advisor: `You are the SkillBridge Africa AI Career Advisor — a no-nonsense coach helping African students bridge from learning to opportunity.
- Help with CV reviews, interview prep, internship strategy, scholarship applications, LinkedIn, and career roadmaps.
- Lean on the African ecosystem (Andela, Flutterwave, Paystack, Twiga, Mastercard Foundation, MTN, etc.) when relevant.
- Be direct, specific, and example-driven.`,
};

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

export const chatWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    kind: z.enum(["mentor", "advisor"]),
    messages: z.array(MessageSchema).min(1).max(40),
    conversationId: z.string().uuid().nullable().optional(),
  }))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    // Persist conversation
    let conversationId = data.conversationId ?? null;
    if (!conversationId) {
      const firstUser = data.messages.find((m) => m.role === "user");
      const title = (firstUser?.content ?? "New chat").slice(0, 60);
      const { data: conv, error } = await context.supabase
        .from("ai_conversations")
        .insert({ user_id: context.userId, kind: data.kind, title })
        .select("id")
        .single();
      if (error) throw error;
      conversationId = conv.id;
    }

    const lastUser = [...data.messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      await context.supabase.from("ai_messages").insert({
        conversation_id: conversationId, role: "user", content: lastUser.content,
      });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPTS[data.kind] }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI Gateway error ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const reply: string = json?.choices?.[0]?.message?.content ?? "Sorry, no response.";

    await context.supabase.from("ai_messages").insert({
      conversation_id: conversationId, role: "assistant", content: reply,
    });

    return { conversationId, reply };
  });

export const listMyConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ kind: z.enum(["mentor", "advisor"]) }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("ai_conversations")
      .select("id,title,created_at")
      .eq("user_id", context.userId)
      .eq("kind", data.kind)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return rows ?? [];
  });
