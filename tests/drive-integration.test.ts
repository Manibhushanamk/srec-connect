import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertDriveAllowed,
  DriveSecurityError,
  saveSuperAdminDriveTokens,
  getStoredDriveTokens,
  getDriveConnectionStatus,
  uploadCertificateToDrive,
  disconnectSuperAdminDrive,
} from '../src/lib/drive';

describe('Production Engineering: Google Drive Integration & Security Boundary Tests', () => {
  before(async () => {
    await disconnectSuperAdminDrive();
  });

  after(async () => {
    await disconnectSuperAdminDrive();
  });
  it('1. should allow legitimate non-sensitive academic certificates and event posters to Google Drive', () => {
    assert.doesNotThrow(() => {
      assertDriveAllowed('VERIFIED_CERTIFICATE');
    });
    assert.doesNotThrow(() => {
      assertDriveAllowed('STUDENT_MERIT_AWARD');
    });
    assert.doesNotThrow(() => {
      assertDriveAllowed('CAMPUS_EVENT_POSTER');
    });
  });

  it('2. should strictly reject and block confidential disciplinary records from Google Drive', () => {
    assert.throws(
      () => {
        assertDriveAllowed('STUDENT_DISCIPLINARY_ACTION');
      },
      (err: any) => err instanceof DriveSecurityError && err.message.includes('Security Boundary Violation')
    );

    assert.throws(
      () => {
        assertDriveAllowed('CONFIDENTIAL_INCIDENT_EVIDENCE');
      },
      (err: any) => err instanceof DriveSecurityError
    );

    assert.throws(
      () => {
        assertDriveAllowed('FACULTY_GRIEVANCE_DOCUMENT');
      },
      (err: any) => err instanceof DriveSecurityError
    );
  });

  it('3. should persist and retrieve Super Admin Drive tokens and folder references in SystemSetting', async () => {
    const testTokens = {
      access_token: 'ya29.test_access_token_mock',
      refresh_token: '1//04test_refresh_token_mock',
      expiry_date: Date.now() + 3600000,
      email: 'superadmin.test@srecnandyal.edu.in',
      rootFolderId: 'mock-root-folder-id',
      backupFolderId: 'mock-backup-folder-id',
    };

    await saveSuperAdminDriveTokens(testTokens);

    const retrieved = await getStoredDriveTokens();
    assert.ok(retrieved);
    assert.equal(retrieved.access_token, testTokens.access_token);
    assert.equal(retrieved.refresh_token, testTokens.refresh_token);
    assert.equal(retrieved.email, testTokens.email);
    assert.equal(retrieved.rootFolderId, testTokens.rootFolderId);
    assert.equal(retrieved.backupFolderId, testTokens.backupFolderId);
  });

  it('4. should provide comprehensive Drive connection status metrics', async () => {
    const status = await getDriveConnectionStatus();
    assert.ok(typeof status.isConnected === 'boolean');
    assert.ok(['SUPER_ADMIN_OAUTH', 'SERVICE_ACCOUNT', 'UNCONFIGURED'].includes(status.type));
  });

  it('5. should process certificate buffer and return shareable viewer link with local mirror', async () => {
    const dummyPdf = Buffer.from('%PDF-1.4 Minimal Test PDF for Drive Upload Verification');
    const fileName = `Drive_Test_Cert_${Date.now()}.pdf`;

    const result = await uploadCertificateToDrive({
      fileBuffer: dummyPdf,
      fileName,
      mimeType: 'application/pdf',
      documentType: 'VERIFIED_CERTIFICATE',
    });

    assert.ok(result.fileId);
    assert.ok(result.webViewLink);
    assert.ok(result.webContentLink);
    assert.equal(result.isPublicLink, true);
  });
});
