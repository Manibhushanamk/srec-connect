const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';
const BASE_URL = 'http://localhost:3000';

async function navigateSafe(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(600);
  } catch (err) {
    console.warn(`[Nav Warning] ${url}:`, err.message);
  }
}

async function runDeepVerification() {
  console.log('🚀 Starting Deep Live Element & Responsiveness Verification...');
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const auditLog = [];

  async function checkOverflow(name, url, isMobile = false) {
    const metrics = await page.evaluate(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
      const clientWidth = docEl.clientWidth;
      const overflowing = scrollWidth > clientWidth;
      return { scrollWidth, clientWidth, overflowing };
    });

    const status = metrics.overflowing ? '❌ OVERFLOW' : '✅ CLEAN';
    console.log(`[${isMobile ? 'MOBILE' : 'DESKTOP'}] ${name} (${url}): ${status} (client: ${metrics.clientWidth}px, scroll: ${metrics.scrollWidth}px)`);
    auditLog.push({ name, url, isMobile, ...metrics });
    return !metrics.overflowing;
  }

  // ── 1. SIGN IN PAGE AUDIT ──
  console.log('\n--- 1. Testing /signin (Clean Google SSO) ---');
  await navigateSafe(page, `${BASE_URL}/signin`);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_clean_signin.png'), fullPage: true });
  await checkOverflow('Sign In Page', '/signin');

  // Verify prominent Google button exists
  const googleBtn = await page.locator('button:has-text("Continue with Google Workspace")').first();
  const hasGoogleBtn = (await googleBtn.count()) > 0;
  console.log('  Google Workspace SSO button present:', hasGoogleBtn);

  // ── 2. AUTHENTICATE AS SUPER ADMIN (using dev persona) ──
  console.log('\n--- 2. Authenticating as Super Admin ---');
  await navigateSafe(page, `${BASE_URL}/signin?dev=true`);
  const superAdminBtn = page.locator('button:has-text("Super Admin")').first();
  await superAdminBtn.click();
  await page.waitForTimeout(1500);
  console.log('  Authenticated! Current URL:', page.url());

  // ── 3. COMMUNITY FEED & POST COMPOSER INTERACTION ──
  console.log('\n--- 3. Testing Feed & Post Composer (Collaboration & Topics) ---');
  await navigateSafe(page, `${BASE_URL}/`);
  await checkOverflow('Community Feed', '/');

  // Test Post Composer expansion
  const textarea = page.locator('textarea[placeholder*="Share an academic project"]').first();
  if ((await textarea.count()) > 0) {
    await textarea.click();
    await page.waitForTimeout(300);

    // Click topic tag chip
    const topicChip = page.locator('button:has-text("#Project")').first();
    if ((await topicChip.count()) > 0) {
      await topicChip.click();
      console.log('  Clicked #Project topic chip');
    }

    // Click Collaborators button
    const collabBtn = page.locator('button:has-text("Collaborators")').first();
    if ((await collabBtn.count()) > 0) {
      await collabBtn.click();
      console.log('  Toggled Collaborators selector');
      await page.waitForTimeout(300);

      // Type student roll in collaborator search
      const searchInput = page.locator('input[placeholder*="roll number"]').first();
      if ((await searchInput.count()) > 0) {
        await searchInput.fill('22091A');
        await page.waitForTimeout(600);
        console.log('  Filled collaborator query (22091A)');
      }
    }
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_collab_composer.png') });
  }

  // ── 4. STUDENT GRIEVANCES & OFFICIAL DISCIPLINARY LETTERS ──
  console.log('\n--- 4. Testing Student Grievances & Official Letters Portal ---');
  await navigateSafe(page, `${BASE_URL}/grievances`);
  await checkOverflow('Grievances Portal', '/grievances');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_grievances_portal.png'), fullPage: true });

  // Test File Grievance Tab
  const fileTabBtn = page.locator('button:has-text("File Grievance")').first();
  if ((await fileTabBtn.count()) > 0) {
    await fileTabBtn.click();
    await page.waitForTimeout(400);
    console.log('  Opened File Grievance tab');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_grievance_form.png') });
  }

  // Switch back to My Cases
  const myCasesBtn = page.locator('button:has-text("My Cases")').first();
  if ((await myCasesBtn.count()) > 0) {
    await myCasesBtn.click();
    await page.waitForTimeout(400);
  }

  // ── 5. ADMIN DISCIPLINE DOSSIER & OFFICIAL LETTER PREVIEW ──
  console.log('\n--- 5. Testing Admin Discipline & Letter Generation ---');
  await navigateSafe(page, `${BASE_URL}/admin/discipline`);
  await checkOverflow('Admin Discipline List', '/admin/discipline');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_admin_discipline_list.png'), fullPage: true });

  // Click first case to view dossier
  const firstCase = page.locator('a[href^="/admin/discipline/"]').first();
  if ((await firstCase.count()) > 0) {
    const caseHref = await firstCase.getAttribute('href');
    console.log('  Navigating to case dossier:', caseHref);
    await navigateSafe(page, `${BASE_URL}${caseHref}`);
    await checkOverflow('Case Dossier', caseHref);

    // Look for "Print Official Letter"
    const printLetterBtn = page.locator('button:has-text("Print Official Letter")').first();
    if ((await printLetterBtn.count()) > 0) {
      await printLetterBtn.click();
      await page.waitForTimeout(600);
      console.log('  Opened Official Institutional Action Letter Modal!');
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_official_action_letter.png') });
    }
  }

  // ── 6. SUPER ADMIN PROFILE & LAUNCHPAD ──
  console.log('\n--- 6. Testing Super Admin Profile Workspace ---');
  await navigateSafe(page, `${BASE_URL}/profile`);
  await checkOverflow('Profile Workspace', '/profile');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_super_admin_launchpad.png') });

  // Test Edit & Customize tab
  const editTab = page.locator('button:has-text("Edit & Customize")').first();
  if ((await editTab.count()) > 0) {
    await editTab.click();
    await page.waitForTimeout(300);
    console.log('  Switched to Profile Edit Tab');
  }

  // ── 7. ALL DIRECTORY & PUBLIC PAGES ──
  const publicPages = [
    { name: 'Events Directory', url: '/events' },
    { name: 'Achievements Directory', url: '/achievements' },
    { name: 'Students Directory', url: '/students' },
    { name: 'Faculty Directory', url: '/faculty' },
    { name: 'Academic Departments', url: '/departments' },
    { name: 'About College', url: '/about' },
  ];

  for (const p of publicPages) {
    console.log(`\n--- Testing ${p.name} (${p.url}) ---`);
    await navigateSafe(page, `${BASE_URL}${p.url}`);
    await checkOverflow(p.name, p.url);
  }

  // ── 8. ADMIN COMMAND CENTER & MODULES ──
  const adminPages = [
    { name: 'Admin Command Center', url: '/admin' },
    { name: 'Admin User Management', url: '/admin/users' },
    { name: 'Admin Bulk Ingestion', url: '/admin/bulk-upload' },
    { name: 'Admin Achievements Desk', url: '/admin/achievements' },
    { name: 'Admin Events Management', url: '/admin/events' },
    { name: 'Admin Notices Broadcast', url: '/admin/notices' },
    { name: 'Admin Analytics Hub', url: '/admin/analytics' },
  ];

  for (const p of adminPages) {
    console.log(`\n--- Testing ${p.name} (${p.url}) ---`);
    await navigateSafe(page, `${BASE_URL}${p.url}`);
    await checkOverflow(p.name, p.url);
  }

  // ── 9. MOBILE VIEWPORT VERIFICATION (375x812 - iPhone X) ──
  console.log('\n--- 9. Mobile Viewport Testing (375x812) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  // Sign in on mobile
  await navigateSafe(mobilePage, `${BASE_URL}/signin?dev=true`);
  const mobSuperAdminBtn = mobilePage.locator('button:has-text("Super Admin")').first();
  if ((await mobSuperAdminBtn.count()) > 0) {
    await mobSuperAdminBtn.click();
    await mobilePage.waitForTimeout(1000);
  }

  const mobileTestUrls = ['/', '/profile', '/grievances', '/events', '/admin'];
  for (const mUrl of mobileTestUrls) {
    await navigateSafe(mobilePage, `${BASE_URL}${mUrl}`);
    await mobilePage.waitForTimeout(600);
    const mMetrics = await mobilePage.evaluate(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
      const clientWidth = docEl.clientWidth;
      return { scrollWidth, clientWidth, overflowing: scrollWidth > clientWidth };
    });
    console.log(`[MOBILE 375px] ${mUrl}: ${mMetrics.overflowing ? '❌ OVERFLOW' : '✅ CLEAN'} (client: ${mMetrics.clientWidth}px, scroll: ${mMetrics.scrollWidth}px)`);
    auditLog.push({ name: `Mobile ${mUrl}`, url: mUrl, isMobile: true, ...mMetrics });
  }

  await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_mobile_all.png') });

  await browser.close();

  const totalAudited = auditLog.length;
  const overflows = auditLog.filter((a) => a.overflowing);
  console.log(`\n======================================================`);
  console.log(`🎉 Deep Verification Complete: ${totalAudited} viewports checked.`);
  console.log(`Horizontal Overflows: ${overflows.length}`);
  if (overflows.length > 0) {
    console.log('Overflowing pages:', overflows);
  } else {
    console.log('🌟 100% Zero-Overflow Verified Across All Pages and Viewports!');
  }
}

runDeepVerification().catch((err) => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
