import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { BugCategory, BugSeverity, BugStatus, Role } from '@prisma/client';

export const runtime = 'nodejs';

/**
 * GET /api/bug-reports
 * List bug reports with filtering, search, and role-based scoping.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status') as BugStatus | null;
    const category = searchParams.get('category') as BugCategory | null;
    const severity = searchParams.get('severity') as BugSeverity | null;
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const isStaff =
      currentUser?.role === Role.SUPER_ADMIN ||
      currentUser?.role === Role.WEB_MANAGER ||
      currentUser?.role === Role.HOD;

    // Filter conditions
    const where: any = { deletedAt: null };

    if (!isStaff) {
      // Non-staff can only see their own submitted bug reports
      if (!currentUser?.id) {
        return NextResponse.json({ error: 'Unauthorized. Sign in to view your bug reports.' }, { status: 401 });
      }
      where.reporterId = currentUser.id;
    }

    if (status) where.status = status;
    if (category) where.category = category;
    if (severity) where.severity = severity;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { reporterEmail: { contains: search, mode: 'insensitive' } },
        { route: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, reports] = await Promise.all([
      prisma.bugReport.count({ where }),
      prisma.bugReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          reporter: { select: { id: true, name: true, email: true, role: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Bug Reports GET Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bug reports.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bug-reports
 * Submit a new bug report with automated diagnostic capture.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = currentUser?.id || `ip-${clientIp}`;

    const rl = checkRateLimit(`bug-report-${rateLimitKey}`, { limit: 10, windowMs: 60000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many bug report submissions. Please wait before submitting another report.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      category = 'OTHER',
      severity = 'MEDIUM',
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      route,
      deviceInfo,
      screenshotUrl,
    } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length < 5) {
      return NextResponse.json(
        { error: 'A clear bug title of at least 5 characters is required.' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'A detailed description of at least 10 characters is required.' },
        { status: 400 }
      );
    }

    // Sanitize Category & Severity
    const validCategory = Object.values(BugCategory).includes(category) ? category : BugCategory.OTHER;
    const validSeverity = Object.values(BugSeverity).includes(severity) ? severity : BugSeverity.MEDIUM;

    // Collect Safe Diagnostics
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const safeDiagnostics = JSON.stringify({
      capturedRoute: route || 'unknown',
      userAgent,
      clientIpMasked: clientIp.split(',')[0].replace(/\d+$/, 'xxx'),
      submittedAt: new Date().toISOString(),
      customDeviceInfo: deviceInfo || null,
    });

    const initialAuditTrail = JSON.stringify([
      {
        event: 'CREATED',
        timestamp: new Date().toISOString(),
        actor: currentUser?.email || 'Anonymous Scholar',
        details: 'Initial bug report logged.',
      },
    ]);

    const report = await prisma.bugReport.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: validCategory,
        severity: validSeverity,
        status: BugStatus.NEW,
        stepsToReproduce: stepsToReproduce?.trim() || null,
        expectedBehavior: expectedBehavior?.trim() || null,
        actualBehavior: actualBehavior?.trim() || null,
        route: route?.trim() || null,
        deviceInfo: safeDiagnostics,
        screenshotUrl: screenshotUrl?.trim() || null,
        reporterId: currentUser?.id || null,
        reporterEmail: currentUser?.email || 'anonymous@srecnandyal.edu.in',
        reporterRole: currentUser?.role || 'GUEST',
        auditTrail: initialAuditTrail,
      },
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: 'BUG_REPORT_SUBMITTED',
          entityType: 'BUG_REPORT',
          entityId: report.id,
          actorId: currentUser?.id || 'ANONYMOUS',
          actorEmail: currentUser?.email || 'anonymous@srecnandyal.edu.in',
          actorRole: currentUser?.role || 'GUEST',
          metadata: JSON.stringify({
            title: report.title,
            category: report.category,
            severity: report.severity,
          }),
        },
      });
    } catch (auditErr) {
      console.warn('[Bug Report API] Audit log recording failed (non-blocking):', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Bug report received successfully. Our engineering team has been notified.',
      reportId: report.id,
      report,
    });
  } catch (error: any) {
    console.error('[Bug Report POST Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit bug report.' },
      { status: 500 }
    );
  }
}
