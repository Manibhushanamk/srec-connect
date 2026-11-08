# Project Decision Log: SREC Connect v3.0

## DEC-001: Monolith vs Microservices
- **Date:** 2026-11-08
- **Context:** Deciding system boundary decomposition for initial v1 release.
- **Decision:** Modular Monolith using Next.js 15 App Router.
- **Consequences:** Lower maintenance overhead, zero network latency between modules, single deployment pipeline on Vercel.

## DEC-002: Student Roll Number as Identity Anchor
- **Date:** 2026-11-08
- **Context:** Students may change their email or institutional Google account aliases.
- **Decision:** University Roll Number is immutable and serves as the primary unique anchor for all student academic history.
- **Consequences:** Email updates will not break relational links, achievements, or disciplinary history.

## DEC-003: Public-Link Google Drive vs Private Incident Storage
- **Date:** 2026-11-08
- **Context:** User requested "Anyone with link - Viewer" for Google Drive uploads.
- **Decision:** Strictly isolate Google Drive public-link workflows to official academic certificates and approved public PDFs. Grievance evidence and disciplinary files MUST be stored in private server-authenticated storage.
- **Consequences:** Eliminates accidental data exposure of sensitive student discipline records.

## DEC-004: Event QR Attendance vs Student QR Identity
- **Date:** 2026-11-08
- **Context:** The requirement removed "QR-based student identity".
- **Decision:** Clarified that event check-in via dynamic event QR code remains supported, but NO static student QR identity cards or QR-based student login will be built.
- **Consequences:** Protects student identity privacy while maintaining convenient event check-in.

## DEC-005: Clean Scaffolding Protocol
- **Date:** 2026-11-08
- **Context:** The repository contained draft prototype files from earlier experiments.
- **Decision:** Follow the blueprint's explicit directive: build from scratch using verified modular patterns and Prisma schemas without patching legacy code blindly.
- **Consequences:** Guarantees zero technical debt carried over from earlier unfinished prototypes.
