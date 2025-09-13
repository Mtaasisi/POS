import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import ShippingSettingsManager from '../components/shipping/ShippingSettingsManager';
import { 
  Settings, Save, ArrowLeft, Truck, Package 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  ShippingSettings, ShippingAgent, ShippingManager,
  ShippingAgentFormData, ShippingManagerFormData
} from '../types/inventory';

const ShippingSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Sample data - replace with actual data fetching
  const [settings, setSettings] = useState<ShippingSettings>({
    autoAssignAgents: true,
    enableTracking: true,
    enableNotifications: true,
    defaultShippingCost: 0,
    requireSignature: false,
    enableInsurance: false,
    maxShippingCost: 50000
  });

  const [agents, setAgents] = useState<ShippingAgent[]>([]);
  const [managers, setManagers] = useState<ShippingManager[]>([]);

  const handleSettingsUpdate = (updates: Partial<ShippingSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    toast.success('Settings updated successfully');
  };

  const handleAgentCreate = (agent: ShippingAgentFormData) => {
    const newAgent: ShippingAgent = {
      id: `agent_${Date.now()}`,
      ...agent,
      isActive: true
    };
    setAgents(prev => [...prev, newAgent]);
    toast.success('Agent added successfully');
  };

  const handleAgentUpdate = (id: string, updates: Partial<ShippingAgentFormData>) => {
    setAgents(prev => 
      prev.map(agent => 
        agent.id === id ? { ...agent, ...updates } : agent
      )
    );
    toast.success('Agent updated successfully');
  };

  const handleAgentDelete = (id: string) => {
    setAgents(prev => prev.filter(agent => agent.id !== id));
    toast.success('Agent deleted successfully');
  };

  const handleManagerCreate = (manager: ShippingManagerFormData) => {
    const newManager: ShippingManager = {
      id: `manager_${Date.now()}`,
      ...manager,
      isActive: true
    };
    setManagers(prev => [...prev, newManager]);
    toast.success('Manager added successfully');
  };

  const handleManagerUpdate = (id: string, updates: Partial<ShippingManagerFormData>) => {
    setManagers(prev => 
      prev.map(manager => 
        manager.id === id ? { ...manager, ...updates } : manager
      )
    );
    toast.success('Manager updated successfully');
  };

  const handleManagerDelete = (id: string) => {
    setManagers(prev => prev.filter(manager => manager.id !== id));
    toast.success('Manager deleted successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6">
        <LATSBreadcrumb 
          items={[
            { label: 'LATS', href: '/lats' },
            { label: 'Shipping Management', href: '/lats/shipping' },
            { label: 'Settings', href: '/lats/shipping/settings' }
          ]} 
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <BackButton onClick={() => navigate('/lats/shipping')} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Settings</h1>
              <p className="text-gray-600">Configure shipping preferences, agents, and managers</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <GlassButton
              onClick={() => navigate('/lats/shipping')}
              icon={<Truck size={18} />}
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              Back to Shipping
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/lats/purchase-orders')}
              icon={<Package size={18} />}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Purchase Orders
            </GlassButton>
          </div>
        </div>

        {/* Settings Content */}
        <GlassCard className="p-6">
          <ShippingSettingsManager
            settings={settings}
            agents={agents}
            managers={managers}
            onSettingsUpdate={handleSettingsUpdate}
            onAgentCreate={handleAgentCreate}
            onAgentUpdate={handleAgentUpdate}
            onAgentDelete={handleAgentDelete}
            onManagerCreate={handleManagerCreate}
            onManagerUpdate={handleManagerUpdate}
            onManagerDelete={handleManagerDelete}
          />
        </GlassCard>
      </div>
    </div>
  );
};

export default ShippingSettingsPage;
