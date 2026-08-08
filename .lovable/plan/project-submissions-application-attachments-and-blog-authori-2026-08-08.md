# Project submissions, application attachments, and blog authoring

Four connected improvements: tell builders what happens after they submit a project, let them add a cover image, let them attach an existing project when applying, and restrict blog writing to admins and partners.

## 1. What happens next after submitting a project

Today submitting a project just drops you on the project page with no guidance.

- After a successful submit, land on the project page with a one-time "You're live" panel showing the next steps:
  1. Add a cover image and demo/repo links to make it credible
  2. Turn on "Looking for collaborators" to get join requests
  3. Share it to your public profile — it feeds your Innovation Score
  4. Enter an open challenge or attach it to an opportunity application
- Add a persistent "Next steps" checklist card on the owner's view of the project page that ticks off automatically (cover image added, links added, collaborators open, first like received).
- Owner also gets a notification-style nudge if a project has no cover image or description after submission.

## 2. Cover image upload for projects

- New public storage bucket for project covers; owners upload an image from the submit form and from the project page.
- Submit modal gains an optional image picker with preview; if none is chosen, cards keep the current text-only look.
- Project cards in the Innovation Hub and profile portfolios show the image when present.

## 3. Attach an existing project when applying

- When applying to an opportunity (hackathon, grant, incubator, etc.), the apply dialog shows a dropdown of the applicant's own projects.
- Selecting one attaches it to the application and autofills the notes field with the project's title, summary, and links (still editable).
- The application record stores the linked project so it can be shown in the application tracker and to partners reviewing it.
- Applying with no projects yet shows a short prompt linking to the Innovation Hub submit flow.

## 4. Blog authoring limited to admins and partners

- Only admins and partners can create or edit blog posts. Everyone else keeps read-only access to published posts.
- Partners can create, edit, and delete only their own posts; admins can manage all posts and control publishing.
- New "Blog" section inside the admin/partner workspace: list of posts with status, plus a write/edit form (title, slug, excerpt, category, cover image, markdown body, read time, publish toggle).
- Add a "Write an article" entry point on the admin and partner dashboards.

## Technical notes

- Migration: add `cover_url` handling for projects (column already exists), add `project_id` to `applications` referencing `public.projects`, add `author_id` to `blog_posts` referencing the author, plus GRANTs and RLS policies — read published posts for anon/authenticated; insert/update/delete for `has_role(auth.uid(),'admin')` or `has_role(auth.uid(),'partner') AND author_id = auth.uid()`.
- Storage: create a public `project-covers` bucket with owner-scoped write policies on `storage.objects`.
- Server functions: extend `createProject`/project update in `ecosystem.functions.ts` for cover upload; extend `applyToOpportunity` in `careers.functions.ts` to accept and validate an owned `projectId`; new `blog-admin.functions.ts` for authenticated CRUD with role checks (`listMyPosts`, `upsertPost`, `deletePost`).
- Routes: new `/admin/blog` (visible to admin and partner), next-steps UI in `innovate.$projectSlug.tsx`, image field in the submit modal in `innovate.tsx`, project picker in the careers apply flow.
