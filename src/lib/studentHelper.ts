export interface ParsedRollNumber {
  raw: string;
  normalized: string;
  isValid: boolean;
  batchYear?: string;
  branchCode?: string;
  branchName?: string;
  isLateralEntry?: boolean;
  admissionYear?: number;
  graduationYear?: number;
  entryMode?: 'REGULAR' | 'LATERAL_ENTRY';
  classBatchLabel?: string;
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

/**
 * Parses JNTUA / SREC roll numbers and accounts for both:
 * 1. Regular 4-Year B.Tech (e.g., 22091A3205 -> admitted 2022 -> Batch 2022-2026)
 * 2. Diploma Lateral Entry 3-Year B.Tech (e.g., 25X55A3306 or 25095A3206 -> admitted 2025
 *    directly into 2nd year -> belongs to the 2024-2028 batch)
 */
export function parseRollNumber(roll: string): ParsedRollNumber {
  if (!roll || typeof roll !== 'string') {
    return { raw: '', normalized: '', isValid: false };
  }

  const clean = roll.trim().toUpperCase().replace(/\[.*?\]/g, ''); // strip citations if any

  // Standard 10-char SREC / JNTU format:
  // e.g., 22 09 1A 32 05 or 25 X5 5A 33 06
  const match = clean.match(/^(\d{2})([0-9A-Z]{2})([0-9A-Z]{2})([0-9A-Z]{2})([0-9A-Z]{2})$/);

  if (!match) {
    // Fallback: check if roll contains 5A (lateral entry marker)
    const isLateralFallback = clean.includes('5A');
    const yrFallback = clean.match(/^(\d{2})/);
    const admissionYear = yrFallback ? 2000 + parseInt(yrFallback[1], 10) : 2024;
    const startYr = isLateralFallback ? admissionYear - 1 : admissionYear;
    const endYr = isLateralFallback ? admissionYear + 3 : admissionYear + 4;

    return {
      raw: roll,
      normalized: clean,
      isValid: clean.length >= 8 && clean.length <= 12,
      isLateralEntry: isLateralFallback,
      admissionYear,
      graduationYear: endYr,
      entryMode: isLateralFallback ? 'LATERAL_ENTRY' : 'REGULAR',
      batchYear: `${startYr}-${endYr}`,
      classBatchLabel: isLateralFallback
        ? `${startYr}-${endYr} (Lateral Entry Admitted ${admissionYear})`
        : `${startYr}-${endYr} (Regular Admitted ${admissionYear})`,
    };
  }

  const [, yrStr, colCode, progCode, branchCode] = match;
  const admissionYear = 2000 + parseInt(yrStr, 10);

  // '5A' or program code starting with '5' denotes Diploma Lateral Entry into 2nd Year
  const isLateral = progCode === '5A' || progCode.startsWith('5');
  const branchInfo = BRANCH_CODE_MAP[branchCode];

  // For Lateral Entry: joined in admissionYear directly into 2nd Year.
  // Their batch started 1 year prior (admissionYear - 1) and graduates in (admissionYear + 3).
  // e.g. Admitted in 2025 -> joins 2024-2028 batch!
  const startYr = isLateral ? admissionYear - 1 : admissionYear;
  const endYr = isLateral ? admissionYear + 3 : admissionYear + 4;

  return {
    raw: roll,
    normalized: clean,
    isValid: true,
    batchYear: `${startYr}-${endYr}`,
    branchCode: branchInfo?.code || 'UNKNOWN',
    branchName: branchInfo?.name || 'Engineering',
    isLateralEntry: isLateral,
    admissionYear,
    graduationYear: endYr,
    entryMode: isLateral ? 'LATERAL_ENTRY' : 'REGULAR',
    classBatchLabel: isLateral
      ? `${startYr}-${endYr} (Lateral Entry Admitted ${admissionYear})`
      : `${startYr}-${endYr} (Regular Admitted ${admissionYear})`,
  };
}

/**
 * Pre-defined academic batches with both Regular and Lateral Entry cohort labels.
 */
export const ACADEMIC_BATCH_OPTIONS = [
  { value: '2025-2029', label: '2025–2029 (Regular 2025 / Lateral Entry 2026)' },
  { value: '2024-2028', label: '2024–2028 (Regular 2024 / Lateral Entry 2025)' },
  { value: '2023-2027', label: '2023–2027 (Regular 2023 / Lateral Entry 2024)' },
  { value: '2022-2026', label: '2022–2026 (Regular 2022 / Lateral Entry 2023)' },
  { value: '2021-2025', label: '2021–2025 (Regular 2021 / Lateral Entry 2022)' },
  { value: '2026-2030', label: '2026–2030 (Regular 2026 / Lateral Entry 2027)' },
  { value: '2020-2024', label: '2020–2024 (Graduated)' },
];

/**
 * Helper to check if a student roll number belongs to a Diploma Lateral Entry student.
 */
export function isLateralEntryRoll(roll?: string | null): boolean {
  if (!roll) return false;
  return parseRollNumber(roll).isLateralEntry || false;
}

/**
 * Returns formatted cohort label for a batch string.
 */
export function getBatchLabel(batch?: string | null): string {
  if (!batch) return '';
  const found = ACADEMIC_BATCH_OPTIONS.find((opt) => opt.value === batch);
  return found ? found.label : `${batch} (Custom Cohort)`;
}

/**
 * Extracts start/end years from batch strings like "2024-2028" or "2026-30" for Batch table syncing.
 */
export function parseBatchYearRange(batch: string): { name: string; startYear: number; endYear: number } {
  const cleaned = batch.trim().replace(/\s+/g, '');
  const rangeMatch = cleaned.match(/^(\d{4})[-–](\d{2,4})$/);
  if (rangeMatch) {
    const startYear = parseInt(rangeMatch[1], 10);
    const rawEnd = rangeMatch[2];
    const endYear = rawEnd.length === 2 ? Math.floor(startYear / 100) * 100 + parseInt(rawEnd, 10) : parseInt(rawEnd, 10);
    return { name: `${startYear}-${endYear}`, startYear, endYear };
  }
  const singleYearMatch = cleaned.match(/(\d{4})/);
  const startYear = singleYearMatch ? parseInt(singleYearMatch[1], 10) : new Date().getFullYear();
  return { name: batch.trim(), startYear, endYear: startYear + 4 };
}

/**
 * Merges static ACADEMIC_BATCH_OPTIONS with dynamic batches discovered from DB or current state.
 */
export function buildMergedBatchOptions(
  dynamicBatches: Array<string | { name?: string; value?: string }> = []
): Array<{ value: string; label: string }> {
  const map = new Map<string, string>();
  for (const opt of ACADEMIC_BATCH_OPTIONS) {
    map.set(opt.value, opt.label);
  }
  for (const item of dynamicBatches) {
    const val = (typeof item === 'string' ? item : item?.name || item?.value || '').trim();
    if (val && !map.has(val)) {
      map.set(val, `${val} (Custom Cohort)`);
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([value, label]) => ({ value, label }));
}

