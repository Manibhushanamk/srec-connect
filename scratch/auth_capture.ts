import { chromium } from 'playwright';

async function main() {
  console.log('Launching browser for authenticated capture...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1. Sign in as HOD
  console.log('Navigating to signin dev mode...');
  await page.goto('http://localhost:3000/signin?dev=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  console.log('Clicking HOD persona button...');
  await page.click('button:has-text("HOD (AIML)")');
  await page.waitForTimeout(3000);

  // 2. Capture Admin Events page as HOD
  console.log('Navigating to /admin/events...');
  await page.goto('http://localhost:3000/admin/events', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0/validate_hod_admin_events.png' });

  // 3. Capture HOD Profile Workspace
  console.log('Navigating to /profile...');
  await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0/validate_hod_profile.png' });

  // 4. Capture Authenticated Grievances Desk as HOD
  console.log('Navigating to /grievances...');
  await page.goto('http://localhost:3000/grievances', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0/validate_hod_grievances.png' });

  await browser.close();
  console.log('Authenticated capture completed successfully!');
}

main().catch(console.error);
