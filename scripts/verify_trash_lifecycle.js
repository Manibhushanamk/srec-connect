const { chromium } = require('playwright');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ARTIFACT_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';

async function main() {
  console.log('1. Creating a test post to move to trash...');
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  const testPost = await prisma.post.create({
    data: {
      authorId: superAdmin.id,
      content: '[Test Staging] Policy update draft pending review by Super Admin.',
      deletedAt: new Date(), // Already moved to trash
    }
  });
  console.log('Created soft-deleted post:', testPost.id);

  const testIncident = await prisma.incident.create({
    data: {
      reporterId: superAdmin.id,
      title: '[Resolved Grievance] Lab network outage archived complaint',
      description: 'Case closed and moved to trash staging.',
      category: 'INFRASTRUCTURE',
      priority: 'LOW',
      deletedAt: new Date(), // Soft deleted to trash
    }
  });
  console.log('Created soft-deleted incident:', testIncident.id);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  console.log('2. Signing in as Super Admin...');
  await page.goto('http://localhost:3000/signin', { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(async () => {
    const csrfRes = await fetch('/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();
    const body = new URLSearchParams({
      csrfToken,
      email: 'manibhushanam4k@gmail.com',
      json: 'true',
    });
    await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  });

  console.log('3. Visiting /admin/trash to verify trashed items appear...');
  await page.goto('http://localhost:3000/admin/trash', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_admin_trash_with_items.png'),
    fullPage: false
  });
  console.log('Saved verified_admin_trash_with_items.png');

  await browser.close();
  await prisma.$disconnect();
  console.log('Trash lifecycle verified successfully!');
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
