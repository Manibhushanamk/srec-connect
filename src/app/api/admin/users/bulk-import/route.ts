import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import {
  canAccessAdmin,
  isSuperAdmin,
  isHOD,
  isWebManager,
} from '@/lib/rbac';
import { canAccessBulkImportApi } from '@/lib/admin-auth';
import { Role } from '@prisma/client';
import { parseRollNumber } from '@/lib/studentHelper';
import { sanitizeText } from '@/lib/sanitize';
import {
  BulkImportRequestSchema,
  BulkValidatedRowSchema,
  parseJsonBody,
} from '@/lib/schemas';
import { ensureBatchesRegistered } from '@/lib/category-batch-helpers';

const HEADER_ALIASES: Record<string, string> = {
  rollnumber: 'rollNumber',
  'roll number': 'rollNumber',
  roll_number: 'rollNumber',
  roll_no: 'rollNumber',
  rollno: 'rollNumber',
  htno: 'rollNumber',
  fullname: 'name',
  'full name': 'name',
  'student name': 'name',
  'faculty name': 'name',
  name: 'name',
  email: 'email',
  mail: 'email',
  'e-mail': 'email',
  'college email': 'email',
  'institutional email': 'email',
  department: 'department',
  dept: 'department',
  deptcode: 'department',
  'dept code': 'department',
  branch: 'department',
  batch: 'batch',
  cohort: 'batch',
  year: 'batch',
  'academic batch': 'batch',
  regulation: 'batch',
  section: 'section',
  sec: 'section',
  phone: 'phone',
  mobile: 'phone',
  contact: 'phone',
  designation: 'designation',
  rolecategory: 'roleCategory',
  'role category': 'roleCategory',
  specialization: 'specialization',
  stream: 'specialization',
  degrees: 'degrees',
  qualifications: 'degrees',
  qualification: 'degrees',
  experience: 'experience',
  cabin: 'cabin',
  room: 'cabin',
};

function normalizeRowKeys(rawRow: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [rawKey, rawVal] of Object.entries(rawRow)) {
    const cleanKey = rawKey.replace(/^\uFEFF/, '').trim().toLowerCase();
    const mapped = HEADER_ALIASES[cleanKey] || cleanKey;
    const val = rawVal === null || rawVal === undefined ? '' : String(rawVal).trim();
    if (val !== '' || !(mapped in normalized)) {
      normalized[mapped] = val;
    }
  }
  return normalized;
}

function getAllowedBulkTypes(role: Role | string): Array<'STUDENT' | 'FACULTY' | 'WEB_MANAGER'> {
  if (isWebManager(role)) return ['STUDENT', 'FACULTY'];
  if (isHOD(role) || isSuperAdmin(role)) return ['STUDENT', 'FACULTY', 'WEB_MANAGER'];
  return [];
}

/**
 * Returns authoritative department scope, active departments (for Super Admin),
 * and allowed bulk import target roles for the authenticated operator.
 */
