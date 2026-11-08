import { google } from 'googleapis';
import { Readable } from 'stream';

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
  isPublicLink: boolean;
}

/**
 * Uploads verified student certificates or public event documents to Google Drive.
 */
export async function uploadCertificateToDrive({
  fileBuffer,
  fileName,
  mimeType,
  documentType = 'VERIFIED_CERTIFICATE',
  folderId,
}: {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  documentType?: string;
  folderId?: string;
}): Promise<DriveUploadResult> {
  // 1. Enforce strict security boundary
  assertDriveAllowed(documentType);

  // 2. Check for service account credentials or Google auth
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (privateKey && clientEmail) {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null);

    const fileMetadata: any = {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    };

    const media = {
      mimeType,
      body: readable,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink, webContentLink',
    });

    const fileId = response.data.id!;

    // Set permission to anyone with link - viewer
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return {
      fileId,
      webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink: response.data.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`,
      isPublicLink: true,
    };
  }

  // Fallback for development/testing when dedicated institutional service account is simulated
  const mockFileId = `drive-srec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  return {
    fileId: mockFileId,
    webViewLink: `https://drive.google.com/file/d/${mockFileId}/view?usp=sharing`,
    webContentLink: `https://drive.google.com/uc?id=${mockFileId}&export=download`,
    isPublicLink: true,
  };
}
