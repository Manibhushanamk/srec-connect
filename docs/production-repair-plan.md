# SREC CONNECT — Production Repair Plan

> **Plan Status:** ACTIVE EXECUTION  
> **Target Release:** SREC CONNECT v3.0.0 Production  
> **Methodology:** GSD Protocol (SPEC → PLAN → EXECUTE → VERIFY → COMMIT)

---

## Phase Breakdown

### Phase 1: Database Schema Expansion
- [ ] Add `BugReport` model and enums (`BugCategory`, `BugSeverity`, `BugStatus`) to `prisma/schema.prisma`.
- [ ] Add `BackupRecord` model to track automated and manual database backups (status, driveFileId, checksum, recordCounts, encrypted, initiatedBy, timestamp).
- [ ] Run `npx prisma db push` to synchronize Neon PostgreSQL database.
- [ ] Run `npx prisma generate` to refresh Prisma Client.

### Phase 2: Google Drive Overhaul & Headless Token Refresh Engine
- [ ] Implement robust token persistence in `SystemSetting` for Super Admin Google Drive connection.
- [ ] Implement auto-refreshing OAuth2 client in `src/lib/drive.ts` that automatically exchanges refresh tokens when expired.
- [ ] Build `/api/admin/drive` endpoints:
  - `GET /api/admin/drive/status`: returns connected account, folder health, quota, last sync.
  - `POST /api/admin/drive/connect`: saves authorized OAuth tokens and initializes root folders (`SREC Connect`, `SREC Connect Backups`).
  - `POST /api/admin/drive/disconnect`: safely revokes and unlinks Drive tokens.
  - `GET /api/admin/drive/files`: lists files with metadata and secure download links.
- [ ] Update `uploadCertificateToDrive` to seamlessly utilize the refreshed tokens with institutional fallback.

### Phase 3: Automated 14-Day Database Backup Engine
- [ ] Build `src/lib/backup.ts`:
  - Full relational snapshot of all schemas and tables in JSON.
  - Computes SHA-256 integrity checksum.
  - Encrypts payload with AES-256-GCM using `BACKUP_ENCRYPTION_KEY` (with secure fallback).
  - Uploads encrypted backup `.enc.json` to Super Admin Google Drive in `SREC Connect Backups` folder.
  - Records execution in `BackupRecord` database table.
- [ ] Implement `src/app/api/cron/backup/route.ts`:
  - Protected with `CRON_SECRET` authorization bearer token.
  - Checks if >= 14 days since last successful backup (idempotent, safe against duplicate cron invocations).
  - Executes backup, verifies upload, and updates database records.
- [ ] Implement `/api/admin/backup` endpoints:
  - `GET /api/admin/backup`: returns backup history, status, last backup, next scheduled backup.
  - `POST /api/admin/backup`: allows Super Admin to trigger a verified manual backup anytime.
  - `POST /api/admin/backup/restore`: provides safe, isolated restore verification with pre-restore dry-run and current state snapshot.
- [ ] Build Super Admin Backup & Recovery Dashboard in `/admin/settings` or dedicated `/admin/backup`.

### Phase 4: In-App Bug Reporting & Issue Management System
- [ ] Build `src/app/api/bug-reports/route.ts`:
  - `POST`: submit bug report with sanitized route, browser diagnostics, category, severity, description.
  - `GET`: list reports (scoped to user or all for Super Admin).
- [ ] Build `src/app/api/bug-reports/[id]/route.ts`:
  - `GET`: fetch full report details and audit trail.
  - `PATCH`: Super Admin triage, status changes (NEW → TRIAGED → INVESTIGATING → FIX_IN_PROGRESS → RESOLVED → CLOSED), priority adjustments, internal notes, assigned staff.
- [ ] Build user-facing Bug Report Component & Page:
  - `src/components/shared/BugReportModal.tsx` accessible from navigation bar and footer.
  - `src/app/(public)/report-bug/page.tsx` for direct access.
- [ ] Build Super Admin Bug Dashboard:
  - `src/app/admin/bugs/page.tsx` with search, filtering by category/severity/status, audit trail, and quick triage actions.

### Phase 5: Routing, Navigation & Zero-404 Elimination
- [ ] Fix `Navbar.tsx` to properly recognize `Role.SUPER_ADMIN`, `Role.HOD`, and `Role.WEB_MANAGER`.
- [ ] Create `src/app/admin/settings/page.tsx` with Google Drive Connection, Backup Controls, System Configuration, and Domain allowlist.
- [ ] Create `src/app/not-found.tsx`: premium, accessible, branded 404 page with search, role-based dashboard links, and quick report button.
- [ ] Audit every link in `AdminSidebar.tsx`, `DesktopSidebar.tsx`, `MobileBottomNav.tsx`, and footer.

### Phase 6: Production Hardening, Security Headers & Rate Limiting
- [ ] Configure security headers in `next.config.mjs` (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- [ ] Implement API rate limiter utility (`src/lib/rate-limit.ts`).
- [ ] Sanitize error outputs across all API routes.

### Phase 7: Verification, Automated Testing & Documentation
- [ ] Write comprehensive unit & integration tests:
  - `tests/backup-engine.test.ts`
  - `tests/bug-reporting.test.ts`
  - `tests/drive-integration.test.ts`
- [ ] Run full test suite (`npm test`).
- [ ] Run production build (`npm run build`).
- [ ] Update `docs/backup-and-restore.md`, `docs/security-audit.md`, `docs/qa-test-plan.md`, `docs/production-release-report.md`.
