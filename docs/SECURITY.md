# Security & Privacy Policy: SREC Connect v3.0

## 1. Authentication & Session Security
- **OAuth / OIDC Verification:** Server-side validation of Google OAuth tokens (issuer, audience, expiration, email verification). Client-supplied roles and IDs are strictly discarded.
- **Session Tokens:** Encrypted session cookies configured with `HttpOnly`, `SameSite=Lax` (or `Strict`), and `Secure` flags.
- **Session Revocation & Account Suspension:** Server checks user active status on every authenticated mutation. Suspended accounts are barred immediately.

## 2. Authorization & RBAC
- **Granular Permissions:** Every endpoint checks fine-grained permissions (e.g. `achievements.review`, `incidents.assign`, `users.bulk_import`).
- **Horizontal Access Control (IDOR Prevention):** Users can only view or edit their own private drafts and personal settings. Disciplinary incidents are restricted to the accused student, reporting faculty, and HOD.

## 3. Media Upload & File Security
- **Buffer & Magic Byte Inspection:** `Sharp` verifies true image MIME type and file headers before processing. Extensions alone are never trusted.
- **Image Sanitization:** Strips all EXIF metadata (GPS coordinates, device info), resizes to max 1600px edge, converts to WebP, and caps file size at 10 MB (aiming for <= 500 KB).
- **Decompression Bomb Protection:** Sharp caps image dimensions and rejects oversized pixel counts.
- **Post Limits:** Hard-capped at 2 images per post at both UI and Server Action layers.

## 4. Google Drive Privacy Disclosure
- **Public-Link Warning:** Files uploaded via the institutional Google Drive integration are marked with "Anyone with link - Viewer" permissions.
- **Confidential Records Prohibition:** Grievance evidence, disciplinary attachments, student identity cards, and confidential records must NEVER use the Google Drive public-link path. They must use the private server-authenticated storage tier.
