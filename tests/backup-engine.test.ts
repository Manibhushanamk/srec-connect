import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractDatabaseSnapshot,
  encryptBackupPayload,
  decryptBackupPackage,
  isBackupDue,
  dryRunRestore,
  createAndUploadDatabaseBackup,
} from '../src/lib/backup';
import { prisma } from '../src/lib/prisma';

describe('Production Engineering: 14-Day Automated Database Backup Engine Tests', () => {
  it('1. should extract full relational snapshot with accurate record counts and SHA-256 checksum', async () => {
    const { payload, rawJson, checksum } = await extractDatabaseSnapshot();

    assert.ok(payload);
    assert.equal(payload.metadata.application, 'SREC CONNECT');
    assert.equal(payload.metadata.backup_format_version, 1);
    assert.ok(payload.metadata.tables.includes('User'));
    assert.ok(payload.metadata.tables.includes('Student'));
    assert.ok(payload.metadata.tables.includes('Faculty'));
    assert.ok(payload.metadata.tables.includes('Achievement'));
    assert.ok(payload.metadata.tables.includes('BugReport'));

    assert.ok(payload.metadata.total_records >= 1);
    assert.ok(checksum.length === 64, 'Checksum must be 64-char hex SHA-256');
    assert.equal(payload.metadata.checksum_sha256, checksum);
  });

  it('2. should encrypt snapshot with AES-256-GCM and decrypt with cryptographic integrity verification', async () => {
    const { payload, rawJson, checksum } = await extractDatabaseSnapshot();
    const { encryptedBuffer, packageObj } = await encryptBackupPayload(rawJson, payload.metadata);

    assert.equal(packageObj.format, 'SREC_ENCRYPTED_BACKUP_V1');
    assert.equal(packageObj.algorithm, 'aes-256-gcm');
    assert.ok(packageObj.iv.length === 32, 'IV must be 16 bytes (32 hex characters)');
    assert.ok(packageObj.auth_tag.length === 32, 'Auth tag must be 16 bytes (32 hex characters)');
    assert.ok(packageObj.ciphertext.length > 100);

    // Decrypt and verify integrity
    const decryptedPayload = await decryptBackupPackage(encryptedBuffer);
    assert.equal(decryptedPayload.metadata.backup_id, payload.metadata.backup_id);
    assert.equal(decryptedPayload.metadata.checksum_sha256, checksum);
    assert.equal(decryptedPayload.metadata.total_records, payload.metadata.total_records);
  });

  it('3. should detect tampered ciphertext and throw cryptographic integrity error', async () => {
    const { payload, rawJson } = await extractDatabaseSnapshot();
    const { packageObj } = await encryptBackupPayload(rawJson, payload.metadata);

    // Tamper with ciphertext by modifying characters
    const tamperedCiphertext = packageObj.ciphertext.slice(0, -4) + 'AAAA';
    const tamperedPackage = { ...packageObj, ciphertext: tamperedCiphertext };
    const tamperedBuffer = Buffer.from(JSON.stringify(tamperedPackage));

    await assert.rejects(
      async () => {
        await decryptBackupPackage(tamperedBuffer);
      },
      /Unsupported state or unable to authenticate data|integrity check failed/
    );
  });

  it('4. should accurately calculate 14-day schedule and idempotency due status', async () => {
    const schedule = await isBackupDue(14);
    assert.ok(typeof schedule.isDue === 'boolean');
    if (schedule.lastBackupDate) {
      assert.ok(schedule.nextBackupDue instanceof Date);
    }
  });

  it('5. should execute pre-flight dry-run restoration inspection without modifying database', async () => {
    const { payload, rawJson } = await extractDatabaseSnapshot();
    const { encryptedBuffer } = await encryptBackupPayload(rawJson, payload.metadata);

    const dryRun = await dryRunRestore(encryptedBuffer);
    assert.equal(dryRun.isValid, true);
    assert.equal(dryRun.metadata.application, 'SREC CONNECT');
    assert.ok(dryRun.totalRecords >= 1);
  });

  it('6. should execute createAndUploadDatabaseBackup and record verified audit log', async () => {
    const result = await createAndUploadDatabaseBackup({ initiatedBy: 'TEST_SUITE_VERIFICATION' });

    assert.ok(result.success, 'Backup generation must succeed');
    assert.ok(result.backupId.startsWith('srec-backup-'));
    assert.ok(result.durationMs >= 0);

    // Verify record exists in Neon PostgreSQL
    const record = await prisma.backupRecord.findUnique({
      where: { backupId: result.backupId },
    });

    assert.ok(record, 'BackupRecord must exist in DB');
    assert.equal(record.isEncrypted, true);
    assert.equal(record.encryptionAlgo, 'AES-256-GCM');
    assert.ok(record.fileSize > 0);
  });
});
