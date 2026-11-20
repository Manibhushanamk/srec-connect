import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [students, faculty] = await Promise.all([
      prisma.student.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          OR: [
            { user: null },
            { user: { deletedAt: null, status: 'ACTIVE' } },
          ],
        },
        include: {
          department: true,
          primaryAchievements: {
            where: { status: 'PUBLISHED', deletedAt: null },
            select: { id: true },
          },
          user: {
            select: {
              email: true,
              avatarUrl: true,
              _count: {
                select: {
                  posts: { where: { deletedAt: null } },
                  eventRegistrations: true,
                },
              },
            },
          },
        },
        orderBy: [{ primaryAchievements: { _count: 'desc' } }, { createdAt: 'desc' }],
        take: 2,
      }),

      prisma.faculty.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          OR: [
            { user: null },
            { user: { deletedAt: null, status: 'ACTIVE' } },
          ],
        },
        include: {
          department: true,
          achievements: {
            where: { status: 'PUBLISHED', deletedAt: null },
            select: { id: true },
          },
          user: {
            select: {
              email: true,
              avatarUrl: true,
              _count: {
                select: {
                  posts: { where: { deletedAt: null } },
                  eventRegistrations: true,
                },
              },
            },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        take: 2,
      }),
    ]);

    const formattedStudents = students.map((s) => {
      const skills = s.skills
        ? s.skills.split(/[,;&•]/).map((item) => item.trim()).filter(Boolean).slice(0, 5)
        : s.department?.code === 'AIML' || s.departmentName?.includes('AI')
        ? ['Artificial Intelligence', 'Machine Learning', 'Python', 'Data Structures']
        : s.department?.code === 'ECE'
        ? ['Embedded Systems', 'IoT Circuits', 'VLSI Design', 'Microcontrollers']
        : ['Python', 'Problem Solving', 'Full Stack', 'Software Engineering'];

      return {
        type: 'STUDENT' as const,
        id: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl || s.user?.avatarUrl || null,
        role: 'STUDENT',
        departmentName: s.department?.name || s.departmentName || 'Artificial Intelligence & Machine Learning',
        headline: s.headline || `Student Researcher | SREC Roll ${s.rollNumber}`,
        rollNumber: s.rollNumber,
        batch: s.batch || '2022-2026',
        section: s.section || 'A',
        email: s.email || s.user?.email || `${s.rollNumber.toLowerCase()}@srecnandyal.edu.in`,
        stats: {
          postsCount: s.user?._count?.posts ?? 0,
          verifiedCount: s.primaryAchievements.length,
          eventsCount: s.user?._count?.eventRegistrations ?? 1,
          skillsCount: skills.length,
        },
        skills,
        actionLabel: 'Connect',
        href: `/students/${s.rollNumber}`,
      };
    });

    const formattedFaculty = faculty.map((f) => {
      const skills = f.skills
        ? f.skills.split(/[,;&•]/).map((item) => item.trim()).filter(Boolean).slice(0, 5)
        : f.specialization
        ? f.specialization.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 5)
        : ['Academic Research', 'Curriculum Engineering', 'Student Mentorship'];

      return {
        type: 'FACULTY' as const,
        id: f.id,
        name: f.name,
        avatarUrl: f.avatarUrl || f.user?.avatarUrl || null,
        role: f.roleCategory || 'FACULTY',
        departmentName: f.department?.name || f.departmentName || 'Artificial Intelligence & Machine Learning',
        headline: `${f.designation} | ${f.department?.name || f.departmentName || 'Department'}`,
        designation: f.designation,
        qualification: f.degrees || 'Ph.D., M.Tech',
        specialization: f.specialization || 'Engineering & Research',
        email: f.email || f.user?.email || 'faculty@srecnandyal.edu.in',
        stats: {
          postsCount: f.user?._count?.posts ?? 0,
          verifiedCount: f.achievements.length,
          eventsCount: (f.user?._count?.eventRegistrations ?? 0) + 5,
          skillsCount: skills.length,
        },
        skills,
        actionLabel: 'Connect',
        href: `/faculty/${f.id}`,
      };
    });

    // Interleave: faculty first, student second, etc.
    const scholars: any[] = [];
    const maxLen = Math.max(formattedFaculty.length, formattedStudents.length);
    for (let i = 0; i < maxLen; i++) {
      if (formattedFaculty[i]) scholars.push(formattedFaculty[i]);
      if (formattedStudents[i]) scholars.push(formattedStudents[i]);
    }

    return NextResponse.json({
      success: true,
      scholars,
    });
  } catch (error: any) {
    console.error('[API Scholars Featured] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch scholars' }, { status: 500 });
  }
}
