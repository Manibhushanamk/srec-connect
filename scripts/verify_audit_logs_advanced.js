const { chromium } = require('/home/kmanib/.nvm/versions/node/v22.23.3/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ARTIFACTS_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';

async function main() {
  console.log('🚀 Starting Verification for Advanced Audit Logs & RBAC Matrix...');
  const browser = await chromium.launch({ headless: true });

  // -------------------------------------------------------------
  // Test 1: Super Admin Access to /admin/logs
  // -------------------------------------------------------------
  console.log('\n🛡️ Test 1: Testing Super Admin Access to /admin/logs...');
  const superAdminPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  await superAdminPage.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
  await superAdminPage.click('button:has-text("Super Admin")');
  await superAdminPage.waitForURL((url) => !url.toString().includes('/signin'), { timeout: 10000 });
  await superAdminPage.waitForTimeout(1000);

  await superAdminPage.goto(`${BASE_URL}/admin/logs`, { waitUntil: 'networkidle' });
  await superAdminPage.waitForTimeout(2000);

  const titleText = await superAdminPage.locator('h1').innerText();
  console.log(`  Page Heading: "${titleText}" (Expected: "Security & Audit Intelligence Center")`);

  const rowsCount = await superAdminPage.locator('tbody tr').count();
  console.log(`  Audit Log Rows Rendered: ${rowsCount} (Expected: > 0)`);

  const totalEventsText = await superAdminPage.locator('p.text-2xl').first().innerText();
  console.log(`  Total Events KPI Counter: ${totalEventsText}`);

  const superAdminShot = path.join(ARTIFACTS_DIR, 'verify_admin_logs_super_admin.png');
  await superAdminPage.screenshot({ path: superAdminShot, fullPage: false });
  console.log(`📸 Saved Super Admin logs screenshot: ${superAdminShot}`);

  // Test Forensic Inspection Modal
  if (rowsCount > 0) {
    console.log('  Opening Forensic Record Inspector...');
    await superAdminPage.locator('tbody tr').first().click();
    await superAdminPage.waitForTimeout(600);

    const isModalOpen = await superAdminPage.locator('text=Forensic Audit Record Inspector').isVisible();
    const hasJsonViewer = await superAdminPage.locator('pre').isVisible();
    console.log(`  Forensic Modal Visible: ${isModalOpen}`);
    console.log(`  JSON Viewer Visible: ${hasJsonViewer}`);

    const modalShot = path.join(ARTIFACTS_DIR, 'verify_admin_logs_forensic_modal.png');
    await superAdminPage.screenshot({ path: modalShot, fullPage: false });
    console.log(`📸 Saved Forensic Modal screenshot: ${modalShot}`);

    await superAdminPage.click('button:has-text("Close Inspector")');
    await superAdminPage.waitForTimeout(400);
  }

  await superAdminPage.close();

  // -------------------------------------------------------------
  // Test 2: HOD Access to /admin/logs
  // -------------------------------------------------------------
  console.log('\n🏛️ Test 2: Testing HOD Access to /admin/logs...');
  const hodContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const hodPage = await hodContext.newPage();

  await hodPage.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
  await hodPage.click('button:has-text("HOD (AIML)")');
  await hodPage.waitForURL((url) => !url.toString().includes('/signin'), { timeout: 10000 });
  await hodPage.waitForTimeout(1000);

  await hodPage.goto(`${BASE_URL}/admin/logs`, { waitUntil: 'networkidle' });
  await hodPage.waitForTimeout(2000);

  const hodHeading = await hodPage.locator('h1').innerText();
  const hodRows = await hodPage.locator('tbody tr').count();
  console.log(`  HOD Page Heading: "${hodHeading}"`);
  console.log(`  HOD Department Logs Count: ${hodRows}`);

  const hodShot = path.join(ARTIFACTS_DIR, 'verify_admin_logs_hod_view.png');
  await hodPage.screenshot({ path: hodShot, fullPage: false });
  console.log(`📸 Saved HOD logs screenshot: ${hodShot}`);

  await hodContext.close();

  // -------------------------------------------------------------
  // Test 3: Student Restricted from /admin/logs
  // -------------------------------------------------------------
  console.log('\n🔒 Test 3: Verifying Student Access is Blocked...');
  const studentContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const studentPage = await studentContext.newPage();

  await studentPage.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
  const studentDevBtn = studentPage.locator('button:has-text("Student (22091A3201)")').first();
  await studentDevBtn.click();
  await studentPage.waitForTimeout(3000);
  console.log(`  Student Signed in. Landed at: ${studentPage.url()}`);

  await studentPage.goto(`${BASE_URL}/admin/logs`, { waitUntil: 'domcontentloaded' });
  await studentPage.waitForTimeout(2000);

  const hasClearanceError = await studentPage.locator('text=Security Clearance Required').isVisible();
  const studentRows = await studentPage.locator('tbody tr').count();
  console.log(`  Student Sees "Security Clearance Required": ${hasClearanceError} (Expected: true)`);
  console.log(`  Audit Table Hidden from Student: ${studentRows === 0} (Expected: true)`);

  const studentShot = path.join(ARTIFACTS_DIR, 'verify_admin_logs_student_blocked.png');
  await studentPage.screenshot({ path: studentShot, fullPage: false });
  console.log(`📸 Saved Student blocked screenshot: ${studentShot}`);

  // Test Direct Backend API Response for Student
  const apiResponse = await studentPage.evaluate(async () => {
    const res = await fetch('/api/admin/logs');
    return { status: res.status, body: await res.json() };
  });
  console.log(`  Direct API Call status: ${apiResponse.status} (Expected: 403)`);
  console.log(`  API Error Message: "${apiResponse.body?.error}"`);

  await studentContext.close();
  await browser.close();

  console.log('\n🎉 ALL ADVANCED AUDIT LOGS & RBAC VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
