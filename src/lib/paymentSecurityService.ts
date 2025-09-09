import { supabase } from './supabaseClient';

export interface SecurityAlert {
  id: string;
  type: 'suspicious_activity' | 'failed_authentication' | 'unusual_amount' | 'multiple_failures' | 'data_breach' | 'compliance_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  details: {
    transactionId?: string;
    customerId?: string;
    amount?: number;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    timestamp: string;
    metadata?: Record<string, any>;
  };
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

export interface ComplianceCheck {
  id: string;
  checkType: 'pci_dss' | 'gdpr' | 'aml' | 'kyc' | 'data_retention' | 'audit_trail';
  status: 'pass' | 'fail' | 'warning' | 'pending';
  title: string;
  description: string;
  details: {
    checkedAt: string;
    checkedBy: string;
    findings: string[];
    recommendations: string[];
    nextCheck: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SecurityMetrics {
  totalAlerts: number;
  openAlerts: number;
  criticalAlerts: number;
  resolvedToday: number;
  averageResolutionTime: number;
  complianceScore: number;
  lastSecurityScan: string;
}

class PaymentSecurityService {
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

  // Monitor payment transactions for security issues
  async monitorPaymentTransactions(): Promise<SecurityAlert[]> {
    try {
      console.log('🔍 Monitoring payment transactions for security issues...');
      
      // Check cache first to avoid excessive database queries
      const cacheKey = 'payment_security_monitoring';
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log('📋 Using cached security monitoring data');
        return cachedData;
      }
      
      // Fetch recent payments for analysis with optimized query
      const { data: payments, error } = await supabase
        .from('customer_payments')
        .select('id, amount, status, customer_id, created_at, method')
        .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // Reduced to 6 hours
        .order('created_at', { ascending: false })
        .limit(50); // Reduced limit to prevent performance issues

      if (error) {
        console.warn('⚠️ Error fetching payments for security monitoring:', error);
        return [];
      }

      const alerts: SecurityAlert[] = [];

      // Check for unusual amounts
      const averageAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) / (payments?.length || 1);
      const unusualPayments = payments?.filter(p => 
        p.amount > averageAmount * 5 || p.amount < 100
      ) || [];

      unusualPayments.forEach(payment => {
        alerts.push({
          id: `alert_${payment.id}_unusual_amount`,
          type: 'unusual_amount',
          severity: payment.amount > averageAmount * 10 ? 'high' : 'medium',
          title: 'Unusual Payment Amount Detected',
          description: `Payment of ${payment.amount} is significantly different from average`,
          details: {
            transactionId: payment.id,
            amount: payment.amount,
            timestamp: payment.created_at,
            metadata: { averageAmount, deviation: payment.amount / averageAmount }
          },
          status: 'open',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      // Check for multiple failed payments from same customer
      const failedPayments = payments?.filter(p => p.status === 'failed') || [];
      const customerFailures = new Map<string, number>();
      
      failedPayments.forEach(payment => {
        const count = customerFailures.get(payment.customer_id) || 0;
        customerFailures.set(payment.customer_id, count + 1);
      });

      customerFailures.forEach((count, customerId) => {
        if (count >= 3) {
          alerts.push({
            id: `alert_${customerId}_multiple_failures`,
            type: 'multiple_failures',
            severity: count >= 5 ? 'high' : 'medium',
            title: 'Multiple Payment Failures Detected',
            description: `Customer has ${count} failed payment attempts in the last 24 hours`,
            details: {
              customerId,
              timestamp: new Date().toISOString(),
              metadata: { failureCount: count }
            },
            status: 'open',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });

      // Save alerts to database (only if table exists)
      if (alerts.length > 0) {
        try {
          await this.saveSecurityAlerts(alerts);
        } catch (saveError) {
          console.warn('Could not save security alerts to database:', saveError);
          // Continue execution even if saving fails
        }
      }

      // Cache the results for 5 minutes to prevent excessive queries
      this.setCachedData(cacheKey, alerts);
      return alerts;
    } catch (error) {
      console.error('Error monitoring payment transactions:', error);
      return [];
    }
  }

  // Save security alerts to database
  private async saveSecurityAlerts(alerts: SecurityAlert[]): Promise<void> {
    try {
      // Check if security_alerts table exists first
      const { data: tableExists, error: checkError } = await supabase
        .from('security_alerts')
        .select('id')
        .limit(1);

      if (checkError && checkError.code === 'PGRST116') {
        console.warn('⚠️ Security alerts table does not exist, skipping save');
        return;
      }

      // Additional error handling for connection issues
      if (checkError && (checkError.message.includes('Failed to fetch') || checkError.message.includes('ERR_CONNECTION_CLOSED'))) {
        console.warn('⚠️ Connection issue when checking security alerts table, skipping save');
        return;
      }

      const alertData = alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        details: alert.details,
        status: alert.status,
        assigned_to: alert.assignedTo,
        created_at: alert.createdAt,
        updated_at: alert.updatedAt,
        resolved_at: alert.resolvedAt,
        resolved_by: alert.resolvedBy,
        resolution: alert.resolution
      }));

      const { error } = await supabase
        .from('security_alerts')
        .upsert(alertData);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving security alerts:', error);
    }
  }

  // Get security alerts
  async getSecurityAlerts(
    status?: string,
    severity?: string,
    limit: number = 50
  ): Promise<SecurityAlert[]> {
    try {
      const cacheKey = `security_alerts_${status || 'all'}_${severity || 'all'}_${limit}`;
      
      // Check cache first
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      let query = supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (severity && severity !== 'all') {
        query = query.eq('severity', severity);
      }

      const { data, error } = await query;

      if (error) throw error;

      const alerts = data?.map((alert: any) => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        details: alert.details,
        status: alert.status,
        assignedTo: alert.assigned_to,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at,
        resolvedAt: alert.resolved_at,
        resolvedBy: alert.resolved_by,
        resolution: alert.resolution
      })) || [];

      this.setCachedData(cacheKey, alerts);
      return alerts;
    } catch (error) {
      console.error('Error fetching security alerts:', error);
      return [];
    }
  }

  // Update security alert
  async updateSecurityAlert(
    alertId: string,
    updates: Partial<SecurityAlert>,
    userId: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.status) updateData.status = updates.status;
      if (updates.assignedTo) updateData.assigned_to = updates.assignedTo;
      if (updates.resolution) updateData.resolution = updates.resolution;
      
      if (updates.status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = userId;
      }

      const { error } = await supabase
        .from('security_alerts')
        .update(updateData)
        .eq('id', alertId);

      if (error) throw error;

      // Clear cache
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error updating security alert:', error);
      return false;
    }
  }

