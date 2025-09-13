// Internal Shipping Management Modal - For managing internal shipping operations
import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { X, Truck, MapPin, Calendar, User, Hash, Clock } from 'lucide-react';
import { ShippingAgent } from '../../lib/data/provider';
import supabaseProvider from '../../lib/data/provider.supabase';

interface ShippingInfo {
  expectedDelivery: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  shippingPhone: string;
  shippingContact: string;
  shippingMethod: string;
  // Internal fields only
  internalRef?: string;
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  internalStatus?: 'Pending' | 'Assigned' | 'In Transit' | 'Delivered';
  agent?: string;
  assignedDate?: string;
  pickupDate?: string;
  deliveryAttempts?: number;
  actualCost?: number;
  internalNotes?: string;
  shippingType?: string;
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureTime?: string;
  arrivalTime?: string;
  vesselName?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  departureDate?: string;
  arrivalDate?: string;
  containerNumber?: string;
}

interface ShippingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shippingInfo: ShippingInfo) => void;
  initialData?: Partial<ShippingInfo>;
}

// Shipping agents will be fetched from database

const PRIORITY_COLORS = {
  'Low': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Normal': 'bg-blue-50 text-blue-700 border-blue-200',
  'High': 'bg-amber-50 text-amber-700 border-amber-200',
  'Urgent': 'bg-red-50 text-red-700 border-red-200'
};

