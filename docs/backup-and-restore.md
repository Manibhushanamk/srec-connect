# SREC CONNECT — Database Backup & Disaster Recovery Architecture

> **Schedule:** Automatic execution every 14 days to Super Admin Google Drive  
> **Encryption:** AES-256-GCM authenticated encryption (12-byte IV) with SHA-256 checksum  
> **Target Folder:** `SREC Connect / SREC Connect Backups`  
> **Format:** Structured relational JSON (`.enc.json`)  
> **Scheduler Configuration:** `vercel.json` (daily cron: `0 2 * * *`)  
> **Status:** VERIFIED, TESTED & CERTIFIED

---

## 1. System Overview

SREC CONNECT implements an automated, fault-tolerant, end-to-end encrypted database backup engine that generates full relational snapshots of the PostgreSQL database every 14 days and securely deposits them into the authorized Super Admin's Google Drive.

```
┌─────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│  Neon Postgres  │ ───>  │ Relational Snapshot  │ ───>  │  SHA-256 Integrity     │
│  (v3_production)│       │ Sequential Stream    │       │  Checksum Generation   │
└─────────────────┘       └──────────────────────┘       └────────────────────────┘
                                                                 │
                                                                 ▼
┌─────────────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│  Super Admin Drive      │ <───  │ Streamed HTTP Upload │ <───  │  AES-256-GCM Encrypted │
│  "SREC Connect Backups" │       │ (Zero Public Access) │       │  (12-byte random IV)   │
└─────────────────────────┘       └──────────────────────┘       └────────────────────────┘
                                             │ (Fallback if offline)
                                             ▼
                                  ┌──────────────────────┐
                                  │ Private Vault Storage│
                                  │ (private/backups/)   │
                                  └──────────────────────┘
```

---

## 2. 14-Day Automated Scheduling & Idempotency

