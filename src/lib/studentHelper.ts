export interface ParsedRollNumber {
  raw: string;
  normalized: string;
  isValid: boolean;
  batchYear?: string;
  branchCode?: string;
  branchName?: string;
  isLateralEntry?: boolean;
}

const BRANCH_CODE_MAP: Record<string, { code: string; name: string }> = {
  '01': { code: 'CIVIL', name: 'Civil Engineering' },
  '02': { code: 'EEE', name: 'Electrical & Electronics Engineering' },
  '03': { code: 'MECH', name: 'Mechanical Engineering' },
  '04': { code: 'ECE', name: 'Electronics & Communication Engineering' },
  '05': { code: 'CSE', name: 'Computer Science & Engineering' },
  '31': { code: 'CSIT', name: 'Computer Science & Information Technology' },
  '32': { code: 'AIML', name: 'Artificial Intelligence & Machine Learning' },
  '33': { code: 'CSD', name: 'Data Science' },
  '38': { code: 'CSG', name: 'Computer Science & Design' },
  'E0': { code: 'MBA', name: 'Master of Business Administration' },
  'F0': { code: 'MCA', name: 'Master of Computer Applications' },
};

export function parseRollNumber(roll: string): ParsedRollNumber {
  if (!roll || typeof roll !== 'string') {
    return { raw: '', normalized: '', isValid: false };
  }

  const clean = roll.trim().toUpperCase().replace(/\[.*?\]/g, ''); // strip citations like [cite: 3]
  // Standard SREC format: e.g. 22091A3201 or 22X51A3828
  const match = clean.match(/^(\d{2})([0-9A-Z]{3})(\d)([0-9A-Z]{2})([0-9A-Z]{2})$/);

  if (!match) {
    return {
      raw: roll,
      normalized: clean,
      isValid: clean.length >= 8 && clean.length <= 12,
    };
  }

  const [, yrStr, colCode, degreeCode, branchCode, seatNum] = match;
  const startYr = 2000 + parseInt(yrStr, 10);
  const endYr = startYr + 4;
  const branchInfo = BRANCH_CODE_MAP[branchCode];
  const isLateral = colCode.includes('5');

  return {
    raw: roll,
    normalized: clean,
    isValid: true,
    batchYear: `${startYr}-${endYr}`,
    branchCode: branchInfo?.code || 'UNKNOWN',
    branchName: branchInfo?.name || 'Engineering',
    isLateralEntry: isLateral,
  };
}
