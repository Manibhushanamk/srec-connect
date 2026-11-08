const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = '/home/kmanib/.gemini/antigravity-cli/brain/330d6f68-d766-4cd0-9c89-fd46306ad5c0/audit';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const PUBLIC_ROUTES = [
  { name: 'home', url: 'http://localhost:3000/' },
  { name: 'about', url: 'http://localhost:3000/about' },
  { name: 'achievements', url: 'http://localhost:3000/achievements' },
  { name: 'departments', url: 'http://localhost:3000/departments' },
  { name: 'events', url: 'http://localhost:3000/events' },
  { name: 'faculty', url: 'http://localhost:3000/faculty' },
  { name: 'faculty_profile', url: 'http://localhost:3000/faculty/cmw7bbzt10006ik59bnc32odt' },
  { name: 'students', url: 'http://localhost:3000/students' },
  { name: 'student_portfolio', url: 'http://localhost:3000/students/22091A3201' },
  { name: 'signin', url: 'http://localhost:3000/signin' },
  { name: 'login', url: 'http://localhost:3000/login' },
  { name: 'access_denied', url: 'http://localhost:3000/access-denied' },
];

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const report = [];

  console.log('--- 1. AUDITING PUBLIC ROUTES ---');
  const pubContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pubPage = await pubContext.newPage();

  for (const route of PUBLIC_ROUTES) {
    const consoleErrors = [];
    pubPage.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
      const response = await pubPage.goto(route.url, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response ? response.status() : 'NO_RESPONSE';
      const title = await pubPage.title();
      const shotPath = path.join(outDir, `page_${route.name}.png`);
      await pubPage.screenshot({ path: shotPath, fullPage: true });

      const item = {
        name: route.name,
        url: route.url,
        status,
        title,
        consoleErrors,
        screenshot: shotPath,
      };
      report.push(item);
      console.log(`[PUBLIC] ${route.name} (${route.url}) -> ${status} | Title: "${title}" | Errors: ${consoleErrors.length}`);
    } catch (err) {
      console.error(`[ERROR] ${route.name} failed:`, err.message);
      report.push({ name: route.name, url: route.url, error: err.message });
    }
  }
  await pubContext.close();

  console.log('\n--- 2. AUDITING AUTHENTICATED ADMIN ROUTES ---');
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const adminPage = await adminContext.newPage();

  // Sign in as Super Admin
  await adminPage.goto('http://localhost:3000/signin', { waitUntil: 'networkidle' });
  const superAdminBtn = adminPage.locator('button:has-text("Super Admin")').first();
  if (await superAdminBtn.count() > 0) {
    await superAdminBtn.click();
    await adminPage.waitForTimeout(2000);
    console.log('Super Admin clicked sign in, current URL:', adminPage.url());
  }

  const ADMIN_ROUTES = [
    { name: 'admin_dashboard', url: 'http://localhost:3000/admin' },
    { name: 'admin_users', url: 'http://localhost:3000/admin/users' },
    { name: 'admin_bulk_upload', url: 'http://localhost:3000/admin/bulk-upload' },
    { name: 'admin_achievements', url: 'http://localhost:3000/admin/achievements' },
  ];

  for (const route of ADMIN_ROUTES) {
    const consoleErrors = [];
    adminPage.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
      const response = await adminPage.goto(route.url, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response ? response.status() : 'NO_RESPONSE';
      const title = await adminPage.title();
      const shotPath = path.join(outDir, `page_${route.name}.png`);
      await adminPage.screenshot({ path: shotPath, fullPage: true });

      const item = {
        name: route.name,
        url: route.url,
        status,
        title,
        consoleErrors,
        screenshot: shotPath,
      };
      report.push(item);
      console.log(`[ADMIN] ${route.name} (${route.url}) -> ${status} | Title: "${title}" | Errors: ${consoleErrors.length}`);
    } catch (err) {
      console.error(`[ERROR] ${route.name} failed:`, err.message);
      report.push({ name: route.name, url: route.url, error: err.message });
    }
  }
  await adminContext.close();

  console.log('\n--- 3. AUDITING STUDENT DASHBOARD ROUTES ---');
  const studentContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const studentPage = await studentContext.newPage();

  await studentPage.goto('http://localhost:3000/signin', { waitUntil: 'networkidle' });
  const studentBtn = studentPage.locator('button:has-text("Student")').first();
  if (await studentBtn.count() > 0) {
    await studentBtn.click();
    await studentPage.waitForTimeout(2000);
    console.log('Student clicked sign in, current URL:', studentPage.url());
  }

  const STUDENT_ROUTES = [
    { name: 'student_dashboard', url: 'http://localhost:3000/dashboard/student' },
    { name: 'student_settings', url: 'http://localhost:3000/dashboard/student/settings' },
    { name: 'student_submit', url: 'http://localhost:3000/dashboard/student/submit' },
  ];

  for (const route of STUDENT_ROUTES) {
    const consoleErrors = [];
    studentPage.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
      const response = await studentPage.goto(route.url, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response ? response.status() : 'NO_RESPONSE';
      const title = await studentPage.title();
      const shotPath = path.join(outDir, `page_${route.name}.png`);
      await studentPage.screenshot({ path: shotPath, fullPage: true });

      const item = {
        name: route.name,
        url: route.url,
        status,
        title,
        consoleErrors,
        screenshot: shotPath,
      };
      report.push(item);
      console.log(`[STUDENT] ${route.name} (${route.url}) -> ${status} | Title: "${title}" | Errors: ${consoleErrors.length}`);
    } catch (err) {
      console.error(`[ERROR] ${route.name} failed:`, err.message);
      report.push({ name: route.name, url: route.url, error: err.message });
    }
  }
  await studentContext.close();

  console.log('\n--- 4. AUDITING FACULTY DASHBOARD ROUTES ---');
  const facultyContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const facultyPage = await facultyContext.newPage();

  await facultyPage.goto('http://localhost:3000/signin', { waitUntil: 'networkidle' });
  const facultyBtn = facultyPage.locator('button:has-text("Faculty")').first();
  if (await facultyBtn.count() > 0) {
    await facultyBtn.click();
    await facultyPage.waitForTimeout(2000);
    console.log('Faculty clicked sign in, current URL:', facultyPage.url());
  }

  const FACULTY_ROUTES = [
    { name: 'faculty_dashboard', url: 'http://localhost:3000/dashboard/faculty' },
    { name: 'faculty_settings', url: 'http://localhost:3000/dashboard/faculty/settings' },
  ];

  for (const route of FACULTY_ROUTES) {
    const consoleErrors = [];
    facultyPage.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
      const response = await facultyPage.goto(route.url, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response ? response.status() : 'NO_RESPONSE';
      const title = await facultyPage.title();
      const shotPath = path.join(outDir, `page_${route.name}.png`);
      await facultyPage.screenshot({ path: shotPath, fullPage: true });

      const item = {
        name: route.name,
        url: route.url,
        status,
        title,
        consoleErrors,
        screenshot: shotPath,
      };
      report.push(item);
      console.log(`[FACULTY] ${route.name} (${route.url}) -> ${status} | Title: "${title}" | Errors: ${consoleErrors.length}`);
    } catch (err) {
      console.error(`[ERROR] ${route.name} failed:`, err.message);
      report.push({ name: route.name, url: route.url, error: err.message });
    }
  }
  await facultyContext.close();

  await browser.close();

  fs.writeFileSync(path.join(outDir, 'audit_report.json'), JSON.stringify(report, null, 2));
  console.log('\n✅ Audit completed! Full results saved to audit_report.json');
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
