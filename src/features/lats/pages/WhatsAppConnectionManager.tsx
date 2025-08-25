import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Plus,
  Settings,
  Smartphone,
  RefreshCw,
  QrCode,
  LogOut,
  Power,
  Key,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  Webhook,
  Phone,
  Globe,
  Activity,
  BarChart3,
  Sync
} from 'lucide-react';
import { useAuth } from '../../../lib/authContext';
import { toast } from '../../../lib/toastUtils';
import { whatsappConnectionService } from '../../../services/whatsappConnectionService';

const WhatsAppConnectionManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'instances' | 'settings' | 'qr' | 'logs'>('overview');
  const [showCreateInstance, setShowCreateInstance] = useState(false);
  const [createForm, setCreateForm] = useState({
    instanceId: '',
    apiToken: '',
    instanceName: '',
    description: '',
    host: 'https://api.green-api.com'
  });

  useEffect(() => {
    if (currentUser) {
      loadInstances();
    }
  }, [currentUser]);

  const loadInstances = async () => {
    try {
      setLoading(true);
      // Load instances from service
      const data = await whatsappConnectionService.getAllInstances();
      setInstances(data || []);
    } catch (error: any) {
      console.error('Error loading instances:', error);
      toast.error('Failed to load instances');
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async () => {
    if (!createForm.instanceId || !createForm.apiToken) {
      toast.error('Instance ID and API Token are required');
      return;
    }

    try {
      await whatsappConnectionService.createInstance(
        createForm.instanceId,
        createForm.apiToken,
        createForm.instanceName,
        createForm.description,
        createForm.host
      );
      
      setCreateForm({
        instanceId: '',
        apiToken: '',
        instanceName: '',
        description: '',
        host: 'https://api.green-api.com'
      });
      setShowCreateInstance(false);
      loadInstances();
      toast.success('Instance created successfully!');
    } catch (error: any) {
      console.error('Error creating instance:', error);
      toast.error('Failed to create instance: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageCircle size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loading WhatsApp Manager</h3>
          <p className="text-gray-600">Setting up your connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <MessageCircle size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WhatsApp Connection Manager</h1>
                <p className="text-sm text-gray-600">Manage your WhatsApp Business integrations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadInstances}
                className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                title="Refresh instances"
              >
                <RefreshCw size={20} />
              </button>
              
              <button
                onClick={() => setShowCreateInstance(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <Plus size={18} />
                Add Instance
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-b border-gray-200 -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'instances', label: 'Instances', icon: Smartphone },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'qr', label: 'QR Codes', icon: QrCode },
              { id: 'logs', label: 'Activity', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Instances</p>
                    <p className="text-3xl font-bold text-gray-900">{instances.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Smartphone size={24} className="text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Connected</p>
                    <p className="text-3xl font-bold text-green-600">
                      {instances.filter(i => i.status === 'connected').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Disconnected</p>
                    <p className="text-3xl font-bold text-red-600">
                      {instances.filter(i => i.status === 'disconnected').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle size={24} className="text-red-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Version</p>
                    <p className="text-lg font-bold text-blue-600">Green API v2</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Globe size={24} className="text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowCreateInstance(true)}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Plus size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Add New Instance</h4>
                      <p className="text-sm text-gray-600">Create a new WhatsApp connection</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={loadInstances}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Sync size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Sync All Instances</h4>
                      <p className="text-sm text-gray-600">Update all connection states</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Settings size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Configure Settings</h4>
                      <p className="text-sm text-gray-600">Manage webhooks and preferences</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs content */}
        {activeTab !== 'overview' && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section</h3>
            <p className="text-gray-600">This section is being developed. Full functionality coming soon!</p>
          </div>
        )}

        {/* Create Instance Modal */}
        {showCreateInstance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Create WhatsApp Instance</h2>
                  <button
                    onClick={() => setShowCreateInstance(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createInstance();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instance ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createForm.instanceId}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, instanceId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
                      placeholder="Enter your Green API instance ID"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Token <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={createForm.apiToken}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, apiToken: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
                      placeholder="Enter your Green API token"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instance Name
                    </label>
                    <input
                      type="text"
                      value={createForm.instanceName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, instanceName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
                      placeholder="Enter a friendly name for this instance"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateInstance(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
                    >
                      Create Instance
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppConnectionManager;
