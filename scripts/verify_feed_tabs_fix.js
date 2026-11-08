const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  // Desktop
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  
  console.log('Navigating to http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const desktopShot = path.join(ARTIFACT_DIR, 'verified_fixed_feed_tabs_desktop.png');
  await page.screenshot({ path: desktopShot, fullPage: false });
  console.log('Saved desktop shot to:', desktopShot);

  // Mobile
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  const mobileShot = path.join(ARTIFACT_DIR, 'verified_fixed_feed_tabs_mobile.png');
  await mobilePage.screenshot({ path: mobileShot, fullPage: false });
  console.log('Saved mobile shot to:', mobileShot);

  await browser.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
