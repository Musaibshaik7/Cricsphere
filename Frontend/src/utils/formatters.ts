/** Formats rate-based cricket statistics without exposing floating-point noise. */
export const formatRate = (
  value: number | string | undefined | null,
  decimals = 2,
  fallback = '-'
): string => {
  if (value === undefined || value === null || value === '') return fallback;
  const numericValue = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(numericValue)) return String(value);

  return numericValue.toFixed(decimals);
};

/** Formats Net Run Rate (NRR) with sign (+0.43 / -1.15). */
export const formatNRR = (
  value: number | string | undefined | null,
  decimals = 2
): string => {
  if (value === undefined || value === null || value === '') return '0.00';
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return String(value);
  const formatted = Math.abs(num).toFixed(decimals);
  if (num > 0) return `+${formatted}`;
  if (num < 0) return `-${formatted}`;
  return Number(0).toFixed(decimals);
};
