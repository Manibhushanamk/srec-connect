import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function generateRollNumberRegex(departmentCode: string): RegExp {
  const deptCodes: Record<string, string> = {
    AIML: '32',
    CSE: '05',
    CSD: '33',
    CSG: '34',
    CSIT: '06',
    ECE: '04',
    EEE: '02',
    MECH: '03',
    CIVIL: '01',
    MBA: '62',
    MCA: '63',
  };
  
  const deptNumber = deptCodes[departmentCode] || '\\d{2}';
  return new RegExp(`^(\\d{4})1A${deptNumber}(\\d{3})$`);
}

export function parseRollNumber(rollNumber: string): { year: string; deptCode: string; sequence: string } | null {
  const match = rollNumber.match(/^(\d{4})1A(\d{2})(\d{3})$/);
  if (!match) return null;
  return { year: match[1], deptCode: match[2], sequence: match[3] };
}

export function getDepartmentFromRollNumber(rollNumber: string): string | null {
  const parsed = parseRollNumber(rollNumber);
  if (!parsed) return null;
  
  const deptMap: Record<string, string> = {
    '32': 'AIML',
    '05': 'CSE',
    '33': 'CSD',
    '34': 'CSG',
    '06': 'CSIT',
    '04': 'ECE',
    '02': 'EEE',
    '03': 'MECH',
    '01': 'CIVIL',
    '62': 'MBA',
    '63': 'MCA',
  };
  
  return deptMap[parsed.deptCode] || null;
}

export function getBatchFromRollNumber(rollNumber: string): string | null {
  const parsed = parseRollNumber(rollNumber);
  if (!parsed) return null;
  
  const startYear = parseInt(parsed.year, 10);
  const endYear = startYear + 4;
  return `${startYear}-${endYear}`;
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateRollNumber(rollNumber: string): boolean {
  return /^\d{4}1A\d{2}\d{3}$/.test(rollNumber);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}