/**
 * Phone number utility functions for Tanzanian phone numbers
 * Handles conversion between different formats (07123 <-> 2557123)
 */

/**
 * Cleans a phone number by removing spaces, dashes, and parentheses
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '');
}

/**
 * Converts a phone number starting with 0 to the 255 format
 * Example: 071234567 -> 25571234567
 */
export function convertToInternationalFormat(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  if (cleaned.startsWith('0')) {
    return `255${cleaned.substring(1)}`;
  }
  return cleaned;
}

/**
 * Converts a phone number starting with 255 to the local 0 format
 * Example: 25571234567 -> 071234567
 */
export function convertToLocalFormat(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  if (cleaned.startsWith('255')) {
    return `0${cleaned.substring(3)}`;
  }
  return cleaned;
}

/**
 * Generates all possible phone number variations for a given input
 * Useful for comprehensive phone number searching
 */
export function getPhoneNumberVariations(input: string): string[] {
  const cleaned = cleanPhoneNumber(input);
  const variations = new Set<string>();
  
  // Add the original cleaned number
  variations.add(cleaned);
  
  // If it starts with 0, add the 255 version
  if (/^0\d{3,}$/.test(cleaned)) {
    variations.add(convertToInternationalFormat(cleaned));
  }
  
  // If it starts with 255, add the 0 version
  if (/^255\d{3,}$/.test(cleaned)) {
    variations.add(convertToLocalFormat(cleaned));
  }
  
  // If it's a full international number, add local version
  if (/^\+255\d{9}$/.test(cleaned)) {
    variations.add(cleaned.substring(1)); // Remove +
    variations.add(convertToLocalFormat(cleaned.substring(1)));
  }
  
  return Array.from(variations);
}

/**
 * Checks if a customer's phone number matches a search term
 * Handles all Tanzanian phone number format conversions
 */
export function matchesPhoneSearch(customerPhone: string, searchTerm: string): boolean {
  if (!customerPhone || !searchTerm) return false;
  
  const cleanCustomerPhone = cleanPhoneNumber(customerPhone);
  const cleanSearchTerm = cleanPhoneNumber(searchTerm);
  
  // Direct match
  if (cleanCustomerPhone.includes(cleanSearchTerm)) {
    return true;
  }
  
  // Get all variations of the search term
  const searchVariations = getPhoneNumberVariations(cleanSearchTerm);
  
  // Check if any variation matches the customer's phone
  return searchVariations.some(variation => 
    cleanCustomerPhone.includes(variation)
  );
}

/**
 * Formats a phone number for display
 * Converts to local format (0XXXXXXXXX) for better readability
 */
export function formatPhoneForDisplay(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  
  // If it's an international format, convert to local
  if (cleaned.startsWith('255') && cleaned.length === 12) {
    return convertToLocalFormat(cleaned);
  }
  
  // If it's already in local format, return as is
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return cleaned;
  }
  
  // If it has +255, convert to local format
  if (cleaned.startsWith('+255') && cleaned.length === 13) {
    return convertToLocalFormat(cleaned.substring(1));
  }
  
  // Return as is if format is unclear
  return cleaned;
}

/**
 * Validates if a phone number is a valid Tanzanian mobile number
 */
export function isValidTanzanianMobile(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  
  // Check various valid formats
  const patterns = [
    /^0[67]\d{8}$/, // Local format: 0XXXXXXXXX (starting with 06 or 07)
    /^255[67]\d{8}$/, // International format: 255XXXXXXXXX
    /^\+255[67]\d{8}$/, // International format with +: +255XXXXXXXXX
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}