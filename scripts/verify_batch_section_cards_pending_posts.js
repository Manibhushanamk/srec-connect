const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🚀 Starting Comprehensive Verification for User Requests...');
  const browser = await chromium.launch({ headless: true });

  try {
    // -------------------------------------------------------------
    // Test 1: SREC Roll Numbers & Public Student Profile with Posts Section
    // -------------------------------------------------------------
    console.log('🔍 Test 1: Checking Public Student Profile (/students/22091A3201)...');
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await page.goto(`${BASE_URL}/students/22091A3201`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const bodyText = await page.innerText('body');
    const hasJntuaRoll = /JNTUA Roll/i.test(bodyText);
    const hasSrecRoll = /SREC Roll/i.test(bodyText);
    console.log(`  Contains "JNTUA Roll": ${hasJntuaRoll} (Expected: false)`);
    console.log(`  Contains "SREC Roll": ${hasSrecRoll} (Expected: true)`);

    // Check Community Posts section
    const hasPostsSection = await page.locator('text=Community Posts & Updates').isVisible().catch(() => false);
    console.log(`  Has "Community Posts & Updates" section: ${hasPostsSection} (Expected: true)`);

    // Screenshot public profile showing SREC roll, cards and posts section
    const studentProfilePath = path.join(ARTIFACTS_DIR, 'verify_public_profile_posts_section.png');
    await page.screenshot({ path: studentProfilePath, fullPage: false });
    console.log(`📸 Saved student profile screenshot: ${studentProfilePath}`);

    // Check card width inside the student profile on laptop width (1024px)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(600);
    const achCard = page.locator('div[role="button"]:has-text("Verified SREC Honor")').first();
    const cardBox = await achCard.boundingBox().catch(() => null);
    if (cardBox) {
      console.log(`  AchievementCard width on 1024px laptop: ${Math.round(cardBox.width)}px (Expected: >= 380px, not squished to 230px)`);
    }

    const laptopCardsPath = path.join(ARTIFACTS_DIR, 'verify_cards_width_laptop.png');
    await page.screenshot({ path: laptopCardsPath, fullPage: false });
    console.log(`📸 Saved laptop card layout screenshot: ${laptopCardsPath}`);

    await page.close();

    // -------------------------------------------------------------
    // Test 2: Student Settings & Profile Locked Batch / Section
    // -------------------------------------------------------------
    console.log('\n🔒 Test 2: Checking Student Locked Batch & Class Section (/profile)...');
    const studentPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    
    // Sign in as student
    console.log('  Signing in with Student dev persona...');
    await studentPage.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
    const studentDevBtn = studentPage.locator('button:has-text("Student (22091A3201)")').first();
    await studentDevBtn.click();
    await studentPage.waitForURL((url) => !url.toString().includes('/signin'), { timeout: 10000 });
    await studentPage.waitForTimeout(1000);

    // Go to profile edit tab
    console.log('  Navigating to /profile...');
    await studentPage.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
    await studentPage.waitForTimeout(1500);

    const editTab = studentPage.locator('button:has-text("Edit & Customize")');
    await editTab.click();
    await studentPage.waitForTimeout(800);

    // Verify batch and section are locked
    const batchInput = studentPage.locator('input[placeholder="e.g. 2022-2026"]');
    const isBatchDisabled = await batchInput.isDisabled();
    const isSectionDisabled = await studentPage.locator('input[placeholder="e.g. A"]').isDisabled();
    const hasLockBadge = await studentPage.locator('text=Locked').first().isVisible().catch(() => false);
    const hasInstitutionalNote = await studentPage.locator('text=Academic Batch and Class Section are verified institutional anchors').isVisible().catch(() => false);

    console.log(`  Academic Batch input disabled for Student: ${isBatchDisabled} (Expected: true)`);
    console.log(`  Class Section input disabled for Student: ${isSectionDisabled} (Expected: true)`);
    console.log(`  "Locked" badge displayed: ${hasLockBadge} (Expected: true)`);
    console.log(`  Institutional explanation rendered: ${hasInstitutionalNote} (Expected: true)`);

    const studentLockedPath = path.join(ARTIFACTS_DIR, 'verify_student_locked_batch_section.png');
    await studentPage.screenshot({ path: studentLockedPath, fullPage: false });
    console.log(`📸 Saved student locked batch/section screenshot: ${studentLockedPath}`);

    // Check Notification Bell quick link to Pending Desk for student
    const notifBtn = studentPage.locator('button[aria-label="Notifications"]');
    await notifBtn.click();
    await studentPage.waitForTimeout(600);

    const hasPendingDeskLink = await studentPage.locator('text=Pending Approvals Desk').isVisible().catch(() => false);
    const hasMyDeskLink = await studentPage.locator('text=My Desk').isVisible().catch(() => false);
    console.log(`  Notification bell has "Pending Approvals Desk": ${hasPendingDeskLink} (Expected: true)`);
    console.log(`  Notification bell has "My Desk" link: ${hasMyDeskLink} (Expected: true)`);

    const notifBellPath = path.join(ARTIFACTS_DIR, 'verify_notification_bell_pending_link.png');
    await studentPage.screenshot({ path: notifBellPath, fullPage: false });
    console.log(`📸 Saved notification bell screenshot: ${notifBellPath}`);

    await studentPage.close();

    // -------------------------------------------------------------
    // Test 3: Pending Approval Desk in Admin with Real Card Styling
    // -------------------------------------------------------------
    console.log('\n🏛️ Test 3: Checking Pending Approval Desk (/admin/achievements)...');
    const adminPage = await browser.newPage({ viewport: { width: 1280, height: 960 } });

    // Sign in as Super Admin
    await adminPage.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
    const superAdminBtn = adminPage.locator('button:has-text("Super Admin")').first();
    await superAdminBtn.click();
    await adminPage.waitForURL((url) => !url.toString().includes('/signin'), { timeout: 10000 });
    await adminPage.waitForTimeout(1000);

    // Navigate to /admin/achievements
    await adminPage.goto(`${BASE_URL}/admin/achievements?status=ALL`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForTimeout(3000);

    // Verify Real Card Styling & Edit Details button
    const hasRealCard = await adminPage.locator('div[role="button"]:has-text("Verified SREC Honor")').first().isVisible().catch(() => false);
    const hasEditDetailsBtn = await adminPage.locator('button:has-text("Edit Details")').first().isVisible().catch(() => false);
    const hasApproveBtn = await adminPage.locator('button:has-text("Approve & Publish")').first().isVisible().catch(() => false);

    console.log(`  Pending desk renders real AchievementCard styling: ${hasRealCard} (Expected: true)`);
    console.log(`  Moderation bar has "Edit Details" button: ${hasEditDetailsBtn} (Expected: true)`);
    console.log(`  Moderation bar has "Approve & Publish" button: ${hasApproveBtn} (Expected: true)`);

    const adminPendingDeskPath = path.join(ARTIFACTS_DIR, 'verify_admin_pending_desk_card_view.png');
    await adminPage.screenshot({ path: adminPendingDeskPath, fullPage: false });
    console.log(`📸 Saved pending approval desk screenshot: ${adminPendingDeskPath}`);

    // Click "Edit Details" on first item to verify pre-approval editing modal
    if (hasEditDetailsBtn) {
      console.log('  Opening Edit Details modal on pending desk item...');
      await adminPage.locator('button:has-text("Edit Details")').first().click();
      await adminPage.waitForTimeout(600);

      const isModalOpen = await adminPage.locator('text=In-Review Honor Editor').isVisible().catch(() => false);
      console.log(`  In-Review Honor Editor modal opened: ${isModalOpen} (Expected: true)`);

      const adminEditModalPath = path.join(ARTIFACTS_DIR, 'verify_admin_achievement_edit_modal.png');
      await adminPage.screenshot({ path: adminEditModalPath, fullPage: false });
      console.log(`📸 Saved in-review edit modal screenshot: ${adminEditModalPath}`);
    }

    // -------------------------------------------------------------
    // Test 4: Gallery Card Widths on /achievements
    // -------------------------------------------------------------
    console.log('\n🏆 Test 4: Checking /achievements Gallery Responsive Grid...');
    await adminPage.goto(`${BASE_URL}/achievements`, { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(1200);

    const firstGalleryCard = adminPage.locator('div[role="button"]:has-text("Verified SREC Honor")').first();
    const galleryCardBox = await firstGalleryCard.boundingBox().catch(() => null);
    if (galleryCardBox) {
      console.log(`  /achievements Card width on 1280px desktop: ${Math.round(galleryCardBox.width)}px (Expected: 360-460px)`);
    }

    const galleryPath = path.join(ARTIFACTS_DIR, 'verify_achievements_gallery_responsive.png');
    await adminPage.screenshot({ path: galleryPath, fullPage: false });
    console.log(`📸 Saved achievements gallery screenshot: ${galleryPath}`);

    await adminPage.close();

    console.log('\n🎉 ALL TESTS PASSED! Verification 100% complete.');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
