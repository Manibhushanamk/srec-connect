const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0';

async function signInUser(page, email) {
  await page.goto('http://localhost:3000/signin', { waitUntil: 'networkidle' });
  await page.evaluate(async (userEmail) => {
    const csrfRes = await fetch('/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();
    const body = new URLSearchParams({
      csrfToken,
      email: userEmail,
      json: 'true',
    });
    await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  }, email);
}

async function testRole(browser, roleName, email) {
  console.log(`\n=================== TESTING ROLE: ${roleName} (${email}) ===================`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const issues = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      issues.push(`[Console Error] ${msg.text()}`);
    }
  });

  await signInUser(page, email);

  // 1. Visit Home
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `role_${roleName}_home.png`) });

  // Check sidebar links
  const sidebarLinks = await page.$$eval('aside a', els => els.map(el => ({ text: el.innerText.trim(), href: el.getAttribute('href') })));
  console.log(`Sidebar links for ${roleName}:`, sidebarLinks.map(l => l.text).join(' | '));

  // 2. Check Role Specific Dashboard
  if (roleName === 'STUDENT') {
    await page.goto('http://localhost:3000/dashboard/student', { waitUntil: 'networkidle' });
    const currentUrl = page.url();
    console.log(`Student at /dashboard/student -> current URL: ${currentUrl}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `role_${roleName}_dashboard.png`) });

    // Check submit achievement page
    await page.goto('http://localhost:3000/dashboard/student/submit', { waitUntil: 'networkidle' });
    console.log(`Student at /dashboard/student/submit -> current URL: ${page.url()}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `role_${roleName}_submit_achievement.png`) });
  }

  if (roleName === 'FACULTY') {
    await page.goto('http://localhost:3000/dashboard/faculty', { waitUntil: 'networkidle' });
    console.log(`Faculty at /dashboard/faculty -> current URL: ${page.url()}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `role_${roleName}_dashboard.png`) });

    // Try /admin/achievements
    await page.goto('http://localhost:3000/admin/achievements', { waitUntil: 'networkidle' });
    console.log(`Faculty at /admin/achievements -> current URL: ${page.url()}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `role_${roleName}_admin_achievements.png`) });
  }

  if (roleName === 'HOD') {
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
    console.log(`HOD at /admin -> current URL: ${page.url()}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `role_${roleName}_admin.png`) });

    await page.goto('http://localhost:3000/admin/discipline', { waitUntil: 'networkidle' });
    console.log(`HOD at /admin/discipline -> current URL: ${page.url()}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `role_${roleName}_admin_discipline.png`) });
  }

  // 3. Visit Grievances & Conduct
  await page.goto('http://localhost:3000/grievances', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `role_${roleName}_grievances.png`) });

  // 4. Visit Events
  await page.goto('http://localhost:3000/events', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `role_${roleName}_events.png`) });

  // 5. Visit Achievements
  await page.goto('http://localhost:3000/achievements', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `role_${roleName}_achievements.png`) });

  console.log(`Console errors captured for ${roleName}:`, issues.length);
  if (issues.length > 0) {
    console.log(issues.slice(0, 5));
  }

  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    await testRole(browser, 'STUDENT', 'viswanadhum9985559753@gmail.com');
    await testRole(browser, 'FACULTY', 'geminiaones@gmail.com');
    await testRole(browser, 'HOD', 'manibhushanam5k@gmail.com');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
