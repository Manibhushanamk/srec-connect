import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from './prisma';

export class DriveSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DriveSecurityError';
  }
}

/**
 * Strict Security Boundary:
 * Validates that only non-sensitive academic certificates and public materials
 * are routed to Google Drive (which uses "Anyone with link - Viewer" public disclosure).
 *
 * Sensitive disciplinary records, student grievances, and confidential incident evidence
 * are strictly prohibited from Google Drive and must remain in Private Secure Storage.
 */
export function assertDriveAllowed(documentType: string): void {
  const normalized = documentType.toUpperCase().trim();
  const PROHIBITED_KEYWORDS = ['INCIDENT', 'GRIEVANCE', 'DISCIPLINARY', 'DISCIPLINE', 'CONFIDENTIAL', 'MISCONDUCT'];

  for (const keyword of PROHIBITED_KEYWORDS) {
    if (normalized.includes(keyword)) {
      throw new DriveSecurityError(
        `Security Boundary Violation: Document type [${documentType}] is classified as sensitive confidential evidence and is strictly prohibited from public Google Drive disclosure. Route to Private Secure Storage.`
      );
    }
  }
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  webContentLink: string;
  directDisplayUrl: string;
  localMirrorUrl?: string | null;
  isPublicLink: boolean;
  storageProvider: 'GOOGLE_DRIVE' | 'LOCAL';
}

export interface StoredDriveTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  email?: string;
  connectedAt?: string;
  updatedAt?: string;
  rootFolderId?: string;
  backupFolderId?: string;
}

const SETTING_KEY_DRIVE_TOKENS = 'GOOGLE_DRIVE_TOKENS';

/**
 * Retrieves the stored Super Admin Google Drive tokens from SystemSetting.
 */
export async function getStoredDriveTokens(): Promise<StoredDriveTokens | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY_DRIVE_TOKENS },
    });
    if (!setting?.value) return null;
    return JSON.parse(setting.value) as StoredDriveTokens;
  } catch (err) {
    console.warn('[Drive Token Storage] Failed to read stored Drive tokens:', err);
    return null;
  }
}

/**
 * Saves or updates Super Admin Google Drive tokens in SystemSetting.
 */
export async function saveSuperAdminDriveTokens(tokens: Partial<StoredDriveTokens>): Promise<void> {
  const existing = await getStoredDriveTokens();
  const merged: StoredDriveTokens = {
    access_token: tokens.access_token || existing?.access_token || '',
    refresh_token: tokens.refresh_token || existing?.refresh_token,
    expiry_date: tokens.expiry_date || existing?.expiry_date,
    email: tokens.email || existing?.email,
    connectedAt: existing?.connectedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rootFolderId: tokens.rootFolderId || existing?.rootFolderId,
    backupFolderId: tokens.backupFolderId || existing?.backupFolderId,
  };

  await prisma.systemSetting.upsert({
    where: { key: SETTING_KEY_DRIVE_TOKENS },
    update: {
      value: JSON.stringify(merged),
      description: 'Persistent Super Admin Google Drive OAuth credentials & folder IDs',
    },
    create: {
      key: SETTING_KEY_DRIVE_TOKENS,
      value: JSON.stringify(merged),
      description: 'Persistent Super Admin Google Drive OAuth credentials & folder IDs',
    },
  });
}

/**
 * Disconnects the Super Admin Google Drive account by wiping stored tokens.
 */
export async function disconnectSuperAdminDrive(): Promise<void> {
  await prisma.systemSetting.deleteMany({
    where: { key: SETTING_KEY_DRIVE_TOKENS },
  });
}

/**
 * Obtains an authenticated Google Drive client:
 * 1. User session tokens (accessToken / refreshToken) if provided.
 * 2. Super Admin OAuth with automatic background token refresh.
 * 3. Institutional Service Account JWT fallback.
 */
