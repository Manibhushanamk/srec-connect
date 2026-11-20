# SREC CONNECT — Production Repair Plan (Unresolved Operational Work Only)

> **Scope:** Unresolved Operational Dependencies & External Prerequisites  
> **Status:** All engineering, architecture, cryptographic, testing, and compilation defects have been resolved.  
> **Target Release:** SREC CONNECT v3.0.0 (`https://srecconnect.dpdns.org`)  
> **Last Synchronized:** November 20, 2026

---

## 1. Unresolved Operational Dependencies

The following items cannot be performed autonomously by an agent and require human operator action:

### Item 1: Super Admin Interactive Google Drive OAuth Consent (`BLOCKED EXTERNAL`)
- **Root Blocker:** Google OAuth 2.0 requires physical user authentication and consent grant in an interactive browser session to generate an initial refresh token.
- **Pre-Conditions Completed by Engineering:**
  - Automated headless refresh client implemented in `src/lib/drive.ts`.
  - NextAuth `GoogleProvider` configured with `prompt: 'consent select_account'` and `access_type: 'offline'`.
  - Auto-persistence of Super Admin OAuth credentials to `SystemSetting` implemented in `src/lib/auth.ts`.
  - Interactive "Connect Google Drive" UI trigger implemented in `src/app/admin/settings/page.tsx`.
  - Public certificate upload vs private backup upload security boundaries enforced (`assertDriveAllowed`).
- **Remaining Action Required by Operator:**
  1. Navigate to `https://srecconnect.dpdns.org/signin` in a web browser.
  2. Sign in with the institutional Super Admin account: `principal@srecnandyal.edu.in` (or configured `INITIAL_ADMIN_EMAIL`).
  3. Navigate to `/admin/settings` -> Select Tab **"Google Drive"**.
  4. Click **"Connect Google Drive"** and approve the requested Google Drive file scope.
  5. The application will automatically store the refresh token in `SystemSetting` and initialize the `SREC Connect` and `SREC Connect Backups` folders.

---

### Item 2: Deploy Verified Local Commits to Production (`PENDING RELEASE PUSH`)
- **Root Blocker:** The local branch `main` contains verified production commits that are ahead of `origin/main`.
- **Pre-Conditions Completed by Engineering:**
  - 66/66 automated tests passing across 14 test files (`npm test`).
  - 80/80 verification checkpoints validated.
  - 68/68 static and dynamic Next.js routes compiled with 0 errors and 0 warnings (`npm run build`).
  - TypeScript strict typecheck passed with 0 errors (`npm run typecheck`).
  - Both in-memory and physical PostgreSQL staging restoration proven on Neon.
  - `BACKUP_ENCRYPTION_SECRET` and `CRON_SECRET` configured in Vercel project environment.
- **Remaining Action Required:**
  1. Execute `git push origin main` in `/home/kmanib/Documents/srec-connect-final`.
  2. Vercel CI/CD will automatically detect the commit, compile the production bundle, and deploy the updated application to `https://srecconnect.dpdns.org`.
