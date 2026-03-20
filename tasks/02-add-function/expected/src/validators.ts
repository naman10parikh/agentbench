export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