export async function GET() {
  try {
    const session = await getServerSession().catch(() => null);
    if (!session?.user?.email || !canAccessAdmin(session.user as any) || !canAccessBulkImportApi((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Forbidden: Administrative privileges required for Bulk Ingestion' },
        { status: 403 }
      );
    }

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: {
        id: true,
        role: true,
        status: true,
        departmentId: true,
        department: { select: { id: true, code: true, name: true } },
      },
    });

    if (!actor || !canAccessAdmin(actor as any) || !canAccessBulkImportApi(actor.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Administrative privileges required for Bulk Ingestion' },
        { status: 403 }
      );
    }

    const superAdmin = isSuperAdmin(actor.role);
    const departments = superAdmin
      ? await prisma.department.findMany({
          where: { isActive: true, deletedAt: null },
          select: { id: true, code: true, name: true },
          orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
        })
      : actor.department
      ? [actor.department]
      : [];

    return NextResponse.json({
      actorRole: actor.role,
      canSelectDepartment: superAdmin,
      departmentScope: actor.department || null,
      departments,
      allowedImportTypes: getAllowedBulkTypes(actor.role),
    });
  } catch (error: any) {
    console.error('[API Bulk Import GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to resolve bulk import scope' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    if (!session?.user?.email || !canAccessAdmin(session.user as any) || !canAccessBulkImportApi((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Forbidden: Super Admin, HOD, or Web Manager privileges required for Bulk User Import' },
        { status: 403 }
      );
    }

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { department: { select: { id: true, code: true, name: true } } },
    });

    if (!actor || !canAccessAdmin(actor as any) || !canAccessBulkImportApi(actor.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Super Admin, HOD, or Web Manager privileges required for Bulk User Import' },
        { status: 403 }
      );
    }

    const parsed = await parseJsonBody(req, BulkImportRequestSchema);
    if (!parsed.success) return parsed.response;

    const { action, rows, type, targetDepartmentId } = parsed.data;
    const superAdmin = isSuperAdmin(actor.role);

    // Role-level import permission check
    const allowedTypes = getAllowedBulkTypes(actor.role);
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        {
          error: isWebManager(actor.role)
            ? 'Forbidden: Web Managers can only bulk-provision Students and Faculty inside their own department.'
            : `Forbidden: Role ${actor.role} cannot bulk-provision ${type} accounts.`,
        },
        { status: 403 }
      );
    }

    // Fail-closed department boundary enforcement
    if (!superAdmin) {
      if (!actor.departmentId || !actor.department) {
        return NextResponse.json(
          { error: 'Forbidden: Your administrative account is not bound to an academic department.' },
          { status: 403 }
        );
      }
      if (targetDepartmentId && targetDepartmentId !== actor.departmentId) {
        return NextResponse.json(
          { error: `Forbidden: Cross-department provisioning is blocked. Locked to ${actor.department.code}.` },
          { status: 403 }
        );
      }
    }

    // Fetch active departments for mapping
    const departments = await prisma.department.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, code: true, name: true },
    });
    const deptByCode = new Map(departments.map((d) => [d.code.toUpperCase(), d]));
    const deptById = new Map(departments.map((d) => [d.id, d]));

    const selectedSuperAdminDept =
      superAdmin && targetDepartmentId ? deptById.get(targetDepartmentId) || null : null;
    if (superAdmin && targetDepartmentId && !selectedSuperAdminDept) {
      return NextResponse.json({ error: 'Selected target department not found or inactive' }, { status: 404 });
    }
    const defaultSuperAdminDept =
      selectedSuperAdminDept || deptByCode.get('AIML') || deptByCode.get('CSE(AI&ML)') || departments[0] || null;

    if (action === 'validate') {
      const normalizedRows = rows.map(normalizeRowKeys);

      // Extract ONLY candidate emails and roll numbers present in the uploaded file (indexed O(k) queries, no full-table scans)
      const candidateEmails = Array.from(
        new Set(normalizedRows.map((r) => (r.email || '').toLowerCase()).filter(Boolean))
      );
      const candidateRolls = Array.from(
        new Set(
          normalizedRows
            .map((r) => parseRollNumber(r.rollNumber || '').normalized || (r.rollNumber || '').toUpperCase())
            .filter(Boolean)
        )
      );

      const [existingUsers, existingStudents] = await Promise.all([
        candidateEmails.length > 0
          ? prisma.user.findMany({
              where: { email: { in: candidateEmails } },
              select: { email: true },
            })
          : Promise.resolve([]),
        type === 'STUDENT' && candidateRolls.length > 0
          ? prisma.student.findMany({
              where: { rollNumber: { in: candidateRolls } },
              select: { rollNumber: true },
            })
          : Promise.resolve([]),
      ]);

      const existingUserEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
      const existingRolls = new Set(existingStudents.map((s) => s.rollNumber.toUpperCase()));
      const seenEmailsInFile = new Set<string>();
      const seenRollsInFile = new Set<string>();

      const validRows: any[] = [];
      const errorRows: Array<{ rowNumber: number; data: any; errors: string[] }> = [];

      normalizedRows.forEach((row, index) => {
        const rowNum = index + 1;
        const errors: string[] = [];

        const email = (row.email || '').toLowerCase().trim();
        const name = sanitizeText(row.name || '');
        const rawRoll = (row.rollNumber || '').toUpperCase().trim();
        const legacyDeptCode = (row.department || '').toUpperCase().trim();

        let resolvedDept = actor.department;
        if (!superAdmin) {
          // If an outdated CSV includes a mismatched department column, reject explicitly rather than silently mixing depts
          if (legacyDeptCode && legacyDeptCode !== actor.department!.code.toUpperCase()) {
            errors.push(
              `Cross-department entry "${legacyDeptCode}" rejected. Locked strictly to ${actor.department!.code}.`
            );
          }
          resolvedDept = actor.department!;
        } else {
          // Super Admin: optional legacy department column allowed only if present & valid; otherwise use selected Target Dept
          if (legacyDeptCode && !selectedSuperAdminDept) {
            const matchedLegacy = deptByCode.get(legacyDeptCode);
            if (!matchedLegacy) {
              errors.push(`Unknown department code "${legacyDeptCode}"`);
            } else {
              resolvedDept = matchedLegacy;
            }
          } else {
            resolvedDept = defaultSuperAdminDept;
          }
        }

        if (!resolvedDept) {
          errors.push('No valid target academic department could be resolved for this row.');
        }

        let batch = (row.batch || '').trim();
        const section = (row.section || 'A').trim().toUpperCase().slice(0, 12) || 'A';
        const phone = (row.phone || '').trim().slice(0, 30);
        const designation = sanitizeText(row.designation || '') || 'Assistant Professor';
        const roleCategory = (row.roleCategory || '').trim().toUpperCase() || 'ASSISTANT_PROFESSOR';
        const specialization = sanitizeText(row.specialization || '');
        const degrees = sanitizeText(row.degrees || '') || 'M.Tech, Ph.D.';
        const experience = sanitizeText(row.experience || '') || '5+ Years';
        const cabin = sanitizeText(row.cabin || '');

        if (!name) errors.push('Missing full name');
        if (!email) {
          errors.push('Missing institutional email');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Invalid email format');
        } else if (existingUserEmails.has(email)) {
          errors.push(`Email ${email} is already registered`);
        } else if (seenEmailsInFile.has(email)) {
          errors.push(`Duplicate email ${email} appears multiple times in file`);
        }

        let normalizedRoll = rawRoll;
        if (type === 'STUDENT') {
          if (!rawRoll) {
            errors.push('Missing roll number');
          } else {
            const parsedRoll = parseRollNumber(rawRoll);
            normalizedRoll = parsedRoll.normalized || rawRoll;
            if (!parsedRoll.isValid) {
              errors.push(`Roll number ${rawRoll} does not match valid SREC/JNTUA format (e.g. 22091A3201 or 25X55A3306)`);
            } else if (existingRolls.has(normalizedRoll)) {
              errors.push(`Roll number ${normalizedRoll} already exists in database`);
            } else if (seenRollsInFile.has(normalizedRoll)) {
              errors.push(`Duplicate roll number ${normalizedRoll} appears multiple times in file`);
            }

            if (parsedRoll.isValid && parsedRoll.batchYear) {
              if (!batch) {
                batch = parsedRoll.batchYear;
              } else if (
                parsedRoll.isLateralEntry &&
                parsedRoll.admissionYear &&
                batch === `${parsedRoll.admissionYear}-${parsedRoll.admissionYear + 4}`
              ) {
                batch = parsedRoll.batchYear;
              }
            }
          }
        }
        if (!batch) batch = '2024-2028';

        if (errors.length > 0) {
          errorRows.push({
            rowNumber: rowNum,
            data: { name, email, rollNumber: normalizedRoll, deptCode: resolvedDept?.code || legacyDeptCode },
            errors,
          });
        } else {
          seenEmailsInFile.add(email);
          if (type === 'STUDENT' && normalizedRoll) seenRollsInFile.add(normalizedRoll);

          const targetRole: Role =
            type === 'FACULTY' ? Role.FACULTY : type === 'WEB_MANAGER' ? Role.WEB_MANAGER : Role.STUDENT;

          validRows.push({
            name,
            email,
            rollNumber: type === 'STUDENT' ? normalizedRoll : null,
            departmentId: resolvedDept!.id,
            departmentName: resolvedDept!.name,
            deptCode: resolvedDept!.code,
            batch,
            section,
            phone: phone || null,
            designation,
            roleCategory,
            specialization: specialization || null,
            degrees,
            experience,
            cabin: cabin || null,
            role: targetRole,
          });
        }
      });

      return NextResponse.json({
        summary: {
          total: rows.length,
          valid: validRows.length,
          invalid: errorRows.length,
        },
        validRows,
        errorRows,
        departmentScope: !superAdmin
          ? actor.department
          : defaultSuperAdminDept,
      });
    }

    // STAGE 2: Transactional Batched Commit with Strict Re-validation
    const validatedItems: Array<ReturnType<typeof BulkValidatedRowSchema.parse>> = [];
    for (let i = 0; i < rows.length; i++) {
      const itemParsed = BulkValidatedRowSchema.safeParse(rows[i]);
      if (!itemParsed.success) {
        return NextResponse.json(
          { error: `Invalid committed row #${i + 1}: ${itemParsed.error.issues[0]?.message}` },
          { status: 400 }
        );
      }
      const item = itemParsed.data;
      if (isWebManager(actor.role) && item.role === 'WEB_MANAGER') {
        return NextResponse.json(
          { error: 'Forbidden: Web Managers can only provision Students and Faculty.' },
          { status: 403 }
        );
      }
      if (!superAdmin && item.departmentId !== actor.departmentId) {
        return NextResponse.json(
          { error: 'Security violation: Attempted to commit records for an unauthorized department.' },
          { status: 403 }
        );
      }
      validatedItems.push(item);
    }

    const commitEmails = validatedItems.map((i) => i.email.toLowerCase());
    const commitRolls = validatedItems.map((i) => i.rollNumber).filter((r): r is string => Boolean(r));
    const customBatches = validatedItems.filter((i) => i.role === 'STUDENT').map((i) => i.batch);

    const insertedCount = await prisma.$transaction(async (tx) => {
      // Re-verify uniqueness inside the transaction to prevent race-condition collisions
      const [dupUsers, dupStudents] = await Promise.all([
        tx.user.findMany({ where: { email: { in: commitEmails } }, select: { email: true } }),
        commitRolls.length > 0
          ? tx.student.findMany({ where: { rollNumber: { in: commitRolls } }, select: { rollNumber: true } })
          : Promise.resolve([]),
      ]);

      if (dupUsers.length > 0) {
        throw new Error(`Email collision detected during commit: ${dupUsers[0].email}`);
      }
      if (dupStudents.length > 0) {
        throw new Error(`Roll number collision detected during commit: ${dupStudents[0].rollNumber}`);
      }

      const studentRows = validatedItems.filter((i) => i.role === 'STUDENT');
      const facultyRows = validatedItems.filter((i) => i.role === 'FACULTY');
      const wmRows = validatedItems.filter((i) => i.role === 'WEB_MANAGER');

      const createdStudents =
        studentRows.length > 0
          ? await tx.student.createManyAndReturn({
              data: studentRows.map((item) => ({
                rollNumber: item.rollNumber!,
                name: item.name,
                email: item.email,
                phone: item.phone || null,
                departmentId: item.departmentId,
                departmentName: item.departmentName || null,
                batch: item.batch || '2024-2028',
                section: item.section || 'A',
              })),
              select: { id: true, email: true },
            })
          : [];

      const createdFaculty =
        facultyRows.length > 0
          ? await tx.faculty.createManyAndReturn({
              data: facultyRows.map((item) => ({
                name: item.name,
                email: item.email,
                designation: item.designation || 'Assistant Professor',
                roleCategory: item.roleCategory || 'ASSISTANT_PROFESSOR',
                specialization: item.specialization || null,
                degrees: item.degrees || 'M.Tech, Ph.D.',
                experience: item.experience || '5+ Years',
                cabin: item.cabin || null,
                departmentId: item.departmentId,
                departmentName: item.departmentName || null,
              })),
              select: { id: true, email: true },
            })
          : [];

      const studentIdByEmail = new Map(
        createdStudents.map((s) => [(s.email || '').toLowerCase(), s.id])
      );
      const facultyIdByEmail = new Map(
        createdFaculty.map((f) => [(f.email || '').toLowerCase(), f.id])
      );

      const userCreateInputs = [
        ...studentRows.map((item) => ({
          email: item.email,
          name: item.name,
          role: Role.STUDENT,
          status: 'ACTIVE' as const,
          departmentId: item.departmentId,
          departmentName: item.departmentName || null,
          phone: item.phone || null,
          studentId: studentIdByEmail.get(item.email) || null,
          facultyId: null,
        })),
        ...facultyRows.map((item) => ({
          email: item.email,
          name: item.name,
          role: Role.FACULTY,
          status: 'ACTIVE' as const,
          departmentId: item.departmentId,
          departmentName: item.departmentName || null,
          phone: item.phone || null,
          studentId: null,
          facultyId: facultyIdByEmail.get(item.email) || null,
        })),
        ...wmRows.map((item) => ({
          email: item.email,
          name: item.name,
          role: Role.WEB_MANAGER,
          status: 'ACTIVE' as const,
          departmentId: item.departmentId,
          departmentName: item.departmentName || null,
          phone: item.phone || null,
          studentId: null,
          facultyId: null,
        })),
      ];

      if (userCreateInputs.length > 0) {
        await tx.user.createMany({ data: userCreateInputs });
      }

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'BULK_USERS_INGESTED',
          entityType: 'User',
          entityId: actor.id,
          metadata: JSON.stringify({
            ingestedCount: userCreateInputs.length,
            type,
            departmentId: validatedItems[0]?.departmentId || actor.departmentId,
            departmentCode: validatedItems[0]?.deptCode || actor.department?.code,
          }),
        },
      });

      return userCreateInputs.length;
    });

    // Register any newly uploaded custom batches outside main lock
    await ensureBatchesRegistered(customBatches).catch(() => null);

    try {
      revalidatePath('/students');
      revalidatePath('/faculty');
      revalidatePath('/admin/users');
      revalidatePath('/');
    } catch (e) {
      console.warn('[API Bulk Import] revalidatePath warning:', e);
    }

    const deptDisplay = validatedItems[0]?.departmentName || actor.department?.name || 'the campus registry';
    return NextResponse.json({
      success: true,
      message: `Successfully provisioned ${insertedCount} ${type.toLowerCase()} accounts into ${deptDisplay}.`,
      insertedCount,
    });
  } catch (error: any) {
    console.error('[API Bulk Import] Error:', error);
    return NextResponse.json({ error: error.message || 'Bulk import failed' }, { status: 500 });
  }
}
