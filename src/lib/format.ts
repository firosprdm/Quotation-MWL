/**
 * Formats a number as a currency string in SAR.
 * Example: 1234.56 -> "SAR 1,234.56"
 */
export function formatCurrency(amount: number): string {
  return `SAR ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

/**
 * Formats a number with comma separators and 2 decimal places.
 * Example: 1234.56 -> "1,234.56"
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
