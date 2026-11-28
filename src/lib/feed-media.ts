/**
 * Pure media URL normalization & legacy Base64 guard helpers for feed queries.
 * Prevents historical Base64 blobs in PostMedia.thumbnailUrl from bloating GET /api/posts.
 */

export function isDataUriImage(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().startsWith('data:image/');
}

/**
 * Appends compact width & quality resize hints for /api/drive/file/[id] proxy URLs.
 */
export function appendDriveResizeHints(url: string, width = 900, quality = 80): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith('/api/drive/file/')) {
    return trimmed;
  }
  if (trimmed.includes('w=') || trimmed.includes('width=')) {
    return trimmed;
  }
  const sep = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${sep}w=${width}&q=${quality}`;
}

/**
 * Extracts compact Drive/CDN image URL from a PostMedia record.
 * Never emits massive Base64 `data:image/...` strings in feed lists when a URL exists.
 */
export function resolveFeedMediaUrl(media: {
  url?: string | null;
  thumbnailUrl?: string | null;
}): string | null {
  const rawUrl = media.url?.trim() || '';
  if (rawUrl && !isDataUriImage(rawUrl)) {
    return appendDriveResizeHints(rawUrl, 900, 80);
  }

  const rawThumb = media.thumbnailUrl?.trim() || '';
  if (rawThumb && !isDataUriImage(rawThumb)) {
    return appendDriveResizeHints(rawThumb, 480, 72);
  }

  return null;
}

/**
 * Extracts raw binary buffer from a data URI image string or raw Base64 payload.
 */
export function decodeImagePayload(raw: string): Buffer | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith('data:image/')) {
    const commaIndex = trimmed.indexOf(',');
    if (commaIndex === -1) return null;
    return Buffer.from(trimmed.slice(commaIndex + 1), 'base64');
  }
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  ) {
    return null;
  }
  return Buffer.from(trimmed, 'base64');
}
