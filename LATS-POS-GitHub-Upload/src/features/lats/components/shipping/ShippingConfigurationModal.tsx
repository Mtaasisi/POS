import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { X, Plane, Ship, Truck, MapPin, Calendar, User, Hash, Clock, Package, Plus, Trash2 } from 'lucide-react';
import { ShippingAgent } from '../../lib/data/provider';
import supabaseProvider from '../../lib/data/provider.supabase';

interface ShippingConfiguration {
  shippingMethod: 'air' | 'sea' | 'standard';
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  shippingContact: string;
  shippingNotes: string;
  trackingNumber: string;
  estimatedCost: number;
  carrier: string;
  requireSignature: boolean;
  enableInsurance: boolean;
  insuranceValue: number;
  
  // Air shipping specific fields
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureTime?: string;
  arrivalTime?: string;
  
  // Sea shipping specific fields
  portOfLoading?: string;
  portOfDischarge?: string;
  departureDate?: string;
  arrivalDate?: string;
  invoiceNumber?: string;
  selectedAgent?: string;
  
  // CBM calculation fields
  cargoHeight?: number;
  cargoWidth?: number;
  cargoLength?: number;
  cargoWeight?: number;
  calculatedCBM?: number;
  pricePerCBM?: number;
  totalCBMCost?: number;
  
  // Multiple boxes support
  cargoBoxes?: Array<{
    id: string;
    length: number;
    width: number;
    height: number;
    weight: number;
    cbm: number;
  }>;
  
  // Local shipping specific fields
  originLocation?: string;
  destinationLocation?: string;
  transportCompany?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  pickupDate?: string;
  deliveryDate?: string;
  localShippingCost?: number;
}

interface ShippingConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shippingConfig: ShippingConfiguration) => void;
  initialData?: Partial<ShippingConfiguration>;
  // Exchange rate information for currency conversion
  exchangeRate?: number;
  baseCurrency?: string;
  purchaseOrderCurrency?: string;
}

