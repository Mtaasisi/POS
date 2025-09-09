// Currency formatting utilities that remove trailing .00 and .0

/**
 * Formats a number as currency without trailing .00 or .0
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'TZS')
 * @param locale - The locale (default: 'en-TZ')
 * @returns Formatted currency string without trailing zeros
 */
export function formatCurrencyClean(amount: number, currency: string = 'TZS', locale: string = 'en-TZ'): string {
  // Use Intl.NumberFormat to get the formatted string
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  
  // Remove trailing .00 and .0
  return formatted.replace(/\.00$/, '').replace(/\.0$/, '');
}

/**
 * Formats a number as currency with full numbers (no trailing zeros)
 * @param amount - The amount to format
 * @returns Formatted currency string with full numbers
 */
export function formatCurrencyAbbreviated(amount: number): string {
  return formatCurrencyClean(amount);
}

/**
 * Formats a number as a simple string without currency symbol (no trailing zeros)
 * @param amount - The amount to format
 * @param locale - The locale (default: 'en-TZ')
 * @returns Formatted number string without trailing zeros
 */
export function formatNumberClean(amount: number, locale: string = 'en-TZ'): string {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  
  // Remove trailing .00 and .0
  return formatted.replace(/\.00$/, '').replace(/\.0$/, '');
}

/**
 * Formats a percentage without trailing .0
 * @param value - The percentage value (0-100)
 * @returns Formatted percentage string without trailing zeros
 */
export function formatPercentageClean(value: number): string {
  const formatted = value.toFixed(1);
  return `${formatted.replace(/\.0$/, '')}%`;
}

/**
 * Formats file size without trailing .0
 * @param bytes - Size in bytes
 * @returns Formatted file size string without trailing zeros
 */
export function formatFileSizeClean(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    const formatted = mb.toFixed(2);
    return `${formatted.replace(/\.00$/, '').replace(/\.0$/, '')} MB`;
  } else if (bytes >= 1024) {
    const kb = bytes / 1024;
    const formatted = kb.toFixed(1);
    return `${formatted.replace(/\.0$/, '')} KB`;
  } else {
    return `${bytes} B`;
  }
}
