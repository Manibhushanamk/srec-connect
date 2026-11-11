const { chromium } = require('/home/kmanib/.nvm/versions/node/v22.23.3/lib/node_modules/playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';
const BASE_URL = 'http://localhost:3000';

async function runVerification() {
  console.log('🚀 Starting Verification: Removed Users Feed & Relationship Integrity');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 }
  });
  const page = await context.newPage();

  try {
    // 1. Visit Home Page (Campus Feed)
    console.log('1. Checking Campus Feed (/) ...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const bodyText = await page.innerText('body');
    const hasNaveenInFeed = bodyText.includes('K. V. Naveen Kumar');
    const hasSaiInFeed = bodyText.includes('P. Sai Kumar');

    console.log('  Feed - Contains Naveen Kumar?', hasNaveenInFeed);
    console.log('  Feed - Contains Sai Kumar?', hasSaiInFeed);

    if (hasNaveenInFeed || hasSaiInFeed) {
      throw new Error(`FAILED: Removed users still found in Feed! Naveen: ${hasNaveenInFeed}, Sai: ${hasSaiInFeed}`);
    }
    console.log('  ✅ SUCCESS: Neither Naveen Kumar nor Sai Kumar is in the Campus Feed.');

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_feed_no_removed_users.png'),
      fullPage: false
    });

    // 2. Switch to Featured Scholars tab
    console.log('2. Checking Featured Scholars tab ...');
    const featuredTabBtn = page.locator('button:has-text("Featured Scholars")');
    await featuredTabBtn.click();
    await page.waitForTimeout(2000);

    const portfoliosText = await page.innerText('body');
    const hasNaveenInScholars = portfoliosText.includes('K. V. Naveen Kumar') || portfoliosText.includes('22091A3201');
    const hasSaiInScholars = portfoliosText.includes('P. Sai Kumar') || portfoliosText.includes('22091A3202');

    console.log('  Featured Scholars - Contains Naveen Kumar / 22091A3201?', hasNaveenInScholars);
    console.log('  Featured Scholars - Contains Sai Kumar / 22091A3202?', hasSaiInScholars);

    if (hasNaveenInScholars || hasSaiInScholars) {
      throw new Error(`FAILED: Removed users found in Featured Scholars! Naveen: ${hasNaveenInScholars}, Sai: ${hasSaiInScholars}`);
    }
    console.log('  ✅ SUCCESS: Featured Scholars are dynamic and exclude removed users.');

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_portfolios_dynamic_scholars.png'),
      fullPage: false
    });

    // 3. Visit Students Directory (/students)
    console.log('3. Checking Students Directory (/students) ...');
    await page.goto(`${BASE_URL}/students`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const studentsText = await page.innerText('body');
    const hasNaveenInStudents = studentsText.includes('K. V. Naveen Kumar') || studentsText.includes('22091A3201');
    const hasSaiInStudents = studentsText.includes('P. Sai Kumar') || studentsText.includes('22091A3202');

    console.log('  Students Directory - Contains Naveen?', hasNaveenInStudents);
    console.log('  Students Directory - Contains Sai?', hasSaiInStudents);

    if (hasNaveenInStudents || hasSaiInStudents) {
      throw new Error('FAILED: Trashed students present in /students directory');
    }
    console.log('  ✅ SUCCESS: /students directory is clean of removed users.');

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_students_directory_clean.png'),
      fullPage: false
    });

    // 4. Visit Achievements Gallery (/achievements)
    console.log('4. Checking Achievements Gallery (/achievements) ...');
    await page.goto(`${BASE_URL}/achievements`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const achText = await page.innerText('body');
    const hasNaveenAch = achText.includes('K. V. Naveen Kumar') || achText.includes('22091A3201');
    const hasSaiAch = achText.includes('P. Sai Kumar') || achText.includes('22091A3202');

    console.log('  Achievements - Contains Naveen?', hasNaveenAch);
    console.log('  Achievements - Contains Sai?', hasSaiAch);

    if (hasNaveenAch || hasSaiAch) {
      throw new Error('FAILED: Trashed user achievements present in /achievements');
    }
    console.log('  ✅ SUCCESS: /achievements contains no achievements from removed users.');

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_achievements_directory_clean.png'),
      fullPage: false
    });

    // 5. Direct URL check for removed student (/students/22091A3201)
    console.log('5. Checking Direct Profile access (/students/22091A3201) ...');
    const res = await page.goto(`${BASE_URL}/students/22091A3201`);
    await page.waitForTimeout(2000);
    const pageText = await page.innerText('body');
    const isNotFound = res.status() === 404 || pageText.includes('404') || pageText.includes('This page could not be found') || pageText.includes('not found');

    console.log('  Direct Profile - Status is 404 / Not Found?', isNotFound, '(HTTP status:', res.status(), ')');
    if (!isNotFound) {
      throw new Error('FAILED: Trashed student profile is still publicly accessible!');
    }
    console.log('  ✅ SUCCESS: Trashed student profile returns 404 Not Found.');

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_removed_student_404.png'),
      fullPage: false
    });

    console.log('🎉 ALL EMPIRICAL CHECKS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
