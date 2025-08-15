// Format utility for LATS module
export interface FormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

// Default format options
const DEFAULT_OPTIONS: FormatOptions = {
  currency: 'TZS',
  locale: 'en-TZ',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
};

/**
 * Format a number as currency
 */
export function money(
  amount: number, 
  options: FormatOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    return new Intl.NumberFormat(opts.locale, {
      style: 'currency',
      currency: opts.currency,
      minimumFractionDigits: opts.minimumFractionDigits,
      maximumFractionDigits: opts.maximumFractionDigits
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `${opts.currency} ${amount.toFixed(opts.maximumFractionDigits || 2)}`;
  }
}

/**
 * Format a number as currency (alias for money)
 */
export function currency(
  amount: number, 
  options: FormatOptions = {}
): string {
  return money(amount, options);
}

/**
 * Format a number as percentage
 */
export function percent(
  value: number, 
  options: Omit<FormatOptions, 'currency'> = {}
): string {
  const opts = { 
    locale: DEFAULT_OPTIONS.locale,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options 
  };
  
  try {
    return new Intl.NumberFormat(opts.locale, {
      style: 'percent',
      minimumFractionDigits: opts.minimumFractionDigits,
      maximumFractionDigits: opts.maximumFractionDigits
    }).format(value / 100);
  } catch (error) {
    // Fallback formatting
    return `${value.toFixed(opts.maximumFractionDigits || 2)}%`;
  }
}

/**
 * Format a number with thousands separators
 */
export function number(
  value: number, 
  options: Omit<FormatOptions, 'currency'> = {}
): string {
  const opts = { 
    locale: DEFAULT_OPTIONS.locale,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options 
  };
  
  try {
    return new Intl.NumberFormat(opts.locale, {
      minimumFractionDigits: opts.minimumFractionDigits,
      maximumFractionDigits: opts.maximumFractionDigits
    }).format(value);
  } catch (error) {
    // Fallback formatting
    return value.toFixed(opts.maximumFractionDigits || 2);
  }
}

/**
 * Format a date
 */
export function date(
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = DEFAULT_OPTIONS.locale;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  try {
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    // Fallback formatting
    return dateObj.toLocaleDateString();
  }
}

/**
 * Format a date and time
 */
export function dateTime(
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = DEFAULT_OPTIONS.locale;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  try {
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    // Fallback formatting
    return dateObj.toLocaleString();
  }
}

/**
 * Format a relative time (e.g., "2 hours ago", "3 days ago")
 */
export function relativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

/**
 * Format file size
 */
export function fileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format phone number
 */
export function phoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Kenyan phone numbers
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  // Format 11-digit numbers (remove leading 0)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+254 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  // Return original if no pattern matches
  return phone;
}

/**
 * Format SKU with padding
 */
export function formatSKU(sku: string, prefix: string = '', length: number = 6): string {
  const numericPart = sku.replace(/\D/g, '');
  const paddedNumber = numericPart.padStart(length, '0');
  return `${prefix}${paddedNumber}`;
}

/**
 * Format order number
 */
export function formatOrderNumber(orderNumber: string): string {
  return orderNumber.toUpperCase();
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format attributes object to readable string
 */
export function formatAttributes(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([key, value]) => `${capitalize(key)}: ${value}`)
    .join(', ');
}

// Default export with all formatting functions
export const format = {
  money,
  currency,
  percent,
  number,
  date,
  dateTime,
  relativeTime,
  fileSize,
  phoneNumber,
  formatSKU,
  formatOrderNumber,
  truncate,
  capitalize,
  formatAttributes
};
