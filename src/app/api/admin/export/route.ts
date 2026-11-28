import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessAdmin } from '@/lib/rbac';
import {
  canExportCategory,
  IQAC_EXPORT_NOTICE,
  JNTUA_5A_NOTICE,
  resolveScopedDepartmentId,
} from '@/lib/admin-auth';
import { AdminExportQuerySchema, parseQueryParams } from '@/lib/schemas';
import { buildDateRangePrismaFilter, resolveTimelineDateRange } from '@/lib/timeline';
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
    const session = await getServerSession(authOptions).catch(() => null);
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
    const parsedQuery = parseQueryParams(searchParams, AdminExportQuerySchema);
    if (!parsedQuery.success) return parsedQuery.response;

    const {
      category,
      format,
      preview,
      departmentId: requestedDepartmentId,
      academicYear,
      batch,
      status: statusParam,
      timeline,
      dateFrom,
      dateTo,
      achievementCategoryId,
      level,
      search,
    } = parsedQuery.data;

    const isPreview = preview === 'true';

    if (!canExportCategory(user.role, category)) {
      return NextResponse.json(
        { error: `Forbidden: Role ${user.role} is not authorized to export ${category}.` },
        { status: 403 }
      );
    }

    const departmentId = resolveScopedDepartmentId(
      user.role,
      user.departmentId,
      requestedDepartmentId
    );

    let departmentInfo: { id: string; name: string; code: string } | null = null;
    if (departmentId) {
      departmentInfo = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true, name: true, code: true },
      });
    }

    const deptName = departmentInfo ? `${departmentInfo.name} (${departmentInfo.code})` : 'All 11 Departments';
    const acYearLabel = academicYear && academicYear !== 'ALL' ? academicYear : 'All Academic Years';
    const resolvedTimeline = resolveTimelineDateRange(timeline, dateFrom, dateTo);
    const dateFilter = buildDateRangePrismaFilter(timeline, dateFrom, dateTo);

    const wantAchievements = category === 'ACHIEVEMENTS' || category === 'COMPLETE_INSTITUTIONAL_DUMP';
    const wantStudents = category === 'STUDENTS' || category === 'COMPLETE_INSTITUTIONAL_DUMP';
    const wantFaculty = category === 'FACULTY' || category === 'COMPLETE_INSTITUTIONAL_DUMP';
    const wantEvents = category === 'EVENTS' || category === 'COMPLETE_INSTITUTIONAL_DUMP';
    const wantIncidents = category === 'INCIDENTS' || category === 'COMPLETE_INSTITUTIONAL_DUMP';

    const achWhere: any = { deletedAt: null };
    if (departmentId) achWhere.departmentId = departmentId;
    if (academicYear && academicYear !== 'ALL') achWhere.academicYear = academicYear;
    if (statusParam && statusParam !== 'ALL') {
      if (statusParam === 'SUBMITTED') {
        achWhere.status = { in: ['DRAFT', 'PENDING'] };
      } else if (statusParam === 'VERIFIED') {
        achWhere.status = { in: ['APPROVED', 'PUBLISHED'] };
      } else {
        achWhere.status = statusParam;
      }
    }
    if (dateFilter) achWhere.achievementDate = dateFilter;
    if (achievementCategoryId && achievementCategoryId !== 'ALL') {
      const looksLikeName = achievementCategoryId.includes(' ') || achievementCategoryId.length < 20;
      achWhere.category = looksLikeName
        ? { name: { equals: achievementCategoryId, mode: 'insensitive' } }
        : { id: achievementCategoryId };
    }
    if (level && level !== 'ALL') {
      achWhere.level = level;
    }
    if (search) {
      achWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { personName: { contains: search, mode: 'insensitive' } },
        { primaryStudentRoll: { contains: search, mode: 'insensitive' } },
        { organizationEventName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const stuWhere: any = { deletedAt: null };
    if (departmentId) stuWhere.departmentId = departmentId;
    if (batch && batch !== 'ALL') stuWhere.batch = batch;
    if (statusParam === 'ACTIVE') stuWhere.isActive = true;
    if (statusParam === 'INACTIVE') stuWhere.isActive = false;

    const facWhere: any = { deletedAt: null };
    if (departmentId) facWhere.departmentId = departmentId;
    if (statusParam === 'ACTIVE') facWhere.isActive = true;
    if (statusParam === 'INACTIVE') facWhere.isActive = false;

    const evtWhere: any = { deletedAt: null };
    if (departmentId) evtWhere.departmentId = departmentId;
    if (academicYear && academicYear !== 'ALL') evtWhere.academicYear = academicYear;
    if (statusParam && statusParam !== 'ALL') evtWhere.status = statusParam;
    if (dateFilter) evtWhere.startDate = dateFilter;
    if (achievementCategoryId && achievementCategoryId !== 'ALL') {
      const looksLikeName = achievementCategoryId.includes(' ') || achievementCategoryId.length < 20;
      evtWhere.category = looksLikeName
        ? { name: { equals: achievementCategoryId, mode: 'insensitive' } }
        : { id: achievementCategoryId };
    }
    if (search) {
      evtWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
        { organizer: { contains: search, mode: 'insensitive' } },
        { speaker: { contains: search, mode: 'insensitive' } },
        { speakerResourcePerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    const incWhere: any = { deletedAt: null };
    if (departmentId) {
      incWhere.OR = [
        { student: { departmentId } },
        { reporter: { departmentId } },
      ];
    }
    if (statusParam && statusParam !== 'ALL') incWhere.status = statusParam;
    if (dateFilter) incWhere.createdAt = dateFilter;

    const [achievements, students, faculty, events, incidents] = await Promise.all([
      wantAchievements
        ? prisma.achievement.findMany({
            where: achWhere,
            include: { category: true, department: true, teamMembers: true, primaryStudent: true },
            orderBy: { achievementDate: 'desc' },
          })
        : Promise.resolve([]),
      wantStudents
        ? prisma.student.findMany({
            where: stuWhere,
            include: { department: true, user: true },
            orderBy: [{ batch: 'desc' }, { rollNumber: 'asc' }],
          })
        : Promise.resolve([]),
      wantFaculty
        ? prisma.faculty.findMany({
            where: facWhere,
            include: { department: true, user: true },
            orderBy: [{ designation: 'asc' }, { name: 'asc' }],
          })
        : Promise.resolve([]),
      wantEvents
        ? prisma.event.findMany({
            where: evtWhere,
            include: { category: true, department: true, _count: { select: { registrations: true } } },
            orderBy: { startDate: 'desc' },
          })
        : Promise.resolve([]),
      wantIncidents
        ? prisma.incident.findMany({
            where: incWhere,
            include: { student: true, reporter: true, actions: { take: 1, orderBy: { createdAt: 'desc' } } },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

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

    if (isPreview) {
      return NextResponse.json({
        success: true,
        category,
        totalCount: targetRows.length,
        actorRole: user.role,
        scopedDepartmentId: departmentId,
        scopedDepartment: departmentInfo,
        departmentName: deptName,
        academicYear: acYearLabel,
        timelinePreset: resolvedTimeline.preset,
        timelineLabel: resolvedTimeline.label,
        iqacNotice: IQAC_EXPORT_NOTICE,
        jntua5aNotice: JNTUA_5A_NOTICE,
        headers: targetRows.length > 0 ? Object.keys(targetRows[0]) : [],
        sample: targetRows.slice(0, 5),
      });
    }

    await prisma.auditLog
      .create({
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
            timeline: resolvedTimeline.label,
            recordCount: targetRows.length,
            timestamp: new Date().toISOString(),
          }),
        },
      })
      .catch(() => null);

    const timestampStr = new Date().toISOString().split('T')[0];
    const deptTag = departmentInfo?.code || 'COLLEGE';
    const baseFilename = `SREC_${deptTag}_${category}_${timestampStr}`;

    if (format === 'xlsx') {
      const excelBuffer = generateExcelBuffer(
        {
          departmentCode: departmentInfo?.code,
          departmentName: deptName,
          academicYear: acYearLabel,
          timelineLabel: resolvedTimeline.label,
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
        title: `${category.replace(/_/g, ' ')} Compliance Dossier (${resolvedTimeline.label})`,
        subtitle: `Official Academic & Institutional Record Audit`,
        category: category.replace(/_/g, ' '),
        departmentName: deptName,
        academicYear: `${acYearLabel} • ${resolvedTimeline.label}`,
        rows: targetRows,
      });

      return new NextResponse(htmlString, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="${baseFilename}.html"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    const jsonOutput = {
      institutionalManifest: {
        institution: 'Santhiram Engineering College (Autonomous), Nandyal',
        affiliation: 'Permanently Affiliated to JNTUA, Ananthapuramu',
        accreditation: 'NAAC "A+" Grade Accredited | NBA Tier-1 Compliant',
        department: deptName,
        academicYear: acYearLabel,
        timeline: resolvedTimeline.label,
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
