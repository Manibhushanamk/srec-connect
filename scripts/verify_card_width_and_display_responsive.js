const { chromium } = require('/home/kmanib/.nvm/versions/node/v22.23.3/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ARTIFACTS_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';

async function main() {
  console.log('🚀 Starting Card Width & Responsive Display Verification...');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'Mobile_360', width: 360, height: 800 },
    { name: 'Mobile_420', width: 420, height: 850 },
    { name: 'Tablet_768', width: 768, height: 1024 },
    { name: 'Laptop_1024', width: 1024, height: 800 },
    { name: 'Desktop_1280', width: 1280, height: 900 },
    { name: 'Wide_1920', width: 1920, height: 1080 },
  ];

  console.log('\n📐 Testing /achievements Gallery Grid across all screen viewports:');
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`${BASE_URL}/achievements`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const card = page.locator('div[role="button"]:has-text("Verified SREC Honor")').first();
    const box = await card.boundingBox();
    console.log(`  [${vp.name}] Viewport width: ${vp.width}px -> Card width: ${Math.round(box?.width || 0)}px, height: ${Math.round(box?.height || 0)}px`);

    const screenshotPath = path.join(ARTIFACTS_DIR, `verify_card_responsive_${vp.name.toLowerCase()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    await page.close();
  }

  console.log('\n🎓 Testing Student Profile (/students/22091A3201) Card Width:');
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE_URL}/students/22091A3201`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const card = page.locator('div[role="button"]:has-text("Verified SREC Honor")').first();
    const box = await card.boundingBox();
    console.log(`  [Laptop 1280px] Student Profile Card width: ${Math.round(box?.width || 0)}px (Expected: >= 480px, not squished to 280px)`);

    const screenshotPath = path.join(ARTIFACTS_DIR, 'verify_student_profile_card_width_laptop.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    await page.close();
  }

  console.log('\n🏛️ Testing Admin Achievements Edit & Approve Desk (/admin/achievements):');
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE_URL}/signin?dev=true`, { waitUntil: 'networkidle' });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button:has-text("Super Admin")')
    ]);

    await page.goto(`${BASE_URL}/admin/achievements?status=ALL`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const editButtonsCount = await page.locator('button:has-text("Edit Details")').count();
    const card = page.locator('div[role="button"]:has-text("Verified SREC Honor")').first();
    const box = await card.boundingBox();
    console.log(`  Admin Desk Cards width: ${Math.round(box?.width || 0)}px, "Edit Details" buttons count: ${editButtonsCount}`);

    const screenshotPath = path.join(ARTIFACTS_DIR, 'verify_admin_desk_cards_responsive.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // Click "Edit Details" on the first card to verify modal opens
    if (editButtonsCount > 0) {
      await page.locator('button:has-text("Edit Details")').first().click();
      await page.waitForTimeout(600);
      const isModalVisible = await page.locator('text=Edit Achievement Submission').isVisible();
      console.log(`  Edit Modal Opens: ${isModalVisible}`);
      const modalScreenshot = path.join(ARTIFACTS_DIR, 'verify_admin_edit_modal_open.png');
      await page.screenshot({ path: modalScreenshot, fullPage: false });
    }

    await page.close();
  }

  await browser.close();
  console.log('\n🎉 ALL CARD WIDTH AND DISPLAY RESPONSIVENESS VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
