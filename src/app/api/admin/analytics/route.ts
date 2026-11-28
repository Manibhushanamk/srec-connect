import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessAdmin } from '@/lib/rbac';
import { resolveScopedDepartmentId } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!currentUser || (!canAccessAdmin(currentUser) && currentUser.role !== 'FACULTY')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scopedDepartmentId = resolveScopedDepartmentId(
      currentUser.role,
      currentUser.departmentId
    );
    const deptFilter = scopedDepartmentId ? { departmentId: scopedDepartmentId } : {};
    const deptUserFilter = scopedDepartmentId
      ? { deletedAt: null, status: 'ACTIVE' as const, departmentId: scopedDepartmentId }
      : { deletedAt: null, status: 'ACTIVE' as const };
    const isIsolatedFromGrievances = currentUser.role === 'WEB_MANAGER' || currentUser.role === 'FACULTY';

    // Run parallel aggregation queries scoped to department for non-super-admins
    const [
      studentCount,
      facultyCount,
      totalAchievements,
      publishedAchievements,
      pendingAchievements,
      totalEvents,
      totalRegistrations,
      totalAttendances,
      totalPosts,
      totalIncidents,
      departmentStats,
    ] = await Promise.all([
      prisma.student.count({ where: { isActive: true, deletedAt: null, ...deptFilter } }),
      prisma.faculty.count({ where: { isActive: true, deletedAt: null, ...deptFilter } }),
      prisma.achievement.count({ where: { deletedAt: null, ...deptFilter } }),
      prisma.achievement.count({ where: { status: 'PUBLISHED', deletedAt: null, ...deptFilter } }),
      prisma.achievement.count({
        where: {
          status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] },
          deletedAt: null,
          ...deptFilter,
        },
      }),
      prisma.event.count({ where: { deletedAt: null, ...deptFilter } }),
      prisma.eventRegistration.count({ where: { status: 'REGISTERED', user: deptUserFilter } }),
      prisma.eventAttendance.count({ where: { user: deptUserFilter } }),
      prisma.post.count({ where: { deletedAt: null, author: deptUserFilter } }),
      isIsolatedFromGrievances
        ? Promise.resolve(0)
        : prisma.incident.count({
            where: scopedDepartmentId
              ? {
                  deletedAt: null,
                  OR: [
                    { student: { departmentId: scopedDepartmentId } },
                    { reporter: { departmentId: scopedDepartmentId } },
                  ],
                }
              : { deletedAt: null },
          }),
      prisma.department.findMany({
        where: scopedDepartmentId ? { isActive: true, id: scopedDepartmentId } : { isActive: true },
        select: {
          id: true,
          code: true,
          shortName: true,
          name: true,
          _count: {
            select: {
              students: { where: { isActive: true, deletedAt: null } },
              faculty: { where: { isActive: true, deletedAt: null } },
              achievements: { where: { deletedAt: null } },
              events: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    // Simulated 6-month growth trend data for Recharts
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const trendData = months.map((m, idx) => ({
      month: m,
      achievements: Math.max(2, Math.round((publishedAchievements / 6) * (idx + 1) * 0.8)),
      eventAttendees: Math.max(5, Math.round((totalRegistrations / 6) * (idx + 1) * 0.9)),
      posts: Math.max(4, Math.round((totalPosts / 6) * (idx + 1))),
    }));

    // Category distribution of achievements
    const categoryGroup = await prisma.achievement.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      where: { deletedAt: null, ...deptFilter },
    });

    const categoryNames = await prisma.category.findMany({
      where: { id: { in: categoryGroup.map((c) => c.categoryId) } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categoryNames.map((c) => [c.id, c.name]));
    const categoryDistribution = categoryGroup.map((cg) => ({
      name: categoryMap.get(cg.categoryId) || 'General Academic',
      count: cg._count.id,
    }));

    return NextResponse.json({
      isScoped: Boolean(scopedDepartmentId),
      scopedDepartmentId,
      summary: {
        studentCount,
        facultyCount,
        totalAchievements,
        publishedAchievements,
        pendingAchievements,
        totalEvents,
        totalRegistrations,
        totalAttendances,
        overallAttendanceRate:
          totalRegistrations > 0 ? Math.round((totalAttendances / totalRegistrations) * 100) : 0,
        totalPosts,
        totalIncidents,
      },
      trendData,
      departmentStats: departmentStats.map((d) => ({
        code: d.code,
        name: d.shortName || d.name,
        students: d._count.students,
        faculty: d._count.faculty,
        achievements: d._count.achievements,
        events: d._count.events,
      })),
      categoryDistribution,
    });
  } catch (error: any) {
    console.error('[Analytics API GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
