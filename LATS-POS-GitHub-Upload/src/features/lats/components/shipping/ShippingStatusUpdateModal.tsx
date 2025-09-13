import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, CheckCircle, Package, Truck, MapPin, Clock, Building, PackageCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { ShippingInfo, ShippingStatus } from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';
import { ShippingAgent } from '../../lib/data/provider';
import { 
  getAvailableStatuses, 
  STATUS_DESCRIPTIONS, 
  STATUS_ICONS, 
  STATUS_COLORS,
  normalizeStatus
} from '../../utils/shippingStatusFlow';

interface ShippingStatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (updateData: any) => Promise<void>;
  currentStatus: string;
  shippingInfo: ShippingInfo;
}

interface StatusUpdateData {
  status: ShippingStatus;
  location: string;
  notes: string;
  // Additional fields for different status types
  transitType?: string;
  estimatedArrival?: string;
  recipientName?: string;
  recipientPhone?: string;
  exceptionType?: string;
  exceptionDescription?: string;
  resolutionPlan?: string;
  
  // Sea shipping specific fields
  containerNumber?: string;
  billOfLading?: string;
  
  // Air shipping specific fields
  selectedAgentId?: string;
  cargoType?: 'per_piece' | 'per_kg';
  itemDescription?: string;
  receiptNumber?: string;
  extraTransportCost?: number;
  unitPrice?: number;
  totalCost?: number;
  
  // Ground shipping specific fields
  departureTerminal?: string;
  arrivalTerminal?: string;
  routeNumber?: string;
}

