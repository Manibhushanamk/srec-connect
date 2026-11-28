import { z } from 'zod';
import { optionalTrimmedStr, safeUrlSchema, trimmedStr } from './common';

export const PostCreateSchema = z.object({
  content: trimmedStr(1, 2500),
  visibility: z.enum(['PUBLIC', 'COLLEGE_ONLY', 'PRIVATE']).optional().default('PUBLIC'),
  images: z.array(z.string()).max(2, 'Maximum 2 images allowed per post').optional().default([]),
  collaborators: z
    .array(
      z.object({
        userId: optionalTrimmedStr(64),
        rollNumber: optionalTrimmedStr(24),
      })
    )
    .max(20)
    .optional(),
  collaboratorIds: z.array(z.string()).max(20).optional(),
  achievementId: z.string().trim().optional().nullable(),
});

export const PostPatchSchema = z.object({
  content: trimmedStr(1, 2500).optional(),
  visibility: z.enum(['PUBLIC', 'COLLEGE_ONLY', 'PRIVATE']).optional(),
  isPinned: z.boolean().optional(),
});

export const PostCommentSchema = z.object({
  content: trimmedStr(1, 500),
});

export const PostReportSchema = z.object({
  reason: optionalTrimmedStr(300).default('Inappropriate content'),
});

export const PostCollaborateSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
});

export const AnnouncementCreateSchema = z.object({
  title: trimmedStr(2, 200),
  content: trimmedStr(2, 4000),
  priority: z.enum(['NORMAL', 'URGENT']).optional().default('NORMAL'),
  targetRole: z.enum(['ALL', 'STUDENT', 'FACULTY']).optional().default('ALL'),
  batch: optionalTrimmedStr(40),
  section: optionalTrimmedStr(24),
  departmentId: z.string().trim().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export const AnnouncementPatchSchema = z.object({
  title: optionalTrimmedStr(200),
  content: optionalTrimmedStr(4000),
  priority: z.enum(['NORMAL', 'URGENT']).optional(),
  targetRole: z.enum(['ALL', 'STUDENT', 'FACULTY']).optional(),
  batch: optionalTrimmedStr(40),
  section: optionalTrimmedStr(24),
  expiresAt: safeUrlSchema.optional(),
});
