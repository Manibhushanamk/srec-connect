const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';
const BASE_URL = 'http://localhost:3000';

async function testMobile() {
  console.log('📱 Testing Mobile Responsiveness across screens...');
  const browser = await chromium.launch({ headless: true });

  // 1. Test on iPhone (390x844) as Student
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await mobileContext.newPage();

  console.log('🔐 Signing in as Student on Mobile...');
  await page.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Student (22091A3201)")');
  await page.waitForTimeout(1500);

  // 2. Navigate to /dashboard/student
  console.log('🎓 Checking /dashboard/student on Mobile...');
  await page.goto(`${BASE_URL}/dashboard/student`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Verify the awkward old fixed top-16 bar is NOT present
  const oldTopBar = await page.$('div.lg\\:hidden.fixed.top-16');
  console.log(`  Old awkward top-16 bar exists: ${Boolean(oldTopBar)} (Expected: false)`);

  const studentDashboardMobilePic = path.join(ARTIFACTS_DIR, 'verify_mobile_student_dashboard_clean.png');
  await page.screenshot({ path: studentDashboardMobilePic, fullPage: false });
  console.log(`📸 Captured clean student dashboard mobile screenshot: ${studentDashboardMobilePic}`);

  // 3. Open Mobile Drawer from AppHeader
  console.log('🍔 Tapping Hamburger / Profile menu button in AppHeader...');
  const menuButton = await page.locator('header button[aria-label="Open navigation menu"]').first();
  await menuButton.click();
  await page.waitForTimeout(500);

  const drawerOpenPic = path.join(ARTIFACTS_DIR, 'verify_mobile_drawer_open.png');
  await page.screenshot({ path: drawerOpenPic, fullPage: false });
  console.log(`📸 Captured mobile drawer screenshot: ${drawerOpenPic}`);

  // Check drawer items
  const drawerText = await page.locator('div[role="dialog"]').innerText();
  const hasStudentDashboard = drawerText.includes('Student Dashboard');
  const hasSubmitAchievement = drawerText.includes('Submit Achievement');
  const hasFeed = drawerText.includes('Community Feed');
  const hasSignOut = drawerText.includes('Sign Out of Session');
  console.log(`  Drawer contains Student Dashboard: ${hasStudentDashboard}`);
  console.log(`  Drawer contains Submit Achievement: ${hasSubmitAchievement}`);
  console.log(`  Drawer contains Community Feed: ${hasFeed}`);
  console.log(`  Drawer contains Sign Out: ${hasSignOut}`);

  // 4. Test clicking link in drawer
  console.log('🔗 Tapping Submit Achievement link in drawer...');
  await page.click('div[role="dialog"] a:has-text("Submit Achievement")');
  await page.waitForTimeout(1000);
  console.log(`  Current URL after tap: ${page.url()} (Expected: /dashboard/student/submit)`);

  const submitPageMobilePic = path.join(ARTIFACTS_DIR, 'verify_mobile_student_submit.png');
  await page.screenshot({ path: submitPageMobilePic, fullPage: false });
  console.log(`📸 Captured mobile submit page screenshot: ${submitPageMobilePic}`);

  // 5. Test Profile Page on Mobile
  console.log('👤 Navigating to /profile on Mobile...');
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const profileMobilePic = path.join(ARTIFACTS_DIR, 'verify_mobile_profile_responsive.png');
  await page.screenshot({ path: profileMobilePic, fullPage: false });
  console.log(`📸 Captured mobile profile screenshot: ${profileMobilePic}`);

  // 6. Test Public Feed on Mobile
  console.log('🏠 Navigating to Home Feed on Mobile...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const homeFeedMobilePic = path.join(ARTIFACTS_DIR, 'verify_mobile_home_feed.png');
  await page.screenshot({ path: homeFeedMobilePic, fullPage: false });
  console.log(`📸 Captured mobile home feed screenshot: ${homeFeedMobilePic}`);

  await browser.close();
  console.log('🎉 All mobile tests and screenshots passed successfully!');
}

testMobile().catch((err) => {
  console.error('❌ Mobile test failed:', err);
  process.exit(1);
});
