# Pioneer Africa Hub

A learning, building, and opportunity ecosystem for African talent — courses, portfolios, an opportunity board, innovation challenges, community, articles, and a grounded AI coach, in one place.

Live: <https://pioneer-africa-hub.lovable.app>

## The journey

**Learn → Build → Get discovered.** Learners take AI and innovation courses, ship projects to a public Innovation Hub, earn an Innovation Score, and become visible to partners scouting talent.

## Features

### Learn
- Courses focused on AI, responsible AI, innovation, and building for Africa.
- Lessons (GFM markdown), quizzes with explanations, XP, levels, streaks, and certificates.

### Build
- **Innovation Hub** — public project showcase with cover images, likes, comments, and collaboration requests.
- **Challenges** — team-based competitions: team formation, file submissions, community-gated voting, and winner selection.
- **Portfolio** — headline, university, skills, links, and an auto-computed **Innovation Score** (projects, likes, certificates, community activity).

### Get discovered
- **Career Bridge** — opportunity board covering jobs, internships, hackathons, fellowships, grants and scholarships, with search, location/remote/tag filters, deadline countdowns, saved opportunities, and a "Matched for you" strip.
- **Apply in-app** — apply with notes and auto-fill from one of your existing projects.
- **Applications tracker** — Kanban-style pipeline of every application and its status.
- **Talent directory** — partners and admins can search student builders by skill and score.
- **Public profiles** at `/u/:userId` with score, projects, and links.

### Community & content
- Discussion **Spaces** (General, Learning, Careers, Building, Mentorship) with replies, participant counts, and activity signals.
- **Blog** — articles on innovation, tech, and African startups. Authoring is restricted to admins and partners via the Articles workspace.

### AI
- **AI Mentor** (`/mentor`) — learning coach: roadmaps, skill gaps, concept breakdowns.
- **AI Career Advisor** (`/advisor`) — CVs, interviews, internships, scholarships.
- Both are **grounded** in the learner's real profile, projects, courses, certificates, and the live opportunity list — conversations are persisted.

### Platform
- **Onboarding wizard** (`/welcome`) — interests, skill level, primary goal → drives the "For You" recommendations.
- **Notifications** — real-time bell for project likes, discussion replies, application status changes, challenge updates, and admin announcements.
- **Role-aware dashboards** — learner, teacher, partner, moderator, and admin bands.
- **Admin hub** — users, role requests, invites, content moderation, opportunities, courses, articles, announcements.
- **MCP server** — read-only agent tools for courses, opportunities, challenges, and discussions.
- **SEO** — per-route metadata, dynamic sitemap, robots.txt.

## Roles

| Role | Who it's for | How to obtain |
| --- | --- | --- |
| `student` | Everyone (default on signup) | Automatic |
| `teacher` | Course authors | Request via `/request-access` or admin invite |
| `partner` | Organisations posting opportunities and articles | Request or admin invite |
| `moderator` | Trusted community helpers | Admin invite only |
| `admin` | Platform owner | Locked to `iamellyokello@gmail.com` by database trigger |

The admin role is enforced at the database layer: only a verified `iamellyokello@gmail.com` account can hold it, and any attempt to grant it to another user is rejected.

## Tech stack

- **Framework** — [TanStack Start](https://tanstack.com/start) (React 19, SSR, server functions) on Vite 7
- **Styling** — Tailwind CSS v4 with the "Pioneer Motion" brand system (see `src/styles.css`)
- **Backend** — Lovable Cloud (Postgres + Auth + Storage + Realtime)
- **AI** — Lovable AI Gateway
- **Runtime** — Cloudflare Workers (edge)

## Project layout

```
src/
  routes/                    file-based routing (TanStack Router)
    __root.tsx               app shell
    index.tsx                landing page
    careers.tsx              opportunity board
    innovate.tsx             innovation hub
    challenges.tsx           challenge board
    community.tsx            discussion spaces
    blog.index.tsx           articles
    u.$userId.tsx            public profile
    _authenticated/          gated subtree (auth required)
      dashboard.tsx          role-aware dashboard
      welcome.tsx            onboarding wizard
      mentor.tsx / advisor.tsx   AI coaches
      portfolio.tsx          portfolio editor
      applications.tsx       application tracker
      talent.tsx             talent directory (partner/admin)
      certificates.tsx, cv.tsx, lessons.$lessonId.tsx, quizzes.$quizId.tsx
      request-access.tsx, invite.$token.tsx
      admin.*.tsx            admin workspaces
  components/                shared UI
  lib/api/*.functions.ts     server functions (createServerFn)
  lib/mcp/                   MCP server + tools
  integrations/supabase/     generated client + helpers (do not edit)
supabase/migrations/         database migrations
```

## Local development

Requirements: [Bun](https://bun.sh) (or Node 20+ with npm).

```bash
bun install
bun run dev
```

The app runs at <http://localhost:8080>. Database changes go through migrations under `supabase/migrations/` — apply via the Lovable Cloud editor.

## Environment

Auto-injected in Lovable projects; no manual setup needed:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — browser client
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — server functions
- `LOVABLE_API_KEY` — AI Gateway

## Deploy

Publishing is managed through the Lovable dashboard — click **Publish**. Served from Cloudflare Workers.

- Production — `https://pioneer-africa-hub.lovable.app`

## Contributing

This is a Lovable project; iterate through the [Lovable editor](https://lovable.dev). Direct pushes to `main` are managed by the platform.

## License

Proprietary. All rights reserved.
