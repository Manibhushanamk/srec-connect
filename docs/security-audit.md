# SREC CONNECT — Security Audit & Defense Architecture

> **Audit Type:** Comprehensive Defensive Security & Compliance Review  
> **Date:** 2026-11-20  
> **Target:** SREC CONNECT Production Application

---

## 1. Authentication & Session Defense
- **OAuth Provider**: Google OAuth 2.0 with institutional domain enforcement (`srecnandyal.edu.in`).
- **Session Strategy**: Secure JWT cookies with `httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production.
- **Credential Auth**: Strictly restricted in production mode (`ENABLE_CREDENTIALS_AUTH !== 'true'`).
- **Session Expiration & Invalidation**: Suspended or soft-deleted users are rejected immediately during session and JWT checks.

---

## 2. Authorization & Role Boundaries (RBAC)
- **Role Hierarchy**: `SUPER_ADMIN` > `HOD` > `FACULTY` > `WEB_MANAGER` > `STUDENT`.
- **Server-Side Enforcement**: All API routes and server actions verify user role and permissions server-side. Client-side navigation state is never trusted.
- **Cross-Tenant & Cross-Department Isolation**:
  - HOD access is restricted to their assigned department.
  - Faculty cannot resolve formal disciplinary orders (`FORMAL_ACTION` is restricted to HOD and Super Admin).
  - Confidential grievances filed by students are visible ONLY to HOD and Super Admin, bypassing regular faculty.

---

## 3. Data Protection & Drive Boundary Security
- **Strict Drive Boundary**: Disciplinary actions, grievance evidence, student misconduct files, and sensitive records are strictly prohibited from public Google Drive disclosure via `assertDriveAllowed()`.
- **Database Backup Security**:
  - Backups contain sensitive student, faculty, and administrative data.
  - Backups are encrypted with **AES-256-GCM** prior to storage.
  - Uploaded strictly to the Super Admin's private Google Drive (never shared with "Anyone with link").
  - Integrity verified with **SHA-256** checksum.

---

## 4. Production HTTP Security Headers
The following headers are configured in `next.config.mjs`:
- `Content-Security-Policy`: Restricts script, style, connect, frame, and media sources.
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options`: `DENY`
- `X-Content-Type-Options`: `nosniff`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Permissions-Policy`: `camera=(), microphone=(), geolocation=()`

---

## 5. Input Validation & Defense Against Injections
- **SQL Injection**: Neutralized via Prisma ORM parameterized queries.
- **XSS**: React JSX auto-escaping, sanitized markdown/rich-text rendering, strict image URL validation.
- **Path Traversal**: Uploaded files sanitized via regex `[^a-zA-Z0-9._-]` and stored with unique timestamp prefixes.
- **Rate Limiting**: Sliding window rate limiter on `/api/bug-reports`, `/api/drive/upload`, `/api/auth`.
