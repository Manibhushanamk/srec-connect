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
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !canAccessAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    // Resolve authoritative live actor from database
    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { department: true },
    });

    if (!actor || !canAccessAdmin(actor as any)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { action, rows, type = 'STUDENT' } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided for import' }, { status: 400 });
    }

    // Security: Bound bulk payload size to mitigate memory exhaustion
    const MAX_BULK_ROWS = 1000;
    if (rows.length > MAX_BULK_ROWS) {
      return NextResponse.json(
        { error: `Batch size exceeds limit of ${MAX_BULK_ROWS} rows per ingestion. Please split your file.` },
        { status: 400 }
      );
    }

    // Hierarchy & Role Authorization Guard
    if (isWebManager(actor.role) && type !== 'STUDENT' && type !== 'FACULTY') {
      return NextResponse.json(
        { error: 'Forbidden: Web Managers are only permitted to bulk-provision Faculty and Students.' },
        { status: 403 }
      );
    }
    if (isHOD(actor.role) && type !== 'STUDENT' && type !== 'FACULTY' && type !== 'WEB_MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden: HODs are only permitted to bulk-provision Web Managers, Faculty, and Students.' },
        { status: 403 }
      );
    }

    // Department boundary verification
    if (!isSuperAdmin(actor.role)) {
      if (!actor.departmentId || !actor.department) {
        return NextResponse.json(
          { error: 'Forbidden: Your administrative account is not bound to an academic department.' },
          { status: 403 }
        );
      }
    }

    // Pre-fetch departments for mapping
    const departments = await prisma.department.findMany({ select: { id: true, code: true, name: true } });
    const deptMap = new Map(departments.map((d) => [d.code.toUpperCase(), { id: d.id, name: d.name, code: d.code }]));

    if (action === 'validate') {
      const existingUsers = await prisma.user.findMany({ select: { email: true } });
      const existingUserEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

      const existingStudents = await prisma.student.findMany({ select: { rollNumber: true } });
      const existingRolls = new Set(existingStudents.map((s) => s.rollNumber.toUpperCase()));

      const seenEmailsInFile = new Set<string>();
      const seenRollsInFile = new Set<string>();

      const validRows: any[] = [];
      const errorRows: Array<{ rowNumber: number; data: any; errors: string[] }> = [];

      rows.forEach((rawRow: any, index: number) => {
        const rowNum = index + 1;
        const errors: string[] = [];

        // Normalize keys (handle case insensitivity in headers)
        const row: Record<string, string> = {};
        Object.entries(rawRow).forEach(([k, v]) => {
          row[k.trim().toLowerCase()] = String(v || '').trim();
        });

        const email = (row['email'] || row['mail'] || row['college email'] || '').toLowerCase();
        const name = row['name'] || row['fullname'] || row['full name'] || row['student name'] || row['faculty name'] || '';
        const rollNumber = (row['rollnumber'] || row['roll number'] || row['roll_no'] || row['rollno'] || row['htno'] || '').toUpperCase();
        
        let deptCodeInput = (row['department'] || row['dept'] || row['deptcode'] || row['branch'] || '').toUpperCase();
        
        // Scope enforcement: If actor is HOD or Web Manager, default or enforce their department code
        if (!isSuperAdmin(actor.role)) {
          const actorDeptCode = actor.department!.code.toUpperCase();
          if (deptCodeInput && deptCodeInput !== actorDeptCode) {
            errors.push(
              `Unauthorized department "${deptCodeInput}". As ${actor.role}, you can only provision users for your department (${actorDeptCode} - ${actor.department!.name}).`
            );
          }
          deptCodeInput = actorDeptCode;
        } else if (!deptCodeInput) {
          deptCodeInput = 'AIML';
        }

        const batch = row['batch'] || row['year'] || row['regulation'] || '2024-2028';
        const section = row['section'] || row['sec'] || 'A';
        const phone = row['phone'] || row['mobile'] || row['contact'] || '';
        const designation = row['designation'] || (type === 'HOD' ? 'Professor & HOD' : 'Assistant Professor');
        const specialization = row['specialization'] || row['stream'] || '';
        const degrees = row['degrees'] || row['qualifications'] || row['qualification'] || 'M.Tech, Ph.D.';
        const experience = row['experience'] || '5+ Years';
        const cabin = row['cabin'] || row['room'] || '';

        // Validation rules
        if (!name) errors.push('Missing student or faculty name');
        if (!email) {
          errors.push('Missing institutional email');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Invalid email format');
        } else if (existingUserEmails.has(email)) {
          errors.push(`Email ${email} is already registered in the system`);
        } else if (seenEmailsInFile.has(email)) {
          errors.push(`Duplicate email ${email} appears multiple times in file`);
        }

        if (type === 'STUDENT') {
          if (!rollNumber) {
            errors.push('Missing roll number');
          } else if (!/^\d{2}09(1A|5A)\d{2}[0-9A-Z]{2}$/.test(rollNumber)) {
            errors.push(`Roll number ${rollNumber} does not match SREC format (e.g. 22091A3201)`);
          } else if (existingRolls.has(rollNumber)) {
            errors.push(`Roll number ${rollNumber} already exists in database`);
          } else if (seenRollsInFile.has(rollNumber)) {
            errors.push(`Duplicate roll number ${rollNumber} appears multiple times in file`);
          }
        }

        const deptObj = deptMap.get(deptCodeInput);
        if (!deptObj) {
          errors.push(`Unknown department code "${deptCodeInput}". Valid: ${Array.from(deptMap.keys()).join(', ')}`);
        }

        if (errors.length > 0) {
          errorRows.push({ rowNumber: rowNum, data: { name, email, rollNumber, deptCode: deptCodeInput }, errors });
        } else {
          seenEmailsInFile.add(email);
          if (rollNumber) seenRollsInFile.add(rollNumber);

          let targetRole: Role = Role.STUDENT;
          if (type === 'FACULTY') targetRole = Role.FACULTY;
          if (type === 'WEB_MANAGER') targetRole = Role.WEB_MANAGER;

          validRows.push({
            name,
            email,
            rollNumber,
            departmentId: deptObj?.id || null,
            departmentName: deptObj?.name || null,
            deptCode: deptCodeInput,
            batch,
            section,
            phone,
            designation,
            specialization,
            degrees,
            experience,
            cabin,
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
        departmentScope: !isSuperAdmin(actor.role)
          ? { id: actor.departmentId, name: actor.department?.name, code: actor.department?.code }
          : null,
      });
    }

    if (action === 'commit') {
      const validRows = rows;
      let insertedCount = 0;

      // Re-validate actor department boundary on commit
      if (!isSuperAdmin(actor.role)) {
        for (const item of validRows) {
          if (item.departmentId && item.departmentId !== actor.departmentId) {
            return NextResponse.json(
              { error: 'Security violation: Attempted to commit records for an unauthorized department.' },
              { status: 403 }
            );
          }
        }
      }

      // Transactional ingestion
      await prisma.$transaction(async (tx) => {
        for (const item of validRows) {
          let studentId: string | null = null;
          let facultyId: string | null = null;

          if (item.role === 'STUDENT') {
            const student = await tx.student.create({
              data: {
                rollNumber: item.rollNumber,
                name: item.name,
                email: item.email,
                phone: item.phone || null,
                departmentId: item.departmentId,
                departmentName: item.departmentName,
                batch: item.batch || '2024-2028',
                section: item.section || 'A',
              },
            });
            studentId = student.id;
          } else if (item.role === 'FACULTY') {
            const faculty = await tx.faculty.create({
              data: {
                name: item.name,
                email: item.email,
                designation: item.designation || 'Assistant Professor',
                roleCategory: 'ASSISTANT_PROFESSOR',
                specialization: item.specialization || null,
                degrees: item.degrees || 'M.Tech, Ph.D.',
                experience: item.experience || '5+ Years',
                cabin: item.cabin || null,
                departmentId: item.departmentId,
                departmentName: item.departmentName,
              },
            });
            facultyId = faculty.id;
          }

          await tx.user.create({
            data: {
              email: item.email,
              name: item.name,
              role: item.role,
              status: 'ACTIVE',
              departmentId: item.departmentId,
              departmentName: item.departmentName,
              phone: item.phone || null,
              studentId,
              facultyId,
            },
          });

          insertedCount++;
        }

        // Record immutable audit log
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.role,
            action: 'BULK_USERS_INGESTED',
            entityType: 'User',
            entityId: actor.id,
            metadata: JSON.stringify({
              ingestedCount: insertedCount,
              type,
              departmentId: actor.departmentId,
              departmentCode: actor.department?.code,
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
        console.warn('[API Bulk Import] revalidatePath warning:', e);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully provisioned ${insertedCount} ${type.toLowerCase()} accounts into ${
          actor.department?.name || 'the campus registry'
        }.`,
        insertedCount,
      });
    }

    return NextResponse.json({ error: 'Invalid action. Must be "validate" or "commit".' }, { status: 400 });
  } catch (error: any) {
    console.error('[API Bulk Import] Error:', error);
    return NextResponse.json({ error: error.message || 'Bulk import failed' }, { status: 500 });
  }
}
