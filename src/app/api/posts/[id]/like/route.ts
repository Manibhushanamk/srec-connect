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
      await prisma.postLike.delete({
        where: { id: existingLike.id },
      });
      isLiked = false;
    } else {
      await prisma.postLike.create({
        data: {
          postId,
          userId: user.id,
        },
      });
      isLiked = true;
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
