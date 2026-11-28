import crypto from 'crypto';

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const RESTORE_CHALLENGE_TTL_SECONDS = CHALLENGE_TTL_MS / 1000;

function getRestoreChallengeSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.BACKUP_ENCRYPTION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('Server restore HMAC secret is not configured');
  }
  return secret;
}

/**
 * Issues a short-lived HMAC-SHA256 challenge token bound to a specific SUPER_ADMIN userId.
 */
export function issueRestoreChallengeToken(userId: string, issuedAt = Date.now()): string {
  const payload = `${userId}.${issuedAt}`;
  const sig = crypto
    .createHmac('sha256', getRestoreChallengeSecret())
    .update(payload)
    .digest('hex');
  return `${payload}.${sig}`;
}

/**
 * Verifies a restore challenge token using constant-time HMAC comparison and strict TTL/userId binding.
 */
export function verifyRestoreChallengeToken(token: unknown, userId: string): boolean {
  if (typeof token !== 'string' || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [tokenUid, tsStr, providedSig] = parts;
  const issuedAt = Number(tsStr);
  if (!tokenUid || tokenUid !== userId || !Number.isFinite(issuedAt)) return false;

  const ageMs = Date.now() - issuedAt;
  if (ageMs < 0 || ageMs > CHALLENGE_TTL_MS) return false;

  const expectedSig = crypto
    .createHmac('sha256', getRestoreChallengeSecret())
    .update(`${tokenUid}.${tsStr}`)
    .digest('hex');

  const a = Buffer.from(providedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
