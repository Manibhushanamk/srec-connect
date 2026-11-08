# Rules.md — AI Boundaries & Coding Standards

> **Methodology:** Get Shit Done (GSD) Protocol  
> **Mandate:** Stop vibecoding. Minimal code discipline, strict type safety, zero regressions.

---

## 1. AI Behavioral Boundaries

1. **Planning Lock:** Never write implementation code until specifications and plans are approved.
2. **Search-First Discipline:** Always search (`grep`, `find`) before reading files. Never read large files blindly.
3. **Minimal Code & Zero Bloat (`karpathy-guidelines`):**
   - Write only strictly necessary, high-leverage code.
   - No speculative abstractions, no single-use helper bloat, and minimal surgical diffs.
   - If a feature can be cleanly implemented in 50 lines instead of 200, write 50.
4. **Smallest Bug Fixes (`minimal-fix`):**
   - Implement the minimal verified diff that makes failing tests pass.
   - Do not perform unrelated refactoring during a bug fix.
5. **No Hallucinated Infrastructure:** Never introduce Kafka, Redis, microservices, or complex background worker fleets unless explicitly requested and approved.
6. **No Fake / Redrawn Logos:** Never invent, redraw, or AI-generate the official college emblem. Use official verified assets or clean, neutral placeholders.

---

## 2. Coding Standards & Conventions

### 2.1 Next.js & React
- Use App Router conventions (`layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`).
- Default to Server Components; use `'use client'` only when state, event handlers, or browser APIs are required.
- Place mutations in dedicated Server Actions or Route Handlers with explicit Zod schema parsing.
- UI styling must strictly use Tailwind CSS utility classes and shadcn/ui components.

### 2.2 TypeScript & Validation
- Strict TypeScript mode enabled (`strict: true`, `noImplicitAny: true`).
- No `any` types; define explicit interfaces or use Zod-inferred types (`z.infer<typeof Schema>`).
- Normalize and sanitize all user inputs (emails to lowercase, roll numbers to uppercase).

### 2.3 Database & Prisma
- Always use UUID (`cuid()` or `uuid()`) for internal database IDs.
- Keep `rollNumber` unique and immutable on the `Student` model.
- Use explicit Prisma transactions (`prisma.$transaction`) for multi-step mutations (e.g. Event registration capacity checks, CSV bulk imports).
- Never store binary file data in database rows.

### 2.4 Error Handling & Logging
- Wrap external API calls (Google Drive, Cloudflare R2) in defensive try-catch blocks with descriptive error logs.
- Never log passwords, OAuth tokens, session secrets, or confidential grievance contents.
- Return structured API errors with standard HTTP status codes (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Error`).

---

## 3. Security Rules & Privacy Boundaries

1. **Zero-Trust Client Payloads:** Always derive `userId`, `role`, and `permissions` from the verified server session, never from request body parameters.
2. **Drive Public-Link Isolation:**
   - Files uploaded to the institutional Google Drive workflow are marked `Anyone with link - Viewer`.
   - **CRITICAL RESTRICTION:** Disciplinary reports, student grievances, and sensitive identity proofs must NEVER be routed to Google Drive with public-link permissions. They must be stored in the private restricted storage tier.
3. **Upload Security:** Validate actual file bytes via `Sharp`, limit images to 10 MB and max 2 per post, and strip all EXIF metadata.
4. **Environment Variables:** Never commit `.env` or secrets. Load credentials exclusively through `process.env`.
