import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sanitizeIncidentForViewer } from '@/lib/incident-auth';
import { IncidentCategory, IncidentPriority, IncidentStatus } from '@prisma/client';
import { sanitizeText } from '@/lib/sanitize';
import { IncidentCategorySchema, IncidentCreateSchema, parseJsonBody } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { student: true, faculty: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const categoryParam = searchParams.get('category');
    const priorityParam = searchParams.get('priority');
    const typeParam = searchParams.get('type');
    const sectionParam = searchParams.get('section');
    const batchParam = searchParams.get('batch');

    const where: any = { deletedAt: null };

    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam as IncidentStatus;
    }
    if (categoryParam && categoryParam !== 'ALL') {
      where.category = categoryParam as IncidentCategory;
    }
    if (priorityParam && priorityParam !== 'ALL') {
      where.priority = priorityParam as IncidentPriority;
    }
    if (sectionParam && sectionParam !== 'ALL') {
      where.student = { ...(where.student || {}), section: sectionParam };
    }
    if (batchParam && batchParam !== 'ALL') {
      where.student = { ...(where.student || {}), batch: batchParam };
    }
    if (typeParam === 'STUDENT_GRIEVANCE') {
      where.reporter = { role: 'STUDENT' };
    } else if (typeParam === 'FACULTY_DISCIPLINE') {
      where.reporter = { role: { not: 'STUDENT' } };
    }

    // Fail-closed role & department visibility isolation
    if (currentUser.role === 'STUDENT') {
      const studentId = currentUser.student?.id;
      where.OR = [
        { reporterId: currentUser.id },
        ...(studentId ? [{ studentId }] : []),
      ];
    } else if (currentUser.role === 'FACULTY') {
      if (!currentUser.departmentId) {
        return NextResponse.json({ error: 'Forbidden: Faculty department binding required' }, { status: 403 });
      }
      where.OR = [
        { reporterId: currentUser.id },
        { isConfidentialHOD: false, departmentId: currentUser.departmentId },
      ];
    } else if (currentUser.role === 'HOD') {
      if (!currentUser.departmentId) {
        return NextResponse.json({ error: 'Forbidden: HOD department binding required' }, { status: 403 });
      }
      where.departmentId = currentUser.departmentId;
    } else if (currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Role isolated from grievance records' }, { status: 403 });
    }

    const rawIncidents = await prisma.incident.findMany({
      where,
      include: {
        reporter: {
          select: { id: true, name: true, role: true, email: true },
        },
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            departmentName: true,
            batch: true,
            section: true,
          },
        },
        _count: {
          select: {
            responses: true,
            actions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (currentUser.role === 'SUPER_ADMIN') {
      const confidentialIds = rawIncidents.filter((i) => i.isConfidentialHOD).map((i) => i.id);
      if (confidentialIds.length > 0) {
        await prisma.auditLog.create({
          data: {
            actorId: currentUser.id,
            actorEmail: currentUser.email,
            actorRole: currentUser.role,
            action: 'CONFIDENTIAL_INCIDENT_READ',
            entityType: 'Incident',
            entityId: confidentialIds[0],
            metadata: JSON.stringify({ count: confidentialIds.length, incidentIds: confidentialIds }),
          },
        });
      }
    }

    const incidents = rawIncidents.map((inc) => sanitizeIncidentForViewer(currentUser, inc));

    return NextResponse.json({ incidents });
  } catch (error: any) {
    console.error('[Incidents API GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { student: true, faculty: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseJsonBody(req, IncidentCreateSchema);
    if (!parsed.success) return parsed.response;
    const {
      title,
      description,
      category: rawCategory,
      customCategory,
      priority,
      studentRollNumber,
      isConfidentialHOD,
      attachmentUrl,
    } = parsed.data;

    const categoryParse = IncidentCategorySchema.safeParse(rawCategory);
    const resolvedCategory = categoryParse.success ? categoryParse.data : 'OTHER';
    const resolvedCustomCategory = customCategory
      ? sanitizeText(customCategory).slice(0, 80)
      : !categoryParse.success && rawCategory
      ? sanitizeText(rawCategory).slice(0, 80)
      : null;

    // Resolve target student if roll number provided
    let targetStudentId: string | null = null;
    let resolvedDepartmentId: string | null = currentUser.departmentId ?? null;
    if (studentRollNumber) {
      const targetStudent = await prisma.student.findUnique({
        where: { rollNumber: studentRollNumber.toUpperCase().trim() },
      });
      if (!targetStudent) {
        return NextResponse.json(
          { error: `Student with roll number ${studentRollNumber} not found` },
          { status: 404 }
        );
      }
      targetStudentId = targetStudent.id;
      resolvedDepartmentId = targetStudent.departmentId ?? resolvedDepartmentId;
    } else if (currentUser.role === 'STUDENT' && currentUser.student?.id) {
      // Auto-bond grievance to the submitting student's profile if not reporting another student
      targetStudentId = currentUser.student.id;
      resolvedDepartmentId = currentUser.student.departmentId ?? resolvedDepartmentId;
    }

    const incident = await prisma.incident.create({
      data: {
        reporterId: currentUser.id,
        studentId: targetStudentId,
        departmentId: resolvedDepartmentId,
        title: sanitizeText(title),
        description: attachmentUrl
          ? `${sanitizeText(description)}\n\n[Attachment: ${attachmentUrl.trim()}]`
          : sanitizeText(description),
        category: resolvedCategory,
        customCategory: resolvedCustomCategory,
        priority,
        isConfidentialHOD: Boolean(isConfidentialHOD) || resolvedCategory === 'FACULTY_GRIEVANCE',
        status: 'REPORTED',
      },
      include: {
        reporter: { select: { id: true, name: true, role: true, email: true } },
        student: { select: { id: true, name: true, rollNumber: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'INCIDENT_REPORTED',
        entityType: 'Incident',
        entityId: incident.id,
        metadata: JSON.stringify({
          category: incident.category,
          priority: incident.priority,
          isConfidentialHOD: incident.isConfidentialHOD,
          studentRollNumber: studentRollNumber || null,
        }),
      },
    });

    return NextResponse.json({ success: true, incident }, { status: 201 });
  } catch (error: any) {
    console.error('[Incidents API POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
