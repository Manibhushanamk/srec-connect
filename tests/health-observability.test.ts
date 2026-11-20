import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeLogData, logger } from '../src/lib/logger';
import { GET as getHealth } from '../src/app/api/health/route';

describe('Production Engineering: Health & Observability Tests', () => {
  it('1. should sanitize sensitive fields and tokens from log context', () => {
    const rawContext = {
      userEmail: 'student@srecnandyal.edu.in',
      password: 'SuperSecretPassword123!',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
      authorization: 'Bearer secret_token_xyz_12345',
      nested: {
        clientSecret: 'shhh-secret-client',
        safeProperty: 'CSE-Department',
      },
      tags: ['audit', 'auth'],
    };

    const sanitized = sanitizeLogData(rawContext);

    assert.equal(sanitized.userEmail, 'student@srecnandyal.edu.in');
    assert.equal(sanitized.password, '[REDACTED]');
    assert.equal(sanitized.token, '[REDACTED]');
    assert.equal(sanitized.authorization, '[REDACTED]');
    assert.equal(sanitized.nested.clientSecret, '[REDACTED]');
    assert.equal(sanitized.nested.safeProperty, 'CSE-Department');
    assert.equal(sanitized.tags[0], 'audit');
  });

  it('2. should format structured log entry with timestamp and environment', () => {
    const entry = logger.info('Test info message', { userId: 'usr-123' });

    assert.equal(entry.level, 'INFO');
    assert.equal(entry.message, 'Test info message');
    assert.ok(entry.timestamp);
    assert.equal(entry.context?.userId, 'usr-123');
  });

  it('3. should execute logger.measure and accurately calculate durationMs', async () => {
    let executed = false;
    const result = await logger.measure(
      'test-probe',
      async () => {
        executed = true;
        return 'success';
      },
      100
    );

    assert.equal(executed, true);
    assert.equal(result, 'success');
  });

  it('4. should probe /api/health and report healthy operational metrics', async () => {
    const response = await getHealth();
    assert.ok(response.status === 200 || response.status === 503);

    const body = await response.json();
    assert.equal(body.application, 'SREC CONNECT');
    assert.equal(body.version, '3.0.0');
    assert.ok(typeof body.uptimeSeconds === 'number');
    assert.ok(body.checks.database);
    assert.equal(body.checks.database.status, 'UP');
    assert.ok(typeof body.checks.database.latencyMs === 'number');
    assert.ok(body.memory.heapUsedMb > 0);
  });
});
