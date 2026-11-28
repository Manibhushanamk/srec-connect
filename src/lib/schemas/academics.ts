import { z } from 'zod';
import { academicYearSchema, optionalTrimmedStr, safeUrlSchema, trimmedStr } from './common';

export const CategoryCreateSchema = z.object({
  name: trimmedStr(2, 80),
  type: z.enum(['ACHIEVEMENT', 'EVENT', 'BOTH']).default('BOTH'),
  description: optionalTrimmedStr(240),
});

export const CategoryPatchSchema = z.object({
  id: trimmedStr(1, 64),
  name: optionalTrimmedStr(80),
  type: z.enum(['ACHIEVEMENT', 'EVENT', 'BOTH']).optional(),
  description: optionalTrimmedStr(240),
  isActive: z.boolean().optional(),
});

export const CategoryDeleteSchema = z
  .object({
    id: optionalTrimmedStr(64),
    name: optionalTrimmedStr(80),
    permanent: z.boolean().optional(),
  })
  .refine((d) => Boolean(d.id || d.name), {
    message: 'Category id or name is required for removal',
  });

const dateOnlyOptionalSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: 'Date must use YYYY-MM-DD format',
  })
  .optional();

export const AdminAchievementsQuerySchema = z.object({
  status: z.string().trim().max(40).optional(),
  timeline: z.string().trim().max(40).optional(),
  dateFrom: dateOnlyOptionalSchema,
  dateTo: dateOnlyOptionalSchema,
  categoryId: z.string().trim().max(64).optional(),
  level: z.string().trim().max(60).optional(),
  academicYear: z.string().trim().max(30).optional(),
  departmentId: z.string().trim().max(64).optional(),
  search: z.string().trim().max(120).optional(),
});

export const AdminExportQuerySchema = z.object({
  category: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .refine(
      (v) =>
        [
          'ACHIEVEMENTS',
          'STUDENTS',
          'FACULTY',
          'EVENTS',
          'INCIDENTS',
          'COMPLETE_INSTITUTIONAL_DUMP',
        ].includes(v),
      { message: 'Unsupported export domain category' }
    )
    .optional()
    .default('ACHIEVEMENTS'),
  format: z
    .string()
    .trim()
    .transform((v) => v.toLowerCase())
    .refine((v) => ['xlsx', 'csv', 'html', 'json'].includes(v), {
      message: 'Export format must be xlsx, csv, html, or json',
    })
    .optional()
    .default('xlsx'),
  preview: z.enum(['true', 'false']).optional(),
  departmentId: z.string().trim().max(64).optional(),
  academicYear: z.string().trim().max(30).optional(),
  batch: z.string().trim().max(40).optional(),
  status: z.string().trim().max(40).optional(),
  timeline: z.string().trim().max(40).optional(),
  dateFrom: dateOnlyOptionalSchema,
  dateTo: dateOnlyOptionalSchema,
  achievementCategoryId: z.string().trim().max(64).optional(),
  level: z.string().trim().max(60).optional(),
  search: z.string().trim().max(120).optional(),
});

export const AchievementTeamMemberInputSchema = z.object({
  rollNumber: trimmedStr(4, 24),
  studentName: trimmedStr(1, 120),
  studentId: z.string().trim().optional().nullable(),
  userId: z.string().trim().optional().nullable(),
  isLeader: z.boolean().optional(),
});

export const AchievementSubmitSchema = z
  .object({
    title: trimmedStr(2, 200),
    description: optionalTrimmedStr(2000),
    categoryId: z.string().trim().optional().nullable(),
    customCategoryName: optionalTrimmedStr(80),
    level: optionalTrimmedStr(60).default('NATIONAL'),
    positionRank: optionalTrimmedStr(120),
    organizationEventName: trimmedStr(2, 200),
    academicYear: academicYearSchema.optional().default('2025-2026'),
    achievementDate: z.string().optional(),
    googleDriveUrl: safeUrlSchema,
    certificateUrl: safeUrlSchema,
    teamMembers: z.array(AchievementTeamMemberInputSchema).max(20).optional(),
    postToFeed: z.boolean().optional(),
    feedCaption: optionalTrimmedStr(2000),
    feedImageUrl: safeUrlSchema,
    targetRollNumber: optionalTrimmedStr(24),
    targetStudentId: optionalTrimmedStr(64),
  })
  .refine((data) => Boolean(data.categoryId?.trim() || data.customCategoryName?.trim()), {
    message: 'Either an existing categoryId or a customCategoryName is required',
  });

