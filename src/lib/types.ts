export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN';
export type AdminType = 'ROOT' | 'DEPARTMENT' | 'MANAGER';
export type SubmissionStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
export type BatchStatus = 'PENDING_REVIEW' | 'PARTIALLY_ACCEPTED' | 'ACCEPTED' | 'REJECTED';

export interface UserSession {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  adminType?: AdminType | null;
  isRoot: boolean;
  departmentId?: string | null;
  departmentCode?: string | null;
  departmentName?: string | null;
  studentId?: string | null;
  facultyId?: string | null;
  avatarUrl?: string | null;
}

export interface DepartmentSummary {
  id: string;
  code: string;
  name: string;
  fullName: string;
  shortName?: string | null;
  icon: string;
  hodName?: string | null;
  hodEmail?: string | null;
  intake?: number | null;
  established?: number | null;
  displayOrder: number;
  isActive: boolean;
  _count?: {
    faculty?: number;
    students?: number;
    achievements?: number;
    events?: number;
  };
}

export interface AchievementItem {
  id: string;
  title: string;
  description?: string | null;
  personName: string;
  personType: 'STUDENT' | 'FACULTY';
  participationType: string;
  teamName?: string | null;
  level: string;
  positionRank?: string | null;
  organizationEventName: string;
  academicYear: string;
  achievementDate: string | Date;
  departmentId?: string | null;
  departmentName?: string | null;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  primaryStudentId?: string | null;
  primaryStudentRoll?: string | null;
  facultyId?: string | null;
  facultyDesignation?: string | null;
  tags?: string | null;
  certificateUrl?: string | null;
  googleDriveUrl?: string | null;
  externalLinks?: string | null;
  status: SubmissionStatus;
  rejectionReason?: string | null;
  publishedAt?: string | Date | null;
  createdAt: string | Date;
  teamMembers?: Array<{
    id: string;
    rollNumber: string;
    studentName: string;
    isLeader: boolean;
  }>;
  media?: Array<{
    id: string;
    url: string;
    fileName: string;
  }>;
}

export interface BulkStagingItem {
  id: string;
  batchId: string;
  rowIndex: number;
  entityType: string;
  title?: string | null;
  personName?: string | null;
  rollNumber?: string | null;
  departmentCode?: string | null;
  categoryName?: string | null;
  academicYear?: string | null;
  date?: string | null;
  level?: string | null;
  positionRank?: string | null;
  organization?: string | null;
  teamMembersRaw?: string | null;
  email?: string | null;
  batchYear?: string | null;
  section?: string | null;
  designation?: string | null;
  roleCategory?: string | null;
  isStudentLinked: boolean;
  linkedStudentId?: string | null;
  collidingPublishedId?: string | null;
  collidingSimilarity?: number | null;
  collisionAction?: string | null;
  validationError?: string | null;
  isAccepted?: boolean | null;
}
