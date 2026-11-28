import { z } from 'zod';
import { batchSchema, emailSchema, optionalTrimmedStr, safeUrlSchema, trimmedStr } from './common';

export const RoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'HOD',
  'WEB_MANAGER',
  'FACULTY',
  'STUDENT',
]);

export const AdminUserCreateSchema = z.object({
  email: emailSchema,
  name: trimmedStr(1, 120),
  role: RoleSchema,
  departmentId: z.string().trim().optional().nullable(),
  rollNumber: optionalTrimmedStr(24),
  designation: optionalTrimmedStr(120),
  batch: batchSchema.optional().nullable(),
  section: optionalTrimmedStr(24),
  phone: optionalTrimmedStr(30),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).optional(),
  headline: optionalTrimmedStr(200),
  bio: optionalTrimmedStr(1000),
  roleCategory: optionalTrimmedStr(80),
  degrees: optionalTrimmedStr(160),
  experience: optionalTrimmedStr(80),
  cabin: optionalTrimmedStr(60),
  specialization: optionalTrimmedStr(250),
});

export const AdminUserUpdateSchema = z.object({
  userId: trimmedStr(1, 64),
  name: optionalTrimmedStr(120),
  email: emailSchema.optional(),
  role: RoleSchema.optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'INACTIVE']).optional(),
  departmentId: z.string().trim().optional().nullable(),
  avatarUrl: safeUrlSchema,
  headline: optionalTrimmedStr(200),
  bio: optionalTrimmedStr(1000),
  phone: optionalTrimmedStr(30),
  skills: optionalTrimmedStr(500),
  githubUrl: safeUrlSchema,
  linkedinUrl: safeUrlSchema,
  student: z
    .object({
      rollNumber: optionalTrimmedStr(24),
      batch: batchSchema.optional().nullable(),
      section: optionalTrimmedStr(24),
      headline: optionalTrimmedStr(200),
      bio: optionalTrimmedStr(1000),
      phone: optionalTrimmedStr(30),
      avatarUrl: safeUrlSchema,
      githubUrl: safeUrlSchema,
      linkedinUrl: safeUrlSchema,
      portfolioUrl: safeUrlSchema,
      skills: optionalTrimmedStr(500),
    })
    .optional(),
  faculty: z
    .object({
      name: optionalTrimmedStr(120),
      designation: optionalTrimmedStr(120),
      roleCategory: optionalTrimmedStr(80),
      degrees: optionalTrimmedStr(160),
      experience: optionalTrimmedStr(80),
      cabin: optionalTrimmedStr(60),
      specialization: optionalTrimmedStr(250),
      skills: optionalTrimmedStr(500),
      bio: optionalTrimmedStr(1000),
      avatarUrl: safeUrlSchema,
      googleScholar: safeUrlSchema,
    })
    .optional(),
});

export const UserProfilePatchSchema = z.object({
  name: optionalTrimmedStr(100),
  headline: optionalTrimmedStr(200),
  bio: optionalTrimmedStr(1000),
  phone: optionalTrimmedStr(20),
  skills: z.union([z.string().max(500), z.null()]).optional(),
  linkedinUrl: safeUrlSchema,
  githubUrl: safeUrlSchema,
  portfolioUrl: safeUrlSchema,
  avatarUrl: safeUrlSchema,
  batch: batchSchema.optional().nullable(),
  section: optionalTrimmedStr(24),
  designation: optionalTrimmedStr(120),
  roleCategory: optionalTrimmedStr(80),
  degrees: optionalTrimmedStr(160),
  experience: optionalTrimmedStr(80),
  cabin: optionalTrimmedStr(60),
  specialization: optionalTrimmedStr(250),
  googleScholar: safeUrlSchema,
});

export const BatchCreateSchema = z.object({
  name: batchSchema,
});
