import { supabase } from './supabaseClient';

export interface PaymentProvider {
  id: string;
  name: string;
  type: 'mobile_money' | 'bank_transfer' | 'card_processor' | 'cash';
  status: 'active' | 'inactive' | 'maintenance';
  configuration: {
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    merchantId?: string;
    terminalId?: string;
    currency: string;
    fees: {
      percentage: number;
      fixed: number;
      minimum: number;
      maximum: number;
    };
    limits: {
      daily: number;
      monthly: number;
      perTransaction: number;
    };
    supportedMethods: string[];
    processingTime: string;
    settlementTime: string;
  };
  metadata: {
    description?: string;
    website?: string;
    supportEmail?: string;
    supportPhone?: string;
    documentation?: string;
  };
  performance: {
    successRate: number;
    averageResponseTime: number;
    totalTransactions: number;
    totalVolume: number;
    lastUsed?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface ProviderMetrics {
  totalProviders: number;
  activeProviders: number;
  totalVolume: number;
  averageSuccessRate: number;
  topPerformer: string;
  recentFailures: number;
}

class PaymentProviderService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 300000; // 5 minutes cache

  // Clear cache
  private clearCache() {
    this.cache.clear();
  }

  // Get cached data or null if expired
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  // Set cached data
  private setCachedData(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Get all payment providers with better error handling
  async getPaymentProviders(): Promise<PaymentProvider[]> {
    try {
      const cacheKey = 'payment_providers';
      
      // Check cache first
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Skip payment_providers table for now - use finance_accounts directly
      // This avoids 406 errors while the payment_providers table is being set up

      // Fallback to finance_accounts table with retry logic
      let retries = 3;
      let lastError: any;
      
      while (retries > 0) {
        try {
          const { data, error } = await supabase
            .from('finance_accounts')
            .select('*')
            .eq('is_active', true)
            .eq('is_payment_method', true)
            .order('name', { ascending: true });

          if (error) throw error;

          const providers = data?.map((account: any) => ({
            id: account.id,
            name: account.name,
            type: this.mapAccountTypeToProviderType(account.type),
            status: account.is_active ? 'active' : 'inactive',
            configuration: {
              apiKey: '', // Not stored in finance_accounts
              secretKey: '', // Not stored in finance_accounts
              webhookUrl: '', // Not stored in finance_accounts
              merchantId: '', // Not stored in finance_accounts
              terminalId: '', // Not stored in finance_accounts
              currency: account.currency || 'TZS',
              fees: {
                percentage: this.getDefaultFeePercentage(account.type),
                fixed: this.getDefaultFixedFee(account.type),
                minimum: this.getDefaultMinAmount(account.type),
                maximum: this.getDefaultMaxAmount(account.type)
              },
              limits: {
                daily: this.getDefaultDailyLimit(account.type),
                monthly: this.getDefaultMonthlyLimit(account.type),
                perTransaction: this.getDefaultMaxAmount(account.type)
              },
              supportedMethods: [account.name],
              processingTime: this.getDefaultProcessingTime(account.type),
              settlementTime: this.getDefaultSettlementTime(account.type)
            },
            metadata: {
              description: account.payment_description || account.notes || '',
              website: '', // Not stored in finance_accounts
              supportEmail: '', // Not stored in finance_accounts
              supportPhone: '', // Not stored in finance_accounts
              documentation: '' // Not stored in finance_accounts
            },
            performance: {
              successRate: this.getDefaultSuccessRate(account.type),
              averageResponseTime: this.getDefaultResponseTime(account.type),
              totalTransactions: 0, // Will be calculated from real transaction data
              totalVolume: 0, // Will be calculated from real transaction data
              lastUsed: account.updated_at || new Date().toISOString()
            },
            createdAt: account.created_at || new Date().toISOString(),
            updatedAt: account.updated_at || new Date().toISOString(),
            createdBy: 'system', // Not stored in finance_accounts
            updatedBy: undefined // Not stored in finance_accounts
          })) || [];

          this.setCachedData(cacheKey, providers);
          return providers;
        } catch (error) {
          lastError = error;
          retries--;
          
          if (retries > 0) {
            console.warn(`⚠️ Retrying payment providers fetch (${retries} attempts left):`, error);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // If all retries failed, return cached data if available
      const expiredCachedData = this.cache.get(cacheKey)?.data;
      if (expiredCachedData) {
        console.warn('⚠️ Using expired cached payment providers due to connection issues');
        return expiredCachedData;
      }
      
      throw lastError;
    } catch (error) {
      console.error('Error fetching payment providers:', error);
      return [];
    }
  }

  // Helper method to map finance account types to payment provider types
  private mapAccountTypeToProviderType(accountType: string): 'mobile_money' | 'bank_transfer' | 'card_processor' | 'cash' {
    switch (accountType?.toLowerCase()) {
      case 'mobile_money':
      case 'mpesa':
      case 'airtel_money':
        return 'mobile_money';
      case 'bank':
      case 'bank_transfer':
        return 'bank_transfer';
      case 'card':
      case 'credit_card':
      case 'debit_card':
        return 'card_processor';
      case 'cash':
        return 'cash';
      default:
        return 'mobile_money'; // Default fallback
    }
  }

  // Helper methods for default values based on payment type
  private getDefaultFeePercentage(type: string): number {
    switch (type?.toLowerCase()) {
      case 'cash':
        return 0;
      case 'mobile_money':
        return 1.5;
      case 'credit_card':
        return 2.5;
      case 'bank':
        return 0.5;
      default:
        return 1.0;
    }
  }

  private getDefaultFixedFee(type: string): number {
    switch (type?.toLowerCase()) {
      case 'cash':
        return 0;
      case 'mobile_money':
        return 0;
      case 'credit_card':
        return 50;
      case 'bank':
        return 0;
      default:
        return 0;
    }
  }

  private getDefaultMinAmount(type: string): number {
    switch (type?.toLowerCase()) {
      case 'cash':
        return 0;
      case 'mobile_money':
        return 100;
      case 'credit_card':
        return 100;
      case 'bank':
        return 1000;
      default:
        return 100;
    }
  }

  private getDefaultMaxAmount(type: string): number {
    switch (type?.toLowerCase()) {
      case 'cash':
        return 999999999;
      case 'mobile_money':
        return 1000000;
      case 'credit_card':
        return 2000000;
      case 'bank':
        return 5000000;
      default:
        return 1000000;
    }
  }

  private getDefaultDailyLimit(type: string): number {
    switch (type?.toLowerCase()) {
      case 'cash':
        return 999999999;
      case 'mobile_money':
        return 10000000;
      case 'credit_card':
        return 20000000;
      case 'bank':
        return 50000000;
      default:
        return 10000000;
    }
  }

  private getDefaultMonthlyLimit(type: string): number {
    return this.getDefaultDailyLimit(type) * 30;
  }

  private getDefaultProcessingTime(type: string): string {
    switch (type?.toLowerCase()) {
      case 'cash':
        return 'Instant';
      case 'mobile_money':
        return '2-5 seconds';
      case 'credit_card':
        return '3-10 seconds';
      case 'bank':
        return '1-3 business days';
      default:
        return '2-5 seconds';
    }
  }

  private getDefaultSettlementTime(type: string): string {
    switch (type?.toLowerCase()) {
      case 'cash':
        return 'Instant';
      case 'mobile_money':
        return '1-3 business days';
      case 'credit_card':
        return '2-5 business days';
      case 'bank':
        return '1-3 business days';
      default:
        return '1-3 business days';
    }
  }

  private getDefaultSuccessRate(type: string): number {
    switch (type?.toLowerCase()) {
      case 'cash':
        return 100.0;
      case 'mobile_money':
        return 98.5;
      case 'credit_card':
        return 97.0;
      case 'bank':
        return 99.2;
      default:
        return 95.0;
    }
  }

  private getDefaultResponseTime(type: string): number {
    switch (type?.toLowerCase()) {
      case 'cash':
        return 0;
      case 'mobile_money':
        return 2.5;
      case 'credit_card':
        return 4.0;
      case 'bank':
        return 5.0;
      default:
        return 2.5;
    }
  }

  // Get active payment providers
  async getActivePaymentProviders(): Promise<PaymentProvider[]> {
    try {
      const providers = await this.getPaymentProviders();
      return providers.filter(provider => provider.status === 'active');
    } catch (error) {
      console.error('Error fetching active payment providers:', error);
      return [];
    }
  }

  // Get payment providers with real performance data
  async getPaymentProvidersWithRealMetrics(): Promise<PaymentProvider[]> {
    try {
      const providers = await this.getPaymentProviders();
      
      // Calculate real metrics for each provider
      const providersWithMetrics = await Promise.all(
        providers.map(async (provider) => {
          const realMetrics = await this.calculateRealPerformanceMetrics(provider.id);
          return {
            ...provider,
            performance: {
              ...provider.performance,
              ...realMetrics
            }
          };
        })
      );

      return providersWithMetrics;
    } catch (error) {
      console.error('Error fetching providers with real metrics:', error);
      return [];
    }
  }

  // Get payment provider by ID
  async getPaymentProvider(id: string): Promise<PaymentProvider | null> {
    try {
      // Skip payment_providers table for now - use finance_accounts directly
      // This avoids 406 errors while the payment_providers table is being set up

      // Fallback to finance_accounts table
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('id', id)
        .eq('is_payment_method', true)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        type: this.mapAccountTypeToProviderType(data.type),
        status: data.is_active ? 'active' : 'inactive',
        configuration: {
          apiKey: '', // Not stored in finance_accounts
          secretKey: '', // Not stored in finance_accounts
          webhookUrl: '', // Not stored in finance_accounts
          merchantId: '', // Not stored in finance_accounts
          terminalId: '', // Not stored in finance_accounts
          currency: data.currency || 'TZS',
          fees: {
            percentage: this.getDefaultFeePercentage(data.type),
            fixed: this.getDefaultFixedFee(data.type),
            minimum: this.getDefaultMinAmount(data.type),
            maximum: this.getDefaultMaxAmount(data.type)
          },
          limits: {
            daily: this.getDefaultDailyLimit(data.type),
            monthly: this.getDefaultMonthlyLimit(data.type),
            perTransaction: this.getDefaultMaxAmount(data.type)
          },
          supportedMethods: [data.name],
          processingTime: this.getDefaultProcessingTime(data.type),
          settlementTime: this.getDefaultSettlementTime(data.type)
        },
        metadata: {
          description: data.payment_description || data.notes || '',
          website: '', // Not stored in finance_accounts
          supportEmail: '', // Not stored in finance_accounts
          supportPhone: '', // Not stored in finance_accounts
          documentation: '' // Not stored in finance_accounts
        },
        performance: {
          successRate: this.getDefaultSuccessRate(data.type),
          averageResponseTime: this.getDefaultResponseTime(data.type),
          totalTransactions: 0, // Would need to calculate from transaction data
          totalVolume: 0, // Would need to calculate from transaction data
          lastUsed: data.updated_at || new Date().toISOString()
        },
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
        createdBy: 'system', // Not stored in finance_accounts
        updatedBy: undefined // Not stored in finance_accounts
      };
    } catch (error) {
      console.error('Error fetching payment provider:', error);
      return null;
    }
  }

  // Create new payment provider
  async createPaymentProvider(
    provider: Omit<PaymentProvider, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'performance'>,
    userId: string
  ): Promise<PaymentProvider | null> {
    try {
      const { data, error } = await supabase
        .from('payment_providers')
        .insert({
          name: provider.name,
          type: provider.type,
          status: provider.status,
          configuration: provider.configuration,
          metadata: provider.metadata,
          performance: {
            successRate: 0,
            averageResponseTime: 0,
            totalTransactions: 0,
            totalVolume: 0
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.clearCache();

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status,
        configuration: data.configuration,
        metadata: data.metadata,
        performance: data.performance,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        updatedBy: data.updated_by
      };
    } catch (error) {
      console.error('Error creating payment provider:', error);
      return null;
    }
  }

  // Update payment provider
  async updatePaymentProvider(
    id: string,
    updates: Partial<PaymentProvider>,
    userId: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        updated_by: userId
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.type) updateData.type = updates.type;
      if (updates.status) updateData.status = updates.status;
      if (updates.configuration) updateData.configuration = updates.configuration;
      if (updates.metadata) updateData.metadata = updates.metadata;

      const { error } = await supabase
        .from('payment_providers')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error updating payment provider:', error);
      return false;
    }
  }

  // Update provider performance metrics
  async updateProviderPerformance(
    providerId: string,
    metrics: {
      successRate?: number;
      averageResponseTime?: number;
      totalTransactions?: number;
      totalVolume?: number;
      lastUsed?: string;
    }
  ): Promise<boolean> {
    try {
      const { data: currentProvider, error: fetchError } = await supabase
        .from('payment_providers')
        .select('performance')
        .eq('id', providerId)
        .single();

      if (fetchError) throw fetchError;

      const updatedPerformance = {
        ...currentProvider.performance,
        ...metrics
      };

      const { error } = await supabase
        .from('payment_providers')
        .update({
          performance: updatedPerformance,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) throw error;

      // Clear cache
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error updating provider performance:', error);
      return false;
    }
  }

  // Get provider metrics
  async getProviderMetrics(): Promise<ProviderMetrics> {
    try {
      const cacheKey = 'provider_metrics';
      
      // Check cache first
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const providers = await this.getPaymentProviders();
      
      const totalProviders = providers.length;
      const activeProviders = providers.filter(p => p.status === 'active').length;
      const totalVolume = providers.reduce((sum, p) => sum + p.performance.totalVolume, 0);
      const averageSuccessRate = providers.length > 0 
        ? providers.reduce((sum, p) => sum + p.performance.successRate, 0) / providers.length 
        : 0;
      
      const topPerformer = providers.length > 0 
        ? providers.reduce((top, current) => 
            current.performance.successRate > top.performance.successRate ? current : top
          ).name 
        : '';

      // Calculate recent failures (last 24 hours)
      const recentFailures = providers.reduce((sum, p) => {
        // This would need to be calculated from actual transaction data
        // For now, we'll use a placeholder
        return sum + Math.floor(p.performance.totalTransactions * (1 - p.performance.successRate / 100) * 0.1);
      }, 0);

      const metrics: ProviderMetrics = {
        totalProviders,
        activeProviders,
        totalVolume,
        averageSuccessRate,
        topPerformer,
        recentFailures
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching provider metrics:', error);
      return {
        totalProviders: 0,
        activeProviders: 0,
        totalVolume: 0,
        averageSuccessRate: 0,
        topPerformer: '',
        recentFailures: 0
      };
    }
  }

  // Test provider connection
  async testProviderConnection(providerId: string): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    try {
      const provider = await this.getPaymentProvider(providerId);
      if (!provider) {
        return { success: false, responseTime: 0, error: 'Provider not found' };
      }

      const startTime = Date.now();
      
      // Simulate API test call
      // In a real implementation, this would make an actual API call to the provider
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      const responseTime = Date.now() - startTime;
      const success = Math.random() > 0.1; // 90% success rate for testing

      // Update performance metrics
      if (success) {
        await this.updateProviderPerformance(providerId, {
          lastUsed: new Date().toISOString(),
          averageResponseTime: responseTime
        });
      }

      return {
        success,
        responseTime,
        error: success ? undefined : 'Connection test failed'
      };
    } catch (error) {
      console.error('Error testing provider connection:', error);
      return {
        success: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Delete payment provider
  async deletePaymentProvider(id: string): Promise<boolean> {
    try {
      // Skip payment_providers table for now - use finance_accounts directly
      // This avoids 406 errors while the payment_providers table is being set up

      // Fallback to finance_accounts table - mark as inactive instead of deleting
      const { error } = await supabase
        .from('finance_accounts')
        .update({ 
          is_active: false,
          is_payment_method: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('is_payment_method', true);

      if (error) throw error;

      // Clear cache
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error deleting payment provider:', error);
      return false;
    }
  }

  // Calculate real performance metrics from transaction data
  async calculateRealPerformanceMetrics(providerId: string): Promise<{
    successRate: number;
    averageResponseTime: number;
    totalTransactions: number;
    totalVolume: number;
  }> {
    try {
      // First, get the provider details to map the ID to payment method names
      const provider = await this.getPaymentProvider(providerId);
      if (!provider) {
        return {
          successRate: 0,
          averageResponseTime: 0,
          totalTransactions: 0,
          totalVolume: 0
        };
      }

      // Map provider name to payment method names used in transaction tables
      const paymentMethodNames = this.mapProviderToPaymentMethodNames(provider.name, provider.type);

      // Get transactions for this provider from customer_payments and lats_sales
      const [customerPaymentsResult, posSalesResult] = await Promise.all([
        // Query customer_payments using the 'method' field
        supabase
          .from('customer_payments')
          .select('amount, status, created_at')
          .in('method', paymentMethodNames),
        // Query lats_sales using the 'payment_method' field
        supabase
          .from('lats_sales')
          .select('total_amount, payment_method, created_at')
          .in('payment_method', paymentMethodNames)
      ]);

      const customerPayments = customerPaymentsResult.data || [];
      const posSales = posSalesResult.data || [];

      // Combine all transactions
      const allTransactions = [
        ...customerPayments.map(p => ({
          amount: p.amount,
          status: p.status,
          created_at: p.created_at
        })),
        ...posSales.map(s => ({
          amount: s.total_amount,
          status: 'completed', // Assume POS sales are completed
          created_at: s.created_at
        }))
      ];

      if (allTransactions.length === 0) {
        return {
          successRate: 0,
          averageResponseTime: 0,
          totalTransactions: 0,
          totalVolume: 0
        };
      }

      // Calculate metrics
      const totalTransactions = allTransactions.length;
      const successfulTransactions = allTransactions.filter(t => t.status === 'completed' || t.status === 'success').length;
      const successRate = (successfulTransactions / totalTransactions) * 100;
      const totalVolume = allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      
      // For response time, we'll use a default based on payment type since we don't store actual response times
      const averageResponseTime = this.getDefaultResponseTime(provider.type);

      return {
        successRate: Math.round(successRate * 100) / 100,
        averageResponseTime,
        totalTransactions,
        totalVolume
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return {
        successRate: 0,
        averageResponseTime: 0,
        totalTransactions: 0,
        totalVolume: 0
      };
    }
  }

  // Map provider name and type to payment method names used in transaction tables
  private mapProviderToPaymentMethodNames(providerName: string, providerType: string): string[] {
    const name = providerName.toLowerCase();
    const type = providerType.toLowerCase();

    // Map based on provider name and type
    switch (type) {
      case 'cash':
        return ['cash'];
      case 'mobile_money':
        if (name.includes('mpesa')) {
          return ['M-Pesa', 'mpesa', 'mobile_money'];
        } else if (name.includes('airtel')) {
          return ['Airtel Money', 'airtel', 'mobile_money'];
        } else if (name.includes('zenopay')) {
          return ['ZenoPay', 'zenopay', 'mobile_money'];
        } else {
          return ['mobile_money', 'Mobile Money'];
        }
      case 'card_processor':
        return ['card', 'Card', 'credit_card', 'debit_card'];
      case 'bank_transfer':
        return ['bank', 'Bank Transfer', 'bank_transfer', 'transfer'];
      default:
        return [providerName, name];
    }
  }

  // Clear cache (public method)
  public clearProviderCache() {
    this.clearCache();
  }
}

export const paymentProviderService = new PaymentProviderService();
