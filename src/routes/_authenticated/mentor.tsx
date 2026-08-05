import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { AIChat } from "@/components/ai-chat";

export const Route = createFileRoute("/_authenticated/mentor")({
  head: () => ({ meta: [{ title: "AI Mentor — Pioneer Africa Hub" }] }),
  component: MentorPage,
});

function MentorPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy flex flex-col">
      <SiteNav />
      <div className="px-6 pt-8 pb-4 max-w-3xl mx-auto w-full">
        <div className="inline-block px-3 py-1 bg-brand-mint/20 text-brand-mint rounded-full text-xs font-bold uppercase tracking-wider mb-3">AI Layer</div>
        <h1 className="font-display text-3xl font-bold">AI Mentor</h1>
        <p className="text-brand-navy/60 text-sm mt-1">Your personal growth engine — learning paths, skill gaps, motivation.</p>
      </div>
      <div className="px-4 pb-6 flex-1">
        <AIChat
          kind="mentor"
          accent="mint"
          intro="Hi! I'm your Pioneer Africa Hub AI Mentor. Tell me what you're learning or trying to figure out, and I'll help you plan the next step."
          suggestions={[
            "Build me a 4-week roadmap for data science",
            "Explain smart contracts like I'm a beginner",
            "What should I learn after HTML & CSS?",
          ]}
        />
      </div>
    </div>
  );
}
