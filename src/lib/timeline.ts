export const ACHIEVEMENT_TIMELINE_PRESETS = [
  { value: 'ALL', label: 'All Time' },
  { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'LAST_3_MONTHS', label: 'Last 3 Months' },
  { value: 'LAST_6_MONTHS', label: 'Last 6 Months' },
  { value: 'CURRENT_ACADEMIC_YEAR', label: 'Current Academic Year (Jun–May)' },
  { value: 'PREVIOUS_ACADEMIC_YEAR', label: 'Previous Academic Year' },
  { value: 'THIS_YEAR', label: 'This Calendar Year' },
  { value: 'LAST_YEAR', label: 'Last Calendar Year' },
  { value: 'CUSTOM', label: 'Custom Time Period' },
] as const;

export const EVENT_TIMELINE_PRESETS = [
  { value: 'ALL', label: 'All Time' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'NEXT_30_DAYS', label: 'Next 30 Days' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'LAST_3_MONTHS', label: 'Last 3 Months' },
  { value: 'LAST_6_MONTHS', label: 'Last 6 Months' },
  { value: 'CURRENT_ACADEMIC_YEAR', label: 'Current Academic Year (Jun–May)' },
  { value: 'PREVIOUS_ACADEMIC_YEAR', label: 'Previous Academic Year' },
  { value: 'THIS_YEAR', label: 'This Calendar Year' },
  { value: 'LAST_YEAR', label: 'Last Calendar Year' },
  { value: 'CUSTOM', label: 'Custom Time Period' },
] as const;

export const TIMELINE_PRESETS = ACHIEVEMENT_TIMELINE_PRESETS;

export type TimelinePreset =
  | (typeof ACHIEVEMENT_TIMELINE_PRESETS)[number]['value']
  | (typeof EVENT_TIMELINE_PRESETS)[number]['value'];

export interface ResolvedDateRange {
  gte?: Date;
  lte?: Date;
  label: string;
  preset: string;
}

function parseIsoDateBoundary(raw: string | null | undefined, endOfDay: boolean): Date | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const dt = new Date(`${trimmed}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
    return Number.isNaN(dt.getTime()) ? undefined : dt;
  }
  const dt = new Date(trimmed);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

/**
 * Resolves a named timeline preset or explicit dateFrom/dateTo bounds into UTC Date filters.
 * Follows Indian Autonomous College Academic Year calendar (June 1 to May 31).
 */
export function resolveTimelineDateRange(
  timeline?: string | null,
  dateFrom?: string | null,
  dateTo?: string | null,
  now: Date = new Date()
): ResolvedDateRange {
  const normalized = (timeline || 'ALL').trim().toUpperCase();
  const explicitFrom = parseIsoDateBoundary(dateFrom, false);
  const explicitTo = parseIsoDateBoundary(dateTo, true);

  if (normalized === 'CUSTOM' || explicitFrom || explicitTo) {
    const labelParts = [
      explicitFrom ? explicitFrom.toISOString().slice(0, 10) : 'Start',
      explicitTo ? explicitTo.toISOString().slice(0, 10) : 'Present',
    ];
    return {
      ...(explicitFrom ? { gte: explicitFrom } : {}),
      ...(explicitTo ? { lte: explicitTo } : {}),
      label: `${labelParts[0]} to ${labelParts[1]}`,
      preset: 'CUSTOM',
    };
  }

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed (June = 5)
  const startToday = new Date(Date.UTC(year, month, now.getUTCDate(), 0, 0, 0, 0));
  const endNow = new Date(Date.UTC(year, month, now.getUTCDate(), 23, 59, 59, 999));

  switch (normalized) {
    case 'THIS_WEEK': {
      const day = now.getUTCDay(); // 0 = Sun, 1 = Mon
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const start = new Date(startToday);
      start.setUTCDate(start.getUTCDate() + diffToMonday);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 6);
      end.setUTCHours(23, 59, 59, 999);
      return { gte: start, lte: end, label: 'This Week', preset: normalized };
    }
    case 'NEXT_30_DAYS': {
      const end = new Date(endNow);
      end.setUTCDate(end.getUTCDate() + 30);
      return { gte: startToday, lte: end, label: 'Next 30 Days', preset: normalized };
    }
    case 'LAST_7_DAYS': {
      const start = new Date(endNow);
      start.setUTCDate(start.getUTCDate() - 6);
      start.setUTCHours(0, 0, 0, 0);
      return { gte: start, lte: endNow, label: 'Last 7 Days', preset: normalized };
    }
    case 'THIS_MONTH': {
      const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      return { gte: start, lte: end, label: 'This Month', preset: normalized };
    }
    case 'LAST_3_MONTHS': {
      const start = new Date(Date.UTC(year, month - 2, 1, 0, 0, 0, 0));
      return { gte: start, lte: endNow, label: 'Last 3 Months', preset: normalized };
    }
    case 'LAST_6_MONTHS': {
      const start = new Date(Date.UTC(year, month - 5, 1, 0, 0, 0, 0));
      return { gte: start, lte: endNow, label: 'Last 6 Months', preset: normalized };
    }
    case 'CURRENT_ACADEMIC_YEAR': {
      const acStartYear = month >= 5 ? year : year - 1;
      const start = new Date(Date.UTC(acStartYear, 5, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(acStartYear + 1, 4, 31, 23, 59, 59, 999));
      return {
        gte: start,
        lte: end,
        label: `AY ${acStartYear}-${acStartYear + 1}`,
        preset: normalized,
      };
    }
    case 'PREVIOUS_ACADEMIC_YEAR': {
      const acStartYear = (month >= 5 ? year : year - 1) - 1;
      const start = new Date(Date.UTC(acStartYear, 5, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(acStartYear + 1, 4, 31, 23, 59, 59, 999));
      return {
        gte: start,
        lte: end,
        label: `AY ${acStartYear}-${acStartYear + 1}`,
        preset: normalized,
      };
    }
    case 'THIS_YEAR': {
      const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      return { gte: start, lte: end, label: `Year ${year}`, preset: normalized };
    }
    case 'LAST_YEAR': {
      const prev = year - 1;
      const start = new Date(Date.UTC(prev, 0, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(prev, 11, 31, 23, 59, 59, 999));
      return { gte: start, lte: end, label: `Year ${prev}`, preset: normalized };
    }
    default:
      return { label: 'All Time', preset: 'ALL' };
  }
}

/**
 * Formats an optional Prisma date range filter object from timeline/dateFrom/dateTo.
 */
export function buildDateRangePrismaFilter(
  timeline?: string | null,
  dateFrom?: string | null,
  dateTo?: string | null
): { gte?: Date; lte?: Date } | undefined {
  const resolved = resolveTimelineDateRange(timeline, dateFrom, dateTo);
  if (!resolved.gte && !resolved.lte) return undefined;
  return {
    ...(resolved.gte ? { gte: resolved.gte } : {}),
    ...(resolved.lte ? { lte: resolved.lte } : {}),
  };
}
