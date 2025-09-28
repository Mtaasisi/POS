import React, { useState, useEffect, useCallback } from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Lock, Eye,
  RefreshCw, Download, Settings, Activity, TrendingUp, TrendingDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { paymentSecurityService } from '../../../lib/paymentSecurityService';

interface SecurityAlert {
  id: string;
  type: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'investigating';
  severity: number;
  source: string;
}

interface ComplianceCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  lastChecked: string;
  nextCheck: string;
  details: string;
}

const PaymentSecurity: React.FC = () => {
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  // Mock data for demonstration
  const mockSecurityAlerts: SecurityAlert[] = [
    {
      id: '1',
      type: 'high',
      title: 'Suspicious Payment Pattern Detected',
      description: 'Multiple failed payment attempts from same IP address within 5 minutes',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'active',
      severity: 9,
      source: 'Fraud Detection System'
    },
    {
      id: '2',
      type: 'medium',
      title: 'Unusual Transaction Amount',
      description: 'Transaction amount significantly higher than customer average',
      timestamp: '2024-01-15T09:15:00Z',
      status: 'investigating',
      severity: 6,
      source: 'Risk Assessment Engine'
    },
    {
      id: '3',
      type: 'low',
      title: 'Payment Method Change',
      description: 'Customer changed payment method for first time in 6 months',
      timestamp: '2024-01-15T08:45:00Z',
      status: 'resolved',
      severity: 3,
      source: 'Behavioral Analysis'
    }
  ];

  const mockComplianceChecks: ComplianceCheck[] = [
    {
      id: '1',
      name: 'PCI DSS Compliance',
      status: 'pass',
      lastChecked: '2024-01-15T00:00:00Z',
      nextCheck: '2024-01-16T00:00:00Z',
      details: 'All PCI DSS requirements met'
    },
    {
      id: '2',
      name: 'GDPR Data Protection',
      status: 'pass',
      lastChecked: '2024-01-15T00:00:00Z',
      nextCheck: '2024-01-16T00:00:00Z',
      details: 'Data protection measures in place'
    },
    {
      id: '3',
      name: 'Anti-Money Laundering',
      status: 'warning',
      lastChecked: '2024-01-15T00:00:00Z',
      nextCheck: '2024-01-16T00:00:00Z',
      details: 'Some transactions require additional verification'
    },
    {
      id: '4',
      name: 'Fraud Detection Rules',
      status: 'pass',
      lastChecked: '2024-01-15T00:00:00Z',
      nextCheck: '2024-01-16T00:00:00Z',
      details: 'All fraud detection rules active'
    }
  ];

  // Fetch security data from database
  const fetchSecurityData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching security alerts and compliance checks from database...');
      
      // Fetch security alerts and compliance checks from database
      const [alertsResult, complianceResult] = await Promise.allSettled([
        paymentSecurityService.getSecurityAlerts(),
        paymentSecurityService.getComplianceChecks()
      ]);

      // Handle security alerts
      if (alertsResult.status === 'fulfilled') {
        setSecurityAlerts(alertsResult.value);
        console.log('✅ Security alerts loaded:', alertsResult.value.length);
      } else {
        console.warn('Failed to fetch security alerts:', alertsResult.reason);
        // Keep existing alerts if fetch fails
      }

      // Handle compliance checks
      if (complianceResult.status === 'fulfilled') {
        setComplianceChecks(complianceResult.value);
        console.log('✅ Compliance checks loaded:', complianceResult.value.length);
      } else {
        console.warn('Failed to fetch compliance checks:', complianceResult.reason);
        // Keep existing compliance checks if fetch fails
      }

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const handleRunComplianceCheck = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Running compliance check...');
      
      // Run compliance check using the service
      const result = await paymentSecurityService.runComplianceCheck();
      if (result) {
        // Refresh the compliance checks
        await fetchSecurityData();
        toast.success('Compliance check completed');
      } else {
        toast.error('Failed to run compliance check');
      }
    } catch (error) {
      console.error('Error running compliance check:', error);
      toast.error('Failed to run compliance check');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = (alertId: string) => {
    setSecurityAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved' as const }
        : alert
    ));
    toast.success('Alert resolved');
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-red-600 bg-red-100';
      case 'investigating':
        return 'text-orange-600 bg-orange-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-orange-600 bg-orange-100';
      case 'fail':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'fail':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Security & Compliance</h3>
          <p className="text-gray-600 mt-1">
            Payment security monitoring and compliance checks
          </p>
        </div>

        <div className="flex gap-3">
          <GlassButton
            onClick={handleRunComplianceCheck}
            icon={<Shield size={18} />}
            loading={isLoading}
            disabled={isLoading}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white"
          >
            Run Compliance Check
          </GlassButton>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">
                {securityAlerts.filter(alert => alert.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Severity</p>
              <p className="text-2xl font-bold text-red-600">
                {securityAlerts.filter(alert => alert.type === 'high').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliance Pass</p>
              <p className="text-2xl font-bold text-green-600">
                {complianceChecks.filter(check => check.status === 'pass').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Security Score</p>
              <p className="text-2xl font-bold text-blue-600">85%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Security Alerts */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900">Security Alerts</h4>
          <GlassButton
            icon={<Download size={16} />}
            variant="secondary"
            size="sm"
          >
            Export Alerts
          </GlassButton>
        </div>

        <div className="space-y-4">
          {securityAlerts.map((alert) => (
            <div key={alert.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getAlertTypeColor(alert.type)}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-gray-900">{alert.title}</h5>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAlertTypeColor(alert.type)}`}>
                        {alert.type}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAlertStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Source: {alert.source}</span>
                      <span>Severity: {alert.severity}/10</span>
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {alert.status === 'active' && (
                    <GlassButton
                      onClick={() => handleResolveAlert(alert.id)}
                      variant="secondary"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                    >
                      Resolve
                    </GlassButton>
                  )}
                  <GlassButton
                    onClick={() => setSelectedAlert(alert)}
                    variant="secondary"
                    size="sm"
                  >
                    <Eye size={14} />
                  </GlassButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Compliance Checks */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900">Compliance Checks</h4>
          <GlassButton
            onClick={handleRunComplianceCheck}
            icon={<RefreshCw size={16} />}
            variant="secondary"
            size="sm"
            loading={isLoading}
          >
            Refresh All
          </GlassButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complianceChecks.map((check) => (
            <div key={check.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getComplianceStatusColor(check.status)}`}>
                    {getComplianceStatusIcon(check.status)}
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">{check.name}</h5>
                    <p className="text-sm text-gray-600">{check.details}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getComplianceStatusColor(check.status)}`}>
                  {check.status}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                <p>Last checked: {new Date(check.lastChecked).toLocaleString()}</p>
                <p>Next check: {new Date(check.nextCheck).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GlassCard className="p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Alert Details</h3>
              <GlassButton
                onClick={() => setSelectedAlert(null)}
                variant="secondary"
                size="sm"
              >
                Close
              </GlassButton>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">{selectedAlert.title}</h4>
                <p className="text-gray-600 mt-1">{selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{selectedAlert.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium">{selectedAlert.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Severity</p>
                  <p className="font-medium">{selectedAlert.severity}/10</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Source</p>
                  <p className="font-medium">{selectedAlert.source}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Timestamp</p>
                <p className="font-medium">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <GlassButton
                onClick={() => setSelectedAlert(null)}
                variant="secondary"
                className="flex-1"
              >
                Close
              </GlassButton>
              {selectedAlert.status === 'active' && (
                <GlassButton
                  onClick={() => {
                    handleResolveAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="flex-1 bg-green-600 text-white hover:bg-green-700"
                >
                  Resolve Alert
                </GlassButton>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default PaymentSecurity;
