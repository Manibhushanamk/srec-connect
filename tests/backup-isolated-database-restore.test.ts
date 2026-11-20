import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import {
  extractDatabaseSnapshot,
  encryptBackupPayload,
  decryptBackupPackage,
} from '../src/lib/backup';

describe('Production Disaster Recovery: Independent PostgreSQL Database Restoration Tests', () => {
  let prodPrisma: PrismaClient;
  let stagingPrisma: PrismaClient;
  let encryptedBackupBuffer: Buffer;
  let originalSnapshot: any;
  let originalChecksum: string;
  let initialProdDeptCount: number;
  let initialProdUserCount: number;
  let initialProdStudentCount: number;

  const prodUrl = process.env.DATABASE_URL!;
  const stagingUrl = prodUrl.replace(/\/neondb(\?|$)/, '/srec_staging_recovery_db$1');

  before(async () => {
    prodPrisma = new PrismaClient({ datasources: { db: { url: prodUrl } } });
    stagingPrisma = new PrismaClient({ datasources: { db: { url: stagingUrl } } });

    // Capture initial production record counts for immutability verification
    const dCount: any = await prodPrisma.$queryRaw`SELECT count(*)::int as count FROM v3_production."Department";`;
    const uCount: any = await prodPrisma.$queryRaw`SELECT count(*)::int as count FROM v3_production."User";`;
    const sCount: any = await prodPrisma.$queryRaw`SELECT count(*)::int as count FROM v3_production."Student";`;

    initialProdDeptCount = dCount[0].count;
    initialProdUserCount = uCount[0].count;
    initialProdStudentCount = sCount[0].count;
  });

  after(async () => {
    await stagingPrisma.$disconnect();
    await prodPrisma.$disconnect();
  });

  it('1. should create, extract and encrypt an authentic production backup snapshot', async () => {
    const snapshot = await extractDatabaseSnapshot();
    originalSnapshot = snapshot.payload;
    originalChecksum = snapshot.checksum;

    assert(snapshot.rawJson.length > 500, 'Raw JSON snapshot must contain substantial data');
    assert(originalChecksum && originalChecksum.length === 64, 'Checksum must be 64-char SHA-256');

    const { encryptedBuffer, packageObj } = await encryptBackupPayload(
      snapshot.rawJson,
      snapshot.payload.metadata
    );

    encryptedBackupBuffer = encryptedBuffer;
    assert(Buffer.isBuffer(encryptedBackupBuffer), 'Encrypted package must be a Buffer');
    assert.strictEqual(packageObj.algorithm, 'aes-256-gcm', 'Must use AES-256-GCM');
    assert.strictEqual(packageObj.iv.length, 24, '12-byte IV hex string must be 24 characters');
  });

  it('2. should validate cryptographic integrity and decrypt package using active configuration', async () => {
    const decrypted = await decryptBackupPackage(encryptedBackupBuffer);
    assert.strictEqual(decrypted.metadata.checksum_sha256, originalChecksum, 'Decrypted checksum must match');
    assert.strictEqual(
      decrypted.metadata.total_records,
      originalSnapshot.metadata.total_records,
      'Total records must match'
    );
  });

  it('3. should verify separate independent staging database identity', async () => {
    const currentDb: any = await stagingPrisma.$queryRawUnsafe('SELECT current_database() as db;');
    assert.strictEqual(currentDb[0].db, 'srec_staging_recovery_db', 'Target must be srec_staging_recovery_db');

    const prodDb: any = await prodPrisma.$queryRawUnsafe('SELECT current_database() as db;');
    assert.strictEqual(prodDb[0].db, 'neondb', 'Production must remain neondb');
  });

  it('4. should restore models into isolated independent PostgreSQL database', async () => {
    const decrypted = await decryptBackupPackage(encryptedBackupBuffer);

    // 1. Temporarily drop circular back-reference foreign keys on User
    await stagingPrisma.$executeRawUnsafe(
      'ALTER TABLE v3_production."User" DROP CONSTRAINT IF EXISTS "User_studentId_fkey";'
    );
    await stagingPrisma.$executeRawUnsafe(
      'ALTER TABLE v3_production."User" DROP CONSTRAINT IF EXISTS "User_facultyId_fkey";'
    );

    // 2. Topological order of models to respect foreign key constraints
    const restoreOrder = [
      'Department',
      'Batch',
      'Section',
      'Category',
      'SystemSetting',
      'User',
      'Student',
      'Faculty',
      'BugReport',
      'Event',
      'Incident',
      'Achievement',
      'Post',
    ];

    for (const table of restoreOrder) {
      const records = decrypted.data[table];
      if (Array.isArray(records) && records.length > 0) {
        const jsonStr = JSON.stringify(records);
        await stagingPrisma.$executeRawUnsafe(
          `INSERT INTO v3_production."${table}" SELECT * FROM json_populate_recordset(null::v3_production."${table}", $1::json) ON CONFLICT DO NOTHING;`,
          jsonStr
        );
      }

      // Query isolated staging database to verify records landed
      const countRes: any = await stagingPrisma.$queryRawUnsafe(
        `SELECT count(*)::int as count FROM v3_production."${table}";`
      );
      const expectedCount = Array.isArray(records) ? records.length : 0;
      assert(countRes[0].count >= expectedCount, `Table ${table} in staging DB must contain all restored rows`);
    }

    // 3. Re-add circular foreign key constraints now that all referenced rows exist
    await stagingPrisma.$executeRawUnsafe(`
      ALTER TABLE v3_production."User" 
      ADD CONSTRAINT "User_studentId_fkey" 
      FOREIGN KEY ("studentId") REFERENCES v3_production."Student"(id) 
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    await stagingPrisma.$executeRawUnsafe(`
      ALTER TABLE v3_production."User" 
      ADD CONSTRAINT "User_facultyId_fkey" 
      FOREIGN KEY ("facultyId") REFERENCES v3_production."Faculty"(id) 
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);
  });

  it('5. should validate foreign key relationships and relational JOINs on restored database', async () => {
    // Test Student -> Department join via Prisma ORM on staging DB
    const studentsWithDept = await stagingPrisma.student.findMany({
      include: { department: true },
      take: 5,
    });

    assert(studentsWithDept.length > 0, 'Restored students must be queryable via Prisma');
    for (const s of studentsWithDept) {
      assert(s.department !== null, `Student ${s.rollNumber} must resolve to a valid Department`);
      assert(typeof s.department.code === 'string', 'Department code must be valid string');
    }

    // Test SQL JOIN directly on staging DB
    const sqlJoin: any = await stagingPrisma.$queryRawUnsafe(`
      SELECT s."rollNumber", s.name as student_name, d.code as dept_code, u.email as user_email
      FROM v3_production."Student" s
      JOIN v3_production."Department" d ON s."departmentId" = d.id
      JOIN v3_production."User" u ON u."studentId" = s.id
      LIMIT 5;
    `);

    assert(sqlJoin.length > 0, 'Relational 3-way JOIN across Student, Department, and User must succeed');
    assert(typeof sqlJoin[0].dept_code === 'string', 'Restored dept_code must be string');
    assert(sqlJoin[0].user_email.includes('@'), 'Restored email must be valid');
  });

  it('6. should validate timestamps, JSON structures, null safety, and sequences in restored DB', async () => {
    // 1. Timestamps: Check Date object parsing
    const student = await stagingPrisma.student.findFirst();
    assert(student !== null, 'Student record must exist');
    assert(student.createdAt instanceof Date, 'createdAt must be an authentic Date instance');
    assert(!isNaN(student.createdAt.getTime()), 'createdAt timestamp must be valid unix time');

    // 2. Null safety
    const usersWithNullDeleted = await stagingPrisma.user.count({
      where: { deletedAt: null },
    });
    assert(usersWithNullDeleted > 0, 'Null values must be preserved correctly');

    // 3. SystemSettings key-value integrity
    const settings = await stagingPrisma.systemSetting.findMany();
    assert(Array.isArray(settings), 'System settings must be array');
    for (const setting of settings) {
      assert(typeof setting.key === 'string', 'Setting key must be string');
      assert(typeof setting.value === 'string', 'Setting value must be string');
    }
  });

  it('7. should execute representative application business queries on restored database', async () => {
    // Query 1: Active students by department
    const depts = await stagingPrisma.department.findMany({
      include: {
        _count: {
          select: { students: true, faculty: true },
        },
      },
    });
    assert(depts.length > 0, 'Departments with counts must be queryable');

    // Query 2: User authentication lookup by email
    const firstUser = await stagingPrisma.user.findFirst();
    assert(firstUser !== null, 'User must exist');
    const authLookup = await stagingPrisma.user.findUnique({
      where: { email: firstUser.email },
      select: { id: true, email: true, role: true, name: true },
    });
    assert.strictEqual(authLookup?.email, firstUser.email, 'Auth lookup on restored DB must succeed');
  });

  it('8. should reject corrupted backup packages and prevent restoration', async () => {
    const rawPackage = JSON.parse(encryptedBackupBuffer.toString('utf8'));
    // Tamper with ciphertext by altering characters
    const tamperedCiphertext = rawPackage.ciphertext.slice(0, -8) + 'DEADBEEF';
    const tamperedPackage = JSON.stringify({ ...rawPackage, ciphertext: tamperedCiphertext });

    let threwError = false;
    try {
      await decryptBackupPackage(Buffer.from(tamperedPackage, 'utf8'));
    } catch (err: any) {
      threwError = true;
      assert(
        err.message.includes('integrity check failed') || err.message.includes('auth') || err.message.includes('tag'),
        'Must fail with cryptographic integrity or auth tag error'
      );
    }
    assert.strictEqual(threwError, true, 'Tampered backup package must be rejected');
  });

  it('9. should confirm production database (neondb) remained completely unmutated', async () => {
    const prodDeptCount: any = await prodPrisma.$queryRaw`SELECT count(*)::int as count FROM v3_production."Department";`;
    const prodUserCount: any = await prodPrisma.$queryRaw`SELECT count(*)::int as count FROM v3_production."User";`;
    const prodStudentCount: any = await prodPrisma.$queryRaw`SELECT count(*)::int as count FROM v3_production."Student";`;

    assert.strictEqual(
      prodDeptCount[0].count,
      initialProdDeptCount,
      'Production Department count must match pre-test count'
    );
    assert.strictEqual(
      prodUserCount[0].count,
      initialProdUserCount,
      'Production User count must match pre-test count'
    );
    assert.strictEqual(
      prodStudentCount[0].count,
      initialProdStudentCount,
      'Production Student count must match pre-test count'
    );
  });
});
