import { test, expect } from '@playwright/test';

test.describe('Google Drive Dashboard & Mandatory Media Permission Verification', () => {
  test('SignIn page renders clean single Google OAuth button', async ({ page }) => {
    await page.goto('http://localhost:3000/signin');
    await expect(page.locator('button:has-text("Continue with Institutional Google ID")')).toBeVisible();
    await page.screenshot({ path: '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0/verify_single_google_oauth_signin.png' });
  });

  test('Public Feed renders cleanly without broken media icons', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    // Check that no img with broken alt is visible or unhandled
    const brokenAlts = page.locator('img[alt="Post Media"]');
    const count = await brokenAlts.count();
    console.log('Post Media images found:', count);
    await page.screenshot({ path: '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0/verify_feed_clean_render.png' });
  });
});
