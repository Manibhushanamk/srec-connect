import { Role, SubmissionStatus } from '@prisma/client';

export const IQAC_EXPORT_NOTICE =
  'Formatted for NAAC 5.3.1 / NBA 4.4 — pending SREC IQAC template sign-off';

export const JNTUA_5A_NOTICE =
  'Validated against standard JNTUA 5A rules — confirm legacy exceptions with SREC Academic Section';

export const WORKFLOW_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft / Submitted',
  PENDING: 'Submitted',
  UNDER_REVIEW: 'Under Faculty Review',
  APPROVED: 'Awaiting HOD Approval',
  RESUBMISSION_REQUIRED: 'Resubmission Required',
  REJECTED: 'Rejected',
  PUBLISHED: 'Approved & Published',
  WITHDRAWN: 'Withdrawn',
};

const WEB_MANAGER_RESTRICTED_PREFIXES = [
  '/admin/users',
  '/admin/discipline',
  '/admin/grievances',
  '/admin/logs',
  '/admin/trash',
  '/admin/settings',
  '/admin/backup',
];

/**
 * Checks whether a route path is strictly forbidden for WEB_MANAGER role.
 */
export function isWebManagerRestrictedRoute(pathname?: string | null): boolean {
  if (!pathname) return false;
  return WEB_MANAGER_RESTRICTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Only SUPER_ADMIN, ADMIN, and HOD may access /api/admin/users endpoints.
 * WEB_MANAGER is strictly isolated from institutional user editing/deletion/elevation.
 */
export function canAccessAdminUsersApi(role?: Role | string | null): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'HOD';
}

/**
 * SUPER_ADMIN, ADMIN, HOD, and WEB_MANAGER may access /api/admin/users/bulk-import,
 * strictly department-scoped for HOD & WEB_MANAGER (WEB_MANAGER can provision Students & Faculty only).
 */
export function canAccessBulkImportApi(role?: Role | string | null): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'HOD' || role === 'WEB_MANAGER';
}

/**
 * Only WEB_MANAGER and above (SUPER_ADMIN, ADMIN, HOD, WEB_MANAGER) may create/edit/remove
 * website dropdown categories or batch cohorts globally.
 */
export function canManageCategories(role?: Role | string | null): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'HOD' || role === 'WEB_MANAGER';
}

/**
 * Validates allowed export categories per institutional role.
 */
export function canExportCategory(role: Role | string | null | undefined, category: string): boolean {
  if (!role) return false;
  const upper = category.toUpperCase();
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true;
  if (role === 'HOD') {
    return ['ACHIEVEMENTS', 'STUDENTS', 'FACULTY', 'EVENTS', 'INCIDENTS', 'COMPLETE_INSTITUTIONAL_DUMP'].includes(upper);
  }
  if (role === 'WEB_MANAGER') {
    return upper === 'ACHIEVEMENTS' || upper === 'EVENTS';
  }
  if (role === 'FACULTY') {
    return upper === 'ACHIEVEMENTS' || upper === 'STUDENTS' || upper === 'EVENTS';
  }
  return false;
}

/**
 * Fail-closed department boundary resolver for analytics, moderation, and exports.
 * Non-super-admins are locked strictly to their bound departmentId (or fail-closed token).
 */
export function resolveScopedDepartmentId(
  role?: Role | string | null,
  departmentId?: string | null,
  requestedDepartmentId?: string | null
): string | null {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    if (!requestedDepartmentId || requestedDepartmentId === 'ALL') return null;
    return requestedDepartmentId;
  }
  return departmentId || 'no_department_bound';
}

export interface AchievementTransitionInput {
  status?: string | null;
  rejectionReason?: string | null;
  actorId: string;
  actorRole: Role | string;
  createdById?: string | null;
}

export type AchievementTransitionValidation =
  | { valid: true; status?: SubmissionStatus; sanitizedReason?: string | null }
  | { valid: false; httpStatus: 400 | 403; error: string };

const VALID_SUBMISSION_STATUSES = new Set<string>([
  'DRAFT',
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'REJECTED',
  'RESUBMISSION_REQUIRED',
  'WITHDRAWN',
]);

/**
 * Validates achievement workflow state transitions on the moderation desk:
 * - Blocks self-approval for non-SUPER_ADMIN actors on APPROVED / PUBLISHED
 * - Requires non-empty rejectionReason for REJECTED and RESUBMISSION_REQUIRED (HTTP 400)
 */
