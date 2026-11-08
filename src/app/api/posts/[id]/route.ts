import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true, content: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Only post author or SUPER_ADMIN / ADMIN can delete
    const isAuthor = post.authorId === currentUser.id;
    const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete to Trash
    await prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'POST_MOVED_TO_TRASH',
        entityType: 'Post',
        entityId: id,
        metadata: JSON.stringify({ snippet: post.content.slice(0, 50) }),
      },
    });

    return NextResponse.json({ success: true, message: 'Post moved to trash' });
  } catch (error: any) {
    console.error('[Post DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