  // Perform compliance checks
  async performComplianceChecks(): Promise<ComplianceCheck[]> {
    try {
      console.log('🔍 Performing compliance checks...');
      
      const checks: ComplianceCheck[] = [];

      // PCI DSS Compliance Check
      const pciCheck = await this.checkPCIDSSCompliance();
      checks.push(pciCheck);

      // GDPR Compliance Check
      const gdprCheck = await this.checkGDPRCompliance();
      checks.push(gdprCheck);

      // AML Compliance Check
      const amlCheck = await this.checkAMLCompliance();
      checks.push(amlCheck);

      // Data Retention Check
      const retentionCheck = await this.checkDataRetention();
      checks.push(retentionCheck);

      // Save compliance checks to database
      await this.saveComplianceChecks(checks);

      return checks;
    } catch (error) {
      console.error('Error performing compliance checks:', error);
      return [];
    }
  }

  // PCI DSS Compliance Check
  private async checkPCIDSSCompliance(): Promise<ComplianceCheck> {
    try {
      // Check if sensitive data is properly encrypted
      const { data: payments, error } = await supabase
        .from('customer_payments')
        .select('id, method, created_at')
        .limit(10); // Reduced limit for performance

      if (error) throw error;

      const findings: string[] = [];
      const recommendations: string[] = [];

      // Check for unencrypted sensitive data (simplified check)
      const hasUnencryptedData = payments?.some(p => 
        p.method && typeof p.method === 'string' && p.method.includes('card')
      );

      if (hasUnencryptedData) {
        findings.push('Potential unencrypted card data detected');
        recommendations.push('Implement end-to-end encryption for card data');
      }

      const status = findings.length === 0 ? 'pass' : findings.length <= 2 ? 'warning' : 'fail';

      return {
        id: `pci_check_${Date.now()}`,
        checkType: 'pci_dss',
        status,
        title: 'PCI DSS Compliance Check',
        description: 'Payment Card Industry Data Security Standard compliance verification',
        details: {
          checkedAt: new Date().toISOString(),
          checkedBy: 'system',
          findings,
          recommendations,
          nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking PCI DSS compliance:', error);
      return {
        id: `pci_check_${Date.now()}`,
        checkType: 'pci_dss',
        status: 'fail',
        title: 'PCI DSS Compliance Check',
        description: 'Payment Card Industry Data Security Standard compliance verification',
        details: {
          checkedAt: new Date().toISOString(),
          checkedBy: 'system',
          findings: ['Unable to perform compliance check'],
          recommendations: ['Review system configuration'],
          nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  // GDPR Compliance Check
  private async checkGDPRCompliance(): Promise<ComplianceCheck> {
    try {
      const findings: string[] = [];
      const recommendations: string[] = [];

      // Check for data retention policies
      const { data: oldPayments, error } = await supabase
        .from('customer_payments')
        .select('id, created_at')
        .lt('created_at', new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000).toISOString()) // 7 years old
        .limit(5); // Reduced limit for performance

      if (error) throw error;

      if (oldPayments && oldPayments.length > 0) {
        findings.push('Data older than 7 years found - review retention policy');
        recommendations.push('Implement automated data purging for old records');
      }

      const status = findings.length === 0 ? 'pass' : 'warning';

      return {
        id: `gdpr_check_${Date.now()}`,
        checkType: 'gdpr',
        status,
        title: 'GDPR Compliance Check',
        description: 'General Data Protection Regulation compliance verification',
        details: {
          checkedAt: new Date().toISOString(),
          checkedBy: 'system',
          findings,
          recommendations,
          nextCheck: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking GDPR compliance:', error);
      return {
        id: `gdpr_check_${Date.now()}`,
        checkType: 'gdpr',
        status: 'fail',
        title: 'GDPR Compliance Check',
        description: 'General Data Protection Regulation compliance verification',
        details: {
          checkedAt: new Date().toISOString(),
          checkedBy: 'system',
          findings: ['Unable to perform compliance check'],
          recommendations: ['Review system configuration'],
          nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  // AML Compliance Check
  private async checkAMLCompliance(): Promise<ComplianceCheck> {
    try {
      const findings: string[] = [];
      const recommendations: string[] = [];

      // Check for large transactions that might need AML reporting
      const { data: largePayments, error } = await supabase
        .from('customer_payments')
        .select('id, amount, created_at')
        .gte('amount', 10000000) // 10M TZS threshold
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .limit(5); // Reduced limit for performance

      if (error) throw error;

      if (largePayments && largePayments.length > 0) {
        findings.push(`${largePayments.length} large transactions found that may require AML reporting`);
        recommendations.push('Review large transactions for AML compliance requirements');
      }

      const status = findings.length === 0 ? 'pass' : 'warning';

      return {
        id: `aml_check_${Date.now()}`,
        checkType: 'aml',
        status,
        title: 'AML Compliance Check',
        description: 'Anti-Money Laundering compliance verification',
        details: {
          checkedAt: new Date().toISOString(),
          checkedBy: 'system',
          findings,
          recommendations,
          nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking AML compliance:', error);
      return {
        id: `aml_check_${Date.now()}`,
        checkType: 'aml',
        status: 'fail',
        title: 'AML Compliance Check',
        description: 'Anti-Money Laundering compliance verification',
        details: {
          checkedAt: new Date().toISOString(),
          checkedBy: 'system',
          findings: ['Unable to perform compliance check'],
          recommendations: ['Review system configuration'],
          nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Data Retention Check
  private async checkDataRetention(): Promise<ComplianceCheck> {
    try {
      const findings: string[] = [];
      const recommendations: string[] = [];

      // Check for data that should be purged according to retention policy
      const retentionDate = new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000); // 7 years
      
      const { data: oldData, error } = await supabase
        .from('customer_payments')
        .select('id, created_at')
        .lt('created_at', retentionDate.toISOString())
        .limit(10); // Reduced limit for performance

      if (error) throw error;

      if (oldData && oldData.length > 0) {
        findings.push(`${oldData.length} records found that exceed 7-year retention policy`);
        recommendations.push('Implement automated data purging for records older than 7 years');
      }

      const status = findings.length === 0 ? 'pass' : 'warning';

      return {
        id: `retention_check_${Date.now()}`,
        checkType: 'data_retention',
        status,
        title: 'Data Retention Compliance Check',
        description: 'Data retention policy compliance verification',
        details: {
          checkedAt: new Date().toISOString(),
          checkedBy: 'system',
          findings,
          recommendations,
          nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking data retention:', error);
      return {
        id: `retention_check_${Date.now()}`,
        checkType: 'data_retention',
        status: 'fail',
        title: 'Data Retention Compliance Check',
        description: 'Data retention policy compliance verification',
        details: {
          checkedAt: new Date().toISOString(),
          checkedBy: 'system',
          findings: ['Unable to perform compliance check'],
          recommendations: ['Review system configuration'],
          nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Save compliance checks to database
  private async saveComplianceChecks(checks: ComplianceCheck[]): Promise<void> {
    try {
      const checkData = checks.map(check => ({
        id: check.id,
        check_type: check.checkType,
        status: check.status,
        title: check.title,
        description: check.description,
        details: check.details,
        created_at: check.createdAt,
        updated_at: check.updatedAt
      }));

      const { error } = await supabase
        .from('compliance_checks')
        .upsert(checkData);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving compliance checks:', error);
    }
  }

  // Get security metrics
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const cacheKey = 'security_metrics';
      
      // Check cache first
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const alerts = await this.getSecurityAlerts();
      const complianceChecks = await this.getComplianceChecks();

      const totalAlerts = alerts.length;
      const openAlerts = alerts.filter(a => a.status === 'open').length;
      const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
      const resolvedToday = alerts.filter(a => 
        a.resolvedAt && new Date(a.resolvedAt).toDateString() === new Date().toDateString()
      ).length;

      const averageResolutionTime = alerts
        .filter(a => a.resolvedAt && a.createdAt)
        .reduce((sum, a) => {
          const resolutionTime = new Date(a.resolvedAt!).getTime() - new Date(a.createdAt).getTime();
          return sum + resolutionTime;
        }, 0) / (alerts.filter(a => a.resolvedAt).length || 1);

      const complianceScore = complianceChecks.length > 0
        ? (complianceChecks.filter(c => c.status === 'pass').length / complianceChecks.length) * 100
        : 100;

      const lastSecurityScan = complianceChecks.length > 0
        ? complianceChecks[0].details.checkedAt
        : '';

      const metrics: SecurityMetrics = {
        totalAlerts,
        openAlerts,
        criticalAlerts,
        resolvedToday,
        averageResolutionTime,
        complianceScore,
        lastSecurityScan
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching security metrics:', error);
      return {
        totalAlerts: 0,
        openAlerts: 0,
        criticalAlerts: 0,
        resolvedToday: 0,
        averageResolutionTime: 0,
        complianceScore: 0,
        lastSecurityScan: ''
      };
    }
  }

  // Get compliance checks
  async getComplianceChecks(): Promise<ComplianceCheck[]> {
    try {
      const { data, error } = await supabase
        .from('compliance_checks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map((check: any) => ({
        id: check.id,
        checkType: check.check_type,
        status: check.status,
        title: check.title,
        description: check.description,
        details: check.details,
        createdAt: check.created_at,
        updatedAt: check.updated_at
      })) || [];
    } catch (error) {
      console.error('Error fetching compliance checks:', error);
      return [];
    }
  }

  // Clear cache (public method)
  public clearSecurityCache() {
    this.clearCache();
  }
}

export const paymentSecurityService = new PaymentSecurityService();
