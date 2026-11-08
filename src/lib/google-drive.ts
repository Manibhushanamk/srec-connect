import { google } from 'googleapis';
import { prisma } from './prisma';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
);

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
}

export async function getDriveClient(accessToken: string, refreshToken?: string) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  
  return google.drive({ version: 'v3', auth: client });
}

export async function createUserFolder(drive: any, userEmail: string, userName: string): Promise<DriveFolder> {
  const collegeFolder = await findOrCreateFolder(drive, 'SREC Connect');
  const userFolderName = `${userName} (${userEmail})`;
  const userFolder = await findOrCreateFolder(drive, userFolderName, collegeFolder.id);
  
  return {
    id: userFolder.id,
    name: userFolder.name,
    webViewLink: `https://drive.google.com/drive/folders/${userFolder.id}`,
  };
}

async function findOrCreateFolder(drive: any, folderName: string, parentId?: string): Promise<any> {
  let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }
  
  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  
  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0];
  }
  
  const createResponse = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id, name, webViewLink',
  });
  
  return createResponse.data;
}

export async function uploadFileToDrive(
  drive: any,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
  folderId: string
): Promise<{ id: string; webViewLink: string }> {
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: fileBuffer,
    },
    fields: 'id, webViewLink',
  });
  
  return {
    id: response.data.id,
    webViewLink: response.data.webViewLink,
  };
}

export async function createAchievementFolder(
  drive: any,
  departmentCode: string,
  academicYear: string
): Promise<DriveFolder> {
  const collegeFolder = await findOrCreateFolder(drive, 'SREC Connect');
  const deptFolder = await findOrCreateFolder(drive, departmentCode, collegeFolder.id);
  const yearFolder = await findOrCreateFolder(drive, academicYear, deptFolder.id);
  
  return {
    id: yearFolder.id,
    name: yearFolder.name,
    webViewLink: `https://drive.google.com/drive/folders/${yearFolder.id}`,
  };
}

export async function shareFolderWithUser(
  drive: any,
  folderId: string,
  userEmail: string,
  role: 'reader' | 'writer' = 'writer'
): Promise<void> {
  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      type: 'user',
      role,
      emailAddress: userEmail,
    },
    sendNotificationEmail: false,
  });
}