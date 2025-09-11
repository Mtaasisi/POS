import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import { BackButton } from '../../shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../shared/components/PageErrorBoundary';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, 
  Eye, EyeOff, RefreshCw, Download, Settings,
  Activity, Lock, Key, FileText, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { paymentSecurityService } from '../../../lib/paymentSecurityService';

interface SecurityAlert {
  id: string;
  type: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

interface ComplianceCheck {
  id: string;
  name: string;
  status: 'compliant' | 'non-compliant' | 'in-review';
  lastChecked: string;
  nextCheck: string;
  details: string;
}

interface SecurityMetrics {
  securityScore: number;
  activeAlerts: number;
  complianceRate: number;
  lastScan: string;
}

const PaymentSecurityCompliancePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    securityScore: 98,
    activeAlerts: 3,
    complianceRate: 95,
    lastScan: '2 hours ago'
  });
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [showAlertDetails, setShowAlertDetails] = useState(false);

  // Load security data
  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual service calls
      setAlerts([
        {
          id: '1',
          type: 'high',
          title: 'High Risk Transaction Detected',
          description: 'Unusual payment pattern from account #12345',
          status: 'open',
          createdAt: '1 hour ago'
        },
        {
          id: '2',
          type: 'medium',
          title: 'Failed Login Attempts',
          description: 'Multiple failed attempts from IP 192.168.1.100',
          status: 'investigating',
          createdAt: '3 hours ago'
        },
        {
          id: '3',
          type: 'medium',
          title: 'Certificate Expiry Warning',
          description: 'SSL certificate expires in 15 days',
          status: 'open',
          createdAt: '1 day ago'
        }
      ]);

      setComplianceChecks([
        {
          id: '1',
          name: 'PCI DSS Compliance',
          status: 'compliant',
          lastChecked: '1 week ago',
          nextCheck: 'Next week',
          details: 'All requirements met'
        },
        {
          id: '2',
          name: 'GDPR Compliance',
          status: 'compliant',
          lastChecked: '2 weeks ago',
          nextCheck: 'Next month',
          details: 'Data protection measures in place'
        },
        {
          id: '3',
          name: 'ISO 27001',
          status: 'in-review',
          lastChecked: '1 month ago',
          nextCheck: 'In progress',
          details: 'Audit in progress'
        },
        {
          id: '4',
          name: 'SOC 2 Type II',
          status: 'compliant',
          lastChecked: '3 months ago',
          nextCheck: 'Next quarter',
          details: 'Annual audit completed'
        }
      ]);
    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  // Handle compliance check
  const handleComplianceCheck = async () => {
    try {
      await paymentSecurityService.performComplianceChecks();
      toast.success('Compliance checks completed');
      loadSecurityData();
    } catch (error) {
      console.error('Compliance check error:', error);
      toast.error('Compliance check failed');
    }
  };

  // Handle alert resolution
  const handleResolveAlert = async (alertId: string) => {
    try {
      // Update alert status
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved' as const, resolvedAt: new Date().toISOString() }
          : alert
      ));
      toast.success('Alert resolved successfully');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-700 bg-green-100';
      case 'non-compliant': return 'text-red-700 bg-red-100';
      case 'in-review': return 'text-yellow-700 bg-yellow-100';
      case 'open': return 'text-red-700 bg-red-100';
      case 'investigating': return 'text-yellow-700 bg-yellow-100';
      case 'resolved': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  // Get alert type color
  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <PageErrorBoundary pageName="Payment Security & Compliance" showDetails={true}>
      <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/finance/payments" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Security & Compliance</h1>
              <p className="text-gray-600 mt-1">Payment security monitoring and compliance management</p>
            </div>
          </div>

          <div className="flex gap-3">
            <GlassButton
              onClick={handleComplianceCheck}
              icon={<Shield size={18} />}
              className="bg-red-600 text-white hover:bg-red-700"
              loading={isLoading}
            >
              Run Compliance Check
            </GlassButton>
            <GlassButton
              onClick={() => toast('Exporting security report...')}
              icon={<Download size={18} />}
              variant="secondary"
            >
              Export Report
            </GlassButton>
          </div>
        </div>

        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Security Score</p>
                <p className="text-xl font-semibold text-green-700">{securityMetrics.securityScore}%</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-xl font-semibold text-red-700">{securityMetrics.activeAlerts}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Compliance Rate</p>
                <p className="text-xl font-semibold text-blue-700">{securityMetrics.complianceRate}%</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Scan</p>
                <p className="text-xl font-semibold text-purple-700">{securityMetrics.lastScan}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Alerts */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
              <GlassButton
                onClick={loadSecurityData}
                icon={<RefreshCw size={16} />}
                variant="secondary"
                size="sm"
              >
                Refresh
              </GlassButton>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertTypeColor(alert.type)}`}>
                          {alert.type.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                      <p className="text-xs text-gray-500">{alert.createdAt}</p>
                    </div>
                    {alert.status === 'open' && (
                      <GlassButton
                        onClick={() => handleResolveAlert(alert.id)}
                        size="sm"
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        Resolve
                      </GlassButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Compliance Status */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Compliance Status</h3>
              <GlassButton
                onClick={handleComplianceCheck}
                icon={<Shield size={16} />}
                variant="secondary"
                size="sm"
                loading={isLoading}
              >
                Check
              </GlassButton>
            </div>

            <div className="space-y-3">
              {complianceChecks.map((check) => (
                <div key={check.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{check.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                      {check.status.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{check.details}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Last: {check.lastChecked}</span>
                    <span>Next: {check.nextCheck}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Security Settings */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Access Control</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Two-Factor Authentication</span>
                  <GlassButton size="sm" className="bg-green-600 text-white">
                    Enabled
                  </GlassButton>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Session Timeout</span>
                  <GlassSelect
                    value="30"
                    onChange={() => {}}
                    options={[
                      { value: '15', label: '15 minutes' },
                      { value: '30', label: '30 minutes' },
                      { value: '60', label: '1 hour' }
                    ]}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Monitoring</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Real-time Alerts</span>
                  <GlassButton size="sm" className="bg-green-600 text-white">
                    Active
                  </GlassButton>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Audit Logging</span>
                  <GlassButton size="sm" className="bg-green-600 text-white">
                    Enabled
                  </GlassButton>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageErrorBoundary>
  );
};

export default PaymentSecurityCompliancePage;

