import { supabase } from './supabaseClient';
import { 
  SUPPORTED_CURRENCIES, 
  DEFAULT_CURRENCY, 
  getCurrencyByCode, 
  formatCurrency, 
  formatCurrencyClean,
  getCurrencyDisplay,
  getCurrencyOptions,
  Currency 
} from './currencyUtils';

export interface CurrencyData {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  exchangeRate?: number;
  lastUpdated?: string;
}

export interface CurrencyFilter {
  value: string;
  label: string;
  currency: Currency;
}

class CurrencyService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all supported currencies with their data
   */
  async getSupportedCurrencies(): Promise<CurrencyData[]> {
    const cacheKey = 'supported_currencies';
    const cachedData = this.getCachedData(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      // For now, return the static supported currencies
      // In the future, this could fetch from a database or API
      const currencies: CurrencyData[] = SUPPORTED_CURRENCIES.map(currency => ({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        flag: currency.flag,
        exchangeRate: currency.code === 'TZS' ? 1 : undefined, // TZS is base currency
        lastUpdated: new Date().toISOString()
      }));

      this.setCachedData(cacheKey, currencies);
      return currencies;
    } catch (error) {
      console.error('Error fetching supported currencies:', error);
      // Fallback to static currencies
      return SUPPORTED_CURRENCIES.map(currency => ({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        flag: currency.flag,
        exchangeRate: currency.code === 'TZS' ? 1 : undefined,
        lastUpdated: new Date().toISOString()
      }));
    }
  }

  /**
   * Get currency filter options for UI components
   */
  async getCurrencyFilterOptions(): Promise<CurrencyFilter[]> {
    const currencies = await this.getSupportedCurrencies();
    return currencies.map(currency => ({
      value: currency.code,
      label: getCurrencyDisplay(currency),
      currency: currency
    }));
  }

  /**
   * Get currencies used in payments from database
   */
  async getCurrenciesUsedInPayments(): Promise<string[]> {
    const cacheKey = 'currencies_used_in_payments';
    const cachedData = this.getCachedData(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      // Get currencies from all payment-related tables
      const [paymentsResult, poPaymentsResult, accountsResult] = await Promise.allSettled([
        // From customer payments
        supabase
          .from('customer_payments')
          .select('currency')
          .not('currency', 'is', null),
        
        // From purchase order payments
        supabase
          .from('purchase_order_payments')
          .select('currency')
          .not('currency', 'is', null),
        
        // From finance accounts
        supabase
          .from('finance_accounts')
          .select('currency')
          .not('currency', 'is', null)
      ]);

      const currencies = new Set<string>();
      
      // Process payments
      if (paymentsResult.status === 'fulfilled' && paymentsResult.value.data) {
        paymentsResult.value.data.forEach((payment: any) => {
          if (payment.currency) currencies.add(payment.currency);
        });
      }
      
      // Process purchase order payments
      if (poPaymentsResult.status === 'fulfilled' && poPaymentsResult.value.data) {
        poPaymentsResult.value.data.forEach((payment: any) => {
          if (payment.currency) currencies.add(payment.currency);
        });
      }
      
      // Process finance accounts
      if (accountsResult.status === 'fulfilled' && accountsResult.value.data) {
        accountsResult.value.data.forEach((account: any) => {
          if (account.currency) currencies.add(account.currency);
        });
      }

      // Always include TZS as default
      currencies.add('TZS');
      
      const currencyArray = Array.from(currencies).sort();
      this.setCachedData(cacheKey, currencyArray);
      return currencyArray;
    } catch (error) {
      console.error('Error fetching currencies used in payments:', error);
      // Fallback to default currencies
      return ['TZS', 'USD', 'EUR', 'GBP'];
    }
  }

  /**
   * Get currency statistics for dashboard
   */
  async getCurrencyStatistics(): Promise<Record<string, { count: number; totalAmount: number }>> {
    const cacheKey = 'currency_statistics';
    const cachedData = this.getCachedData(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const statistics: Record<string, { count: number; totalAmount: number }> = {};

      // Get statistics from customer payments
      const { data: paymentsData } = await supabase
        .from('customer_payments')
        .select('currency, amount')
        .not('currency', 'is', null);

      if (paymentsData) {
        paymentsData.forEach((payment: any) => {
          const currency = payment.currency || 'TZS';
          if (!statistics[currency]) {
            statistics[currency] = { count: 0, totalAmount: 0 };
          }
          statistics[currency].count += 1;
          statistics[currency].totalAmount += payment.amount || 0;
        });
      }

      // Get statistics from purchase order payments
      const { data: poPaymentsData } = await supabase
        .from('purchase_order_payments')
        .select('currency, amount')
        .not('currency', 'is', null);

      if (poPaymentsData) {
        poPaymentsData.forEach((payment: any) => {
          const currency = payment.currency || 'TZS';
          if (!statistics[currency]) {
            statistics[currency] = { count: 0, totalAmount: 0 };
          }
          statistics[currency].count += 1;
          statistics[currency].totalAmount += payment.amount || 0;
        });
      }

      this.setCachedData(cacheKey, statistics);
      return statistics;
    } catch (error) {
      console.error('Error fetching currency statistics:', error);
      return {};
    }
  }

  /**
   * Format amount with currency (using existing utility)
   */
  formatAmount(amount: number, currencyCode: string): string {
    const currency = getCurrencyByCode(currencyCode) || DEFAULT_CURRENCY;
    return formatCurrencyClean(amount, currency);
  }

  /**
   * Get currency display name
   */
  getCurrencyDisplayName(currencyCode: string): string {
    const currency = getCurrencyByCode(currencyCode);
    return currency ? getCurrencyDisplay(currency) : `${currencyCode} (Unknown)`;
  }

  /**
   * Validate currency code
   */
  isValidCurrency(currencyCode: string): boolean {
    return getCurrencyByCode(currencyCode) !== undefined;
  }

  /**
   * Get default currency
   */
  getDefaultCurrency(): Currency {
    return DEFAULT_CURRENCY;
  }

  /**
   * Get currency options for select components
   */
  getCurrencySelectOptions() {
    return getCurrencyOptions();
  }

  /**
   * Cache management
   */
  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(key: string): void {
    this.cache.delete(key);
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();
export default currencyService;
