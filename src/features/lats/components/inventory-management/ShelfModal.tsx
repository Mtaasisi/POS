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
  AlertTriangle
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
    code: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Reset form when modal opens/closes or shelf changes
  useEffect(() => {
    if (isOpen) {
      if (shelf) {
        // Editing existing shelf
        setFormData({
          name: shelf.name,
          code: shelf.code
        });
      } else {
        // Creating new shelf
        setFormData({
          name: '',
          code: ''
        });
      }
      setErrors({});
      setActiveTab('basic');
    }
  }, [isOpen, shelf, storageRoom]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Shelf name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Shelf code is required';
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
        shelf_type: 'standard',
        floor_level: storageRoom?.floor_level || 1,
        is_active: true,
        is_accessible: true,
        requires_ladder: false,
        is_refrigerated: false,
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
                {/* Essential Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassInput
                    label="Shelf Name *"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={errors.name}
                    placeholder="e.g., Main Display Shelf"
                  />
                  <GlassInput
                    label="Shelf Code *"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    error={errors.code}
                    placeholder="e.g., SHELF001"
                  />
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
                onClick={handleSubmit}
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
