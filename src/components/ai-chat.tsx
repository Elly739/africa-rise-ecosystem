import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chatWithAI } from "@/lib/api/ai.functions";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export function AIChat({ kind, accent, intro, suggestions }: {
  kind: "mentor" | "advisor";
  accent: "orange" | "mint";
  intro: string;
  suggestions: string[];
}) {
  const chat = useServerFn(chatWithAI);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: intro }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await chat({ data: { kind, messages: next, conversationId: convId } });
      setConvId(res.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
      setMessages((m) => m.slice(0, -1));
    } finally { setBusy(false); }
  }

  const ring = accent === "orange" ? "focus:border-brand-orange" : "focus:border-brand-mint";
  const btn = accent === "orange" ? "bg-brand-orange" : "bg-brand-mint text-brand-navy";

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto space-y-4 px-2 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-wrap leading-relaxed ${
              m.role === "user" ? "bg-brand-navy text-white" : "bg-white border border-brand-navy/5"
            }`}>{m.content}</div>
          </div>
        ))}
        {busy && <div className="text-brand-navy/40 text-sm pl-2">Thinking…</div>}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-2 pb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full bg-brand-clay text-brand-navy/80 hover:bg-brand-clay/70">
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 p-2 bg-white border border-brand-navy/5 rounded-2xl">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          className={`flex-1 px-4 py-3 rounded-xl bg-transparent outline-none border border-transparent ${ring}`}
        />
        <button type="submit" disabled={busy || !input.trim()} className={`px-5 py-3 ${btn} text-white rounded-xl font-bold disabled:opacity-50`}>
          Send
        </button>
      </form>
    </div>
  );
}