const ShippingStatusUpdateModal: React.FC<ShippingStatusUpdateModalProps> = ({
  isOpen,
  onClose,
  onUpdateStatus,
  currentStatus,
  shippingInfo
}) => {
  const [formData, setFormData] = useState<StatusUpdateData>({
    status: normalizeStatus(currentStatus),
    location: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Shipping agents state
  const [shippingAgents, setShippingAgents] = useState<ShippingAgent[]>([]);

  // Fetch shipping agents when modal opens
  useEffect(() => {
    const fetchShippingAgents = async () => {
      if (!isOpen) return;
      
      try {
        console.log('🚢 Fetching shipping agents...');
        // Note: getShippingAgents method needs to be implemented in inventoryService
        // const response = await inventoryService.getShippingAgents();
        // For now, set empty array
        setShippingAgents([]);
        console.log('✅ Shipping agents loaded: 0 agents (method not implemented)');
      } catch (error) {
        console.error('❌ Error fetching shipping agents:', error);
        setShippingAgents([]);
      }
    };

    fetchShippingAgents();
  }, [isOpen]);

  // Handle agent selection and auto-populate agent info
  useEffect(() => {
    if (formData.selectedAgentId && shippingAgents.length > 0) {
      const agent = shippingAgents.find(a => a.id === formData.selectedAgentId);
      if (agent) {
        // Auto-calculate unit price based on cargo type
        const unitPrice = formData.cargoType === 'per_kg' ? agent.pricePerKg || 0 : agent.pricePerCBM || 0;
        setFormData(prev => ({
          ...prev,
          unitPrice: unitPrice,
          totalCost: unitPrice + (formData.extraTransportCost || 0)
        }));
      }
    }
  }, [formData.selectedAgentId, shippingAgents, formData.cargoType, formData.extraTransportCost]);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialFormData: StatusUpdateData = {
        status: normalizeStatus(currentStatus),
        location: '',
        notes: ''
      };

      // Only initialize transit-related fields for in_transit status
      if (normalizeStatus(currentStatus) === 'in_transit') {
        initialFormData.selectedAgentId = '';
        initialFormData.cargoType = 'per_piece';
        initialFormData.itemDescription = '';
        initialFormData.receiptNumber = '';
        initialFormData.extraTransportCost = 0;
        initialFormData.unitPrice = 0;
        initialFormData.totalCost = 0;
      }

      setFormData(initialFormData);
    }
  }, [isOpen, currentStatus, shippingInfo]);

  const handleFieldChange = (field: keyof StatusUpdateData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Clear transit-related fields when status changes away from in_transit
      if (field === 'status' && value !== 'in_transit') {
        newData.transitType = undefined;
        newData.selectedAgentId = undefined;
        newData.cargoType = undefined;
        newData.itemDescription = undefined;
        newData.receiptNumber = undefined;
        newData.extraTransportCost = undefined;
        newData.unitPrice = undefined;
        newData.totalCost = undefined;
        newData.departureTerminal = undefined;
        newData.arrivalTerminal = undefined;
        newData.routeNumber = undefined;
        newData.containerNumber = undefined;
        newData.billOfLading = undefined;
      }
      
      return newData;
    });
  };

  const getStatusOptions = (): Array<{ value: ShippingStatus; label: string; description: string }> => {
    // Get available statuses based on current status and shipping events
    const availableStatuses = getAvailableStatuses(
      normalizeStatus(currentStatus), 
      shippingInfo.trackingEvents || []
    );

    // Convert to options format
    return availableStatuses.map(status => ({
      value: status,
      label: status.replace('_', ' ').toUpperCase(),
      description: STATUS_DESCRIPTIONS[status]
    }));
  };

  const getStatusIcon = (status: ShippingStatus) => {
    const iconName = STATUS_ICONS[status];
    switch (iconName) {
      case 'Clock': return <Clock size={16} />;
      case 'Package': return <Package size={16} />;
      case 'Truck': return <Truck size={16} />;
      case 'MapPin': return <MapPin size={16} />;
      case 'CheckCircle': return <CheckCircle size={16} />;
      case 'AlertTriangle': return <AlertTriangle size={16} />;
      case 'Building': return <Building size={16} />;
      case 'PackageCheck': return <PackageCheck size={16} />;
      default: return <Package size={16} />;
    }
  };

  // getStatusColor function removed - not used in simplified version

  const handleSubmit = async () => {
    if (!formData.status) {
      toast.error('Please select a status');
      return;
    }

    setIsSubmitting(true);
    try {
      // Include previously filled data in the update
      const updateData = { ...formData };
      
      // Add previously filled data for fields that are read-only
      const fieldsToInclude = [
        'containerNumber', 'billOfLading',
        'selectedAgentId', 'cargoType', 'itemDescription', 'receiptNumber', 'extraTransportCost', 'unitPrice', 'totalCost',
        'departureTerminal', 'arrivalTerminal', 'routeNumber'
      ];

      fieldsToInclude.forEach(field => {
        const existingValue = shippingInfo[field as keyof ShippingInfo];
        if (existingValue !== undefined && existingValue !== null && existingValue !== '') {
          (updateData as any)[field] = existingValue;
        }
      });

      await onUpdateStatus(updateData);
      toast.success('Shipping status updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating shipping status:', error);
      toast.error('Failed to update shipping status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Update Shipping Status</h2>
                <p className="text-gray-600">Current status: {normalizeStatus(currentStatus).replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select New Status
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {getStatusOptions().map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFieldChange('status', option.value)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    formData.status === option.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      formData.status === option.value ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {getStatusIcon(option.value)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Status Forms Removed - Ready for Recreation */}
          {formData.status && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Status Forms Removed</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                All status forms have been removed to provide a clean slate for recreation.
              </p>
              <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="font-medium text-gray-900 mb-2">Selected Status:</h4>
                <div className="flex items-center gap-2">
                  {getStatusIcon(formData.status)}
                  <span className="text-lg font-medium text-gray-900">
                    {formData.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Ready to recreate forms for this status
              </p>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Status forms removed - ready for recreation
            </div>
            <div className="flex gap-3">
              <GlassButton
                onClick={onClose}
                variant="secondary"
                disabled={isSubmitting}
              >
                Cancel
              </GlassButton>
              <GlassButton
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.status}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                {isSubmitting ? 'Updating...' : 'Update Status'}
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ShippingStatusUpdateModal;
