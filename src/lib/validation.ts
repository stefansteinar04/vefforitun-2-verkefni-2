import { z } from 'zod';

export const todoTitleSchema = z
.string({ message: 'Titill er nauðsynlegur.' })
  .trim()
  .min(1, 'Titill má ekki vera tómur.')
  .max(255, 'Titill má vera að hámarki 255 stafir.');

export function validateTitle(title: FormDataEntryValue | null): { value?: string; error?: string } {
  const parsed = todoTitleSchema.safeParse(typeof title === 'string' ? title : '');
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ógild gögn.' };
  }
  return { value: parsed.data };
}

export function parseFinished(value: FormDataEntryValue | null): boolean {
  return value === 'on' || value === 'true' || value === '1';
}

export function parseIdParam(id: string | undefined): { id?: number; error?: string } {
  const n = Number(id);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return { error: 'Ógilt auðkenni.' };
  return { id: n };
}
