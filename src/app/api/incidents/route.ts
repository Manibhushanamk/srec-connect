import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { IncidentCategory, IncidentPriority, IncidentStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

    // Role-based visibility isolation:
    // Disciplinary complaints given to a student by faculty/HOD are strictly restricted to HOD, Super Admin, and the reporting faculty.
    if (currentUser.role === 'STUDENT') {
      // Student can ONLY view cases where they are the reporter OR the accused subject
      const studentId = currentUser.student?.id;
      where.OR = [
        { reporterId: currentUser.id },
        ...(studentId ? [{ studentId }] : []),
      ];
    } else if (currentUser.role === 'FACULTY') {
      // Regular Faculty can ONLY view complaints they personally reported
      where.reporterId = currentUser.id;
    }
    // HOD and SUPER_ADMIN have full sovereign departmental visibility to all cases across all sections and batches

    const incidents = await prisma.incident.findMany({
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

    return NextResponse.json({ incidents });
  } catch (error: any) {
    console.error('[Incidents API GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let currentUser = null;

    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
        include: { student: true, faculty: true },
      });
    }

    const body = await req.json();
    const {
      title,
      description,
      category = 'CLASSROOM_DISCIPLINE',
      priority = 'MEDIUM',
      studentRollNumber,
      isConfidentialHOD = false,
      reporterEmail,
      attachmentUrl,
    } = body;

    if (!currentUser && reporterEmail) {
      currentUser = await prisma.user.findUnique({
        where: { email: reporterEmail.toLowerCase().trim() },
        include: { student: true, faculty: true },
      });
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Resolve target student if roll number provided
    let targetStudentId: string | null = null;
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
    }

    // Student filing a faculty grievance automatically triggers confidential HOD routing
    const shouldBeConfidential =
      Boolean(isConfidentialHOD) || category === 'FACULTY_GRIEVANCE';

    const incident = await prisma.incident.create({
      data: {
        reporterId: currentUser.id,
        studentId: targetStudentId,
        title: title.trim(),
        description: attachmentUrl
          ? `${description.trim()}\n\n[Attachment: ${attachmentUrl.trim()}]`
          : description.trim(),
        category: category as IncidentCategory,
        priority: priority as IncidentPriority,
        isConfidentialHOD: shouldBeConfidential,
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
