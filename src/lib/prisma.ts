import { PrismaClient } from '@prisma/client';

// Self-healing: Enforce v3_production schema & pgbouncer pooling parameters across all environments
if (process.env.DATABASE_URL) {
  if (!process.env.DATABASE_URL.includes('schema=')) {
    const separator = process.env.DATABASE_URL.includes('?') ? '&' : '?';
    process.env.DATABASE_URL = `${process.env.DATABASE_URL}${separator}schema=v3_production`;
  }
  if (!process.env.DATABASE_URL.includes('pgbouncer=')) {
    const separator = process.env.DATABASE_URL.includes('?') ? '&' : '?';
    process.env.DATABASE_URL = `${process.env.DATABASE_URL}${separator}pgbouncer=true&connection_limit=10&pool_timeout=15&connect_timeout=15`;
  }
}

if (process.env.DIRECT_URL && !process.env.DIRECT_URL.includes('schema=')) {
  const separator = process.env.DIRECT_URL.includes('?') ? '&' : '?';
  process.env.DIRECT_URL = `${process.env.DIRECT_URL}${separator}schema=v3_production`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.DEBUG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
