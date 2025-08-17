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
 * Formats a number as currency with abbreviated notation for large numbers (no trailing zeros)
 * @param amount - The amount to format
 * @returns Formatted currency string with abbreviations
 */
export function formatCurrencyAbbreviated(amount: number): string {
  if (amount >= 1000000) {
    // For millions
    const millions = amount / 1000000;
    if (millions >= 10) {
      // For 10M+, show as whole number
      return `Tsh ${Math.floor(millions)}M`;
    } else {
      // For 1M-9.9M, show with one decimal place (no trailing .0)
      const formatted = millions.toFixed(1);
      return `Tsh ${formatted.replace(/\.0$/, '')}M`;
    }
  } else if (amount >= 1000) {
    // For thousands
    const thousands = amount / 1000;
    if (thousands >= 10) {
      // For 10K+, show as whole number
      return `Tsh ${Math.floor(thousands)}K`;
    } else {
      // For 1K-9.9K, show with one decimal place (no trailing .0)
      const formatted = thousands.toFixed(1);
      return `Tsh ${formatted.replace(/\.0$/, '')}K`;
    }
  } else {
    // For numbers less than 1000, use regular formatting without trailing zeros
    return formatCurrencyClean(amount);
  }
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
