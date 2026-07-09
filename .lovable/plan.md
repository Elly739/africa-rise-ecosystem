# Admin Dashboard — Quick Win Plan

Add a role-based admin area at `/admin` so you (and future moderators, teachers, and partners) can manage the platform without touching the backend.

## What we are building

A single admin hub with a sidebar that adapts to the user's role. The current app already has a `user_roles` table and a `has_role` helper, so we will extend the role enum and build a lightweight UI on top.

### Roles and permissions

| Role | Access |
|------|--------|
| **admin** | Everything: stats, users, roles, all content, opportunities, applications |
| **moderator** | Content moderation: projects, discussions, community reports |
| **teacher** | Course/lesson/quiz content: view and edit learning content |
| **partner** | Opportunities they posted + applications to those opportunities |

Because the current `opportunities` table does not have a `posted_by` column, the partner view will start as read-only access to all opportunities and applications. A future iteration can scope partner access to their own postings.

## Database change

Extend the existing `app_role` enum to include the new roles.

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';
```

## New files

### Routes

```text
src/routes/_authenticated/_admin.tsx              # layout + RBAC gate
src/routes/_authenticated/_admin/dashboard.tsx    # stats + quick actions
src/routes/_authenticated/_admin/users.tsx          # user list + role assignment
src/routes/_authenticated/_admin/content.tsx        # projects + discussions moderation
src/routes/_authenticated/_admin/opportunities.tsx  # opportunities + applications
src/routes/_authenticated/_admin/courses.tsx        # course/lesson/quiz list (teacher)
```

### Server functions

```text
src/lib/api/admin.functions.ts
```

Includes:
- `getAdminStats()` — counts of users, courses, opportunities, projects, applications, discussions, challenge submissions
- `listUsers()` — paginated users with their roles
- `updateUserRole()` — add/remove roles safely
- `listContentForModeration()` — flagged/new projects and discussions
- `moderateContent()` — approve/hide/delete a project or discussion
- `listOpportunitiesAdmin()` — all opportunities with application counts
- `updateApplicationStatus()` — move applications through the pipeline
- `listCoursesAdmin()` — all courses with lesson/quiz counts

## UI outline

- **Layout**: a two-column shell with a sticky sidebar on desktop and a mobile drawer. The sidebar only shows items the current role can access.
- **Dashboard**: stat cards (e.g. "1,240 users", "32 active opportunities", "87 applications this week"), recent sign-ups, and quick action buttons.
- **Users**: searchable table, role badges, role add/remove buttons (admin only).
- **Content**: tabs for projects and discussions; approve/hide/delete actions.
- **Opportunities**: table of opportunities with application count, status, and an expandable list of applications with status update buttons.
- **Courses**: read-only list for teachers with edit links to the existing lesson/quiz routes.

## Navigation

- Add an "Admin" link to the user menu in `site-nav.tsx` for anyone with an admin/moderator/teacher/partner role.
- Hide the link from regular learners.

## Out of scope

- Full CRUD for courses/lessons/quizzes (teachers can edit through existing routes for now).
- Partner-specific opportunity ownership (partner sees all opportunities until the schema supports `posted_by`).
- Advanced analytics/charts (stats are numbers + tables).
- Email notifications for admin actions.

Approve and I'll ship it in one pass.