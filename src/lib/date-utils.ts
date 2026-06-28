export function toDateString(value: unknown): string {
  if (value == null || value === '') return '';
  return String(value).split('T')[0] ?? '';
}

export function hasTimeComponent(value: unknown): boolean {
  if (value == null || value === '') return false;
  return String(value).includes('T');
}
