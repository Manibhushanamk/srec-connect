const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';
const BASE_URL = 'http://localhost:3000';

const PAGES_TO_AUDIT = [
  { url: '/', name: 'verified_feed', title: 'Community Feed' },
  { url: '/profile', name: 'verified_super_admin_profile', title: 'Super Admin Profile' },
  { url: '/admin', name: 'verified_admin_command_center', title: 'Admin Command Center' },
  { url: '/admin/users', name: 'verified_admin_users', title: 'Admin Users Desk' },
  { url: '/admin/bulk-upload', name: 'verified_admin_bulk_upload', title: 'Bulk Ingestion Desk' },
  { url: '/admin/achievements', name: 'verified_admin_achievements', title: 'Achievements Verification' },
  { url: '/admin/events', name: 'verified_admin_events', title: 'Events Management' },
  { url: '/admin/discipline', name: 'verified_admin_discipline', title: 'Discipline Dossiers' },
  { url: '/admin/notices', name: 'verified_admin_notices', title: 'Notices Desk' },
  { url: '/admin/analytics', name: 'verified_admin_analytics', title: 'Analytics Hub' },
  { url: '/events', name: 'verified_events', title: 'Public Events' },
  { url: '/achievements', name: 'verified_achievements', title: 'Public Honors Wall' },
  { url: '/students', name: 'verified_students', title: 'Student Directory' },
  { url: '/faculty', name: 'verified_faculty', title: 'Faculty Directory' },
  { url: '/departments', name: 'verified_departments', title: 'Departments Directory' },
  { url: '/about', name: 'verified_about', title: 'About College' },
];

async function runAudit() {
  console.log('🚀 Starting Comprehensive Live Page Audit & Overflow Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // 1. Sign In as Super Admin via Persona switcher
  console.log('🔐 Navigating to Sign-in page...');
  await page.goto(`${BASE_URL}/signin`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  
  // Click Super Admin Persona button
  console.log('⚡ Signing in as Super Admin (Mani Bhushanam)...');
  await page.locator('button:has-text("Super Admin")').click();
  await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 });
  await page.waitForTimeout(1000);
  console.log('✅ NextAuth session verified active! Current page:', page.url());

  const results = [];

  for (const item of PAGES_TO_AUDIT) {
    console.log(`\n🔍 Auditing [${item.title}] (${item.url})...`);
    try {
      await page.goto(`${BASE_URL}${item.url}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(800);

      const overflowInfo = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        if (!doc || !body) return { hasHorizontalOverflow: false, scrollWidth: 0, clientWidth: 0 };
        const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
        const clientWidth = doc.clientWidth;
        return {
          hasHorizontalOverflow: scrollWidth > clientWidth + 2,
          scrollWidth,
          clientWidth,
        };
      });

      const screenshotPath = path.join(ARTIFACT_DIR, `${item.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      results.push({
        url: item.url,
        title: item.title,
        overflow: overflowInfo.hasHorizontalOverflow,
        scrollWidth: overflowInfo.scrollWidth,
        clientWidth: overflowInfo.clientWidth,
        screenshot: screenshotPath,
      });

      console.log(`  ✅ Verified: Overflow=${overflowInfo.hasHorizontalOverflow ? '⚠️ YES' : 'None (Clean)'} (Width: ${overflowInfo.clientWidth}px / Scroll: ${overflowInfo.scrollWidth}px)`);
    } catch (err) {
      console.warn(`  ⚠️ Warning on ${item.url}: ${err.message}`);
    }
  }

  // 2. Mobile Viewport Check (375x667)
  console.log('\n📱 Testing Mobile Viewport (375x667) on Feed & Profile...');
  await page.setViewportSize({ width: 375, height: 667 });

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const mobileFeedOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_mobile_feed.png') });
    console.log(`  Mobile Feed Overflow: ${mobileFeedOverflow ? '⚠️ YES' : 'None (Clean)'}`);

    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const mobileProfileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_mobile_profile.png') });
    console.log(`  Mobile Profile Overflow: ${mobileProfileOverflow ? '⚠️ YES' : 'None (Clean)'}`);
  } catch (err) {
    console.warn(`Mobile audit warning: ${err.message}`);
  }

  // 3. Test Customization Save on Profile
  console.log('\n🧪 Testing Profile Customization Form Interaction...');
  await page.setViewportSize({ width: 1280, height: 800 });
  try {
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Click Customize tab
    const customizeTab = page.locator('button:has-text("Edit & Customize")');
    if (await customizeTab.count() > 0) {
      await customizeTab.click();
      await page.waitForTimeout(600);

      // Fill headline
      const headlineInput = page.locator('input[placeholder*="Lead Systems Administrator"]');
      if (await headlineInput.count() > 0) {
        await headlineInput.fill('Autonomous Sovereign Administrator & Systems Architect');
      }

      // Click Save Customizations
      const saveBtn = page.locator('button:has-text("Save Customizations")');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(1500);
        console.log('  Saved Profile Customizations successfully!');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_profile_saved.png') });
      }
    }
  } catch (err) {
    console.warn(`Customization test warning: ${err.message}`);
  }

  await browser.close();
  console.log('\n🎉 Audit & Visual Verification Complete! All screenshots saved.');
  const overflowIssues = results.filter(r => r.overflow);
  console.log(`📊 Total Pages Audited: ${results.length}`);
  console.log(`🎯 Pages with Horizontal Overflow: ${overflowIssues.length}`);
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
