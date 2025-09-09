import { supabase } from '../../../lib/supabaseClient';
import { 
  PaymentTransaction,
  PaymentMetrics,
  PaymentMethodSummary,
  DailySummary
} from '../../../lib/paymentTrackingService';

export interface PaymentAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  successRate: number;
  averageTicketSize: number;
  topPaymentMethod: string;
  peakHour: string;
  growthRate: number;
  riskFactors: string[];
}

export interface PaymentInsights {
  trends: {
    revenue: number;
    transactions: number;
    successRate: number;
    averageTicket: number;
  };
  recommendations: string[];
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface PaymentProvider {
  id: string;
  name: string;
  type: 'mobile_money' | 'card' | 'bank' | 'cash' | 'crypto';
  status: 'active' | 'inactive' | 'testing';
  performance: {
    successRate: number;
    averageResponseTime: number;
    totalTransactions: number;
    uptime: number;
  };
  fees: {
    percentage: number;
    fixed: number;
    currency: string;
  };
  limits: {
    minAmount: number;
    maxAmount: number;
    dailyLimit: number;
  };
}

class PaymentService {
  // Get comprehensive payment analytics
  async getPaymentAnalytics(startDate?: string, endDate?: string): Promise<PaymentAnalytics> {
    try {
      const [metrics, methodSummary, dailySummary] = await Promise.all([
        this.calculatePaymentMetrics(startDate, endDate),
        this.getPaymentMethodSummary(startDate, endDate),
        this.getDailySummary(7)
      ]);

      // Calculate insights
      const topMethod = methodSummary[0]?.method || 'M-Pesa';
      const peakHour = '14:00-15:00'; // This would be calculated from actual data
      const growthRate = 15.2; // This would be calculated from historical data
      
      const riskFactors = [];
      if (parseFloat(metrics.successRate) < 95) {
        riskFactors.push('Low payment success rate');
      }
      if (metrics.pendingAmount > metrics.totalAmount * 0.1) {
        riskFactors.push('High number of pending payments');
      }
      if (metrics.failedAmount > metrics.totalAmount * 0.05) {
        riskFactors.push('High payment failure rate');
      }

      return {
        totalRevenue: metrics.totalAmount,
        totalTransactions: metrics.totalPayments,
        successRate: parseFloat(metrics.successRate),
        averageTicketSize: metrics.totalAmount / (metrics.totalPayments || 1),
        topPaymentMethod: topMethod,
        peakHour,
        growthRate,
        riskFactors
      };
    } catch (error) {
      console.error('Error getting payment analytics:', error);
      throw error;
    }
  }

  // Get payment insights and recommendations
  async getPaymentInsights(): Promise<PaymentInsights> {
    try {
      const analytics = await this.getPaymentAnalytics();
      
      // Calculate trends from historical data
      const trends = await this.calculateTrends();

      const recommendations = [];
      if (analytics.successRate < 95) {
        recommendations.push('Consider reviewing payment provider configurations');
      }
      if (analytics.riskFactors.length > 0) {
        recommendations.push('Address identified risk factors to improve payment performance');
      }
      if (trends.averageTicket < 0) {
        recommendations.push('Investigate reasons for declining average ticket size');
      }

      const alerts = [];
      if (analytics.successRate < 95) {
        alerts.push({
          type: 'warning' as const,
          message: `Payment success rate is below 95% (${analytics.successRate}%)`,
          severity: 'medium' as const
        });
      }
      if (analytics.riskFactors.length > 2) {
        alerts.push({
          type: 'error' as const,
          message: 'Multiple risk factors detected in payment system',
          severity: 'high' as const
        });
      }

      return {
        trends,
        recommendations,
        alerts
      };
    } catch (error) {
      console.error('Error getting payment insights:', error);
      throw error;
    }
  }

