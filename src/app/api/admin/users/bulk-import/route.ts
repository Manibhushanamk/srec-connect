import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/rbac';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canAccessAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { action, rows, type = 'STUDENT' } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided for import' }, { status: 400 });
    }

    // Pre-fetch departments for mapping
    const departments = await prisma.department.findMany({ select: { id: true, code: true, name: true } });
    const deptMap = new Map(departments.map(d => [d.code.toUpperCase(), d.id]));

    if (action === 'validate') {
      const existingUsers = await prisma.user.findMany({ select: { email: true } });
      const existingUserEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

      const existingStudents = await prisma.student.findMany({ select: { rollNumber: true } });
      const existingRolls = new Set(existingStudents.map(s => s.rollNumber.toUpperCase()));

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

        const email = (row['email'] || '').toLowerCase();
        const name = row['name'] || row['fullname'] || row['full name'] || '';
        const rollNumber = (row['rollnumber'] || row['roll number'] || row['roll_no'] || row['rollno'] || '').toUpperCase();
        const deptCode = (row['department'] || row['dept'] || row['deptcode'] || 'AIML').toUpperCase();
        const batch = row['batch'] || '2022-2026';
        const section = row['section'] || 'A';
        const designation = row['designation'] || (type === 'HOD' ? 'Professor & HOD' : 'Assistant Professor');

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
            errors.push(`Roll number ${rollNumber} does not match JNTUA format (e.g. 22091A3201)`);
          } else if (existingRolls.has(rollNumber)) {
            errors.push(`Roll number ${rollNumber} already exists in database`);
          } else if (seenRollsInFile.has(rollNumber)) {
            errors.push(`Duplicate roll number ${rollNumber} appears multiple times in file`);
          }
        }

        const departmentId = deptMap.get(deptCode) || null;
        if (deptCode && !deptMap.has(deptCode)) {
          errors.push(`Unknown department code "${deptCode}". Valid: ${Array.from(deptMap.keys()).join(', ')}`);
        }

        if (errors.length > 0) {
          errorRows.push({ rowNumber: rowNum, data: { name, email, rollNumber, deptCode }, errors });
        } else {
          seenEmailsInFile.add(email);
          if (rollNumber) seenRollsInFile.add(rollNumber);

          validRows.push({
            name,
            email,
            rollNumber,
            departmentId,
            deptCode,
            batch,
            section,
            designation,
            role: type === 'FACULTY' ? Role.FACULTY : type === 'HOD' ? Role.HOD : Role.STUDENT,
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
      });
    }

    if (action === 'commit') {
      const validRows = rows;
      let insertedCount = 0;

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
                departmentId: item.departmentId,
                batch: item.batch || '2022-2026',
                section: item.section || 'A',
              },
            });
            studentId = student.id;
          } else if (item.role === 'FACULTY' || item.role === 'HOD') {
            const faculty = await tx.faculty.create({
              data: {
                name: item.name,
                email: item.email,
                designation: item.designation || 'Assistant Professor',
                roleCategory: item.role === 'HOD' ? 'HOD' : 'ASSISTANT_PROFESSOR',
                departmentId: item.departmentId,
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
              studentId,
              facultyId,
            },
          });

          insertedCount++;
        }
      });

      return NextResponse.json({
        success: true,
        message: `Successfully provisioned ${insertedCount} accounts`,
        insertedCount,
      });
    }

    return NextResponse.json({ error: 'Invalid action. Must be "validate" or "commit".' }, { status: 400 });
  } catch (error: any) {
    console.error('[API Bulk Import] Error:', error);
    return NextResponse.json({ error: error.message || 'Bulk import failed' }, { status: 500 });
  }
}
