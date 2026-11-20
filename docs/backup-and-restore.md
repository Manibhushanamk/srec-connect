# SREC CONNECT — Database Backup & Disaster Recovery Architecture

> **Schedule:** Automatic execution every 14 days to Super Admin Google Drive  
> **Encryption:** AES-256-GCM authenticated encryption with SHA-256 checksum  
> **Target Folder:** `SREC Connect / SREC Connect Backups`  
> **Format:** Structured relational JSON (`.enc.json`)  
> **Status:** VERIFIED & OPERATIONAL

---

## 1. System Overview

SREC CONNECT implements an automated, fault-tolerant, end-to-end encrypted database backup engine that generates full relational snapshots of the PostgreSQL database every 14 days and securely deposits them into the authorized Super Admin's Google Drive.

```
┌─────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│  Neon Postgres  │ ───>  │ Relational Snapshot  │ ───>  │  SHA-256 Integrity     │
│  (v3_production)│       │ Full JSON Extraction │       │  Checksum Generation   │
└─────────────────┘       └──────────────────────┘       └────────────────────────┘
                                                                     │
                                                                     ▼
┌─────────────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│  Super Admin Drive      │ <───  │ Streamed HTTP Upload │ <───  │  AES-256-GCM Encrypted │
│  "SREC Connect Backups" │       │ (Zero Public Access) │       │  Encrypted Package     │
└─────────────────────────┘       └──────────────────────┘       └────────────────────────┘
```

---

## 2. 14-Day Automated Scheduling & Idempotency

- **Scheduler Endpoint**: `/api/cron/backup`
- **Authentication**: Protected via `Authorization: Bearer <CRON_SECRET>`.
- **Interval Check**: `isBackupDue(14)` inspects the most recent completed or verified `BackupRecord`.
  - If `< 14 days` have elapsed: Returns `isDue: false` and skips execution (prevents duplicate runs).
  - If `>= 14 days` or no prior backup exists: Immediately initiates a full backup.
  - Optional `?force=true` query flag for emergency manual overrides.
- **Fail-Safe**: If a backup fails, the 14-day timer is NOT reset, ensuring the system retries until a successful snapshot is landed.

---

## 3. Cryptographic Security & Encryption

Backups contain sensitive institutional information (student roll numbers, faculty records, disciplinary logs, and academic credentials). Public exposure is strictly prohibited.

1. **Integrity Checksum**:
   - The canonical database JSON payload is hashed using **SHA-256**.
   - The hex checksum is recorded in the package header and database audit log.
2. **Authenticated Encryption (AES-256-GCM)**:
   - Cipher: `aes-256-gcm`.
   - Key: 32-byte derived master key from `BACKUP_ENCRYPTION_KEY` (or persistent cryptographically secure secret in `SystemSetting`).
   - Initialization Vector (IV): Unique, cryptographically random 16-byte buffer per backup.
   - Authentication Tag: 16-byte GCM authentication tag guarantees tamper detection.
3. **Storage Isolation**:
   - Backup files are stored strictly with **Zero Public Access**.
   - No `anyoneWithLink` sharing permissions are ever applied to backup files.
   - Only the authenticated Super Admin can view or download the backup file.

---

## 4. JSON Backup Format Specification

```json
{
  "format": "SREC_ENCRYPTED_BACKUP_V1",
  "backup_id": "srec-backup-2026-11-20T11-30-00-000Z",
  "algorithm": "aes-256-gcm",
  "iv": "a3f5c7... (hex)",
  "auth_tag": "e9b2d1... (hex)",
  "ciphertext": "... (base64)",
  "checksum_sha256": "4b61c... (hex)",
  "created_at": "2026-11-20T11:30:00.000Z",
  "metadata": {
    "backup_format_version": 1,
    "application": "SREC CONNECT",
    "backup_id": "srec-backup-2026-11-20T11-30-00-000Z",
    "created_at": "2026-11-20T11:30:00.000Z",
    "database_version": "v3_production",
    "tables": [
      "Department", "Batch", "Section", "Category", "User", "Student",
      "Faculty", "Achievement", "Event", "Incident", "Post", "BugReport", ...
    ],
    "record_counts": {
      "User": 48,
      "Student": 32,
      "Faculty": 16,
      "Achievement": 55,
      "Event": 12,
      "Incident": 7
    },
    "total_records": 1240,
    "checksum_sha256": "4b61c..."
  }
}
```

---

## 5. Super Admin Console & Manual Controls

Super Admins can manage backups directly at `/admin/settings` (or via `/api/admin/backup`):
- **Trigger Manual Backup**: One-click immediate execution for ad-hoc milestones.
- **Verify Integrity**: Downloads the backup from Google Drive, decrypts the buffer in memory, and validates SHA-256 checksum and table counts.
- **Backup History**: View recent snapshots, durations, sizes, file IDs, and verification statuses.

---

## 6. Disaster Recovery & Safe Restoration Procedure

> **Rule:** Never restore directly into production without validation and a pre-restore safety snapshot.

### Step-by-Step Restoration Protocol
1. **Pre-Flight Dry Run (`dryRun: true`)**:
   - Send `POST /api/admin/backup/restore` with `{ backupId: "...", dryRun: true }`.
   - The engine downloads the encrypted file from Google Drive, decrypts the payload, validates the SHA-256 checksum, and returns record counts without touching the database.
2. **Safety Snapshot**:
   - Before executing live data restoration, the engine automatically creates a fresh `SAFETY_SNAPSHOT_BEFORE_RESTORE` backup of the active database.
3. **Execution Guard**:
   - A live restore requires `confirmationCode: "CONFIRM_RESTORE_SREC"`.
4. **Audit Logging**:
   - All restore attempts and completed actions are recorded with timestamps, user IP, and actor credentials in `AuditLog`.