- **Scheduler Configuration**: `vercel.json`
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/backup",
        "schedule": "0 2 * * *"
      }
    ]
  }
  ```
- **Scheduler Endpoint**: `/api/cron/backup`
- **Authentication**: Protected via `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`. Unauthenticated requests are strictly rejected (HTTP 401).
- **Interval Check**: `isBackupDue(14)` inspects the most recent completed or verified `BackupRecord`.
  - If `< 14 days` have elapsed: Returns `isDue: false` and skips execution (prevents duplicate runs).
  - If `>= 14 days` or no prior backup exists: Immediately initiates a full backup.
  - Optional `?force=true` query flag for emergency manual overrides by Super Admin.
- **Fail-Safe**: If a backup fails, the 14-day timer is NOT reset, ensuring the scheduler retries daily until a successful snapshot is landed.

---

## 3. Cryptographic Security & Key Management

Backups contain sensitive institutional information (student roll numbers, faculty records, disciplinary logs, and academic credentials). Public exposure is strictly prohibited.

1. **Integrity Checksum**:
   - The canonical database JSON payload is hashed using **SHA-256**.
   - The hex checksum is recorded in the package header and database audit log.
2. **Authenticated Encryption (AES-256-GCM)**:
   - **Cipher:** `aes-256-gcm`.
   - **Key Derivation:** 32-byte master key derived from environment variable `BACKUP_ENCRYPTION_SECRET` (with backward compatibility for `BACKUP_ENCRYPTION_KEY`) using SHA-256 hash.
   - **Zero Database Persistence:** The master key is NEVER stored in the database (`SystemSetting`), ensuring strict zero-trust separation of concerns. Missing secret in production immediately fails safely with a configuration exception.
   - **Initialization Vector (IV):** NIST SP 800-38D standard 12-byte (96-bit) cryptographically random buffer per backup (24 hex characters). Decryption supports both 12-byte and 16-byte IVs for backward compatibility.
   - **Authentication Tag:** 16-byte GCM authentication tag guarantees tamper detection. Any tampering with ciphertext throws an authentication exception.
3. **Storage Isolation**:
   - **Google Drive Storage:** Files uploaded to private folder `SREC Connect Backups`. Zero public `anyoneWithLink` sharing permissions are applied.
   - **Local Vault Storage:** If Google Drive is temporarily offline or unauthenticated, encrypted snapshots are saved to the non-routable directory `private/backups/` outside the Next.js web root.

---

## 4. JSON Backup Format Specification

```json
{
  "format": "SREC_ENCRYPTED_BACKUP_V1",
  "backup_id": "srec-backup-2026-11-20T11-30-00-000Z",
  "algorithm": "aes-256-gcm",
  "iv": "a3f5c7... (24 hex chars)",
  "auth_tag": "e9b2d1... (32 hex chars)",
  "ciphertext": "... (base64)",
  "checksum_sha256": "4b61c... (64 hex chars)",
  "created_at": "2026-11-20T11:30:00.000Z",
  "metadata": {
    "backup_format_version": 1,
    "application": "SREC CONNECT",
    "backup_id": "srec-backup-2026-11-20T11-30-00-000Z",
    "created_at": "2026-11-20T11:30:00.000Z",
    "database_version": "v3_production",
    "tables": [
      "Department", "Batch", "Section", "Category", "User", "Student",
      "Faculty", "Achievement", "AchievementTeamMember", "AchievementMedia",
      "Event", "EventMedia", "EventRegistration", "EventAttendance",
      "Incident", "IncidentResponse", "IncidentAction", "Post", "PostMedia",
      "PostComment", "PostLike", "PostBookmark", "ContentReport",
      "PostCollaborator", "Announcement", "Notification", "PendingBulkBatch",
      "PendingBulkItem", "SystemSetting", "BugReport", "AuditLog"
    ],
    "record_counts": { ... },
    "total_records": 1284,
    "checksum_sha256": "..."
  }
}
```

---

## 5. Verified Restoration & Disaster Recovery Protocol

### A. Pre-Flight Dry Run Validation
Before executing any restoration, the system decrypts the package in memory and verifies:
- Authenticity: GCM auth tag check.
- Integrity: Computed SHA-256 digest vs package header.
- Completeness: Presence of all 31 critical models.

### B. Isolated Restoration Verification & Staging Environment Boundaries
Tested and verified in `tests/backup-engine.test.ts`, `tests/backup-physical-restore.test.ts`, and `tests/backup-isolated-database-restore.test.ts`:
- **In-Memory Schema & Relational Integrity (`VERIFIED`):**
  - Evaluates topological relational integrity (Department -> User -> Student / Faculty).
  - Preserves ISO timestamp objects, nullability, JSON structures, and foreign keys (`User.studentId`, `Student.departmentId`).
  - Decrypts package, validates 16-byte authentication tag and SHA-256 data checksum.
  - Safely validates without mutating live production data (`tests/backup-engine.test.ts`).
- **Physical Schema-Isolated PostgreSQL Restore (`VERIFIED`):**
  - Tested in `tests/backup-physical-restore.test.ts` (6 automated tests, 6 verification checkpoints).
  - Uses native PostgreSQL schema isolation (`CREATE SCHEMA isolated_staging_recovery`) on the PostgreSQL instance.
  - Clones table structures (`Department`, `Student`, `User`, `SystemSetting`) with primary keys and defaults.
  - Ingests decrypted backup JSON directly into physical PostgreSQL relational tables via native `json_populate_recordset(null::table, json_data)`.
  - Verifies record count parity, foreign key relational integrity (`JOIN` between restored `Student` and `Department`), timestamp parsing, nullability, and cryptographic rejection of tampered packages.
  - Proves zero write mutations to live production tables (`v3_production.*`) and tears down the isolated test schema cleanly via `DROP SCHEMA CASCADE`.
- **Independent PostgreSQL Database Disaster Recovery (`VERIFIED`):**
  - Tested in `tests/backup-isolated-database-restore.test.ts` (9 automated tests, 9 verification checkpoints).
  - Dynamically provisions a completely independent PostgreSQL database: `srec_staging_recovery_db` on Neon (separate from `neondb`).
  - Synced full 35-model DDL schema via `prisma db push`.
  - Ingests decrypted backup records into staging database across topological model order (`Department`, `Batch`, `Section`, `Category`, `SystemSetting`, `User`, `Student`, `Faculty`, `BugReport`, `Event`, `Incident`, `Achievement`, `Post`).
  - Resolves circular foreign key dependencies (`User.studentId` <-> `Student.userId`) via controlled constraint attachment.
  - Verifies multi-way relational JOINs (Student JOIN Department JOIN User), Date objects, null safety, system settings key-value maps, and application authentication lookups on restored data.
  - Proves zero write mutations to live production database `neondb` (Department, User, and Student counts remain 100% identical before and after test).

### C. Live Emergency Restoration Procedure
1. Authorized Super Admin logs in and opens `/admin/settings`.
2. Locates the desired backup from history or uploads `.enc.json` package.
3. System runs pre-flight dry-run validation.
4. If dry-run passes, Super Admin enters required confirmation code:
   `CONFIRM_RESTORE_SREC`
5. The restoration engine immediately generates an automated pre-restore safety snapshot of the existing database before performing any updates.
6. The engine executes transactional upserts for system data and logs the operation in `AuditLog` with action `DATABASE_RESTORE_EXECUTED`.
