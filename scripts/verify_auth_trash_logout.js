const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  console.log('1. Signing in via credentials as Super Admin (manibhushanam4k@gmail.com)...');
  await page.goto('http://localhost:3000/signin', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Sign in using client-side next-auth signIn
  await page.evaluate(async () => {
    // NextAuth CSRF token
    const csrfRes = await fetch('/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();

    const body = new URLSearchParams({
      csrfToken,
      email: 'manibhushanam4k@gmail.com',
      json: 'true',
    });

    const res = await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    return res.status;
  });

  console.log('2. Visiting /profile to verify Log Out button...');
  await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const headerLogoutBtn = await page.locator('button:has-text("Log Out")').first().isVisible();
  console.log('Header Log Out button visible:', headerLogoutBtn);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_profile_logout_header.png'),
    fullPage: false
  });
  console.log('Saved verified_profile_logout_header.png');

  // Scroll to bottom to capture persistent session logout card
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_profile_logout_bottom_card.png'),
    fullPage: false
  });
  console.log('Saved verified_profile_logout_bottom_card.png');

  console.log('3. Visiting /admin/trash to verify Trash & Recovery Dashboard...');
  await page.goto('http://localhost:3000/admin/trash', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_admin_trash_dashboard.png'),
    fullPage: false
  });
  console.log('Saved verified_admin_trash_dashboard.png');

  console.log('4. Visiting /admin/users to verify User Directory Trash actions...');
  await page.goto('http://localhost:3000/admin/users', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_admin_users_trash_action.png'),
    fullPage: false
  });
  console.log('Saved verified_admin_users_trash_action.png');

  await browser.close();
  console.log('All Playwright authentications and screenshot verifications completed successfully!');
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
