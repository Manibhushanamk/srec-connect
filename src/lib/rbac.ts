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
    PERMISSIONS.USERS_STUDENT_CREATE,
    PERMISSIONS.USERS_STUDENT_IMPORT,
    PERMISSIONS.USERS_FACULTY_CREATE,
    PERMISSIONS.USERS_MANAGE_ROLES,
    PERMISSIONS.USERS_SUSPEND,
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
 * Institutional Role Hierarchy Ranking
 * Super Admin (100) > HOD (70) > Web Manager (50) > Faculty (30) > Student (10)
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 100,
  HOD: 70,
  WEB_MANAGER: 50,
  FACULTY: 30,
  STUDENT: 10,
};

export function isSuperAdmin(role?: Role | string | null): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

export function isHOD(role?: Role | string | null): boolean {
  return role === 'HOD';
}

export function isWebManager(role?: Role | string | null): boolean {
  return role === 'WEB_MANAGER';
}

/**
 * Returns roles an actor is authorized to assign or provision
 */
export function getAllowedAssignableRoles(actorRole?: Role | string | null): Role[] {
  if (isSuperAdmin(actorRole)) {
    return [Role.SUPER_ADMIN, Role.HOD, Role.WEB_MANAGER, Role.FACULTY, Role.STUDENT];
  }
  if (isHOD(actorRole)) {
    // HODs have authority over Web Managers, Faculty, and Students in their department
    return [Role.WEB_MANAGER, Role.FACULTY, Role.STUDENT];
  }
  if (isWebManager(actorRole)) {
    // Web Managers have authority over Faculty and Students in their department
    return [Role.FACULTY, Role.STUDENT];
  }
  return [];
}

/**
 * Validates whether an actor can modify, suspend, or delete a target user
 */
export function canManageTargetUser(
  actor: { role?: Role | string | null; departmentId?: string | null; id?: string },
  targetUser: { id?: string; role: Role | string; departmentId?: string | null }
): { allowed: boolean; reason?: string } {
  if (isSuperAdmin(actor.role)) {
    return { allowed: true };
  }

  // Cannot manage self via administrative override actions if it degrades account
  if (actor.id && targetUser.id && actor.id === targetUser.id) {
    return { allowed: true };
  }

  if (isHOD(actor.role)) {
    if (!actor.departmentId) {
      return { allowed: false, reason: 'Your HOD account is not bound to an academic department.' };
    }
    // HOD cannot manage Super Admin or other HODs
    if (isSuperAdmin(targetUser.role) || isHOD(targetUser.role)) {
      return { allowed: false, reason: 'Department HODs cannot modify Super Admins or fellow HODs.' };
    }
    // Target must belong to HOD's department
    if (targetUser.departmentId && targetUser.departmentId !== actor.departmentId) {
      return { allowed: false, reason: 'Unauthorized: Target user belongs to a different academic department.' };
    }
    return { allowed: true };
  }

  if (isWebManager(actor.role)) {
    if (!actor.departmentId) {
      return { allowed: false, reason: 'Your Web Manager account is not bound to an academic department.' };
    }
    // Web Manager can only manage Faculty and Students
    if (targetUser.role !== Role.FACULTY && targetUser.role !== Role.STUDENT) {
      return { allowed: false, reason: 'Web Managers can only manage Faculty and Student accounts.' };
    }
    // Target must belong to Web Manager's department
    if (targetUser.departmentId && targetUser.departmentId !== actor.departmentId) {
      return { allowed: false, reason: 'Unauthorized: Target user belongs to a different academic department.' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Forbidden: Insufficient administrative privileges.' };
}

/**
 * Builds Prisma query `where` filter for listing users respecting department & hierarchy boundaries
 */
export function buildUserQueryScope(actor: {
  role?: Role | string | null;
  departmentId?: string | null;
}): { whereScope: any; departmentIdFilter?: string | null; isDepartmentScoped: boolean } {
  if (isSuperAdmin(actor.role)) {
    return { whereScope: {}, isDepartmentScoped: false };
  }

  if (isHOD(actor.role)) {
    return {
      whereScope: {
        departmentId: actor.departmentId || 'no_department_bound',
        role: { in: [Role.HOD, Role.WEB_MANAGER, Role.FACULTY, Role.STUDENT] },
      },
      departmentIdFilter: actor.departmentId,
      isDepartmentScoped: true,
    };
  }

  if (isWebManager(actor.role)) {
    return {
      whereScope: {
        departmentId: actor.departmentId || 'no_department_bound',
        role: { in: [Role.FACULTY, Role.STUDENT] },
      },
      departmentIdFilter: actor.departmentId,
      isDepartmentScoped: true,
    };
  }

  return {
    whereScope: { id: 'impossible_auth_fallback' },
    isDepartmentScoped: true,
  };
}

/**
 * Builds Prisma query `where` filter for departmental entities (Achievements, Events, etc.)
 */
export function buildDepartmentScope(actor: {
  role?: Role | string | null;
  departmentId?: string | null;
}): { departmentId?: string; isScoped: boolean } {
  if (isSuperAdmin(actor.role)) {
    return { isScoped: false };
  }
  return {
    departmentId: actor.departmentId || 'no_department_bound',
    isScoped: true,
  };
}

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
