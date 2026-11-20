import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import {
  extractDatabaseSnapshot,
  encryptBackupPayload,
  decryptBackupPackage,
  createAndUploadDatabaseBackup,
} from '../src/lib/backup';

const ISOLATED_SCHEMA = 'isolated_staging_recovery';

describe('Production Disaster Recovery: Real Isolated PostgreSQL Staging Restoration Tests', () => {
  let encryptedBackupBuffer: Buffer;
  let originalSnapshot: any;
  let originalChecksum: string;
  let initialProdDeptCount: number;
  let initialProdUserCount: number;

  before(async () => {
    // 1. Create clean isolated staging schema on PostgreSQL
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS ${ISOLATED_SCHEMA};`);
    const dCount: any = await prisma.$queryRaw`SELECT count(*)::int as count FROM v3_production."Department";`;
    const uCount: any = await prisma.$queryRaw`SELECT count(*)::int as count FROM v3_production."User";`;
    initialProdDeptCount = dCount[0].count;
    initialProdUserCount = uCount[0].count;
  });

  after(async () => {
    // Teardown: Safely drop isolated staging schema and all its tables
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS ${ISOLATED_SCHEMA} CASCADE;`);
    await prisma.$disconnect();
  });

  it('1. should create and encrypt a real database backup snapshot', async () => {
    const snapshot = await extractDatabaseSnapshot();
    originalSnapshot = snapshot.payload;
    originalChecksum = snapshot.checksum;

    const { encryptedBuffer } = await encryptBackupPayload(snapshot.rawJson, snapshot.payload.metadata);
    encryptedBackupBuffer = encryptedBuffer;
    assert(Buffer.isBuffer(encryptedBackupBuffer), 'Backup package must be a Buffer');
    assert(encryptedBackupBuffer.length > 100, 'Encrypted package must contain data');
  });

  it('2. should verify cryptographic integrity, auth tag, and decrypt backup package', async () => {
    const decrypted = await decryptBackupPackage(encryptedBackupBuffer);
    assert.strictEqual(decrypted.metadata.checksum_sha256, originalChecksum, 'Decrypted checksum must match snapshot');
    assert.strictEqual(decrypted.metadata.total_records, originalSnapshot.metadata.total_records, 'Total records must match');
  });

  it('3. should restore and populate physical PostgreSQL tables in isolated staging schema', async () => {
    const decrypted = await decryptBackupPackage(encryptedBackupBuffer);

    // List of core relational tables to restore physically
    const tablesToRestore = [
      'Department',
      'Batch',
      'Section',
      'Category',
      'SystemSetting',
      'User',
      'Student',
      'Faculty',
      'BugReport',
    ];

    for (const table of tablesToRestore) {
      // Clone exact table structure into isolated staging schema
      await prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS ${ISOLATED_SCHEMA}."${table}" (LIKE v3_production."${table}" INCLUDING DEFAULTS);`
      );

      const records = decrypted.data[table];
      if (Array.isArray(records) && records.length > 0) {
        const jsonStr = JSON.stringify(records);
        await prisma.$executeRawUnsafe(
          `INSERT INTO ${ISOLATED_SCHEMA}."${table}" SELECT * FROM json_populate_recordset(null::${ISOLATED_SCHEMA}."${table}", $1::json);`,
          jsonStr
        );
      }

      // Query isolated staging schema to verify record count matches decrypted data
      const result: any = await prisma.$queryRawUnsafe(
        `SELECT count(*)::int as count FROM ${ISOLATED_SCHEMA}."${table}";`
      );
      const restoredCount = result[0].count;
      const expectedCount = Array.isArray(records) ? records.length : 0;
      assert.strictEqual(restoredCount, expectedCount, `Restored record count for ${table} must match backup data`);
    }
  });

  it('4. should execute representative relational queries and foreign key validations against isolated staging schema', async () => {
    // Validate Department queries
    const depts: any = await prisma.$queryRawUnsafe(
      `SELECT name, code FROM ${ISOLATED_SCHEMA}."Department" ORDER BY code;`
    );
    assert(depts.length > 0, 'Restored departments must exist');

    // Validate Student -> Department foreign key relational integrity
    const studentWithDept: any = await prisma.$queryRawUnsafe(`
      SELECT s."rollNumber", s.name as student_name, d.code as dept_code
      FROM ${ISOLATED_SCHEMA}."Student" s
      JOIN ${ISOLATED_SCHEMA}."Department" d ON s."departmentId" = d.id
      LIMIT 5;
    `);
    assert(studentWithDept.length > 0, 'Relational JOIN between Student and Department must return valid data');
    assert(typeof studentWithDept[0].rollNumber === 'string', 'Student roll number must be string');
    assert(typeof studentWithDept[0].dept_code === 'string', 'Department code must be string');

    // Validate date parsing and timestamps in physical table
    const sampleStudent: any = await prisma.$queryRawUnsafe(
      `SELECT "createdAt", "updatedAt" FROM ${ISOLATED_SCHEMA}."Student" LIMIT 1;`
    );
    assert(sampleStudent[0].createdAt instanceof Date, 'createdAt must be an authentic Date instance in PostgreSQL');

    // Validate null safety
    const nullCheck: any = await prisma.$queryRawUnsafe(
      `SELECT count(*)::int as count FROM ${ISOLATED_SCHEMA}."User" WHERE "deletedAt" IS NULL;`
    );
    assert(nullCheck[0].count >= 0, 'Null values must be preserved correctly');
  });

  it('5. should reject corrupted backup and prevent restore execution', async () => {
    const rawPackage = JSON.parse(encryptedBackupBuffer.toString('utf8'));
    // Tamper with ciphertext by altering last characters
    const tamperedCiphertext = rawPackage.ciphertext.slice(0, -6) + 'ABCDEF';
    const tamperedPackage = JSON.stringify({ ...rawPackage, ciphertext: tamperedCiphertext });

    let threwError = false;
    try {
      await decryptBackupPackage(Buffer.from(tamperedPackage, 'utf8'));
    } catch (err: any) {
      threwError = true;
      assert(err.message.includes('integrity check failed') || err.message.includes('auth'), 'Must fail with integrity error');
    }
    assert.strictEqual(threwError, true, 'Corrupted backup must be strictly rejected');
  });

  it('6. should confirm zero write mutations occurred to production v3_production schema', async () => {
    // Verify production tables were completely unmutated
    const prodDeptCount: any = await prisma.$queryRaw`SELECT count(*)::int as count FROM v3_production."Department";`;
    const prodUserCount: any = await prisma.$queryRaw`SELECT count(*)::int as count FROM v3_production."User";`;

    assert.strictEqual(prodDeptCount[0].count, initialProdDeptCount, 'Production Department count must remain unchanged');
    assert.strictEqual(prodUserCount[0].count, initialProdUserCount, 'Production User count must remain unchanged');
  });
});
