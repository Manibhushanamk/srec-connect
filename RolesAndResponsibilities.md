# SREC Connect v3.0 — Institutional Roles, Responsibilities & Access Control Matrix

> **Governing Charter:** SREC Connect v3.0 Role-Based Access Control (RBAC), Security Boundaries, and Academic Credentials Integrity Protocol.
> **Institutional Authority:** Santhiram Engineering College (SREC Nandyal) — Autonomous Institutional Portal.

---

## 1. Executive Summary & Security Philosophy

SREC Connect v3.0 enforces a strict, hierarchical **Role-Based Access Control (RBAC)** model designed to balance academic autonomy, peer engagement, institutional governance, and statutory audit integrity (NBA, NAAC, NIRF, AICTE).

### Core Principles:
1. **Academic Anchor Immutability:** SREC Roll Numbers, Academic Batches (e.g. `2022-2026`), and Class Sections are institutional identifiers. Students **cannot** alter their own batch or section; changes are strictly restricted to `HOD`, `WEB_MANAGER`, `ADMIN`, and `SUPER_ADMIN`.
2. **Four-Eyes Moderation Principle:** Student achievements are submitted in `PENDING` state and require faculty review and HOD/Executive approval before publication to public directory walls.
3. **Cryptographic & Immutable Audit Logging:** All sensitive administrative mutations, status transitions, role escalations, document uploads, and system recovery operations are permanently captured in the `AuditLog` table.
4. **Strict Security Clearance for Audit Logs:** The **Security & Audit Intelligence Center** (`/admin/logs`) is accessible **exclusively by Department Heads (`HOD`) and Executive Administrators (`SUPER_ADMIN`, `ADMIN`)**. Web Managers, Faculty, and Students are strictly barred from accessing institutional audit logs.

---

## 2. Platform Roles Breakdown

The platform defines **6 distinct user roles**:

| Role | Institutional Title | Primary Operational Domain | Default Landing Page |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Institutional Executive / Principal / Trust Authority | Sovereign control over all platform records, users, security, and databases | `/admin` |
| **`ADMIN`** | Institutional Administrator / College Controller | Global management of users, events, accreditation reports, and moderation | `/admin` |
| **`HOD`** | Head of Department | Departmental governance, student/faculty oversight, honors verification, and department audit logs | `/admin` |
| **`WEB_MANAGER`** | Web & Systems Operations Manager | Technical platform management, user provisioning, bulk ingestion, events, and announcements | `/admin` |
| **`FACULTY`** | Professor / Associate / Assistant Professor | Teaching, research publications, student mentorship, attendance check-in, and honor review | `/dashboard/faculty` |
| **`STUDENT`** | Undergraduate Scholar / Research Cohort | Portfolio ownership, achievement submission, event registration, and community feed interaction | `/dashboard/student` |

---

## 3. Comprehensive Feature & Access Control Matrix

| System Domain & Capability | `SUPER_ADMIN` | `ADMIN` | `HOD` | `WEB_MANAGER` | `FACULTY` | `STUDENT` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Campus Public Feed & Directory Exploration** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Personal Profile & Bio Customization** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Self |
| **Academic Credentials (Designation, Cabin, Research)** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Self | ❌ N/A |
| **Edit Student Academic Batch & Class Section** | ✅ Any User | ✅ Any User | ✅ Any User | ✅ Any User | ❌ Restricted | 🔒 **Locked** |
| **Universal User Record Management (`/admin/users`)** | ✅ Full Edit | ✅ Full Edit | ✅ Dept Users | ✅ Full Ingest | ❌ Restricted | ❌ Restricted |
| **Achievement Submission Desk** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Moderation Desk: Inline Pre-Approval Editing** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ Restricted | ❌ Restricted |
| **Moderation Desk: Approve & Publish Honor** | ✅ Global | ✅ Global | ✅ Dept/All | ✅ Global | ❌ Review Only | ❌ Restricted |
| **Moderation Desk: Reject Honor with Reason** | ✅ Global | ✅ Global | ✅ Dept/All | ✅ Global | ❌ Review Only | ❌ Restricted |
| **Permanent Honor Record Deletion** | ✅ Yes | ✅ Yes | ❌ Restricted | ❌ Restricted | ❌ Restricted | ❌ Restricted |
| **Security & Audit Logs Center (`/admin/logs`)** | 🛡️ **Full Access** | 🛡️ **Full Access** | 🛡️ **Dept Scoped** | ⛔ **Restricted** | ⛔ **Restricted** | ⛔ **Restricted** |
| **Export Audit Logs (CSV / JSON)** | ✅ Yes | ✅ Yes | ✅ Dept Scoped | ❌ Restricted | ❌ Restricted | ❌ Restricted |
| **Accreditation Data Export (NIRF/NAAC/NBA)** | ✅ Global | ✅ Global | ✅ Dept Scoped | ✅ Global | ❌ Restricted | ❌ Restricted |
| **Bulk User Ingestion (Excel / CSV)** | ✅ Global | ✅ Global | ✅ Dept Scoped | ✅ Global | ❌ Restricted | ❌ Restricted |
| **Discipline & Grievance Case Management** | ✅ Global | ✅ Global | ✅ Dept Scoped | ❌ Restricted | ⚠️ Report Only | ⚠️ Self Report |
| **Confidential Incident & Grievance Logs** | ✅ Viewable | ✅ Viewable | ✅ Dept Scoped | ❌ Restricted | ❌ Restricted | ❌ Restricted |
| **Event Creation & QR Attendance Scanner** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Attendee Only|
| **Department Notices & Circulars Publishing** | ✅ Global | ✅ Global | ✅ Dept Scoped | ✅ Global | ❌ Restricted | ❌ Restricted |
| **System Recovery & Trash Purge (`/admin/trash`)**| 👑 **Super Admin** | ❌ Restricted | ❌ Restricted | ❌ Restricted | ❌ Restricted | ❌ Restricted |
| **Deduplication & Record Merging Hub** | ✅ Global | ✅ Global | ✅ Dept Scoped | ✅ Global | ❌ Restricted | ❌ Restricted |