const ShippingConfigurationModal: React.FC<ShippingConfigurationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  exchangeRate = 1.0,
  baseCurrency = 'TZS',
  purchaseOrderCurrency = 'TZS'
}) => {
  const [step, setStep] = useState<'method' | 'details'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'air' | 'sea' | 'standard'>('standard');
  
  // State for shipping agents
  const [shippingAgents, setShippingAgents] = useState<ShippingAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  
  const [shippingConfig, setShippingConfig] = useState<ShippingConfiguration>({
    shippingMethod: 'standard',
    shippingAddress: '',
    shippingCity: 'Dar es Salaam',
    shippingCountry: 'Tanzania',
    shippingContact: '',
    shippingNotes: '',
    trackingNumber: '',
    estimatedCost: 0,
    carrier: 'DHL',
    requireSignature: false,
    enableInsurance: false,
    insuranceValue: 0,
    ...initialData
  });

  const [errors, setErrors] = useState<Partial<ShippingConfiguration>>({});

  // CBM calculation function
  const calculateCBM = (length: number, width: number, height: number): number => {
    return length * width * height; // CBM = Length (m) x Width (m) x Height (m)
  };

  // Calculate total CBM cost
  const calculateTotalCBMCost = (cbm: number, pricePerCBM: number): number => {
    return cbm * pricePerCBM;
  };

  // Convert CBM cost from USD to TZS using exchange rate
  const convertCBMCostToTZS = (usdCost: number): number => {
    return usdCost * exchangeRate;
  };

  // Add new cargo box
  const addCargoBox = () => {
    const newBox = {
      id: `box-${Date.now()}`,
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      cbm: 0
    };
    
    setShippingConfig(prev => ({
      ...prev,
      cargoBoxes: [...(prev.cargoBoxes || []), newBox],
      totalCBMCost: 0 // Reset total cost when new box is created
    }));
  };

  // Remove cargo box
  const removeCargoBox = (boxId: string) => {
    setShippingConfig(prev => ({
      ...prev,
      cargoBoxes: prev.cargoBoxes?.filter(box => box.id !== boxId) || []
    }));
  };

  // Update cargo box dimensions
  const updateCargoBox = (boxId: string, field: string, value: number) => {
    setShippingConfig(prev => ({
      ...prev,
      cargoBoxes: prev.cargoBoxes?.map(box => {
        if (box.id === boxId) {
          const updatedBox = { ...box, [field]: value };
          // Recalculate CBM for this box
          if (field === 'length' || field === 'width' || field === 'height') {
            updatedBox.cbm = calculateCBM(updatedBox.length, updatedBox.width, updatedBox.height);
          }
          return updatedBox;
        }
        return box;
      }) || []
    }));
  };

  // Calculate total CBM from all boxes
  const getTotalCBM = (): number => {
    if (!shippingConfig.cargoBoxes || shippingConfig.cargoBoxes.length === 0) {
      return shippingConfig.calculatedCBM || 0;
    }
    return shippingConfig.cargoBoxes.reduce((total, box) => total + box.cbm, 0);
  };

  // Update CBM calculations when dimensions change (legacy single box support)
  useEffect(() => {
    if (shippingConfig.cargoLength && shippingConfig.cargoWidth && shippingConfig.cargoHeight) {
      const cbm = calculateCBM(shippingConfig.cargoLength, shippingConfig.cargoWidth, shippingConfig.cargoHeight);
      setShippingConfig(prev => ({ ...prev, calculatedCBM: cbm }));
      
      if (shippingConfig.pricePerCBM) {
        const totalCost = calculateTotalCBMCost(cbm, shippingConfig.pricePerCBM);
        setShippingConfig(prev => ({ ...prev, totalCBMCost: totalCost }));
      }
    }
  }, [shippingConfig.cargoLength, shippingConfig.cargoWidth, shippingConfig.cargoHeight, shippingConfig.pricePerCBM]);

  // Update total CBM cost when boxes or price per CBM changes
  useEffect(() => {
    const totalCBM = getTotalCBM();
    if (shippingConfig.pricePerCBM && totalCBM > 0) {
      const totalCost = calculateTotalCBMCost(totalCBM, shippingConfig.pricePerCBM);
      setShippingConfig(prev => ({ ...prev, totalCBMCost: totalCost }));
    }
  }, [shippingConfig.cargoBoxes, shippingConfig.pricePerCBM]);

  useEffect(() => {
    if (initialData) {
      setShippingConfig(prev => ({ ...prev, ...initialData }));
      // Always start with method selection step for better UX
      setStep('method');
      // Don't auto-advance to details even if shippingMethod exists
    }
  }, [initialData]);

  // Reset to method selection whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setErrors({});
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

  const handleMethodSelect = (method: 'air' | 'sea' | 'standard') => {
    setSelectedMethod(method);
    setShippingConfig(prev => ({ ...prev, shippingMethod: method }));
    setStep('details');
  };

  const handleFieldChange = (field: keyof ShippingConfiguration, value: any) => {
    setShippingConfig(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill agent information when agent is selected
    if (field === 'selectedAgent' && value) {
      const selectedAgent = shippingAgents.find(agent => agent.id === value);
      if (selectedAgent) {
        // Find primary contact or first contact
        const primaryContact = selectedAgent.contacts?.find(contact => contact.isPrimary) || selectedAgent.contacts?.[0];
        
        setShippingConfig(prev => ({
          ...prev,
          [field]: value,
          // Auto-fill contact information (prefer primary contact, fallback to agent info)
          shippingContact: primaryContact?.name || selectedAgent.name || prev.shippingContact,
          // Auto-fill address information if available
          shippingAddress: selectedAgent.address || prev.shippingAddress,
          shippingCity: selectedAgent.city || prev.shippingCity,
          shippingCountry: selectedAgent.country || prev.shippingCountry,
          // Auto-fill pricing information if available
          pricePerCBM: selectedAgent.pricePerCBM || prev.pricePerCBM,
          pricePerKg: selectedAgent.pricePerKg || prev.pricePerKg,
          // Auto-fill notes with agent information
          shippingNotes: selectedAgent.notes ? 
            `${prev.shippingNotes ? prev.shippingNotes + '\n' : ''}Agent: ${selectedAgent.name}${selectedAgent.company ? ` (${selectedAgent.company})` : ''}${primaryContact?.phone || selectedAgent.phone ? ` - ${primaryContact?.phone || selectedAgent.phone}` : ''}`.trim() :
            prev.shippingNotes
        }));
      }
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingConfiguration> = {};

    // Only validate essential fields - everything else can be added later
    // Just ensure cost is not negative if provided
    if (shippingConfig.estimatedCost < 0) newErrors.estimatedCost = 'Cost cannot be negative';
    if (shippingConfig.localShippingCost && shippingConfig.localShippingCost < 0) {
      newErrors.localShippingCost = 'Local shipping cost cannot be negative';
    }

    // All other fields are optional and can be filled later

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(shippingConfig);
      onClose();
    }
  };

  const handleBack = () => {
    setStep('method');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <GlassCard 
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-end mb-6">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>



          {step === 'method' ? (
            /* Step 1: Shipping Method Selection */
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Choose Your Shipping Method</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Standard Shipping */}
                <div
                  onClick={() => handleMethodSelect('standard')}
                  className={`p-8 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    selectedMethod === 'standard'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      selectedMethod === 'standard' ? 'bg-blue-500 shadow-lg' : 'bg-gray-100'
                    }`}>
                      <Truck size={40} className={selectedMethod === 'standard' ? 'text-white' : 'text-gray-600'} />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Local Shipping</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <Clock size={16} className="text-gray-500" />
                        <span className="text-gray-600">5-7 business days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Air Shipping */}
                <div
                  onClick={() => handleMethodSelect('air')}
                  className={`p-8 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    selectedMethod === 'air'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      selectedMethod === 'air' ? 'bg-blue-500 shadow-lg' : 'bg-gray-100'
                    }`}>
                      <Plane size={40} className={selectedMethod === 'air' ? 'text-white' : 'text-gray-600'} />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Air Freight</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <Clock size={16} className="text-gray-500" />
                        <span className="text-gray-600">2-3 business days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sea Shipping */}
                <div
                  onClick={() => handleMethodSelect('sea')}
                  className={`p-8 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    selectedMethod === 'sea'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      selectedMethod === 'sea' ? 'bg-blue-500 shadow-lg' : 'bg-gray-100'
                    }`}>
                      <Ship size={40} className={selectedMethod === 'sea' ? 'text-white' : 'text-gray-600'} />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Sea Freight</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <Clock size={16} className="text-gray-500" />
                        <span className="text-gray-600">15-30 business days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Help Text */}
              <div className="text-center text-gray-500 text-sm">
                <p>Click on a shipping method to continue with configuration</p>
              </div>


            </div>
          ) : (
            /* Step 2: Shipping Details */
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Shipping Details</h3>
                  <p className="text-gray-600">
                    {selectedMethod === 'air' && 'Configure air freight details'}
                    {selectedMethod === 'sea' && 'Configure sea freight details'}
                    {selectedMethod === 'standard' && 'Configure standard shipping details'}
                  </p>
                </div>
                <button
                  onClick={handleBack}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Back to method selection
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Shipping Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Basic Information</h4>
                  
                  {/* Shipping Address and Contact - Hidden as they're auto-filled from agent */}
                  {!shippingConfig.selectedAgent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shipping Address <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                        </label>
                        <input
                          type="text"
                          value={shippingConfig.shippingAddress}
                          onChange={(e) => handleFieldChange('shippingAddress', e.target.value)}
                          placeholder="Will be provided later"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.shippingAddress ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.shippingAddress && (
                          <p className="text-red-500 text-xs mt-1">{errors.shippingAddress}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shipping Contact <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                        </label>
                        <input
                          type="text"
                          value={shippingConfig.shippingContact}
                          onChange={(e) => handleFieldChange('shippingContact', e.target.value)}
                          placeholder="Enter contact person name"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.shippingContact ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.shippingContact && (
                          <p className="text-red-500 text-xs mt-1">{errors.shippingContact}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Method-Specific Information */}
                {selectedMethod === 'sea' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 border-b pb-2">Sea Freight Details</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Agent Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shipping Agent <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                        </label>
                        <select
                          value={shippingConfig.selectedAgent || ''}
                          onChange={(e) => handleFieldChange('selectedAgent', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.selectedAgent ? 'border-red-500' : 'border-gray-300'
                          }`}
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
                              <option value="">Select shipping agent</option>
                              {shippingAgents
                                .filter(agent => agent.isActive && agent.supportedShippingTypes.includes('sea'))
                                .map((agent) => (
                                  <option key={agent.id} value={agent.id}>
                                    {agent.name} {agent.company ? `(${agent.company})` : ''} - {agent.city || 'Unknown'}
                                  </option>
                                ))}
                            </>
                          )}
                        </select>
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => window.open('/lats/shipping/agents', '_blank')}
                            className="text-xs text-blue-600 hover:text-blue-700 underline"
                          >
                            Manage shipping agents →
                          </button>
                        </div>
                        {errors.selectedAgent && (
                          <p className="text-red-500 text-xs mt-1">{errors.selectedAgent}</p>
                        )}
                        
                        {/* Selected Agent Information */}
                        {shippingConfig.selectedAgent && (() => {
                          const selectedAgent = shippingAgents.find(agent => agent.id === shippingConfig.selectedAgent);
                          return selectedAgent ? (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="text-sm font-medium text-blue-900 mb-2">Agent Details</h4>
                              <div className="space-y-1 text-xs text-blue-800">
                                <div><strong>Name:</strong> {selectedAgent.name}</div>
                                {selectedAgent.company && <div><strong>Company:</strong> {selectedAgent.company}</div>}
                                {selectedAgent.phone && <div><strong>Phone:</strong> {selectedAgent.phone}</div>}
                                {selectedAgent.whatsapp && <div><strong>WhatsApp:</strong> {selectedAgent.whatsapp}</div>}
                                {selectedAgent.address && <div><strong>Address:</strong> {selectedAgent.address}</div>}
                                {selectedAgent.city && <div><strong>City:</strong> {selectedAgent.city}</div>}
                                {selectedAgent.pricePerCBM && <div className="bg-blue-100 p-2 rounded-lg"><strong>Price/CBM:</strong> ${selectedAgent.pricePerCBM}</div>}
                                {selectedAgent.pricePerKg && <div><strong>Price/Kg:</strong> ${selectedAgent.pricePerKg}</div>}
                                {selectedAgent.averageDeliveryTime && <div><strong>Avg Delivery:</strong> {selectedAgent.averageDeliveryTime}</div>}
                                {selectedAgent.specializations.length > 0 && (
                                  <div><strong>Specializations:</strong> {selectedAgent.specializations.join(', ')}</div>
                                )}
                                {selectedAgent.contacts && selectedAgent.contacts.length > 0 && (
                                  <div>
                                    <strong>Contacts:</strong>
                                    <div className="ml-2 mt-1 space-y-1">
                                      {selectedAgent.contacts.map((contact, index) => (
                                        <div key={index} className="text-xs">
                                          {contact.name} ({contact.role}) - {contact.phone}
                                          {contact.isPrimary && <span className="text-blue-600 font-medium"> - Primary</span>}
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Invoice Number <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                        </label>
                        <input
                          type="text"
                          value={shippingConfig.invoiceNumber || ''}
                          onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                          placeholder="Will be provided later"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Port of Loading <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                        </label>
                        <input
                          type="text"
                          value={shippingConfig.portOfLoading || ''}
                          onChange={(e) => handleFieldChange('portOfLoading', e.target.value)}
                          placeholder="e.g., Shanghai"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.portOfLoading ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.portOfLoading && (
                          <p className="text-red-500 text-xs mt-1">{errors.portOfLoading}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Port of Discharge <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                        </label>
                        <input
                          type="text"
                          value={shippingConfig.portOfDischarge || ''}
                          onChange={(e) => handleFieldChange('portOfDischarge', e.target.value)}
                          placeholder="e.g., Dar es Salaam"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.portOfDischarge ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.portOfDischarge && (
                          <p className="text-red-500 text-xs mt-1">{errors.portOfDischarge}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Departure Date <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                        </label>
                        <input
                          type="date"
                          value={shippingConfig.departureDate || ''}
                          onChange={(e) => handleFieldChange('departureDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Arrival Date <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                        </label>
                        <input
                          type="date"
                          value={shippingConfig.arrivalDate || ''}
                          onChange={(e) => handleFieldChange('arrivalDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Other shipping methods */}
                {(selectedMethod === 'air' || selectedMethod === 'standard') && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 border-b pb-2">
                      {selectedMethod === 'air' && 'Air Freight Details'}
                      {selectedMethod === 'standard' && 'Local Shipping Details'}
                    </h4>

                  {selectedMethod === 'air' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Flight Number <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                        </label>
                        <input
                          type="text"
                          value={shippingConfig.flightNumber || ''}
                          onChange={(e) => handleFieldChange('flightNumber', e.target.value)}
                          placeholder="Enter flight number"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.flightNumber ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.flightNumber && (
                          <p className="text-red-500 text-xs mt-1">{errors.flightNumber}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Departure Airport <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                          </label>
                          <input
                            type="text"
                            value={shippingConfig.departureAirport || ''}
                            onChange={(e) => handleFieldChange('departureAirport', e.target.value)}
                            placeholder="e.g., JRO"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.departureAirport ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.departureAirport && (
                            <p className="text-red-500 text-xs mt-1">{errors.departureAirport}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Arrival Airport <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                          </label>
                          <input
                            type="text"
                            value={shippingConfig.arrivalAirport || ''}
                            onChange={(e) => handleFieldChange('arrivalAirport', e.target.value)}
                            placeholder="e.g., DAR"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.arrivalAirport ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.arrivalAirport && (
                            <p className="text-red-500 text-xs mt-1">{errors.arrivalAirport}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Departure Time
                          </label>
                          <input
                            type="time"
                            value={shippingConfig.departureTime || ''}
                            onChange={(e) => handleFieldChange('departureTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Arrival Time
                          </label>
                          <input
                            type="time"
                            value={shippingConfig.arrivalTime || ''}
                            onChange={(e) => handleFieldChange('arrivalTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </>
                  )}


                  {selectedMethod === 'standard' && (
                    <>
                      {/* Origin and Destination */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Origin Location <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                          </label>
                          <input
                            type="text"
                            value={shippingConfig.originLocation || ''}
                            onChange={(e) => handleFieldChange('originLocation', e.target.value)}
                            placeholder="e.g., Dar es Salaam"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.originLocation ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.originLocation && (
                            <p className="text-red-500 text-xs mt-1">{errors.originLocation}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Destination Location <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                          </label>
                          <input
                            type="text"
                            value={shippingConfig.destinationLocation || ''}
                            onChange={(e) => handleFieldChange('destinationLocation', e.target.value)}
                            placeholder="e.g., Arusha"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.destinationLocation ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.destinationLocation && (
                            <p className="text-red-500 text-xs mt-1">{errors.destinationLocation}</p>
                          )}
                        </div>
                      </div>

                      {/* Transport Company and Driver */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transport Company <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                          </label>
                          <input
                            type="text"
                            value={shippingConfig.transportCompany || ''}
                            onChange={(e) => handleFieldChange('transportCompany', e.target.value)}
                            placeholder="e.g., ABC Transport Ltd"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.transportCompany ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.transportCompany && (
                            <p className="text-red-500 text-xs mt-1">{errors.transportCompany}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Driver Name
                          </label>
                          <input
                            type="text"
                            value={shippingConfig.driverName || ''}
                            onChange={(e) => handleFieldChange('driverName', e.target.value)}
                            placeholder="Enter driver name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Driver Contact and Vehicle */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Driver Phone
                          </label>
                          <input
                            type="tel"
                            value={shippingConfig.driverPhone || ''}
                            onChange={(e) => handleFieldChange('driverPhone', e.target.value)}
                            placeholder="Enter driver phone"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vehicle Number
                          </label>
                          <input
                            type="text"
                            value={shippingConfig.vehicleNumber || ''}
                            onChange={(e) => handleFieldChange('vehicleNumber', e.target.value)}
                            placeholder="e.g., T123ABC"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Pickup and Delivery Dates */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pickup Date
                          </label>
                          <input
                            type="date"
                            value={shippingConfig.pickupDate || ''}
                            onChange={(e) => handleFieldChange('pickupDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Delivery Date
                          </label>
                          <input
                            type="date"
                            value={shippingConfig.deliveryDate || ''}
                            onChange={(e) => handleFieldChange('deliveryDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Local Shipping Cost */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Local Shipping Cost (TZS) <span className="text-gray-500 text-xs">(Optional - can be added later)</span>
                        </label>
                        <input
                          type="number"
                          value={shippingConfig.localShippingCost || ''}
                          onChange={(e) => handleFieldChange('localShippingCost', parseFloat(e.target.value) || 0)}
                          placeholder="Enter shipping cost"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.localShippingCost ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.localShippingCost && (
                          <p className="text-red-500 text-xs mt-1">{errors.localShippingCost}</p>
                        )}
                      </div>

                      {/* Tracking Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tracking Number
                        </label>
                        <input
                          type="text"
                          value={shippingConfig.trackingNumber}
                          onChange={(e) => handleFieldChange('trackingNumber', e.target.value)}
                          placeholder="Enter tracking number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}
                  </div>
                )}
              </div>

              {/* CBM Calculation Section - Only for Sea Freight */}
              {selectedMethod === 'sea' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Cargo Dimensions & CBM Calculation</h4>
                    <button
                      onClick={addCargoBox}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus size={16} />
                      <span>Add Box</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cargo Boxes List */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-medium text-gray-700">Cargo Boxes</h5>
                      
                      {(!shippingConfig.cargoBoxes || shippingConfig.cargoBoxes.length === 0) ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <Package size={32} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No cargo boxes added yet</p>
                          <p className="text-xs">Click "Add Box" to start adding cargo dimensions</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {shippingConfig.cargoBoxes.map((box, index) => (
                            <div key={box.id} className="bg-gray-50 p-4 rounded-lg border">
                              <div className="flex items-center justify-between mb-3">
                                <h6 className="text-sm font-medium text-gray-700">Box {index + 1}</h6>
                                {shippingConfig.cargoBoxes && shippingConfig.cargoBoxes.length > 1 && (
                                  <button
                                    onClick={() => removeCargoBox(box.id)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Length (m)
                                  </label>
                                  <input
                                    type="number"
                                    value={box.length || ''}
                                    onChange={(e) => updateCargoBox(box.id, 'length', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Width (m)
                                  </label>
                                  <input
                                    type="number"
                                    value={box.width || ''}
                                    onChange={(e) => updateCargoBox(box.id, 'width', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Height (m)
                                  </label>
                                  <input
                                    type="number"
                                    value={box.height || ''}
                                    onChange={(e) => updateCargoBox(box.id, 'height', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Weight (kg)
                                  </label>
                                  <input
                                    type="number"
                                    value={box.weight || ''}
                                    onChange={(e) => updateCargoBox(box.id, 'weight', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    CBM
                                  </label>
                                  <div className="px-2 py-1 text-sm bg-white border border-gray-300 rounded text-gray-700">
                                    {box.cbm.toFixed(3)} m³
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CBM Calculation Results */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-medium text-gray-700">CBM Calculation</h5>
                      
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total CBM:</span>
                          <span className="font-medium text-gray-900">
                            {getTotalCBM().toFixed(3)} m³
                          </span>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Price per CBM (USD)
                          </label>
                          <input
                            type="number"
                            value={shippingConfig.pricePerCBM || ''}
                            onChange={(e) => handleFieldChange('pricePerCBM', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            step="100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-medium text-gray-700">Total CBM Cost:</span>
                          <span className="font-bold text-lg text-blue-600">
                            {shippingConfig.totalCBMCost ? 
                              `$${shippingConfig.totalCBMCost.toLocaleString()}` : 
                              '$0'
                            }
                          </span>
                        </div>
                      </div>

                      {/* CBM Calculation Formula */}
                      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                        <p className="font-medium mb-1">CBM Calculation Formula:</p>
                        <p>CBM = Length (m) × Width (m) × Height (m)</p>
                        <p className="mt-1">Total Cost = Total CBM × Price per CBM</p>
                        <p className="mt-1 text-blue-600">Total CBM = Sum of all boxes CBM</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Options */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-gray-900">Additional Options</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {selectedMethod === 'standard' ? 'Local Shipping Cost (TZS)' : 
                         selectedMethod === 'sea' ? 'Additional Costs (TZS) <span className="text-gray-500 text-xs">(Optional - can be added later)</span>' : 'Estimated Cost (TZS) <span className="text-gray-500 text-xs">(Optional - can be added later)</span>'}
                      </label>
                      <input
                        type="number"
                        value={selectedMethod === 'standard' ? (shippingConfig.localShippingCost || '') : shippingConfig.estimatedCost}
                        onChange={(e) => {
                          if (selectedMethod === 'standard') {
                            handleFieldChange('localShippingCost', parseFloat(e.target.value) || 0);
                          } else {
                            handleFieldChange('estimatedCost', parseFloat(e.target.value) || 0);
                          }
                                                  }}
                        placeholder={selectedMethod === 'standard' ? '0' : 'Will be calculated later'}
                        min="0"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          (selectedMethod === 'standard' ? errors.localShippingCost : errors.estimatedCost) ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {(selectedMethod === 'standard' ? errors.localShippingCost : errors.estimatedCost) && (
                        <p className="text-red-500 text-xs mt-1">
                          {selectedMethod === 'standard' ? errors.localShippingCost : errors.estimatedCost}
                        </p>
                      )}
                      {selectedMethod === 'sea' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Additional costs beyond CBM calculation (handling, documentation, etc.)
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shipping Notes
                      </label>
                      <textarea
                        value={shippingConfig.shippingNotes}
                        onChange={(e) => handleFieldChange('shippingNotes', e.target.value)}
                        placeholder="Enter any additional shipping notes"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Total Cost Summary for Sea Freight */}
                    {selectedMethod === 'sea' && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h5 className="text-sm font-medium text-blue-900 mb-3">Total Shipping Cost Summary</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-700">CBM Cost:</span>
                            <span className="font-medium text-blue-900">
                              {shippingConfig.totalCBMCost ? 
                                `USD $${shippingConfig.totalCBMCost.toLocaleString()}` : 
                                'USD $0'
                              }
                              {exchangeRate !== 1.0 && shippingConfig.totalCBMCost && (
                                <span className="block text-xs text-gray-500">
                                  TZS {convertCBMCostToTZS(shippingConfig.totalCBMCost).toLocaleString()}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-blue-600">
                            <span>Total CBM: {getTotalCBM().toFixed(3)} m³</span>
                            <span>Price: USD ${(shippingConfig.pricePerCBM || 0).toLocaleString()}/m³</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-700">Additional Costs:</span>
                            <span className="font-medium text-blue-900">
                              TZS {(shippingConfig.estimatedCost || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-bold pt-2 border-t border-blue-200">
                            <span className="text-blue-900">Total Cost:</span>
                            <span className="text-blue-900">
                              USD ${((shippingConfig.totalCBMCost || 0) + (shippingConfig.estimatedCost || 0)).toLocaleString()}
                              {exchangeRate !== 1.0 && (
                                <span className="block text-xs text-gray-500">
                                  TZS {convertCBMCostToTZS((shippingConfig.totalCBMCost || 0) + (shippingConfig.estimatedCost || 0)).toLocaleString()}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="requireSignature"
                        checked={shippingConfig.requireSignature}
                        onChange={(e) => handleFieldChange('requireSignature', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="requireSignature" className="text-sm font-medium text-gray-700">
                        Require Signature
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="enableInsurance"
                        checked={shippingConfig.enableInsurance}
                        onChange={(e) => handleFieldChange('enableInsurance', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="enableInsurance" className="text-sm font-medium text-gray-700">
                        Enable Insurance
                      </label>
                    </div>

                    {shippingConfig.enableInsurance && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Insurance Value (TZS)
                        </label>
                        <input
                          type="number"
                          value={shippingConfig.insuranceValue}
                          onChange={(e) => handleFieldChange('insuranceValue', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t">
            {step === 'details' && (
              <button
                onClick={handleSubmit}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ShippingConfigurationModal;
