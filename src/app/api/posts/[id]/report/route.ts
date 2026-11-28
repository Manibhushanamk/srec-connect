import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PostReportSchema, parseJsonBody } from '@/lib/schemas';

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

    const parsed = await parseJsonBody(req, PostReportSchema);
    if (!parsed.success) return parsed.response;
    const reason = parsed.data.reason || 'Inappropriate content';

    const report = await prisma.contentReport.create({
      data: {
        postId,
        reporterId: user.id,
        reason,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, reportId: report.id }, { status: 201 });
  } catch (error: any) {
    console.error('[Post Report API] Error:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
