import { chromium } from 'playwright';

async function main() {
  console.log('Launching browser for verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1. Sign in as HOD (manibhushanam5k@gmail.com)
  console.log('Navigating to signin dev mode...');
  await page.goto('http://localhost:3000/signin?dev=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  console.log('Clicking HOD (AIML) persona...');
  await page.click('button:has-text("HOD (AIML)")');
  await page.waitForTimeout(3000);

  // 2. Capture Profile
  console.log('Capturing /profile...');
  await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0/validate_hod_profile.png' });

  // 3. Capture Achievements
  console.log('Capturing /achievements...');
  await page.goto('http://localhost:3000/achievements', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0/validate_achievements_2col.png' });

  await browser.close();
  console.log('Screenshots captured successfully!');
}

main().catch(console.error);
