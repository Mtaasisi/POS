// Exchange Rate Utilities
// Functions to parse and handle exchange rates for purchase orders

export interface ExchangeRateInfo {
  rate: number;
  source: string;
  date: string;
  fromCurrency: string;
  toCurrency: string;
}

/**
 * Parse exchange rate from text input
 * Supports various formats like "1 USD = 150 TZS", "150 TZS = 1 USD", or just "150"
 */
export function parseExchangeRate(
  exchangeRateText: string, 
  fromCurrency: string, 
  toCurrency: string = 'TZS'
): ExchangeRateInfo | null {
  if (!exchangeRateText?.trim()) return null;
  
  // Try to parse common exchange rate formats
  const patterns = [
    /1\s*([A-Z]{3})\s*=\s*([\d,]+\.?\d*)\s*([A-Z]{3})/i,  // "1 USD = 150 TZS"
    /([\d,]+\.?\d*)\s*([A-Z]{3})\s*=\s*1\s*([A-Z]{3})/i,  // "150 TZS = 1 USD"
    /([\d,]+\.?\d*)/i  // Just the number
  ];
  
  for (const pattern of patterns) {
    const match = exchangeRateText.match(pattern);
    if (match) {
      if (match.length === 4) {
        // Format: "1 USD = 150 TZS" or "150 TZS = 1 USD"
        const currency1 = match[1] || match[3];
        const currency2 = match[3] || match[1];
        const rate = parseFloat(match[2].replace(/,/g, ''));
        
        if (currency1 === fromCurrency && currency2 === toCurrency) {
          return {
            rate,
            source: 'manual',
            date: new Date().toISOString(),
            fromCurrency,
            toCurrency
          };
        } else if (currency1 === toCurrency && currency2 === fromCurrency) {
          return {
            rate: 1 / rate,
            source: 'manual',
            date: new Date().toISOString(),
            fromCurrency,
            toCurrency
          };
        }
      } else if (match.length === 2) {
        // Just the number - assume it's the rate to TZS
        const rate = parseFloat(match[1].replace(/,/g, ''));
        return {
          rate,
          source: 'manual',
          date: new Date().toISOString(),
          fromCurrency,
          toCurrency
        };
      }
    }
  }
  
  return null;
}

/**
 * Convert amount from one currency to another using exchange rate
 */
export function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string, 
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) return amount;
  return amount * exchangeRate;
}

/**
 * Get exchange rate info for purchase order creation
 */
export function getExchangeRateInfo(
  exchangeRateText: string,
  fromCurrency: string,
  toCurrency: string = 'TZS'
): ExchangeRateInfo | null {
  return parseExchangeRate(exchangeRateText, fromCurrency, toCurrency);
}

/**
 * Calculate total amount in base currency
 */
export function calculateBaseCurrencyAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number {
  return convertCurrency(amount, fromCurrency, toCurrency, exchangeRate);
}
