const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🚀 Starting Comprehensive Profile & Feed Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  // 1. Sign in as HOD: manibhushanam5k@gmail.com
  console.log('🔐 Signing in as HOD (manibhushanam5k@gmail.com)...');
  await page.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("HOD (AIML)")');
  await page.waitForTimeout(1500);

  // 2. Navigate to /profile
  console.log('📄 Navigating to /profile...');
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take screenshot of overview
  const profileOverviewPath = path.join(ARTIFACTS_DIR, 'verify_profile_overview_unified.png');
  await page.screenshot({ path: profileOverviewPath, fullPage: true });
  console.log(`📸 Saved profile overview screenshot to: ${profileOverviewPath}`);

  // Check header, sidebar and banner names
  const headerName = await page.locator('header a[href="/profile"] span').innerText().catch(() => '');
  const sidebarName = await page.locator('aside h4').first().innerText().catch(() => '');
  const bannerName = await page.locator('h1.text-xl').innerText().catch(() => '');
  console.log(`  Header Name: "${headerName}"`);
  console.log(`  Sidebar Name: "${sidebarName}"`);
  console.log(`  Banner Name: "${bannerName}"`);

  // 3. Test Edit & Customize tab
  console.log('✏️ Clicking Edit & Customize tab...');
  await page.click('button:has-text("Edit & Customize")');
  await page.waitForTimeout(600);

  const profileEditPath = path.join(ARTIFACTS_DIR, 'verify_profile_edit_credentials.png');
  await page.screenshot({ path: profileEditPath, fullPage: true });
  console.log(`📸 Saved profile edit screenshot to: ${profileEditPath}`);

  // 4. Test Home Feed navigation links
  console.log('🏠 Navigating to Home Feed...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const homeFeedPath = path.join(ARTIFACTS_DIR, 'verify_home_feed_author_links.png');
  await page.screenshot({ path: homeFeedPath, fullPage: true });
  console.log(`📸 Saved home feed screenshot to: ${homeFeedPath}`);

  // Check author link on first feed card
  const firstAuthorLink = await page.locator('article[id^="post-"] a[href^="/"]').first();
  const authorHref = await firstAuthorLink.getAttribute('href');
  console.log(`  First Post Author Link Target: ${authorHref}`);

  // Check mobile bottom nav submit button href
  const submitBtnHref = await page.locator('nav[aria-label="Mobile Navigation"] a[aria-label="Submit Achievement"]').getAttribute('href').catch(() => null);
  console.log(`  Mobile Center Button Href: ${submitBtnHref}`);

  await browser.close();
  console.log('✅ Visual verification completed successfully!');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