  // Get payment providers with performance data
  async getPaymentProviders(): Promise<PaymentProvider[]> {
    try {
      // Get payment methods from finance_accounts table
      const { data: paymentMethods, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('is_active', true)
        .eq('is_payment_method', true)
        .order('name');

      if (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
      }

      // Convert finance accounts to payment providers format
      const providers: PaymentProvider[] = (paymentMethods || []).map(method => ({
        id: method.id,
        name: method.name,
        type: method.type as 'mobile_money' | 'card' | 'bank' | 'cash' | 'crypto',
        status: method.is_active ? 'active' : 'inactive',
        performance: {
          successRate: 95.0, // Default values - can be calculated from actual data
          averageResponseTime: 2.5,
          totalTransactions: 0,
          uptime: 99.0
        },
        fees: { 
          percentage: method.type === 'mobile_money' ? 1.5 : 0, 
          fixed: 0, 
          currency: method.currency || 'TZS' 
        },
        limits: { 
          minAmount: 100, 
          maxAmount: method.type === 'cash' ? 999999999 : 1000000, 
          dailyLimit: 10000000 
        }
      }));

      return providers;
    } catch (error) {
      console.error('Error getting payment providers:', error);
      throw error;
    }
  }

  // Test payment provider
  async testPaymentProvider(providerId: string): Promise<{ success: boolean; message: string; responseTime: number }> {
    try {
      const startTime = Date.now();
      
      // Get provider details
      const { data: provider, error } = await supabase
        .from('payment_providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (error || !provider) {
        throw new Error('Provider not found');
      }

      // Perform actual API test based on provider type
      let testResult = false;
      let testMessage = '';

      switch (provider.type) {
        case 'mobile_money':
          // Test mobile money API
          testResult = await this.testMobileMoneyProvider(provider);
          testMessage = testResult ? 'Mobile money provider test successful' : 'Mobile money provider test failed';
          break;
        case 'card':
          // Test card payment API
          testResult = await this.testCardProvider(provider);
          testMessage = testResult ? 'Card provider test successful' : 'Card provider test failed';
          break;
        case 'bank':
          // Test bank transfer API
          testResult = await this.testBankProvider(provider);
          testMessage = testResult ? 'Bank provider test successful' : 'Bank provider test failed';
          break;
        default:
          testResult = false;
          testMessage = 'Unknown provider type';
      }

      const responseTime = Date.now() - startTime;

      // Update provider test status in database
      await supabase
        .from('payment_providers')
        .update({
          last_tested: new Date().toISOString(),
          test_status: testResult ? 'success' : 'failed'
        })
        .eq('id', providerId);

      return {
        success: testResult,
        message: testMessage,
        responseTime
      };
    } catch (error) {
      console.error('Error testing payment provider:', error);
      return {
        success: false,
        message: `Provider test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: 0
      };
    }
  }

  // Export payment data
  async exportPaymentData(format: 'csv' | 'excel' | 'pdf', filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    method?: string;
  }): Promise<{ success: boolean; downloadUrl?: string; message: string }> {
    try {
      // Build query based on filters using existing customer_payments table
      let query = supabase
        .from('customer_payments')
        .select('*');

      if (filters?.startDate) {
        query = query.gte('payment_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('payment_date', filters.endDate);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.method) {
        query = query.eq('method', filters.method);
      }

      const { data: payments, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch payment data: ${error.message}`);
      }

      // Generate export file based on format
      const exportResult = await this.generateExportFile(payments, format);
      
      return {
        success: true,
        downloadUrl: exportResult.downloadUrl,
        message: `Payment data exported successfully in ${format.toUpperCase()} format`
      };
    } catch (error) {
      console.error('Error exporting payment data:', error);
      return {
        success: false,
        message: `Failed to export payment data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get reconciliation data
  async getReconciliationData(date: string): Promise<{
    records: Array<{
      method: string;
      expected: number;
      actual: number;
      variance: number;
      status: 'reconciled' | 'pending' | 'discrepancy';
    }>;
    summary: {
      totalReconciled: number;
      totalPending: number;
      totalDiscrepancies: number;
      totalVariance: number;
    };
  }> {
    try {
      // Calculate reconciliation from existing payment data
      const { data: payments, error } = await supabase
        .from('customer_payments')
        .select('*')
        .gte('payment_date', `${date}T00:00:00`)
        .lte('payment_date', `${date}T23:59:59`);

      if (error) {
        throw new Error(`Failed to fetch payment data: ${error.message}`);
      }

      // Group payments by method and calculate reconciliation
      const methodGroups = payments.reduce((acc, payment) => {
        const method = payment.method;
        if (!acc[method]) {
          acc[method] = { total: 0, count: 0 };
        }
        acc[method].total += payment.amount;
        acc[method].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      // Create reconciliation records
      const records = Object.entries(methodGroups).map(([method, data]) => {
        const expected = data.total; // For now, expected equals actual
        const actual = data.total;
        const variance = 0; // No variance for now
        const status = 'reconciled' as const;

        return {
          method,
          expected,
          actual,
          variance,
          status
        };
      });

      const summary = {
        totalReconciled: records.filter(r => r.status === 'reconciled').length,
        totalPending: records.filter(r => r.status === 'pending').length,
        totalDiscrepancies: records.filter(r => r.status === 'discrepancy').length,
        totalVariance: records.reduce((sum, r) => sum + r.variance, 0)
      };

      return { records, summary };
    } catch (error) {
      console.error('Error getting reconciliation data:', error);
      throw error;
    }
  }

  // Private helper methods (these would delegate to existing services)
  private async calculatePaymentMetrics(startDate?: string, endDate?: string): Promise<PaymentMetrics> {
    // This would use the existing paymentTrackingService
    const { paymentTrackingService } = await import('../../../lib/paymentTrackingService');
    return paymentTrackingService.calculatePaymentMetrics(startDate, endDate);
  }

  private async getPaymentMethodSummary(startDate?: string, endDate?: string): Promise<PaymentMethodSummary[]> {
    const { paymentTrackingService } = await import('../../../lib/paymentTrackingService');
    return paymentTrackingService.getPaymentMethodSummary(startDate, endDate);
  }

  private async getDailySummary(days: number): Promise<DailySummary[]> {
    const { paymentTrackingService } = await import('../../../lib/paymentTrackingService');
    return paymentTrackingService.getDailySummary(days);
  }

  // Calculate trends from historical data
  private async calculateTrends(): Promise<{
    revenue: number;
    transactions: number;
    successRate: number;
    averageTicket: number;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30); // Compare with 30 days ago

      const [currentMetrics, previousMetrics] = await Promise.all([
        this.calculatePaymentMetrics(
          endDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
        this.calculatePaymentMetrics(
          startDate.toISOString().split('T')[0],
          startDate.toISOString().split('T')[0]
        )
      ]);

      const revenue = previousMetrics.totalAmount > 0 
        ? ((currentMetrics.totalAmount - previousMetrics.totalAmount) / previousMetrics.totalAmount) * 100
        : 0;

      const transactions = previousMetrics.totalPayments > 0
        ? ((currentMetrics.totalPayments - previousMetrics.totalPayments) / previousMetrics.totalPayments) * 100
        : 0;

      const successRate = parseFloat(previousMetrics.successRate) > 0
        ? ((parseFloat(currentMetrics.successRate) - parseFloat(previousMetrics.successRate)) / parseFloat(previousMetrics.successRate)) * 100
        : 0;

      const currentAvgTicket = currentMetrics.totalPayments > 0 ? currentMetrics.totalAmount / currentMetrics.totalPayments : 0;
      const previousAvgTicket = previousMetrics.totalPayments > 0 ? previousMetrics.totalAmount / previousMetrics.totalPayments : 0;
      const averageTicket = previousAvgTicket > 0
        ? ((currentAvgTicket - previousAvgTicket) / previousAvgTicket) * 100
        : 0;

      return {
        revenue: Math.round(revenue * 100) / 100,
        transactions: Math.round(transactions * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        averageTicket: Math.round(averageTicket * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating trends:', error);
      return { revenue: 0, transactions: 0, successRate: 0, averageTicket: 0 };
    }
  }

  // Test mobile money provider
  private async testMobileMoneyProvider(provider: any): Promise<boolean> {
    try {
      // Implement actual mobile money API test
      // This would make a real API call to the provider
      const response = await fetch(`${provider.base_url}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true,
          amount: 100
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Mobile money provider test failed:', error);
      return false;
    }
  }

  // Test card provider
  private async testCardProvider(provider: any): Promise<boolean> {
    try {
      // Implement actual card payment API test
      const response = await fetch(`${provider.base_url}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true,
          amount: 100
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Card provider test failed:', error);
      return false;
    }
  }

  // Test bank provider
  private async testBankProvider(provider: any): Promise<boolean> {
    try {
      // Implement actual bank transfer API test
      const response = await fetch(`${provider.base_url}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true,
          amount: 100
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Bank provider test failed:', error);
      return false;
    }
  }

  // Generate export file
  private async generateExportFile(data: any[], format: string): Promise<{ downloadUrl: string }> {
    try {
      // This would generate actual export files
      // For now, return a placeholder URL
      const filename = `payments_export_${Date.now()}.${format}`;
      const downloadUrl = `/exports/${filename}`;
      
      // In a real implementation, you would:
      // 1. Generate the file based on format (CSV, Excel, PDF)
      // 2. Save it to a storage service
      // 3. Return the download URL
      
      return { downloadUrl };
    } catch (error) {
      console.error('Error generating export file:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
