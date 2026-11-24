import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAchievementRows,
  formatStudentRows,
  formatFacultyRows,
  formatEventRows,
  formatIncidentRows,
  generateExcelBuffer,
  generateCsvWithBom,
  generatePrintableHtml,
} from '../src/lib/exportHelper';

describe('Institutional Data Export Center Engine', () => {
  const mockAchievements = [
    {
      id: 'ach-1',
      title: 'First Prize in National AI Hackathon',
      personName: 'Murali K',
      personType: 'STUDENT',
      primaryStudentRoll: '25X55A3301',
      academicYear: '2025-2026',
      level: 'NATIONAL',
      positionRank: '1st Place',
      achievementDate: new Date('2026-03-15'),
      organizationEventName: 'IIT Bombay TechFest',
      status: 'APPROVED',
      category: { name: 'Hackathon' },
      department: { name: 'Artificial Intelligence & Machine Learning', code: 'AIML' },
      teamMembers: [{ studentName: 'Ravi Teja', rollNumber: '25X55A3302' }],
      createdAt: new Date('2026-03-16'),
    },
  ];

  const mockStudents = [
    {
      id: 'stu-1',
      rollNumber: '25X55A3301',
      name: 'Murali K',
      email: '25x55a3301@srecnandyal.edu.in',
      batch: '2022-2026',
      section: 'A',
      currentSemester: 8,
      isActive: true,
      department: { name: 'Artificial Intelligence & Machine Learning', code: 'AIML' },
      user: { status: 'ACTIVE' },
    },
    {
      id: 'stu-2',
      rollNumber: '22X51A3302',
      name: 'Sneha P',
      email: '22x51a3302@srecnandyal.edu.in',
      batch: '2022-2026',
      section: 'B',
      currentSemester: 8,
      isActive: true,
      department: { name: 'Computer Science & Engineering', code: 'CSE' },
      user: { status: 'ACTIVE' },
    },
  ];

  const mockFaculty = [
    {
      id: 'fac-1',
      name: 'Dr. Ramesh Kumar',
      email: 'ramesh.ai@srecnandyal.edu.in',
      designation: 'PROFESSOR',
      specialization: 'Deep Learning & Computer Vision',
      phone: '9876543210',
      isActive: true,
      department: { name: 'Artificial Intelligence & Machine Learning', code: 'AIML' },
    },
  ];

  const mockEvents = [
    {
      id: 'evt-1',
      title: 'International Conference on Agentic AI',
      venue: 'Auditorium 1',
      organizer: 'AIML Dept',
      speaker: 'Dr. Yann LeCun',
      startDate: new Date('2026-04-10'),
      endDate: new Date('2026-04-12'),
      academicYear: '2025-2026',
      capacity: 300,
      participantCount: 245,
      status: 'PUBLISHED',
      department: { name: 'Artificial Intelligence & Machine Learning', code: 'AIML' },
      category: { name: 'Academic' },
    },
  ];

  const mockIncidents = [
    {
      id: 'inc-1',
      title: 'Lab ID Card Misplacement',
      category: 'ACADEMIC_MISCONDUCT',
      severity: 'LOW',
      status: 'RESOLVED',
      createdAt: new Date('2026-02-01'),
      student: { name: 'Kiran V', rollNumber: '25X55A3305' },
      reporter: { name: 'Dr. Ramesh Kumar' },
      actions: [{ description: 'Card reissued with verification warning.' }],
    },
  ];

  test('formatAchievementRows correctly standardizes NAAC and NBA achievement records', () => {
    const rows = formatAchievementRows(mockAchievements as any);
    assert.equal(rows.length, 1);
    const row = rows[0];
    assert.equal(row['Honor / Award Title'], 'First Prize in National AI Hackathon');
    assert.equal(row['Academic Year'], '2025-2026');
    assert.equal(row['Competition Level'], 'NATIONAL');
    assert.equal(row['Award / Position'], '1st Place');
    assert.equal(row['Recipient Name'], 'Murali K');
    assert.equal(row['Primary Roll No'], '25X55A3301');
    assert.equal(row['Admission Cohort'], 'Diploma Lateral Entry (3-Yr)');
    assert.equal(row['Department'], 'AIML');
    assert.equal(row['Verification Status'], 'APPROVED');
  });

  test('formatStudentRows correctly labels Regular vs Diploma Lateral Entry scholars', () => {
    const rows = formatStudentRows(mockStudents as any);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]['Roll Number'], '25X55A3301');
    assert.equal(rows[0]['Entry Mode'], 'Diploma Lateral Entry');
    assert.equal(rows[1]['Roll Number'], '22X51A3302');
    assert.equal(rows[1]['Entry Mode'], 'Regular Admission');
  });

  test('formatFacultyRows correctly captures designation and contact registry', () => {
    const rows = formatFacultyRows(mockFaculty as any);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]['Full Name'], 'Dr. Ramesh Kumar');
    assert.equal(rows[0]['Designation'], 'PROFESSOR');
    assert.equal(rows[0]['Specialization & Research'], 'Deep Learning & Computer Vision');
    assert.equal(rows[0]['Phone'], '9876543210');
  });

  test('formatEventRows captures registration capacity and telemetry', () => {
    const rows = formatEventRows(mockEvents as any);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]['Event Title'], 'International Conference on Agentic AI');
    assert.equal(rows[0]['Confirmed Attendees'], 245);
    assert.equal(rows[0]['Total Capacity'], 300);
  });

  test('formatIncidentRows formats confidential grievance audit logs', () => {
    const rows = formatIncidentRows(mockIncidents as any);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]['Case Subject / Incident'], 'Lab ID Card Misplacement');
    assert.equal(rows[0]['Student Name'], 'Kiran V');
    assert.equal(rows[0]['Resolution Status'], 'RESOLVED');
  });

  test('generateExcelBuffer produces a valid multi-sheet Excel archive (.xlsx)', () => {
    const buffer = generateExcelBuffer(
      {
        departmentCode: 'AIML',
        departmentName: 'Artificial Intelligence & Machine Learning',
        academicYear: '2025-2026',
        generatedBy: 'System Administrator',
        achievements: mockAchievements as any,
        students: mockStudents as any,
        faculty: mockFaculty as any,
        events: mockEvents as any,
        incidents: mockIncidents as any,
      },
      'COMPLETE_INSTITUTIONAL_DUMP'
    );

    assert(Buffer.isBuffer(buffer));
    assert(buffer.length > 500); // XLSX signature / zip container
    // Check zip header (PK\x03\x04)
    assert.equal(buffer[0], 0x50);
    assert.equal(buffer[1], 0x4b);
  });

  test('generateCsvWithBom prepends UTF-8 Byte Order Mark (\\uFEFF) for Excel compatibility', () => {
    const rows = formatAchievementRows(mockAchievements as any);
    const csv = generateCsvWithBom(rows);
    assert(typeof csv === 'string');
    assert(csv.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM to prevent character corruption');
    assert(csv.includes('First Prize in National AI Hackathon'));
    assert(csv.includes('25X55A3301'));
  });

  test('generatePrintableHtml generates accreditation dossier with SREC IQAC headers and print styles', () => {
    const rows = formatAchievementRows(mockAchievements as any);
    const html = generatePrintableHtml({
      title: 'NAAC Criterion 5.3 Student Awards Dossier',
      subtitle: 'Accreditation Compliance Report',
      category: 'ACHIEVEMENTS',
      departmentName: 'Artificial Intelligence & Machine Learning (AIML)',
      academicYear: '2025-2026',
      rows,
    });

    assert(typeof html === 'string');
    assert(html.includes('SANTHIRAM ENGINEERING COLLEGE'));
    assert(html.includes('INTERNAL QUALITY ASSURANCE CELL (IQAC)'));
    assert(html.includes('@page {'));
    assert(html.includes('First Prize in National AI Hackathon'));
    assert(html.includes('25X55A3301'));
  });
});
