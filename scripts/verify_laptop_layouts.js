const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Standard 14-inch / 15-inch Laptop Viewport (1440 x 900)
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  console.log('1. Verifying Students Directory on Laptop Viewport...');
  await page.goto('http://localhost:3000/students', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_laptop_students.png'),
    fullPage: false
  });
  console.log('Saved verified_laptop_students.png');

  console.log('2. Verifying Faculty Directory on Laptop Viewport...');
  await page.goto('http://localhost:3000/faculty', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_laptop_faculty.png'),
    fullPage: false
  });
  console.log('Saved verified_laptop_faculty.png');

  console.log('3. Verifying Achievements Directory on Laptop Viewport...');
  await page.goto('http://localhost:3000/achievements', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_laptop_achievements.png'),
    fullPage: false
  });
  console.log('Saved verified_laptop_achievements.png');

  console.log('4. Verifying Events Directory on Laptop Viewport...');
  await page.goto('http://localhost:3000/events', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_laptop_events.png'),
    fullPage: false
  });
  console.log('Saved verified_laptop_events.png');

  console.log('5. Signing in and Verifying Grievances on Laptop Viewport...');
  await page.goto('http://localhost:3000/signin', { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(async () => {
    const csrfRes = await fetch('/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();
    const body = new URLSearchParams({
      csrfToken,
      email: 'manibhushanam4k@gmail.com',
      json: 'true',
    });
    await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  });

  await page.goto('http://localhost:3000/grievances', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_laptop_grievances.png'),
    fullPage: false
  });
  console.log('Saved verified_laptop_grievances.png');

  await browser.close();
  console.log('All laptop layout verifications completed successfully!');
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
