# Memory.md — Active Session & Working Context

> **Project:** SREC Connect v3.0  
> **Institution:** Santhiram Engineering College (SREC), Nandyal — CSE (AI & ML)  
> **Last Updated:** 2026-11-08  
> **Current Phase:** Phase 0 — Discovery & Project Control  

---

## 1. Current Status & Phase Progress

- **Active Goal:** Phase 3 (User & Academic Administration: Bulk CSV/Excel Import & Roll Numbers) Completed; Ready to start Phase 4 (Profiles & Academic Portfolios: LinkedIn-inspired Student & Faculty Pages).
- **Current State:**
  - Resolved sign-in route mismatch: Next.js App Router route group `(auth)` maps to `/signin`, whereas NextAuth was pointing to `/auth/signin` (404). Fixed by updating `authOptions`, adding redirect handlers for `/login` and `/auth/signin`, and pointing `AppHeader.tsx` to `/signin`.
  - Added dual-mode authentication: Google OAuth with domain/pre-provisioning enforcement + `CredentialsProvider` for instant local testing and persona switching (`SUPER_ADMIN`, `HOD`, `FACULTY`, `STUDENT`).
  - Bootstrapped and seeded all 5 institutional roles with realistic departments and roll numbers (`scripts/seed-roles.ts`).
  - Implemented Phase 3 User Management (`src/app/admin/users/page.tsx` & `/api/admin/users`) with search, role filters, status toggling, and single pre-provisioning modal.
  - Implemented Two-Stage Bulk CSV / Excel Import Engine (`src/app/admin/bulk-upload/page.tsx` & `/api/admin/users/bulk-import`) with sample CSV download, JNTUA roll number format validation (`^\d{2}09(1A|5A)\d{2}[0-9A-Z]{2}$`), error reporting table, and transactional DB commit.
  - Integration test suite passing (5/5 tests in `tests/user-admin-bulk.test.ts`).
  - TypeScript typecheck passing cleanly with 0 errors (`tsc --noEmit`).
  - Empirically verified with Playwright CLI screenshots: `authenticated_home_verified.png`, `admin_dashboard_verified.png`, `verified_admin_users.png`, `verified_admin_bulk_upload.png`.
  - Commits landed: `a5370e4`.

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
