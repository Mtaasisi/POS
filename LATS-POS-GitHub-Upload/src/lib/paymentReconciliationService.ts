import { supabase } from './supabaseClient';
import { paymentTrackingService } from './paymentTrackingService';

export interface ReconciliationRecord {
  id: string;
  date: string;
  status: 'reconciled' | 'pending' | 'discrepancy';
  expected: number;
  actual: number;
  variance: number;
  source: 'device_payment' | 'pos_sale' | 'combined';
  details: {
    devicePayments: number;
    posSales: number;
    fees: number;
    refunds: number;
  };
  discrepancies: Array<{
    type: 'missing_payment' | 'extra_payment' | 'amount_mismatch' | 'status_mismatch';
    description: string;
    amount?: number;
    transactionId?: string;
  }>;
  reconciledBy?: string;
  reconciledAt?: string;
  notes?: string;
}

export interface ReconciliationSummary {
  totalRecords: number;
  reconciledRecords: number;
  pendingRecords: number;
  discrepancyRecords: number;
  totalVariance: number;
  lastReconciliation: string;
}

class PaymentReconciliationService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60000; // 1 minute cache for reconciliation data

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

  // Perform daily reconciliation
  async performDailyReconciliation(date: string): Promise<ReconciliationRecord> {
    try {
      console.log(`🔄 Performing daily reconciliation for ${date}...`);
      
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      // Fetch all payments for the day
      const payments = await paymentTrackingService.fetchPaymentTransactions(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Calculate expected vs actual
      const devicePayments = payments.filter(p => p.source === 'device_payment');
      const posSales = payments.filter(p => p.source === 'pos_sale');
      
      const expected = payments.reduce((sum, p) => sum + p.amount, 0);
      const actual = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
      const fees = payments.reduce((sum, p) => sum + p.fees, 0);
      const refunds = payments.filter(p => p.paymentType === 'refund').reduce((sum, p) => sum + p.amount, 0);

      const variance = expected - actual;
      const discrepancies = this.identifyDiscrepancies(payments);

      const reconciliationRecord: ReconciliationRecord = {
        id: `recon_${date.replace(/-/g, '')}`,
        date,
        status: discrepancies.length > 0 ? 'discrepancy' : 'reconciled',
        expected,
        actual,
        variance,
        source: 'combined',
        details: {
          devicePayments: devicePayments.length,
          posSales: posSales.length,
          fees,
          refunds
        },
        discrepancies
      };

      // Save reconciliation record to database
      await this.saveReconciliationRecord(reconciliationRecord);

      console.log(`✅ Daily reconciliation completed for ${date}: ${reconciliationRecord.status}`);
      return reconciliationRecord;
    } catch (error) {
      console.error('Error performing daily reconciliation:', error);
      throw error;
    }
  }

  // Identify discrepancies in payments
  private identifyDiscrepancies(payments: any[]): Array<{
    type: 'missing_payment' | 'extra_payment' | 'amount_mismatch' | 'status_mismatch';
    description: string;
    amount?: number;
    transactionId?: string;
  }> {
    const discrepancies = [];

    // Check for pending payments that should be completed
    const pendingPayments = payments.filter(p => p.status === 'pending');
    pendingPayments.forEach(payment => {
      discrepancies.push({
        type: 'status_mismatch',
        description: `Payment ${payment.transactionId} is still pending after 24 hours`,
        transactionId: payment.transactionId,
        amount: payment.amount
      });
    });

    // Check for failed payments that might need attention
    const failedPayments = payments.filter(p => p.status === 'failed');
    failedPayments.forEach(payment => {
      discrepancies.push({
        type: 'status_mismatch',
        description: `Payment ${payment.transactionId} failed and may need retry`,
        transactionId: payment.transactionId,
        amount: payment.amount
      });
    });

    // Check for unusual amounts (could be data entry errors)
    const averageAmount = payments.reduce((sum, p) => sum + p.amount, 0) / payments.length;
    const unusualPayments = payments.filter(p => p.amount > averageAmount * 5 || p.amount < 100);
    unusualPayments.forEach(payment => {
      discrepancies.push({
        type: 'amount_mismatch',
        description: `Payment ${payment.transactionId} has unusual amount: ${payment.amount}`,
        transactionId: payment.transactionId,
        amount: payment.amount
      });
    });

    return discrepancies;
  }

  // Save reconciliation record to database
  private async saveReconciliationRecord(record: ReconciliationRecord): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_reconciliation')
        .upsert({
          id: record.id,
          date: record.date,
          status: record.status,
          expected: record.expected,
          actual: record.actual,
          variance: record.variance,
          source: record.source,
          details: record.details,
          discrepancies: record.discrepancies,
          reconciled_by: record.reconciledBy,
          reconciled_at: record.reconciledAt,
          notes: record.notes,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving reconciliation record:', error);
      throw error;
    }
  }

  // Get reconciliation records
  async getReconciliationRecords(
    startDate?: string,
    endDate?: string,
    status?: string
  ): Promise<ReconciliationRecord[]> {
    try {
      const cacheKey = `reconciliation_${startDate || 'all'}_${endDate || 'all'}_${status || 'all'}`;
      
      // Check cache first
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      let query = supabase
        .from('payment_reconciliation')
        .select('*')
        .order('date', { ascending: false });

      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      const records = data?.map((record: any) => ({
        id: record.id,
        date: record.date,
        status: record.status,
        expected: record.expected_amount,
        actual: record.actual_amount,
        variance: record.variance,
        source: record.source,
        details: record.details,
        discrepancies: record.discrepancies,
        reconciledBy: record.reconciled_by,
        reconciledAt: record.reconciled_at,
        notes: record.notes
      })) || [];

      this.setCachedData(cacheKey, records);
      return records;
    } catch (error) {
      console.error('Error fetching reconciliation records:', error);
      return [];
    }
  }

  // Get reconciliation summary
  async getReconciliationSummary(): Promise<ReconciliationSummary> {
    try {
      const cacheKey = 'reconciliation_summary';
      
      // Check cache first
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const { data, error } = await supabase
        .from('payment_reconciliation')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const records = data || [];
      const totalRecords = records.length;
      const reconciledRecords = records.filter(r => r.status === 'reconciled').length;
      const pendingRecords = records.filter(r => r.status === 'pending').length;
      const discrepancyRecords = records.filter(r => r.status === 'discrepancy').length;
      const totalVariance = records.reduce((sum, r) => sum + (r.variance || 0), 0);
      const lastReconciliation = records[0]?.date || '';

      const summary: ReconciliationSummary = {
        totalRecords,
        reconciledRecords,
        pendingRecords,
        discrepancyRecords,
        totalVariance,
        lastReconciliation
      };

      this.setCachedData(cacheKey, summary);
      return summary;
    } catch (error) {
      console.error('Error fetching reconciliation summary:', error);
      return {
        totalRecords: 0,
        reconciledRecords: 0,
        pendingRecords: 0,
        discrepancyRecords: 0,
        totalVariance: 0,
        lastReconciliation: ''
      };
    }
  }

  // Mark reconciliation as resolved
  async markReconciliationResolved(
    reconciliationId: string,
    resolvedBy: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_reconciliation')
        .update({
          status: 'reconciled',
          reconciled_by: resolvedBy,
          reconciled_at: new Date().toISOString(),
          notes: notes
        })
        .eq('id', reconciliationId);

      if (error) throw error;

      // Clear cache
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error marking reconciliation as resolved:', error);
      return false;
    }
  }

  // Clear cache (public method)
  public clearReconciliationCache() {
    this.clearCache();
  }
}

export const paymentReconciliationService = new PaymentReconciliationService();
