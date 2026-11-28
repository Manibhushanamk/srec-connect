import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MAX_POST_IMAGES } from '@/lib/media-constants';
import { getUserDriveTokens } from '@/lib/drive';
import { fetchPaginatedPostsUncached, getInitialPublicFeed } from '@/lib/feed-query';
import { uploadPostMediaWithThumbnail } from '@/lib/post-media-upload';
import { sanitizeText } from '@/lib/sanitize';
import { checkRateLimit } from '@/lib/rate-limit';
import { PostCreateSchema, parseJsonBody } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const currentUserEmail = session?.user?.email?.toLowerCase().trim();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'ALL'; // 'ALL' | 'STUDENT' | 'FACULTY'
    const cursor = searchParams.get('cursor')?.trim() || null;
    const rawTake = parseInt(searchParams.get('take') || searchParams.get('limit') || '10', 10);
    const take = Math.min(Math.max(Number.isFinite(rawTake) ? rawTake : 10, 1), 20);

    // Fast cached path for unauthenticated default page-1 feed reads
    if (!currentUserEmail && filter === 'ALL' && !cursor && take === 10) {
      const cachedFeed = await getInitialPublicFeed();
      return NextResponse.json(cachedFeed);
    }

    const currentUserId = currentUserEmail
      ? (await prisma.user.findUnique({ where: { email: currentUserEmail }, select: { id: true } }))?.id || null
      : null;

    const feedPage = await fetchPaginatedPostsUncached({
      filter,
      cursor,
      take,
      currentUserId,
    });

    return NextResponse.json(feedPage);
  } catch (error: any) {
    console.error('[API Posts GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch community posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required to post' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const rateLimit = checkRateLimit(`post-create:${user.id}`, { limit: 10, windowMs: 60000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before creating another post.' },
        { status: 429 }
      );
    }

    const parsed = await parseJsonBody(req, PostCreateSchema);
    if (!parsed.success) return parsed.response;
    const body = parsed.data;
    const content = sanitizeText(body.content);

    if (!content) {
      return NextResponse.json({ error: 'Post content cannot be empty' }, { status: 400 });
    }

    const rawImages: string[] = body.images;

    // STRICT SPECIFICATION CHECK (Task 5.1): Max 2 images allowed per post
    if (rawImages.length > MAX_POST_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_POST_IMAGES} images allowed per post. Received ${rawImages.length}.` },
        { status: 400 }
      );
    }

    // MANDATORY GOOGLE DRIVE PERMISSION CHECK FOR POSTS WITH MEDIA
    let driveAccessToken = (session as any)?.accessToken;
    let driveRefreshToken = (session as any)?.refreshToken;

    if (rawImages.length > 0) {
      if (!driveAccessToken && !driveRefreshToken && user?.id) {
        const stored = await getUserDriveTokens(user.id);
        if (stored?.access_token) {
          driveAccessToken = stored.access_token;
          driveRefreshToken = stored.refresh_token;
        }
      }

      if (!driveAccessToken && !driveRefreshToken) {
        return NextResponse.json(
          {
            error: 'Google Drive connection is mandatory to upload posts with media. Please connect your Google Drive from your dashboard or profile.',
            requiresDriveConnect: true,
          },
          { status: 403 }
        );
      }
    }

    // Process full WebP + ~<= 80 KB WebP thumbnail and upload both to Google Drive (no Base64 persistence)
    const processedMedia =
      rawImages.length > 0
        ? await uploadPostMediaWithThumbnail({
            rawImages,
            driveAccessToken,
            driveRefreshToken,
          })
        : [];

    // Persist to Neon DB in transaction
    const newPost = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId: user.id,
          content,
          visibility: body.visibility === 'COLLEGE_ONLY' ? 'COLLEGE_ONLY' : 'PUBLIC',
          media: {
            create: processedMedia.map((m) => ({
              url: m.url,
              thumbnailUrl: m.thumbnailUrl,
              width: m.width,
              height: m.height,
              order: m.order,
            })),
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              avatarUrl: true,
              student: { select: { rollNumber: true, departmentName: true } },
              faculty: { select: { designation: true, departmentName: true } },
            },
          },
          media: true,
          likes: true,
          bookmarks: true,
          comments: true,
        },
      });

      // Handle Instagram-style Collaboration Invites
      const rawCollabIds: string[] = Array.isArray(body.collaboratorIds) ? body.collaboratorIds : [];
      for (const collabId of rawCollabIds) {
        if (collabId && collabId !== user.id) {
          try {
            await tx.postCollaborator.create({
              data: {
                postId: post.id,
                userId: collabId,
                status: 'PENDING',
              },
            });

            // Dispatch in-app notification to invited collaborator
            await tx.notification.create({
              data: {
                userId: collabId,
                title: '🤝 Post Collaboration Request',
                message: `${user.name || 'A scholar'} invited you to co-author a post: "${content.substring(0, 60)}..."`,
                link: `/?post=${post.id}`,
              },
            });
          } catch (collabErr) {
            console.warn('[Post Collab Warning] Could not link collaborator:', collabErr);
          }
        }
      }

      return post;
    });

    try {
      revalidateTag('public-feed');
    } catch {
      // Ignore outside Next request cache context
    }

    return NextResponse.json({
      post: {
        ...newPost,
        images: newPost.media.map((m) => m.url),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Posts POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create post' }, { status: 500 });
  }
}
