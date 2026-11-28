import type { SelectOption } from '@/components/ui/CreatableSelect';

/**
 * Persists a user-typed custom category to PostgreSQL via POST /api/categories
 * and returns a { value: id, label: name } option for immediate selection.
 */
export async function createCustomCategoryOption(
  name: string,
  type: 'ACHIEVEMENT' | 'EVENT' | 'BOTH' = 'BOTH'
): Promise<SelectOption | null> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim(), type }),
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  if (!data.category?.id) return null;
  return { value: data.category.id, label: data.category.name };
}

/**
 * Soft-deletes a DB category (Web Manager / HOD / Admin only) via DELETE /api/categories.
 * Matches by DB id or fallback name so filter dropdowns that key on category.name work cleanly too.
 */
export async function removeCategoryOption(option: SelectOption): Promise<boolean> {
  const isCuidLike = /^[a-z0-9]{20,}$/i.test(option.value) || /^[0-9a-f-]{32,36}$/i.test(option.value);
  const query = isCuidLike
    ? `id=${encodeURIComponent(option.value)}`
    : `name=${encodeURIComponent(option.label || option.value)}`;

  const res = await fetch(`/api/categories?${query}`, { method: 'DELETE' });
  return res.ok;
}

/**
 * Registers a user-typed custom academic cohort (e.g. "2026-2030") via POST /api/batches
 * and returns a { value, label } option for immediate selection.
 */
export async function createCustomBatchOption(batchName: string): Promise<SelectOption | null> {
  const res = await fetch('/api/batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: batchName.trim() }),
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  const val = data.batch?.name || batchName.trim();
  return { value: val, label: `${val} (Custom Cohort)` };
}

/**
 * Deactivates a registered custom academic cohort via DELETE /api/batches.
 */
export async function removeBatchOption(batchName: string): Promise<boolean> {
  const res = await fetch(`/api/batches?name=${encodeURIComponent(batchName)}`, {
    method: 'DELETE',
  });
  return res.ok;
}
