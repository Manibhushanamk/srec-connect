const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';
const BASE_URL = 'http://localhost:3000';

async function runVisualInspection() {
  console.log('📸 Starting Full-Site Visual Inspection & Screenshot Capture...\n');
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const issues = [];
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });

  page.on('pageerror', (err) => {
    issues.push({ url: page.url(), type: 'PAGE_ERROR', message: err.message });
  });

  async function inspectPage(name, urlPath, opts = {}) {
    console.log(`\n--- Inspecting: ${name} (${urlPath}) ---`);
    const fullUrl = `${BASE_URL}${urlPath}`;
    try {
      const resp = await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(800);

      const status = resp ? resp.status() : 'unknown';
      console.log(`  HTTP Status: ${status}`);

      if (status >= 400) {
        issues.push({ name, url: urlPath, type: `HTTP_${status}`, message: `Returned HTTP ${status}` });
      }

      // Check for broken images
      const brokenImages = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
          .filter((img) => !img.complete || img.naturalWidth === 0)
          .map((img) => img.src || img.getAttribute('src'));
      });

      if (brokenImages.length > 0) {
        console.warn(`  ⚠️ Broken images found (${brokenImages.length}):`, brokenImages);
        issues.push({ name, url: urlPath, type: 'BROKEN_IMAGES', count: brokenImages.length, sources: brokenImages });
      }

      // Check for layout overflow
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const b = document.body;
        const scrollW = Math.max(doc.scrollWidth, b.scrollWidth);
        const clientW = doc.clientWidth;
        return { scrollW, clientW, isOverflow: scrollW > clientW };
      });

      if (overflow.isOverflow) {
        console.warn(`  ⚠️ Horizontal Overflow: scroll=${overflow.scrollW}px, client=${overflow.clientW}px`);
        issues.push({ name, url: urlPath, type: 'OVERFLOW', ...overflow });
      }

      // Take desktop screenshot
      const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const shotPath = path.join(ARTIFACTS_DIR, `site_${safeName}_desktop.png`);
      await page.screenshot({ path: shotPath, fullPage: opts.fullPage !== false });
      console.log(`  Captured desktop shot: site_${safeName}_desktop.png`);

      // Mobile check (375px)
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(400);

      const mobileOverflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const b = document.body;
        const scrollW = Math.max(doc.scrollWidth, b.scrollWidth);
        const clientW = doc.clientWidth;
        return { scrollW, clientW, isOverflow: scrollW > clientW };
      });

      if (mobileOverflow.isOverflow) {
        console.warn(`  ⚠️ Mobile 375px Overflow: scroll=${mobileOverflow.scrollW}px, client=${mobileOverflow.clientW}px`);
        issues.push({ name, url: urlPath, type: 'MOBILE_OVERFLOW', ...mobileOverflow });
      }

      const mobileShotPath = path.join(ARTIFACTS_DIR, `site_${safeName}_mobile.png`);
      await page.screenshot({ path: mobileShotPath, fullPage: opts.fullPage !== false });
      console.log(`  Captured mobile shot: site_${safeName}_mobile.png`);

      // Reset to desktop
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForTimeout(300);
    } catch (err) {
      console.error(`  ❌ Error inspecting ${urlPath}:`, err.message);
      issues.push({ name, url: urlPath, type: 'INSPECTION_CRASH', message: err.message });
    }
  }

  // 1. Inspect Public Pages (Logged out)
  console.log('=== PHASE 1: PUBLIC PAGES (ANONYMOUS) ===');
  await inspectPage('Home_Feed_Public', '/');
  await inspectPage('Sign_In_Page', '/signin');
  await inspectPage('Achievements_Honors_Wall', '/achievements');
  await inspectPage('Events_Directory', '/events');
  await inspectPage('Students_Directory', '/students');
  await inspectPage('Faculty_Directory', '/faculty');
  await inspectPage('Departments_Page', '/departments');
  await inspectPage('About_Page', '/about');

  // 2. Sign In As Super Admin
  console.log('\n=== PHASE 2: AUTHENTICATION AS SUPER ADMIN ===');
  await page.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Super Admin")');
  await page.waitForTimeout(1500);

  // 3. Inspect Authenticated User & Portal Pages
  console.log('\n=== PHASE 3: AUTHENTICATED PORTALS & WORKSPACES ===');
  await inspectPage('Home_Feed_Authenticated', '/');
  await inspectPage('User_Profile_Workspace', '/profile');
  await inspectPage('Grievances_Student_Portal', '/grievances');

  // 4. Inspect Dynamic Specific Detail Pages
  console.log('\n=== PHASE 4: DYNAMIC RECORD DETAIL PAGES ===');
  await inspectPage('Student_Portfolio_22091A3201', '/students/22091A3201');

  // Find a real event ID to inspect event detail page
  const eventLink = await page.evaluate(() => {
    const a = document.querySelector('a[href^="/events/"]');
    return a ? a.getAttribute('href') : null;
  });
  if (eventLink && eventLink !== '/events') {
    await inspectPage('Event_Detail_View', eventLink);
  }

  // 5. Inspect Admin Console Modules
  console.log('\n=== PHASE 5: ADMIN MANAGEMENT CONSOLE ===');
  await inspectPage('Admin_Command_Center', '/admin');
  await inspectPage('Admin_Users_Directory', '/admin/users');
  await inspectPage('Admin_Achievements_Verification', '/admin/achievements');
  await inspectPage('Admin_Events_Manager', '/admin/events');
  await inspectPage('Admin_Discipline_Manager', '/admin/discipline');
  await inspectPage('Admin_Notices_Broadcast', '/admin/notices');
  await inspectPage('Admin_Bulk_Ingestion', '/admin/bulk-upload');
  await inspectPage('Admin_Data_Export', '/admin/export');
  await inspectPage('Admin_Deduplication_Radar', '/admin/deduplication');
  await inspectPage('Admin_Analytics_Hub', '/admin/analytics');

  // Summary Report
  console.log('\n========================================');
  console.log('📊 INSPECTION SUMMARY REPORT');
  console.log('========================================');
  console.log(`Total Issues / Warnings Detected: ${issues.length}`);
  console.log(`Console Errors Logged: ${consoleErrors.length}`);

  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, 'inspection_report.json'),
    JSON.stringify({ issues, consoleErrors }, null, 2)
  );

  console.log('\nReport written to inspection_report.json');
  await browser.close();
}

runVisualInspection().catch((err) => {
  console.error('Fatal inspection failure:', err);
  process.exit(1);
});
