# SREC CONNECT — Production Repair Plan & Handoff Ledger

> **Plan Status:** ALL PHASES COMPLETE & VERIFIED  
> **Target Release:** SREC CONNECT v3.0.0 Production (`https://srecconnect.dpdns.org`)  
> **Methodology:** GSD Protocol (SPEC → PLAN → EXECUTE → VERIFY → COMMIT)

---

## 1. Execution & Remediation Status

### Phase 1: Database Schema Expansion
- [x] Add `BugReport` model and enums (`BugCategory`, `BugSeverity`, `BugStatus`) to `prisma/schema.prisma`.
- [x] Add `BackupRecord` model to track automated and manual database backups.
- [x] Run `npx prisma db push` to synchronize Neon PostgreSQL database.
- [x] Run `npx prisma generate` to refresh Prisma Client.

### Phase 2: Google Drive Overhaul & Headless Token Refresh Engine
- [x] Implement robust token persistence in `SystemSetting` for Super Admin Google Drive connection.
- [x] Implement auto-refreshing OAuth2 client in `src/lib/drive.ts` that automatically exchanges refresh tokens when expired.
- [x] Build `/api/admin/drive` endpoints (status, connect, disconnect, files).
- [x] Update `uploadCertificateToDrive` with `assertDriveAllowed` security boundary.
- [x] Verify in `tests/drive-integration.test.ts` (5/5 passed).

### Phase 3: Cryptographic 14-Day Database Backup Engine
- [x] Full relational snapshot in `src/lib/backup.ts` with sequential stream queries (zero Neon pool timeouts).
- [x] Canonical SHA-256 integrity checksum calculation.
- [x] AES-256-GCM encryption with NIST standard 12-byte IV and zero database key persistence.
- [x] Configured real daily scheduler in `vercel.json` (`0 2 * * *`) targeting `/api/cron/backup`.
- [x] Hardened unauthenticated access check in `/api/cron/backup/route.ts`.
- [x] Relocated local fallback vault from `public/` to non-routable `private/backups/`.
- [x] Implemented `restoreDatabasePayload` with isolated staging restoration test in `tests/backup-engine.test.ts` (Test 7).
- [x] Verify in `tests/backup-engine.test.ts` (7/7 passed).

### Phase 4: In-App Bug Reporting & Issue Management System
- [x] API endpoints at `src/app/api/bug-reports/route.ts` and `[id]/route.ts`.
- [x] User-facing responsive page at `/report-bug` and global `BugReportModal.tsx`.
- [x] Super Admin Bug Triage Dashboard at `/admin/bugs`.
- [x] Verify in `tests/bug-reporting.test.ts` (4/4 passed).

### Phase 5: Routing, Navigation & Zero-404 Elimination
- [x] Fixed `Navbar.tsx` role routing bug for `SUPER_ADMIN`, `HOD`, `WEB_MANAGER`.
- [x] Created `src/app/admin/settings/page.tsx` for Drive & Backup controls.
- [x] Created branded 404 recovery page at `src/app/not-found.tsx`.
- [x] Cataloged all 68 routes in `docs/route-audit.md`.

### Phase 6: Code Optimization & Complexity Reduction
- [x] Permanently deleted dead code `src/lib/google-drive.ts` (-126 LOC) and `src/lib/storage.ts` (-55 LOC).
- [x] Moved `@types/bcryptjs` to `devDependencies`.
- [x] Configured `outputFileTracingRoot: __dirname` in `next.config.mjs`.
- [x] Created structured JSON logger in `src/lib/logger.ts` with deep secret scrubbing.
- [x] Created `/api/health` monitoring probe for database latency and memory.

### Phase 7: Verification & Release Gate
- [x] Full test suite: 60/60 passing across 12 suites.
- [x] Measured test coverage: 87.24% line coverage, 85.51% function coverage.
- [x] Next.js production build: 68/68 static and dynamic routes compiled in 13.4s with 0 errors and 0 warnings.
- [x] Certified in `docs/final-independent-verification.md`.

---

## 2. Outstanding Operational Actions (Operator Prerequisites)

1. **Google Drive Interactive OAuth Authorization:**
   - Sign into `https://srecconnect.dpdns.org` as `principal@srecnandyal.edu.in` or `admin@srecnandyal.edu.in`.
   - Open `/admin/settings` and click **"Connect Google Drive"** to grant API permissions.
2. **Confirm Vercel Environment Variables:**
   - Confirm `BACKUP_ENCRYPTION_SECRET`, `CRON_SECRET`, `DATABASE_URL`, and `NEXTAUTH_SECRET` are set in the Vercel project dashboard.
