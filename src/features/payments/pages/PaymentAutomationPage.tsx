import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import { BackButton } from '../../shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../shared/components/PageErrorBoundary';
import { 
  Zap, Play, Pause, Settings, Plus, Edit3, Trash2,
  Clock, Activity, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Download, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { paymentAutomationService } from '../../../lib/paymentAutomationService';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'disabled';
  trigger: string;
  action: string;
  conditions: string[];
  lastRun?: string;
  nextRun?: string;
  successRate: number;
  totalExecutions: number;
  createdAt: string;
}

interface AutomationMetrics {
  activeRules: number;
  successRate: number;
  processedToday: number;
  totalExecutions: number;
}

interface AutomationActivity {
  id: string;
  ruleName: string;
  action: string;
  status: 'success' | 'failed' | 'running';
  timestamp: string;
  details: string;
}

const PaymentAutomationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [automationMetrics, setAutomationMetrics] = useState<AutomationMetrics>({
    activeRules: 12,
    successRate: 96.8,
    processedToday: 2300,
    totalExecutions: 45600
  });
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [activities, setActivities] = useState<AutomationActivity[]>([]);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  // Load automation data
  const loadAutomationData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual service calls
      setRules([
        {
          id: '1',
          name: 'Auto-Refund Failed Payments',
          description: 'Automatically refund payments that fail after 3 attempts',
          status: 'active',
          trigger: 'Payment Failed',
          action: 'Issue Refund',
          conditions: ['Failed 3 times', 'Amount < 100,000 TZS'],
          lastRun: '5 minutes ago',
          nextRun: 'Continuous',
          successRate: 98.5,
          totalExecutions: 1250,
          createdAt: '2 weeks ago'
        },
        {
          id: '2',
          name: 'Daily Reconciliation',
          description: 'Run daily reconciliation at 6:00 AM',
          status: 'active',
          trigger: 'Scheduled',
          action: 'Run Reconciliation',
          conditions: ['Daily at 6:00 AM'],
          lastRun: '2 hours ago',
          nextRun: 'Tomorrow 6:00 AM',
          successRate: 100,
          totalExecutions: 30,
          createdAt: '1 month ago'
        },
        {
          id: '3',
          name: 'Fraud Detection Alert',
          description: 'Send alerts for transactions over 1,000,000 TZS',
          status: 'active',
          trigger: 'High Value Transaction',
          action: 'Send Alert',
          conditions: ['Amount > 1,000,000 TZS', 'New customer'],
          lastRun: '2 hours ago',
          nextRun: 'Continuous',
          successRate: 95.2,
          totalExecutions: 45,
          createdAt: '3 weeks ago'
        },
        {
          id: '4',
          name: 'Weekly Report Generation',
          description: 'Generate weekly payment reports every Monday',
          status: 'paused',
          trigger: 'Scheduled',
          action: 'Generate Report',
          conditions: ['Weekly on Monday 9:00 AM'],
          lastRun: '1 week ago',
          nextRun: 'Monday 9:00 AM',
          successRate: 100,
          totalExecutions: 12,
          createdAt: '2 months ago'
        }
      ]);

      setActivities([
        {
          id: '1',
          ruleName: 'Auto-Refund Failed Payments',
          action: 'Refund processed for payment #12345',
          status: 'success',
          timestamp: '10 minutes ago',
          details: 'Amount: 25,000 TZS'
        },
        {
          id: '2',
          ruleName: 'Daily Reconciliation',
          action: 'Reconciliation completed successfully',
          status: 'success',
          timestamp: '2 hours ago',
          details: '1,247 transactions matched'
        },
        {
          id: '3',
          ruleName: 'Fraud Detection Alert',
          action: 'High-value transaction alert sent',
          status: 'success',
          timestamp: '3 hours ago',
          details: 'Amount: 1,500,000 TZS'
        }
      ]);
    } catch (error) {
      console.error('Error loading automation data:', error);
      toast.error('Failed to load automation data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAutomationData();
  }, []);

  // Handle rule status toggle
  const handleToggleRule = async (ruleId: string) => {
    try {
      setRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { 
              ...rule, 
              status: rule.status === 'active' ? 'paused' : 'active' 
            }
          : rule
      ));
      toast.success('Rule status updated');
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Failed to update rule');
    }
  };

  // Handle rule deletion
  const handleDeleteRule = async (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this automation rule?')) {
      try {
        setRules(prev => prev.filter(rule => rule.id !== ruleId));
        toast.success('Rule deleted successfully');
      } catch (error) {
        console.error('Error deleting rule:', error);
        toast.error('Failed to delete rule');
      }
    }
  };

  // Handle create new rule
  const handleCreateRule = () => {
    setShowCreateRule(true);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100';
      case 'paused': return 'text-yellow-700 bg-yellow-100';
      case 'disabled': return 'text-gray-700 bg-gray-100';
      case 'success': return 'text-green-700 bg-green-100';
      case 'failed': return 'text-red-700 bg-red-100';
      case 'running': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <PageErrorBoundary pageName="Payment Automation" showDetails={true}>
      <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/finance/payments" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Automation</h1>
              <p className="text-gray-600 mt-1">Automated payment workflows and rules management</p>
            </div>
          </div>

          <div className="flex gap-3">
            <GlassButton
              onClick={handleCreateRule}
              icon={<Plus size={18} />}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Create Rule
            </GlassButton>
            <GlassButton
              onClick={loadAutomationData}
              icon={<RefreshCw size={18} />}
              variant="secondary"
              loading={isLoading}
            >
              Refresh
            </GlassButton>
          </div>
        </div>

        {/* Automation Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Rules</p>
                <p className="text-xl font-semibold text-orange-700">{automationMetrics.activeRules}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-xl font-semibold text-green-700">{automationMetrics.successRate}%</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Processed Today</p>
                <p className="text-xl font-semibold text-blue-700">{automationMetrics.processedToday.toLocaleString()}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Executions</p>
                <p className="text-xl font-semibold text-purple-700">{automationMetrics.totalExecutions.toLocaleString()}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Automation Rules */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Automation Rules</h3>
              <GlassButton
                onClick={handleCreateRule}
                icon={<Plus size={16} />}
                variant="secondary"
                size="sm"
              >
                New Rule
              </GlassButton>
            </div>

            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{rule.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rule.status)}`}>
                          {rule.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Success: {rule.successRate}%</span>
                        <span>Executions: {rule.totalExecutions}</span>
                        {rule.lastRun && <span>Last: {rule.lastRun}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <GlassButton
                        onClick={() => handleToggleRule(rule.id)}
                        size="sm"
                        className={rule.status === 'active' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'}
                      >
                        {rule.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                      </GlassButton>
                      <GlassButton
                        onClick={() => setEditingRule(rule)}
                        size="sm"
                        variant="secondary"
                      >
                        <Edit3 size={14} />
                      </GlassButton>
                      <GlassButton
                        onClick={() => handleDeleteRule(rule.id)}
                        size="sm"
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        <Trash2 size={14} />
                      </GlassButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Recent Activity */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <GlassButton
                onClick={loadAutomationData}
                icon={<RefreshCw size={16} />}
                variant="secondary"
                size="sm"
              >
                Refresh
              </GlassButton>
            </div>

            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">{activity.ruleName}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.details}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Automation Settings */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">General Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Global Automation</span>
                  <GlassButton size="sm" className="bg-green-600 text-white">
                    Enabled
                  </GlassButton>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Error Notifications</span>
                  <GlassButton size="sm" className="bg-green-600 text-white">
                    Active
                  </GlassButton>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Execution Logging</span>
                  <GlassButton size="sm" className="bg-green-600 text-white">
                    Enabled
                  </GlassButton>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Performance</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Max Concurrent Rules</span>
                  <GlassSelect
                    value="5"
                    onChange={() => {}}
                    options={[
                      { value: '3', label: '3' },
                      { value: '5', label: '5' },
                      { value: '10', label: '10' }
                    ]}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Retry Attempts</span>
                  <GlassSelect
                    value="3"
                    onChange={() => {}}
                    options={[
                      { value: '1', label: '1' },
                      { value: '3', label: '3' },
                      { value: '5', label: '5' }
                    ]}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageErrorBoundary>
  );
};

export default PaymentAutomationPage;