export async function getAuthenticatedDriveClient(userAccessToken?: string, userRefreshToken?: string) {
  // Case A: User's session token passed directly
  if (userAccessToken || userRefreshToken) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({
        access_token: userAccessToken,
        refresh_token: userRefreshToken,
      });

      // Ensure valid access token, auto-refreshing if refresh_token is present
      if (userRefreshToken) {
        try {
          await oauth2Client.getAccessToken();
        } catch (tokenRefreshErr) {
          console.warn('[Drive Auth] User token auto-refresh warning:', tokenRefreshErr);
        }
      }

      return google.drive({ version: 'v3', auth: oauth2Client });
    } catch (err) {
      console.warn('[Drive Auth] User token client initialization failed, trying system stored tokens:', err);
    }
  }

  // Case B: Persistent Super Admin OAuth credentials with automated refresh
  const storedTokens = await getStoredDriveTokens();
  if (storedTokens?.refresh_token || storedTokens?.access_token) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: storedTokens.access_token,
        refresh_token: storedTokens.refresh_token,
        expiry_date: storedTokens.expiry_date,
      });

      // Check if token needs refresh (within 5 minutes of expiration)
      const isExpired = storedTokens.expiry_date
        ? Date.now() >= storedTokens.expiry_date - 300000
        : false;

      if ((isExpired || !storedTokens.access_token) && storedTokens.refresh_token) {
        console.log('[Drive Auth] Access token nearing expiration, executing automatic OAuth refresh...');
        const refreshed = await oauth2Client.refreshAccessToken();
        const newCredentials = refreshed.credentials;

        await saveSuperAdminDriveTokens({
          access_token: newCredentials.access_token || storedTokens.access_token,
          refresh_token: newCredentials.refresh_token || storedTokens.refresh_token,
          expiry_date: newCredentials.expiry_date || undefined,
        });
      }

      return google.drive({ version: 'v3', auth: oauth2Client });
    } catch (refreshErr) {
      console.warn('[Drive Auth] Super Admin OAuth refresh failed:', refreshErr);
    }
  }

  // Case C: Institutional Google Service Account JWT
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (privateKey && clientEmail) {
    try {
      const jwtClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive',
        ],
      });
      return google.drive({ version: 'v3', auth: jwtClient });
    } catch (saErr) {
      console.warn('[Drive Auth] Service account JWT init failed:', saErr);
    }
  }

  return null;
}

/**
 * Finds or creates a folder by name in Google Drive.
 */
