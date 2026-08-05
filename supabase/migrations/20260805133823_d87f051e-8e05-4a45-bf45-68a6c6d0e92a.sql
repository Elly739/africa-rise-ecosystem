CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'innovation',
  cover_url text,
  author_name text NOT NULL DEFAULT 'Pioneer Africa Hub',
  read_minutes integer NOT NULL DEFAULT 5,
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are public" ON public.blog_posts
  FOR SELECT USING (published = true);

CREATE POLICY "Editors can read all posts" ON public.blog_posts
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Editors can write posts" ON public.blog_posts
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'teacher')
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'teacher')
  );

CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.blog_posts (title, slug, excerpt, category, read_minutes, published_at, body) VALUES
('Africa''s AI moment: why the next decade is built here',
 'africa-ai-moment',
 'Compute is getting cheaper, data is getting local, and a generation of builders is coming online at once. Here is what that means for anyone learning AI on the continent today.',
 'ai', 7, now() - interval '2 days',
 E'## The setup\n\nFor most of the last decade, the story of AI in Africa was a story of consumption: models trained elsewhere, tuned elsewhere, deployed here. That is changing fast.\n\n- **Cheaper inference.** Running a capable model now costs cents, not dollars. A student in Nairobi can prototype what needed a research lab in 2019.\n- **Local data, local value.** The highest-value datasets on the continent — agronomy, informal credit, logistics, multilingual speech — are not on the open internet. They are built by people close to the problem.\n- **Distribution already exists.** Mobile money and WhatsApp mean an AI product can reach millions without an app store.\n\n## What to build\n\nStart where the data advantage is yours. Voice interfaces for low-literacy users. Credit scoring from alternative signals. Crop disease detection from a phone camera. Translation for languages the big labs have not prioritised.\n\n## What to learn\n\nYou do not need to train a foundation model. You need to be excellent at the layer above it: retrieval, evaluation, prompt and product design, and the discipline of shipping something people trust.\n\n> The advantage is not compute. It is context.\n'),
('Responsible AI is a product feature, not a policy document',
 'responsible-ai-product-feature',
 'Bias, explainability and consent are usually treated as compliance work. Teams that treat them as design constraints ship better products — and here is how to do it in practice.',
 'responsible-ai', 6, now() - interval '6 days',
 E'## Move it earlier\n\nMost responsible-AI work happens after the model is built, when changing anything is expensive. Move the questions to the design stage:\n\n1. **Who is harmed if this is wrong?** Write the worst-case user story before the happy path.\n2. **What does the user see when the model is unsure?** "I do not know" is a feature.\n3. **Where does the training data come from, and did people consent?**\n\n## Practical checks for small teams\n\n- Build a 50-row evaluation set by hand, from real users, before you build the product.\n- Segment your accuracy numbers — overall accuracy hides failure for the groups that matter most.\n- Log every model decision that affects money, access, or safety, with the inputs that produced it.\n- Give users a route to contest an automated decision, staffed by a human.\n\n## Why it pays\n\nIn regulated African markets — fintech, health, insurance — the team that can explain its model is the team that gets the partnership. Trust is the moat.\n'),
('What African startups actually get funded for in 2026',
 'african-startups-funded-2026',
 'Funding is tighter and more disciplined than the 2021 peak. The teams still raising share a small number of traits — none of which are pitch-deck polish.',
 'startups', 6, now() - interval '11 days',
 E'## The shift\n\nThe cheque sizes came down; the bar for evidence went up. What investors now underwrite:\n\n- **Revenue before narrative.** Small, real, repeated revenue beats a large addressable market slide.\n- **Distribution you own.** Agent networks, cooperatives, WhatsApp communities, employer payrolls.\n- **A margin story.** Gross margin has to work at the unit before scale, not because of it.\n- **Regulatory literacy.** Especially in payments, lending, health and identity.\n\n## Sectors with momentum\n\nB2B fintech infrastructure, climate and energy access, health logistics, agritech data, and the fast-growing layer of AI-native tools for African SMEs.\n\n## If you are pre-seed\n\nShip something ugly to fifty real users. Get paid by ten of them. That single sentence is worth more than six months of deck iteration.\n'),
('From learner to builder: turning a course into a shipped product',
 'learner-to-builder',
 'The gap between finishing a course and shipping something real is where most people stall. A four-week loop to cross it.',
 'innovation', 5, now() - interval '18 days',
 E'## Week 1 — Pick a problem you can see\n\nNot a problem you read about. One you can watch happen: a queue, a spreadsheet, a phone call that repeats.\n\n## Week 2 — Build the ugliest version\n\nOne screen. One workflow. No auth, no settings, no logo. Show it to five people who have the problem.\n\n## Week 3 — Instrument and fix\n\nAdd the smallest amount of tracking that tells you where people stop. Fix only that.\n\n## Week 4 — Publish and ask for one commitment\n\nPost it in the community, enter it in a challenge, or send it to a partner. Ask for one commitment: a pilot, a testimonial, a payment.\n\n## Why the loop matters\n\nCertificates prove you can learn. A shipped product proves you can finish. Employers and investors both buy the second one.\n'),
('Building AI products for low-bandwidth, multilingual Africa',
 'ai-products-low-bandwidth-africa',
 'Design constraints on the continent are real: intermittent connectivity, expensive data, dozens of languages per market. They also make for better engineering.',
 'ai-industry', 7, now() - interval '25 days',
 E'## Constraints as a spec\n\n**Assume the network fails.** Queue requests locally, sync when possible, and make the offline state a designed screen rather than an error.\n\n**Assume data costs money.** Compress payloads, stream text instead of shipping bundles, cache aggressively, and never autoplay media.\n\n**Assume the user is not typing in English.** Voice-first entry, code-switching in prompts, and language detection at the input layer — not the output layer.\n\n## Model choices\n\nSmaller models running closer to the user often beat frontier models sitting behind a slow round-trip. Measure end-to-end latency on a 3G connection, not on office wifi.\n\n## Evaluation\n\nTest in the languages your users actually speak, with the accents and spellings they actually use. If your evaluation set is clean English, your product only works for people who already had options.\n');
