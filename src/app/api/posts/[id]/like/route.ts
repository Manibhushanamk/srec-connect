import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Verify post exists and is active
    const targetPost = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      select: { id: true },
    });

    if (!targetPost) {
      return NextResponse.json({ error: 'Post not found or has been removed' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      return NextResponse.json({ error: 'User account is suspended or inactive' }, { status: 403 });
    }

    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    let isLiked = false;
    if (existingLike) {
      try {
        await prisma.postLike.delete({
          where: { id: existingLike.id },
        });
      } catch {
        // Handled if deleted concurrently
      }
      isLiked = false;
    } else {
      try {
        await prisma.postLike.create({
          data: {
            postId,
            userId: user.id,
          },
        });
        isLiked = true;
      } catch {
        // Handled if created concurrently
        isLiked = true;
      }
    }

    const likesCount = await prisma.postLike.count({
      where: { postId },
    });

    return NextResponse.json({ isLiked, likesCount });
  } catch (error: any) {
    console.error('[Post Like API] Error:', error);
    return NextResponse.json({ error: 'Failed to update like status' }, { status: 500 });
  }
}