---

## 4. In-Depth Roles & Operational Responsibilities

### 1. `SUPER_ADMIN` (Master Executive Authority)
- **Clearance Level:** Sovereign root access.
- **Key Responsibilities:**
  - Executive institutional leadership across all departments.
  - Full authority to edit **any detail of any user** on the platform (names, emails, credentials, system roles, department assignments).
  - Unrestricted access to the **Security & Audit Intelligence Center** (`/admin/logs`) with platform-wide search, filtering, and cryptographic exports.
  - Exclusive access to **System Recovery & Trash Purge** (`/admin/trash`) to restore or permanently zeroize soft-deleted institutional assets.
  - Final escalation authority for disciplinary incidents, grievance closures, and academic accreditation audits.

### 2. `ADMIN` (Institutional Administrator)
- **Clearance Level:** Comprehensive administrative authority.
- **Key Responsibilities:**
  - Operational co-management of user accounts, bulk onboarding, and credential synchronization.
  - Access to the **Security & Audit Intelligence Center** for continuous compliance monitoring.
  - Moderation, pre-approval inline editing, and publishing of student and faculty achievement dossiers.
  - Generating compliance packages (NIRF, NAAC, NBA, and AICTE reports).

### 3. `HOD` (Head of Department)
- **Clearance Level:** Departmental Executive Authority.
- **Key Responsibilities:**
  - Complete operational leadership of their respective academic department (e.g. CSE - AI & ML).
  - **Exclusive Access to Security & Audit Intelligence Center (`/admin/logs`):** Can inspect forensic audit trails, moderation actions, and user mutations scoped to their department scholars and faculty.
  - Authority to modify student academic anchors (Academic Batch, Class Section) when a student transfers sections or cohorts.
  - Primary verification and approval authority on the **Edit & Approve Desk** for departmental achievement submissions.
  - Full management of departmental disciplinary incidents, grievances, faculty mentorship assignments, and departmental circulars.

### 4. `WEB_MANAGER` (Technical Platform & Systems Manager)
- **Clearance Level:** Technical Operational Authority.
- **Key Responsibilities:**
  - Managing day-to-day web infrastructure, student batch CSV/Excel imports, and directory consistency.
  - Authority to modify student academic batch and class section during institutional enrollment cycles.
  - Moderating community social posts, public feed items, and publishing official campus announcements.
  - Organizing institutional events, generating QR check-in gates, and managing public galleries.
  - **Security Restriction:** **Does NOT** have access to the Security & Audit Logs (`/admin/logs`) or System Recovery Trash Purge.

### 5. `FACULTY` (Academic Scholars & Mentors)
- **Clearance Level:** Academic Contributor & Mentor.
- **Key Responsibilities:**
  - Maintaining their official public academic profile (Designation, Cabin, Experience, Research Specializations, Publications, Patents).
  - Submitting academic honors, research papers, patents, and faculty development achievements.
  - Conducting QR code attendance check-ins for campus seminars, workshops, and department events.
  - Reporting student grievance cases or disciplinary incidents to HOD/Administration.
  - Reviewing and recommending student achievement submissions for HOD approval.

### 6. `STUDENT` (Undergraduate Scholars)
- **Clearance Level:** Scholar / End-User.
- **Key Responsibilities:**
  - Owning and curating their professional portfolio, headline, bio, avatar, and social links (GitHub, LinkedIn, Portfolio).
  - Submitting verified academic, technical, hackathon, and co-curricular achievements with Google Drive certificate proof.
  - Tracking pending submission status in the **Pending Approvals Desk** on their student dashboard.
  - Registering for institutional events and generating personal attendance check-in tokens.
  - Interacting with community posts, project updates, and peer achievements on the Campus Feed.
  - **Security Restrictions:**
    - **Locked Academic Anchors:** Cannot alter their own SREC Roll Number, Academic Batch, or Class Section.
    - Zero access to administrative consoles, moderation desks, audit logs, or confidential disciplinary cases.

---

## 5. Security & Audit Policy (`/admin/logs`)

### Who Can View Audit Logs?
- **Permitted Roles:** `SUPER_ADMIN`, `ADMIN`, `HOD`.
- **Blocked Roles:** `WEB_MANAGER`, `FACULTY`, `STUDENT` (Enforced via server-side session checks and RBAC middleware returning `403 Forbidden`).

### What Is Logged in the Audit Trail?
Every critical mutation in the platform generates an immutable `AuditLog` entry containing:
1. `actorId`: User ID of the initiator.
2. `actorEmail`: Email address of the initiator.
3. `actorRole`: Clearance role of the initiator at the time of execution.
4. `action`: Machine-readable action code (`USER_UPDATED`, `ACHIEVEMENT_PUBLISHED`, `DRIVE_FILE_UPLOADED`, `TRASH_RESTORE`, `TRASH_PURGE`, `EVENT_ATTENDANCE_CHECKIN`, etc.).
5. `entityType`: Domain model (`User`, `Student`, `Faculty`, `Achievement`, `Incident`, `Event`, `DRIVE_DOCUMENT`).
6. `entityId`: Unique identifier of the mutated record.
7. `metadata`: JSON payload capturing prior state, new state, updated fields, and contextual parameters.
8. `ipAddress` & `userAgent`: Network origin and client browser footprint for non-repudiation.
9. `createdAt`: Cryptographic server timestamp.
