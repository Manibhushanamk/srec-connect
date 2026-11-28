import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';
import {
  getStoredDriveTokens,
  getUserDriveTokens,
  saveUserDriveTokens,
  verifyDriveAssetAccess,
} from '@/lib/drive';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
};

function detectMimeFromBuffer(buf: Buffer, fallbackMime?: string | null): string {
  if (fallbackMime && fallbackMime !== 'application/octet-stream') {
    return fallbackMime;
  }
  if (buf.length >= 4) {
    if (buf.subarray(0, 4).toString('ascii') === '%PDF') return 'application/pdf';
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
    if (
      buf.length >= 12 &&
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }
  }
  return fallbackMime || 'application/octet-stream';
}

async function refreshOAuthAccessToken(refreshToken: string): Promise<string | undefined> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return undefined;
  }
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { token } = await oauth2Client.getAccessToken();
    return token || undefined;
  } catch {
    return undefined;
  }
}

/**
 * GET /api/drive/document/[id]
 * Authenticated private document streaming route (certificates, marksheets, incident proofs).
 * Enforces ownership / department RBAC and zero public CDN caching.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const fileId = rawId?.trim();
  if (!fileId || fileId.includes('..') || fileId.includes('/')) {
    return NextResponse.json({ error: 'Valid File ID is required' }, { status: 400, headers: PRIVATE_HEADERS });
  }

  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: PRIVATE_HEADERS });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase().trim() },
    select: {
      id: true,
      role: true,
      departmentId: true,
      student: { select: { id: true } },
    },
  });

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: PRIVATE_HEADERS });
  }

  const access = await verifyDriveAssetAccess(fileId, currentUser);
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason || 'Forbidden: Insufficient privileges for private document' },
      { status: 403, headers: PRIVATE_HEADERS }
    );
  }

  // 1. Local disk lookup in public/uploads for dev / local-fallback uploads
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const match = files.find((f) => f === fileId || f.includes(fileId));
    if (match) {
      const fullPath = path.join(uploadsDir, path.basename(match));
      const buffer = fs.readFileSync(fullPath);
      const ext = path.extname(match).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.webp': 'image/webp',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
      };
      const resolvedMime = detectMimeFromBuffer(buffer, mimeMap[ext]);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          ...PRIVATE_HEADERS,
          'Content-Type': resolvedMime,
          'Content-Length': String(buffer.length),
          'Content-Disposition': `inline; filename="${encodeURIComponent(match)}"`,
        },
      });
    }
  }

  // 2. Gather candidate bearer tokens (session -> owner OAuth with refresh -> system OAuth with refresh)
  const candidateTokens: Array<{ token: string; userId?: string; refreshToken?: string }> = [];
  if ((session as any)?.accessToken) {
    candidateTokens.push({ token: (session as any).accessToken });
  }
  if (access.ownerUserId) {
    const ownerTokens = await getUserDriveTokens(access.ownerUserId).catch(() => null);
    if (ownerTokens?.access_token) {
      const expired = ownerTokens.expiry_date ? Date.now() >= ownerTokens.expiry_date : false;
      if (expired && ownerTokens.refresh_token) {
        const refreshed = await refreshOAuthAccessToken(ownerTokens.refresh_token);
        if (refreshed) {
          await saveUserDriveTokens(access.ownerUserId, { access_token: refreshed }).catch(() => null);
          candidateTokens.push({ token: refreshed, userId: access.ownerUserId, refreshToken: ownerTokens.refresh_token });
        }
      } else {
        candidateTokens.push({
          token: ownerTokens.access_token,
          userId: access.ownerUserId,
          refreshToken: ownerTokens.refresh_token,
        });
      }
    } else if (ownerTokens?.refresh_token) {
      const refreshed = await refreshOAuthAccessToken(ownerTokens.refresh_token);
      if (refreshed) {
        await saveUserDriveTokens(access.ownerUserId, { access_token: refreshed }).catch(() => null);
        candidateTokens.push({ token: refreshed, userId: access.ownerUserId, refreshToken: ownerTokens.refresh_token });
      }
    }
  }

  const sysTokens = await getStoredDriveTokens().catch(() => null);
  if (sysTokens?.access_token || sysTokens?.refresh_token) {
    const expired = sysTokens.expiry_date ? Date.now() >= sysTokens.expiry_date : false;
    if ((!sysTokens.access_token || expired) && sysTokens.refresh_token) {
      const refreshed = await refreshOAuthAccessToken(sysTokens.refresh_token);
      if (refreshed) {
        candidateTokens.push({ token: refreshed, refreshToken: sysTokens.refresh_token });
      }
    } else if (sysTokens.access_token) {
      candidateTokens.push({ token: sysTokens.access_token, refreshToken: sysTokens.refresh_token });
    }
  }

  // Try Google Drive authenticated API fetch across candidate tokens
  for (const cand of candidateTokens) {
    try {
      let activeToken = cand.token;
      let mediaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );

      if (mediaRes.status === 401 && cand.refreshToken) {
        const refreshed = await refreshOAuthAccessToken(cand.refreshToken);
        if (refreshed) {
          activeToken = refreshed;
          if (cand.userId) {
            await saveUserDriveTokens(cand.userId, { access_token: refreshed }).catch(() => null);
          }
          mediaRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
            { headers: { Authorization: `Bearer ${activeToken}` } }
          );
        }
      }

      if (mediaRes.ok) {
        const metaRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType`,
          { headers: { Authorization: `Bearer ${activeToken}` } }
        ).catch(() => null);
        const meta = metaRes?.ok ? await metaRes.json() : {};
        const buffer = Buffer.from(await mediaRes.arrayBuffer());
        const resolvedMime = detectMimeFromBuffer(
          buffer,
          meta.mimeType || mediaRes.headers.get('content-type')
        );

        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            ...PRIVATE_HEADERS,
            'Content-Type': resolvedMime,
            'Content-Length': String(buffer.length),
            'Content-Disposition': `inline; filename="${encodeURIComponent(meta.name || `document_${fileId}`)}"`,
          },
        });
      }
    } catch {
      // Try next token or fallback
    }
  }

  // 3. Shared Drive Link Fallback (only runs AFTER user passed strict RBAC check above!)
  const isGoogleDriveId = !fileId.startsWith('srec-') && !fileId.startsWith('drive-srec-') && fileId.length >= 20;
  if (isGoogleDriveId) {
    try {
      const edgeRes = await fetch(`https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (edgeRes.ok) {
        const ct = edgeRes.headers.get('content-type') || '';
        if (ct.startsWith('image/')) {
          const buffer = Buffer.from(await edgeRes.arrayBuffer());
          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              ...PRIVATE_HEADERS,
              'Content-Type': detectMimeFromBuffer(buffer, ct),
              'Content-Length': String(buffer.length),
              'Content-Disposition': `inline; filename="document_${encodeURIComponent(fileId)}"`,
            },
          });
        }
      }
    } catch {
      // Fall through to direct download fallback
    }

    try {
      const dlRes = await fetch(
        `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&authuser=0`
      );
      if (dlRes.ok) {
        const ct = dlRes.headers.get('content-type') || '';
        if (!ct.includes('text/html')) {
          const buffer = Buffer.from(await dlRes.arrayBuffer());
          const resolvedMime = detectMimeFromBuffer(buffer, ct);
          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              ...PRIVATE_HEADERS,
              'Content-Type': resolvedMime,
              'Content-Length': String(buffer.length),
              'Content-Disposition': `inline; filename="document_${encodeURIComponent(fileId)}"`,
            },
          });
        }
      }
    } catch {
      // Fall through to clean 404/503
    }
  }

  return NextResponse.json(
    {
      error:
        candidateTokens.length === 0
          ? 'Document storage token unavailable or unlinked sample document'
          : 'Private document unavailable in Google Drive',
    },
    { status: candidateTokens.length === 0 ? 503 : 404, headers: PRIVATE_HEADERS }
  );
}
