/**
 * Utility functions for number formatting with thousands separators
 * Consistent formatting across all price input fields
 */

/**
 * Format number with commas for thousands separators
 * @param num - The number to format
 * @returns Formatted string with commas (e.g., "1,000")
 */
export const formatNumberWithCommas = (num: number | string): string => {
  if (!num && num !== 0) return '';
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '';
  
  // Use user preference for uppercase K thousands [[memory:6329369]]
  return numValue.toLocaleString('en-US', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2 
  });
};

/**
 * Parse number from formatted string (removes commas)
 * @param str - The formatted string to parse
 * @returns Numeric value
 */
export const parseNumberFromString = (str: string): number => {
  if (!str) return 0;
  const cleanValue = str.replace(/,/g, '');
  const numValue = parseFloat(cleanValue);
  return isNaN(numValue) ? 0 : numValue;
};

/**
 * Format currency value with clean display (no trailing .00) [[memory:6327226]]
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'TZS')
 * @returns Formatted currency string
 */
export const formatCurrencyClean = (amount: number, currency: string = 'TZS'): string => {
  const formatted = formatNumberWithCommas(amount);
  return `${currency} ${formatted}`;
};

/**
 * Validate if string contains valid number format
 * @param str - String to validate
 * @returns True if valid number format
 */
export const isValidNumberFormat = (str: string): boolean => {
  if (!str) return true; // Empty string is valid
  const cleanValue = str.replace(/,/g, '');
  return /^\d*\.?\d*$/.test(cleanValue);
};

/**
 * Auto-format number input while typing
 * @param inputValue - Current input value
 * @param cursorPosition - Current cursor position
 * @returns Object with formatted value and new cursor position
 */
export const autoFormatInput = (inputValue: string, cursorPosition: number = 0) => {
  const cleanValue = inputValue.replace(/,/g, '');
  
  if (!cleanValue || isNaN(parseFloat(cleanValue))) {
    return { formattedValue: inputValue, newCursorPosition: cursorPosition };
  }
  
  const formatted = formatNumberWithCommas(parseFloat(cleanValue));
  const commasAdded = (formatted.match(/,/g) || []).length - (inputValue.match(/,/g) || []).length;
  const newCursorPosition = cursorPosition + commasAdded;
  
  return { 
    formattedValue: formatted, 
    newCursorPosition: Math.max(0, Math.min(newCursorPosition, formatted.length))
  };
};
