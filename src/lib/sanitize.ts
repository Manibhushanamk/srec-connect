/**
 * SREC CONNECT Security Sanitization Engine
 * Zero-dependency, high-throughput input sanitizer preventing XSS, SSRF, and injection attacks.
 */

const DANGEROUS_TAGS_REGEX = /<\/?(script|iframe|object|embed|applet|form|input|button|meta|link|style)[^>]*>/gi;
const DANGEROUS_ATTRS_REGEX = /\s*(on\w+|javascript:|data:|vbscript:)[^>"]*/gi;
const DISALLOWED_SSRF_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254',
  'metadata.google.internal',
]);

/**
 * Strips executable HTML tags, event handlers, and dangerous attributes.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '') // Strip null bytes
    .replace(DANGEROUS_TAGS_REGEX, '')
    .replace(DANGEROUS_ATTRS_REGEX, '')
    .trim();
}

/**
 * Validates and sanitizes external URLs to prevent SSRF and XSS (`javascript:`).
 */
export function sanitizeSafeUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  const cleaned = url.trim();

  // Allow safe relative paths
  if (cleaned.startsWith('/') && !cleaned.startsWith('//')) {
    return cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return null;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      DISALLOWED_SSRF_HOSTS.has(hostname) ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.')
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
