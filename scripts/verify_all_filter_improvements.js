const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // 1. Students Directory
  console.log('Capturing /students...');
  await page.goto('http://localhost:3000/students', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'improved_students_directory.png') });

  // 2. Faculty Directory
  console.log('Capturing /faculty...');
  await page.goto('http://localhost:3000/faculty', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'improved_faculty_directory.png') });

  // 3. Achievements
  console.log('Capturing /achievements...');
  await page.goto('http://localhost:3000/achievements', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'improved_achievements_directory.png') });

  // 4. Events
  console.log('Capturing /events...');
  await page.goto('http://localhost:3000/events', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'improved_events_directory.png') });

  await browser.close();
  console.log('All 4 improved pages captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
