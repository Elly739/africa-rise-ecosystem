import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { AIChat } from "@/components/ai-chat";

export const Route = createFileRoute("/_authenticated/advisor")({
  head: () => ({ meta: [{ title: "AI Career Advisor — SkillBridge Africa" }] }),
  component: AdvisorPage,
});

function AdvisorPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy flex flex-col">
      <SiteNav />
      <div className="px-6 pt-8 pb-4 max-w-3xl mx-auto w-full">
        <div className="inline-block px-3 py-1 bg-brand-orange/15 text-brand-orange rounded-full text-xs font-bold uppercase tracking-wider mb-3">Career Bridge</div>
        <h1 className="font-display text-3xl font-bold">AI Career Advisor</h1>
        <p className="text-brand-navy/60 text-sm mt-1">Ask anything — CV reviews, interview prep, internship strategy, scholarships.</p>
      </div>
      <div className="px-4 pb-6 flex-1">
        <AIChat
          kind="advisor"
          accent="orange"
          intro="Hey 👋 I'm your SkillBridge Career Advisor. What career move can I help you make this week?"
          suggestions={[
            "Review my CV strategy for a software internship",
            "How do I apply to Mastercard Foundation Scholars?",
            "Help me prep for a Paystack interview",
          ]}
        />
      </div>
    </div>
  );
}
