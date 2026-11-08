# Memory.md — Active Session & Working Context

> **Project:** SREC Connect v3.0  
> **Institution:** Santhiram Engineering College (SREC), Nandyal — CSE (AI & ML)  
> **Last Updated:** 2026-11-08  
> **Current Phase:** Phase 9 — Google Drive, Notices & Notifications Complete; Currently Executing Phase 10 (Analytics, Public Portal & Operations)  

---

## 1. Current Status & Phase Progress

- **Active Goal:** Phase 9 (Google Drive Backend Service, Security Boundary Isolation, Announcements Audience Fan-Out, and In-App Notification Center) Completed & Empirically Verified. Ready for Phase 10 (Analytics, Public Portal & Operations).
- **Current State:**
  - **Phase 9 Complete:**
    - Google Drive Backend Service ([`src/lib/drive.ts`](file:///home/kmanib/Documents/srec-connect-v3/src/lib/drive.ts)): Uploads verified academic certificates with public viewer permissions, strictly blocking confidential grievance and disciplinary attachments via `DriveSecurityError`.
    - Database Models: Added `Announcement` and `Notification` to `prisma/schema.prisma` and synchronized with Neon PostgreSQL.
    - Announcements API ([`src/app/api/announcements/route.ts`](file:///home/kmanib/Documents/srec-connect-v3/src/app/api/announcements/route.ts)): Audience filtering (batch, section, role) and automatic notification fan-out with audit logging.
    - Notifications API ([`src/app/api/notifications/route.ts`](file:///home/kmanib/Documents/srec-connect-v3/src/app/api/notifications/route.ts)): Unread count and mark-as-read endpoints.
    - UI Components:
      - Live Notification Bell Dropdown ([`src/components/layout/NotificationBell.tsx`](file:///home/kmanib/Documents/srec-connect-v3/src/components/layout/NotificationBell.tsx)) integrated into [`src/components/layout/AppHeader.tsx`](file:///home/kmanib/Documents/srec-connect-v3/src/components/layout/AppHeader.tsx).
      - Admin Notices Management Console ([`src/app/admin/notices/page.tsx`](file:///home/kmanib/Documents/srec-connect-v3/src/app/admin/notices/page.tsx)).
    - 4/4 tests passed in `tests/drive-notices.test.ts` and captured Playwright screenshot `verified_admin_notices.png`. Total project tests: 35/35 passing.
  - **Phase 8 Complete (`e3c60e6`):**
    - Complaints & Discipline Management with confidential HOD bypass and immutable response timeline.
  - **Phase 7 Complete (`c303c01`):**
    - Events lifecycle, transactional capacity concurrency, automatic waitlist promotion, QR attendance desk.
  - **Phases 1-6 Complete:**
    - App Foundation, RBAC, Bulk Ingestion, Portfolios, Social Feed, and Achievements Verification.

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
