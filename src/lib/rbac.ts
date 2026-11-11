import { Role, UserStatus } from '@prisma/client';

export type UserRole = Role;

export interface AuthUserContext {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  departmentId?: string | null;
  studentId?: string | null;
  facultyId?: string | null;
}

export const PERMISSIONS = {
  // User Management
  USERS_STUDENT_CREATE: 'users.student.create',
  USERS_STUDENT_IMPORT: 'users.student.import',
  USERS_FACULTY_CREATE: 'users.faculty.create',
  USERS_MANAGE_ROLES: 'users.manage_roles',
  USERS_SUSPEND: 'users.suspend',

  // Achievements
  ACHIEVEMENTS_SUBMIT: 'achievements.submit',
  ACHIEVEMENTS_REVIEW: 'achievements.review',
  ACHIEVEMENTS_ESCALATE: 'achievements.escalate',
  ACHIEVEMENTS_DELETE: 'achievements.delete',

  // Incidents & Discipline
  INCIDENTS_REPORT: 'incidents.report',
  INCIDENTS_RESPOND: 'incidents.respond',
  INCIDENTS_ASSIGN: 'incidents.assign',
  INCIDENTS_RESOLVE: 'incidents.resolve',
  INCIDENTS_CONFIDENTIAL_VIEW: 'incidents.confidential_view',

  // Events & QR Attendance
  EVENTS_CREATE: 'events.create',
  EVENTS_PUBLISH: 'events.publish',
  EVENTS_REGISTER: 'events.register',
  EVENTS_CHECKIN: 'events.checkin',

  // Documents & Storage
  DOCUMENTS_MANAGE: 'documents.manage',
  DOCUMENTS_UPLOAD_CERTIFICATE: 'documents.upload_certificate',

  // Social & Moderation
  POSTS_CREATE: 'posts.create',
  POSTS_MODERATE: 'posts.moderate',

  // Analytics & System
  ANALYTICS_VIEW: 'analytics.view',
  SYSTEM_SETTINGS_MANAGE: 'system.settings.manage',
  AUDIT_LOGS_VIEW: 'system.audit_logs.view',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Default role-to-permission mapping per Blueprint specifications
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: Object.values(PERMISSIONS), // legacy alias
  HOD: [
    PERMISSIONS.ACHIEVEMENTS_SUBMIT,
    PERMISSIONS.ACHIEVEMENTS_REVIEW,
    PERMISSIONS.ACHIEVEMENTS_ESCALATE,
    PERMISSIONS.INCIDENTS_REPORT,
    PERMISSIONS.INCIDENTS_RESPOND,
    PERMISSIONS.INCIDENTS_ASSIGN,
    PERMISSIONS.INCIDENTS_RESOLVE,
    PERMISSIONS.INCIDENTS_CONFIDENTIAL_VIEW,
    PERMISSIONS.EVENTS_CREATE,
    PERMISSIONS.EVENTS_PUBLISH,
    PERMISSIONS.EVENTS_CHECKIN,
    PERMISSIONS.DOCUMENTS_MANAGE,
    PERMISSIONS.DOCUMENTS_UPLOAD_CERTIFICATE,
    PERMISSIONS.POSTS_CREATE,
    PERMISSIONS.POSTS_MODERATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW,
  ],
  WEB_MANAGER: [
    PERMISSIONS.USERS_STUDENT_CREATE,
    PERMISSIONS.USERS_STUDENT_IMPORT,
    PERMISSIONS.USERS_FACULTY_CREATE,
    PERMISSIONS.EVENTS_CREATE,
    PERMISSIONS.EVENTS_PUBLISH,
    PERMISSIONS.EVENTS_CHECKIN,
    PERMISSIONS.DOCUMENTS_MANAGE,
    PERMISSIONS.DOCUMENTS_UPLOAD_CERTIFICATE,
    PERMISSIONS.POSTS_CREATE,
    PERMISSIONS.POSTS_MODERATE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  FACULTY: [
    PERMISSIONS.ACHIEVEMENTS_SUBMIT,
    PERMISSIONS.ACHIEVEMENTS_REVIEW,
    PERMISSIONS.INCIDENTS_REPORT,
    PERMISSIONS.INCIDENTS_RESPOND,
    PERMISSIONS.EVENTS_CREATE,
    PERMISSIONS.EVENTS_REGISTER,
    PERMISSIONS.EVENTS_CHECKIN,
    PERMISSIONS.DOCUMENTS_UPLOAD_CERTIFICATE,
    PERMISSIONS.POSTS_CREATE,
  ],
  STUDENT: [
    PERMISSIONS.ACHIEVEMENTS_SUBMIT,
    PERMISSIONS.INCIDENTS_REPORT,
    PERMISSIONS.INCIDENTS_RESPOND,
    PERMISSIONS.EVENTS_REGISTER,
    PERMISSIONS.POSTS_CREATE,
    PERMISSIONS.DOCUMENTS_UPLOAD_CERTIFICATE,
  ],
};

/**
 * Checks if a given user has a specific granular permission
 */
export function hasPermission(user: AuthUserContext | null | undefined, permission: PermissionKey): boolean {
  if (!user || user.status !== 'ACTIVE') return false;
  if (user.role === 'SUPER_ADMIN') return true;

  const allowedPermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
  return allowedPermissions.includes(permission);
}

/**
 * Asserts that a user has a specific permission, throws 403 error otherwise
 */
export function requirePermission(user: AuthUserContext | null | undefined, permission: PermissionKey): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Forbidden: Missing required permission [${permission}] for role [${user?.role || 'ANONYMOUS'}]`);
  }
}

/**
 * Access check for administrative console
 */
export interface PermissionContext {
  userId: string;
  role: Role;
  adminType?: any;
  isRoot?: boolean;
  departmentId?: string | null;
}

export function canAccessAdmin(user: AuthUserContext | null | undefined): boolean {
  if (!user || user.status !== 'ACTIVE') return false;
  return (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'HOD' ||
    user.role === 'WEB_MANAGER' ||
    user.role === 'ADMIN' ||
    user.role === 'FACULTY'
  );
}

export function getRoleLandingUrl(role?: string, email?: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'HOD':
      return '/admin';
    case 'WEB_MANAGER':
      return '/admin';
    case 'FACULTY':
      return '/dashboard/faculty';
    case 'STUDENT':
      return '/dashboard/student';
    default:
      return '/';
  }
}

export function getVisibleMenuGroups(context: PermissionContext): string[] {
  if (context.isRoot || context.role === 'SUPER_ADMIN' || context.role === 'ADMIN') {
    return [
      'overview',
      'users',
      'achievements',
      'events',
      'discipline',
      'notices',
      'logs',
      'trash',
      'portals',
      'profile',
    ];
  }
  if (context.role === 'HOD') {
    return [
      'overview',
      'users',
      'achievements',
      'events',
      'discipline',
      'notices',
      'logs',
      'portals',
      'profile',
    ];
  }
  if (context.role === 'WEB_MANAGER') {
    return [
      'overview',
      'users',
      'achievements',
      'events',
      'notices',
      'portals',
      'profile',
    ];
  }
  if (context.role === 'FACULTY') {
    return [
      'achievements',
      'events',
      'portals',
      'profile',
    ];
  }
  return ['portals', 'profile'];
}
