import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email.toLowerCase().trim() },
    include: {
      student: true,
      faculty: true,
      department: true,
    },
  });

  return NextResponse.json({ user: dbUser });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email.toLowerCase().trim() },
    include: { student: true, faculty: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Update user avatar
  if (body.avatarUrl) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { avatarUrl: body.avatarUrl },
    });
  }

  // Update student profile (locked fields: rollNumber, departmentId, batch)
  if (dbUser.studentId) {
    await prisma.student.update({
      where: { id: dbUser.studentId },
      data: {
        bio: body.bio !== undefined ? body.bio : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        githubUrl: body.githubUrl !== undefined ? body.githubUrl : undefined,
        linkedinUrl: body.linkedinUrl !== undefined ? body.linkedinUrl : undefined,
        portfolioUrl: body.portfolioUrl !== undefined ? body.portfolioUrl : undefined,
        avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : undefined,
      },
    });
  }

  // Update faculty profile (locked fields: designation, departmentId)
  if (dbUser.facultyId) {
    await prisma.faculty.update({
      where: { id: dbUser.facultyId },
      data: {
        bio: body.bio !== undefined ? body.bio : undefined,
        cabin: body.cabin !== undefined ? body.cabin : undefined,
        specialization: body.specialization !== undefined ? body.specialization : undefined,
        googleScholar: body.googleScholar !== undefined ? body.googleScholar : undefined,
        avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : undefined,
      },
    });
  }

  return NextResponse.json({ success: true, message: 'Profile updated successfully' });
}
