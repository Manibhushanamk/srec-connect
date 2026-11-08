import { Role, AdminType, SubmissionStatus, BatchStatus } from '@prisma/client';

export type UserRole = Role;
export type UserAdminType = AdminType;

export interface PermissionContext {
  userId: string;
  role: UserRole;
  adminType: UserAdminType | null;
  isRoot: boolean;
  departmentId: string | null;
}

export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
}

export const ROLE_HIERARCHY = {
  [Role.ADMIN]: 3,
  [Role.FACULTY]: 2,
  [Role.STUDENT]: 1,
};

export const ADMIN_TYPE_HIERARCHY = {
  [AdminType.ROOT]: 3,
  [AdminType.DEPARTMENT]: 2,
  [AdminType.MANAGER]: 1,
};

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] || 0;
}

export function getAdminTypeLevel(adminType: UserAdminType | null): number {
  if (!adminType) return 0;
  return ADMIN_TYPE_HIERARCHY[adminType] || 0;
}

export function canAccessAdminPanel(context: PermissionContext): AccessControlResult {
  if (context.role !== Role.ADMIN) {
    return { allowed: false, reason: 'Only administrators can access the admin panel' };
  }
  return { allowed: true };
}

export function canManageUsers(context: PermissionContext, targetAdminType?: UserAdminType): AccessControlResult {
  if (context.isRoot) return { allowed: true };
  if (context.role !== Role.ADMIN) {
    return { allowed: false, reason: 'Only administrators can manage users' };
  }
  
  if (context.adminType === AdminType.ROOT) return { allowed: true };
  
  if (context.adminType === AdminType.DEPARTMENT) {
    if (targetAdminType === AdminType.ROOT) {
      return { allowed: false, reason: 'Department admins cannot manage root admins' };
    }
    if (targetAdminType === AdminType.DEPARTMENT) {
      return { allowed: false, reason: 'Department admins cannot manage other department admins' };
    }
    return { allowed: true };
  }
  
  if (context.adminType === AdminType.MANAGER) {
    return { allowed: false, reason: 'Sub-admins cannot manage users' };
  }
  
  return { allowed: false, reason: 'Insufficient permissions' };
}

export function canManageDepartment(context: PermissionContext, targetDepartmentId: string): AccessControlResult {
  if (context.isRoot) return { allowed: true };
  if (context.role !== Role.ADMIN) {
    return { allowed: false, reason: 'Only administrators can manage departments' };
  }
  
  if (context.adminType === AdminType.DEPARTMENT && context.departmentId === targetDepartmentId) {
    return { allowed: true };
  }
  
  return { allowed: false, reason: 'You can only manage your own department' };
}

export function canManageAchievements(context: PermissionContext, achievementDepartmentId: string): AccessControlResult {
  if (context.isRoot) return { allowed: true };
  if (context.role === Role.ADMIN) {
    if (context.adminType === AdminType.DEPARTMENT && context.departmentId === achievementDepartmentId) {
      return { allowed: true };
    }
    if (context.adminType === AdminType.MANAGER && context.departmentId === achievementDepartmentId) {
      return { allowed: true };
    }
    if (context.adminType === AdminType.ROOT) {
      return { allowed: true };
    }
  }
  return { allowed: false, reason: 'You can only manage achievements in your department' };
}

export function canManageEvents(context: PermissionContext, eventDepartmentId: string): AccessControlResult {
  if (context.isRoot) return { allowed: true };
  if (context.role === Role.ADMIN) {
    if (context.adminType === AdminType.DEPARTMENT && context.departmentId === eventDepartmentId) {
      return { allowed: true };
    }
    if (context.adminType === AdminType.ROOT) {
      return { allowed: true };
    }
  }
  return { allowed: false, reason: 'You can only manage events in your department' };
}

export function canManageBulkUpload(context: PermissionContext, batchDepartmentId: string | null): AccessControlResult {
  if (context.isRoot) return { allowed: true };
  if (context.role === Role.ADMIN) {
    if (context.adminType === AdminType.DEPARTMENT && context.departmentId === batchDepartmentId) {
      return { allowed: true };
    }
    if (context.adminType === AdminType.ROOT) {
      return { allowed: true };
    }
  }
  return { allowed: false, reason: 'You can only manage bulk uploads for your department' };
}

export function canRollbackSnapshots(context: PermissionContext): AccessControlResult {
  if (context.isRoot) return { allowed: true };
  return { allowed: false, reason: 'Only root admin can perform snapshot rollbacks' };
}

export function canTransferRootOwnership(context: PermissionContext): AccessControlResult {
  if (context.isRoot) return { allowed: true };
  return { allowed: false, reason: 'Only current root admin can transfer ownership' };
}

export function canViewAllDepartments(context: PermissionContext): AccessControlResult {
  if (context.isRoot) return { allowed: true };
  if (context.role === Role.ADMIN && context.adminType === AdminType.ROOT) return { allowed: true };
  return { allowed: false, reason: 'Only root admin can view all departments' };
}

export function canAccessDeduplication(context: PermissionContext): AccessControlResult {
  if (context.isRoot) return { allowed: true };
  if (context.role === Role.ADMIN && (context.adminType === AdminType.ROOT || context.adminType === AdminType.DEPARTMENT)) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Insufficient permissions for deduplication' };
}

export function canExportData(context: PermissionContext, targetDepartmentId?: string): AccessControlResult {
  if (context.isRoot) return { allowed: true };
  if (context.role === Role.ADMIN) {
    if (context.adminType === AdminType.ROOT) return { allowed: true };
    if (context.adminType === AdminType.DEPARTMENT && context.departmentId === targetDepartmentId) {
      return { allowed: true };
    }
  }
  return { allowed: false, reason: 'Insufficient permissions for data export' };
}

export function getVisibleMenuGroups(context: PermissionContext): string[] {
  const baseGroups = ['overview', 'achievements', 'events', 'students', 'faculty'];
  
  if (context.isRoot || context.adminType === AdminType.ROOT) {
    return [
      'overview',
      'users',
      'departments',
      'achievements',
      'events',
      'students',
      'faculty',
      'categories',
      'bulk-upload',
      'bulk-review',
      'deduplication',
      'analytics',
      'export',
      'audit-logs',
      'settings',
    ];
  }
  
  if (context.adminType === AdminType.DEPARTMENT) {
    return [
      'overview',
      'achievements',
      'events',
      'students',
      'faculty',
      'users',
      'bulk-upload',
      'bulk-review',
      'export',
      'settings',
    ];
  }
  
  if (context.adminType === AdminType.MANAGER) {
    return [
      'overview',
      'achievements',
      'students',
      'faculty',
      'export',
    ];
  }
  
  return [];
}

export function getDashboardRoute(role: UserRole, adminType: UserAdminType | null, isRoot: boolean): string {
  if (isRoot || role === Role.ADMIN) {
    return '/admin';
  }
  if (role === Role.FACULTY) {
    return '/dashboard/faculty';
  }
  if (role === Role.STUDENT) {
    return '/dashboard/student';
  }
  return '/';
}

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending Review',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
};

export const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PUBLISHED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  PENDING_REVIEW: 'Pending Review',
  PARTIALLY_ACCEPTED: 'Partially Accepted',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

export const BATCH_STATUS_COLORS: Record<BatchStatus, string> = {
  PENDING_REVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PARTIALLY_ACCEPTED: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  ACCEPTED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};