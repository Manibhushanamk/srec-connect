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

### F. Directory Layout Overhaul & Laptop Grid Modernization
- **Horizontal Filter Toolbars**:
  - Replaced cramped vertical `<aside>` sidebars on `/students`, `/faculty`, `/achievements`, and `/events` with sleek horizontal full-width toolbars featuring real-time search and dropdown filters.
  - Replaced narrow 2-column cards with responsive 3-column / 4-column grids with spacious margins, preventing name truncation and layout crunch on laptop screens.
- **Universal Theme Contrast (Light & Dark Mode)**:
  - Replaced hardcoded `text-slate-100`, `text-slate-400`, and `text-slate-500` classes with semantic tokens (`text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`).
  - Styled `<select>` dropdowns with native theme backgrounds (`bg-background text-foreground border-border`), eliminating stark white boxes and unreadable white-on-white text in dark mode.

### G. Visual Identity, Speed & Scholar Profile Directory Cards
- **Official SREC College Shield Logo**: Integrated uploaded official institutional emblem (`/images/srec-logo.png`) into `AppHeader.tsx`, `Navbar.tsx`, and `/signin` page with clean branding and high resolution.
- **Instant Full-Page Navigation Feedback**: Implemented `GlobalNavigationLoader.tsx` registered in root layout providing 0ms click feedback, top glowing progress bar, and floating SREC loading indicator during route transitions.
- **Collaboration Autocomplete by Roll Number**: Resolved `MemberSelector.tsx` dropdown closing prematurely on click by adopting `onMouseDown` prevent-default handling, and updated `/api/members/search` to query both `User` and `Student` tables for instant roll number matching.
- **Removed "About CSE (AI & ML)" from Feed**: Cleaned home feed navigation in `src/app/(public)/page.tsx` down to strictly `Department Feed` and `Verified Portfolios`.
- **Scholar Directory Card Architecture (`ScholarDirectoryCard.tsx`)**: Replaced generic cards in `/students`, `/faculty`, `/achievements`, and `/` (`PORTFOLIOS` tab) with the exact dark-themed scholar card layout:
  - Header banner with dot grid pattern and top-right department pill.
  - Overlapping circular avatar with institutional verification checkmark.
  - `Connect` / `View Proof` action button + profile share button with clipboard feedback.
  - Full Name, verified badge, and role chip (`STUDENT`, `FACULTY`, `HOD`).
  - Institutional metadata row: Roll number chip with shield icon, Batch & Section (for students), Academic designation & degrees (for faculty), Date (for achievements), Location, and institutional Email.
  - 4-metric stat cards row (`Posts/Papers/Rank`, `Verified`, `Events/Level`, `Skills/Tags`).
  - Verified technical skills row with ribbon badges.
- **Feed Live Syncing Resolution**:
  - Replaced the stuck cyan "Syncing live feed..." text with animated skeleton placeholders (`FeedCardSkeleton`) and immediate post rendering.

### G. Comprehensive Multi-Role Testing & RBAC Access Matrix
- **Student Role (`viswanadhum9985559753@gmail.com`)**:
  - Verified access to Student Dashboard (`/dashboard/student`), Achievement Submission (`/dashboard/student/submit`), Feed (`/`), Grievances (`/grievances`), and Events (`/events`).
  - Admin quick actions and sensitive admin endpoints are properly restricted.
- **Faculty Role (`faculty@srecnandyal.edu.in`)**:
  - Fixed fatal 500 runtime crash on `/dashboard/faculty` caused by non-serializable props in `EmptyState`.
  - Added Research & Grant submission page at `/dashboard/faculty/submit`.
  - Granted Verification Desk access (`/admin/achievements`) so faculty can verify student submissions without getting access-denied loops.
- **HOD Role (`hod@srecnandyal.edu.in`)**:
  - Verified sovereign department access to Disciplinary Incident Management (`/admin/discipline`), Grievances (`/admin/grievances`), and Official Action Letter issuance.
- **Super Admin Role (`manibhushanam4k@gmail.com`)**:
  - Verified system-wide Trash & Soft-Delete Recovery (`/admin/trash`), Role Management (`/admin/users`), Universal Export, and Database Deduplication.

### F. Layout Modernization, Disciplinary Confidentiality & Official Notices
- **Horizontal Filter Bar Architecture**: Replaced legacy vertical sidebars in `/students`, `/faculty`, `/achievements`, and `/events` with sleek, full-width top horizontal bars. Eliminated input overflow, text truncation, and cramped card columns on laptop screens (1440px / 1280px).
- **Theme-Adaptive Input Primitives**: Upgraded `.input-field`, `select.input-field`, and `.label-text` in `globals.css` to use semantic CSS design variables (`bg-background`, `border-border`, `text-foreground`, `text-muted-foreground`), ensuring flawless contrast in both dark and light themes without white box glitches.
- **Strict Disciplinary Confidentiality (HOD-Only Visibility)**:
  - Restricted regular faculty queries in `/api/incidents` to strictly `where.reporterId = currentUser.id`. Faculty can no longer see disciplinary warnings given to students by other instructors.
  - Granted full department incident access to `HOD` and `SUPER_ADMIN`.
  - Added dedicated section/batch tags (`Sec A`, `Batch 2022-2026`) and category tabs (`All Dossiers`, `Student Grievances`, `Faculty Conduct Notices`) in `/admin/discipline`.
