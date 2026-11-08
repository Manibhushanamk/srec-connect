# PRD — Project Requirements Document: SREC Connect v3.0

> **Project Name:** SREC Connect (Santhiram Engineering College — Department of CSE: AI & ML)  
> **Status:** FINALIZED FOR PHASE 0 / REVIEW  
> **Target Delivery:** Modular Monolith v1.0  
> **Document Source of Truth:** `SREC_Connect_Full_Project_Plan_for_Antigravity.pdf`  

---

## 1. Executive Summary

**SREC Connect** is a department community, academic portfolio, and operations platform specifically tailored for Santhiram Engineering College (SREC), Department of Computer Science & Engineering (Artificial Intelligence & Machine Learning).

The platform bridges two distinct needs:
1. **Student & Faculty Experience:** An engaging, modern mobile-first interface combining an **Instagram-inspired social feed** (immediate publishing, image carousels, likes, comments, bookmarks, event announcements) and a **LinkedIn-inspired professional portfolio** (skills, verified achievements, research publications, patents, certifications, event participation).
2. **Institutional Operations & Department Management:** A secure, role-governed administrative portal for pre-provisioned Google OAuth access, student roll-number lifecycle tracking, multi-tier achievement verification, confidential student grievances, faculty incident reports, and event lifecycle management with QR check-in.

---

## 2. Core Personas & Problem Statement

### 2.1 Personas
1. **Student:** Enrolled student in CSE (AI & ML). Wants to build an industry-ready portfolio, share project updates, register for department hackathons/workshops, and access official department notices.
2. **Faculty:** Assistant/Associate Professor in AI & ML. Wants to track professional activities (FDPs, publications, patents, workshops), review student achievement evidence, manage departmental events, and report academic discipline issues.
3. **Head of Department (HOD):** Department leader. Needs department analytics, oversight of faculty activities, escalation point for disputes and confidential grievances, and authoritative approval for formal actions.
4. **Web Manager:** Department technical coordinator. Manages bulk account provisioning (CSV/Excel import), website content, event operations, and media/notices.
5. **Super Admin:** Global institution administrator. Manages system configuration, role delegations, audit logs, and security controls.

### 2.2 Pain Points Addressed
- Generic ERP systems are bureaucratic, cumbersome, and hated by students.
- Unmoderated social networks lack academic credibility, verification, and institutional privacy.
- Department achievements, faculty publications, and student event records are currently lost across ad-hoc spreadsheets and WhatsApp messages.
- Student complaints and disciplinary reports lack transparent, immutable tracking.

---

## 3. Non-Negotiable Architectural Principles

1. **Familiar Interface:** Instagram-style interaction flows (feed cards, stories/highlights, bottom navigation, image carousels) + LinkedIn-style credentials (badges, skills, publications, verified event certificates).
2. **Clean Monolith Scaffolding:** Built from scratch as a Next.js App Router modular monolith. Do not patch or carry legacy technical debt from previous prototypes without explicit review.
3. **Strict Server-Side RBAC:** Authorization enforced on every API route and Server Action via granular permission keys (`users.student.create`, `achievements.review`, `incidents.assign`, etc.).
4. **Privacy by Design:** Three distinct visibility tiers:
   - `Public`: Department landing page, verified public achievements, opted-in student profiles.
   - `College-Only`: Department social feed, campus announcements, internal event registrations.
   - `Restricted/Confidential`: Disciplinary reports, grievances, identity records (accessible only to named participants and authorized authorities).
5. **Verification is Distinct from Publishing:** Students can publish social feed posts immediately, but official badges and academic certificates require faculty/HOD verification before receiving a "Verified" badge.
6. **Free-Tier First Discipline:** Leverage Neon PostgreSQL, Cloudflare R2, Google Drive API, and Vercel within free quotas with proactive limit monitoring.

---

## 4. Functional Requirements

