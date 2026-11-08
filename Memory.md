# SREC Connect v3.0 — Working Memory & Project State

## 1. Project Overview & Institutional Identity
- **Institution:** Santhiram Engineering College (Autonomous), Nandyal, Andhra Pradesh
- **Department:** Computer Science & Engineering (Artificial Intelligence & Machine Learning)
- **Current Version:** v3.0.0 (Production Ready)
- **Stack:** Next.js 15.5.25 (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM 6.19.3, Neon Serverless PostgreSQL (`v3_production` schema), NextAuth v4 (Google Workspace SSO), Sharp (adaptive WebP compression).

---

## 2. Completed Milestones & System Highlights

### A. Role-Based Login & Clean Single Sign-On
- Clean `/signin` page displaying only **Google Workspace SSO** (`Continue with Google Workspace`).
- Pre-provisioning whitelist protection for college domain (`@srecnandyal.edu.in`).
- Smart automated landing routing (`/auth/landing` & `getRoleLandingUrl`):
  - `SUPER_ADMIN` → `/admin` (Sovereign Command Center)
  - `HOD` → `/admin` (Department Disciplinary & Academic Executive)
  - `WEB_MANAGER` → `/admin` (User Portal & Bulk Ingestion)
  - `FACULTY` → `/admin/achievements` (Faculty Verification Desk)
  - `STUDENT` → `/` (Community Feed & Scholar Hub)

### B. Instagram-Style Team Collaboration & Co-Authoring
- **`MemberSelector.tsx`**: Reusable autocomplete component searching by permanent student roll number (e.g. `22091A3201`) or name.
- **`PostComposer.tsx`**: Supports inviting collaborators; tags added as chips.
- **API Integration**: `POST /api/posts` registers `PostCollaborator` records in `PENDING` status and dispatches in-app notifications.
- **Collaboration Action API**: `/api/posts/[id]/collaborate` allows invited co-authors to `ACCEPT` or `DECLINE`.
- **Feed Card Display**: Shows `{Author} & {Collaborator}` with `🤝 Collab` badge and active invitation banner for pending recipients.

### C. Student Grievances, Discipline & Official Institutional Letters
- **Student Grievance Portal (`/grievances`)**:
  - File grievance across 10 categories with 4 priority levels and confidential HOD bypass toggle.
  - View case dossiers, review timeline, and submit immutable right-to-respond statements.
- **Official Institutional Action Letter (`OfficialActionLetter.tsx`)**:
  - College letterhead, reference number (e.g. `SREC/CSE-AIML/DISC/2026/042`), student roll number, outcome order, sanctions, and HOD signature.
  - Printable/PDF export layout (`window.print()`) viewable in both `/grievances` and `/admin/discipline/[id]`.

### D. Admin Console Responsiveness, Dropdowns & Shell Architecture
- **Resolved Sidebar Accordion Freeze**: Switched from native `<details open={isActive}>` to controlled interactive accordion state (`isOpen`) with automatic active route expansion and accessibility `aria-expanded`.
- **Eliminated Duplicate `<AdminShell>` Layouts**: Centralized `<AdminShell>` inside `src/app/admin/layout.tsx` and stripped nested `<AdminShell>` from child pages, fixing double sidebars, `pl-144` indentation, and z-index click blocking.
- **Fixed Bento Card Pointer Event Interception**: Added `pointer-events-none` to `variant="bento"` gradient overlays in `Card.tsx`, restoring clickability to cards and option selectors across the app.
- **Added Top `AppHeader` to Admin Shell**: Positioned sticky top navigation with institutional emblem, global search, notification bell, theme toggle, and user profile avatar.
- **Implemented Missing Functional Modules**:
  - `/admin/export`: Universal CSV / JSON compliance export for Students, Faculty, Achievements, Events, and Disciplinary Logs.
  - `/admin/deduplication`: Real-time collision radar scanning database for duplicate JNTUA roll numbers, emails, and repeat submissions.

### E. Zero-Overflow & Responsive Alignment Across All Viewports
- Audited across viewports in Playwright (Desktop 1280px & Mobile 375px):
  - **Horizontal Overflows: 0** (`scrollWidth <= clientWidth` on 100% of tested routes).
  - Resolved mobile highlight scrollbar expanding parent grid via `max-w-full overflow-hidden`.
  - Added skeleton loaders (`Skeleton.tsx`, `loading.tsx`) across public and admin routes.
  - Verified mobile drawer hamburger opens and renders sidebar cleanly.

---

## 3. Empirical Verification Evidence
- **Automated Tests:** 39/39 passing across all 8 suites (`npm test`).
- **Production Build:** 50/50 routes compiled cleanly with 0 errors (`npm run build`).
- **Interactive Elements Verification:** Verified all admin accordions, modals, and filters via Playwright (`scripts/verify_admin_interactive_elements.js`).
- **Headless Screenshots:**
  - `verified_clean_signin.png`
  - `verified_admin_sidebar_expanded.png`
  - `verified_admin_user_modal.png`
  - `verified_admin_event_modal.png`
  - `verified_admin_discipline_modal.png`
  - `verified_admin_notice_modal.png`
  - `verified_admin_export.png`
  - `verified_admin_deduplication.png`
  - `verified_admin_mobile_drawer.png`
  - `verified_collab_composer.png`
  - `verified_grievances_portal.png`
  - `verified_grievance_form.png`
  - `verified_admin_discipline_list.png`
  - `verified_official_action_letter.png`
  - `verified_super_admin_launchpad.png`
  - `verified_mobile_all.png`
