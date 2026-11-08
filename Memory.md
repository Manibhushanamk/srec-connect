# Memory.md — Active Session & Working Context

> **Project:** SREC Connect v3.0  
> **Institution:** Santhiram Engineering College (SREC), Nandyal — CSE (AI & ML)  
> **Last Updated:** 2026-11-08  
> **Current Phase:** All Phases Complete (Phases 0 through 11: Production Readiness & Hardening Finalized)  

---

## 1. Current Status & Phase Progress

- **Status:** **100% COMPLETE & PRODUCTION-READY**
- **Test Suite:** 39/39 passing tests across 8 suites (`npx tsx --test tests/*.test.ts`) in 5.3s.
- **Production Build:** Clean `next build` with 45/45 static pages collected and optimized (`exit code 0`).
- **Verified Milestones:**
  - **Phase 0:** Requirements, Architecture, Rules, Phases, Design, Memory documents locked.
  - **Phase 1:** Responsive Instagram + LinkedIn hybrid layout, dark/light theme, public portal shell.
  - **Phase 2:** Neon PostgreSQL integration, Prisma schema with 5 roles (`SUPER_ADMIN`, `HOD`, `WEB_MANAGER`, `FACULTY`, `STUDENT`), Google OAuth domain whitelist.
  - **Phase 3:** Bulk CSV/Excel ingestion with preview, error report, roll number uniqueness, user management.
  - **Phase 4:** Student & Faculty academic portfolios with immutable roll numbers and section privacy toggles.
  - **Phase 5:** Social community feed, Sharp WebP compression (< 500 KB), Cloudflare R2 uploads, likes/comments/bookmarks/reporting.
  - **Phase 6:** Multi-tier achievement moderation desk (`PENDING` -> `RESUBMISSION_REQUIRED` -> `APPROVED` -> `PUBLISHED`).
  - **Phase 7:** Concurrency-safe event registration, automatic waitlist promotion, QR attendance check-in desk.
  - **Phase 8:** Confidential grievances (HOD bypass) and faculty disciplinary cases with immutable response timeline.
  - **Phase 9:** Google Drive service for certificates, audience announcements, in-app notification bell.
  - **Phase 10:** Recharts analytics dashboards, universal role-aware search, dynamic sitemap and robots.txt.
  - **Phase 11:** Production build (`NODE_OPTIONS='--max-old-space-size=4096' next build`), secret isolation, clean test harness.

---

## 2. Key Architecture Decisions Made

1. **Architecture Style:** Next.js 15 App Router modular monolith. Microservices deferred to eliminate unnecessary distributed complexity.
2. **Database Provider:** Neon Serverless PostgreSQL with Prisma ORM 6.x. Connection pooling via `DATABASE_URL` and direct migrations via `DIRECT_URL`.
3. **Authentication Strategy:** Pre-provisioned Google OAuth only. Public self-signup disabled. Student Roll Number is permanent unique identity anchor; email is login identity.
4. **Storage Tri-Partition:**
   - **Cloudflare R2:** High-speed media storage for social feed images (Sharp WebP <= 500 KB).
   - **Google Drive API:** Institutional certificate and public PDF storage (Anyone with link - Viewer).
   - **Private Secure Store:** Restricted server-authenticated downloads for confidential disciplinary and grievance evidence.
5. **No Fake Logos:** Authentic SREC assets or neutral placeholders only; zero AI-generated crests.

---

## 3. Touched & Tracked Files

| File Path | Description |
|---|---|
| `package.json` | Next.js 15, Prisma 6, Lucide, Recharts, Sharp, PapaParse, XLSX, QR code, 4GB heap build & test script |
| `src/app/*` | 45 routes covering Public, Feeds, Portfolios, Admin Desk, Events, Discipline, Notices, Analytics |
| `src/lib/*` | Prisma singleton, NextAuth config, Cloudflare R2, Google Drive, QR code generator |
| `tests/*` | 8 automated suites covering RBAC, Ingestion, Feed, Achievements, Events, Discipline, Drive, Analytics |
| `PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md` | Core GSD documentation suite |

---

## 4. Operational Commands

- Run Development Server: `npm run dev` (`http://localhost:3000`)
- Run Automated Test Suite: `npm test` (`npx tsx --test tests/*.test.ts`)
- Build Production Bundle: `npm run build`
- Start Production Server: `npm start`
