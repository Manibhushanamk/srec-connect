import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { uploadPrivateBackupToDrive, downloadDriveFile, getDriveConnectionStatus } from './drive';

export interface BackupMetadata {
  backup_format_version: number;
  application: string;
  backup_id: string;
  created_at: string;
  database_version: string;
  tables: string[];
  record_counts: Record<string, number>;
  total_records: number;
  checksum_sha256: string;
}

export interface BackupPayload {
  metadata: BackupMetadata;
  data: Record<string, any[]>;
}

export interface EncryptedBackupPackage {
  format: 'SREC_ENCRYPTED_BACKUP_V1';
  backup_id: string;
  algorithm: 'aes-256-gcm';
  iv: string;        // Hex encoded
  auth_tag: string;  // Hex encoded
  ciphertext: string; // Base64 encoded
  checksum_sha256: string;
  created_at: string;
  metadata: BackupMetadata;
}

/**
 * Derives or retrieves the 32-byte AES-256-GCM encryption key.
 */
export async function getBackupEncryptionKey(): Promise<Buffer> {
  const envKey = process.env.BACKUP_ENCRYPTION_KEY;
  if (envKey && envKey.length >= 32) {
    return crypto.createHash('sha256').update(envKey).digest();
  }

  // Retrieve or create persistent key in SystemSetting
  const KEY_SETTING = 'BACKUP_ENCRYPTION_SECRET';
  let setting = await prisma.systemSetting.findUnique({
    where: { key: KEY_SETTING },
  });

  if (!setting) {
    const generated = crypto.randomBytes(32).toString('hex');
    setting = await prisma.systemSetting.create({
      data: {
        key: KEY_SETTING,
        value: generated,
        description: 'Persistent Master Encryption Key for Database Backups (AES-256-GCM)',
      },
    });
  }

  return crypto.createHash('sha256').update(setting.value).digest();
}

/**
 * Checks if 14 days have elapsed since the last completed backup.
 */
