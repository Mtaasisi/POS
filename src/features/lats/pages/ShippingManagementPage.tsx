import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  Truck, Package, Users, Building, Settings, BarChart3, 
  Search, Filter, RefreshCw, Plus, AlertTriangle, CheckCircle,
  Clock, TrendingUp, Eye, MapPin, Phone, Mail
} from 'lucide-react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import ShippingTracker from '../components/shipping/ShippingTracker';
import ShippingSettingsManager from '../components/shipping/ShippingSettingsManager';
import { 
  ShippingInfo, ShippingAgent, ShippingManager, ShippingCarrier, 
  ShippingSettings, PurchaseOrder 
} from '../types/inventory';
import { toast } from 'react-hot-toast';

const ShippingManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [selectedShipping, setSelectedShipping] = useState<ShippingInfo | null>(null);
  
  // Data states (would be connected to actual store/API)
  const [shipments, setShipments] = useState<ShippingInfo[]>([]);
  const [agents, setAgents] = useState<ShippingAgent[]>([]);
  const [managers, setManagers] = useState<ShippingManager[]>([]);
  const [carriers, setCarriers] = useState<ShippingCarrier[]>([]);
  const [settings, setSettings] = useState<ShippingSettings>({
    id: '',
    autoAssignAgents: true,
    defaultCarrierId: '',
    enableTracking: true,
    enableNotifications: true,
    notificationChannels: ['email', 'sms'],
    trackingUpdateInterval: 60,
    defaultShippingCost: 5000,
    autoUpdateStatus: true,
    requireSignature: false,
    enableInsurance: false,
    maxShippingCost: 50000,
    createdAt: '',
    updatedAt: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    loadShippingData();
  }, []);

  const loadShippingData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API responses
      setShipments([
        {
          id: '1',
          purchaseOrderId: 'po-1',
          carrierId: 'dhl-1',
          trackingNumber: 'DHL1234567890',
          agentId: 'agent-1',
          managerId: 'manager-1',
          status: 'in_transit',
          estimatedDelivery: '2025-01-30',
          cost: 15000,
          trackingEvents: [
            {
              id: '1',
              shippingId: '1',
              status: 'picked_up',
              description: 'Package picked up from supplier',
              location: 'Dar es Salaam, Tanzania',
              timestamp: '2025-01-27T10:00:00Z'
            },
            {
              id: '2',
              shippingId: '1',
              status: 'in_transit',
              description: 'Package in transit to destination',
              location: 'Mwanza, Tanzania',
              timestamp: '2025-01-28T14:30:00Z'
            }
          ],
          carrier: {
            id: 'dhl-1',
            name: 'DHL Tanzania',
            code: 'DHL',
            trackingUrl: 'https://www.dhl.com/tz-en/home/tracking.html?tracking-id={tracking_number}',
            isActive: true,
            supportedServices: ['Express', 'Standard'],
            contactInfo: { phone: '+255 22 211 8000', email: 'info@dhl.co.tz' },
            createdAt: '',
            updatedAt: ''
          },
          agent: {
            id: 'agent-1',
            name: 'John Mwalimu',
            email: 'john@dhl.co.tz',
            phone: '+255 700 123 456',
            company: 'DHL Tanzania',
            isActive: true,
            managerId: 'manager-1',
            createdAt: '',
            updatedAt: ''
          },
          manager: {
            id: 'manager-1',
            name: 'Sarah Kimaro',
            email: 'sarah.kimaro@dhl.co.tz',
            phone: '+255 700 987 654',
            department: 'Logistics Operations',
            agents: ['agent-1'],
            isActive: true,
            createdAt: '',
            updatedAt: ''
          },
          createdAt: '2025-01-27T09:00:00Z',
          updatedAt: '2025-01-28T14:30:00Z'
        }
      ]);

      setCarriers([
        {
          id: 'dhl-1',
          name: 'DHL Tanzania',
          code: 'DHL',
          trackingUrl: 'https://www.dhl.com/tz-en/home/tracking.html?tracking-id={tracking_number}',
          isActive: true,
          supportedServices: ['Express', 'Standard', 'Same Day'],
          contactInfo: { 
            phone: '+255 22 211 8000', 
            email: 'info@dhl.co.tz',
            website: 'https://www.dhl.com/tz-en'
          },
          createdAt: '',
          updatedAt: ''
        }
      ]);

      setSettings(prev => ({ ...prev, defaultCarrierId: 'dhl-1' }));
      
    } catch (error) {
      toast.error('Failed to load shipping data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = !searchQuery || 
      shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.agent?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.carrier?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !['delivered', 'cancelled'].includes(shipment.status)) ||
      (statusFilter === 'delivered' && shipment.status === 'delivered');
    
    return matchesSearch && matchesStatus;
  });

  const getStatusStats = () => {
    const stats = {
      total: shipments.length,
      pending: shipments.filter(s => s.status === 'pending').length,
      inTransit: shipments.filter(s => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length,
      delivered: shipments.filter(s => s.status === 'delivered').length,
      exceptions: shipments.filter(s => s.status === 'exception').length
    };
    return stats;
  };

  const stats = getStatusStats();

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Shipments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package size={24} className="text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-purple-600">{stats.inTransit}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Truck size={24} className="text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Exceptions</p>
              <p className="text-2xl font-bold text-red-600">{stats.exceptions}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassButton
            onClick={() => navigate('/lats/purchase-orders')}
            className="flex items-center gap-3 p-4 justify-start"
          >
            <Package size={20} />
            <div className="text-left">
              <p className="font-medium">View Purchase Orders</p>
              <p className="text-sm text-gray-600">Manage pending orders</p>
            </div>
          </GlassButton>
          
          <GlassButton
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-3 p-4 justify-start"
          >
            <Settings size={20} />
            <div className="text-left">
              <p className="font-medium">Shipping Settings</p>
              <p className="text-sm text-gray-600">Configure shipping options</p>
            </div>
          </GlassButton>
          
          <GlassButton
            onClick={loadShippingData}
            className="flex items-center gap-3 p-4 justify-start"
          >
            <RefreshCw size={20} />
            <div className="text-left">
              <p className="font-medium">Refresh Data</p>
              <p className="text-sm text-gray-600">Update tracking info</p>
            </div>
          </GlassButton>
        </div>
      </GlassCard>

      {/* Active Shipments */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Active Shipments</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search shipments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredShipments.length === 0 ? (
            <div className="text-center py-12">
              <Truck size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-2">No shipments found</p>
              <p className="text-sm text-gray-500">Create purchase orders to start tracking shipments</p>
            </div>
          ) : (
            filteredShipments.map(shipment => (
              <ShippingTracker
                key={shipment.id}
                shippingInfo={shipment}
                onRefresh={loadShippingData}
                compact={true}
              />
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );

  const renderTrackingTab = () => (
    <div className="space-y-6">
      {selectedShipping ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Shipment Details</h3>
            <GlassButton
              onClick={() => setSelectedShipping(null)}
              variant="outline"
            >
              Back to List
            </GlassButton>
          </div>
          <ShippingTracker
            shippingInfo={selectedShipping}
            onRefresh={loadShippingData}
            compact={false}
          />
        </div>
      ) : (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Shipment to Track</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shipments.map(shipment => (
              <div
                key={shipment.id}
                onClick={() => setSelectedShipping(shipment)}
                className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer bg-white"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {shipment.trackingNumber}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    shipment.status === 'exception' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {shipment.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Truck size={14} />
                    <span>{shipment.carrier?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span>{shipment.agent?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>ETA: {new Date(shipment.estimatedDelivery).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );

  const handleSettingsUpdate = (updatedSettings: Partial<ShippingSettings>) => {
    setSettings(prev => ({ ...prev, ...updatedSettings }));
    toast.success('Settings updated successfully');
  };

  const handleAgentCreate = (agentData: any) => {
    const newAgent: ShippingAgent = {
      id: Date.now().toString(),
      ...agentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setAgents(prev => [...prev, newAgent]);
  };

  const handleAgentUpdate = (id: string, agentData: any) => {
    setAgents(prev => prev.map(agent => 
      agent.id === id ? { ...agent, ...agentData, updatedAt: new Date().toISOString() } : agent
    ));
  };

  const handleAgentDelete = (id: string) => {
    setAgents(prev => prev.filter(agent => agent.id !== id));
  };

  const handleManagerCreate = (managerData: any) => {
    const newManager: ShippingManager = {
      id: Date.now().toString(),
      ...managerData,
      agents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setManagers(prev => [...prev, newManager]);
  };

  const handleManagerUpdate = (id: string, managerData: any) => {
    setManagers(prev => prev.map(manager => 
      manager.id === id ? { ...manager, ...managerData, updatedAt: new Date().toISOString() } : manager
    ));
  };

  const handleManagerDelete = (id: string) => {
    setManagers(prev => prev.filter(manager => manager.id !== id));
  };

  const handleCarrierCreate = (carrierData: any) => {
    const newCarrier: ShippingCarrier = {
      id: Date.now().toString(),
      ...carrierData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCarriers(prev => [...prev, newCarrier]);
  };

  const handleCarrierUpdate = (id: string, carrierData: any) => {
    setCarriers(prev => prev.map(carrier => 
      carrier.id === id ? { ...carrier, ...carrierData, updatedAt: new Date().toISOString() } : carrier
    ));
  };

  const handleCarrierDelete = (id: string) => {
    setCarriers(prev => prev.filter(carrier => carrier.id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading shipping data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6">
        <LATSBreadcrumb 
          items={[
            { label: 'LATS', href: '/lats' },
            { label: 'Shipping Management', href: '/lats/shipping' }
          ]} 
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Management</h1>
            <p className="text-gray-600">Track and manage all your shipping operations</p>
          </div>
          
          <div className="flex gap-2">
            <GlassButton
              onClick={loadShippingData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </GlassButton>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'tracking', label: 'Track Shipments', icon: MapPin },
              { key: 'settings', label: 'Settings', icon: Settings }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
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
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'tracking' && renderTrackingTab()}
          {activeTab === 'settings' && (
            <ShippingSettingsManager
              settings={settings}
              agents={agents}
              managers={managers}
              carriers={carriers}
              onSettingsUpdate={handleSettingsUpdate}
              onAgentCreate={handleAgentCreate}
              onAgentUpdate={handleAgentUpdate}
              onAgentDelete={handleAgentDelete}
              onManagerCreate={handleManagerCreate}
              onManagerUpdate={handleManagerUpdate}
              onManagerDelete={handleManagerDelete}
              onCarrierCreate={handleCarrierCreate}
              onCarrierUpdate={handleCarrierUpdate}
              onCarrierDelete={handleCarrierDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippingManagementPage;