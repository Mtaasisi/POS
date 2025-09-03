// Internal Shipping Management Modal - For managing internal shipping operations
import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { X, Truck, MapPin, Calendar, Package, Phone, User, Building, Hash, Clock, FileText, AlertCircle } from 'lucide-react';

interface ShippingInfo {
  expectedDelivery: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  shippingPhone: string;
  shippingContact: string;
  shippingMethod: string;
  shippingNotes: string;
  trackingNumber?: string;
  estimatedCost?: number;
  agent?: string;
  requireSignature?: boolean;
  enableInsurance?: boolean;
  insuranceValue?: number;
  // Internal fields
  internalRef?: string;
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  internalNotes?: string;
  internalStatus?: 'Pending' | 'Assigned' | 'In Transit' | 'Delivered';
  actualCost?: number;
  agentCommission?: number;
}

interface ShippingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shippingInfo: ShippingInfo) => void;
  initialData?: Partial<ShippingInfo>;
}

// Internal agents for shipping operations
const SHIPPING_AGENTS = [
  { 
    id: 'AGENT_001', 
    name: 'Ahmed Hassan', 
    code: 'AH01',
    zone: 'Central Dar',
    phone: '+255 700 123 456',
    email: 'ahmed@lats.co.tz',
    rating: 4.8,
    activeOrders: 12
  },
  { 
    id: 'AGENT_002', 
    name: 'Fatma Mwalimu', 
    code: 'FM02',
    zone: 'North Dar',
    phone: '+255 700 234 567',
    email: 'fatma@lats.co.tz',
    rating: 4.9,
    activeOrders: 8
  },
  { 
    id: 'AGENT_003', 
    name: 'John Mtunguja', 
    code: 'JM03',
    zone: 'South Dar',
    phone: '+255 700 345 678',
    email: 'john@lats.co.tz',
    rating: 4.7,
    activeOrders: 15
  },
  { 
    id: 'AGENT_004', 
    name: 'Grace Mwamba', 
    code: 'GM04',
    zone: 'West Dar',
    phone: '+255 700 456 789',
    email: 'grace@lats.co.tz',
    rating: 4.6,
    activeOrders: 10
  },
  { 
    id: 'EXTERNAL', 
    name: 'External Carrier', 
    code: 'EXT',
    zone: 'Multiple',
    phone: 'Various',
    email: 'external@lats.co.tz',
    rating: 4.0,
    activeOrders: 0
  }
];

const PRIORITY_COLORS = {
  'Low': 'text-green-600 bg-green-50 border-green-200',
  'Normal': 'text-blue-600 bg-blue-50 border-blue-200',
  'High': 'text-orange-600 bg-orange-50 border-orange-200',
  'Urgent': 'text-red-600 bg-red-50 border-red-200'
};

const STATUS_COLORS = {
  'Pending': 'text-gray-600 bg-gray-50 border-gray-200',
  'Assigned': 'text-blue-600 bg-blue-50 border-blue-200',
  'In Transit': 'text-orange-600 bg-orange-50 border-orange-200',
  'Delivered': 'text-green-600 bg-green-50 border-green-200'
};