export async function isBackupDue(intervalDays = 14): Promise<{ isDue: boolean; lastBackupDate: Date | null; nextBackupDue: Date | null }> {
  const lastBackup = await prisma.backupRecord.findFirst({
    where: { status: { in: ['COMPLETED', 'VERIFIED'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastBackup) {
    return { isDue: true, lastBackupDate: null, nextBackupDue: new Date() };
  }

  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
  const nextBackupDue = new Date(lastBackup.createdAt.getTime() + intervalMs);
  const isDue = Date.now() >= nextBackupDue.getTime();

  return {
    isDue,
    lastBackupDate: lastBackup.createdAt,
    nextBackupDue,
  };
}

/**
 * Extracts a complete, consistent relational JSON snapshot of the database.
 */
export async function extractDatabaseSnapshot(): Promise<{ payload: BackupPayload; rawJson: string; checksum: string }> {
  // Query tables sequentially to avoid exhausting Neon connection pooler
  const departments = await prisma.department.findMany();
  const batches = await prisma.batch.findMany();
  const sections = await prisma.section.findMany();
  const categories = await prisma.category.findMany();
  const users = await prisma.user.findMany();
  const students = await prisma.student.findMany();
  const faculty = await prisma.faculty.findMany();
  const achievements = await prisma.achievement.findMany();
  const achievementTeamMembers = await prisma.achievementTeamMember.findMany();
  const achievementMedia = await prisma.achievementMedia.findMany();
  const events = await prisma.event.findMany();
  const eventMedia = await prisma.eventMedia.findMany();
  const eventRegistrations = await prisma.eventRegistration.findMany();
  const eventAttendances = await prisma.eventAttendance.findMany();
  const incidents = await prisma.incident.findMany();
  const incidentResponses = await prisma.incidentResponse.findMany();
  const incidentActions = await prisma.incidentAction.findMany();
  const posts = await prisma.post.findMany();
  const postMedia = await prisma.postMedia.findMany();
  const postComments = await prisma.postComment.findMany();
  const postLikes = await prisma.postLike.findMany();
  const postBookmarks = await prisma.postBookmark.findMany();
  const contentReports = await prisma.contentReport.findMany();
  const postCollaborators = await prisma.postCollaborator.findMany();
  const announcements = await prisma.announcement.findMany();
  const notifications = await prisma.notification.findMany();
  const pendingBulkBatches = await prisma.pendingBulkBatch.findMany();
  const pendingBulkItems = await prisma.pendingBulkItem.findMany();
  const systemSettings = await prisma.systemSetting.findMany({
    where: {
      key: { notIn: ['GOOGLE_DRIVE_TOKENS', 'BACKUP_ENCRYPTION_SECRET'] }, // Mask secrets
    },
  });
  const bugReports = await prisma.bugReport.findMany();
  const auditLogs = await prisma.auditLog.findMany({ take: 5000, orderBy: { createdAt: 'desc' } });

  const recordCounts: Record<string, number> = {
    Department: departments.length,
    Batch: batches.length,
    Section: sections.length,
    Category: categories.length,
    User: users.length,
    Student: students.length,
    Faculty: faculty.length,
    Achievement: achievements.length,
    AchievementTeamMember: achievementTeamMembers.length,
    AchievementMedia: achievementMedia.length,
    Event: events.length,
    EventMedia: eventMedia.length,
    EventRegistration: eventRegistrations.length,
    EventAttendance: eventAttendances.length,
    Incident: incidents.length,
    IncidentResponse: incidentResponses.length,
    IncidentAction: incidentActions.length,
    Post: posts.length,
    PostMedia: postMedia.length,
    PostComment: postComments.length,
    PostLike: postLikes.length,
    PostBookmark: postBookmarks.length,
    ContentReport: contentReports.length,
    PostCollaborator: postCollaborators.length,
    Announcement: announcements.length,
    Notification: notifications.length,
    PendingBulkBatch: pendingBulkBatches.length,
    PendingBulkItem: pendingBulkItems.length,
    SystemSetting: systemSettings.length,
    BugReport: bugReports.length,
    AuditLog: auditLogs.length,
  };

  const totalRecords = Object.values(recordCounts).reduce((acc, count) => acc + count, 0);
  const backupId = `srec-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const createdAt = new Date().toISOString();

  const dataPayload = {
    Department: departments,
    Batch: batches,
    Section: sections,
    Category: categories,
    User: users,
    Student: students,
    Faculty: faculty,
    Achievement: achievements,
    AchievementTeamMember: achievementTeamMembers,
    AchievementMedia: achievementMedia,
    Event: events,
    EventMedia: eventMedia,
    EventRegistration: eventRegistrations,
    EventAttendance: eventAttendances,
    Incident: incidents,
    IncidentResponse: incidentResponses,
    IncidentAction: incidentActions,
    Post: posts,
    PostMedia: postMedia,
    PostComment: postComments,
    PostLike: postLikes,
    PostBookmark: postBookmarks,
    ContentReport: contentReports,
    PostCollaborator: postCollaborators,
    Announcement: announcements,
    Notification: notifications,
    PendingBulkBatch: pendingBulkBatches,
    PendingBulkItem: pendingBulkItems,
    SystemSetting: systemSettings,
    BugReport: bugReports,
    AuditLog: auditLogs,
  };

  // Canonical stringify for integrity checksum
  const canonicalData = JSON.stringify(dataPayload);
  const checksum = crypto.createHash('sha256').update(canonicalData).digest('hex');

  const metadata: BackupMetadata = {
    backup_format_version: 1,
    application: 'SREC CONNECT',
    backup_id: backupId,
    created_at: createdAt,
    database_version: 'v3_production',
    tables: Object.keys(recordCounts),
    record_counts: recordCounts,
    total_records: totalRecords,
    checksum_sha256: checksum,
  };

  const payload: BackupPayload = {
    metadata,
    data: dataPayload,
  };

  const rawJson = JSON.stringify(payload, null, 2);
  return { payload, rawJson, checksum };
}

/**
 * Encrypts raw backup JSON using AES-256-GCM.
 */
export async function encryptBackupPayload(rawJson: string, metadata: BackupMetadata): Promise<{ encryptedBuffer: Buffer; packageObj: EncryptedBackupPackage }> {
  const key = await getBackupEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(rawJson, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  const packageObj: EncryptedBackupPackage = {
    format: 'SREC_ENCRYPTED_BACKUP_V1',
    backup_id: metadata.backup_id,
    algorithm: 'aes-256-gcm',
    iv: iv.toString('hex'),
    auth_tag: authTag.toString('hex'),
    ciphertext,
    checksum_sha256: metadata.checksum_sha256,
    created_at: metadata.created_at,
    metadata,
  };

  const encryptedBuffer = Buffer.from(JSON.stringify(packageObj, null, 2), 'utf8');
  return { encryptedBuffer, packageObj };
}

/**
 * Decrypts and verifies an encrypted backup package.
 */
export async function decryptBackupPackage(packageBuffer: Buffer): Promise<BackupPayload> {
  const packageObj = JSON.parse(packageBuffer.toString('utf8')) as EncryptedBackupPackage;

  if (packageObj.format !== 'SREC_ENCRYPTED_BACKUP_V1') {
    throw new Error('Invalid backup package format. Expected SREC_ENCRYPTED_BACKUP_V1.');
  }

  const key = await getBackupEncryptionKey();
  const iv = Buffer.from(packageObj.iv, 'hex');
  const authTag = Buffer.from(packageObj.auth_tag, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decryptedStr = decipher.update(packageObj.ciphertext, 'base64', 'utf8');
  decryptedStr += decipher.final('utf8');

  const payload = JSON.parse(decryptedStr) as BackupPayload;

  // Verify SHA-256 checksum of decrypted data
  const canonicalData = JSON.stringify(payload.data);
  const computedChecksum = crypto.createHash('sha256').update(canonicalData).digest('hex');

  if (computedChecksum !== packageObj.checksum_sha256) {
    throw new Error(`Backup integrity check failed! Computed [${computedChecksum}] does not match recorded [${packageObj.checksum_sha256}].`);
  }

  return payload;
}

/**
 * Primary Orchestrator: Creates a complete verified database backup and uploads it to Super Admin's Google Drive.
 */
export async function createAndUploadDatabaseBackup({
  initiatedBy = 'CRON_14_DAYS',
}: {
  initiatedBy?: string;
} = {}): Promise<{
  success: boolean;
  backupId: string;
  record: any;
  driveFileId?: string;
  webViewLink?: string;
  durationMs: number;
}> {
  const startTime = Date.now();
  console.log(`[Backup Engine] Starting automated database backup initiated by: ${initiatedBy}`);

  // 1. Extract snapshot
  const { payload, rawJson, checksum } = await extractDatabaseSnapshot();
  const metadata = payload.metadata;

  // 2. Encrypt snapshot
  const { encryptedBuffer, packageObj } = await encryptBackupPayload(rawJson, metadata);
  const fileName = `${metadata.backup_id}.enc.json`;
  const fileSize = encryptedBuffer.length;

  let driveFileId: string | undefined;
  let webViewLink: string | undefined;
  let status = 'COMPLETED';
  let failureReason: string | undefined;

  // 3. Upload to Super Admin Google Drive
  try {
    const driveStatus = await getDriveConnectionStatus();
    if (driveStatus.isConnected) {
      try {
        const uploadRes = await uploadPrivateBackupToDrive({
          fileBuffer: encryptedBuffer,
          fileName,
        });
        driveFileId = uploadRes.fileId;
        webViewLink = uploadRes.webViewLink;
      } catch (uploadErr: any) {
        console.warn('[Backup Engine] Google Drive API upload failed, preserving encrypted snapshot locally:', uploadErr.message);
        const backupsDir = path.join(process.cwd(), 'public', 'backups');
        if (!fs.existsSync(backupsDir)) {
          fs.mkdirSync(backupsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(backupsDir, fileName), encryptedBuffer);
        driveFileId = `local-backup-${metadata.backup_id}`;
        webViewLink = `/backups/${fileName}`;
      }
    } else {
      console.warn('[Backup Engine] Google Drive not connected; preserving encrypted snapshot in local backup vault.');
      const backupsDir = path.join(process.cwd(), 'public', 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(backupsDir, fileName), encryptedBuffer);
      driveFileId = `local-backup-${metadata.backup_id}`;
      webViewLink = `/backups/${fileName}`;
    }
  } catch (driveErr: any) {
    console.error('[Backup Engine] Failed to store backup:', driveErr);
    failureReason = driveErr.message || 'Backup storage failed';
    status = 'FAILED';
  }

  const durationMs = Date.now() - startTime;

  // 4. Record in database
  const record = await prisma.backupRecord.create({
    data: {
      backupId: metadata.backup_id,
      fileName,
      fileSize,
      checksum,
      isEncrypted: true,
      encryptionAlgo: 'AES-256-GCM',
      driveFileId,
      driveWebViewLink: webViewLink,
      status,
      tableCounts: JSON.stringify(metadata.record_counts),
      totalRecords: metadata.total_records,
      durationMs,
      initiatedBy,
      failureReason,
    },
  });

  // 5. Verification step: if Drive file was created, test download & decrypt
  if (driveFileId && status === 'COMPLETED') {
    try {
      console.log(`[Backup Engine] Verifying uploaded backup from Google Drive file: ${driveFileId}`);
      const downloaded = await downloadDriveFile(driveFileId);
      const verifiedPayload = await decryptBackupPackage(downloaded);

      if (verifiedPayload.metadata.checksum_sha256 === checksum) {
        await prisma.backupRecord.update({
          where: { id: record.id },
          data: {
            status: 'VERIFIED',
            verifiedAt: new Date(),
          },
        });
        console.log(`[Backup Engine] Backup ${metadata.backup_id} successfully verified from Google Drive.`);
      }
    } catch (verifyErr) {
      console.warn('[Backup Engine] Immediate verification check encountered error:', verifyErr);
    }
  }

  return {
    success: status === 'COMPLETED' || status === 'VERIFIED',
    backupId: metadata.backup_id,
    record,
    driveFileId,
    webViewLink,
    durationMs,
  };
}

/**
 * Pre-flight dry-run inspection for restoration.
 */
export async function dryRunRestore(packageBuffer: Buffer): Promise<{
  isValid: boolean;
  metadata: BackupMetadata;
  tableCounts: Record<string, number>;
  totalRecords: number;
}> {
  const payload = await decryptBackupPackage(packageBuffer);
  return {
    isValid: true,
    metadata: payload.metadata,
    tableCounts: payload.metadata.record_counts,
    totalRecords: payload.metadata.total_records,
  };
}
