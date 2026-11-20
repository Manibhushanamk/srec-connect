# SREC CONNECT — QA Test Plan

> **Scope:** Full-Spectrum Functional, Security, Role-Based, Routing, and Integration Testing  
> **Status:** ACTIVE TEST PLAN

---

## 1. Test Matrix by Role

| Test Suite | Target Role | Key Validation Points | Pass Criteria |
|---|---|---|---|
| **Auth & RBAC** | All Roles | Google OAuth, session refresh, role hierarchy, domain restrictions | 100% pass, unauthorized access blocked |
| **Student Journey** | STUDENT | Profile edit, achievements submit, event register, bug report, drive proof upload | Zero 404s, roll number immutable, files uploaded |
| **Faculty Journey** | FACULTY | Achievement review, event creation, disciplinary report, bug report | Department scoping enforced |
| **HOD Journey** | HOD | Department oversight, confidential grievance review, formal disciplinary resolution | Full department visibility, isolation from other departments |
| **Web Manager** | WEB_MANAGER | Notice creation, portal management, restricted from Super Admin backup/settings | System settings and backups blocked with 403 |
| **Super Admin** | SUPER_ADMIN | Full admin console, user management, Drive connection, backup trigger, bug triage | 100% operational |

---

## 2. Integration & Automated Test Coverage

1. **`tests/auth-rbac.test.ts`**: Role permissions, domain validation, session token lifecycle.
2. **`tests/achievements-workflow.test.ts`**: Multi-tier achievement submission, approval, and verification desk.
3. **`tests/events-attendance.test.ts`**: Event creation, registration capacity, waitlisting, QR attendance.
4. **`tests/complaints-discipline.test.ts`**: Confidential grievance filing, HOD bypass, faculty restrictions.
5. **`tests/drive-notices.test.ts`**: Google Drive upload, boundary checks, notices fan-out.
6. **`tests/social-feed.test.ts`**: Post creation, WebP compression, like, bookmark, moderation reports.
7. **`tests/portfolios.test.ts`**: Student and faculty profile resolution, roll number immutability.
8. **`tests/user-admin-bulk.test.ts`**: Transactional bulk ingestion, duplicate constraints, activation toggling.
9. **`tests/analytics-search.test.ts`**: Universal search, analytics aggregation, robots.txt, sitemap.
10. **`tests/backup-engine.test.ts`** *(NEW)*: Complete database JSON export, AES-256-GCM encryption, checksum verification, 14-day schedule calculation, restore dry-run.
11. **`tests/bug-reporting.test.ts`** *(NEW)*: Bug report submission, diagnostics capture, triage workflow, status transitions, role permissions.
12. **`tests/drive-integration.test.ts`** *(NEW)*: Token auto-refresh, folder creation, file listing, boundary check.
