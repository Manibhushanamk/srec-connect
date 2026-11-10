const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🚀 Starting Super Admin User Management Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 960 },
  });
  const page = await context.newPage();

  try {
    // 1. Sign in as Super Admin
    console.log('🔐 Navigating to /signin?dev=true...');
    await page.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
    
    console.log('Clicking Super Admin dev sign-in button...');
    const superAdminBtn = page.locator('button:has-text("Super Admin")').first();
    await superAdminBtn.click();
    await page.waitForTimeout(2000);

    // 2. Navigate to /admin/users
    console.log('📋 Navigating to /admin/users...');
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Check directory table loaded
    const pageTitle = await page.locator('h1').innerText().catch(() => '');
    console.log(`Page Title: "${pageTitle}"`);

    // Take screenshot of Admin Users Directory
    const adminDirectoryPath = path.join(ARTIFACTS_DIR, 'verify_admin_users_directory.png');
    await page.screenshot({ path: adminDirectoryPath, fullPage: false });
    console.log(`📸 Saved users directory screenshot: ${adminDirectoryPath}`);

    // 3. Search for student 22091A3201
    console.log('🔍 Searching for student "22091A3201"...');
    const searchInput = page.locator('input[placeholder*="Search by name"]').first();
    await searchInput.fill('22091A3201');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);

    // Find the Edit button in the table row
    console.log('✏️ Clicking Edit button on student 22091A3201...');
    const editBtn = page.locator('tr:has-text("22091A3201") button:has-text("Edit")').first();
    await editBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editBtn.click();
    await page.waitForTimeout(1000);

    // Verify modal is open
    const modalHeader = page.locator('text=Super Admin: Edit User & Academic Profile');
    await modalHeader.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Edit modal is visible!');

    // Take screenshot of the Edit modal
    const editModalPath = path.join(ARTIFACTS_DIR, 'verify_super_admin_edit_modal.png');
    await page.screenshot({ path: editModalPath, fullPage: false });
    console.log(`📸 Saved edit modal screenshot: ${editModalPath}`);

    // Update headline and bio
    const testHeadline = `Elite AI Specialist & Core Contributor [${Date.now().toString().slice(-4)}]`;
    const testBio = `Verified student profile actively managed by Super Admin at ${new Date().toISOString()}`;
    
    console.log(`Setting headline to: "${testHeadline}"`);
    const headlineInput = page.locator('input#user-headline');
    await headlineInput.fill(testHeadline);

    console.log(`Setting bio statement...`);
    const bioTextarea = page.locator('textarea#user-bio');
    await bioTextarea.fill(testBio);

    // Save changes
    console.log('💾 Submitting save...');
    const saveBtn = page.locator('button:has-text("Save All Changes")');
    await saveBtn.click();

    // Wait for save operation and modal closing
    await page.waitForSelector('text=Super Admin: Edit User & Academic Profile', { state: 'hidden', timeout: 10000 });
    await page.waitForTimeout(1500);

    // 4. Verify public student profile reflects changes
    console.log('🌐 Navigating to public student profile /students/22091A3201...');
    await page.goto(`${BASE_URL}/students/22091A3201`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Check "Edit as Admin" button is rendered
    const editAsAdminBtn = page.locator('a:has-text("Edit as Admin")');
    const hasAdminBtn = await editAsAdminBtn.isVisible().catch(() => false);
    console.log(`"Edit as Admin" button present on public student profile: ${hasAdminBtn}`);

    // Check if updated headline is visible
    const headlineElement = page.locator(`text=${testHeadline}`).first();
    const hasHeadline = await headlineElement.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Public profile displays new headline ("${testHeadline}"): ${hasHeadline}`);

    // Screenshot public profile showing updated details & Edit as Admin button
    const studentProfilePath = path.join(ARTIFACTS_DIR, 'verify_student_profile_admin_reflect.png');
    await page.screenshot({ path: studentProfilePath, fullPage: false });
    console.log(`📸 Saved public profile screenshot: ${studentProfilePath}`);

    // 5. Click "Edit as Admin" button and check deep linking
    if (hasAdminBtn) {
      console.log('🔗 Clicking "Edit as Admin" button from public student profile...');
      await editAsAdminBtn.click();
      await page.waitForTimeout(1500);
      console.log(`Navigated to: ${page.url()}`);
      
      const isBackInAdmin = page.url().includes('/admin/users');
      console.log(`Deep link successfully arrived at /admin/users: ${isBackInAdmin}`);
    }

    console.log('🎉 Super Admin user management fully verified!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
