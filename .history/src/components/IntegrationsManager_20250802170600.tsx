import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Globe, 
  Zap, 
  Database, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  Settings,
  TestTube,
  Plus,
  Edit,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';
import { 
  getIntegrations, 
  saveIntegration, 
  deleteIntegration, 
  testIntegration,
  getAllIntegrationStatuses,
  initializeDefaultIntegrations,
  IntegrationConfig,
  IntegrationStatus
} from '../lib/integrationService';
import GlassButton from './ui/GlassButton';
import toast from 'react-hot-toast';

interface IntegrationsManagerProps {
  onIntegrationUpdate?: () => void;
}

const IntegrationsManager: React.FC<IntegrationsManagerProps> = ({ onIntegrationUpdate }) => {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [loading, setLoading] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<IntegrationConfig | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const fetchedIntegrations = await getIntegrations();
      setIntegrations(fetchedIntegrations);
      
      // Get statuses for all integrations
      const statuses = await getAllIntegrationStatuses();
      setIntegrationStatuses(statuses);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeIntegrations = async () => {
    try {
      await initializeDefaultIntegrations();
      await loadIntegrations();
      toast.success('Default integrations initialized');
      onIntegrationUpdate?.();
    } catch (error) {
      console.error('Error initializing integrations:', error);
      toast.error('Failed to initialize integrations');
    }
  };

  const handleTestIntegration = async (integration: IntegrationConfig) => {
    try {
      const status = await testIntegration(integration);
      setIntegrationStatuses(prev => ({
        ...prev,
        [integration.name]: status
      }));
      
      if (status.isConnected) {
        toast.success(`${integration.name} is connected`);
      } else {
        toast.error(`${integration.name} connection failed: ${status.error}`);
      }
    } catch (error) {
      console.error('Error testing integration:', error);
      toast.error('Failed to test integration');
    }
  };

  const handleSaveIntegration = async (integration: IntegrationConfig) => {
    try {
      const success = await saveIntegration(integration);
      if (success) {
        await loadIntegrations();
        setEditingIntegration(null);
        onIntegrationUpdate?.();
      }
    } catch (error) {
      console.error('Error saving integration:', error);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this integration?')) {
      try {
        const success = await deleteIntegration(id);
        if (success) {
          await loadIntegrations();
          onIntegrationUpdate?.();
        }
      } catch (error) {
        console.error('Error deleting integration:', error);
      }
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'sms':
        return <MessageSquare className="h-6 w-6 text-blue-600" />;
      case 'whatsapp':
        return <Globe className="h-6 w-6 text-green-600" />;
      case 'ai':
        return <Zap className="h-6 w-6 text-purple-600" />;
      case 'storage':
        return <Database className="h-6 w-6 text-orange-600" />;
      default:
        return <Settings className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusDisplay = (integration: IntegrationConfig) => {
    const status = integrationStatuses[integration.name];
    
    if (!status) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Not tested</span>
        </div>
      );
    }

    if (status.isConnected) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Connected</span>
          {status.balance && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              {status.balance} credits
            </span>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm">Disconnected</span>
          {status.error && (
            <span className="text-xs text-red-500" title={status.error}>
              {status.error.length > 30 ? status.error.substring(0, 30) + '...' : status.error}
            </span>
          )}
        </div>
      );
    }
  };

  const renderIntegrationCard = (integration: IntegrationConfig) => {
    const isEditing = editingIntegration?.id === integration.id;
    
    return (
      <div key={integration.id} className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getIntegrationIcon(integration.type)}
            <div>
              <h3 className="text-lg font-semibold">{integration.name}</h3>
              <p className="text-sm text-gray-600">{integration.provider}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={integration.isActive}
                onChange={(e) => {
                  const updatedIntegration = { ...integration, isActive: e.target.checked };
                  handleSaveIntegration(updatedIntegration);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {isEditing ? (
            <div className="space-y-3">
              {Object.entries(integration.config).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <input
                    type={key.includes('key') || key.includes('password') ? 'password' : 'text'}
                    value={value as string}
                    onChange={(e) => {
                      const updatedConfig = { ...integration.config, [key]: e.target.value };
                      setEditingIntegration({ ...integration, config: updatedConfig });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <GlassButton
                  size="sm"
                  onClick={() => handleSaveIntegration(editingIntegration)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingIntegration(null)}
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <strong>Type:</strong> {integration.type}
                <br />
                <strong>Provider:</strong> {integration.provider}
                <br />
                <strong>Status:</strong> {integration.isActive ? 'Active' : 'Inactive'}
              </div>
              
              {getStatusDisplay(integration)}
              
              <div className="flex gap-2">
                <GlassButton
                  size="sm"
                  variant="secondary"
                  onClick={() => handleTestIntegration(integration)}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingIntegration(integration)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteIntegration(integration.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </GlassButton>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading integrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Integrations</h2>
        <GlassButton
          onClick={handleInitializeIntegrations}
          variant="secondary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Initialize Default
        </GlassButton>
      </div>

      {integrations.length === 0 ? (
        <div className="text-center py-8">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations configured</h3>
          <p className="text-gray-600 mb-4">Initialize default integrations to get started</p>
          <GlassButton onClick={handleInitializeIntegrations}>
            <Plus className="h-4 w-4 mr-2" />
            Initialize Default Integrations
          </GlassButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map(renderIntegrationCard)}
        </div>
      )}
    </div>
  );
};

export default IntegrationsManager; 