import React, { useState, useEffect } from 'react';
import { 
  Truck, X, Package, User, Building, Calendar, DollarSign, 
  FileText, CheckCircle, AlertTriangle, Save, Clock, MapPin
} from 'lucide-react';
import { 
  ShippingFormData, ShippingAgent, ShippingManager, ShippingCarrier, 
  PurchaseOrder, ShippingSettings
} from '../../types/inventory';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { toast } from 'react-hot-toast';

interface ShippingAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
  agents: ShippingAgent[];
  managers: ShippingManager[];
  carriers: ShippingCarrier[];
  settings: ShippingSettings;
  onAssignShipping: (shippingData: ShippingFormData) => void;
}

const ShippingAssignmentModal: React.FC<ShippingAssignmentModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  agents,
  managers,
  carriers,
  settings,
  onAssignShipping
}) => {
  const [formData, setFormData] = useState<ShippingFormData>({
    carrierId: settings.defaultCarrierId || '',
    agentId: '',
    managerId: '',
    trackingNumber: '',
    estimatedDelivery: '',
    cost: settings.defaultShippingCost || 0,
    notes: '',
    requireSignature: settings.requireSignature || false,
    enableInsurance: settings.enableInsurance || false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.carrierId) newErrors.carrierId = 'Please select a carrier';
    if (!formData.agentId) newErrors.agentId = 'Please select an agent';
    if (!formData.trackingNumber.trim()) newErrors.trackingNumber = 'Please enter tracking number';
    if (!formData.estimatedDelivery) newErrors.estimatedDelivery = 'Please select estimated delivery date';
    if (formData.cost < 0) newErrors.cost = 'Shipping cost cannot be negative';

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
      toast.error('Failed to assign shipping');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateTrackingNumber = () => {
    const carrier = carriers.find(c => c.id === formData.carrierId);
    const prefix = carrier?.code || 'TRK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const getMinDeliveryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const selectedAgent = agents.find(a => a.id === formData.agentId);
  const selectedManager = managers.find(m => m.id === formData.managerId);
  const selectedCarrier = carriers.find(c => c.id === formData.carrierId);

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

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Carrier Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Carrier *
                  </label>
                  <select
                    value={formData.carrierId}
                    onChange={(e) => handleFieldChange('carrierId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.carrierId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a carrier</option>
                    {carriers.filter(c => c.isActive).map(carrier => (
                      <option key={carrier.id} value={carrier.id}>
                        {carrier.name} ({carrier.code})
                      </option>
                    ))}
                  </select>
                  {errors.carrierId && <p className="text-red-600 text-xs mt-1">{errors.carrierId}</p>}
                </div>

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
                        {agent.name} - {agent.company}
                      </option>
                    ))}
                  </select>
                  {errors.agentId && <p className="text-red-600 text-xs mt-1">{errors.agentId}</p>}
                </div>

                {/* Manager Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Manager
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => handleFieldChange('managerId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a manager (optional)</option>
                    {managers.filter(m => m.isActive).map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} - {manager.department}
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
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Estimated Delivery */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={formData.estimatedDelivery}
                    onChange={(e) => handleFieldChange('estimatedDelivery', e.target.value)}
                    min={getMinDeliveryDate()}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.estimatedDelivery ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.estimatedDelivery && <p className="text-red-600 text-xs mt-1">{errors.estimatedDelivery}</p>}
                </div>

                {/* Shipping Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Cost (TZS)
                  </label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleFieldChange('cost', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.cost ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="0"
                    max={settings.maxShippingCost}
                  />
                  {errors.cost && <p className="text-red-600 text-xs mt-1">{errors.cost}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum allowed: TZS {settings.maxShippingCost.toLocaleString()}
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
              </div>
            </div>

            {/* Selected Team Preview */}
            {(selectedAgent || selectedManager || selectedCarrier) && (
              <div className="mt-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Shipping Team Summary</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Carrier Info */}
                  {selectedCarrier && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Truck size={16} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Carrier</p>
                          <p className="text-sm text-gray-600">{selectedCarrier.name}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>Code: {selectedCarrier.code}</p>
                        <p>Services: {selectedCarrier.supportedServices.join(', ')}</p>
                      </div>
                    </div>
                  )}

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
                        <p>Company: {selectedAgent.company}</p>
                        <p>Phone: {selectedAgent.phone}</p>
                        <p>Email: {selectedAgent.email}</p>
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
                          <p className="text-sm text-gray-600">{selectedManager.name}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>Dept: {selectedManager.department}</p>
                        <p>Phone: {selectedManager.phone}</p>
                        <p>Email: {selectedManager.email}</p>
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
                  <p className="font-bold text-gray-900">TZS {purchaseOrder.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Shipping Cost</p>
                  <p className="font-bold text-green-600">TZS {formData.cost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Cost</p>
                  <p className="font-bold text-blue-600">TZS {(purchaseOrder.totalAmount + formData.cost).toLocaleString()}</p>
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
        </div>
      </GlassCard>
    </div>
  );
};

export default ShippingAssignmentModal;