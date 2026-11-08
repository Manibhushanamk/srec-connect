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

  // URL safety validator (must be https:// or empty)
  const sanitizeHttpsUrl = (url: any): string | undefined => {
    if (!url) return undefined;
    const s = String(url).trim();
    if (!s) return undefined;
    return s.startsWith('https://') ? s : undefined;
  };

  // Update user core profile
  const userDataToUpdate: any = {};
  if (typeof body.name === 'string' && body.name.trim()) {
    userDataToUpdate.name = body.name.trim().substring(0, 100);
  }
  if (typeof body.headline === 'string') {
    userDataToUpdate.headline = body.headline.trim().substring(0, 200);
  }
  if (typeof body.bio === 'string') {
    userDataToUpdate.bio = body.bio.trim().substring(0, 1000);
  }
  if (typeof body.phone === 'string') {
    userDataToUpdate.phone = body.phone.trim().substring(0, 20);
  }
  if (body.linkedinUrl !== undefined) {
    userDataToUpdate.linkedinUrl = sanitizeHttpsUrl(body.linkedinUrl);
  }
  if (body.githubUrl !== undefined) {
    userDataToUpdate.githubUrl = sanitizeHttpsUrl(body.githubUrl);
  }
  if (body.avatarUrl !== undefined) {
    userDataToUpdate.avatarUrl = sanitizeHttpsUrl(body.avatarUrl);
  }

  if (Object.keys(userDataToUpdate).length > 0) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: userDataToUpdate,
    });
  }

  // Update student profile (strictly immutable fields: rollNumber, departmentId, batch)
  if (dbUser.studentId) {
    await prisma.student.update({
      where: { id: dbUser.studentId },
      data: {
        headline: typeof body.headline === 'string' ? body.headline.substring(0, 200) : undefined,
        bio: typeof body.bio === 'string' ? body.bio.substring(0, 1000) : undefined,
        phone: typeof body.phone === 'string' ? body.phone.substring(0, 20) : undefined,
        githubUrl: sanitizeHttpsUrl(body.githubUrl),
        linkedinUrl: sanitizeHttpsUrl(body.linkedinUrl),
        portfolioUrl: sanitizeHttpsUrl(body.portfolioUrl),
        avatarUrl: sanitizeHttpsUrl(body.avatarUrl),
      },
    });
  }

  // Update faculty profile (strictly immutable fields: designation, departmentId)
  if (dbUser.facultyId) {
    await prisma.faculty.update({
      where: { id: dbUser.facultyId },
      data: {
        bio: typeof body.bio === 'string' ? body.bio.substring(0, 1000) : undefined,
        cabin: typeof body.cabin === 'string' ? body.cabin.substring(0, 50) : undefined,
        specialization: typeof body.specialization === 'string' ? body.specialization.substring(0, 200) : undefined,
        googleScholar: sanitizeHttpsUrl(body.googleScholar),
        avatarUrl: sanitizeHttpsUrl(body.avatarUrl),
      },
    });
  }

  return NextResponse.json({ success: true, message: 'Profile updated successfully' });
}
