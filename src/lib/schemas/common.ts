import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Reusable safe trimmed string builder for API validation schemas.
 */
export const trimmedStr = (min = 1, max = 500) =>
  z
    .string({ required_error: 'Required string value' })
    .transform((v) => v.trim())
    .refine((v) => v.length >= min, { message: `Must be at least ${min} character(s)` })
    .refine((v) => v.length <= max, { message: `Must not exceed ${max} characters` });

/**
 * Optional trimmed string that converts empty strings to undefined/null safely.
 */
export const optionalTrimmedStr = (max = 500) =>
  z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v.length <= max, { message: `Must not exceed ${max} characters` })
    .optional()
    .nullable();

export const emailSchema = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'Invalid email address format',
  });

export const batchSchema = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v.length >= 2 && v.length <= 40, {
    message: 'Academic batch must be between 2 and 40 characters',
  });

export const academicYearSchema = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v.length >= 4 && v.length <= 30, {
    message: 'Academic year must be between 4 and 30 characters',
  });

export const safeUrlSchema = z
  .string()
  .transform((v) => v.trim())
  .refine(
    (v) =>
      v === '' ||
      v.startsWith('/') ||
      v.startsWith('https://') ||
      v.startsWith('http://') ||
      v.startsWith('blob:'),
    { message: 'URL must use https://, http://, or relative app path' }
  )
  .optional()
  .nullable();

export type ParsedBodyResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

/**
 * Parses and validates JSON request body against a Zod schema,
 * returning structured HTTP 400 responses for malformed JSON or schema violations.
 */
export async function parseJsonBody<S extends z.ZodTypeAny>(
  req: Request,
  schema: S
): Promise<ParsedBodyResult<z.infer<S>>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      ),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const fieldLabel = firstIssue?.path?.length ? `${firstIssue.path.join('.')}: ` : '';
    return {
      success: false,
      response: NextResponse.json(
        {
          error: `${fieldLabel}${firstIssue?.message || 'Request schema validation failed'}`,
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: parsed.data };
}

/**
 * Parses URL search parameters cleanly against a Zod schema.
 */
export function parseQueryParams<S extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: S
): ParsedBodyResult<z.infer<S>> {
  const raw = Object.fromEntries(searchParams.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      response: NextResponse.json(
        {
          error: `Query parameter error: ${firstIssue?.message || 'Invalid query parameter'}`,
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: parsed.data };
}
