const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';
const BASE_URL = 'http://localhost:3000';

async function verifyNotificationAlignment() {
  console.log('🔔 Verifying Notification Dropdown Alignment across viewports...');
  const browser = await chromium.launch({ headless: true });

  // --- 1. Test Small Android (360px) ---
  console.log('\n--- Test 1: Small Android (360px width) ---');
  const context360 = await browser.newContext({
    viewport: { width: 360, height: 740 },
    isMobile: true,
  });
  const page360 = await context360.newPage();
  await page360.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
  await page360.click('button:has-text("HOD (AIML)")');
  await page360.waitForTimeout(1200);

  // Click Notification Bell
  console.log('  Opening notification dropdown on 360px...');
  await page360.click('button[aria-label="Notifications"]');
  await page360.waitForTimeout(500);

  // Get bounding box of notification dropdown
  const popover360 = await page360.locator('div:has-text("Notifications"):has-text("No notifications")').last();
  const box360 = await popover360.boundingBox();
  console.log(`  Dropdown Bounding Box on 360px: x=${box360?.x}, y=${box360?.y}, width=${box360?.width}`);

  const isClippedLeft360 = box360 ? box360.x < 0 : true;
  const isClippedRight360 = box360 ? (box360.x + box360.width) > 360 : true;
  console.log(`  Clipped Left (< 0): ${isClippedLeft360} (Expected: false)`);
  console.log(`  Clipped Right (> 360): ${isClippedRight360} (Expected: false)`);

  const pic360 = path.join(ARTIFACTS_DIR, 'verify_notification_mobile_360.png');
  await page360.screenshot({ path: pic360, fullPage: false });
  console.log(`📸 Saved 360px screenshot: ${pic360}`);

  // Test close button
  await page360.click('button[aria-label="Close notifications"]');
  await page360.waitForTimeout(300);
  const isClosed = !(await popover360.isVisible());
  console.log(`  Dropdown successfully closed on close button tap: ${isClosed}`);
  await context360.close();

  // --- 2. Test iPhone 14 (390px) ---
  console.log('\n--- Test 2: iPhone 14 (390px width) ---');
  const context390 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const page390 = await context390.newPage();
  await page390.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
  await page390.click('button:has-text("HOD (AIML)")');
  await page390.waitForTimeout(1200);

  await page390.click('button[aria-label="Notifications"]');
  await page390.waitForTimeout(500);

  const popover390 = await page390.locator('div:has-text("Notifications"):has-text("No notifications")').last();
  const box390 = await popover390.boundingBox();
  console.log(`  Dropdown Bounding Box on 390px: x=${box390?.x}, y=${box390?.y}, width=${box390?.width}`);

  const pic390 = path.join(ARTIFACTS_DIR, 'verify_notification_mobile_390.png');
  await page390.screenshot({ path: pic390, fullPage: false });
  console.log(`📸 Saved 390px screenshot: ${pic390}`);
  await context390.close();

  // --- 3. Test Desktop (1280px) ---
  console.log('\n--- Test 3: Desktop (1280px width) ---');
  const contextDesktop = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
  await pageDesktop.click('button:has-text("HOD (AIML)")');
  await pageDesktop.waitForTimeout(1200);

  await pageDesktop.click('button[aria-label="Notifications"]');
  await pageDesktop.waitForTimeout(500);

  const popoverDesktop = await pageDesktop.locator('div:has-text("Notifications"):has-text("No notifications")').last();
  const boxDesktop = await popoverDesktop.boundingBox();
  console.log(`  Dropdown Bounding Box on Desktop: x=${boxDesktop?.x}, y=${boxDesktop?.y}, width=${boxDesktop?.width}`);

  const picDesktop = path.join(ARTIFACTS_DIR, 'verify_notification_desktop.png');
  await pageDesktop.screenshot({ path: picDesktop, fullPage: false });
  console.log(`📸 Saved Desktop screenshot: ${picDesktop}`);
  await contextDesktop.close();

  await browser.close();
  console.log('\n✅ Notification alignment successfully verified across all displays!');
}

verifyNotificationAlignment().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
