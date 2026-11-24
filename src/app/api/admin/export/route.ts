import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessAdmin, isSuperAdmin } from '@/lib/rbac';
import {
  generateExcelBuffer,
  generateCsvWithBom,
  generatePrintableHtml,
  formatAchievementRows,
  formatStudentRows,
  formatFacultyRows,
  formatEventRows,
  formatIncidentRows,
} from '@/lib/exportHelper';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { faculty: true },
    });

    if (!user || (!canAccessAdmin(user) && user.role !== 'FACULTY')) {
      return NextResponse.json(
        { error: 'Forbidden: Institutional Admin or Faculty privileges required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = (searchParams.get('category')?.toUpperCase() || 'ACHIEVEMENTS') as string;
    const format = (searchParams.get('format')?.toLowerCase() || 'xlsx') as 'xlsx' | 'csv' | 'html' | 'json';
    const isPreview = searchParams.get('preview') === 'true';

    let departmentId = searchParams.get('departmentId');
    const academicYear = searchParams.get('academicYear');
    const batch = searchParams.get('batch');
    const statusParam = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Scoping: HOD and Web Manager can only export their own department
    if (!isSuperAdmin(user.role)) {
      departmentId = user.departmentId || 'unassigned_dept';
    } else if (departmentId === 'ALL') {
      departmentId = null;
    }

    let departmentInfo: { id: string; name: string; code: string } | null = null;
    if (departmentId) {
      departmentInfo = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true, name: true, code: true },
      });
    }

    const deptName = departmentInfo ? `${departmentInfo.name} (${departmentInfo.code})` : 'All 11 Departments';
    const acYearLabel = academicYear && academicYear !== 'ALL' ? academicYear : 'All Academic Years';

    // 1. Query Data
    let achievements: any[] = [];
    let students: any[] = [];
    let faculty: any[] = [];
    let events: any[] = [];
    let incidents: any[] = [];

    // Helper date filter
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(`${dateTo}T23:59:59.999Z`);

    if (category === 'ACHIEVEMENTS' || category === 'COMPLETE_INSTITUTIONAL_DUMP') {
      const achWhere: any = { deletedAt: null };
      if (departmentId) achWhere.departmentId = departmentId;
      if (academicYear && academicYear !== 'ALL') achWhere.academicYear = academicYear;
      if (statusParam && statusParam !== 'ALL') {
        achWhere.status = statusParam;
      }
      if (Object.keys(dateFilter).length > 0) {
        achWhere.achievementDate = dateFilter;
      }

      achievements = await prisma.achievement.findMany({
        where: achWhere,
        include: {
          category: true,
          department: true,
          teamMembers: true,
          primaryStudent: true,
        },
        orderBy: { achievementDate: 'desc' },
      });
    }

    if (category === 'STUDENTS' || category === 'COMPLETE_INSTITUTIONAL_DUMP') {
      const stuWhere: any = { deletedAt: null };
      if (departmentId) stuWhere.departmentId = departmentId;
      if (batch && batch !== 'ALL') stuWhere.batch = batch;
      if (statusParam === 'ACTIVE') stuWhere.isActive = true;
      if (statusParam === 'INACTIVE') stuWhere.isActive = false;

      students = await prisma.student.findMany({
        where: stuWhere,
        include: {
          department: true,
          user: true,
        },
        orderBy: [{ batch: 'desc' }, { rollNumber: 'asc' }],
      });
    }

    if (category === 'FACULTY' || category === 'COMPLETE_INSTITUTIONAL_DUMP') {
      const facWhere: any = { deletedAt: null };
      if (departmentId) facWhere.departmentId = departmentId;
      if (statusParam === 'ACTIVE') facWhere.isActive = true;
      if (statusParam === 'INACTIVE') facWhere.isActive = false;

      faculty = await prisma.faculty.findMany({
        where: facWhere,
        include: {
          department: true,
          user: true,
        },
        orderBy: [{ designation: 'asc' }, { name: 'asc' }],
      });
    }

    if (category === 'EVENTS' || category === 'COMPLETE_INSTITUTIONAL_DUMP') {
      const evtWhere: any = { deletedAt: null };
      if (departmentId) evtWhere.departmentId = departmentId;
      if (academicYear && academicYear !== 'ALL') evtWhere.academicYear = academicYear;
      if (statusParam && statusParam !== 'ALL') evtWhere.status = statusParam;
      if (Object.keys(dateFilter).length > 0) evtWhere.startDate = dateFilter;

      events = await prisma.event.findMany({
        where: evtWhere,
        include: {
          category: true,
          department: true,
          _count: { select: { registrations: true } },
        },
        orderBy: { startDate: 'desc' },
      });
    }

    if (category === 'INCIDENTS' || category === 'COMPLETE_INSTITUTIONAL_DUMP') {
      const incWhere: any = { deletedAt: null };
      if (statusParam && statusParam !== 'ALL') incWhere.status = statusParam;

      incidents = await prisma.incident.findMany({
        where: incWhere,
        include: {
          student: true,
          reporter: true,
          actions: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 2. Format Rows for Target Category
    let targetRows: Record<string, any>[] = [];
    if (category === 'ACHIEVEMENTS') {
      targetRows = formatAchievementRows(achievements);
    } else if (category === 'STUDENTS') {
      targetRows = formatStudentRows(students);
    } else if (category === 'FACULTY') {
      targetRows = formatFacultyRows(faculty);
    } else if (category === 'EVENTS') {
      targetRows = formatEventRows(events);
    } else if (category === 'INCIDENTS') {
      targetRows = formatIncidentRows(incidents);
    } else {
      targetRows = formatAchievementRows(achievements);
    }

    // 3. If preview mode, return JSON sample
    if (isPreview) {
      return NextResponse.json({
        success: true,
        category,
        totalCount: targetRows.length,
        departmentName: deptName,
        academicYear: acYearLabel,
        headers: targetRows.length > 0 ? Object.keys(targetRows[0]) : [],
        sample: targetRows.slice(0, 5),
      });
    }

    // Audit Log entry
    try {
      await prisma.auditLog.create({
        data: {
          action: 'INSTITUTIONAL_DATA_EXPORTED',
          entityType: category,
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          metadata: JSON.stringify({
            category,
            format,
            department: deptName,
            academicYear: acYearLabel,
            recordCount: targetRows.length,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (auditErr) {
      console.warn('[Export Audit Log Warning]:', auditErr);
    }

    const timestampStr = new Date().toISOString().split('T')[0];
    const deptTag = departmentInfo?.code || 'COLLEGE';
    const baseFilename = `SREC_${deptTag}_${category}_${timestampStr}`;

    // 4. Return Requested Format
    if (format === 'xlsx') {
      const excelBuffer = generateExcelBuffer(
        {
          departmentCode: departmentInfo?.code,
          departmentName: deptName,
          academicYear: acYearLabel,
          generatedBy: `${user.name} (${user.role})`,
          achievements,
          students,
          faculty,
          events,
          incidents,
        },
        category
      );

      return new NextResponse(new Uint8Array(excelBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${baseFilename}.xlsx"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'csv') {
      const csvString = generateCsvWithBom(targetRows);
      return new NextResponse(csvString, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${baseFilename}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'html') {
      const htmlString = generatePrintableHtml({
        title: `${category.replace(/_/g, ' ')} Compliance Dossier`,
        subtitle: `Official Academic & Institutional Record Audit`,
        category: category.replace(/_/g, ' '),
        departmentName: deptName,
        academicYear: acYearLabel,
        rows: targetRows,
      });

      return new NextResponse(htmlString, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }

    // Default JSON with manifest
    const jsonOutput = {
      institutionalManifest: {
        institution: 'Santhiram Engineering College (Autonomous), Nandyal',
        affiliation: 'Permanently Affiliated to JNTUA, Ananthapuramu',
        accreditation: 'NAAC "A+" Grade Accredited | NBA Tier-1 Compliant',
        department: deptName,
        academicYear: acYearLabel,
        category,
        totalRecords: targetRows.length,
        extractedAt: new Date().toISOString(),
        extractedBy: `${user.name} (${user.email})`,
      },
      records: targetRows,
    };

    return new NextResponse(JSON.stringify(jsonOutput, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${baseFilename}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('[Admin Export Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while compiling export' },
      { status: 500 }
    );
  }
}
