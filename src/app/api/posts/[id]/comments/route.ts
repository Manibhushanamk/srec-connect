import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const comments = await prisma.postComment.findMany({
      where: {
        postId,
        post: { deletedAt: null },
        author: { deletedAt: null, status: 'ACTIVE' },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('[Post Comments GET API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required to comment' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Verify target post exists and is active (not soft-deleted)
    const targetPost = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      select: { id: true, authorId: true },
    });

    if (!targetPost) {
      return NextResponse.json({ error: 'Post not found or has been removed' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true, name: true, role: true, avatarUrl: true, status: true, deletedAt: true },
    });

    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      return NextResponse.json({ error: 'User account is suspended or inactive' }, { status: 403 });
    }

    const body = await req.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!content) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Comment exceeds max length of 500 characters' }, { status: 400 });
    }

    const comment = await prisma.postComment.create({
      data: {
        postId,
        authorId: user.id,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notify post author if commenter is not the author
    if (targetPost.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: targetPost.authorId,
          title: '💬 New Comment on Your Post',
          message: `${user.name || 'A campus member'} commented: "${content.slice(0, 80)}"`,
          link: '/',
        },
      }).catch(() => null);
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    console.error('[Post Comments POST API] Error:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
