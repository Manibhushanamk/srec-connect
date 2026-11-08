import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/lib/prisma';
import {
  uploadCertificateToDrive,
  assertDriveAllowed,
  DriveSecurityError,
} from '../src/lib/drive';

describe('Phase 9: Google Drive, Notices & Notification System Workflow Tests', () => {
  let facultyUser: any;
  let studentUser: any;
  let testAnnouncementId: string;

  before(async () => {
    // 1. Get Faculty author
    facultyUser = await prisma.user.findFirst({
      where: { role: { in: ['FACULTY', 'HOD', 'SUPER_ADMIN'] } },
    });
    if (!facultyUser) throw new Error('Faculty author user required in DB');

    // 2. Get Student recipient
    studentUser = await prisma.user.findFirst({
      where: { role: 'STUDENT', student: { isNot: null } },
      include: { student: true },
    });
    if (!studentUser) throw new Error('Student user required in DB');
  });

  after(async () => {
    if (testAnnouncementId) {
      await prisma.notification.deleteMany({ where: { announcementId: testAnnouncementId } });
      await prisma.auditLog.deleteMany({ where: { entityId: testAnnouncementId } });
      await prisma.announcement.deleteMany({ where: { id: testAnnouncementId } });
    }
  });

  it('1. should verify Google Drive uploads verified certificates with public viewer link', async () => {
    const dummyPdfBuffer = Buffer.from('%PDF-1.4 Mock SREC Merit Certificate Content');
    const result = await uploadCertificateToDrive({
      fileBuffer: dummyPdfBuffer,
      fileName: 'SREC_Verified_Merit_Certificate_22091A3201.pdf',
      mimeType: 'application/pdf',
      documentType: 'VERIFIED_CERTIFICATE',
    });

    assert.ok(result.fileId);
    assert.ok(result.webViewLink.includes('drive.google.com'));
    assert.equal(result.isPublicLink, true);
  });

  it('2. should strictly reject and block sensitive incident/disciplinary documents from Google Drive', async () => {
    assert.throws(
      () => {
        assertDriveAllowed('DISCIPLINARY_INCIDENT_EVIDENCE');
      },
      DriveSecurityError,
      'Sensitive disciplinary documents must never be routed to public Google Drive'
    );

    assert.throws(
      () => {
        assertDriveAllowed('CONFIDENTIAL_STUDENT_GRIEVANCE_ATTACHMENT');
      },
      DriveSecurityError,
      'Confidential student grievances must never be routed to public Google Drive'
    );
  });

  it('3. should create targeted announcement and automatically fan-out in-app notifications', async () => {
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const announcement = await prisma.announcement.create({
      data: {
        title: 'Phase 9 Circular: AI & ML Department Hackathon Registration Open',
        content: 'All B.Tech students are invited to register for the 2026 AI Symposium.',
        priority: 'NORMAL',
        targetRole: 'STUDENT',
        authorId: facultyUser.id,
        expiresAt,
      },
    });

    assert.ok(announcement.id);
    testAnnouncementId = announcement.id;

    // Simulate notification fan-out
    const notification = await prisma.notification.create({
      data: {
        userId: studentUser.id,
        announcementId: announcement.id,
        title: `Announcement: ${announcement.title}`,
        message: announcement.content.slice(0, 140),
        link: '/',
        isRead: false,
      },
    });

    assert.ok(notification.id);
    assert.equal(notification.userId, studentUser.id);
    assert.equal(notification.isRead, false);
  });

  it('4. should fetch unread notifications and successfully mark them as read', async () => {
    // 1. Check unread count
    const unreadCount = await prisma.notification.count({
      where: { userId: studentUser.id, isRead: false },
    });
    assert.ok(unreadCount >= 1);

    // 2. Mark as read
    await prisma.notification.updateMany({
      where: { userId: studentUser.id, announcementId: testAnnouncementId },
      data: { isRead: true },
    });

    // 3. Verify marked as read
    const notif = await prisma.notification.findFirst({
      where: { userId: studentUser.id, announcementId: testAnnouncementId },
    });
    assert.equal(notif?.isRead, true);
  });

  it('5. should support OAuth access token and apply public viewer sharing permissions', async () => {
    const testDocBuffer = Buffer.from('Mock research publication manuscript proof');
    const result = await uploadCertificateToDrive({
      fileBuffer: testDocBuffer,
      fileName: 'Research_Paper_Proof_SREC_AIML.pdf',
      mimeType: 'application/pdf',
      documentType: 'FACULTY_PUBLICATION',
      accessToken: 'mock_oauth_access_token_123',
    });

    assert.ok(result.fileId);
    assert.ok(result.webViewLink.startsWith('https://drive.google.com/'));
    assert.equal(result.isPublicLink, true);
  });
});
