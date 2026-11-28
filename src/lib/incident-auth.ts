export interface IncidentAccessUser {
  id: string;
  role: string;
  departmentId?: string | null;
  student?: { id: string } | null;
}

export interface IncidentAccessTarget {
  id?: string;
  reporterId: string;
  studentId?: string | null;
  departmentId?: string | null;
  isConfidentialHOD?: boolean;
}

export interface IncidentAccessDecision {
  allowed: boolean;
  reason?: string;
  logConfidentialRead?: boolean;
}

/**
 * Fail-closed department & role access check for grievance/incident records.
 */
export function canAccessIncident(
  currentUser: IncidentAccessUser | null | undefined,
  incident: IncidentAccessTarget
): IncidentAccessDecision {
  if (!currentUser) {
    return { allowed: false, reason: 'Unauthorized' };
  }

  if (currentUser.role === 'SUPER_ADMIN') {
    return {
      allowed: true,
      logConfidentialRead: Boolean(incident.isConfidentialHOD),
    };
  }

  if (currentUser.role === 'HOD') {
    if (!currentUser.departmentId) {
      return { allowed: false, reason: 'Forbidden: HOD department binding required' };
    }
    if (incident.departmentId !== currentUser.departmentId) {
      return { allowed: false, reason: 'Forbidden: Case belongs to another department' };
    }
    return { allowed: true };
  }

  if (currentUser.role === 'FACULTY') {
    if (!currentUser.departmentId) {
      return { allowed: false, reason: 'Forbidden: Faculty department binding required' };
    }
    if (incident.reporterId === currentUser.id) {
      return { allowed: true };
    }
    if (incident.isConfidentialHOD || incident.departmentId !== currentUser.departmentId) {
      return {
        allowed: false,
        reason: 'Forbidden: Confidential or cross-department incident restricted',
      };
    }
    return { allowed: true };
  }

  if (currentUser.role === 'STUDENT') {
    const isReporter = incident.reporterId === currentUser.id;
    const isSubjectStudent = Boolean(incident.studentId) && currentUser.student?.id === incident.studentId;
    if (!isReporter && !isSubjectStudent) {
      return {
        allowed: false,
        reason: 'Forbidden: You do not have permission to view this case dossier',
      };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Forbidden: Role isolated from grievance records' };
}

/**
 * Redacts reporter identity and confidential witness notes when an accused
 * student views a case reported against them by another person.
 */
export function sanitizeIncidentForViewer<T extends Record<string, any>>(
  currentUser: IncidentAccessUser,
  incident: T
): T {
  const isAccusedStudentViewer =
    currentUser.role === 'STUDENT' &&
    Boolean(currentUser.student?.id) &&
    currentUser.student?.id === incident.studentId &&
    incident.reporterId !== currentUser.id;

  if (!isAccusedStudentViewer) {
    return incident;
  }

  const sanitized: Record<string, any> = { ...incident };
  delete sanitized.reporterId;
  delete sanitized.reporter;

  if (typeof sanitized.description === 'string') {
    sanitized.description = sanitized.description
      .replace(/\[(?:Confidential\s+)?Witness(?:\s+Notes?)?:[^\]]*\]/gi, '[Redacted]')
      .trim();
  }

  if (Array.isArray(sanitized.actions)) {
    sanitized.actions = sanitized.actions.map((action: Record<string, any>) => ({
      ...action,
      notes: null,
    }));
  }

  return sanitized as T;
}
