## SkillBridge Africa — MVP Build Plan

**Positioning:** A digital growth ecosystem for African students and young innovators. The MVP ships the **Learn** module fully functional, with Build / Connect / Grow / Launch shown as roadmap teasers.

---

### 1. Foundation & Design System

- Enable **Lovable Cloud** (database, auth, storage).
- Set up the chosen design tokens in `src/styles.css` (oklch equivalents):
  - `--brand-bg` cream `#FDFCF5`, `--brand-navy` `#1A1C2E`, `--brand-orange` `#FF5F05`, `--brand-mint` `#00D494`, `--brand-clay` `#E8E4D9`
  - Fonts: **Bricolage Grotesque** (display) + **Inter** (body) — loaded via `<link>` in `__root.tsx`
- Map these as semantic shadcn tokens so the whole app uses one system.

### 2. Routes

```
/                          Landing page (vision + hero + course preview)
/auth                      Sign up / sign in (email+password, Google)
/_authenticated/
  dashboard               Learner home: enrolled courses, progress, certificates
  courses                 Browse all subjects/courses
  courses/$courseId       Course detail + lesson list + enroll
  lessons/$lessonId       Lesson player (markdown content)
  quizzes/$quizId         Quiz runner → records score
  certificates            User's earned certificates
  profile                 Profile + settings
```

Auth-protected routes live under the integration-managed `_authenticated/` layout. Landing, courses browse, and course detail are public (read-only).

### 3. Database (Lovable Cloud)

- `profiles` — id (→ auth.users), display_name, avatar_url, country, bio
- `subjects` — id, title, slug, description, icon, color
- `courses` — id, subject_id, title, slug, summary, level (fundamental/intermediate/advanced), cover_url
- `lessons` — id, course_id, order, title, content (markdown), duration_min
- `quizzes` — id, course_id, title, passing_score
- `quiz_questions` — id, quiz_id, question, options (jsonb), correct_index
- `enrollments` — user_id, course_id, enrolled_at
- `lesson_progress` — user_id, lesson_id, completed_at
- `quiz_attempts` — user_id, quiz_id, score, passed, taken_at
- `certificates` — id, user_id, course_id, issued_at, code

RLS: users read/write only their own enrollments/progress/attempts/certificates; subjects/courses/lessons/quizzes are public read; admin role (via `user_roles` + `has_role()`) can write course content.

### 4. Landing Page (matches selected direction exactly)

Port the v1 prototype DOM faithfully:
- Sticky nav with orange-square logo + Learn/Build/Connect links + Get Started CTA
- Hero: mint badge, big serif headline with orange "learning", dual CTAs, framed hero image with floating "Live Now" course card
- Dark navy "The Learn Module" section with 3 course cards (2 course + 1 orange CTA card)
- Light ecosystem section showing Learn (active) + Build/Connect/Launch (dimmed roadmap)
- Clay-colored footer CTA block
- Generate the hero image via `generate_image` (prompt from `data-lov-image-placeholder`)

### 5. Learn Module Functionality

- **Dashboard:** enrolled courses with progress bars, "Continue learning" CTA, recent certificates strip
- **Courses browse:** filter by subject, level; cards mirror landing styling
- **Course detail:** overview, lesson list with completion checkmarks, enroll button, quiz at end
- **Lesson player:** markdown content render, "Mark complete" → updates `lesson_progress`, prev/next nav
- **Quiz runner:** one-question-at-a-time, score on submit, on pass → issue certificate
- **Certificates page:** card list with verification code

### 6. Auth

- Email/password + Google (via Lovable broker). Auto-create profile on signup via trigger.
- `/auth` page styled in brand system; redirect to `/dashboard` on success.

### 7. Seed Content

Seed ~3 subjects, ~4 courses (Data Science for Fintech, AgriTech Solutions, Digital Product Design, Fullstack Web3), each with 3–6 lessons and one quiz, so the app is alive on first visit.

---

### Technical Notes

- TanStack Start file-based routes; data via `createServerFn` + TanStack Query loaders
- `requireSupabaseAuth` middleware on user-scoped server fns; public reads via `supabaseAdmin` server fns
- Lesson markdown rendered with `react-markdown`
- Certificate "code" = short nanoid for shareable verification URL (future)
- Out of scope this turn: Build/Connect/Grow/Launch modules, AI assistant, CV builder, internship board — surfaced as roadmap UI only

### Deliverable on Approval

A working Learn module with auth, seeded course content, lesson + quiz flow, certificate issuance, and a landing page that matches the chosen design direction.
