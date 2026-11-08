import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PersonType, SubmissionStatus } from '@prisma/client';
import { parseRollNumber } from '@/lib/studentHelper';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email.toLowerCase().trim() },
    include: { student: true, faculty: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await req.json();
  const {
    title,
    description,
    categoryId,
    level,
    positionRank,
    organizationEventName,
    academicYear,
    achievementDate,
    googleDriveUrl,
    teamMembers,
  } = body;

  if (!title || !categoryId || !organizationEventName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Security: Protocol and host validation on googleDriveUrl
  if (googleDriveUrl) {
    const trimmedUrl = String(googleDriveUrl).trim();
    const isValidGoogleUrl = /^https:\/\/(drive|docs)\.google\.com\//.test(trimmedUrl);
    if (!isValidGoogleUrl) {
      return NextResponse.json(
        { error: 'Invalid certificate URL. Only verified Google Drive/Docs links (https://drive.google.com/...) are accepted.' },
        { status: 400 }
      );
    }
  }

  const isFaculty = dbUser.role === 'FACULTY';
  const personType = isFaculty ? PersonType.FACULTY : PersonType.STUDENT;

  const achievement = await prisma.achievement.create({
    data: {
      title,
      description,
      personName: dbUser.name || 'Student',
      personType,
      participationType: teamMembers && teamMembers.length > 0 ? 'TEAM' : 'SOLO',
      level: level || 'COLLEGE',
      positionRank,
      organizationEventName,
      academicYear: academicYear || '2024-2025',
      achievementDate: new Date(achievementDate || Date.now()),
      departmentId: dbUser.departmentId,
      categoryId,
      primaryStudentId: dbUser.studentId,
      primaryStudentRoll: dbUser.student?.rollNumber,
      facultyId: dbUser.facultyId,
      googleDriveUrl,
      status: SubmissionStatus.PENDING,
      createdById: dbUser.id,
    },
  });

  // Insert team members if any
  if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
    for (const member of teamMembers) {
      if (member.rollNumber?.trim()) {
        const parsed = parseRollNumber(member.rollNumber);
        await prisma.achievementTeamMember.create({
          data: {
            achievementId: achievement.id,
            rollNumber: parsed.normalized,
            studentName: member.studentName || parsed.normalized,
            isLeader: false,
          },
        });
      }
    }
  }

  return NextResponse.json({ success: true, achievement });
}
