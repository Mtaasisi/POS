// Currency utilities for payments and general use
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

// Supported currencies with flags and symbols
export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS', flag: '🇹🇿' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' }
];

// Default currency (Tanzanian Shilling)
export const DEFAULT_CURRENCY: Currency = SUPPORTED_CURRENCIES[0];

/**
 * Get currency by code
 */
export const getCurrencyByCode = (code: string): Currency | undefined => {
  return SUPPORTED_CURRENCIES.find(currency => currency.code === code);
};

/**
 * Format amount with currency symbol and flag
 */
export const formatCurrency = (amount: number, currency: Currency): string => {
  if (currency.code === 'TZS') {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount).replace(/\.00$/, '').replace(/\.0$/, '');
  }
  
  if (currency.code === 'AED') {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  return `${currency.symbol}${amount.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Format amount with currency flag and symbol (for display)
 */
export const formatCurrencyWithFlag = (amount: number, currency: Currency): string => {
  const formatted = formatCurrency(amount, currency);
  return `${currency.flag} ${formatted}`;
};

/**
 * Format amount without trailing .00 or .0 (clean format)
 */
export const formatCurrencyClean = (amount: number, currency: Currency): string => {
  if (currency.code === 'TZS') {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount).replace(/\.00$/, '').replace(/\.0$/, '');
  }
  
  return `${currency.symbol}${amount.toLocaleString(undefined, { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2 
  })}`.replace(/\.00$/, '').replace(/\.0$/, '');
};

/**
 * Get currency display text (flag + code + symbol)
 */
export const getCurrencyDisplay = (currency: Currency): string => {
  return `${currency.flag} ${currency.code} (${currency.symbol})`;
};

/**
 * Validate currency code
 */
export const isValidCurrencyCode = (code: string): boolean => {
  return SUPPORTED_CURRENCIES.some(currency => currency.code === code);
};

/**
 * Get currency options for select components
 */
export const getCurrencyOptions = () => {
  return SUPPORTED_CURRENCIES.map(currency => ({
    value: currency.code,
    label: getCurrencyDisplay(currency),
    currency
  }));
};