export const AchievementPatchSchema = z.object({
  title: optionalTrimmedStr(200),
  description: optionalTrimmedStr(2000),
  categoryId: z.string().trim().optional().nullable(),
  customCategoryName: optionalTrimmedStr(80),
  level: optionalTrimmedStr(60),
  positionRank: optionalTrimmedStr(120),
  organizationEventName: optionalTrimmedStr(200),
  academicYear: academicYearSchema.optional(),
  achievementDate: z.string().optional(),
  googleDriveUrl: safeUrlSchema,
  certificateUrl: safeUrlSchema,
  teamMembers: z.array(AchievementTeamMemberInputSchema).max(20).optional(),
});

export const AdminAchievementPatchSchema = z.object({
  id: trimmedStr(1, 64),
  status: z
    .enum([
      'DRAFT',
      'PENDING',
      'UNDER_REVIEW',
      'APPROVED',
      'PUBLISHED',
      'REJECTED',
      'RESUBMISSION_REQUIRED',
      'WITHDRAWN',
    ])
    .optional(),
  rejectionReason: optionalTrimmedStr(1000),
  title: optionalTrimmedStr(200),
  description: optionalTrimmedStr(2000),
  categoryId: z.string().trim().optional().nullable(),
  customCategoryName: optionalTrimmedStr(80),
  level: optionalTrimmedStr(60),
  positionRank: optionalTrimmedStr(120),
  organizationEventName: optionalTrimmedStr(200),
  academicYear: academicYearSchema.optional(),
  personName: optionalTrimmedStr(120),
  personType: z.enum(['STUDENT', 'FACULTY']).optional(),
});

export const AdminAchievementDeleteSchema = z.object({
  id: trimmedStr(1, 64),
  permanent: z.boolean().optional(),
});

export const EventCreateSchema = z
  .object({
    title: trimmedStr(2, 200),
    description: optionalTrimmedStr(3000),
    categoryId: z.string().trim().optional().nullable(),
    customCategoryName: optionalTrimmedStr(80),
    departmentId: z.string().trim().optional().nullable(),
    startDate: trimmedStr(4, 60),
    endDate: trimmedStr(4, 60),
    venue: trimmedStr(1, 200),
    organizer: optionalTrimmedStr(160),
    speaker: optionalTrimmedStr(160),
    speakerResourcePerson: optionalTrimmedStr(200),
    capacity: z.coerce.number().int().min(1).max(50000).optional().default(100),
    registrationDeadline: z.string().optional().nullable(),
    whatsappGroupUrl: safeUrlSchema,
    posterUrl: safeUrlSchema,
    academicYear: academicYearSchema.optional().default('2025-2026'),
  })
  .refine((data) => Boolean(data.categoryId?.trim() || data.customCategoryName?.trim()), {
    message: 'Category selection or custom category name is required',
  });

export const EventPatchSchema = z.object({
  title: optionalTrimmedStr(200),
  description: optionalTrimmedStr(3000),
  categoryId: z.string().trim().optional().nullable(),
  customCategoryName: optionalTrimmedStr(80),
  departmentId: z.string().trim().optional().nullable(),
  venue: optionalTrimmedStr(200),
  organizer: optionalTrimmedStr(160),
  speaker: optionalTrimmedStr(160),
  capacity: z.coerce.number().int().min(1).max(50000).optional(),
  status: z.string().trim().max(40).optional(),
  posterUrl: safeUrlSchema,
  whatsappGroupUrl: safeUrlSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  registrationDeadline: z.string().optional().nullable(),
  academicYear: academicYearSchema.optional(),
});

export const EventCheckinSchema = z
  .object({
    rollNumber: optionalTrimmedStr(24),
    userId: optionalTrimmedStr(64),
    checkInMethod: z.enum(['QR_SCAN', 'MANUAL']).optional().default('QR_SCAN'),
  })
  .refine((d) => Boolean(d.rollNumber || d.userId), {
    message: 'Either rollNumber or userId is required for check-in',
  });

export const EventAttendanceDeleteSchema = z.object({
  userId: trimmedStr(1, 64),
});

export const DepartmentCreateSchema = z.object({
  code: trimmedStr(2, 24).transform((v) => v.toUpperCase()),
  name: trimmedStr(2, 160),
  fullName: optionalTrimmedStr(240),
  shortName: optionalTrimmedStr(40),
  description: optionalTrimmedStr(1000),
  icon: optionalTrimmedStr(40),
  hodName: optionalTrimmedStr(120),
  hodEmail: optionalTrimmedStr(160),
  hodPhone: optionalTrimmedStr(30),
  vision: optionalTrimmedStr(1000),
  mission: optionalTrimmedStr(1000),
  intake: z.coerce.number().int().min(0).max(2000).optional().default(60),
  established: z.coerce.number().int().min(1900).max(2100).optional(),
  displayOrder: z.coerce.number().int().min(0).max(1000).optional().default(0),
});
