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

    const existingBookmark = await prisma.postBookmark.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    let isBookmarked = false;
    if (existingBookmark) {
      await prisma.postBookmark.delete({
        where: { id: existingBookmark.id },
      });
      isBookmarked = false;
    } else {
      await prisma.postBookmark.create({
        data: {
          postId,
          userId: user.id,
        },
      });
      isBookmarked = true;
    }

    return NextResponse.json({ isBookmarked });
  } catch (error: any) {
    console.error('[Post Bookmark API] Error:', error);
    return NextResponse.json({ error: 'Failed to update bookmark status' }, { status: 500 });
  }
}
