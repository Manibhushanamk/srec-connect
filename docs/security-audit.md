# SREC CONNECT — Security Audit & Defense Architecture

> **Audit Type:** Comprehensive Defensive Security, Threat Defense & Compliance Review  
> **Date:** November 20, 2026  
> **Target:** SREC CONNECT Production Application (`srecconnect.dpdns.org`)  
> **Status:** HARDENED & CERTIFIED (0 Critical, 0 High Vulnerabilities)

---

## 1. Authentication & Session Defense
- **OAuth Provider**: Google OAuth 2.0 with institutional domain enforcement (`@srecnandyal.edu.in`).
- **Session Strategy**: Secure JWT cookies with `httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production.
- **Credential Auth**: Strictly restricted in production mode (`ENABLE_CREDENTIALS_AUTH !== 'true'`).
- **Session Expiration & Invalidation**: Suspended or soft-deleted users are rejected immediately during session and JWT checks.
- **Headless OAuth Token Security**: Super Admin refresh tokens for Google Drive API are encrypted and stored in `SystemSetting` with zero public exposure, automatically refreshed when nearing expiration (< 5 mins).

---

## 2. Authorization & Role Boundaries (RBAC)
- **Role Hierarchy**: `SUPER_ADMIN` > `HOD` > `FACULTY` > `WEB_MANAGER` > `STUDENT`.
- **Server-Side Enforcement**: All API routes and server actions verify user role and permissions server-side. Client-side navigation state is never trusted.
- **Cross-Tenant & Cross-Department Isolation**:
  - HOD access is restricted to their assigned department.
  - Faculty cannot resolve formal disciplinary orders (`FORMAL_ACTION` is restricted to HOD and Super Admin).
  - Confidential grievances filed by students are visible ONLY to HOD and Super Admin, bypassing regular faculty.
  - Student roll numbers are permanently immutable and anchor all portfolio records.

---

## 3. Data Protection & Backup Storage Security
- **Strict Drive Boundary**: Disciplinary actions, grievance evidence, student misconduct files, and sensitive records are strictly prohibited from public Google Drive disclosure via `assertDriveAllowed()`.
- **Database Backup Cryptography**:
  - Backups are encrypted with **AES-256-GCM** using standard **12-byte (96-bit) cryptographically random nonces**.
  - 16-byte authentication tag guarantees detection of any tampered ciphertext.
  - Canonical SHA-256 integrity checksum is validated upon decryption.
  - **Zero Database Key Storage:** Master key is derived strictly from `BACKUP_ENCRYPTION_SECRET` in environment variables. Missing secret in production fails safely.
- **Non-Public Storage Isolation**:
  - Encrypted backups are deposited into the Super Admin's private Google Drive folder (`SREC Connect Backups`) with zero public sharing.
  - Local fallback snapshots are stored in the non-routable directory `private/backups/` outside the Next.js web root, completely eliminating the static asset exposure risk of `public/backups/`.

---

## 4. Production HTTP Security Headers & Telemetry Privacy
The following headers are enforced in `next.config.mjs`:
- `Content-Security-Policy`: Restricts script, style, connect, frame, and media sources.
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`
- `X-Frame-Options`: `DENY`
- `X-Content-Type-Options`: `nosniff`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Permissions-Policy`: `camera=(), microphone=(), geolocation=(), browsing-topics=()`
- **Telemetry Privacy (`src/lib/logger.ts`)**:
  - Deep recursive secret scrubbing masks `password`, `token`, `secret`, `authorization`, `cookie`, `iv`, `auth_tag`, and `Bearer` headers prior to stdout or database emission.
  - Diagnostic bug report submissions strip authentication cookies and sensitive query parameters.

---

## 5. Input Validation, Defense Against Injections & Cron Guard
- **SQL Injection**: Neutralized via Prisma ORM parameterized queries.
- **XSS**: React JSX auto-escaping, sanitized markdown/rich-text rendering, strict image URL validation.
- **Path Traversal**: Uploaded files sanitized via regex `[^a-zA-Z0-9._-]` and stored with unique timestamp prefixes.
- **Rate Limiting**: In-memory sliding window rate limiter (`src/lib/rate-limit.ts`) protects `/api/bug-reports`, `/api/admin/backup`, `/api/admin/backup/restore`, and `/api/auth`.
- **Cron Authentication Guard**: `/api/cron/backup` strictly requires `Authorization: Bearer <CRON_SECRET>`. In production, absence of `CRON_SECRET` halts execution with a 500 configuration exception rather than allowing unauthenticated access.