export function validateAchievementTransition(
  input: AchievementTransitionInput
): AchievementTransitionValidation {
  const { status, rejectionReason, actorId, actorRole, createdById } = input;
  if (!status) {
    return {
      valid: true,
      sanitizedReason: rejectionReason !== undefined ? (rejectionReason?.trim() || null) : undefined,
    };
  }

  if (!VALID_SUBMISSION_STATUSES.has(status)) {
    return { valid: false, httpStatus: 400, error: `Invalid achievement workflow status: ${status}` };
  }

  if (
    (status === 'APPROVED' || status === 'PUBLISHED') &&
    createdById &&
    createdById === actorId &&
    actorRole !== 'SUPER_ADMIN'
  ) {
    return {
      valid: false,
      httpStatus: 403,
      error: 'Forbidden: You cannot self-approve an achievement you submitted.',
    };
  }

  const trimmedReason = typeof rejectionReason === 'string' ? rejectionReason.trim() : '';

  if (status === 'REJECTED' && !trimmedReason) {
    return {
      valid: false,
      httpStatus: 400,
      error: 'Rejection reason is mandatory when rejecting a submission.',
    };
  }

  if (status === 'RESUBMISSION_REQUIRED' && !trimmedReason) {
    return {
      valid: false,
      httpStatus: 400,
      error: 'Revision remarks are mandatory when requesting resubmission.',
    };
  }

  return {
    valid: true,
    status: status as SubmissionStatus,
    sanitizedReason:
      status === 'APPROVED' || status === 'PUBLISHED'
        ? null
        : trimmedReason || null,
  };
}

/**
 * Extracts a Google Drive file ID from Drive share/view/API URLs.
 */
export function extractDriveFileId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const proxyMatch = trimmed.match(/\/api\/drive\/(?:document|file)\/([A-Za-z0-9_-]+)/);
  if (proxyMatch) return proxyMatch[1];

  const pathMatch = trimmed.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (pathMatch) return pathMatch[1];

  const queryMatch = trimmed.match(/drive\.google\.com\/(?:open|uc|thumbnail)\?[^#]*\bid=([A-Za-z0-9_-]+)/);
  if (queryMatch) return queryMatch[1];

  const userContentMatch = trimmed.match(/drive\.usercontent\.google\.com\/download\?[^#]*\bid=([A-Za-z0-9_-]+)/);
  if (userContentMatch) return userContentMatch[1];

  const lhMatch = trimmed.match(/lh3\.googleusercontent\.com\/d\/([A-Za-z0-9_-]+)/);
  if (lhMatch) return lhMatch[1];

  return null;
}

/**
 * Checks whether an achievement proof URL points to a Drive-backed private document.
 */
export function isDriveBackedProofUrl(url?: string | null): boolean {
  if (!url) return false;
  return Boolean(extractDriveFileId(url));
}

/**
 * Normalizes private achievement certificate proof URLs to always stream through
 * the authenticated Phase 0.5 endpoint `/api/drive/document/[id]`.
 */
export function toPrivateDocumentUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const driveId = extractDriveFileId(trimmed);
  if (driveId) {
    return `/api/drive/document/${driveId}`;
  }

  if (trimmed.startsWith('/api/')) {
    return trimmed;
  }

  return trimmed;
}

export interface AchievementProofViewer {
  id: string;
  role: string;
  departmentId?: string | null;
}

/**
 * Resolves achievement proof visibility consistently across Honors Wall, profile portfolios,
 * and detail dossiers without exposing private Drive certificate URLs to unauthenticated guests.
 */
export function resolveAchievementCardProof(
  achievement: {
    certificateUrl?: string | null;
    googleDriveUrl?: string | null;
    departmentId?: string | null;
    createdById?: string | null;
    primaryStudent?: { userId?: string | null; user?: { id?: string | null } | null } | null;
    faculty?: { userId?: string | null; user?: { id?: string | null } | null } | null;
    media?: Array<{ url?: string | null }> | null;
  },
  viewer?: AchievementProofViewer | null
): {
  visibleProofUrl: string | null;
  coverImageUrl: string | null;
  hasPrivateProof: boolean;
} {
  const rawProof = achievement.certificateUrl || achievement.googleDriveUrl || null;
  const isPrivateDrive = isDriveBackedProofUrl(rawProof);
  const studentOwnerId = achievement.primaryStudent?.user?.id || achievement.primaryStudent?.userId;
  const facultyOwnerId = achievement.faculty?.user?.id || achievement.faculty?.userId;
  const isOwner =
    Boolean(viewer?.id) &&
    (achievement.createdById === viewer!.id ||
      studentOwnerId === viewer!.id ||
      facultyOwnerId === viewer!.id);
  const isGlobalAdmin = viewer?.role === 'SUPER_ADMIN' || viewer?.role === 'ADMIN';
  const isSameDeptReviewer =
    Boolean(viewer?.departmentId) &&
    achievement.departmentId === viewer!.departmentId &&
    (viewer?.role === 'FACULTY' || viewer?.role === 'HOD');
  const canInspectProof = isOwner || isGlobalAdmin || isSameDeptReviewer;

  const publicUploadPath = rawProof?.startsWith('/uploads/') ? rawProof : null;
  const visibleProofUrl = rawProof
    ? isPrivateDrive
      ? canInspectProof
        ? toPrivateDocumentUrl(rawProof)
        : null
      : canInspectProof || publicUploadPath
      ? rawProof
      : null
    : null;

  const coverImageUrl =
    achievement.media?.[0]?.url ||
    (publicUploadPath && /\.(png|jpe?g|webp|gif|svg)$/i.test(publicUploadPath)
      ? publicUploadPath
      : null);

  return {
    visibleProofUrl,
    coverImageUrl,
    hasPrivateProof: Boolean(rawProof),
  };
}
