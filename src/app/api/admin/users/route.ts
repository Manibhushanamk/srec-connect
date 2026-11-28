import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import {
  canAccessAdmin,
  buildUserQueryScope,
  getAllowedAssignableRoles,
  canManageTargetUser,
  isSuperAdmin,
  isHOD,
} from '@/lib/rbac';
import { canAccessAdminUsersApi } from '@/lib/admin-auth';
import { Role, UserStatus } from '@prisma/client';
import { parseRollNumber } from '@/lib/studentHelper';
import { AdminUserCreateSchema, AdminUserUpdateSchema, parseJsonBody } from '@/lib/schemas';
import { ensureBatchesRegistered, getAllAvailableBatches } from '@/lib/category-batch-helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    if (!session?.user?.email || !canAccessAdmin(session.user as any) || !canAccessAdminUsersApi((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden: Super Admin or HOD privileges required for User Management' }, { status: 403 });
    }

    // Resolve authoritative live actor from database
    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { department: true },
    });

    if (!actor || !canAccessAdmin(actor as any) || !canAccessAdminUsersApi(actor.role)) {
      return NextResponse.json({ error: 'Forbidden: Super Admin or HOD privileges required for User Management' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role');
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Apply strict institutional role & department query scoping
    const actorScope = buildUserQueryScope(actor);
    const where: any = { deletedAt: null, ...actorScope.whereScope };

    if (roleParam && roleParam !== 'ALL') {
      if (actorScope.whereScope.role?.in) {
        if (actorScope.whereScope.role.in.includes(roleParam as Role)) {
          where.role = roleParam as Role;
        }
      } else {
        where.role = roleParam as Role;
      }
    }
    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam as UserStatus;
    }
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { student: { rollNumber: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const [users, total, departments, batches] = await Promise.all([
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
              skills: true,
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
              skills: true,
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
      isSuperAdmin(actor.role)
        ? prisma.department.findMany({
            select: { id: true, name: true, code: true },
            orderBy: { code: 'asc' },
          })
        : actor.department
        ? [{ id: actor.department.id, name: actor.department.name, code: actor.department.code }]
        : [],
      getAllAvailableBatches(),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      departments,
      batches,
      currentActor: {
        id: actor.id,
        name: actor.name,
        email: actor.email,
        role: actor.role,
        departmentId: actor.departmentId,
        departmentName: actor.department?.name || actor.departmentName,
        departmentCode: actor.department?.code,
        allowedAssignableRoles: getAllowedAssignableRoles(actor.role),
        isSuperAdmin: isSuperAdmin(actor.role),
        isHOD: isHOD(actor.role),
        isWebManager: false,
      },
    });
  } catch (error: any) {
    console.error('[API Users GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    if (!session?.user?.email || !canAccessAdmin(session.user as any) || !canAccessAdminUsersApi((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden: Super Admin or HOD privileges required for User Management' }, { status: 403 });
    }

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { department: true },
    });

    if (!actor || !canAccessAdmin(actor as any) || !canAccessAdminUsersApi(actor.role)) {
      return NextResponse.json({ error: 'Forbidden: Super Admin or HOD privileges required for User Management' }, { status: 403 });
    }

    const parsedCreate = await parseJsonBody(req, AdminUserCreateSchema);
    if (!parsedCreate.success) return parsedCreate.response;
    const {
      email,
      name,
      role,
      departmentId,
      rollNumber,
      designation,
      batch,
      section,
      phone,
      status,
      headline,
      bio,
      roleCategory,
      degrees,
      experience,
      cabin,
      specialization,
    } = parsedCreate.data;

    // Role hierarchy verification
    const allowedRoles = getAllowedAssignableRoles(actor.role);
    if (!allowedRoles.includes(role as Role)) {
      return NextResponse.json(
        { error: `Forbidden: As ${actor.role}, you can only provision users with roles: ${allowedRoles.join(', ')}.` },
        { status: 403 }
      );
    }

    // Department boundary verification
    let targetDeptId = departmentId;
    let deptName: string | null = null;

    if (!isSuperAdmin(actor.role)) {
      if (!actor.departmentId) {
        return NextResponse.json({ error: 'Your account is not bound to an academic department.' }, { status: 403 });
      }
      if (targetDeptId && targetDeptId !== actor.departmentId) {
        return NextResponse.json(
          { error: `Forbidden: You are only authorized to add users to your own department (${actor.department?.name || actor.departmentName}).` },
          { status: 403 }
        );
      }
      targetDeptId = actor.departmentId;
      deptName = actor.department?.name || actor.departmentName || null;
    } else {
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
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
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

      const parsedRoll = parseRollNumber(cleanedRoll);
      let calculatedBatch = (batch || '').trim();
      if (!calculatedBatch && parsedRoll.isValid && parsedRoll.batchYear) {
        calculatedBatch = parsedRoll.batchYear;
      } else if (parsedRoll.isValid && parsedRoll.isLateralEntry && parsedRoll.admissionYear && calculatedBatch === `${parsedRoll.admissionYear}-${parsedRoll.admissionYear + 4}`) {
        // Correct accidentally assigned 4-year span for lateral entry student
        calculatedBatch = parsedRoll.batchYear || calculatedBatch;
      }
      if (!calculatedBatch) calculatedBatch = '2024-2028';
      await ensureBatchesRegistered([calculatedBatch]).catch(() => null);

      studentRecord = await prisma.student.create({
        data: {
          rollNumber: cleanedRoll,
          name,
          email: normalizedEmail,
          departmentId: targetDeptId || null,
          departmentName: deptName,
          batch: calculatedBatch,
          section: section || 'A',
          phone: phone || null,
          headline: headline || null,
          bio: bio || null,
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
          roleCategory: roleCategory || (role === 'HOD' ? 'HOD' : 'ASSISTANT_PROFESSOR'),
          departmentId: targetDeptId || null,
          departmentName: deptName,
          degrees: degrees || null,
          experience: experience || null,
          cabin: cabin || null,
          specialization: specialization || null,
          bio: bio || null,
        },
      });
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        role: role as Role,
        status: (status as UserStatus) || 'ACTIVE',
        departmentId: targetDeptId || null,
        departmentName: deptName,
        phone: phone || null,
        headline: headline || null,
        bio: bio || null,
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
    const session = await getServerSession().catch(() => null);
    if (!session?.user?.email || !canAccessAdmin(session.user as any) || !canAccessAdminUsersApi((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden: Super Admin or HOD privileges required for User Management' }, { status: 403 });
    }

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { department: true },
    });

    if (!actor || !canAccessAdmin(actor as any) || !canAccessAdminUsersApi(actor.role)) {
      return NextResponse.json({ error: 'Forbidden: Super Admin or HOD privileges required for User Management' }, { status: 403 });
    }

    const parsedPatch = await parseJsonBody(req, AdminUserUpdateSchema);
    if (!parsedPatch.success) return parsedPatch.response;
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
      skills,
      githubUrl,
      linkedinUrl,
      student,
      faculty,
    } = parsedPatch.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true, faculty: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Institutional RBAC and Department Boundary Check
    const manageCheck = canManageTargetUser(actor, targetUser);
    if (!manageCheck.allowed) {
      return NextResponse.json({ error: manageCheck.reason || 'Forbidden: Insufficient privileges to modify this user' }, { status: 403 });
    }

    // Non-super admins cannot transfer users across departments
    if (!isSuperAdmin(actor.role) && departmentId !== undefined && departmentId !== targetUser.departmentId) {
      return NextResponse.json({ error: 'Forbidden: Cross-department user transfers require Super Administrator privileges.' }, { status: 403 });
    }

    // Role elevation guard: actor can only set roles they are authorized to assign
    if (!isSuperAdmin(actor.role) && role !== undefined && role !== targetUser.role) {
      const allowed = getAllowedAssignableRoles(actor.role);
      if (!allowed.includes(role as Role)) {
        return NextResponse.json(
          { error: `Forbidden: As ${actor.role}, you cannot assign role ${role}. Allowed roles: ${allowed.join(', ')}.` },
          { status: 403 }
        );
      }
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
    const trimmedName = typeof name === 'string' ? name.trim() : targetUser.name;
    if (typeof name === 'string') {
      userUpdateData.name = trimmedName;
    }

    if (role !== undefined) userUpdateData.role = role as Role;
    if (status !== undefined) userUpdateData.status = status as UserStatus;
    if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl;
    if (headline !== undefined) userUpdateData.headline = headline;
    if (bio !== undefined) userUpdateData.bio = bio;
    if (phone !== undefined) userUpdateData.phone = phone;
    if (skills !== undefined) userUpdateData.skills = skills;
    if (githubUrl !== undefined) userUpdateData.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) userUpdateData.linkedinUrl = linkedinUrl;

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
        if (student?.batch !== undefined) {
          studentUpdateData.batch = student.batch || null;
          if (student.batch) {
            await ensureBatchesRegistered([student.batch]).catch(() => null);
          }
        }
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
        if (student?.skills !== undefined) {
          studentUpdateData.skills = student.skills;
          userUpdateData.skills = student.skills;
        } else if (skills !== undefined) {
          studentUpdateData.skills = skills;
        }
        if (student?.githubUrl !== undefined) {
          studentUpdateData.githubUrl = student.githubUrl;
          userUpdateData.githubUrl = student.githubUrl;
        } else if (githubUrl !== undefined) {
          studentUpdateData.githubUrl = githubUrl;
        }
        if (student?.linkedinUrl !== undefined) {
          studentUpdateData.linkedinUrl = student.linkedinUrl;
          userUpdateData.linkedinUrl = student.linkedinUrl;
        } else if (linkedinUrl !== undefined) {
          studentUpdateData.linkedinUrl = linkedinUrl;
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
        const parsedFallback = parseRollNumber(fallbackRoll);
        let studentBatch = (student?.batch || '').trim();
        if (!studentBatch && parsedFallback.isValid && parsedFallback.batchYear) {
          studentBatch = parsedFallback.batchYear;
        } else if (parsedFallback.isValid && parsedFallback.isLateralEntry && parsedFallback.admissionYear && studentBatch === `${parsedFallback.admissionYear}-${parsedFallback.admissionYear + 4}`) {
          studentBatch = parsedFallback.batchYear || studentBatch;
        }
        if (!studentBatch) studentBatch = '2024-2028';

        const newStudent = await prisma.student.create({
          data: {
            name: trimmedName || cleanEmail,
            email: cleanEmail,
            rollNumber: fallbackRoll,
            departmentId: departmentId || targetUser.departmentId,
            departmentName: deptName,
            batch: studentBatch,
            section: student?.section || 'A',
            headline: student?.headline || '',
            bio: student?.bio || '',
            phone: student?.phone || '',
            skills: student?.skills || skills || '',
            avatarUrl: avatarUrl || targetUser.avatarUrl,
            githubUrl: student?.githubUrl || githubUrl,
            linkedinUrl: student?.linkedinUrl || linkedinUrl,
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
        if (faculty?.skills !== undefined) {
          facultyUpdateData.skills = faculty.skills;
          userUpdateData.skills = faculty.skills;
        } else if (skills !== undefined) {
          facultyUpdateData.skills = skills;
        }
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
            skills: faculty?.skills || skills || faculty?.specialization || 'Artificial Intelligence & Machine Learning',
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

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    if (!session?.user?.email || !canAccessAdmin(session.user as any) || !canAccessAdminUsersApi((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden: Super Admin or HOD privileges required for User Management' }, { status: 403 });
    }

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { department: true },
    });
    if (!actor || !canAccessAdmin(actor as any) || !canAccessAdminUsersApi(actor.role)) {
      return NextResponse.json({ error: 'Forbidden: Super Admin or HOD privileges required for User Management' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
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

    // Role hierarchy & department permission check
    const manageCheck = canManageTargetUser(actor, targetUser);
    if (!manageCheck.allowed) {
      return NextResponse.json({ error: manageCheck.reason || 'Forbidden: Cannot delete this user' }, { status: 403 });
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { deletedAt: now, status: 'SUSPENDED' },
      });
      if (targetUser.studentId) {
        await tx.student.update({
          where: { id: targetUser.studentId },
          data: { deletedAt: now, isActive: false },
        });
      }
      if (targetUser.facultyId) {
        await tx.faculty.update({
          where: { id: targetUser.facultyId },
          data: { deletedAt: now, isActive: false },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'USER_DELETED',
          entityType: 'User',
          entityId: userId,
          metadata: JSON.stringify({
            targetUserId: userId,
            targetEmail: targetUser.email,
            targetName: targetUser.name,
            targetRole: targetUser.role,
            department: targetUser.departmentName,
          }),
        },
      });
    });

    try {
      revalidatePath('/students');
      revalidatePath('/faculty');
      revalidatePath('/admin/users');
      revalidatePath('/');
    } catch (e) {
      console.warn('[API Users DELETE] revalidatePath warning:', e);
    }

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name || targetUser.email} deactivated successfully.`,
    });
  } catch (error: any) {
    console.error('[API Users DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
