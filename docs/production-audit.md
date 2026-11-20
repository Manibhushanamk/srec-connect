# SREC CONNECT — Production Engineering Audit

> **Audit Date:** 2026-11-20  
> **Target Application:** SREC CONNECT (v3.0.0 Enterprise Release)  
> **Environment:** Next.js 15.5.25 (App Router, React 19), Prisma ORM 6.4.1, PostgreSQL (Neon Cloud), NextAuth.js 4.24.11, Tailwind CSS  
> **Production URL:** `https://srecconnect.dpdns.org`  
> **Repository Path:** `/home/kmanib/Documents/srec-connect-final`

---

## 1. Executive Summary

A comprehensive, zero-assumption empirical audit of SREC CONNECT was executed across all application layers: data modeling, server runtimes, role-based access control (RBAC), file storage, third-party integrations (Google Drive), scheduling mechanisms, routing structures, and frontend layouts.

### Key Audit Findings
1. **Google Drive Integration Gaps**:
   - Only a single upload endpoint (`/api/drive/upload`) existed.
   - Missing token refresh persistence: OAuth access tokens expire after 1 hour with no automatic refresh mechanism, causing subsequent uploads to fail or fall back to mock references.
   - No dedicated Super Admin Drive management interface (listing, download, disconnect, folder hierarchy initialization).
2. **Database Backup Architecture**:
   - No automated 14-day backup engine was implemented.
   - No JSON schema-compliant database export with cryptographic checksums, AES-256-GCM encryption, or automated Google Drive delivery existed.
   - No Super Admin backup inspection, manual trigger, or isolated restore workflow existed.
3. **Bug Reporting & Triage System**:
   - No database model (`BugReport`) existed in Prisma schema.
   - No in-app bug submission modal or Super Admin issue management dashboard existed.
4. **Navigation & Routing Flaws (404 Risks)**:
   - `src/app/admin/settings` was an empty folder without `page.tsx`.
   - `Navbar.tsx` had a role matching bug (`userRole === 'ADMIN'`), causing users with `Role.SUPER_ADMIN`, `Role.HOD`, or `Role.WEB_MANAGER` to receive broken dashboard links or fall back to `/`.
   - Incomplete 404 recovery workflow for deep links and invalid dynamic IDs.
5. **Security & Hardening**:
   - Missing HTTP security headers (Content Security Policy, HSTS, Permissions-Policy, X-Frame-Options) in `next.config.mjs`.
   - Absence of rate-limiting middleware on upload, submission, and administrative action endpoints.
   - Soft-deleted users or students could leave stale state blocking active search tests (e.g., student `22091A3201`).

---

## 2. Architecture & Tech Stack Inventory

| Component | Technology / Platform | Status & Notes |
|---|---|---|
| **Framework** | Next.js 15.5.25 (App Router) | Functional, compiles in 53s |
| **UI Library** | React 19.0.0 + Lucide React | High performance, server & client components |
| **Styling** | Tailwind CSS 3.4.17 + @tailwindcss/container-queries | Modern dark/light responsive layout |
| **ORM** | Prisma 6.4.1 (Prisma Client v6.19.3) | Clean schemas, needs `BugReport` and `BackupHistory` models |
| **Database** | PostgreSQL on Neon Serverless | Active connection via `DATABASE_URL` / `DIRECT_URL` |
| **Authentication** | NextAuth.js 4.24.11 (Google OAuth + Campus fallback) | Functional; needs token refresh persistence |
| **File Storage** | Google Drive API v3 (`googleapis 178.0.0`) + S3/R2 | Drive integration requires full overhaul |
| **Test Suite** | Node.js Test Runner + tsx | 40 baseline tests passing (100%) |

---

## 3. Role & Permission Audit Matrix

| Role | Intended Scope | Actual Implementation | Audit Finding & Action Required |
|---|---|---|---|
| **SUPER_ADMIN** | Full institutional governance, Drive connection, DB backups, user roles, bug triage | Partially implemented (`/admin/users`, `/admin/logs`, etc.) | Fix Navbar redirect bug; implement Backup Hub & Bug Triage Dashboard |
| **HOD** | Departmental oversight (AIML, etc.), grievances, approval escalations | Implemented (`/admin/discipline`, `/admin/achievements`) | Ensure department-scoped filtering is strictly enforced server-side |
| **FACULTY** | Student activity review, event coordination, incident filing | Implemented (`/dashboard/faculty`) | Enhance bug reporting entry point |
| **WEB_MANAGER** | Content & portal operations, notice publication | Implemented (`/admin/notices`) | Verify exclusion from Super Admin backup & system settings |
| **STUDENT** | Portfolio, feed, event registration, certificate upload, bug reporting | Implemented (`/dashboard/student`) | Add global bug reporting button & fix Drive link viewer |

---

## 4. Google Drive Integration Audit

### Current Limitations:
1. **Token Lifecycle**: NextAuth receives `access_token` and `refresh_token` during initial OAuth sign-in. However, `refresh_token` is not stored in the database. When the 1-hour `access_token` expires, Google Drive API returns `401 UNAUTHENTICATED`.
2. **Missing Super Admin Drive Management**:
   - No UI to connect, disconnect, or view the authorized Super Admin Google Drive account.
   - No server-side automatic token refresher to support background cron jobs.
3. **Backup Storage**: No dedicated folder structure (`SREC Connect Backups / Year / Month`) initialized in Drive.

---

## 5. Security Audit Findings

| Category | Finding | Severity | Remediation Plan |
|---|---|---|---|
| **Security Headers** | Missing CSP, HSTS, X-Content-Type-Options in `next.config.mjs` | **HIGH** | Configure strict production HTTP security headers |
| **Token Storage** | OAuth tokens transient in JWT without automated refresh handler | **HIGH** | Implement encrypted `SystemSetting` token storage for headless jobs |
| **Rate Limiting** | Endpoints vulnerable to rapid submission spam | **MEDIUM** | Implement sliding-window rate limit utility |
| **Input Validation** | Some endpoints rely solely on client-side validation | **MEDIUM** | Enforce Zod schemas across all POST/PATCH handlers |
| **Data Isolation** | Disciplinary incidents must remain isolated from Drive | **CRITICAL** | Strictly enforce `assertDriveAllowed` boundary checks |

---

## 6. Route & Navigation Audit (Zero-404 Mandate)

| Route | Status | Notes / Fix Required |
|---|---|---|
| `/` | 200 OK | Community Feed |
| `/admin` | 200 OK | Admin Command Center |
| `/admin/settings` | **404 NOT FOUND** | Empty directory. Implement Master System Settings, Drive & Backup Hub |
| `/admin/bugs` | **404 NOT FOUND** | Not implemented. Create Super Admin Bug Triage Dashboard |
| `/report-bug` | **404 NOT FOUND** | Not implemented. Create Global Bug Report Form |
| `/api/cron/backup` | **404 NOT FOUND** | Not implemented. Create secure 14-day automated backup cron handler |
| `src/app/not-found.tsx` | Standard Next default | Implement branded, accessible 404 error page with search & quick actions |

---

## 7. Baseline Test Verification
- Initial Run: 39 PASS, 1 FAIL (`tests/analytics-search.test.ts:13:12`).
- Root Cause: Student `22091A3201` had been set to `isActive: false` and `deletedAt` populated by a previous trash test script.
- Remediation: Database record restored to `isActive: true`, `deletedAt: null`.
- Final Baseline Test Output: **40/40 tests passing (100%)**.
- Production Build: **Compiled in 53s with zero type errors**.