export async function findOrCreateDriveFolder(
  drive: any,
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  try {
    let query = `name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }

    const listRes = await drive.files.list({
      q: query,
      fields: 'files(id, name, webViewLink)',
      spaces: 'drive',
    });

    if (listRes.data.files && listRes.data.files.length > 0) {
      return listRes.data.files[0];
    }

    // Create if not found
    const createRes = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'SREC CONNECT Platform Dedicated Documents & Verified Certificates Folder',
        parents: parentFolderId ? [parentFolderId] : undefined,
      },
      fields: 'id, name, webViewLink',
    });

    return createRes.data;
  } catch (err) {
    console.error(`[Drive Folder Error] Failed to find or create folder [${folderName}]:`, err);
    throw err;
  }
}

/**
 * Gets or creates the dedicated 'SREC CONNECT' sandboxed folder in the user's account.
 * With the drive.file scope, the web application only accesses files inside this folder.
 */
export async function getOrCreateUserDriveFolder(
  drive: any,
  folderName: string = 'SREC CONNECT'
): Promise<string> {
  try {
    const folder = await findOrCreateDriveFolder(drive, folderName);
    return folder.id;
  } catch (err: any) {
    console.warn(`[Drive Folder] Could not initialize sandboxed folder [${folderName}]:`, err?.message || err);
    return '';
  }
}

/**
 * Initializes required folder hierarchy:
 * - "SREC Connect" (Root)
 * - "SREC Connect Backups" (Dedicated for encrypted database snapshots)
 */
export async function initializeDriveFolders(drive: any): Promise<{ rootFolderId: string; backupFolderId: string }> {
  const rootFolder = await findOrCreateDriveFolder(drive, 'SREC Connect');
  const backupFolder = await findOrCreateDriveFolder(drive, 'SREC Connect Backups', rootFolder.id);

  // Update stored tokens with folder IDs
  await saveSuperAdminDriveTokens({
    rootFolderId: rootFolder.id,
    backupFolderId: backupFolder.id,
  });

  return {
    rootFolderId: rootFolder.id,
    backupFolderId: backupFolder.id,
  };
}

/**
 * Uploads verified student certificates or public event documents to Google Drive.
 * Places file inside the dedicated 'SREC CONNECT' folder in user's account.
 * Automatically optimizes images via Sharp (WebP conversion) for CDN-grade delivery.
 * Provides directDisplayUrl (/api/drive/file/[id]) which streams directly like a Cloudflare CDN.
 */
export async function uploadCertificateToDrive({
  fileBuffer,
  fileName,
  mimeType,
  documentType = 'VERIFIED_CERTIFICATE',
  folderId,
  accessToken,
  refreshToken,
}: {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  documentType?: string;
  folderId?: string;
  accessToken?: string;
  refreshToken?: string;
}): Promise<DriveUploadResult> {
  assertDriveAllowed(documentType);

  // Auto-optimize images with Sharp before saving to Google Drive for CDN-grade speed
  let uploadBuffer = fileBuffer;
  let uploadMimeType = mimeType;
  let uploadFileName = fileName;

  if (mimeType.startsWith('image/') && !mimeType.includes('svg')) {
    try {
      uploadBuffer = await sharp(fileBuffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      uploadMimeType = 'image/webp';
      uploadFileName = fileName.replace(/\.[^/.]+$/, '') + '.webp';
    } catch (imgOptErr) {
      console.warn('[Drive Image Pre-Optimization Warning] Using original image buffer:', imgOptErr);
    }
  }

  // 1. Primary: Attempt Google Drive upload into dedicated SREC CONNECT folder
  try {
    const drive = await getAuthenticatedDriveClient(accessToken, refreshToken);
    if (drive) {
      // Find or create dedicated 'SREC CONNECT' folder in user's Drive account
      let targetFolderId = folderId;
      if (!targetFolderId) {
        targetFolderId = await getOrCreateUserDriveFolder(drive, 'SREC CONNECT');
      }

      const readable = new Readable();
      readable.push(uploadBuffer);
      readable.push(null);

      const response = await drive.files.create({
        requestBody: {
          name: uploadFileName,
          parents: targetFolderId ? [targetFolderId] : undefined,
          description: 'SREC CONNECT Verified Academic Document',
        },
        media: {
          mimeType: uploadMimeType,
          body: readable,
        },
        fields: 'id, name, webViewLink, webContentLink',
      });

      const fileId = response.data.id!;

      // Automatically share certificates with public reader permissions for CDN streaming
      try {
        await drive.permissions.create({
          fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
      } catch (permErr: any) {
        console.warn('[Drive Permissions] Public reader permission warning (handled gracefully):', permErr?.message);
      }

      const webViewLink = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
      const webContentLink = response.data.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`;
      // Direct stream URL served like Cloudflare CDN
      const directDisplayUrl = `/api/drive/file/${fileId}`;

      return {
        fileId,
        webViewLink,
        webContentLink,
        directDisplayUrl,
        isPublicLink: true,
        storageProvider: 'GOOGLE_DRIVE',
      };
    }
  } catch (driveErr: any) {
    console.warn('[Drive Upload] Google Drive API upload failed, falling back to local storage:', driveErr?.message || driveErr);
  }

  // 2. Local mirror fallback for offline development
  const mockFileId = `srec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  let localUrl = `/uploads/${uploadFileName}`;
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const localFilePath = path.join(uploadsDir, uploadFileName);
    fs.writeFileSync(localFilePath, uploadBuffer);

    // Also persist with mockFileId prefix so /api/drive/file/[id] finds it immediately
    const indexedFilePath = path.join(uploadsDir, `${mockFileId}_${uploadFileName}`);
    fs.writeFileSync(indexedFilePath, uploadBuffer);
  } catch (fsErr) {
    console.warn('[Drive Upload] Local filesystem write warning:', fsErr);
  }

  return {
    fileId: mockFileId,
    webViewLink: localUrl,
    webContentLink: localUrl,
    directDisplayUrl: `/api/drive/file/${mockFileId}`,
    localMirrorUrl: localUrl,
    isPublicLink: true,
    storageProvider: 'LOCAL',
  };
}

/**
 * Uploads an encrypted private database backup directly to Super Admin's Google Drive.
 * CRITICAL SECURITY: Never grants public read access! Stays strictly private.
 */
export async function uploadPrivateBackupToDrive({
  fileBuffer,
  fileName,
  folderId,
}: {
  fileBuffer: Buffer;
  fileName: string;
  folderId?: string;
}): Promise<{ fileId: string; fileName: string; webViewLink: string; size: number }> {
  const drive = await getAuthenticatedDriveClient();
  if (!drive) {
    throw new Error('Google Drive client is not authenticated. Please connect Super Admin Google Drive in settings.');
  }

  const storedTokens = await getStoredDriveTokens();
  const targetFolderId = folderId || storedTokens?.backupFolderId;

  const readable = new Readable();
  readable.push(fileBuffer);
  readable.push(null);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: targetFolderId ? [targetFolderId] : undefined,
      description: 'SREC CONNECT Secure Automated Database Backup (AES-256-GCM Encrypted)',
    },
    media: {
      mimeType: 'application/octet-stream',
      body: readable,
    },
    fields: 'id, name, webViewLink, size',
  });

  return {
    fileId: response.data.id!,
    fileName: response.data.name || fileName,
    webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
    size: fileBuffer.length,
  };
}

/**
 * Lists files in a given Drive folder.
 */
export async function listDriveFiles(folderId?: string, pageSize = 20) {
  const drive = await getAuthenticatedDriveClient();
  if (!drive) {
    return [];
  }

  let query = 'trashed=false';
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  const response = await drive.files.list({
    q: query,
    pageSize,
    fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink)',
    orderBy: 'createdTime desc',
  });

  return response.data.files || [];
}

/**
 * Downloads a file from Google Drive as a Buffer.
 */
export async function downloadDriveFile(fileId: string): Promise<Buffer> {
  // Support local backup vault fallback
  if (fileId.startsWith('local-backup-')) {
    const backupId = fileId.replace('local-backup-', '');
    const privateFilePath = path.join(process.cwd(), 'private', 'backups', `${backupId}.enc.json`);
    if (fs.existsSync(privateFilePath)) {
      return fs.readFileSync(privateFilePath);
    }
    const legacyFilePath = path.join(process.cwd(), 'public', 'backups', `${backupId}.enc.json`);
    if (fs.existsSync(legacyFilePath)) {
      return fs.readFileSync(legacyFilePath);
    }
  }

  const drive = await getAuthenticatedDriveClient();
  if (!drive) {
    throw new Error('Google Drive client is not authenticated.');
  }

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

/**
 * Returns the current Google Drive connection status and metrics.
 */
export async function getDriveConnectionStatus() {
  const tokens = await getStoredDriveTokens();
  const hasServiceAccount = Boolean(
    process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  );

  if (tokens?.refresh_token || tokens?.access_token) {
    return {
      isConnected: true,
      type: 'SUPER_ADMIN_OAUTH' as const,
      email: tokens.email || 'Super Administrator',
      connectedAt: tokens.connectedAt,
      rootFolderId: tokens.rootFolderId,
      backupFolderId: tokens.backupFolderId,
      hasRefreshToken: Boolean(tokens.refresh_token),
    };
  }

  if (hasServiceAccount) {
    return {
      isConnected: true,
      type: 'SERVICE_ACCOUNT' as const,
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      connectedAt: null,
      rootFolderId: null,
      backupFolderId: null,
      hasRefreshToken: false,
    };
  }

  return {
    isConnected: false,
    type: 'UNCONFIGURED' as const,
    email: null,
    connectedAt: null,
    rootFolderId: null,
    backupFolderId: null,
    hasRefreshToken: false,
  };
}
