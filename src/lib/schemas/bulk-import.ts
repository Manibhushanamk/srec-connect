import { z } from 'zod';
import { emailSchema, optionalTrimmedStr, trimmedStr, batchSchema } from './common';

export const BulkImportTypeSchema = z.enum(['STUDENT', 'FACULTY', 'WEB_MANAGER']).default('STUDENT');

export const BulkImportRequestSchema = z.object({
  action: z.enum(['validate', 'commit']),
  type: BulkImportTypeSchema,
  targetDepartmentId: z.string().trim().optional().nullable(),
  rows: z
    .array(z.record(z.unknown()))
    .min(1, 'At least 1 row must be provided for bulk import')
    .max(1000, 'Batch size exceeds limit of 1000 rows per ingestion'),
});

export const BulkValidatedRowSchema = z.object({
  name: trimmedStr(1, 120),
  email: emailSchema,
  rollNumber: optionalTrimmedStr(24),
  departmentId: trimmedStr(1, 64),
  departmentName: optionalTrimmedStr(160),
  deptCode: optionalTrimmedStr(32),
  batch: batchSchema.optional().default('2024-2028'),
  section: optionalTrimmedStr(20),
  phone: optionalTrimmedStr(30),
  designation: optionalTrimmedStr(120),
  roleCategory: optionalTrimmedStr(80),
  specialization: optionalTrimmedStr(250),
  degrees: optionalTrimmedStr(160),
  experience: optionalTrimmedStr(80),
  cabin: optionalTrimmedStr(60),
  role: z.enum(['STUDENT', 'FACULTY', 'WEB_MANAGER']),
});
