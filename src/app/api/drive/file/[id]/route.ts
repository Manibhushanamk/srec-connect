import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStoredDriveTokens, getUserDriveTokens, saveUserDriveTokens } from '@/lib/drive';
import { getCachedMedia, setCachedMedia } from '@/lib/media-cache';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  if (!rawId) {
    return new NextResponse('File ID is required', { status: 400 });
  }

  // Strip query artifacts or prefixes if any
  const fileId = rawId.trim();

  // Query parameters for dynamic CDN image resizing (like Cloudflare Image Resizing / S3 CloudFront)
  const { searchParams } = new URL(req.url);
  const targetWidth = searchParams.get('w') || searchParams.get('width');
  const targetQuality = searchParams.get('q') || searchParams.get('quality');
  const isThumbnail = searchParams.get('thumb') === '1' || searchParams.get('thumb') === 'true';

  const cacheKey = `${fileId}${targetWidth ? `_w${targetWidth}` : ''}${isThumbnail ? '_thumb' : ''}`;

  // 1. In-Memory CDN Cache HIT Check (sub-5ms)
  const cached = getCachedMedia(cacheKey);
  if (cached) {
    return serveMediaBuffer(req, cached.buffer, cached.mimeType, cached.fileName, cached.etag, cached.lastModified, true);
  }

  // 2. Local Fallback / Development Disk Check
  if (fileId.startsWith('srec-') || fileId.startsWith('drive-srec-')) {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const match = files.find((f) => f.includes(fileId));
      if (match) {
        const fullPath = path.join(uploadsDir, match);
        const stats = fs.statSync(fullPath);
        const buffer = fs.readFileSync(fullPath);
        const ext = path.extname(match).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.webp': 'image/webp',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.pdf': 'application/pdf',
        };
        const mimeType = mimeMap[ext] || 'application/octet-stream';
        const etag = `W/"srec-local-${fileId}-${stats.size}"`;
        const lastMod = stats.mtime.toUTCString();
        setCachedMedia(cacheKey, {
          buffer,
          mimeType,
          fileName: match,
          size: stats.size,
          etag,
          lastModified: lastMod,
          cachedAt: Date.now(),
        });
        return serveMediaBuffer(req, buffer, mimeType, match, etag, lastMod, false);
      }
    }
  }

  // 3. Multi-Tier Google Drive Retrieval (Zero-Auth-Barrier CDN Pipeline)
  const isGoogleDriveId =
    !fileId.startsWith('srec-') &&
    !fileId.startsWith('drive-srec-') &&
    !fileId.startsWith('inline-') &&
    fileId.length >= 20;

  let fetchedBuffer: Buffer | null = null;
  let fetchedMimeType = 'application/octet-stream';
  let fetchedFileName = `document_${fileId}`;

  if (isGoogleDriveId) {
    try {
      // Attempt A1: Direct Google Drive REST API with Session OAuth Bearer Token
      const session = await getServerSession(authOptions).catch(() => null);
      let accessToken = (session as any)?.accessToken;

      if (accessToken) {
        try {
          const metaRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (metaRes.ok) {
            const meta = await metaRes.json();
            fetchedMimeType = meta.mimeType || fetchedMimeType;
            fetchedFileName = meta.name || fetchedFileName;
          }

          const mediaRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (mediaRes.ok) {
            const arr = await mediaRes.arrayBuffer();
            fetchedBuffer = Buffer.from(arr);
          }
        } catch (clientErr: any) {
          console.warn(`[Drive Stream] Direct REST get failed for ${fileId}:`, clientErr?.message);
        }
      }

      // Attempt A2: Direct Google Drive REST API with System Super Admin or Post Author DB Tokens
      if (!fetchedBuffer) {
        try {
          let systemToken = '';
          let authorUserId = '';
          const sys = await getStoredDriveTokens();
          if (sys?.access_token) {
            systemToken = sys.access_token;
          } else {
            const mediaRecord = await prisma.postMedia.findFirst({
              where: { url: { contains: fileId } },
              include: { post: { select: { authorId: true } } },
            });
            if (mediaRecord?.post?.authorId) {
              authorUserId = mediaRecord.post.authorId;
              const authorTokens = await getUserDriveTokens(authorUserId);
              if (authorTokens?.access_token) {
                systemToken = authorTokens.access_token;
              }
              // Auto-refresh token if expired
              if ((!systemToken || (authorTokens?.expiry_date && Date.now() >= authorTokens.expiry_date)) && authorTokens?.refresh_token) {
                try {
                  const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET
                  );
                  oauth2Client.setCredentials({ refresh_token: authorTokens.refresh_token });
                  const { token } = await oauth2Client.getAccessToken();
                  if (token) {
                    systemToken = token;
                    await saveUserDriveTokens(authorUserId, { access_token: token });
                  }
                } catch (rfErr) {
                  console.warn(`[Drive Stream] Author token auto-refresh failed for ${authorUserId}:`, rfErr);
                }
              }
            } else {
              // Try finding certificate media
              const achMedia = await prisma.achievementMedia.findFirst({
                where: { url: { contains: fileId } },
                include: { achievement: { select: { primaryStudent: { select: { user: { select: { id: true } } } } } } },
              });
              const studentUserId = achMedia?.achievement?.primaryStudent?.user?.id;
              if (studentUserId) {
                authorUserId = studentUserId;
                const studentTokens = await getUserDriveTokens(studentUserId);
                if (studentTokens?.access_token) systemToken = studentTokens.access_token;
                if ((!systemToken || (studentTokens?.expiry_date && Date.now() >= studentTokens.expiry_date)) && studentTokens?.refresh_token) {
                  try {
                    const oauth2Client = new google.auth.OAuth2(
                      process.env.GOOGLE_CLIENT_ID,
                      process.env.GOOGLE_CLIENT_SECRET
                    );
                    oauth2Client.setCredentials({ refresh_token: studentTokens.refresh_token });
                    const { token } = await oauth2Client.getAccessToken();
                    if (token) {
                      systemToken = token;
                      await saveUserDriveTokens(studentUserId, { access_token: token });
                    }
                  } catch (rfErr) {
                    console.warn(`[Drive Stream] Student token auto-refresh failed for ${studentUserId}:`, rfErr);
                  }
                }
              }
            }
          }

          if (systemToken) {
            let mediaRes = await fetch(
              `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
              {
                headers: { Authorization: `Bearer ${systemToken}` },
              }
            );

            // If 401 Unauthorized, attempt immediate refresh via author's refresh token
            if (mediaRes.status === 401 && authorUserId) {
              const freshTokens = await getUserDriveTokens(authorUserId);
              if (freshTokens?.refresh_token) {
                try {
                  const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET
                  );
                  oauth2Client.setCredentials({ refresh_token: freshTokens.refresh_token });
                  const { token } = await oauth2Client.getAccessToken();
                  if (token) {
                    systemToken = token;
                    await saveUserDriveTokens(authorUserId, { access_token: token });
                    mediaRes = await fetch(
                      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
                      {
                        headers: { Authorization: `Bearer ${systemToken}` },
                      }
                    );
                  }
                } catch (retryErr) {
                  console.warn(`[Drive Stream] Token retry failed:`, retryErr);
                }
              }
            }

            if (mediaRes.ok) {
              const arr = await mediaRes.arrayBuffer();
              fetchedBuffer = Buffer.from(arr);
            }
          }
        } catch (sysErr) {
          console.warn(`[Drive Stream System Token Warning] for ${fileId}:`, sysErr);
        }
      }

      // Attempt B: High-Speed Google Public Edge CDN (for shared certificates & feed images)
      if (!fetchedBuffer) {
        // 1. Try Google High-Speed Edge photo CDN
        try {
          const edgeRes = await fetch(`https://lh3.googleusercontent.com/d/${fileId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          });
          if (edgeRes.ok) {
            const contentType = edgeRes.headers.get('content-type') || '';
            if (contentType.startsWith('image/')) {
              const arr = await edgeRes.arrayBuffer();
              fetchedBuffer = Buffer.from(arr);
              fetchedMimeType = contentType;
            }
          }
        } catch (edgeErr) {
          // Continue to download link
        }

        // 2. Try Google Drive Direct Export / Download Link
        if (!fetchedBuffer) {
          try {
            const downloadRes = await fetch(
              `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`
            );
            if (downloadRes.ok) {
              const contentType = downloadRes.headers.get('content-type') || '';
              if (!contentType.includes('text/html')) {
                const arr = await downloadRes.arrayBuffer();
                fetchedBuffer = Buffer.from(arr);
                fetchedMimeType = contentType || 'application/pdf';
              }
            }
          } catch (dlErr) {
            // Handled below
          }
        }
      }

      // Attempt C: Database Stored Thumbnail/Data URI Fallback
      if (!fetchedBuffer) {
        try {
          const mediaRecord = await prisma.postMedia.findFirst({
            where: { url: { contains: fileId } },
            select: { thumbnailUrl: true },
          });
          if (mediaRecord?.thumbnailUrl?.startsWith('data:image/')) {
            const base64Data = mediaRecord.thumbnailUrl.split(',')[1];
            if (base64Data) {
              fetchedBuffer = Buffer.from(base64Data, 'base64');
              fetchedMimeType = 'image/webp';
            }
          }
        } catch (dbErr) {
          // ignore
        }
      }
    } catch (err: any) {
      console.error(`[Drive Stream Error] Failed to stream ${fileId}:`, err?.message || err);
    }
  }

  // 4. Process and Optimize Image if requested
  if (fetchedBuffer) {
      let finalBuffer = fetchedBuffer;
      let finalMimeType = fetchedMimeType;

      if (fetchedMimeType.startsWith('image/') && !fetchedMimeType.includes('svg')) {
        try {
          const widthNum = targetWidth ? parseInt(targetWidth, 10) : isThumbnail ? 360 : undefined;
          const qualityNum = targetQuality ? parseInt(targetQuality, 10) : 82;

          let pipeline = sharp(fetchedBuffer).rotate();

          if (widthNum && widthNum > 0 && widthNum < 2500) {
            pipeline = pipeline.resize({ width: widthNum, withoutEnlargement: true });
          }

          finalBuffer = await pipeline.webp({ quality: qualityNum }).toBuffer();
          finalMimeType = 'image/webp';
        } catch (optErr) {
          console.warn('[Drive CDN Optimization Warning] Serving original buffer:', optErr);
        }
      }

      const etag = `W/"srec-drive-${fileId}-${finalBuffer.length}"`;
      const lastModified = new Date().toUTCString();

      // Store in memory cache for sub-5ms repeat loads
      setCachedMedia(cacheKey, {
        buffer: finalBuffer,
        mimeType: finalMimeType,
        fileName: fetchedFileName,
        size: finalBuffer.length,
        etag,
        lastModified,
        cachedAt: Date.now(),
      });

      return serveMediaBuffer(req, finalBuffer, finalMimeType, fetchedFileName, etag, lastModified, false);
  }

  // 5. Final Safe Fallback: Return a clean, non-broken SVG media card instead of redirecting to a Google Drive 404 HTML page
  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="none">
  <rect width="800" height="600" fill="#090d16"/>
  <rect x="20" y="20" width="760" height="560" rx="16" stroke="#1e293b" stroke-width="2" stroke-dasharray="6 6"/>
  <circle cx="400" cy="270" r="44" fill="#1e293b"/>
  <path d="M380 270h40M400 250v40" stroke="#0ea5e9" stroke-width="3" stroke-linecap="round"/>
  <text x="400" y="348" text-anchor="middle" fill="#f1f5f9" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">SREC Connect Institutional Media</text>
  <text x="400" y="376" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="13">Google Drive Storage Synchronizing</text>
</svg>`;

  return new NextResponse(placeholderSvg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

/**
 * Serves media buffer with HTTP 304, HTTP 206 Partial Content, and immutable CDN caching headers.
 */
function serveMediaBuffer(
  req: NextRequest,
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  etag: string,
  lastModified: string,
  cacheHit: boolean
) {
  // Check Conditional ETag Request (304 Not Modified)
  const clientEtag = req.headers.get('if-none-match');
  if (clientEtag && clientEtag === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        'ETag': etag,
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'Last-Modified': lastModified,
        'X-Cache-Status': 'HIT_304',
      },
    });
  }

  // Support HTTP Range Requests (206 Partial Content) for PDFs and Videos
  const range = req.headers.get('range');
  const totalSize = buffer.length;

  if (range && range.startsWith('bytes=')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

    if (start >= totalSize || end >= totalSize || start > end) {
      return new NextResponse('Requested range not satisfiable', {
        status: 416,
        headers: {
          'Content-Range': `bytes */${totalSize}`,
        },
      });
    }

    const chunk = buffer.subarray(start, end + 1);

    return new NextResponse(new Uint8Array(chunk), {
      status: 206,
      headers: {
        'Content-Type': mimeType,
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Content-Length': String(chunk.length),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'ETag': etag,
        'Last-Modified': lastModified,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'X-Content-Type-Options': 'nosniff',
        'X-Storage-Engine': 'SREC-GoogleDrive-CDN',
        'X-Cache-Status': cacheHit ? 'HIT_RANGE' : 'MISS_RANGE',
      },
    });
  }

  // Standard 200 OK CDN Response
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(totalSize),
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'ETag': etag,
      'Last-Modified': lastModified,
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
      'X-Storage-Engine': 'SREC-GoogleDrive-CDN',
      'X-Cache-Status': cacheHit ? 'HIT' : 'MISS',
    },
  });
}

export async function HEAD(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const getRes = await GET(req, { params });
  return new NextResponse(null, {
    status: getRes.status,
    headers: getRes.headers,
  });
}
