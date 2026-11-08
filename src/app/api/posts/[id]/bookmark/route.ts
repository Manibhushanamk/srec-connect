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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
