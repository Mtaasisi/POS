import React, { useState } from 'react';
import { 
  Settings, Users, Building, Plus, Edit, Trash2, Save, 
  CheckCircle, XCircle, Mail, Phone, UserPlus
} from 'lucide-react';
import { 
  ShippingSettings, ShippingAgent, ShippingManager,
  ShippingAgentFormData, ShippingManagerFormData
} from '../../types/inventory';

import GlassButton from '../../../shared/components/ui/GlassButton';
import { toast } from 'react-hot-toast';

interface ShippingSettingsManagerProps {
  settings: ShippingSettings;
  agents: ShippingAgent[];
  managers: ShippingManager[];
  onSettingsUpdate: (settings: Partial<ShippingSettings>) => void;
  onAgentCreate: (agent: ShippingAgentFormData) => void;
  onAgentUpdate: (id: string, agent: Partial<ShippingAgentFormData>) => void;
  onAgentDelete: (id: string) => void;
  onManagerCreate: (manager: ShippingManagerFormData) => void;
  onManagerUpdate: (id: string, manager: Partial<ShippingManagerFormData>) => void;
  onManagerDelete: (id: string) => void;
}

const ShippingSettingsManager: React.FC<ShippingSettingsManagerProps> = ({
  settings,
  agents,
  managers,
  onSettingsUpdate,
  onAgentCreate,
  onAgentUpdate,
  onAgentDelete,
  onManagerCreate,
  onManagerUpdate,
  onManagerDelete
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'agents' | 'managers'>('settings');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [agentForm, setAgentForm] = useState<ShippingAgentFormData>({
    name: '', email: '', phone: '', company: '', isActive: true
  });
  const [managerForm, setManagerForm] = useState<ShippingManagerFormData>({
    name: '', email: '', phone: '', department: 'Logistics', isActive: true
  });


  const handleSettingsChange = (field: keyof ShippingSettings, value: any) => {
    onSettingsUpdate({ [field]: value });
  };

  const resetForms = () => {
    setAgentForm({ name: '', email: '', phone: '', company: '', isActive: true });
    setManagerForm({ name: '', email: '', phone: '', department: 'Logistics', isActive: true });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAddAgent = () => {
    if (!agentForm.name.trim()) {
      toast.error('Please fill in the agent name');
      return;
    }
    onAgentCreate(agentForm);
    resetForms();
    toast.success('Agent added successfully');
  };

  const handleAddManager = () => {
    if (!managerForm.name.trim() || !managerForm.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    onManagerCreate(managerForm);
    resetForms();
    toast.success('Manager added successfully');
  };





  const startEdit = (type: 'agent' | 'manager', id: string) => {
    setEditingId(id);
    
    if (type === 'agent') {
      const agent = agents.find(a => a.id === id);
      if (agent) {
        setAgentForm({
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          company: agent.company,
          code: agent.code,
          trackingUrl: agent.trackingUrl,
          supportedServices: agent.supportedServices,
          contactInfo: agent.contactInfo,
          managerId: agent.managerId,
          isActive: agent.isActive
        });
      }
    } else if (type === 'manager') {
      const manager = managers.find(m => m.id === id);
      if (manager) {
        setManagerForm({
          name: manager.name,
          email: manager.email,
          phone: manager.phone,
          department: manager.department,
          isActive: manager.isActive
        });
      }
    }
    setShowAddForm(true);
  };

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auto Assignment */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.autoAssignAgents || false}
                onChange={(e) => handleSettingsChange('autoAssignAgents', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Auto-assign Agents</span>
                <p className="text-sm text-gray-600">Automatically assign available agents to new shipments</p>
              </div>
            </label>
          </div>

          {/* Enable Tracking */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.enableTracking || false}
                onChange={(e) => handleSettingsChange('enableTracking', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Enable Tracking</span>
                <p className="text-sm text-gray-600">Track packages in real-time</p>
              </div>
            </label>
          </div>

          {/* Enable Notifications */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.enableNotifications || false}
                onChange={(e) => handleSettingsChange('enableNotifications', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Enable Notifications</span>
                <p className="text-sm text-gray-600">Send shipping updates via selected channels</p>
              </div>
            </label>
          </div>

          {/* Auto Update Status */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.autoUpdateStatus || false}
                onChange={(e) => handleSettingsChange('autoUpdateStatus', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Auto Update Status</span>
                <p className="text-sm text-gray-600">Automatically update order status based on shipping events</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost & Security Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Shipping Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Shipping Cost (TZS)
            </label>
            <input
              type="number"
              value={settings.defaultShippingCost || 0}
              onChange={(e) => handleSettingsChange('defaultShippingCost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          {/* Max Shipping Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Shipping Cost (TZS)
            </label>
            <input
              type="number"
              value={settings.maxShippingCost || 0}
              onChange={(e) => handleSettingsChange('maxShippingCost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          {/* Tracking Update Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracking Update Interval (minutes)
            </label>
            <select
              value={settings.trackingUpdateInterval || 60}
              onChange={(e) => handleSettingsChange('trackingUpdateInterval', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={240}>4 hours</option>
            </select>
          </div>

          {/* Default Agent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Agent
            </label>
            <select
              value={settings.defaultAgentId || ''}
              onChange={(e) => handleSettingsChange('defaultAgentId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select default agent</option>
              {agents.filter(a => a.isActive).map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h3>
        
        <div className="flex flex-wrap gap-3">
          {['email', 'sms', 'whatsapp'].map(channel => (
            <label key={channel} className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
              <input
                type="checkbox"
                              checked={settings.notificationChannels?.includes(channel as any) || false}
              onChange={(e) => {
                const channels = settings.notificationChannels?.filter((c: string) => c !== channel) || [];
                if (e.target.checked) {
                  channels.push(channel as any);
                }
                handleSettingsChange('notificationChannels', channels);
              }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900 capitalize">{channel}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAgentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Shipping Agents</h3>
          <p className="text-gray-600">Manage agents who handle shipping operations</p>
        </div>
        <GlassButton
          onClick={() => {
            setActiveTab('agents');
            setShowAddForm(true);
          }}
          className="flex items-center gap-2"
        >
          <UserPlus size={16} />
          Add Agent
        </GlassButton>
      </div>

      {showAddForm && activeTab === 'agents' && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Edit Agent' : 'Add New Agent'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Agent Name"
              value={agentForm.name}
              onChange={(e) => setAgentForm({...agentForm, name: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={agentForm.email || ''}
              onChange={(e) => setAgentForm({...agentForm, email: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={agentForm.phone || ''}
              onChange={(e) => setAgentForm({...agentForm, phone: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Company"
              value={agentForm.company || ''}
              onChange={(e) => setAgentForm({...agentForm, company: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={agentForm.managerId || ''}
              onChange={(e) => setAgentForm({...agentForm, managerId: e.target.value || undefined})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Manager (Optional)</option>
              {managers.filter(m => m.isActive).map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} - {manager.department}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={agentForm.isActive}
                onChange={(e) => setAgentForm({...agentForm, isActive: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex gap-3">
            <GlassButton
              onClick={editingId ? () => {
                onAgentUpdate(editingId, agentForm);
                resetForms();
                toast.success('Agent updated');
              } : handleAddAgent}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {editingId ? 'Update' : 'Add'} Agent
            </GlassButton>
            <GlassButton
              onClick={resetForms}
              variant="outline"
            >
              Cancel
            </GlassButton>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div key={agent.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                  {agent.company && <p className="text-sm text-gray-400">{agent.company}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {agent.isActive ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <XCircle size={16} className="text-red-500" />
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {agent.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  <span>{agent.email}</span>
                </div>
              )}
              {agent.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{agent.phone}</span>
                </div>
              )}
              {agent.managerId && (
                <div className="flex items-center gap-2">
                  <Building size={14} />
                  <span>Manager: {managers.find(m => m.id === agent.managerId)?.name || 'Unknown'}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('agents');
                  startEdit('agent', agent.id);
                  setShowAddForm(true);
                }}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Edit size={14} />
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this agent?')) {
                    onAgentDelete(agent.id);
                    toast.success('Agent deleted');
                  }
                }}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        
        {agents.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No agents configured yet</p>
            <p className="text-sm">Add your first shipping agent to get started</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderManagersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Shipping Managers</h3>
          <p className="text-gray-600">Manage shipping team leaders and supervisors</p>
        </div>
        <GlassButton
          onClick={() => {
            setActiveTab('managers');
            setShowAddForm(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Manager
        </GlassButton>
      </div>

      {showAddForm && activeTab === 'managers' && (
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Edit Manager' : 'Add New Manager'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Manager Name"
              value={managerForm.name}
              onChange={(e) => setManagerForm({...managerForm, name: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={managerForm.email}
              onChange={(e) => setManagerForm({...managerForm, email: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={managerForm.phone}
              onChange={(e) => setManagerForm({...managerForm, phone: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Department"
              value={managerForm.department}
              onChange={(e) => setManagerForm({...managerForm, department: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <GlassButton
              onClick={editingId ? () => {
                onManagerUpdate(editingId, managerForm);
                resetForms();
                toast.success('Manager updated');
              } : handleAddManager}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {editingId ? 'Update' : 'Add'} Manager
            </GlassButton>
            <GlassButton
              onClick={resetForms}
              variant="outline"
            >
              Cancel
            </GlassButton>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {managers?.map(manager => (
          <div key={manager.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {manager.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{manager.name}</h4>
                  <p className="text-sm text-gray-500">{manager.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {manager.isActive ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <XCircle size={16} className="text-red-500" />
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Mail size={14} />
                <span>{manager.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} />
                <span>{manager.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} />
                <span>{manager.providers?.length || 0} providers</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('managers');
                  startEdit('manager', manager.id);
                  setShowAddForm(true);
                }}
                className="flex-1 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
              >
                <Edit size={14} />
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this manager?')) {
                    onManagerDelete(manager.id);
                    toast.success('Manager deleted');
                  }
                }}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        
        {(!managers || managers.length === 0) && (
          <div className="col-span-full text-center py-8 text-gray-500">
            <Building size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No managers configured yet</p>
            <p className="text-sm">Add shipping managers to organize your team</p>
          </div>
        )}
      </div>
    </div>
  );



  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'settings', label: 'Settings', icon: Settings },
            { key: 'agents', label: 'Agents', icon: Users },
            { key: 'managers', label: 'Managers', icon: Building }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key as any);
                setShowAddForm(false);
                setEditingId(null);
              }}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'agents' && renderAgentsTab()}
        {activeTab === 'managers' && renderManagersTab()}
      </div>
    </div>
  );
};

export default ShippingSettingsManager;
