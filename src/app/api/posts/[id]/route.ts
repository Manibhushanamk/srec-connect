import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sanitizeText } from '@/lib/sanitize';
import { canEditPost, canDeletePost, validatePostUpdatePayload } from '@/lib/post-auth';
import { getUserDriveTokens } from '@/lib/drive';
import { uploadPostMediaWithThumbnail } from '@/lib/post-media-upload';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true, role: true, departmentId: true, email: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true, deletedAt: true },
    });
    if (!post || post.deletedAt !== null) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Strict Author-Only Editing: admins, HODs, and Web Managers cannot rewrite user posts
    const editCheck = canEditPost(currentUser, post);
    if (!editCheck.allowed) {
      return NextResponse.json({ error: editCheck.reason || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const validated = validatePostUpdatePayload(body);
    if (!validated.valid || !validated.content) {
      return NextResponse.json({ error: validated.error || 'Invalid payload' }, { status: 400 });
    }

    const cleanContent = sanitizeText(validated.content);
    if (!cleanContent) {
      return NextResponse.json({ error: 'Post content cannot be empty' }, { status: 400 });
    }

    let preparedMedia:
      | Array<{ url: string; thumbnailUrl: string; width: number; height: number; order: number }>
      | undefined;

    if (validated.images !== undefined) {
      let driveAccessToken = (session as any)?.accessToken;
      let driveRefreshToken = (session as any)?.refreshToken;
      const hasInlineData = validated.images.some((u) => u.startsWith('data:image/'));
      if (hasInlineData && !driveAccessToken && !driveRefreshToken) {
        const stored = await getUserDriveTokens(currentUser.id).catch(() => null);
        if (stored?.access_token) {
          driveAccessToken = stored.access_token;
          driveRefreshToken = stored.refresh_token;
        }
      }

      preparedMedia =
        validated.images.length > 0
          ? await uploadPostMediaWithThumbnail({
              rawImages: validated.images,
              driveAccessToken,
              driveRefreshToken,
            })
          : [];
    }

    const updatedPost = await prisma.$transaction(async (tx) => {
      if (preparedMedia !== undefined) {
        await tx.postMedia.deleteMany({ where: { postId: id } });
      }
      return tx.post.update({
        where: { id },
        data: {
          content: cleanContent,
          ...(validated.visibility ? { visibility: validated.visibility } : {}),
          ...(preparedMedia !== undefined
            ? {
                media: {
                  create: preparedMedia.map((m) => ({
                    url: m.url,
                    thumbnailUrl: m.thumbnailUrl,
                    width: m.width,
                    height: m.height,
                    order: m.order,
                  })),
                },
              }
            : {}),
        },
        include: {
          media: { orderBy: { order: 'asc' } },
        },
      });
    });

    try {
      revalidateTag('public-feed');
    } catch {
      // Ignore outside Next.js request context (e.g., Node unit test runner)
    }

    return NextResponse.json({
      success: true,
      post: {
        id: updatedPost.id,
        content: updatedPost.content,
        visibility: updatedPost.visibility,
        createdAt: updatedPost.createdAt,
        updatedAt: updatedPost.updatedAt,
        images: updatedPost.media.map((m) => m.url),
      },
    });
  } catch (error: any) {
    console.error('[Post PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true, email: true, role: true, departmentId: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        content: true,
        visibility: true,
        deletedAt: true,
        author: { select: { departmentId: true } },
      },
    });
    if (!post || post.deletedAt !== null) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const deleteCheck = canDeletePost(currentUser, {
      id: post.id,
      authorId: post.authorId,
      visibility: post.visibility,
      authorDepartmentId: post.author.departmentId,
    });
    if (!deleteCheck.allowed) {
      return NextResponse.json({ error: deleteCheck.reason || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' && body.reason.trim()
      ? sanitizeText(body.reason.trim()).slice(0, 300)
      : null;

    await prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: deleteCheck.isModeratorDelete ? 'POST_MODERATED_DELETE' : 'POST_MOVED_TO_TRASH',
        entityType: 'Post',
        entityId: id,
        metadata: JSON.stringify({
          targetAuthorId: post.authorId,
          reason,
          snippet: post.content.slice(0, 50),
        }),
      },
    });

    try {
      revalidateTag('public-feed');
    } catch {
      // Ignore outside Next.js request context (e.g., Node unit test runner)
    }

    return NextResponse.json({ success: true, message: 'Post moved to trash' });
  } catch (error: any) {
    console.error('[Post DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
