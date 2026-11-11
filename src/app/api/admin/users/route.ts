import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/rbac';
import { Role, UserStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canAccessAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (role && role !== 'ALL') {
      where.role = role as Role;
    }
    if (status && status !== 'ALL') {
      where.status = status as UserStatus;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { student: { rollNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [users, total, departments] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
          student: {
            select: {
              id: true,
              rollNumber: true,
              batch: true,
              section: true,
              headline: true,
              bio: true,
              phone: true,
              avatarUrl: true,
              githubUrl: true,
              linkedinUrl: true,
              portfolioUrl: true,
            },
          },
          faculty: {
            select: {
              id: true,
              name: true,
              designation: true,
              roleCategory: true,
              degrees: true,
              experience: true,
              cabin: true,
              specialization: true,
              bio: true,
              avatarUrl: true,
              googleScholar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
      prisma.department.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { code: 'asc' },
      }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      departments,
    });
  } catch (error: any) {
    console.error('[API Users GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canAccessAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, role, departmentId, rollNumber, designation, batch, section } = body;

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Email, Name, and Role are mandatory' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    // Ensure default department if missing
    let targetDeptId = departmentId;
    let deptName: string | null = null;
    if (targetDeptId) {
      const d = await prisma.department.findUnique({ where: { id: targetDeptId } });
      if (d) deptName = d.name;
    } else {
      const aimlDept = await prisma.department.findFirst({
        where: { OR: [{ code: 'AIML' }, { code: 'CSE(AI&ML)' }] },
      });
      if (aimlDept) {
        targetDeptId = aimlDept.id;
        deptName = aimlDept.name;
      }
    }

    // Roll number uniqueness check for student
    let studentRecord = null;
    if (role === 'STUDENT') {
      const emailRollCandidate = normalizedEmail.includes('@') ? normalizedEmail.split('@')[0].toUpperCase() : '';
      const cleanedRoll = (rollNumber || emailRollCandidate).trim().toUpperCase();

      if (!cleanedRoll) {
        return NextResponse.json({ error: 'Roll number is required for student accounts' }, { status: 400 });
      }

      const existingRoll = await prisma.student.findUnique({
        where: { rollNumber: cleanedRoll },
      });
      if (existingRoll) {
        return NextResponse.json({ error: `Roll number ${cleanedRoll} is already registered` }, { status: 409 });
      }

      studentRecord = await prisma.student.create({
        data: {
          rollNumber: cleanedRoll,
          name,
          email: normalizedEmail,
          departmentId: targetDeptId || null,
          departmentName: deptName,
          batch: batch || '2022-2026',
          section: section || 'A',
        },
      });
    }

    // Faculty record creation
    let facultyRecord = null;
    if (role === 'FACULTY' || role === 'HOD') {
      facultyRecord = await prisma.faculty.create({
        data: {
          name,
          email: normalizedEmail,
          designation: designation || (role === 'HOD' ? 'Professor & Head of Department' : 'Assistant Professor'),
          roleCategory: role === 'HOD' ? 'HOD' : 'ASSISTANT_PROFESSOR',
          departmentId: targetDeptId || null,
          departmentName: deptName,
        },
      });
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        role: role as Role,
        status: 'ACTIVE',
        departmentId: targetDeptId || null,
        departmentName: deptName,
        studentId: studentRecord?.id || null,
        facultyId: facultyRecord?.id || null,
      },
      include: {
        department: true,
        student: true,
        faculty: true,
      },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: any) {
    console.error('[API Users POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canAccessAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      userId,
      name,
      email,
      role,
      status,
      departmentId,
      avatarUrl,
      headline,
      bio,
      phone,
      student,
      faculty,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true, faculty: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userUpdateData: any = {};

    // 1. Department handling
    let deptName = targetUser.departmentName;
    if (departmentId !== undefined) {
      userUpdateData.departmentId = departmentId || null;
      if (departmentId) {
        const dept = await prisma.department.findUnique({ where: { id: departmentId } });
        if (dept) {
          deptName = dept.name;
          userUpdateData.departmentName = dept.name;
        }
      } else {
        deptName = null;
        userUpdateData.departmentName = null;
      }
    }

    // 2. Email handling
    let cleanEmail = targetUser.email;
    if (email && email.toLowerCase().trim() !== targetUser.email) {
      cleanEmail = email.toLowerCase().trim();
      const existingUserWithEmail = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
      }
      userUpdateData.email = cleanEmail;
    }

    // 3. Name handling
    const trimmedName = name !== undefined ? name.trim() : targetUser.name;
    if (name !== undefined) {
      userUpdateData.name = trimmedName;
    }

    if (role !== undefined) userUpdateData.role = role as Role;
    if (status !== undefined) userUpdateData.status = status as UserStatus;
    if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl;
    if (headline !== undefined) userUpdateData.headline = headline;
    if (bio !== undefined) userUpdateData.bio = bio;
    if (phone !== undefined) userUpdateData.phone = phone;

    // 4. Student details handling
    let updatedStudentId = targetUser.studentId;
    if (student || role === 'STUDENT' || targetUser.studentId) {
      const rollNumber = student?.rollNumber ? student.rollNumber.trim().toUpperCase() : targetUser.student?.rollNumber;

      if (targetUser.studentId) {
        if (rollNumber && rollNumber !== targetUser.student?.rollNumber) {
          const existingRoll = await prisma.student.findUnique({ where: { rollNumber } });
          if (existingRoll && existingRoll.id !== targetUser.studentId) {
            return NextResponse.json({ error: `Roll number ${rollNumber} is already in use by another student` }, { status: 409 });
          }
        }

        const studentUpdateData: any = {};
        if (trimmedName) studentUpdateData.name = trimmedName;
        if (cleanEmail) studentUpdateData.email = cleanEmail;
        if (rollNumber) studentUpdateData.rollNumber = rollNumber;
        if (departmentId !== undefined) {
          studentUpdateData.departmentId = departmentId || null;
          studentUpdateData.departmentName = deptName;
        }
        if (student?.batch !== undefined) studentUpdateData.batch = student.batch;
        if (student?.section !== undefined) studentUpdateData.section = student.section;
        if (student?.headline !== undefined) {
          studentUpdateData.headline = student.headline;
        } else if (headline !== undefined) {
          studentUpdateData.headline = headline;
        }
        if (student?.bio !== undefined) {
          studentUpdateData.bio = student.bio;
        } else if (bio !== undefined) {
          studentUpdateData.bio = bio;
        }
        if (student?.phone !== undefined) {
          studentUpdateData.phone = student.phone;
        } else if (phone !== undefined) {
          studentUpdateData.phone = phone;
        }
        if (student?.githubUrl !== undefined) {
          studentUpdateData.githubUrl = student.githubUrl;
          userUpdateData.githubUrl = student.githubUrl;
        }
        if (student?.linkedinUrl !== undefined) {
          studentUpdateData.linkedinUrl = student.linkedinUrl;
          userUpdateData.linkedinUrl = student.linkedinUrl;
        }
        if (student?.portfolioUrl !== undefined) studentUpdateData.portfolioUrl = student.portfolioUrl;
        if (avatarUrl !== undefined) studentUpdateData.avatarUrl = avatarUrl;

        await prisma.student.update({
          where: { id: targetUser.studentId },
          data: studentUpdateData,
        });

        // Cascade rollNumber update to achievements
        if (rollNumber && rollNumber !== targetUser.student?.rollNumber) {
          await prisma.achievement.updateMany({
            where: { primaryStudentRoll: targetUser.student?.rollNumber },
            data: { primaryStudentRoll: rollNumber },
          });
        }
      } else if (role === 'STUDENT' || student?.rollNumber) {
        const fallbackRoll = rollNumber || (cleanEmail.includes('@') ? cleanEmail.split('@')[0].toUpperCase() : '22091A3200');
        const newStudent = await prisma.student.create({
          data: {
            name: trimmedName || cleanEmail,
            email: cleanEmail,
            rollNumber: fallbackRoll,
            departmentId: departmentId || targetUser.departmentId,
            departmentName: deptName,
            batch: student?.batch || '2022-2026',
            section: student?.section || 'A',
            headline: student?.headline || '',
            bio: student?.bio || '',
            phone: student?.phone || '',
            avatarUrl: avatarUrl || targetUser.avatarUrl,
            githubUrl: student?.githubUrl,
            linkedinUrl: student?.linkedinUrl,
            portfolioUrl: student?.portfolioUrl,
          },
        });
        updatedStudentId = newStudent.id;
        userUpdateData.studentId = newStudent.id;
      }
    }

    // 5. Faculty details handling
    let updatedFacultyId = targetUser.facultyId;
    if (faculty || role === 'FACULTY' || role === 'HOD' || targetUser.facultyId) {
      if (targetUser.facultyId) {
        const facultyUpdateData: any = {};
        if (trimmedName) facultyUpdateData.name = trimmedName;
        if (cleanEmail) facultyUpdateData.email = cleanEmail;
        if (departmentId !== undefined) {
          facultyUpdateData.departmentId = departmentId || null;
          facultyUpdateData.departmentName = deptName;
        }
        if (faculty?.designation !== undefined) facultyUpdateData.designation = faculty.designation;
        if (faculty?.roleCategory !== undefined) facultyUpdateData.roleCategory = faculty.roleCategory;
        if (faculty?.degrees !== undefined) facultyUpdateData.degrees = faculty.degrees;
        if (faculty?.experience !== undefined) facultyUpdateData.experience = faculty.experience;
        if (faculty?.cabin !== undefined) facultyUpdateData.cabin = faculty.cabin;
        if (faculty?.specialization !== undefined) facultyUpdateData.specialization = faculty.specialization;
        if (faculty?.bio !== undefined) {
          facultyUpdateData.bio = faculty.bio;
        } else if (bio !== undefined) {
          facultyUpdateData.bio = bio;
        }
        if (faculty?.googleScholar !== undefined) facultyUpdateData.googleScholar = faculty.googleScholar;
        if (avatarUrl !== undefined) facultyUpdateData.avatarUrl = avatarUrl;

        await prisma.faculty.update({
          where: { id: targetUser.facultyId },
          data: facultyUpdateData,
        });
      } else if (role === 'FACULTY' || role === 'HOD') {
        const newFaculty = await prisma.faculty.create({
          data: {
            name: trimmedName || cleanEmail,
            email: cleanEmail,
            designation: faculty?.designation || (role === 'HOD' ? 'Professor & Head of Department' : 'Assistant Professor'),
            roleCategory: faculty?.roleCategory || (role === 'HOD' ? 'HOD' : 'ASSISTANT_PROFESSOR'),
            degrees: faculty?.degrees || 'M.Tech, Ph.D.',
            experience: faculty?.experience || '10+ Years',
            cabin: faculty?.cabin,
            specialization: faculty?.specialization || 'Artificial Intelligence & Machine Learning',
            bio: faculty?.bio || '',
            avatarUrl: avatarUrl || targetUser.avatarUrl,
            googleScholar: faculty?.googleScholar,
            departmentId: departmentId || targetUser.departmentId,
            departmentName: deptName,
          },
        });
        updatedFacultyId = newFaculty.id;
        userUpdateData.facultyId = newFaculty.id;
      }
    }

    // 6. Update User record
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
      include: {
        department: true,
        student: true,
        faculty: true,
      },
    });

    // 7. Cascade name changes to Achievements
    if (trimmedName && trimmedName !== targetUser.name) {
      await prisma.achievement.updateMany({
        where: {
          OR: [
            { createdById: userId },
            ...(updatedFacultyId ? [{ facultyId: updatedFacultyId }] : []),
          ],
        },
        data: { personName: trimmedName },
      });
    }

    // 7. Record immutable audit log
    try {
      const actorEmail = session?.user?.email;
      if (actorEmail) {
        const actorUser = await prisma.user.findUnique({
          where: { email: actorEmail.toLowerCase().trim() },
          select: { id: true, email: true, role: true },
        });

        if (actorUser) {
          await prisma.auditLog.create({
            data: {
              actorId: actorUser.id,
              actorEmail: actorUser.email,
              actorRole: actorUser.role,
              action: 'USER_UPDATED',
              entityType: 'User',
              entityId: userId,
              metadata: JSON.stringify({
                targetUserId: userId,
                targetEmail: updatedUser.email,
                targetName: updatedUser.name,
                targetRole: updatedUser.role,
                department: deptName || targetUser.departmentName,
                updatedFields: Object.keys(userUpdateData),
              }),
            },
          });
        }
      }
    } catch (auditErr) {
      console.warn('[API Users PATCH] Audit log creation warning:', auditErr);
    }

    // 8. Invalidate paths across the platform for immediate reactivity
    try {
      revalidatePath('/students');
      revalidatePath('/faculty');
      revalidatePath('/admin/users');
      revalidatePath('/profile');
      revalidatePath('/');
      if (targetUser.student?.rollNumber) {
        revalidatePath(`/students/${targetUser.student.rollNumber}`);
      }
      if (updatedUser.student?.rollNumber) {
        revalidatePath(`/students/${updatedUser.student.rollNumber}`);
      }
      if (targetUser.facultyId) {
        revalidatePath(`/faculty/${targetUser.facultyId}`);
      }
      if (updatedUser.facultyId) {
        revalidatePath(`/faculty/${updatedUser.facultyId}`);
      }
    } catch (e) {
      console.warn('[API Users PATCH] revalidatePath warning:', e);
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('[API Users PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}
