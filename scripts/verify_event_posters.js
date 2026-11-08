const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // 1. Public Events Directory
  console.log('Visiting /events...');
  await page.goto('http://localhost:3000/events', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_events_posters_directory.png') });

  // 2. Public Event Detail Hero Poster
  console.log('Visiting /events/evt-aiml-1...');
  await page.goto('http://localhost:3000/events/evt-aiml-1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_event_detail_hero_poster.png') });

  // 3. Admin Events Manager
  console.log('Visiting /admin/events with Super Admin cookie...');
  // Mock session token for admin
  await context.addCookies([
    {
      name: 'next-auth.session-token',
      value: 'mock-super-admin-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  await page.goto('http://localhost:3000/admin/events', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_admin_events_thumbnails.png') });

  await browser.close();
  console.log('Event posters verification completed successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
