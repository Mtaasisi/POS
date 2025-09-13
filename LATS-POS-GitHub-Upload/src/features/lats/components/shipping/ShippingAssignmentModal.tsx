import React, { useState, useEffect } from 'react';
import { 
  Truck, X, Package, User, Building, Calendar, DollarSign, 
  FileText, CheckCircle, AlertTriangle, Save, Clock, MapPin, Shield,
  Plane, Ship, ArrowRight, Plus, Trash2, Box
} from 'lucide-react';
import { 
  ShippingFormData, ShippingAgent, 
  PurchaseOrder, ShippingSettings, CargoBox
} from '../../types/inventory';
import { getAllUsers } from '../../../../lib/userGoalsApi';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
}

interface ShippingAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
  agents: ShippingAgent[];
  settings: ShippingSettings;
  onAssignShipping: (shippingData: ShippingFormData) => void;
}

const ShippingAssignmentModal: React.FC<ShippingAssignmentModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  agents,
  settings,
  onAssignShipping
}) => {
  const [currentStep, setCurrentStep] = useState<'method' | 'details'>('method');
  const [formData, setFormData] = useState<ShippingFormData>({
    agentId: settings.defaultAgentId || '',
    managerId: '',
    trackingNumber: '',
    estimatedDelivery: '',
    cost: settings.defaultShippingCost || 0,
    notes: '',
    requireSignature: settings.requireSignature || false,
    enableInsurance: settings.enableInsurance || false,
    shippingMethod: '',
    carrierId: '',
    cargoBoxes: [],
    pricePerCBM: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<User[]>([]);

  // Load users for shipping manager selection
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userData = await getAllUsers();
        setUsers(userData);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      }
    };
    
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // Auto-assign agent if setting is enabled
  useEffect(() => {
    if (settings.autoAssignAgents && agents.length > 0) {
      const availableAgents = agents.filter(a => a.isActive);
      if (availableAgents.length > 0) {
        const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
        setFormData(prev => ({ 
          ...prev, 
          agentId: randomAgent.id,
          managerId: randomAgent.managerId || ''
        }));
      }
    }
  }, [settings.autoAssignAgents, agents]);

  const handleFieldChange = (field: keyof ShippingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMethodSelection = (method: 'air' | 'sea') => {
    setFormData(prev => ({ ...prev, shippingMethod: method }));
    setCurrentStep('details');
  };

  const handleBackToMethod = () => {
    setCurrentStep('method');
    setFormData(prev => ({ ...prev, shippingMethod: '' }));
  };

  // Cargo box management functions
  const addCargoBox = () => {
    const newBox: CargoBox = {
      id: Date.now().toString(),
      length: 0,
      width: 0,
      height: 0,
      quantity: 1,
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      cargoBoxes: [...(prev.cargoBoxes || []), newBox]
    }));
  };

  const updateCargoBox = (id: string, field: keyof CargoBox, value: any) => {
    setFormData(prev => ({
      ...prev,
      cargoBoxes: prev.cargoBoxes?.map(box => 
        box.id === id ? { ...box, [field]: value } : box
      ) || []
    }));
  };

  const removeCargoBox = (id: string) => {
    setFormData(prev => ({
      ...prev,
      cargoBoxes: prev.cargoBoxes?.filter(box => box.id !== id) || []
    }));
  };

  // CBM calculation
  const calculateCBM = (box: CargoBox): number => {
    return (box.length * box.width * box.height * box.quantity) / 1000000; // Convert cm³ to m³
  };

  const getTotalCBM = (): number => {
    return formData.cargoBoxes?.reduce((total, box) => total + calculateCBM(box), 0) || 0;
  };

  const getTotalCBMCost = (): number => {
    return getTotalCBM() * (formData.pricePerCBM || 0);
  };

  // Auto-fill shipping cost with CBM cost for sea shipping
  useEffect(() => {
    if (formData.shippingMethod === 'sea' && getTotalCBMCost() > 0) {
      handleFieldChange('cost', getTotalCBMCost());
    }
  }, [formData.shippingMethod, formData.cargoBoxes, formData.pricePerCBM]);

  // Auto-fill estimated delivery date to 30 days from today
  useEffect(() => {
    if (!formData.estimatedDelivery) {
      handleFieldChange('estimatedDelivery', getDefaultDeliveryDate());
    }
  }, [formData.estimatedDelivery]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.shippingMethod) newErrors.shippingMethod = 'Please select a shipping method';
    if (!formData.agentId) newErrors.agentId = 'Please select an agent';
    if (!formData.trackingNumber.trim()) newErrors.trackingNumber = 'Please enter tracking number';
    if (!formData.estimatedDelivery) newErrors.estimatedDelivery = 'Please select estimated delivery date';
    if (formData.estimatedDelivery) {
      const deliveryDate = new Date(formData.estimatedDelivery);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);
      if (deliveryDate > maxDate) {
        newErrors.estimatedDelivery = 'Delivery date cannot exceed 30 days from today';
      }
    }
    if (formData.cost < 0) newErrors.cost = 'Shipping cost cannot be negative';

    // Method-specific validation
    if (formData.shippingMethod === 'air') {
      if (!formData.flightNumber?.trim()) newErrors.flightNumber = 'Flight number is required for air shipping';
      if (!formData.departureAirport?.trim()) newErrors.departureAirport = 'Departure airport is required';
      if (!formData.arrivalAirport?.trim()) newErrors.arrivalAirport = 'Arrival airport is required';
    } else if (formData.shippingMethod === 'sea') {
      if (!formData.portOfLoading?.trim()) newErrors.portOfLoading = 'Port of loading is required';
      if (!formData.portOfDischarge?.trim()) newErrors.portOfDischarge = 'Port of discharge is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAssignShipping(formData);
      toast.success('Shipping assigned successfully');
      onClose();
    } catch (error) {
      console.error('Shipping assignment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign shipping';
      toast.error(`Failed to assign shipping: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateTrackingNumber = () => {
    const agent = agents.find(a => a.id === formData.agentId);
    const prefix = agent?.code || 'TRK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const getMinDeliveryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDeliveryDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const getDefaultDeliveryDate = () => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    return defaultDate.toISOString().split('T')[0];
  };

  const selectedAgent = agents.find(a => a.id === formData.agentId);
  const selectedManager = users.find(u => u.id === formData.managerId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
                <Truck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Assign Shipping</h2>
                <p className="text-gray-600">Configure shipping for {purchaseOrder.orderNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{purchaseOrder.orderNumber}</h3>
                <p className="text-sm text-gray-600">
                  {purchaseOrder.items.length} items • Total: TZS {purchaseOrder.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Supplier</p>
                <p className="font-medium text-gray-900">{purchaseOrder.supplier?.name}</p>
              </div>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep === 'method' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${currentStep === 'details' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep === 'details' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
            </div>
            <div className="ml-4 text-sm text-gray-600">
              {currentStep === 'method' ? 'Select Shipping Method' : 'Enter Shipping Details'}
            </div>
          </div>

          {currentStep === 'method' ? (
            /* Method Selection Step */
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Shipping Method</h3>
                <p className="text-gray-600">Select how you want to ship this order</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Air Shipping Option */}
                <div
                  onClick={() => handleMethodSelection('air')}
                  className="cursor-pointer group"
                >
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all duration-200 group-hover:shadow-lg">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Plane size={32} className="text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 text-center mb-2">Air Shipping</h4>
                    <p className="text-gray-600 text-center mb-4">Fast delivery by air freight</p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>2-5 days delivery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Real-time tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Flight information</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-center text-blue-600 font-medium">
                      <span>Select Air Shipping</span>
                      <ArrowRight size={16} className="ml-2" />
                    </div>
                  </div>
                </div>

                {/* Sea Shipping Option */}
                <div
                  onClick={() => handleMethodSelection('sea')}
                  className="cursor-pointer group"
                >
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 hover:border-green-400 transition-all duration-200 group-hover:shadow-lg">
                    <div className="flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Ship size={32} className="text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 text-center mb-2">Sea Shipping</h4>
                    <p className="text-gray-600 text-center mb-4">Cost-effective ocean freight</p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>7-21 days delivery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Container tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Port information</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-center text-green-600 font-medium">
                      <span>Select Sea Shipping</span>
                      <ArrowRight size={16} className="ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Details Step */
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={handleBackToMethod}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ArrowRight size={20} className="rotate-180" />
                  </button>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formData.shippingMethod === 'air' ? 'Air Shipping Details' : 'Sea Shipping Details'}
                    </h3>
                    <p className="text-sm text-gray-600">Enter the shipping information</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Agent Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Agent *
                  </label>
                  <select
                    value={formData.agentId}
                    onChange={(e) => {
                      const agentId = e.target.value;
                      const agent = agents.find(a => a.id === agentId);
                      handleFieldChange('agentId', agentId);
                      if (agent?.managerId) {
                        handleFieldChange('managerId', agent.managerId);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.agentId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select an agent</option>
                    {agents.filter(a => a.isActive).map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} {agent.company ? `(${agent.company})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.agentId && <p className="text-red-600 text-xs mt-1">{errors.agentId}</p>}
                </div>

                {/* Manager Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Manager (Select from registered users)
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => handleFieldChange('managerId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a user as manager (optional)</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} - {user.role} {user.email ? `(${user.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tracking Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.trackingNumber}
                      onChange={(e) => handleFieldChange('trackingNumber', e.target.value)}
                      placeholder="Enter tracking number"
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.trackingNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('trackingNumber', generateTrackingNumber())}
                      className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      title="Generate tracking number"
                    >
                      Auto
                    </button>
                  </div>
                  {errors.trackingNumber && <p className="text-red-600 text-xs mt-1">{errors.trackingNumber}</p>}
                </div>

                {/* Cargo Dimensions & CBM Calculation - Moved to Left Side */}
                {formData.shippingMethod === 'sea' && (
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Box size={20} className="text-green-600" />
                        Cargo Dimensions & CBM Calculation
                      </h5>
                      <GlassButton
                        type="button"
                        onClick={addCargoBox}
                        className="flex items-center gap-2 bg-green-500 text-white hover:bg-green-600"
                      >
                        <Plus size={16} />
                        Add Box
                      </GlassButton>
                    </div>

                    {/* Cargo Boxes List */}
                    <div className="space-y-4 mb-6">
                      {formData.cargoBoxes && formData.cargoBoxes.length > 0 ? (
                        formData.cargoBoxes.map((box, index) => (
                          <div key={box.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="font-medium text-gray-900">Cargo Box #{index + 1}</h6>
                              <button
                                type="button"
                                onClick={() => removeCargoBox(box.id)}
                                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Length (cm) *
                                </label>
                                <input
                                  type="number"
                                  value={box.length}
                                  onChange={(e) => updateCargoBox(box.id, 'length', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                  min="0"
                                  step="0.1"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Width (cm) *
                                </label>
                                <input
                                  type="number"
                                  value={box.width}
                                  onChange={(e) => updateCargoBox(box.id, 'width', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                  min="0"
                                  step="0.1"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Height (cm) *
                                </label>
                                <input
                                  type="number"
                                  value={box.height}
                                  onChange={(e) => updateCargoBox(box.id, 'height', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                  min="0"
                                  step="0.1"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  value={box.quantity}
                                  onChange={(e) => updateCargoBox(box.id, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                  min="1"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={box.description || ''}
                                  onChange={(e) => updateCargoBox(box.id, 'description', e.target.value)}
                                  placeholder="Optional description"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">CBM for this box:</span>
                                <span className="font-medium text-green-600">
                                  {calculateCBM(box).toFixed(3)} m³
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Box size={48} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No cargo boxes added yet</p>
                          <p className="text-xs text-gray-400">Click "Add Box" to start adding cargo dimensions</p>
                        </div>
                      )}
                    </div>

                    {/* CBM Calculation Summary */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h6 className="font-semibold text-gray-900 mb-3">CBM Calculation</h6>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total CBM:
                          </label>
                          <div className="text-2xl font-bold text-green-600">
                            {getTotalCBM().toFixed(3)} m³
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price per CBM (USD)
                          </label>
                          <input
                            type="number"
                            value={formData.pricePerCBM || 0}
                            onChange={(e) => handleFieldChange('pricePerCBM', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total CBM Cost:
                          </label>
                          <div className="text-2xl font-bold text-blue-600">
                            ${getTotalCBMCost().toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Estimated Delivery */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Delivery Date * (Auto-filled to 30 days)
                  </label>
                  <input
                    type="date"
                    value={formData.estimatedDelivery}
                    onChange={(e) => handleFieldChange('estimatedDelivery', e.target.value)}
                    min={getMinDeliveryDate()}
                    max={getMaxDeliveryDate()}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.estimatedDelivery ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.estimatedDelivery && <p className="text-red-600 text-xs mt-1">{errors.estimatedDelivery}</p>}
                  <p className="text-xs text-green-600 mt-1">
                    Auto-set to 30 days from today (maximum allowed)
                  </p>
                </div>


                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <input
                      type="checkbox"
                      checked={formData.requireSignature}
                      onChange={(e) => handleFieldChange('requireSignature', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="font-medium text-gray-900">Require Signature</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <input
                      type="checkbox"
                      checked={formData.enableInsurance}
                      onChange={(e) => handleFieldChange('enableInsurance', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-blue-500" />
                      <span className="font-medium text-gray-900">Package Insurance</span>
                    </div>
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Any special instructions or notes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Shipping Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Cost {formData.shippingMethod === 'sea' ? '(USD - Auto-filled from CBM)' : '(TZS)'}
                  </label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleFieldChange('cost', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.cost ? 'border-red-300' : 'border-gray-300'
                    } ${formData.shippingMethod === 'sea' ? 'bg-gray-50' : ''}`}
                    min="0"
                    max={settings.maxShippingCost}
                    readOnly={formData.shippingMethod === 'sea'}
                  />
                  {errors.cost && <p className="text-red-600 text-xs mt-1">{errors.cost}</p>}
                  {formData.shippingMethod === 'sea' ? (
                    <p className="text-xs text-green-600 mt-1">
                      Auto-calculated from CBM cost: ${getTotalCBMCost().toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum allowed: TZS {settings.maxShippingCost.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Method-Specific Fields */}
                {formData.shippingMethod === 'air' && (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Plane size={20} className="text-blue-600" />
                        Air Shipping Details
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Flight Number *
                          </label>
                          <input
                            type="text"
                            value={formData.flightNumber || ''}
                            onChange={(e) => handleFieldChange('flightNumber', e.target.value)}
                            placeholder="e.g., EK123"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.flightNumber ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.flightNumber && <p className="text-red-600 text-xs mt-1">{errors.flightNumber}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Departure Time
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.departureTime || ''}
                            onChange={(e) => handleFieldChange('departureTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Departure Airport *
                          </label>
                          <input
                            type="text"
                            value={formData.departureAirport || ''}
                            onChange={(e) => handleFieldChange('departureAirport', e.target.value)}
                            placeholder="e.g., JNIA, Dar es Salaam"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.departureAirport ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.departureAirport && <p className="text-red-600 text-xs mt-1">{errors.departureAirport}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Arrival Airport *
                          </label>
                          <input
                            type="text"
                            value={formData.arrivalAirport || ''}
                            onChange={(e) => handleFieldChange('arrivalAirport', e.target.value)}
                            placeholder="e.g., DXB, Dubai"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.arrivalAirport ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.arrivalAirport && <p className="text-red-600 text-xs mt-1">{errors.arrivalAirport}</p>}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Arrival Time
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.arrivalTime || ''}
                            onChange={(e) => handleFieldChange('arrivalTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.shippingMethod === 'sea' && (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Ship size={20} className="text-green-600" />
                        Sea Shipping Details
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Port of Loading *
                          </label>
                          <input
                            type="text"
                            value={formData.portOfLoading || ''}
                            onChange={(e) => handleFieldChange('portOfLoading', e.target.value)}
                            placeholder="e.g., Dar es Salaam Port"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.portOfLoading ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.portOfLoading && <p className="text-red-600 text-xs mt-1">{errors.portOfLoading}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Port of Discharge *
                          </label>
                          <input
                            type="text"
                            value={formData.portOfDischarge || ''}
                            onChange={(e) => handleFieldChange('portOfDischarge', e.target.value)}
                            placeholder="e.g., Port of Dubai"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.portOfDischarge ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.portOfDischarge && <p className="text-red-600 text-xs mt-1">{errors.portOfDischarge}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Departure Date
                          </label>
                          <input
                            type="date"
                            value={formData.departureDate || ''}
                            onChange={(e) => handleFieldChange('departureDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Arrival Date
                          </label>
                          <input
                            type="date"
                            value={formData.arrivalDate || ''}
                            onChange={(e) => handleFieldChange('arrivalDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Team Preview */}
            {(selectedAgent || selectedManager) && (
              <div className="mt-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Shipping Team Summary</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Agent Info */}
                  {selectedAgent && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Agent</p>
                          <p className="text-sm text-gray-600">{selectedAgent.name}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        {selectedAgent.company && <p>Company: {selectedAgent.company}</p>}
                        {selectedAgent.code && <p>Code: {selectedAgent.code}</p>}
                        {selectedAgent.phone && <p>Phone: {selectedAgent.phone}</p>}
                        {selectedAgent.email && <p>Email: {selectedAgent.email}</p>}
                      </div>
                    </div>
                  )}

                  {/* Manager Info */}
                  {selectedManager && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Building size={16} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Manager</p>
                          <p className="text-sm text-gray-600">{selectedManager.username}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>Role: {selectedManager.role}</p>
                        {selectedManager.email && <p>Email: {selectedManager.email}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cost Summary */}
            <div className="mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h4 className="font-semibold text-gray-900 mb-3">Shipping Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Order Value</p>
                  <p className="font-bold text-gray-900">
                    {purchaseOrder.currency || 'TZS'} {purchaseOrder.totalAmount.toLocaleString()}
                    {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && purchaseOrder.totalAmountBaseCurrency && (
                      <span className="block text-xs text-gray-500">
                        TZS {purchaseOrder.totalAmountBaseCurrency.toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Shipping Cost</p>
                  <p className="font-bold text-green-600">TZS {formData.cost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Cost</p>
                  <p className="font-bold text-blue-600">
                    {purchaseOrder.currency || 'TZS'} {(purchaseOrder.totalAmount + formData.cost).toLocaleString()}
                    {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && purchaseOrder.totalAmountBaseCurrency && (
                      <span className="block text-xs text-gray-500">
                        TZS {((purchaseOrder.totalAmountBaseCurrency || purchaseOrder.totalAmount) + formData.cost).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Est. Delivery</p>
                  <p className="font-bold text-purple-600">
                    {formData.estimatedDelivery ? new Date(formData.estimatedDelivery).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <GlassButton
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X size={16} />
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Clock size={16} className="animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Assign Shipping
                  </>
                )}
              </GlassButton>
            </div>
          </form>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default ShippingAssignmentModal;
