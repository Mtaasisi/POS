// Centralized formatting utilities for LATS CHANCE Application
// Eliminates duplicated formatting functions across components

/**
 * Format money amounts in Tanzanian Shillings (TSH)
 * @param amount - The amount to format
 * @param showCurrency - Whether to show the currency symbol (default: true)
 * @returns Formatted currency string
 */
export const formatMoney = (amount: number, showCurrency: boolean = true): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return showCurrency ? 'TZS 0' : '0';
  }

  const formatter = new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    currencyDisplay: showCurrency ? 'symbol' : 'code'
  });

  return formatter.format(amount);
};

/**
 * Format currency with different display options
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number, 
  options: {
    currency?: string;
    showCurrency?: boolean;
    decimals?: number;
    locale?: string;
  } = {}
): string => {
  const {
    currency = 'TZS',
    showCurrency = true,
    decimals = 0,
    locale = 'en-TZ'
  } = options;

  if (typeof amount !== 'number' || isNaN(amount)) {
    return showCurrency ? `${currency} 0` : '0';
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    currencyDisplay: showCurrency ? 'symbol' : 'code'
  });

  return formatter.format(amount);
};

/**
 * Format numbers with K, M, B suffixes (e.g., 1.2K, 5.5M)
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number string
 */
export const formatNumber = (num: number, decimals: number = 1): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  if (num < 1000) {
    return num.toString();
  }

  if (num < 1000000) {
    const formatted = (num / 1000).toFixed(decimals);
    return formatted.replace(/\.0+$/, '') + 'K';
  }

  if (num < 1000000000) {
    const formatted = (num / 1000000).toFixed(decimals);
    return formatted.replace(/\.0+$/, '') + 'M';
  }

  const formatted = (num / 1000000000).toFixed(decimals);
  return formatted.replace(/\.0+$/, '') + 'B';
};

/**
 * Format percentages
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Format dates in various formats
 * @param date - Date object or string
 * @param format - Format type
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string, 
  format: 'short' | 'long' | 'time' | 'datetime' | 'relative' = 'short'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-TZ', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    
    case 'long':
      return dateObj.toLocaleDateString('en-TZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    
    case 'time':
      return dateObj.toLocaleTimeString('en-TZ', {
        hour: '2-digit',
        minute: '2-digit'
      });
    
    case 'datetime':
      return dateObj.toLocaleString('en-TZ', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    
    case 'relative':
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return formatDate(dateObj, 'short');
    
    default:
      return dateObj.toLocaleDateString('en-TZ');
  }
};

/**
 * Format file sizes
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format phone numbers (Tanzanian format)
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle Tanzanian phone numbers
  if (cleaned.startsWith('255')) {
    // International format: +255 XXX XXX XXX
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 12)}`;
  } else if (cleaned.startsWith('0')) {
    // Local format: 0XXX XXX XXX
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`;
  }
  
  // Return as is if doesn't match expected patterns
  return phone;
};

/**
 * Format text with proper capitalization
 * @param text - Text to format
 * @param type - Capitalization type
 * @returns Formatted text
 */
export const formatText = (
  text: string, 
  type: 'title' | 'sentence' | 'uppercase' | 'lowercase' = 'sentence'
): string => {
  if (!text) return '';

  switch (type) {
    case 'title':
      return text.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    
    case 'sentence':
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    
    case 'uppercase':
      return text.toUpperCase();
    
    case 'lowercase':
      return text.toLowerCase();
    
    default:
      return text;
  }
};

/**
 * Format status text with proper styling
 * @param status - Status string
 * @returns Formatted status text
 */
export const formatStatus = (status: string): string => {
  if (!status) return '';
  
  // Convert snake_case and kebab-case to Title Case
  return status
    .replace(/[-_]/g, ' ')
    .replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
};

/**
 * Format duration in human-readable format
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted duration string
 */
export const formatDuration = (milliseconds: number): string => {
  if (typeof milliseconds !== 'number' || isNaN(milliseconds)) {
    return '0s';
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Format address in a readable format
 * @param address - Address object or string
 * @returns Formatted address string
 */
export const formatAddress = (address: any): string => {
  if (!address) return '';
  
  if (typeof address === 'string') {
    return address;
  }
  
  const parts = [];
  
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.region) parts.push(address.region);
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
};
