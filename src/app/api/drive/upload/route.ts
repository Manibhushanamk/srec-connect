import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadCertificateToDrive, assertDriveAllowed } from '@/lib/drive';

export const runtime = 'nodejs';

// Max file size: 15 MB
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to upload files to Google Drive.' },
        { status: 401 }
      );
    }

    const currentUser = session.user as any;

    // 2. Parse Multipart Form Data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('documentType') as string) || 'STUDENT_CERTIFICATE';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please attach a valid document or certificate.' },
        { status: 400 }
      );
    }

    // 3. Security Boundary Check
    try {
      assertDriveAllowed(documentType);
    } catch (secErr: any) {
      return NextResponse.json(
        { error: secErr.message || 'Security Boundary Violation: File type prohibited from Google Drive.' },
        { status: 403 }
      );
    }

    // 4. File Size & MIME Type Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds the 15 MB limit (Received ${(file.size / (1024 * 1024)).toFixed(1)} MB).` },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'application/pdf';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported file type [${mimeType}]. Allowed formats: PDF, PNG, JPG, JPEG, WEBP, DOCX.` },
        { status: 400 }
      );
    }

    // 5. Convert file to buffer and execute Google Drive Upload with public reader permission
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Sanitize file name
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const stampedFileName = `${Date.now()}_${sanitizedFileName}`;

    const driveResult = await uploadCertificateToDrive({
      fileBuffer,
      fileName: stampedFileName,
      mimeType,
      documentType,
      accessToken: (session as any)?.accessToken,
    });

    // 6. Record in Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: 'DRIVE_FILE_UPLOADED',
          entityType: 'DRIVE_DOCUMENT',
          entityId: driveResult.fileId,
          actorId: currentUser.id,
          actorEmail: currentUser.email || 'unknown@srecnandyal.edu.in',
          actorRole: String(currentUser.role || 'STUDENT'),
          metadata: JSON.stringify({
            fileName: stampedFileName,
            originalName: file.name,
            fileSize: file.size,
            mimeType,
            documentType,
            webViewLink: driveResult.webViewLink,
            isPublicLink: driveResult.isPublicLink,
          }),
        },
      });
    } catch (auditErr) {
      console.warn('[Drive Upload] Audit log recording failed (non-blocking):', auditErr);
    }

    // 7. Return shareable links
    return NextResponse.json({
      success: true,
      fileId: driveResult.fileId,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      webViewLink: driveResult.webViewLink,
      webContentLink: driveResult.webContentLink,
      isPublicLink: driveResult.isPublicLink,
      message: 'File successfully uploaded to Google Drive with public viewer permissions (Anyone with the link can view).',
    });
  } catch (error: any) {
    console.error('[Drive Upload Error] Failed to process file upload:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while uploading file to Google Drive.' },
      { status: 500 }
    );
  }
}
