import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function audit() {
  console.log('=== SREC CONNECT v3.0 DATA RELATIONSHIPS AUDIT ===\n');

  // 1. Departments
  const depts = await prisma.department.findMany();
  console.log(`[DEPARTMENTS] Found ${depts.length} departments:`);
  for (const d of depts) {
    console.log(`  - ${d.code}: "${d.name}" (ID: ${d.id})`);
  }
  const aimlDept = depts.find(d => d.code === 'AIML' || d.code === 'CSE(AI&ML)' || d.name.includes('Artificial Intelligence'));
  console.log(`  -> Primary AIML Department ID: ${aimlDept?.id || 'NOT FOUND!'}\n`);

  // 2. Users and their Student/Faculty links
  const users = await prisma.user.findMany({
    include: { student: true, faculty: true, department: true }
  });
  console.log(`[USERS] Total: ${users.length}`);
  let unlinkedStudents = 0;
  let unlinkedFaculty = 0;
  let missingDeptUsers = 0;

  for (const u of users) {
    if (u.role === 'STUDENT' && !u.student) {
      console.log(`  ⚠️ User ${u.email} has role STUDENT but NO studentId linked!`);
      unlinkedStudents++;
    }
    if ((u.role === 'FACULTY' || u.role === 'HOD') && !u.faculty) {
      console.log(`  ⚠️ User ${u.email} has role ${u.role} but NO facultyId linked!`);
      unlinkedFaculty++;
    }
    if (!u.departmentId) {
      missingDeptUsers++;
    }
  }
  console.log(`  Summary: ${unlinkedStudents} unlinked students, ${unlinkedFaculty} unlinked faculty, ${missingDeptUsers} users with missing departmentId.\n`);

  // 3. Students
  const students = await prisma.student.findMany({
    include: { department: true, user: true, primaryAchievements: true, teamAchievements: true }
  });
  console.log(`[STUDENTS] Total: ${students.length}`);
  let studentsWithoutDept = 0;
  let studentsWithoutUser = 0;
  for (const s of students) {
    if (!s.departmentId) studentsWithoutDept++;
    if (!s.user) studentsWithoutUser++;
  }
  console.log(`  Students without department: ${studentsWithoutDept}`);
  console.log(`  Students without linked User account: ${studentsWithoutUser}\n`);

  // 4. Faculty
  const faculties = await prisma.faculty.findMany({
    include: { department: true, user: true, achievements: true }
  });
  console.log(`[FACULTY] Total: ${faculties.length}`);
  let facultyWithoutDept = 0;
  let facultyWithoutUser = 0;
  for (const f of faculties) {
    if (!f.departmentId) facultyWithoutDept++;
    if (!f.user) facultyWithoutUser++;
  }
  console.log(`  Faculty without department: ${facultyWithoutDept}`);
  console.log(`  Faculty without linked User account: ${facultyWithoutUser}\n`);

  // 5. Achievements and Team Members
  const achievements = await prisma.achievement.findMany({
    include: {
      category: true,
      department: true,
      primaryStudent: true,
      faculty: true,
      teamMembers: true,
    }
  });
  console.log(`[ACHIEVEMENTS] Total: ${achievements.length}`);
  let achWithoutDept = 0;
  let achWithoutPersonLink = 0;
  let teamMembersWithoutStudentId = 0;

  for (const a of achievements) {
    if (!a.departmentId) achWithoutDept++;
    if (a.personType === 'STUDENT' && !a.primaryStudentId) achWithoutPersonLink++;
    if (a.personType === 'FACULTY' && !a.facultyId) achWithoutPersonLink++;

    for (const tm of a.teamMembers) {
      if (!tm.studentId) {
        console.log(`  ⚠️ Team member ${tm.studentName} (${tm.rollNumber}) in achievement "${a.title}" has studentId === null`);
        teamMembersWithoutStudentId++;
      }
    }
  }
  console.log(`  Achievements with missing departmentId: ${achWithoutDept}`);
  console.log(`  Achievements with missing person links: ${achWithoutPersonLink}`);
  console.log(`  Team members with unlinked studentId: ${teamMembersWithoutStudentId}\n`);

  // 6. Incidents
  const incidents = await prisma.incident.findMany({
    include: { student: true, reporter: true }
  });
  console.log(`[INCIDENTS] Total: ${incidents.length}`);
  let incidentsWithoutStudent = 0;
  for (const inc of incidents) {
    if (!inc.studentId) incidentsWithoutStudent++;
  }
  console.log(`  Incidents without studentId: ${incidentsWithoutStudent}\n`);

  // 7. Events
  const events = await prisma.event.findMany({
    include: { department: true, category: true, registrations: true, attendances: true }
  });
  console.log(`[EVENTS] Total: ${events.length}`);
  let eventsWithoutDept = 0;
  for (const ev of events) {
    if (!ev.departmentId) eventsWithoutDept++;
  }
  console.log(`  Events without departmentId: ${eventsWithoutDept}\n`);

  // 8. Posts and Collaborators
  const posts = await prisma.post.findMany({
    include: { author: true, achievement: true, collaborators: true }
  });
  console.log(`[POSTS] Total: ${posts.length}`);
  let postCollabsUnlinked = 0;
  for (const p of posts) {
    for (const c of p.collaborators) {
      if (!c.userId) postCollabsUnlinked++;
    }
  }
  console.log(`  Post collaborators unlinked: ${postCollabsUnlinked}\n`);
}

audit().then(() => process.exit(0)).catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
