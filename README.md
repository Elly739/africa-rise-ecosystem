# SkillBridge Africa

A learning, careers, and innovation platform for African talent — courses, opportunities, community, challenges, and an AI mentor, in one place.

Live: <https://pioneer-africa-hub.lovable.app>

## Features

- **Learn** — Courses with lessons, quizzes, XP, streaks, and certificates.
- **Careers** — Opportunity board with applications tracking.
- **Innovate** — Public project showcase with likes and comments.
- **Challenges** — Team-based competitions with submissions and voting.
- **Community** — Discussion threads and replies.
- **AI Mentor & Advisor** — Personalised guidance powered by Lovable AI Gateway.
- **Role-based workspaces** — Dedicated admin, teacher, partner, and moderator dashboards.
- **In-app notifications & announcements** — Real-time bell + admin broadcast to any audience.

## Roles

| Role | Who it's for | How to obtain |
| --- | --- | --- |
| `student` | Everyone (default on signup) | Automatic |
| `teacher` | Course authors | Request via `/request-access` or admin invite |
| `partner` | Organisations posting opportunities | Request or admin invite |
| `moderator` | Trusted community helpers | Admin invite only |
| `admin` | Platform owner | Locked to `iamellyokello@gmail.com` by database trigger |

The admin role is enforced at the database layer: only a verified `iamellyokello@gmail.com` account can hold it, and any attempt to grant it to another user is rejected.

## Tech stack

- **Framework** — [TanStack Start](https://tanstack.com/start) (React 19, SSR, server functions) on Vite 7
- **Styling** — Tailwind CSS v4 with a custom brand palette (see `src/styles.css`)
- **Backend** — Lovable Cloud (Postgres + Auth + Storage + Realtime)
- **AI** — Lovable AI Gateway (chat, embeddings, image generation)
- **Runtime** — Deployed to Cloudflare Workers (edge)

## Project layout

```
src/
  routes/                    file-based routing (TanStack Router)
    __root.tsx               app shell
    _authenticated/          gated subtree (auth required)
      admin.tsx              role-scoped admin layout
      admin.index.tsx        role-aware dashboard
      admin.announcements.tsx  broadcast messages
      admin.requests.tsx     role application review
      admin.invites.tsx      invite token generator
      admin.users.tsx        user directory
      admin.content.tsx      moderation queue
      admin.opportunities.tsx  partner pipeline
      admin.courses.tsx      teacher catalogue
      dashboard.tsx          learner + role-band dashboard
      request-access.tsx     apply for teacher/partner/moderator
      invite.$token.tsx      redeem an invite
      ...
  components/                shared UI
  lib/api/*.functions.ts     server functions (createServerFn)
  integrations/supabase/     generated client + helpers (do not edit)
supabase/migrations/         database migrations
```

## Local development

Requirements: [Bun](https://bun.sh) (or Node 20+ with npm).

```bash
bun install
bun run dev
```

The app runs at <http://localhost:8080>. Database changes go through Supabase migrations under `supabase/migrations/` — apply via the Lovable Cloud editor.

## Environment

The following variables are auto-injected in Lovable projects; you should not need to set them manually:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — browser client
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — server functions
- `LOVABLE_API_KEY` — AI Gateway + connectors

## Deploy

Publishing is managed through the Lovable dashboard — click **Publish**. This project is served from Cloudflare Workers with two stable URLs:

- Production — `https://pioneer-africa-hub.lovable.app`
- Preview — automatically per branch

## Contributing

This is a Lovable project; iterate through the [Lovable editor](https://lovable.dev). Direct pushes to `main` are managed by the platform.

## License

Proprietary. All rights reserved.
