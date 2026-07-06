# Next iteration — Quick wins across 6 areas

A single focused pass adding small, high-impact features across every area you picked (Personalization & AI, Career outcomes, Community depth, Engagement & retention) plus UX polish for Onboarding, Lesson/Quiz player, and Innovate/Projects. No large new modules — every item is 1 file or 1 small addition.

## 1. Onboarding wizard (first-run)
- New route `/_authenticated/welcome` — 3 steps: pick interests (subject tags), skill level (beginner/intermediate/advanced), goal (learn / find job / build).
- Save to `profiles` (add `interests text[]`, `skill_level text`, `primary_goal text`, `onboarded_at timestamptz`).
- `_authenticated/route.tsx` redirects to `/welcome` once when `onboarded_at IS NULL`.
- Powers personalization in items 2 and 5.

## 2. Personalized dashboard "For you" strip
- New section on `/dashboard`: recommended courses + opportunities + challenges matched to `interests` / `skill_level`.
- Simple server fn: rank by tag overlap, exclude already-enrolled/applied. No ML — deterministic scoring.

## 3. Engagement: streaks + XP
- Add `user_stats` table: `xp int`, `streak_days int`, `last_active date`, `level int` (derived).
- Increment on: lesson complete (+10), quiz pass (+25), project like received (+5), discussion reply (+3), challenge submission (+50).
- Show compact streak/XP chip in `site-nav` next to notification bell, with a tooltip breakdown.

## 4. Community depth: public profiles + follow
- New route `/u/$userId` — avatar, bio, country, XP/level, badges (from certificates), projects, recent discussions.
- Add `follows` table (`follower_id`, `following_id`). Follow button on profile + author names across community/innovate become links.
- New notification type `new_follower`.

## 5. Career outcomes: application tracker + one-click apply
- Careers page gets a "My applications" tab: kanban-style Applied / In review / Interview / Offer / Rejected (uses existing `applications.status`).
- One-click apply button pre-fills from saved CV; disables when no CV exists with a nudge to `/cv`.
- Add "Similar opportunities" strip on each career card using tag/type match.

## 6. Innovate polish
- Add cover image upload to project create form (Supabase Storage bucket `project-covers`, public read).
- Add filter chips (status: idea/building/launched) and search box on `/innovate`.
- Contributor avatars strip on project detail (from `project_likes` — top 5 supporters).

## 7. Lesson & quiz player polish
- Better markdown: enable GFM (`remark-gfm`), syntax highlighting (`rehype-highlight`), and proper `<Prose>` typography wrapper.
- Sticky bottom bar with Prev / Mark complete / Next; keyboard shortcuts (← → for nav, `c` to complete).
- Quiz: progress bar, per-question review after submit showing correct answer + explanation field (add `quiz_questions.explanation text`).

## 8. AI Mentor tie-in (small)
- Mentor gets 3 new suggested prompts derived from user's `interests` + current in-progress course.
- Add a "Weekly plan" button that streams a personalized 7-day study plan (uses existing AI chat, new system prompt only — no new infra).

---

## Technical summary

**DB migration (single):**
- `profiles`: add `interests text[] default '{}'`, `skill_level text`, `primary_goal text`, `onboarded_at timestamptz`.
- New tables: `user_stats`, `follows` (+ GRANTs + RLS + policies).
- `quiz_questions`: add `explanation text`.
- Storage bucket `project-covers` (public read, authed write).
- Triggers to bump XP on lesson_progress/quiz_attempts/project_likes/discussion_replies/challenge_submissions.
- Trigger to create `notifications` on new follow.

**New/edited files (~12):**
- `src/routes/_authenticated/welcome.tsx` (new)
- `src/routes/u.$userId.tsx` (new)
- `src/lib/api/personalization.functions.ts` (new)
- `src/lib/api/social.functions.ts` (new — follow/unfollow, get profile)
- `src/lib/api/stats.functions.ts` (new — read XP/streak)
- Edits: `_authenticated/route.tsx`, `dashboard.tsx`, `site-nav.tsx`, `careers.tsx`, `innovate.tsx`, `innovate.$projectSlug.tsx`, `lessons.$lessonId.tsx`, `quizzes.$quizId.tsx`, `mentor.tsx`.

**Out of scope this pass:** email digests, push notifications, employer accounts, mentorship matching, live events, leaderboards, referrals, interview-prep AI, video lessons, real-time collab. Flag these for a future iteration.

Approve and I'll ship it in build mode.
