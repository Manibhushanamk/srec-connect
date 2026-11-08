import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/lib/prisma';
import robots from '../src/app/robots';
import sitemap from '../src/app/sitemap';

describe('Phase 10: Analytics, Search, SEO & Operations Workflow Tests', () => {
  it('1. should resolve universal search results across students, faculty and events', async () => {
    // 1. Search student by permanent roll number
    const student = await prisma.student.findFirst({
      where: { rollNumber: '22091A3201', isActive: true },
    });
    assert.ok(student);
    assert.equal(student.rollNumber, '22091A3201');

    // 2. Search faculty
    const faculty = await prisma.faculty.findFirst({
      where: { isActive: true },
    });
    assert.ok(faculty);

    // 3. Search events
    const event = await prisma.event.findFirst({
      where: { deletedAt: null },
    });
    assert.ok(event);
  });

  it('2. should aggregate department metrics and activity distribution without DB pool timeouts', async () => {
    const [students, faculty, achievements, events, deptCounts] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.faculty.count({ where: { isActive: true } }),
      prisma.achievement.count({ where: { deletedAt: null } }),
      prisma.event.count({ where: { deletedAt: null } }),
      prisma.department.findMany({
        where: { isActive: true },
        select: {
          code: true,
          _count: { select: { students: true, faculty: true, achievements: true } },
        },
      }),
    ]);

    assert.ok(students >= 1);
    assert.ok(faculty >= 1);
    assert.ok(deptCounts.length >= 1);

    const aiml = deptCounts.find((d) => d.code === 'AIML');
    assert.ok(aiml);
    assert.ok(aiml._count.students >= 1);
  });

  it('3. should enforce strict robots.txt disallow rules on private admin/api paths', () => {
    const robotsConfig = robots();

    assert.ok(robotsConfig.rules);
    const rule = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;

    assert.ok(rule.disallow);
    const disallowedList = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];

    assert.ok(disallowedList.includes('/admin/'));
    assert.ok(disallowedList.includes('/api/'));
    assert.ok(disallowedList.includes('/profile'));

    assert.ok(robotsConfig.sitemap?.includes('sitemap.xml'));
  });

  it('4. should dynamically generate comprehensive sitemap with high-priority public routes', async () => {
    const sitemapEntries = await sitemap();

    assert.ok(sitemapEntries.length >= 7);

    const urls = sitemapEntries.map((e) => e.url);
    assert.ok(urls.some((u) => u.endsWith('/events')));
    assert.ok(urls.some((u) => u.endsWith('/departments')));
    assert.ok(urls.some((u) => u.endsWith('/achievements')));
    assert.ok(urls.some((u) => u.endsWith('/students')));
    assert.ok(urls.some((u) => u.endsWith('/faculty')));

    // Dynamic entity check
    assert.ok(urls.some((u) => u.includes('/students/22091A3201') || u.includes('/events/')));
  });
});
