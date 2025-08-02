/**
 * Tanzania Phone Number Formatting Utilities
 * Centralized functions for formatting phone numbers with +255 country code
 */

/**
 * Format phone number with Tanzania country code (+255)
 * Handles various input formats and always returns +255XXXXXXXXX format
 */
export const formatTanzaniaPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all spaces, dashes, parentheses, dots, and other formatting
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // If already has +255 prefix, return as is
  if (cleanPhone.startsWith('+255')) {
    return cleanPhone;
  }
  
  // If has 255 prefix without +, add the +
  if (cleanPhone.startsWith('255')) {
    return '+' + cleanPhone;
  }
  
  // If starts with 0 (Tanzania mobile format), remove 0 and add +255
  if (cleanPhone.startsWith('0')) {
    return '+255' + cleanPhone.substring(1);
  }
  
  // If it's a 9-digit number (Tanzania mobile format), add +255
  if (cleanPhone.length === 9 && /^\d+$/.test(cleanPhone)) {
    return '+255' + cleanPhone;
  }
  
  // If it's a 10-digit number starting with 255, add +
  if (cleanPhone.length === 10 && cleanPhone.startsWith('255')) {
    return '+' + cleanPhone;
  }
  
  // For any other format, try to add +255 prefix
  // Remove any existing country code patterns and add +255
  const withoutCountryCode = cleanPhone.replace(/^(\+?255|\+?1|\+?44|\+?91|\+?86)/, '');
  if (withoutCountryCode.length === 9 && /^\d+$/.test(withoutCountryCode)) {
    return '+255' + withoutCountryCode;
  }
  
  // If it's already a valid Tanzania number format, just add +255
  if (cleanPhone.length >= 9 && /^\d+$/.test(cleanPhone)) {
    return '+255' + cleanPhone.slice(-9); // Take last 9 digits
  }
  
  // Default: add +255 prefix
  return '+255' + cleanPhone;
};

/**
 * Format WhatsApp number with Tanzania country code (+255)
 * Uses the same logic as phone number formatting
 */
export const formatTanzaniaWhatsAppNumber = (whatsapp: string): string => {
  return formatTanzaniaPhoneNumber(whatsapp);
};

/**
 * Clean phone number for SMS service (removes + and formats as 255XXXXXXXXX)
 * Used by SMS service which expects 255 prefix without +
 */
export const cleanPhoneForSMS = (phone: string): string => {
  const formatted = formatTanzaniaPhoneNumber(phone);
  return formatted.replace('+', '');
};

/**
 * Validate Tanzania phone number format
 * Returns true if the number is in valid Tanzania mobile format
 */
export const isValidTanzaniaPhone = (phone: string): boolean => {
  if (!phone) return false;
  
  const formatted = formatTanzaniaPhoneNumber(phone);
  
  // Check if it's a valid Tanzania mobile number
  // Should be +255 followed by 9 digits
  return /^\+255[0-9]{9}$/.test(formatted);
};

/**
 * Extract the mobile number part (last 9 digits) from a Tanzania phone number
 */
export const extractMobileNumber = (phone: string): string => {
  if (!phone) return '';
  
  const formatted = formatTanzaniaPhoneNumber(phone);
  return formatted.replace('+255', '');
};

/**
 * Format phone number for display (adds spaces for readability)
 * Example: +255 748 757 641
 */
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone) return '';
  
  const formatted = formatTanzaniaPhoneNumber(phone);
  
  // Add spaces for readability: +255 748 757 641
  if (formatted.startsWith('+255')) {
    const mobilePart = formatted.substring(4); // Remove +255
    return `+255 ${mobilePart.substring(0, 3)} ${mobilePart.substring(3, 6)} ${mobilePart.substring(6)}`;
  }
  
  return formatted;
};

/**
 * Check if two phone numbers are the same (ignoring formatting differences)
 */
export const areSamePhoneNumbers = (phone1: string, phone2: string): boolean => {
  if (!phone1 || !phone2) return false;
  
  const formatted1 = formatTanzaniaPhoneNumber(phone1);
  const formatted2 = formatTanzaniaPhoneNumber(phone2);
  
  return formatted1 === formatted2;
}; 