const ShippingInfoModal: React.FC<ShippingInfoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    expectedDelivery: '',
    shippingAddress: '',
    shippingCity: 'Dar es Salaam',
    shippingCountry: 'Tanzania',
    shippingPhone: '',
    shippingContact: '',
    shippingMethod: 'Standard',
    shippingNotes: '',
    trackingNumber: '',
    estimatedCost: 0,
    agent: 'AGENT_001',
    requireSignature: false,
    enableInsurance: false,
    insuranceValue: 0,
    internalRef: `PO-${Date.now().toString().slice(-6)}`,
    priority: 'Normal',
    internalNotes: '',
    internalStatus: 'Pending',
    actualCost: 0,
    agentCommission: 0,
    ...initialData
  });

  const [errors, setErrors] = useState<Partial<ShippingInfo>>({});
  const [selectedAgent, setSelectedAgent] = useState<any>(SHIPPING_AGENTS[0]);

  useEffect(() => {
    if (initialData) {
      setShippingInfo(prev => ({ ...prev, ...initialData }));
      if (initialData.agent) {
        const agent = SHIPPING_AGENTS.find(a => a.id === initialData.agent);
        if (agent) setSelectedAgent(agent);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (selectedAgent) {
      setShippingInfo(prev => ({ ...prev, agent: selectedAgent.id }));
    }
  }, [selectedAgent]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingInfo> = {};

    if (!shippingInfo.expectedDelivery) {
      newErrors.expectedDelivery = 'Delivery date required';
    }

    if (!shippingInfo.shippingAddress) {
      newErrors.shippingAddress = 'Address required';
    }

    if (!shippingInfo.shippingContact) {
      newErrors.shippingContact = 'Contact required';
    }

    if (!shippingInfo.agent) {
      newErrors.agent = 'Agent required';
    }

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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Internal Shipping</h2>
              <p className="text-sm text-gray-600">Manage delivery operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Internal Reference & Status */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Hash className="w-3 h-3 inline mr-1" />
                  Ref
                </label>
                <input
                  type="text"
                  value={shippingInfo.internalRef || ''}
                  onChange={(e) => handleInputChange('internalRef', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <div className="grid grid-cols-2 gap-1">
                  {(['Low', 'Normal', 'High', 'Urgent'] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => handleInputChange('priority', priority)}
                      className={`px-2 py-1 text-xs border rounded transition-colors ${
                        shippingInfo.priority === priority
                          ? PRIORITY_COLORS[priority]
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="grid grid-cols-2 gap-1">
                  {(['Pending', 'Assigned', 'In Transit', 'Delivered'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleInputChange('internalStatus', status)}
                      className={`px-2 py-1 text-xs border rounded transition-colors ${
                        shippingInfo.internalStatus === status
                          ? STATUS_COLORS[status]
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {status.replace(' ', '')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Agent Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-3 h-3 inline mr-1" />
                Delivery Agent
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SHIPPING_AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      selectedAgent?.id === agent.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{agent.name}</div>
                        <div className="text-xs text-gray-600">{agent.zone}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{agent.code}</div>
                        <div className="text-xs text-gray-500">{agent.activeOrders} orders</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.agent && (
                <p className="text-red-500 text-xs mt-1">{errors.agent}</p>
              )}
            </div>

            {/* Delivery Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={shippingInfo.expectedDelivery}
                  onChange={(e) => handleInputChange('expectedDelivery', e.target.value)}
                  className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                    errors.expectedDelivery ? 'border-red-300' : 'border-gray-300'
                  }`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.expectedDelivery && (
                  <p className="text-red-500 text-xs mt-1">{errors.expectedDelivery}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <div className="grid grid-cols-2 gap-1">
                  {['Standard', 'Express', 'Same Day', 'Pickup'].map((method) => (
                    <button
                      key={method}
                      onClick={() => handleInputChange('shippingMethod', method)}
                      className={`px-2 py-1 text-xs border rounded transition-colors ${
                        shippingInfo.shippingMethod === method
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />
                Address
              </label>
              <textarea
                value={shippingInfo.shippingAddress}
                onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                placeholder="Complete delivery address"
                rows={2}
                className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none ${
                  errors.shippingAddress ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.shippingAddress && (
                <p className="text-red-500 text-xs mt-1">{errors.shippingAddress}</p>
              )}
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-3 h-3 inline mr-1" />
                  Contact
                </label>
                <input
                  type="text"
                  value={shippingInfo.shippingContact}
                  onChange={(e) => handleInputChange('shippingContact', e.target.value)}
                  placeholder="Contact person"
                  className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                    errors.shippingContact ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.shippingContact && (
                  <p className="text-red-500 text-xs mt-1">{errors.shippingContact}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-3 h-3 inline mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={shippingInfo.shippingPhone}
                  onChange={(e) => handleInputChange('shippingPhone', e.target.value)}
                  placeholder="Phone number"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Tracking & Costs */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking</label>
                <input
                  type="text"
                  value={shippingInfo.trackingNumber || ''}
                  onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                  placeholder="Track #"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Est. Cost</label>
                <input
                  type="number"
                  value={shippingInfo.estimatedCost || ''}
                  onChange={(e) => handleInputChange('estimatedCost', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cost</label>
                <input
                  type="number"
                  value={shippingInfo.actualCost || ''}
                  onChange={(e) => handleInputChange('actualCost', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requireSignature"
                  checked={shippingInfo.requireSignature || false}
                  onChange={(e) => handleInputChange('requireSignature', e.target.checked)}
                  className="w-3 h-3 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="requireSignature" className="text-xs text-gray-700">
                  Signature
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableInsurance"
                  checked={shippingInfo.enableInsurance || false}
                  onChange={(e) => handleInputChange('enableInsurance', e.target.checked)}
                  className="w-3 h-3 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="enableInsurance" className="text-xs text-gray-700">
                  Insurance
                </label>
              </div>
              {shippingInfo.enableInsurance && (
                <div>
                  <input
                    type="number"
                    value={shippingInfo.insuranceValue || ''}
                    onChange={(e) => handleInputChange('insuranceValue', parseFloat(e.target.value) || 0)}
                    placeholder="Value"
                    min="0"
                    step="0.01"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-3 h-3 inline mr-1" />
                Customer Notes
              </label>
              <textarea
                value={shippingInfo.shippingNotes}
                onChange={(e) => handleInputChange('shippingNotes', e.target.value)}
                placeholder="Customer delivery instructions"
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-3 h-3 inline mr-1" />
                Internal Notes
              </label>
              <textarea
                value={shippingInfo.internalNotes || ''}
                onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                placeholder="Internal tracking notes, issues, special handling..."
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
              />
            </div>
          </div>

          {/* Right Column - Agent Info */}
          <div>
            {selectedAgent && (
              <div className="bg-gray-50 rounded-lg p-3 border">
                <h4 className="font-medium text-gray-900 mb-3 text-sm flex items-center">
                  <Building className="w-3 h-3 mr-1" />
                  Agent Details
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-1 text-gray-600">{selectedAgent.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Zone:</span>
                    <span className="ml-1 text-gray-600">{selectedAgent.zone}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="ml-1 text-gray-600">{selectedAgent.phone}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Rating:</span>
                    <span className="ml-1 text-gray-600">{selectedAgent.rating}/5</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Active:</span>
                    <span className="ml-1 text-gray-600">{selectedAgent.activeOrders} orders</span>
                  </div>
                  {selectedAgent.id !== 'EXTERNAL' && (
                    <div className="pt-2 border-t border-gray-200">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Commission</label>
                      <input
                        type="number"
                        value={shippingInfo.agentCommission || ''}
                        onChange={(e) => handleInputChange('agentCommission', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2 text-sm flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Quick Info
              </h4>
              <div className="space-y-1 text-xs text-blue-700">
                <div>City: {shippingInfo.shippingCity}</div>
                <div>Method: {shippingInfo.shippingMethod}</div>
                {shippingInfo.estimatedCost && shippingInfo.actualCost && (
                  <div className={`font-medium ${
                    (shippingInfo.actualCost || 0) > (shippingInfo.estimatedCost || 0) 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    Cost: {shippingInfo.estimatedCost} → {shippingInfo.actualCost}
                  </div>
                )}
              </div>
            </div>

            {/* Warnings */}
            {(shippingInfo.actualCost || 0) > (shippingInfo.estimatedCost || 0) && shippingInfo.estimatedCost && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <div className="flex items-center text-red-700 text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Cost overrun detected
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-200">
          <GlassButton
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white text-sm py-2"
          >
            Cancel
          </GlassButton>
          <GlassButton
            onClick={handleSave}
            className="flex-1 bg-orange-500 text-white text-sm py-2"
          >
            Save
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default ShippingInfoModal;