- **Dynamic Official Notices Rail**:
  - Connected `RightContextRail.tsx` to `/api/announcements` with live department fetching.
  - Added role-gated `+ Post` quick action for `HOD`, `FACULTY`, and `SUPER_ADMIN`.
  - Added interactive modal dialog displaying complete notice text, issuing authority, and target section/batch.

### G. Direct Google Drive File Upload & Public Sharing Automation
- **Drive OAuth Scope Integration**: Extended NextAuth GoogleProvider authorization params with `https://www.googleapis.com/auth/drive.file`. When signing in with Google Workspace, users grant file-level Drive access without compromising private drive folders.
- **Drive Client & Sharing Protocol (`drive.ts`)**:
  - Support for user OAuth access tokens (`accessToken`) alongside institutional Service Account (`GOOGLE_PRIVATE_KEY` / `GOOGLE_SERVICE_ACCOUNT_EMAIL`).
  - Automatic public viewer permission creation via Google Drive API v3:
    `drive.permissions.create({ fileId, requestBody: { role: 'reader', type: 'anyone' } })`.
- **Upload API Endpoint (`POST /api/drive/upload`)**:
  - Validates authentication and file parameters (PDF, PNG, JPG, JPEG, WEBP, DOCX up to 15 MB).
  - Enforces strict security boundary via `assertDriveAllowed`: blocks sensitive disciplinary/misconduct files while allowing certificates, publications, and event banners.
  - Returns `webViewLink` and `webContentLink` with `isPublicLink: true` and logs to `AuditLog`.
- **Reusable `DriveFileUploader.tsx`**:
  - Drag-and-drop file upload zone with animated progress indicator, file size calculation, Google Drive link preview button, removal action, and toggle to manual URL entry.
  - Fully integrated into both Student submission (`/dashboard/student/submit`) and Faculty submission (`/dashboard/faculty/submit`).

---

## 3. Empirical Verification Evidence
- **Automated Tests:** 40/40 passing across all 8 suites (`npm test`).
- **TypeScript:** 0 errors (`npx tsc --noEmit`).
- **Visual Evidence:**
  - `verify_drive_upload_zone_empty.png`: Verified empty drag-and-drop Google Drive upload zone.
  - `verify_drive_upload_success_state.png`: Verified upload completion card with `Shared with Anyone (Viewer)` badge, file metadata, and Google Drive viewer link.
  - `verify_drive_faculty_submit.png`: Verified faculty document upload integration.
  - `verify_admin_dark_students.png`: Verified full-width horizontal bar and spacious 3-column student cards in dark mode.
  - `verify_admin_dark_faculty.png`: Verified horizontal filter and spacious cards in dark mode.
  - `verify_admin_dark_achievements.png`: Verified 4-column filter bar and centered empty state.
  - `verified_laptop_students.png`, `verified_laptop_faculty.png`, `verified_laptop_achievements.png`, `verified_laptop_events.png`: Verified light mode responsiveness on 1440x900 laptop resolution.
- **Production Build:** 51/51 routes compiled cleanly with 0 TypeScript/ESLint errors (`npm run build`).
- **Playwright Visual Verification:**
  - `verified_students_light.png` & `check_students_dark.png`
  - `verified_faculty_light.png` & `check_faculty_dark.png`
  - `verified_achievements_light.png` & `check_achievements_dark.png`
  - `verified_events_light.png` & `check_events_dark.png`
  - `check_feed_top.png` (verified feed tabs and skeleton resolution)
  - Total Issues / Horizontal Overflows: **0**
  - Console Errors / Uncaught Exceptions: **0**
  - High-res visual artifacts generated: 38 full-page screenshots + `inspection_report.json`.
- **Admin Shell & Modal Hardening:**
  - `AdminSidebar.tsx`: Resolved React hook ordering violation in `MenuGroup`.
  - `Modal.tsx`: Added client-mount guard to ensure 100% hydration safety in React 19 / Next.js 15.
  - `/api/departments`: Implemented active department query route matching Prisma schema.
- **Visual Artifacts:**
  - `site_home_feed_public_desktop.png` / `_mobile.png`
  - `site_sign_in_page_desktop.png` / `_mobile.png`
  - `site_achievements_honors_wall_desktop.png` / `_mobile.png`
  - `site_events_directory_desktop.png` / `_mobile.png`
  - `site_students_directory_desktop.png` / `_mobile.png`
  - `site_faculty_directory_desktop.png` / `_mobile.png`
  - `site_departments_page_desktop.png` / `_mobile.png`
  - `site_about_page_desktop.png` / `_mobile.png`
  - `site_home_feed_authenticated_desktop.png` / `_mobile.png`
  - `site_user_profile_workspace_desktop.png` / `_mobile.png`
  - `site_grievances_student_portal_desktop.png` / `_mobile.png`
  - `site_student_portfolio_22091a3201_desktop.png` / `_mobile.png`
  - `site_admin_command_center_desktop.png` / `_mobile.png`
  - `site_admin_users_directory_desktop.png` / `_mobile.png`
  - `site_admin_achievements_verification_desktop.png` / `_mobile.png`
  - `site_admin_events_manager_desktop.png` / `_mobile.png`
  - `site_admin_discipline_manager_desktop.png` / `_mobile.png`
  - `site_admin_notices_broadcast_desktop.png` / `_mobile.png`
  - `site_admin_bulk_ingestion_desktop.png` / `_mobile.png`
  - `site_admin_data_export_desktop.png` / `_mobile.png`
  - `site_admin_deduplication_radar_desktop.png` / `_mobile.png`
  - `site_admin_analytics_hub_desktop.png` / `_mobile.png`
