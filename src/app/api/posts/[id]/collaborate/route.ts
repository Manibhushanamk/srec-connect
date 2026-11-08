import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;
    const body = await req.json();
    const action = body.action; // 'ACCEPT' | 'DECLINE'

    if (!['ACCEPT', 'DECLINE'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const currentUserId = (session.user as any).id;

    // Check collaborator invite
    const collab = await prisma.postCollaborator.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: currentUserId,
        },
      },
      include: {
        post: {
          select: {
            id: true,
            content: true,
            authorId: true,
            author: { select: { name: true } },
          },
        },
      },
    });

    if (!collab) {
      return NextResponse.json({ error: 'Collaboration invite not found' }, { status: 404 });
    }

    if (action === 'ACCEPT') {
      await prisma.postCollaborator.update({
        where: { id: collab.id },
        data: { status: 'ACCEPTED' },
      });

      // Notify post author that collaborator accepted
      await prisma.notification.create({
        data: {
          userId: collab.post.authorId,
          title: '🤝 Collaboration Accepted',
          message: `${session.user.name || 'A scholar'} accepted your collaboration invite.`,
          link: `/?post=${postId}`,
        },
      });

      return NextResponse.json({ success: true, status: 'ACCEPTED' });
    } else {
      await prisma.postCollaborator.update({
        where: { id: collab.id },
        data: { status: 'DECLINED' },
      });

      return NextResponse.json({ success: true, status: 'DECLINED' });
    }
  } catch (error: any) {
    console.error('[Collab API Error]:', error);
    return NextResponse.json({ error: 'Failed to process collaboration request' }, { status: 500 });
  }
}
