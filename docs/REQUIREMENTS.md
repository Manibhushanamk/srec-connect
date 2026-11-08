# Confirmed Requirements & Decision Register

## 1. Confirmed Requirements Matrix

| Area | Confirmed Requirement | Status |
|---|---|---|
| **Product Name** | SREC Connect v3.0 | Confirmed |
| **Institution** | Santhiram Engineering College (Autonomous), Nandyal; CSE - AI & ML | Confirmed |
| **Roles** | Super Admin, HOD, Web Manager, Faculty, Student | Confirmed |
| **Authentication** | Google OAuth 2.0 / OIDC only. No public registration. Accounts pre-provisioned. | Confirmed |
| **Domain Allowlist** | Pre-provisioned email match + institutional domain allowlist check. | Confirmed |
| **Student Identifier** | University Roll Number (e.g. `22091A3201`) is permanent & unique anchor. | Confirmed |
| **Profile Editing** | Students edit portfolio fields; authorized staff edit official academic identity. | Confirmed |
| **Social Feed** | Immediate publishing for students. Text + up to 2 images. Sharp WebP (<= 500 KB). | Confirmed |
| **Social Interactions** | Likes, comments, bookmarks, follow/unfollow, content reporting. No direct chat. | Confirmed |
| **Events** | Full lifecycle: Create, register, capacity, waitlist, QR check-in, certificates. | Confirmed |
| **Event Attendance** | Organizer manual attendance + Event-specific QR scanning. (NO student QR IDs). | Confirmed |
| **Complaints/Discipline** | Student grievances & faculty incident reports. Low/Med/High/Critical priority. | Confirmed |
| **Confidential Route** | Confidential student complaints can bypass faculty directly to HOD. | Confirmed |
| **Right to Respond** | Accused student has immutable response thread. Neither party can edit reports. | Confirmed |
| **Database** | Neon Serverless PostgreSQL with Prisma ORM. | Confirmed |
| **Storage Separation** | Cloudflare R2 (Social images) + Google Drive API (PDFs) + Private Secure Store. | Confirmed |
| **Drive Public Link Warning**| Google Drive upload uses "Anyone with link - Viewer"; disciplinary evidence excluded. | Confirmed |

## 2. Unresolved Items Requiring Institutional Confirmation

| Open Item | Institutional Dependency | Required Action |
|---|---|---|
| **Google Workspace Status** | Confirmation of whether institutional `edu.in` tenant supports Shared Drives | College IT admin must confirm Drive capabilities and domain tenant. |
| **Drive Account Continuity** | Permanent institutional Google account ownership | College administration must designate official service account. |
| **Approved Domain(s)** | Full list of student and faculty email domains (e.g. `@srecnandyal.edu.in`) | Super Admin / IT must supply exact domain allowlist. |
| **Official Brand Assets** | High-resolution vector emblem and campus photography | Verify source from college website or obtain from administration. |
| **Data Retention Policy** | Legal duration for retaining student grievances and disciplinary records | Administration must provide compliance guidelines. |
