# Architecture Decision Record: SREC Connect v3.0

## ADR-001: Architecture Pattern
- **Decision:** Modular Monolith using Next.js 15 App Router.
- **Context:** SREC Connect v3.0 serves a departmental community (students, faculty, HOD, administration).
- **Rationale:** Microservices introduce excessive operational complexity, distributed transaction failure modes, and hosting overhead incompatible with free-tier discipline. A modular monolith provides clean domain boundaries in `src/features/` while maintaining single-command deployment on Vercel.

## ADR-002: Multi-Tier Storage Partitioning
- **Decision:** Tri-partition storage across Neon PostgreSQL, Cloudflare R2, Google Drive API, and Private Secure Storage.
- **Rationale:**
  - *Neon PostgreSQL:* Exclusively stores normalized relational records, metadata, UUID keys, and audit logs. No binary blobs.
  - *Cloudflare R2:* High-speed zero-egress CDN storage for user avatars, post images, and thumbnails compressed via Sharp to WebP.
  - *Google Drive API:* Direct institutional repository for verified student certificates and public event PDFs with "Anyone with link - Viewer" permissions.
  - *Private Secure Store:* Server-streamed authenticated downloads for sensitive student grievances, incident evidence, and academic verification documents. Under NO circumstances are sensitive disciplinary records routed to public Google Drive links.

## ADR-003: Authentication & Identity Anchoring
- **Decision:** Google OAuth 2.0 with pre-provisioned email matching and immutable University Roll Number keys.
- **Rationale:** Prevents arbitrary public registrations. Ensures every student account maps directly to an authenticated university identity, while the immutable roll number guarantees data integrity if a student's email changes.
