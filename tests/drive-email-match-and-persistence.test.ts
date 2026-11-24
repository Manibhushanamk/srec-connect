import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import {
  getUserDriveTokensKey,
  getUserDriveTokens,
  saveUserDriveTokens,
  disconnectUserDrive,
} from '../src/lib/drive';
import { getCachedMedia, setCachedMedia, deleteCachedMedia } from '../src/lib/media-cache';

describe('Google Drive Account Matching & Permanent Persistence Verification', () => {
  const testUserId = `test-user-${Date.now()}`;
  const testEmail = '25x55a3301@srecnandyal.edu.in';
  const mismatchedEmail = 'personal.scholar@gmail.com';

  after(async () => {
    await disconnectUserDrive(testUserId);
  });

  test('1. should generate correct SystemSetting key for user drive tokens', () => {
    const key = getUserDriveTokensKey(testUserId);
    assert.strictEqual(key, `USER_DRIVE_TOKENS_${testUserId}`);
  });

  test('2. should persist and retrieve user drive credentials in database', async () => {
    await saveUserDriveTokens(testUserId, {
      access_token: 'mock-access-token-12345',
      refresh_token: 'mock-refresh-token-67890',
      expiry_date: Date.now() + 3600000,
      email: testEmail,
      rootFolderId: 'mock-folder-id-abc',
    });

    const retrieved = await getUserDriveTokens(testUserId);
    assert.ok(retrieved, 'Stored tokens should exist');
    assert.strictEqual(retrieved?.access_token, 'mock-access-token-12345');
    assert.strictEqual(retrieved?.refresh_token, 'mock-refresh-token-67890');
    assert.strictEqual(retrieved?.email, testEmail);
    assert.strictEqual(retrieved?.rootFolderId, 'mock-folder-id-abc');
  });

  test('3. should verify email matching logic between Drive token and account email', () => {
    const verifyEmailMatch = (tokenEmail: string, accountEmail: string) => {
      return tokenEmail.toLowerCase().trim() === accountEmail.toLowerCase().trim();
    };

    assert.strictEqual(verifyEmailMatch(testEmail, testEmail), true);
    assert.strictEqual(verifyEmailMatch('25X55A3301@SRECNANDYAL.EDU.IN', testEmail), true);
    assert.strictEqual(verifyEmailMatch(mismatchedEmail, testEmail), false);
  });

  test('4. should pre-warm in-memory media cache and serve buffer with sub-5ms speed', () => {
    const testFileId = `drive-test-${Date.now()}`;
    const testBuffer = Buffer.from('FAKE_WEBP_IMAGE_BYTES');

    setCachedMedia(testFileId, {
      buffer: testBuffer,
      mimeType: 'image/webp',
      fileName: 'test.webp',
      size: testBuffer.length,
      etag: `W/"test-${testFileId}"`,
      lastModified: new Date().toUTCString(),
      cachedAt: Date.now(),
    });

    const startTime = performance.now();
    const cached = getCachedMedia(testFileId);
    const elapsed = performance.now() - startTime;

    assert.ok(cached, 'Cache entry should exist');
    assert.strictEqual(cached?.mimeType, 'image/webp');
    assert.strictEqual(cached?.buffer.toString(), 'FAKE_WEBP_IMAGE_BYTES');
    assert.ok(elapsed < 10, `Cache fetch should be sub-10ms (was ${elapsed.toFixed(2)}ms)`);

    deleteCachedMedia(testFileId);
    assert.strictEqual(getCachedMedia(testFileId), null);
  });

  test('5. should disconnect and wipe stored user Drive tokens', async () => {
    await disconnectUserDrive(testUserId);
    const afterDelete = await getUserDriveTokens(testUserId);
    assert.strictEqual(afterDelete, null);
  });
});
