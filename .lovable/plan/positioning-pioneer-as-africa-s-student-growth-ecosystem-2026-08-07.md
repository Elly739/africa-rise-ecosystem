# Positioning Pioneer as Africa's student growth ecosystem

Goal: make the product visibly answer "how do I get discovered and land opportunities?", not "here is another course platform". Below is what already exists, the real gaps from the discussion, and what to build.

## Where we already stand

| Discussion theme | Current state |
| --- | --- |
| Opportunity discovery | Careers board with search, location, remote and tag filters — but no scholarships/hackathons/grants sourcing, no saved searches, no alerts |
| Student innovation infrastructure | Innovate showcase + public profile at `/u/:id` with projects, certificates, followers — but no innovation score, no collaborator requests, no rich portfolio |
| Talent discovery | Nothing. No way for an employer to browse or filter students |
| AI growth coach | Mentor + Advisor chat exist, but they are generic chatbots, not grounded in the learner's own projects, XP, and matching opportunities |
| Ecosystem narrative | Landing page still reads learn-first; positioning statement not on the site |

## What to build

### 1. Reposition the story (fast, high impact)
- Rewrite the landing hero, section copy, and meta descriptions around the one-sentence pitch: learn skills, build projects, connect with mentors, access opportunities that launch careers and ventures.
- Add a "journey" band on the homepage: Learn → Build → Get discovered → Get hired → Mentor others, each step linking to the live module.
- Update SEO titles/descriptions sitewide from "learning platform" language to talent/opportunity language.

### 2. Opportunity discovery that finds students
- Extend opportunity types beyond internship/job/scholarship to include hackathon, fellowship, grant, incubator.
- Deadline field + "closing soon" sorting, and an expired state so the board stays trustworthy.
- Save an opportunity, plus a weekly digest notification of new matches based on onboarding interests.
- "Matched for you" section at the top of Careers using the existing personalization scoring.

### 3. Portfolio + innovation score
- Upgrade the public profile into a real portfolio: headline, university/year, skills, links (GitHub, LinkedIn), featured projects.
- Innovation score computed from real activity: projects published, challenge submissions, course completions, community contributions, likes received. Shown as a badge with a breakdown so it never feels arbitrary.
- "Looking for collaborators" flag on projects, with a request-to-join action that notifies the owner.
- Shareable profile card metadata so profiles preview well when posted on LinkedIn/X.

### 4. Talent discovery for employers/partners
- `/talent` directory for partner and admin roles: filter students by skill, interest, innovation score, availability, location.
- Students opt in ("open to internships / jobs / collaboration") — nobody is listed without consent.
- Partner can shortlist a student and send a message that lands as a notification.

### 5. Grounded AI growth coach
- Replace the generic mentor prompt with a context-aware coach that receives the learner's profile, interests, enrolled courses, projects, XP, and the current open opportunities/challenges.
- Output a structured plan: next skills, 3 matching opportunities, 1 challenge to join, 1 project idea — each item deep-linking into the app.
- Surface a compact version of this on the dashboard as "Your next moves".

### 6. Naming and brand risk (your decision, not code)
- Before more brand investment: check `.com` / `.africa` availability, trademark conflicts in Kenya/EA, and social + app store handles for "Pioneer".
- Recommendation: keep the copy positioning ("Africa's student growth ecosystem") independent of the wordmark so a rename later is a find-and-replace, not a rebuild. I'll keep brand strings centralised for that reason.

## Suggested sequencing

1. Repositioning copy + journey band + SEO (small, immediate)
2. Opportunity types, deadlines, saved opportunities, matches
3. Portfolio upgrade + innovation score
4. Grounded AI coach
5. Talent directory

## Technical notes

- Schema: add `deadline`, widen the opportunity type enum; new `saved_opportunities`, `collaboration_requests`, `talent_visibility` columns/tables; all with grants + RLS following the existing pattern.
- Innovation score as a Postgres view or scheduled recompute, not a client calculation, so it can be filtered and sorted on.
- Coach context assembled server-side in a new `coach.functions.ts` and passed to the existing AI Gateway call; no new provider.
- Talent directory reads through a security-definer function restricted to `partner`/`admin`, returning only opted-in profiles.
