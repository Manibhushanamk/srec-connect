# Memory.md — Active Session & Working Context

> **Project:** SREC Connect v3.0  
> **Institution:** Santhiram Engineering College (SREC), Nandyal — CSE (AI & ML)  
> **Last Updated:** 2026-11-08  
> **Current Phase:** Phase 5 — Social Community & Feed Complete; Ready for Phase 6 (Achievements & Verification)  

---

## 1. Current Status & Phase Progress

- **Active Goal:** Phase 5 (Social Community & Feed: Post Composer, Sharp WebP Compression, Cloudflare R2 Pipeline, Interactive Likes/Bookmarks/Comments) Completed; All pages audited and layout bugs fixed. Ready to start Phase 6 (Achievements & Multi-Tier Verification Workflow).
- **Current State:**
  - Resolved AppShell layout constraint: Directories and profiles were previously cramped into `max-w-2xl` with an invasive right rail. Updated `AppShell.tsx` to conditionally give directory & profile pages full responsive width (`max-w-5xl`/`max-w-6xl`) and reserve the 3-column layout exclusively for the Home Feed.
  - Eliminated dead/broken navigation links: Replaced non-existent `/incidents` and `/documents` with live `/departments` and `/about`; mapped admin tools to live `/admin/users` and `/admin/bulk-upload`.
  - Added role-based Profile Router ([`src/app/profile/page.tsx`](file:///home/kmanib/Documents/srec-connect-v3/src/app/profile/page.tsx)) and redirects for `/feed` and `/achievements/submit`.
  - Optimized Academic Departments query ([`src/app/(public)/departments/page.tsx`](file:///home/kmanib/Documents/srec-connect-v3/src/app/(public)/departments/page.tsx)): Replaced 44 parallel DB queries with 4 grouped queries, eliminating database connection pool timeouts.
  - Implemented Phase 5 Post Composer ([`src/components/social/PostComposer.tsx`](file:///home/kmanib/Documents/srec-connect-v3/src/components/social/PostComposer.tsx)) with image preview, character count, visibility selection, and strict client/server enforcement of max 2 images.
  - Implemented Sharp WebP Image Pipeline ([`src/lib/image-processor.ts`](file:///home/kmanib/Documents/srec-connect-v3/src/lib/image-processor.ts) & [`src/lib/media-constants.ts`](file:///home/kmanib/Documents/srec-connect-v3/src/lib/media-constants.ts)) ensuring max 1200px dimensions, WebP compression, and `<= 500 KB` file size.
  - Implemented Community Feed APIs:
    - [`src/app/api/posts/route.ts`](file:///home/kmanib/Documents/srec-connect-v3/src/app/api/posts/route.ts) (GET list with filters & POST creation with R2 uploads)
    - [`src/app/api/posts/[id]/like/route.ts`](file:///home/kmanib/Documents/srec-connect-v3/src/app/api/posts/[id]/like/route.ts) (toggle like)
    - [`src/app/api/posts/[id]/bookmark/route.ts`](file:///home/kmanib/Documents/srec-connect-v3/src/app/api/posts/[id]/bookmark/route.ts) (toggle bookmark)
    - [`src/app/api/posts/[id]/comments/route.ts`](file:///home/kmanib/Documents/srec-connect-v3/src/app/api/posts/[id]/comments/route.ts) (fetch & post comments)
    - [`src/app/api/posts/[id]/report/route.ts`](file:///home/kmanib/Documents/srec-connect-v3/src/app/api/posts/[id]/report/route.ts) (report post for moderation)
  - Interactive Feed Card ([`src/components/social/FeedCard.tsx`](file:///home/kmanib/Documents/srec-connect-v3/src/components/social/FeedCard.tsx)) wired to backend APIs with optimistic updates.
  - Integration test suites passing: 29/29 tests passing across `tests/auth-rbac.test.ts`, `tests/user-admin-bulk.test.ts`, `tests/portfolios.test.ts`, and `tests/social-feed.test.ts`.
  - TypeScript typecheck passing cleanly with 0 errors (`tsc --noEmit`).
  - Empirically verified end-to-end post creation and like interaction via Playwright (`verified_live_feed_post.png`).

---

## 2. Key Architecture Decisions Made

1. **Architecture Style:** Next.js 15 App Router modular monolith. Microservices and Kubernetes deferred to eliminate unnecessary distributed complexity.
2. **Database Provider:** Neon Serverless PostgreSQL with Prisma ORM 6.x. Connection pooling configured via `DATABASE_URL` and direct migrations via `DIRECT_URL`.
3. **Authentication Strategy:** Pre-provisioned Google OAuth only. Public signup disabled. Student Roll Number is permanent unique identity anchor; email is login identity.
4. **Storage Tri-Partition:**
   - **Cloudflare R2:** High-speed media storage for social feed images (Sharp WebP <= 500 KB).
   - **Google Drive API:** Institutional certificate and public PDF storage (Anyone with link - Viewer).
   - **Private Secure Store:** Restricted server-authenticated downloads for confidential disciplinary and grievance evidence.
5. **No Fake Logos:** Authentic SREC assets or neutral placeholders only; zero AI-generated crests.

---

## 3. Touched & Tracked Files

| File Path | Description |
|---|---|
| `.env` | Synchronized with active Neon DB, Cloudflare R2, and new Google OAuth client credentials |
| `.gitignore` | Configured to ignore secrets, build caches, and node_modules |
| `PRD.md` | Full product requirements document for SREC Connect v3.0 |
| `Architecture.md` | Modular monolith architecture, stack, and security boundaries |
| `Rules.md` | AI coding standards, Karpathy minimal code rules, and safety boundaries |
| `Phases.md` | 12-phase sequential implementation roadmap with acceptance tests |
| `Design.md` | Instagram + LinkedIn hybrid visual design system, color tokens, and responsive layout |
| `Memory.md` | Active session working memory and state tracking |

---

## 4. Next Actions to Unlock Phase 1

1. Complete Blueprint documentation files in `docs/` (`PROJECT_BRIEF.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, `SECURITY.md`, `DATA_MODEL.md`, `ASSET_SOURCES.md`, `DECISIONS.md`, `IMPLEMENTATION_PLAN.md`).
2. Complete `.gsd/SPEC.md` and `.gsd/ROADMAP.md`.
3. Execute `plan-checker` verification on the generated plan.
4. Present the complete plan and architectural decisions to the user for explicit approval.
