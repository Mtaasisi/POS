import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  X, 
  Save, 
  Package, 
  MapPin, 
  Layers, 
  Ruler, 
  Thermometer, 
  Info,
  AlertTriangle,
  Settings
} from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassInput from '../../../shared/components/ui/GlassInput';
import GlassSelect from '../../../shared/components/ui/GlassSelect';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { StoreShelf, CreateStoreShelfData } from '../../../settings/utils/storeShelfApi';
import { StorageRoom } from '../../../settings/utils/storageRoomApi';

interface ShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  shelf?: StoreShelf | null;
  storageRoom?: StorageRoom | null;
  onSave: (shelf: CreateStoreShelfData) => void;
}

const ShelfModal: React.FC<ShelfModalProps> = ({ 
  isOpen, 
  onClose, 
  shelf, 
  storageRoom,
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    shelf_type: 'standard' as 'standard' | 'refrigerated' | 'display' | 'storage' | 'specialty',
    row_number: 1,
    column_number: 1,
    max_capacity: '',
    zone: 'center' as 'center' | 'front' | 'back' | 'left' | 'right',
    description: '',
    is_accessible: true,
    requires_ladder: false,
    is_refrigerated: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or shelf changes
  useEffect(() => {
    if (isOpen) {
      if (shelf) {
        // Editing existing shelf
        setFormData({
          name: shelf.name,
          code: shelf.code,
          shelf_type: shelf.shelf_type,
          row_number: shelf.row_number || 1,
          column_number: shelf.column_number || 1,
          max_capacity: shelf.max_capacity?.toString() || '',
          zone: shelf.zone || 'center',
          description: shelf.description || '',
          is_accessible: shelf.is_accessible,
          requires_ladder: shelf.requires_ladder,
          is_refrigerated: shelf.is_refrigerated
        });
      } else {
        // Creating new shelf - auto-generate next position
        setFormData({
          name: '',
          code: '',
          shelf_type: 'standard' as 'standard' | 'refrigerated' | 'display' | 'storage' | 'specialty',
          row_number: 1,
          column_number: 1,
          max_capacity: '',
          zone: 'center' as 'center' | 'front' | 'back' | 'left' | 'right',
          description: '',
          is_accessible: true,
          requires_ladder: false,
          is_refrigerated: false
        });
      }
      setErrors({});
    }
  }, [isOpen, shelf?.id]); // Only depend on shelf.id to avoid unnecessary re-runs

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Shelf name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Shelf code is required';
    }

    if (formData.max_capacity && parseInt(formData.max_capacity) <= 0) {
      newErrors.max_capacity = 'Max capacity must be greater than 0';
    }

    if (formData.row_number < 1) {
      newErrors.row_number = 'Row number must be at least 1';
    }

    if (formData.column_number < 1) {
      newErrors.column_number = 'Column number must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!storageRoom) {
      toast.error('Storage room is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const shelfData: CreateStoreShelfData = {
        store_location_id: storageRoom.store_location_id,
        storage_room_id: storageRoom.id,
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || undefined,
        shelf_type: formData.shelf_type,
        row_number: formData.row_number,
        column_number: formData.column_number,
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : undefined,
        floor_level: storageRoom?.floor_level || 1,
        zone: formData.zone,
        is_active: true,
        is_accessible: formData.is_accessible,
        requires_ladder: formData.requires_ladder,
        is_refrigerated: formData.is_refrigerated,
        priority_order: 0
      };

      await onSave(shelfData);
      toast.success(shelf ? 'Shelf updated successfully' : 'Shelf created successfully');
      onClose();
    } catch (error) {
      console.error('Error saving shelf:', error);
      toast.error('Failed to save shelf');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {shelf ? 'Edit Shelf' : 'Create New Shelf'}
                </h2>
                <p className="text-sm text-gray-600">
                  {storageRoom ? `${storageRoom.name} (${storageRoom.code})` : 'Storage Room Required'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Essential Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <GlassInput
                      label="Shelf Code *"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      error={errors.code}
                      placeholder="e.g., 04A1"
                    />
                  </div>
                  <GlassInput
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Optional shelf description"
                  />
                </div>

                {/* Position & Layout */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-500" />
                    Position & Layout
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Row Number *</label>
                      <input
                        type="number"
                        value={formData.row_number}
                        onChange={(e) => handleInputChange('row_number', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                      />
                      {errors.row_number && <p className="text-red-500 text-xs mt-1">{errors.row_number}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Column Number *</label>
                      <input
                        type="number"
                        value={formData.column_number}
                        onChange={(e) => handleInputChange('column_number', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                      />
                      {errors.column_number && <p className="text-red-500 text-xs mt-1">{errors.column_number}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
                      <select
                        value={formData.zone}
                        onChange={(e) => handleInputChange('zone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="center">Center</option>
                        <option value="front">Front</option>
                        <option value="back">Back</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Shelf Properties */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-500" />
                    Shelf Properties
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Type</label>
                      <select
                        value={formData.shelf_type}
                        onChange={(e) => handleInputChange('shelf_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="standard">Standard</option>
                        <option value="refrigerated">Refrigerated</option>
                        <option value="display">Display</option>
                        <option value="storage">Storage</option>
                        <option value="specialty">Specialty</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity</label>
                      <input
                        type="number"
                        value={formData.max_capacity}
                        onChange={(e) => handleInputChange('max_capacity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optional"
                        min="1"
                      />
                      {errors.max_capacity && <p className="text-red-500 text-xs mt-1">{errors.max_capacity}</p>}
                    </div>
                  </div>

                  {/* Access & Special Features */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Access & Features</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.is_accessible}
                          onChange={(e) => handleInputChange('is_accessible', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Easily accessible</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.requires_ladder}
                          onChange={(e) => handleInputChange('requires_ladder', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Requires ladder</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.is_refrigerated}
                          onChange={(e) => handleInputChange('is_refrigerated', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Refrigerated shelf</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              <span>Fields marked with * are required</span>
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
                onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {shelf ? 'Update Shelf' : 'Create Shelf'}
                  </div>
                )}
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelfModal;
