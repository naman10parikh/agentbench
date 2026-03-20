/**
 * Clamp a number between min and max bounds.
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) throw new RangeError("min must be <= max");
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate the average of an array of numbers.
 * Returns 0 for empty arrays.
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return sum / numbers.length;
}

/**
 * Return the median of an array of numbers.
 * Returns 0 for empty arrays.
 */
export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate standard deviation of an array of numbers.
 * Returns 0 for arrays with fewer than 2 elements.
 */
export function standardDeviation(numbers: number[]): number {
  if (numbers.length < 2) return 0;
  const avg = average(numbers);
  const squaredDiffs = numbers.map((n) => (n - avg) ** 2);
  const variance =
    squaredDiffs.reduce((acc, d) => acc + d, 0) / (numbers.length - 1);
  return Math.sqrt(variance);
}
