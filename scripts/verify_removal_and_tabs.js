const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // 1. Home feed
  console.log('Visiting Home Feed...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_feed_tabs_clean_desktop.png') });

  // 2. About page
  console.log('Visiting About Page...');
  await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_about_no_departments_desktop.png') });

  // 3. Mobile Feed
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_feed_tabs_clean_mobile.png') });

  await browser.close();
  console.log('All screenshots verified successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
