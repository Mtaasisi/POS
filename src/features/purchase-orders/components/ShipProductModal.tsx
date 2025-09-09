import React, { useState, useEffect } from 'react';
import { X, Truck, Package, MapPin, Calendar, User, Hash, Clock, Plane, Ship } from 'lucide-react';
import { ShippingInfo } from '../../types';
import supabaseProvider from '../../../lats/lib/data/provider.supabase';

interface ShipProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShip: (shippingData: ShippingInfo) => void;
  purchaseOrderId: string;
  productName?: string;
  initialData?: Partial<ShippingInfo>;
  maxQuantity?: number;
}

const ShipProductModal: React.FC<ShipProductModalProps> = ({
  isOpen,
  onClose,
  onShip,
  purchaseOrderId,
  productName,
  initialData,
  maxQuantity = 1
}) => {
  const [currentStep, setCurrentStep] = useState<'method' | 'details'>('method');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    expectedDelivery: '',
    shippingAddress: '',
    shippingCity: 'Dar es Salaam',
    shippingCountry: 'Tanzania',
    shippingPhone: '',
    shippingContact: '',
    shippingMethod: 'Standard',
    internalRef: `PO-${purchaseOrderId.slice(-6)}`,
    priority: 'Normal',
    internalStatus: 'Pending',
    agent: '',
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

  const [quantityToShip, setQuantityToShip] = useState<number>(1);

  const [errors, setErrors] = useState<Partial<ShippingInfo>>({});
  const [shippingAgents, setShippingAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // Reset to method selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('method');
      setShippingInfo(prev => ({ ...prev, shippingType: undefined }));
    }
  }, [isOpen]);

  // Fetch shipping agents
  useEffect(() => {
    const fetchAgents = async () => {
      if (!isOpen) return;
      
      setLoadingAgents(true);
      try {
        const response = await supabaseProvider.getShippingAgents();
        if (response.ok && response.data) {
          setShippingAgents(response.data);
        }
      } catch (error) {
        console.error('Error fetching shipping agents:', error);
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingInfo> = {};

    if (!shippingInfo.shippingType) {
      newErrors.shippingType = 'Shipping method is required';
    }

    if (currentStep === 'details') {
      if (!shippingInfo.expectedDelivery) {
        newErrors.expectedDelivery = 'Expected delivery date is required';
      }
      if (!shippingInfo.shippingAddress.trim()) {
        newErrors.shippingAddress = 'Shipping address is required';
      }
      if (!shippingInfo.shippingContact.trim()) {
        newErrors.shippingContact = 'Contact person is required';
      }
      if (!shippingInfo.shippingPhone.trim()) {
        newErrors.shippingPhone = 'Phone number is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onShip(shippingInfo);
      onClose();
    }
  };

  const handleInputChange = (field: keyof ShippingInfo, value: string | number | boolean) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleMethodSelect = (method: 'air' | 'sea' | 'standard') => {
    setShippingInfo(prev => ({ ...prev, shippingType: method }));
    setCurrentStep('details');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Ship Product</h2>
              {productName && (
                <p className="text-sm text-gray-600">Shipping: {productName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${currentStep === 'method' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'method' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Shipping Method</span>
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className={`flex items-center gap-2 ${currentStep === 'details' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'details' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Shipping Details</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'method' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Shipping Method</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Standard Shipping */}
                <button
                  onClick={() => handleMethodSelect('standard')}
                  className={`p-6 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                    shippingInfo.shippingType === 'standard'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Truck className="w-8 h-8 text-gray-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Standard Shipping</h4>
                      <p className="text-sm text-gray-600">Local delivery</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Best for local deliveries within Tanzania. Fast and reliable.
                  </p>
                </button>

                {/* Air Shipping */}
                <button
                  onClick={() => handleMethodSelect('air')}
                  className={`p-6 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                    shippingInfo.shippingType === 'air'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Plane className="w-8 h-8 text-gray-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Air Shipping</h4>
                      <p className="text-sm text-gray-600">Fast delivery</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Fastest option for urgent deliveries. International and domestic.
                  </p>
                </button>

                {/* Sea Shipping */}
                <button
                  onClick={() => handleMethodSelect('sea')}
                  className={`p-6 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                    shippingInfo.shippingType === 'sea'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Ship className="w-8 h-8 text-gray-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Sea Shipping</h4>
                      <p className="text-sm text-gray-600">Economical option</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Most economical for large shipments. International delivery.
                  </p>
                </button>
              </div>

              {errors.shippingType && (
                <p className="text-sm text-red-600 mt-2">{errors.shippingType}</p>
              )}
            </div>
          )}

          {currentStep === 'details' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Shipping Details</h3>
                <button
                  onClick={() => setCurrentStep('method')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Change Method
                </button>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={shippingInfo.expectedDelivery}
                    onChange={(e) => handleInputChange('expectedDelivery', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.expectedDelivery ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.expectedDelivery && (
                    <p className="text-sm text-red-600 mt-1">{errors.expectedDelivery}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={shippingInfo.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Quantity to Ship */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Ship
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={quantityToShip}
                    onChange={(e) => setQuantityToShip(Math.min(Math.max(1, parseInt(e.target.value) || 1), maxQuantity))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">of {maxQuantity} available</span>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Address *
                </label>
                <textarea
                  value={shippingInfo.shippingAddress}
                  onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.shippingAddress ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter complete shipping address"
                />
                {errors.shippingAddress && (
                  <p className="text-sm text-red-600 mt-1">{errors.shippingAddress}</p>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.shippingContact}
                    onChange={(e) => handleInputChange('shippingContact', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.shippingContact ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Contact person name"
                  />
                  {errors.shippingContact && (
                    <p className="text-sm text-red-600 mt-1">{errors.shippingContact}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={shippingInfo.shippingPhone}
                    onChange={(e) => handleInputChange('shippingPhone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.shippingPhone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Phone number"
                  />
                  {errors.shippingPhone && (
                    <p className="text-sm text-red-600 mt-1">{errors.shippingPhone}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.shippingCity}
                    onChange={(e) => handleInputChange('shippingCity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.shippingCountry}
                    onChange={(e) => handleInputChange('shippingCountry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Shipping Agent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Agent
                </label>
                <select
                  value={shippingInfo.agent}
                  onChange={(e) => handleInputChange('agent', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingAgents}
                >
                  <option value="">Select shipping agent</option>
                  {shippingAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} - {agent.company}
                    </option>
                  ))}
                </select>
                {loadingAgents && (
                  <p className="text-sm text-gray-500 mt-1">Loading agents...</p>
                )}
              </div>

              {/* Method-specific fields */}
              {shippingInfo.shippingType === 'air' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Air Shipping Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Flight Number
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.flightNumber}
                        onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., TC123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departure Airport
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.departureAirport}
                        onChange={(e) => handleInputChange('departureAirport', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., JNIA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Arrival Airport
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.arrivalAirport}
                        onChange={(e) => handleInputChange('arrivalAirport', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., JNIA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departure Time
                      </label>
                      <input
                        type="datetime-local"
                        value={shippingInfo.departureTime}
                        onChange={(e) => handleInputChange('departureTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {shippingInfo.shippingType === 'sea' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Sea Shipping Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vessel Name
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.vesselName}
                        onChange={(e) => handleInputChange('vesselName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Vessel name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Port of Loading
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.portOfLoading}
                        onChange={(e) => handleInputChange('portOfLoading', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Loading port"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Port of Discharge
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.portOfDischarge}
                        onChange={(e) => handleInputChange('portOfDischarge', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Discharge port"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Container Number
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.containerNumber}
                        onChange={(e) => handleInputChange('containerNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Container number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Notes
                </label>
                <textarea
                  value={shippingInfo.internalNotes}
                  onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional shipping instructions or notes"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {currentStep === 'method' ? (
            <button
              onClick={() => setCurrentStep('details')}
              disabled={!shippingInfo.shippingType}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Ship Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipProductModal;
