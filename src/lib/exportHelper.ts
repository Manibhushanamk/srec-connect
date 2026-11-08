import * as XLSX from 'xlsx';

export interface ExportDataPayload {
  departmentCode: string;
  departmentName: string;
  achievements: any[];
  faculty: any[];
  students: any[];
  events: any[];
}

export function generateExcelBuffer(data: ExportDataPayload): Buffer {
  const wb = XLSX.utils.book_new();

  // 1. Achievements Sheet
  const achRows = data.achievements.map((a) => ({
    'Achievement ID': a.id,
    'Title': a.title,
    'Person Name': a.personName,
    'Type': a.personType,
    'Roll Number / Faculty ID': a.primaryStudentRoll || a.facultyDesignation || '',
    'Category': a.category?.name || '',
    'Level': a.level,
    'Rank / Award': a.positionRank || '',
    'Event / Host Organization': a.organizationEventName,
    'Academic Year': a.academicYear,
    'Date': a.achievementDate ? new Date(a.achievementDate).toISOString().split('T')[0] : '',
    'Certificate Link': a.certificateUrl || a.googleDriveUrl || '',
    'Status': a.status,
  }));
  const wsAch = XLSX.utils.json_to_sheet(achRows);
  XLSX.utils.book_append_sheet(wb, wsAch, 'Achievements');

  // 2. Faculty Sheet
  const facRows = data.faculty.map((f) => ({
    'Faculty ID': f.id,
    'Name': f.name,
    'Designation': f.designation,
    'Role Category': f.roleCategory || '',
    'Email': f.email || '',
    'Experience': f.experience || '',
    'Specialization': f.specialization || '',
    'Cabin': f.cabin || '',
  }));
  const wsFac = XLSX.utils.json_to_sheet(facRows);
  XLSX.utils.book_append_sheet(wb, wsFac, 'Faculty Roster');

  // 3. Students Sheet
  const stuRows = data.students.map((s) => ({
    'Student ID': s.id,
    'Roll Number': s.rollNumber,
    'Name': s.name,
    'Batch': s.batch || '',
    'Section': s.section || 'A',
    'Email': s.email || '',
    'Phone': s.phone || '',
  }));
  const wsStu = XLSX.utils.json_to_sheet(stuRows);
  XLSX.utils.book_append_sheet(wb, wsStu, 'Students Roster');

  // 4. Events Sheet
  const evtRows = data.events.map((e) => ({
    'Event ID': e.id,
    'Title': e.title,
    'Category': e.category?.name || '',
    'Start Date': e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : '',
    'Venue': e.venue,
    'Organizer': e.organizer,
    'Participants Count': e.participantCount ?? 0,
    'Academic Year': e.academicYear,
    'Status': e.status,
  }));
  const wsEvt = XLSX.utils.json_to_sheet(evtRows);
  XLSX.utils.book_append_sheet(wb, wsEvt, 'Events & Symposia');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function generateCsvString(items: any[]): string {
  const ws = XLSX.utils.json_to_sheet(items);
  return XLSX.utils.sheet_to_csv(ws);
}
