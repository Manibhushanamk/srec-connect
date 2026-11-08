const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  console.log('1. Testing /profile for Log Out button...');
  try {
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    const logoutButtons = await page.locator('button:has-text("Log Out"), button:has-text("Sign Out")').count();
    console.log(`Found ${logoutButtons} Log Out buttons on /profile`);

    await page.screenshot({
      path: '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0/verified_profile_logout.png',
      fullPage: false
    });
    console.log('Saved verified_profile_logout.png');
  } catch (e) {
    console.error('Error verifying /profile:', e.message);
  }

  console.log('2. Testing /admin/trash dashboard...');
  try {
    await page.goto('http://localhost:3000/admin/trash', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0/verified_admin_trash.png',
      fullPage: false
    });
    console.log('Saved verified_admin_trash.png');
  } catch (e) {
    console.error('Error verifying /admin/trash:', e.message);
  }

  console.log('3. Testing /admin/users for Trash action buttons...');
  try {
    await page.goto('http://localhost:3000/admin/users', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0/verified_admin_users_trash.png',
      fullPage: false
    });
    console.log('Saved verified_admin_users_trash.png');
  } catch (e) {
    console.error('Error verifying /admin/users:', e.message);
  }

  await browser.close();
  console.log('All Playwright verifications finished.');
})();
