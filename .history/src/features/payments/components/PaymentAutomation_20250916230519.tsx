import React, { useState, useEffect } from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import { 
  Zap, Plus, Edit3, Trash2, Save, X, Play, Pause, Settings,
  RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { paymentAutomationService } from '../../../lib/paymentAutomationService';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  condition: string;
  action: string;
  status: 'active' | 'inactive' | 'testing';
  priority: number;
  lastExecuted?: string;
  executionCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  rules: string[];
  status: 'active' | 'inactive' | 'testing';
  lastExecuted?: string;
  executionCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

const PaymentAutomation: React.FC = () => {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [automationWorkflows, setAutomationWorkflows] = useState<AutomationWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [showAddWorkflowModal, setShowAddWorkflowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'workflows'>('rules');

  // Form state for rules
  const [ruleFormData, setRuleFormData] = useState<Partial<AutomationRule>>({
    name: '',
    description: '',
    trigger: 'payment_completed',
    condition: 'amount > 1000',
    action: 'send_notification',
    status: 'testing',
    priority: 1
  });

  // Form state for workflows
  const [workflowFormData, setWorkflowFormData] = useState<Partial<AutomationWorkflow>>({
    name: '',
    description: '',
    rules: [],
    status: 'testing'
  });

  // Mock data for demonstration
  const mockAutomationRules: AutomationRule[] = [
    {
      id: '1',
      name: 'High Value Payment Alert',
      description: 'Send alert for payments above 100,000 TZS',
      trigger: 'payment_completed',
      condition: 'amount > 100000',
      action: 'send_notification',
      status: 'active',
      priority: 1,
      lastExecuted: '2024-01-15T10:30:00Z',
      executionCount: 25,
      successRate: 100,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Failed Payment Retry',
      description: 'Automatically retry failed payments after 5 minutes',
      trigger: 'payment_failed',
      condition: 'retry_count < 3',
      action: 'retry_payment',
      status: 'active',
      priority: 2,
      lastExecuted: '2024-01-15T09:15:00Z',
      executionCount: 12,
      successRate: 83,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      name: 'Refund Processing',
      description: 'Process refunds for cancelled orders automatically',
      trigger: 'order_cancelled',
      condition: 'payment_status = completed',
      action: 'process_refund',
      status: 'testing',
      priority: 3,
      executionCount: 0,
      successRate: 0,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z'
    }
  ];

  const mockAutomationWorkflows: AutomationWorkflow[] = [
    {
      id: '1',
      name: 'Payment Processing Workflow',
      description: 'Complete payment processing automation',
      rules: ['1', '2'],
      status: 'active',
      lastExecuted: '2024-01-15T10:30:00Z',
      executionCount: 37,
      successRate: 95,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Customer Service Workflow',
      description: 'Automated customer service responses',
      rules: ['3'],
      status: 'testing',
      executionCount: 0,
      successRate: 0,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z'
    }
  ];

  useEffect(() => {
    setAutomationRules(mockAutomationRules);
    setAutomationWorkflows(mockAutomationWorkflows);
  }, []);

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        // Update existing rule
        setAutomationRules(prev => prev.map(rule => 
          rule.id === editingRule.id 
            ? { ...rule, ...ruleFormData, updatedAt: new Date().toISOString() }
            : rule
        ));
        toast.success('Rule updated successfully');
      } else {
        // Add new rule
        const newRule: AutomationRule = {
          id: Date.now().toString(),
          ...ruleFormData as AutomationRule,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setAutomationRules(prev => [newRule, ...prev]);
        toast.success('Rule added successfully');
      }
      
      setShowAddRuleModal(false);
      setEditingRule(null);
      setRuleFormData({
        name: '',
        description: '',
        trigger: 'payment_completed',
        condition: 'amount > 1000',
        action: 'send_notification',
        status: 'testing',
        priority: 1
      });
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Failed to save rule');
    }
  };

  const handleSaveWorkflow = async () => {
    try {
      if (editingWorkflow) {
        // Update existing workflow
        setAutomationWorkflows(prev => prev.map(workflow => 
          workflow.id === editingWorkflow.id 
            ? { ...workflow, ...workflowFormData, updatedAt: new Date().toISOString() }
            : workflow
        ));
        toast.success('Workflow updated successfully');
      } else {
        // Add new workflow
        const newWorkflow: AutomationWorkflow = {
          id: Date.now().toString(),
          ...workflowFormData as AutomationWorkflow,
          executionCount: 0,
          successRate: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setAutomationWorkflows(prev => [newWorkflow, ...prev]);
        toast.success('Workflow added successfully');
      }
      
      setShowAddWorkflowModal(false);
      setEditingWorkflow(null);
      setWorkflowFormData({
        name: '',
        description: '',
        rules: [],
        status: 'testing'
      });
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Failed to save workflow');
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      setAutomationRules(prev => prev.filter(rule => rule.id !== ruleId));
      toast.success('Rule deleted successfully');
    }
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      setAutomationWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId));
      toast.success('Workflow deleted successfully');
    }
  };

  const handleToggleRuleStatus = (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' }
        : rule
    ));
  };

  const handleToggleWorkflowStatus = (workflowId: string) => {
    setAutomationWorkflows(prev => prev.map(workflow => 
      workflow.id === workflowId 
        ? { ...workflow, status: workflow.status === 'active' ? 'inactive' : 'active' }
        : workflow
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'testing':
        return 'text-orange-600 bg-orange-100';
      case 'inactive':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'testing':
        return <Clock className="w-4 h-4" />;
      case 'inactive':
        return <Pause className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Automation</h3>
          <p className="text-gray-600 mt-1">
            Automated payment workflows and rules
          </p>
        </div>

        <div className="flex gap-3">
          <GlassButton
            onClick={() => setActiveTab('rules')}
            variant={activeTab === 'rules' ? 'primary' : 'secondary'}
            size="sm"
          >
            Rules
          </GlassButton>
          <GlassButton
            onClick={() => setActiveTab('workflows')}
            variant={activeTab === 'workflows' ? 'primary' : 'secondary'}
            size="sm"
          >
            Workflows
          </GlassButton>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rules</p>
              <p className="text-2xl font-bold text-blue-600">{automationRules.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Rules</p>
              <p className="text-2xl font-bold text-green-600">
                {automationRules.filter(rule => rule.status === 'active').length}
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
              <p className="text-sm text-gray-600">Workflows</p>
              <p className="text-2xl font-bold text-purple-600">{automationWorkflows.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-orange-600">
                {automationRules.length > 0 
                  ? Math.round(automationRules.reduce((sum, rule) => sum + rule.successRate, 0) / automationRules.length)
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">Automation Rules</h4>
            <GlassButton
              onClick={() => setShowAddRuleModal(true)}
              icon={<Plus size={16} />}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            >
              Add Rule
            </GlassButton>
          </div>

          <div className="space-y-4">
            {automationRules.map((rule) => (
              <div key={rule.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(rule.status)}`}>
                      {getStatusIcon(rule.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-gray-900">{rule.name}</h5>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rule.status)}`}>
                          {rule.status}
                        </span>
                        <span className="text-xs text-gray-500">Priority: {rule.priority}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p><strong>Trigger:</strong> {rule.trigger}</p>
                        <p><strong>Condition:</strong> {rule.condition}</p>
                        <p><strong>Action:</strong> {rule.action}</p>
                        <p><strong>Executions:</strong> {rule.executionCount} | <strong>Success Rate:</strong> {rule.successRate}%</p>
                        {rule.lastExecuted && (
                          <p><strong>Last Executed:</strong> {new Date(rule.lastExecuted).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <GlassButton
                      onClick={() => handleToggleRuleStatus(rule.id)}
                      variant="secondary"
                      size="sm"
                      icon={rule.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                    >
                      {rule.status === 'active' ? 'Pause' : 'Activate'}
                    </GlassButton>
                    <GlassButton
                      onClick={() => {
                        setEditingRule(rule);
                        setRuleFormData(rule);
                        setShowAddRuleModal(true);
                      }}
                      variant="secondary"
                      size="sm"
                      icon={<Edit3 size={14} />}
                    >
                      Edit
                    </GlassButton>
                    <GlassButton
                      onClick={() => handleDeleteRule(rule.id)}
                      variant="secondary"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </GlassButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">Automation Workflows</h4>
            <GlassButton
              onClick={() => setShowAddWorkflowModal(true)}
              icon={<Plus size={16} />}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
            >
              Add Workflow
            </GlassButton>
          </div>

          <div className="space-y-4">
            {automationWorkflows.map((workflow) => (
              <div key={workflow.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(workflow.status)}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-gray-900">{workflow.name}</h5>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}>
                          {workflow.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p><strong>Rules:</strong> {workflow.rules.length} rules included</p>
                        <p><strong>Executions:</strong> {workflow.executionCount} | <strong>Success Rate:</strong> {workflow.successRate}%</p>
                        {workflow.lastExecuted && (
                          <p><strong>Last Executed:</strong> {new Date(workflow.lastExecuted).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <GlassButton
                      onClick={() => handleToggleWorkflowStatus(workflow.id)}
                      variant="secondary"
                      size="sm"
                      icon={workflow.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                    >
                      {workflow.status === 'active' ? 'Pause' : 'Activate'}
                    </GlassButton>
                    <GlassButton
                      onClick={() => {
                        setEditingWorkflow(workflow);
                        setWorkflowFormData(workflow);
                        setShowAddWorkflowModal(true);
                      }}
                      variant="secondary"
                      size="sm"
                      icon={<Edit3 size={14} />}
                    >
                      Edit
                    </GlassButton>
                    <GlassButton
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                      variant="secondary"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </GlassButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Add/Edit Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GlassCard className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRule ? 'Edit Rule' : 'Add New Rule'}
              </h3>
              <GlassButton
                onClick={() => {
                  setShowAddRuleModal(false);
                  setEditingRule(null);
                  setRuleFormData({
                    name: '',
                    description: '',
                    trigger: 'payment_completed',
                    condition: 'amount > 1000',
                    action: 'send_notification',
                    status: 'testing',
                    priority: 1
                  });
                }}
                variant="secondary"
                size="sm"
                icon={<X size={16} />}
              >
                Close
              </GlassButton>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                <GlassInput
                  value={ruleFormData.name || ''}
                  onChange={(e) => setRuleFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter rule name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <GlassInput
                  value={ruleFormData.description || ''}
                  onChange={(e) => setRuleFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter rule description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trigger</label>
                  <GlassSelect
                    options={[
                      { value: 'payment_completed', label: 'Payment Completed' },
                      { value: 'payment_failed', label: 'Payment Failed' },
                      { value: 'order_cancelled', label: 'Order Cancelled' },
                      { value: 'refund_requested', label: 'Refund Requested' }
                    ]}
                    value={ruleFormData.trigger || 'payment_completed'}
                    onChange={(value) => setRuleFormData(prev => ({ ...prev, trigger: value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <GlassSelect
                    options={[
                      { value: 'send_notification', label: 'Send Notification' },
                      { value: 'retry_payment', label: 'Retry Payment' },
                      { value: 'process_refund', label: 'Process Refund' },
                      { value: 'update_status', label: 'Update Status' }
                    ]}
                    value={ruleFormData.action || 'send_notification'}
                    onChange={(value) => setRuleFormData(prev => ({ ...prev, action: value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <GlassInput
                  value={ruleFormData.condition || ''}
                  onChange={(e) => setRuleFormData(prev => ({ ...prev, condition: e.target.value }))}
                  placeholder="e.g., amount > 1000"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <GlassInput
                    type="number"
                    value={ruleFormData.priority || 1}
                    onChange={(e) => setRuleFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <GlassSelect
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'testing', label: 'Testing' },
                      { value: 'inactive', label: 'Inactive' }
                    ]}
                    value={ruleFormData.status || 'testing'}
                    onChange={(value) => setRuleFormData(prev => ({ ...prev, status: value as any }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <GlassButton
                onClick={() => {
                  setShowAddRuleModal(false);
                  setEditingRule(null);
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </GlassButton>
              <GlassButton
                onClick={handleSaveRule}
                icon={<Save size={16} />}
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
              >
                {editingRule ? 'Update' : 'Add'} Rule
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Add/Edit Workflow Modal */}
      {showAddWorkflowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GlassCard className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingWorkflow ? 'Edit Workflow' : 'Add New Workflow'}
              </h3>
              <GlassButton
                onClick={() => {
                  setShowAddWorkflowModal(false);
                  setEditingWorkflow(null);
                  setWorkflowFormData({
                    name: '',
                    description: '',
                    rules: [],
                    status: 'testing'
                  });
                }}
                variant="secondary"
                size="sm"
                icon={<X size={16} />}
              >
                Close
              </GlassButton>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Name</label>
                <GlassInput
                  value={workflowFormData.name || ''}
                  onChange={(e) => setWorkflowFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter workflow name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <GlassInput
                  value={workflowFormData.description || ''}
                  onChange={(e) => setWorkflowFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter workflow description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <GlassSelect
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'testing', label: 'Testing' },
                    { value: 'inactive', label: 'Inactive' }
                  ]}
                  value={workflowFormData.status || 'testing'}
                  onChange={(value) => setWorkflowFormData(prev => ({ ...prev, status: value as any }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Include Rules</label>
                <div className="space-y-2">
                  {automationRules.map((rule) => (
                    <label key={rule.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={workflowFormData.rules?.includes(rule.id) || false}
                        onChange={(e) => {
                          const rules = workflowFormData.rules || [];
                          if (e.target.checked) {
                            setWorkflowFormData(prev => ({ ...prev, rules: [...rules, rule.id] }));
                          } else {
                            setWorkflowFormData(prev => ({ ...prev, rules: rules.filter(id => id !== rule.id) }));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{rule.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <GlassButton
                onClick={() => {
                  setShowAddWorkflowModal(false);
                  setEditingWorkflow(null);
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </GlassButton>
              <GlassButton
                onClick={handleSaveWorkflow}
                icon={<Save size={16} />}
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
              >
                {editingWorkflow ? 'Update' : 'Add'} Workflow
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default PaymentAutomation;
