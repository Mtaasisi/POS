import React, { useState, useEffect } from 'react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { toast } from 'react-hot-toast';
import { X, Building, MapPin, Tag, Users, Home } from 'lucide-react';
import { storeLocationApi } from '../../../../settings/utils/storeLocationApi';
import { storageRoomApi, StorageRoom as StorageRoomType } from '../../../../settings/utils/storageRoomApi';

type StorageRoom = StorageRoomType;

interface StorageRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageRoom?: StorageRoom | null;
  onSave: (storageRoom: any) => void;
}

const StorageRoomModal: React.FC<StorageRoomModalProps> = ({ isOpen, onClose, storageRoom, onSave }) => {
  const [formData, setFormData] = useState({
    store_location_id: '',
    name: '',
    code: '',
    description: '',
    floor_level: 1,
    area_sqm: undefined as number | undefined,
    max_capacity: undefined as number | undefined,
    is_active: true,
    is_secure: false,
    requires_access_card: false,
    color_code: '',
    notes: '',
    descriptionExpanded: false,
    advancedExpanded: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeLocations, setStoreLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);



  useEffect(() => {
    loadStoreLocations();
  }, []);

  useEffect(() => {
    if (storageRoom) {
      setFormData({
        store_location_id: storageRoom.store_location_id,
        name: storageRoom.name,
        code: storageRoom.code,
        description: storageRoom.description || '',
        floor_level: storageRoom.floor_level,
        area_sqm: storageRoom.area_sqm,
        max_capacity: storageRoom.max_capacity,
        is_active: storageRoom.is_active,
        is_secure: storageRoom.is_secure,
        requires_access_card: storageRoom.requires_access_card,
        color_code: storageRoom.color_code || '',
        notes: storageRoom.notes || '',
        descriptionExpanded: false,
        advancedExpanded: false
      });
    } else {
      setFormData({
        store_location_id: '',
        name: '',
        code: '',
        description: '',
        floor_level: 1,
        area_sqm: undefined,
        max_capacity: undefined,
        is_active: true,
        is_secure: false,
        requires_access_card: false,
        color_code: '',
        notes: '',
        descriptionExpanded: false,
        advancedExpanded: false
      });
    }
    setErrors({});
  }, [storageRoom, isOpen]);

  const loadStoreLocations = async () => {
    try {
      setLoadingLocations(true);
      const locations = await storeLocationApi.getAll();
      setStoreLocations(locations);
      
      // Set default store location if none is selected and locations are available
      if (locations.length > 0 && !formData.store_location_id) {
        setFormData(prev => ({ ...prev, store_location_id: locations[0].id }));
      }
    } catch (error) {
      console.error('Error loading store locations:', error);
      toast.error('Failed to load store locations');
    } finally {
      setLoadingLocations(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.store_location_id) {
      newErrors.store_location_id = 'Store location is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Room name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Room code is required';
    }

    if (formData.max_capacity !== undefined && formData.max_capacity <= 0) {
      newErrors.max_capacity = 'Max capacity must be greater than 0';
    }

    if (formData.area_sqm !== undefined && formData.area_sqm <= 0) {
      newErrors.area_sqm = 'Area must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const storageRoomData = {
        store_location_id: formData.store_location_id,
        name: formData.name,
        code: formData.code,
        description: formData.description,
        floor_level: formData.floor_level,
        area_sqm: formData.area_sqm,
        max_capacity: formData.max_capacity,
        is_active: formData.is_active,
        is_secure: formData.is_secure,
        requires_access_card: formData.requires_access_card,
        color_code: formData.color_code,
        notes: formData.notes
      };

      if (storageRoom) {
        // Update existing storage room
        await storageRoomApi.update({
          id: storageRoom.id,
          ...storageRoomData
        });
        toast.success('Storage room updated successfully');
      } else {
        // Create new storage room
        await storageRoomApi.create(storageRoomData);
        toast.success('Storage room created successfully');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving storage room:', error);
      toast.error('Failed to save storage room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200/50 rounded-lg">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                {storageRoom ? 'Edit Storage Room' : 'Add New Storage Room'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Store Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Location *
                  </label>
                  {loadingLocations ? (
                    <div className="text-gray-500 text-sm">Loading locations...</div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {storeLocations.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          onClick={() => handleInputChange('store_location_id', location.id)}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            formData.store_location_id === location.id
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {location.name} ({location.city})
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.store_location_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.store_location_id}</p>
                  )}
                </div>

                {/* Room Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {roomTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleInputChange('room_type', type.value)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          formData.room_type === type.value
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Room Name and Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Room Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Main Storage, Electronics Room, Cold Storage"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Room Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., STOR01, COLD01, SEC01"
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                  )}
                </div>
              </div>

              {/* Advanced Fields */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Advanced Fields
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, advancedExpanded: !prev.advancedExpanded }))}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {formData.advancedExpanded ? (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </button>
                </div>
                {formData.advancedExpanded ? (
                  <div className="space-y-4">
                    {/* Capacity and Physical Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Max Capacity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Capacity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.max_capacity || ''}
                          onChange={(e) => handleInputChange('max_capacity', e.target.value ? parseInt(e.target.value) : undefined)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.max_capacity ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="1000"
                        />
                        {errors.max_capacity && (
                          <p className="mt-1 text-sm text-red-600">{errors.max_capacity}</p>
                        )}
                      </div>

                      {/* Area */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Area (sqm)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.1"
                          value={formData.area_sqm || ''}
                          onChange={(e) => handleInputChange('area_sqm', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.area_sqm ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="50.0"
                        />
                        {errors.area_sqm && (
                          <p className="mt-1 text-sm text-red-600">{errors.area_sqm}</p>
                        )}
                      </div>

                      {/* Floor Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Floor Level
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.floor_level}
                          onChange={(e) => handleInputChange('floor_level', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="1"
                        />
                      </div>
                    </div>


                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-500">
                      Capacity, area, and floor level settings
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, advancedExpanded: true }))}
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Room Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Room Features</label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-sm font-medium text-gray-700">Active</span>
                    <button
                      type="button"
                      onClick={() => handleInputChange('is_active', !formData.is_active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.is_active ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-sm font-medium text-gray-700">Secure</span>
                    <button
                      type="button"
                      onClick={() => handleInputChange('is_secure', !formData.is_secure)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.is_secure ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.is_secure ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-sm font-medium text-gray-700">Access Card</span>
                    <button
                      type="button"
                      onClick={() => handleInputChange('requires_access_card', !formData.requires_access_card)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.requires_access_card ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.requires_access_card ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, descriptionExpanded: !prev.descriptionExpanded }))}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {formData.descriptionExpanded ? (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </button>
                </div>
                {formData.descriptionExpanded ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the storage room's purpose, contents, or special requirements..."
                  />
                ) : (
                  <div className="flex items-center justify-between p-2 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-500">
                      {formData.description || "Click + to add description"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, descriptionExpanded: true }))}
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-6">
                <GlassButton
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                >
                  {isSubmitting ? 'Saving...' : (storageRoom ? 'Update Storage Room' : 'Create Storage Room')}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageRoomModal;