const STATUS_COLORS = {
  'Pending': 'bg-slate-50 text-slate-700 border-slate-200',
  'Assigned': 'bg-blue-50 text-blue-700 border-blue-200',
  'In Transit': 'bg-orange-50 text-orange-700 border-orange-200',
  'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

const ShippingInfoModal: React.FC<ShippingInfoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  // State for shipping agents
  const [shippingAgents, setShippingAgents] = useState<ShippingAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    expectedDelivery: '',
    shippingAddress: '',
    shippingCity: 'Dar es Salaam',
    shippingCountry: 'Tanzania',
    shippingPhone: '',
    shippingContact: '',
    shippingMethod: 'Standard',
    internalRef: `PO-${Date.now().toString().slice(-6)}`,
    priority: 'Normal',
    internalStatus: 'Pending',
    agent: 'AGENT_001',
    assignedDate: '',
    pickupDate: '',
    deliveryAttempts: 0,
    actualCost: 0,
    internalNotes: '',
    shippingType: undefined,
    flightNumber: '',
    departureAirport: '',
    arrivalAirport: '',
    departureTime: '',
    arrivalTime: '',
    vesselName: '',
    portOfLoading: '',
    portOfDischarge: '',
    departureDate: '',
    arrivalDate: '',
    containerNumber: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Partial<ShippingInfo>>({});
  const [currentStep, setCurrentStep] = useState<'method' | 'details'>('method');

  useEffect(() => {
    if (initialData) {
      setShippingInfo(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Reset to method selection whenever modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, resetting to method step');
      setCurrentStep('method');
      // Also reset shippingType to ensure clean start
      setShippingInfo(prev => ({ ...prev, shippingType: undefined }));
    }
  }, [isOpen]);

  // Fetch shipping agents when modal opens
  useEffect(() => {
    const fetchShippingAgents = async () => {
      if (!isOpen) return;
      
      setLoadingAgents(true);
      setAgentsError(null);
      
      try {
        const response = await supabaseProvider.getShippingAgents();
        if (response.ok && response.data) {
          setShippingAgents(response.data);
        } else {
          setAgentsError(response.message || 'Failed to load shipping agents');
        }
      } catch (error) {
        console.error('Error fetching shipping agents:', error);
        setAgentsError('Failed to load shipping agents');
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchShippingAgents();
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingInfo> = {};

    // Only require shipping method - everything else can be added later
    if (!shippingInfo.shippingType) {
      newErrors.shippingType = 'Shipping method required';
    }

    // All other fields are optional and can be filled later
    // Expected delivery, contact, agent, address - all optional for now

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(shippingInfo);
      onClose();
    }
  };

  const handleInputChange = (field: keyof ShippingInfo, value: string | number | boolean) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill agent information when agent is selected
    if (field === 'agent' && value && typeof value === 'string') {
      const selectedAgent = shippingAgents.find(agent => agent.id === value);
      if (selectedAgent) {
        // Find primary contact or first contact
        const primaryContact = selectedAgent.contacts?.find(contact => contact.isPrimary) || selectedAgent.contacts?.[0];
        
        setShippingInfo(prev => ({
          ...prev,
          agent: value as string,
          // Auto-fill contact information (prefer primary contact, fallback to agent info)
          shippingPhone: primaryContact?.phone || selectedAgent.phone || prev.shippingPhone,
          shippingContact: primaryContact?.name || selectedAgent.name || prev.shippingContact,
          // Auto-fill address information if available
          shippingAddress: selectedAgent.address || prev.shippingAddress,
          shippingCity: selectedAgent.city || prev.shippingCity,
          shippingCountry: selectedAgent.country || prev.shippingCountry,
          // Auto-fill internal notes with agent info
          internalNotes: selectedAgent.notes ? 
            `${prev.internalNotes ? prev.internalNotes + '\n' : ''}Agent: ${selectedAgent.name}${selectedAgent.company ? ` (${selectedAgent.company})` : ''}${primaryContact?.phone || selectedAgent.phone ? ` - ${primaryContact?.phone || selectedAgent.phone}` : ''}`.trim() :
            prev.internalNotes
        }));
      }
    }
    
    // Auto-set dates based on status changes
    if (field === 'internalStatus') {
      if (value === 'Assigned' && !shippingInfo.assignedDate) {
        setShippingInfo(prev => ({ ...prev, assignedDate: new Date().toISOString().split('T')[0] }));
      }
      if (value === 'In Transit' && !shippingInfo.pickupDate) {
        setShippingInfo(prev => ({ ...prev, pickupDate: new Date().toISOString().split('T')[0] }));
      }
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleMethodSelect = (type: 'Air' | 'Sea') => {
    setShippingInfo(prev => ({ ...prev, shippingType: type }));
    setCurrentStep('details');
  };

  const handleBackToMethod = () => {
    setCurrentStep('method');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {currentStep === 'method' ? 'Select Shipping Method' : 'Internal Shipping'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {currentStep === 'method' ? 'Choose how you want to ship your order' : 'Manage delivery operations'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Step 1: Shipping Method Selection */}
          {currentStep === 'method' && (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-800">Choose Shipping Method</h3>
                <p className="text-gray-600">Select how you want to ship this order</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <button
                  onClick={() => handleMethodSelect('Air')}
                  className="group p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="text-6xl mb-4">✈️</div>
                  <h4 className="text-xl font-bold text-blue-800 mb-2">Air Shipping</h4>
                  <p className="text-blue-600 text-sm">Fast delivery by air freight</p>
                  <div className="mt-4 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to select Air shipping
                  </div>
                </button>
                
                <button
                  onClick={() => handleMethodSelect('Sea')}
                  className="group p-8 bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200 rounded-2xl hover:border-cyan-400 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="text-6xl mb-4">🚢</div>
                  <h4 className="text-xl font-bold text-cyan-800 mb-2">Sea Shipping</h4>
                  <p className="text-cyan-600 text-sm">Cost-effective sea freight</p>
                  <div className="mt-4 text-xs text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to select Sea shipping
                  </div>
                </button>
              </div>
              
              {/* Manual step control for debugging */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Debug Controls:</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentStep('method')}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                  >
                    Force Method Step
                  </button>
                  <button
                    onClick={() => setCurrentStep('details')}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                  >
                    Force Details Step
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Current step: {currentStep}</p>
              </div>
            </div>
          )}

          {/* Step 2: Detailed Shipping Information */}
          {currentStep === 'details' && (
            <>
              {/* Back Button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBackToMethod}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to Method Selection</span>
                </button>
                
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                  <span className="text-sm font-medium">
                    {shippingInfo.shippingType === 'Air' ? '✈️ Air Shipping' : '🚢 Sea Shipping'}
                  </span>
                </div>
              </div>

              {/* Reference & Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-200/50 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-500 rounded-xl">
                      <Hash className="w-4 h-4 text-white" />
                    </div>
                    <label className="text-sm font-semibold text-blue-900">Reference</label>
                  </div>
                  <input
                    type="text"
                    value={shippingInfo.internalRef || ''}
                    onChange={(e) => handleInputChange('internalRef', e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-2xl border border-emerald-200/50 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-emerald-500 rounded-xl">
                      <Truck className="w-4 h-4 text-white" />
                    </div>
                    <label className="text-sm font-semibold text-emerald-900">Status</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Pending', 'Assigned', 'In Transit', 'Delivered'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleInputChange('internalStatus', status)}
                        className={`px-3 py-2 text-xs font-medium border rounded-lg transition-all duration-200 hover:scale-105 ${
                          shippingInfo.internalStatus === status
                            ? STATUS_COLORS[status] + ' shadow-md'
                            : 'bg-white/70 border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {status.replace(' ', '')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent & Priority Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-2xl border border-purple-200/50 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-500 rounded-xl">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <label className="text-sm font-semibold text-purple-900">Agent</label>
                  </div>
                  <select
                    value={shippingInfo.agent}
                    onChange={(e) => handleInputChange('agent', e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    disabled={loadingAgents}
                  >
                    {loadingAgents ? (
                      <option value="">Loading agents...</option>
                    ) : agentsError ? (
                      <option value="">Error loading agents</option>
                    ) : shippingAgents.length === 0 ? (
                      <option value="">No agents available</option>
                    ) : (
                      <>
                        <option value="">Select an agent</option>
                        {shippingAgents
                          .filter(agent => agent.isActive)
                          .map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name} {agent.company ? `(${agent.company})` : ''} - {agent.city || 'Unknown'}
                            </option>
                          ))}
                      </>
                    )}
                  </select>
                  
                  {/* Selected Agent Information */}
                  {shippingInfo.agent && (() => {
                    const selectedAgent = shippingAgents.find(agent => agent.id === shippingInfo.agent);
                    return selectedAgent ? (
                      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                        <h4 className="text-sm font-medium text-purple-900 mb-3">Agent Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-purple-800">
                          <div><strong>Name:</strong> {selectedAgent.name}</div>
                          {selectedAgent.company && <div><strong>Company:</strong> {selectedAgent.company}</div>}
                          {selectedAgent.phone && <div><strong>Phone:</strong> {selectedAgent.phone}</div>}
                          {selectedAgent.whatsapp && <div><strong>WhatsApp:</strong> {selectedAgent.whatsapp}</div>}
                          {selectedAgent.address && <div><strong>Address:</strong> {selectedAgent.address}</div>}
                          {selectedAgent.city && <div><strong>City:</strong> {selectedAgent.city}</div>}
                          {selectedAgent.pricePerCBM && <div className="bg-purple-100 p-2 rounded-lg"><strong>Price/CBM:</strong> ${selectedAgent.pricePerCBM}</div>}
                          {selectedAgent.pricePerKg && <div><strong>Price/Kg:</strong> ${selectedAgent.pricePerKg}</div>}
                          {selectedAgent.averageDeliveryTime && <div><strong>Avg Delivery:</strong> {selectedAgent.averageDeliveryTime}</div>}
                          {selectedAgent.specializations.length > 0 && (
                            <div className="md:col-span-2"><strong>Specializations:</strong> {selectedAgent.specializations.join(', ')}</div>
                          )}
                          {selectedAgent.contacts && selectedAgent.contacts.length > 0 && (
                            <div className="md:col-span-2">
                              <strong>Contacts:</strong>
                              <div className="ml-2 mt-1 space-y-1">
                                {selectedAgent.contacts.map((contact, index) => (
                                  <div key={index} className="text-xs">
                                    {contact.name} ({contact.role}) - {contact.phone}
                                    {contact.isPrimary && <span className="text-purple-600 font-medium"> - Primary</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-2xl border border-amber-200/50 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-amber-500 rounded-xl">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <label className="text-sm font-semibold text-amber-900">Priority</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Low', 'Normal', 'High', 'Urgent'] as const).map((priority) => (
                      <button
                        key={priority}
                        onClick={() => handleInputChange('priority', priority)}
                        className={`px-3 py-2 text-xs font-medium border rounded-lg transition-all duration-200 hover:scale-105 ${
                          shippingInfo.priority === priority
                            ? PRIORITY_COLORS[priority] + ' shadow-md'
                            : 'bg-white/70 border-amber-200 text-amber-700 hover:bg-amber-50'
                        }`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shipping Method Selection */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-6 rounded-2xl border border-indigo-200/50 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-indigo-500 rounded-xl">
                    <Truck className="w-4 h-4 text-white" />
                  </div>
                  <label className="text-sm font-semibold text-indigo-900">Shipping Method</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleMethodSelect('Air')}
                    className={`px-6 py-4 text-sm font-medium border-2 rounded-xl transition-all duration-200 hover:scale-105 ${
                      shippingInfo.shippingType === 'Air'
                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg'
                        : 'bg-white/70 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300'
                    }`}
                  >
                    ✈️ Air Shipping
                  </button>
                  <button
                    onClick={() => handleMethodSelect('Sea')}
                    className={`px-6 py-4 text-sm font-medium border-2 rounded-xl transition-all duration-200 hover:scale-105 ${
                      shippingInfo.shippingType === 'Sea'
                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg'
                        : 'bg-white/70 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300'
                    }`}
                  >
                    🚢 Sea Shipping
                  </button>
                </div>
                {errors.shippingType && (
                  <p className="text-red-500 text-xs mt-2">{errors.shippingType}</p>
                )}
              </div>

              {/* Air Shipping Info */}
              {shippingInfo.shippingType === 'Air' && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-200/50 shadow-sm">
                  <h3 className="text-lg font-semibold text-blue-800 mb-6 flex items-center">
                    ✈️ Air Shipping Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-3">Flight Number <span className="text-gray-500 text-xs">(Optional - can be added later)</span></label>
                      <input
                        type="text"
                        value={shippingInfo.flightNumber || ''}
                        onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                        placeholder="Will be provided later"
                        className={`w-full px-4 py-3 bg-white/70 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.flightNumber ? 'border-red-300' : 'border-blue-200'
                        }`}
                      />
                      {errors.flightNumber && (
                        <p className="text-red-500 text-xs mt-2">{errors.flightNumber}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-3">Departure Airport <span className="text-gray-500 text-xs">(Optional - can be added later)</span></label>
                      <input
                        type="text"
                        value={shippingInfo.departureAirport || ''}
                        onChange={(e) => handleInputChange('departureAirport', e.target.value)}
                        placeholder="Will be provided later"
                        className={`w-full px-4 py-3 bg-white/70 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.departureAirport ? 'border-red-300' : 'border-blue-200'
                        }`}
                      />
                      {errors.departureAirport && (
                        <p className="text-red-500 text-xs mt-2">{errors.departureAirport}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-3">Arrival Airport <span className="text-gray-500 text-xs">(Optional - can be added later)</span></label>
                      <input
                        type="text"
                        value={shippingInfo.arrivalAirport || ''}
                        onChange={(e) => handleInputChange('arrivalAirport', e.target.value)}
                        placeholder="Will be provided later"
                        className={`w-full px-4 py-3 bg-white/70 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.arrivalAirport ? 'border-red-300' : 'border-blue-200'
                        }`}
                      />
                      {errors.arrivalAirport && (
                        <p className="text-red-500 text-xs mt-2">{errors.arrivalAirport}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-3">Departure Date</label>
                      <input
                        type="date"
                        value={shippingInfo.departureDate || ''}
                        onChange={(e) => handleInputChange('departureDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-white/70 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-3">Departure Time</label>
                      <input
                        type="time"
                        value={shippingInfo.departureTime || ''}
                        onChange={(e) => handleInputChange('departureTime', e.target.value)}
                        className="w-full px-4 py-3 bg-white/70 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-3">Arrival Time</label>
                      <input
                        type="time"
                        value={shippingInfo.arrivalTime || ''}
                        onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
                        className="w-full px-4 py-3 bg-white/70 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sea Shipping Info */}
              {shippingInfo.shippingType === 'Sea' && (
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-6 rounded-2xl border border-cyan-200/50 shadow-sm">
                  <h3 className="text-lg font-semibold text-cyan-800 mb-6 flex items-center">
                    🚢 Sea Shipping Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-cyan-700 mb-3">Vessel Name <span className="text-gray-500 text-xs">(Optional - can be added later)</span></label>
                      <input
                        type="text"
                        value={shippingInfo.vesselName || ''}
                        onChange={(e) => handleInputChange('vesselName', e.target.value)}
                        placeholder="Will be provided later"
                        className={`w-full px-4 py-3 bg-white/70 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 ${
                          errors.vesselName ? 'border-red-300' : 'border-cyan-200'
                        }`}
                      />
                      {errors.vesselName && (
                        <p className="text-red-500 text-xs mt-2">{errors.vesselName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-cyan-700 mb-3">Port of Loading <span className="text-gray-500 text-xs">(Optional - can be added later)</span></label>
                      <input
                        type="text"
                        value={shippingInfo.portOfLoading || ''}
                        onChange={(e) => handleInputChange('portOfLoading', e.target.value)}
                        placeholder="Will be provided later"
                        className={`w-full px-4 py-3 bg-white/70 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 ${
                          errors.portOfLoading ? 'border-red-300' : 'border-cyan-200'
                        }`}
                      />
                      {errors.portOfLoading && (
                        <p className="text-red-500 text-xs mt-2">{errors.portOfLoading}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-cyan-700 mb-3">Port of Discharge <span className="text-gray-500 text-xs">(Optional - can be added later)</span></label>
                      <input
                        type="text"
                        value={shippingInfo.portOfDischarge || ''}
                        onChange={(e) => handleInputChange('portOfDischarge', e.target.value)}
                        placeholder="Will be provided later"
                        className={`w-full px-4 py-3 bg-white/70 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 ${
                          errors.portOfDischarge ? 'border-red-300' : 'border-cyan-200'
                        }`}
                      />
                      {errors.portOfDischarge && (
                        <p className="text-red-500 text-xs mt-2">{errors.portOfDischarge}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-cyan-700 mb-3">Departure Date</label>
                      <input
                        type="date"
                        value={shippingInfo.departureDate || ''}
                        onChange={(e) => handleInputChange('departureDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-white/70 border border-cyan-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-cyan-700 mb-3">Arrival Date</label>
                      <input
                        type="date"
                        value={shippingInfo.arrivalDate || ''}
                        onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-white/70 border border-cyan-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-cyan-700 mb-3">Container Number</label>
                      <input
                        type="text"
                        value={shippingInfo.containerNumber || ''}
                        onChange={(e) => handleInputChange('containerNumber', e.target.value)}
                        placeholder="e.g., MSCU1234567"
                        className="w-full px-4 py-3 bg-white/70 border border-cyan-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-8 rounded-2xl border border-gray-200/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <Calendar className="w-5 h-5 mr-3 text-orange-500" />
                  Delivery Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Delivery Date</label>
                    <input
                      type="date"
                      value={shippingInfo.expectedDelivery}
                      onChange={(e) => handleInputChange('expectedDelivery', e.target.value)}
                      className={`w-full px-4 py-3 bg-white/70 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.expectedDelivery ? 'border-red-300' : 'border-gray-200'
                      }`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.expectedDelivery && (
                      <p className="text-red-500 text-xs mt-2">{errors.expectedDelivery}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Method</label>
                    <select
                      value={shippingInfo.shippingMethod}
                      onChange={(e) => handleInputChange('shippingMethod', e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    >
                      {['Standard', 'Express', 'Same Day', 'Pickup'].map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Cost (TZS)</label>
                    <input
                      type="number"
                      value={shippingInfo.actualCost || ''}
                      onChange={(e) => handleInputChange('actualCost', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Address & Contact */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Delivery Address - Hidden as it's auto-filled from agent */}
                {!shippingInfo.agent && (
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-6 rounded-2xl border border-indigo-200/50 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <MapPin className="w-5 h-5 mr-3 text-indigo-500" />
                      Delivery Address <span className="text-gray-500 text-xs ml-2">(Optional - can be added later)</span>
                    </h3>
                    <textarea
                      value={shippingInfo.shippingAddress}
                      onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                      placeholder="Will be provided later"
                      rows={3}
                      className={`w-full px-4 py-3 bg-white/70 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none ${
                        errors.shippingAddress ? 'border-red-300' : 'border-indigo-200'
                      }`}
                    />
                    {errors.shippingAddress && (
                      <p className="text-red-500 text-xs mt-2">{errors.shippingAddress}</p>
                    )}
                  </div>
                )}

                {/* Contact & Tracking - Hidden as it's auto-filled from agent */}
                {!shippingInfo.agent && (
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-6 rounded-2xl border border-rose-200/50 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-3 text-rose-500" />
                      Contact & Tracking
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
                        <input
                          type="text"
                          value={shippingInfo.shippingContact}
                          onChange={(e) => handleInputChange('shippingContact', e.target.value)}
                          placeholder="Contact person name"
                          className={`w-full px-4 py-3 bg-white/70 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 ${
                            errors.shippingContact ? 'border-red-300' : 'border-rose-200'
                          }`}
                        />
                        {errors.shippingContact && (
                          <p className="text-red-500 text-xs mt-2">{errors.shippingContact}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                          <input
                            type="tel"
                            value={shippingInfo.shippingPhone}
                            onChange={(e) => handleInputChange('shippingPhone', e.target.value)}
                            placeholder="Phone number"
                            className="w-full px-4 py-3 bg-white/70 border border-rose-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Attempts</label>
                          <input
                            type="number"
                            value={shippingInfo.deliveryAttempts || ''}
                            onChange={(e) => handleInputChange('deliveryAttempts', parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-full px-4 py-3 bg-white/70 border border-rose-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-2xl border border-slate-200/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-3 text-slate-500" />
                  Internal Notes
                </h3>
                <textarea
                  value={shippingInfo.internalNotes || ''}
                  onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                  placeholder="Add internal notes, special instructions, or any issues that need attention..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-100">
          {currentStep === 'method' && (
            <GlassButton
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm py-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Cancel
            </GlassButton>
          )}
          {currentStep === 'details' && (
            <>
              <GlassButton
                onClick={handleBackToMethod}
                className="flex-1 bg-gray-200 text-gray-700 text-sm py-4 rounded-xl hover:bg-gray-300 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Back to Method Selection
              </GlassButton>
              <GlassButton
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm py-4 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Save Shipping Info
              </GlassButton>
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default ShippingInfoModal;