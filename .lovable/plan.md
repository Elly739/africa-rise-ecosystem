## Goals

1. Email notifications for role requests & invites (Lovable Emails).
2. Role-differentiated dashboards (Student / Teacher / Partner / Admin) with the right features and polished UI.
3. Admin gets more oversight tools.
4. Add a project README.

---

## 1. Email notifications

Use Lovable's built-in email system (needs a verified email domain — I'll trigger the setup dialog first if none exists).

Auto-sent app emails:
- **Role request submitted** → confirmation to the applicant ("We got your request, we'll review it")
- **Role request approved / rejected** → notice to the applicant with next steps
- **Admin alert** → `iamellyokello@gmail.com` gets an email whenever a new role request is submitted
- **Invite created** → email to the invitee (when an email is specified on the invite) with the redemption link
- **Invite redeemed** → notice to admin

Templates: `role-request-received`, `role-request-decision`, `role-request-admin-alert`, `role-invite`, `role-invite-redeemed`. All branded with SkillBridge Africa styling.

Server hooks: fire these from the existing `requestRole`, `reviewRoleRequest`, `createRoleInvite`, `redeemRoleInvite` server functions.

---

## 2. Dashboards per role

Currently everyone hits `/dashboard` (the learner view). I'll:

- Detect roles at load and, for privileged users, show a **role switcher / quick-action band** at the top of `/dashboard` with links into their specialised area — the general learner content stays visible below so teachers/partners keep access to their own learning.
- Give each privileged role its own workspace under `/admin/*` (already scoped by role in the sidebar) with new, dedicated landing content:

**Teacher workspace** (`/admin/courses` + new `/admin/teacher`)
- My courses list, "Create course" CTA (stub route → notice), enrolments per course, quiz pass rates, recent learner progress.

**Partner workspace** (`/admin/opportunities` + new `/admin/partner`)
- My posted opportunities, applications inbox with quick status updates, "Post opportunity" CTA.

**Admin workspace** (enhancements to `/admin`)
- New **Announcements** feature: admin posts an in-app notification broadcast to all users (or a role subset). Table `announcements` + fan-out via existing `notifications`.
- Dashboard tiles: pending role requests count, unreviewed submissions, open opportunities, active users this week.
- Quick actions row (approve pending, create invite, post announcement).

**Student (default)** — unchanged content but the top band shows "Request teacher/partner access" only if they have no privileged roles.

---

## 3. UI polish

- Consistent card styles across `/admin/*` (rounded-2xl, subtle border, brand tokens — no ad-hoc colors).
- Stat tiles with icons + trendless numbers (real data from server fn).
- Empty states with friendly copy + CTA.
- Mobile: admin sidebar drawer already exists; verify layouts collapse cleanly.

---

## 4. README.md

Project-root README covering: what SkillBridge Africa is, feature list, tech stack (TanStack Start, Lovable Cloud, Tailwind v4), local dev (`bun install`, `bun run dev`), role model & admin lockdown, contribution notes, and deploy.

---

## Technical notes

- **DB migration**: `announcements` table (title, body, link, target_roles[], created_by, created_at) with RLS + GRANTs + a helper server fn that fan-outs into `notifications`.
- **Email infra**: call `email_domain--check_email_domain_status`; if no domain, show setup dialog and stop until user completes it, then continue.
- **Templates**: React Email tsx under `src/lib/email-templates/`, registered in `registry.ts`.
- **Send helper**: reuse scaffolded `/lovable/email/transactional/send` with `idempotencyKey` derived from `request.id` + event.

Sound good? I'll ship it all in one pass after you confirm.