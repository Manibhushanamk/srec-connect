import { z } from 'zod';
import { optionalTrimmedStr, safeUrlSchema, trimmedStr } from './common';

export const IncidentCategorySchema = z.enum([
  'MOBILE_PHONE_USAGE',
  'ATTENDANCE_LATE_ARRIVAL',
  'CLASSROOM_DISCIPLINE',
  'INCOMPLETE_ASSIGNMENTS',
  'EXAMINATION_ISSUES',
  'STUDENT_TO_STUDENT',
  'FACULTY_GRIEVANCE',
  'INFRASTRUCTURE',
  'MISCONDUCT',
  'OTHER',
]);

export const IncidentCreateSchema = z.object({
  title: trimmedStr(2, 200),
  description: trimmedStr(2, 3000),
  category: z.string().trim().default('CLASSROOM_DISCIPLINE'),
  customCategory: optionalTrimmedStr(80),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  studentRollNumber: optionalTrimmedStr(24),
  isConfidentialHOD: z.boolean().optional().default(false),
  attachmentUrl: safeUrlSchema,
});

export const IncidentPatchSchema = z.object({
  status: z.enum([
    'REPORTED',
    'UNDER_REVIEW',
    'AWAITING_STUDENT_RESPONSE',
    'ACTION_REQUIRED',
    'ESCALATED_TO_HOD',
    'RESOLVED',
    'DISMISSED',
  ]),
});

export const IncidentResponseSchema = z.object({
  message: trimmedStr(1, 2000),
});

export const IncidentActionSchema = z.object({
  outcome: z.enum([
    'VERBAL_WARNING',
    'WRITTEN_WARNING',
    'COUNSELLING',
    'CORRECTIVE_TASK',
    'HOD_REVIEW',
    'FORMAL_ACTION',
    'NO_ACTION',
  ]),
  notes: optionalTrimmedStr(2000),
});

export const BugReportCreateSchema = z.object({
  title: trimmedStr(5, 200),
  description: trimmedStr(10, 4000),
  category: z.string().trim().default('OTHER'),
  customCategory: optionalTrimmedStr(80),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  stepsToReproduce: optionalTrimmedStr(2000),
  expectedBehavior: optionalTrimmedStr(1000),
  actualBehavior: optionalTrimmedStr(1000),
  route: optionalTrimmedStr(200),
  deviceInfo: optionalTrimmedStr(400),
  screenshotUrl: safeUrlSchema,
});

export const BugReportPatchSchema = z.object({
  status: z
    .enum([
      'NEW',
      'TRIAGED',
      'INVESTIGATING',
      'FIX_IN_PROGRESS',
      'RESOLVED',
      'CLOSED',
      'DUPLICATE',
      'CANNOT_REPRODUCE',
      'REOPENED',
    ])
    .optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedToId: z.string().trim().optional().nullable(),
  internalNotes: optionalTrimmedStr(2000),
  resolutionNotes: optionalTrimmedStr(2000),
});

export const NotificationPatchSchema = z
  .object({
    id: optionalTrimmedStr(64),
    markAllAsRead: z.boolean().optional(),
  })
  .refine((d) => Boolean(d.id || d.markAllAsRead), {
    message: 'Notification ID or markAllAsRead is required',
  });