### 4.1 Authentication & Provisioning
- **No Public Registration:** Accounts must be pre-provisioned by Super Admin or Web Manager via manual entry or bulk CSV/XLSX import.
- **Google OAuth Only:** Strict server-side validation against pre-provisioned email addresses and institutional domain allowlist.
- **Roll Number as Anchor:** Permanent, immutable student identity key is the university roll number (e.g., `22091A3201`). Email address updates must never break relational records.
- **First Super Admin Bootstrap:** One-time CLI or secure environment script bootstrapping.

### 4.2 Public Department Web Portal
- SREC CSE (AI & ML) overview, HOD message, vision & mission.
- Faculty directory with academic profiles, research specializations, and qualifications.
- Public achievements and events showcase.
- Student public portfolios (only for opted-in students with approved content).

### 4.3 Social Feed & Interactions
- Department-wide feed & personalized feed (chronological + followings + batch relevance).
- Rich posts: Text + up to 2 images (Max 10 MB per image, optimized via Sharp to responsive WebP <= 500 KB).
- Interactions: Likes, comments, bookmarks, share links, user follow/unfollow, content reporting.
- Moderation queue for flagged content with reason tracking.

### 4.4 Portfolios & Academic Achievements
- **Student Profile:** Header, bio, academic metadata (batch, year, section), skills, GitHub/LinkedIn links, projects, verified certificates.
- **Faculty / HOD Profile:** Qualifications, research publications, patents, grants, FDPs, workshops, guest lectures, awards.
- **Verification Workflow:**
  - Student submits certificate/achievement with evidence document.
  - Initial status: `Pending Review`.
  - Assigned Faculty reviews and marks `Approved`, `Rejected`, or `Resubmission Required`.
  - HOD oversees escalation and final disputes. HOD cannot self-approve personal activities.

### 4.5 Events & QR Attendance Check-In
- Faculty/HOD create events with seat limits, registration deadlines, and optional WhatsApp group links (displayed only post-registration).
- Registration and waitlist managed with transactional integrity.
- Attendance via organizer manual toggle OR event-specific QR code scanning. (QR is restricted strictly to event check-in; no QR student identity cards).
- Post-event certificate upload by student with organizer verification.

### 4.6 Grievance & Disciplinary Management
- Dual-track reporting: Student grievances + Faculty incident reports.
- Confidential route: Students can file confidential grievances bypassing faculty directly to HOD.
- Categories: Mobile usage, attendance, classroom discipline, academic integrity, faculty issues, facilities, misconduct.
- Severity levels: Low, Medium, High, Critical.
- Student right-to-respond: Accused students must have an immutable response thread. Neither party can overwrite submitted statements.
- Outcomes: Verbal warning, written warning, counselling, corrective task, HOD review, formal action, dismissed.
- Strict confidentiality: Zero leakage to public feed, search, or public APIs.

### 4.7 Documents & Cloud Storage
- **Google Drive API:** Used for official institutional certificates and approved public PDFs. Links default to Anyone with link - Viewer.
- **Cloudflare R2:** High-speed, edge-cached storage for optimized social images and profile pictures.
- **Private Storage Path:** Encrypted server-authenticated storage for confidential grievance and disciplinary evidence. Never exposed via public Google Drive links.

---

## 5. Non-Functional Requirements & Security
- **Type Safety & Schema Validation:** Strict TypeScript + Zod schema validation across all boundaries.
- **Zero-Trust Client Payloads:** Roles, IDs, and permission claims must never be accepted from client request bodies.
- **Rate Limiting:** Protect login callbacks, post creation, comments, likes, and file uploads.
- **Accessibility & UX:** Mobile-first responsive layouts conforming to WCAG 2.1 AA standards; light/dark/system themes; Lucide icons.

---

## 6. Out of Scope (Explicitly Excluded from v1.0)
- ❌ Direct messaging / 1-on-1 private chat / group chats.
- ❌ Video uploads or video streaming.
- ❌ Public self-signup without pre-provisioning.
- ❌ Parent/guardian accounts and parent notifications.
- ❌ AI automated disciplinary scoring or opaque black-box ranking.
- ❌ Student QR identity cards or QR-based authentication.
- ❌ Microservices, Kubernetes, or multi-cloud distributed message queues.
