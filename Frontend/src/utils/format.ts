/**
 * Utilities for formatting cricket statistics (strike rate, economy, NRR, averages).
 * Prevents raw IEEE 754 float serializations (e.g. 121.232345678765) from cluttering UI tables.
 */

/**
 * Formats a cricket rate/statistic (strike rate, economy, average) to a clean 2-decimal number.
 * e.g., 121.232345678765 -> "121.23"
 */
export function formatStat(
  val: number | string | undefined | null,
  decimals = 2,
  fallback = '-'
): string {
  if (val === undefined || val === null || val === '') return fallback;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (Number.isNaN(num)) return String(val);
  return num.toFixed(decimals);
}

/**
 * Formats Net Run Rate (NRR) with sign (+0.43 / -1.15) and clean decimals.
 */
export function formatNRR(
  val: number | string | undefined | null,
  decimals = 2
): string {
  if (val === undefined || val === null || val === '') return '0.00';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (Number.isNaN(num)) return String(val);
  const formatted = Math.abs(num).toFixed(decimals);
  if (num > 0) return `+${formatted}`;
  if (num < 0) return `-${formatted}`;
  return Number(0).toFixed(decimals);
}

/**
 * Safe integer formatter for runs, balls, wickets, maidens.
 */
export function formatInt(val: number | string | undefined | null, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  const num = typeof val === 'number' ? Math.round(val) : parseInt(String(val), 10);
  return Number.isNaN(num) ? fallback : num;
}
