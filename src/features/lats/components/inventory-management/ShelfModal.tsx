import React, { useState, useEffect } from 'react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { toast } from 'react-hot-toast';
import { X, Package, MapPin, Building, Tag, Users } from 'lucide-react';
import { StoreShelf, storeShelfApi } from '../../../../settings/utils/storeShelfApi';
import { storeLocationApi } from '../../../../settings/utils/storeLocationApi';

interface ShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  shelf?: StoreShelf | null;
  onSave: (shelf: any) => void;
  onSaveStorageRoom?: (storageRoom: any) => void;
}

const ShelfModal: React.FC<ShelfModalProps> = ({ isOpen, onClose, shelf, onSave, onSaveStorageRoom }) => {
  const [formData, setFormData] = useState({
    store_location_id: '',
    name: '',
    row: '',
    column: '',
    columns: [] as string[],
    description: '',
    aisle: '',
    row_number: undefined as number | undefined,
    column_number: undefined as number | undefined,
    width_cm: undefined as number | undefined,
    height_cm: undefined as number | undefined,
    max_weight_kg: undefined as number | undefined,
    max_capacity: undefined as number | undefined,
    floor_level: 1,
    zone: '' as string,
    is_active: true,
    is_accessible: true,
    requires_ladder: false,
    color_code: '',
    barcode: '',
    descriptionExpanded: false,
    advancedExpanded: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeLocations, setStoreLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [activeTab, setActiveTab] = useState<'shelf' | 'storage-room'>('shelf');

  // Zones
  const zones = [
    { value: 'store-a', label: 'Store A' },
    { value: 'store-b', label: 'Store B' },
    { value: 'store-c', label: 'Store C' }
  ];

  // Storage room form data
  const [storageRoomFormData, setStorageRoomFormData] = useState({
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





  useEffect(() => {
    loadStoreLocations();
  }, []);

  useEffect(() => {
    if (shelf) {
      // Extract shelf name and column from existing shelf code (e.g., "A1" -> row="A", column="1")
      let row = '';
      let column = '';
      if (shelf.code && shelf.code.length >= 2) {
        row = shelf.code.charAt(0);
        column = shelf.code.charAt(1);
      }

      setFormData({
        store_location_id: shelf.store_location_id,
        name: shelf.name,
        row: row,
        column: column,
        columns: [column],
        description: shelf.description || '',
        aisle: shelf.aisle || '',
        row_number: shelf.row_number,
        column_number: shelf.column_number,
        width_cm: shelf.width_cm,
        height_cm: shelf.height_cm,
        max_weight_kg: shelf.max_weight_kg,
        max_capacity: shelf.max_capacity,
        floor_level: shelf.floor_level,
        zone: shelf.zone || '',
        is_active: shelf.is_active,
        is_accessible: shelf.is_accessible,
        requires_ladder: shelf.requires_ladder,
        color_code: shelf.color_code || '',
        barcode: shelf.barcode || '',
        descriptionExpanded: false,
        advancedExpanded: false
      });
    } else {
      setFormData({
        store_location_id: '',
        name: '',
        row: '',
        column: '',
        columns: [],
        description: '',
        aisle: '',
        row_number: undefined,
        column_number: undefined,
        width_cm: undefined,
        height_cm: undefined,
        max_weight_kg: undefined,
        max_capacity: undefined,
        floor_level: 1,
        zone: '',
        is_active: true,
        is_accessible: true,
        requires_ladder: false,
        color_code: '',
        barcode: '',
        descriptionExpanded: false,
        advancedExpanded: false
      });
    }

    // Reset storage room form when modal opens
    if (!shelf) {
      setStorageRoomFormData({
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
  }, [shelf, isOpen]);

  const loadStoreLocations = async () => {
    try {
      setLoadingLocations(true);
      const locations = await storeLocationApi.getAll();
      setStoreLocations(locations);
      
      // Set default store location if none is selected and locations are available
      if (locations.length > 0) {
        if (!formData.store_location_id) {
          setFormData(prev => ({ ...prev, store_location_id: locations[0].id }));
        }
        if (!storageRoomFormData.store_location_id) {
          setStorageRoomFormData(prev => ({ ...prev, store_location_id: locations[0].id }));
        }
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
      newErrors.name = 'Shelf name is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Shelf name is required';
    }

    if (!formData.columns || formData.columns.length === 0) {
      newErrors.column = 'At least one column is required';
    }



    if (formData.max_capacity !== undefined && formData.max_capacity <= 0) {
      newErrors.max_capacity = 'Max capacity must be greater than 0';
    }

    if (formData.max_weight_kg !== undefined && formData.max_weight_kg <= 0) {
      newErrors.max_weight_kg = 'Max weight must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStorageRoomForm = () => {
    const newErrors: Record<string, string> = {};

    if (!storageRoomFormData.store_location_id) {
      newErrors.store_location_id = 'Store location is required';
    }

    if (!storageRoomFormData.name.trim()) {
      newErrors.name = 'Room name is required';
    }

    if (!storageRoomFormData.code.trim()) {
      newErrors.code = 'Room code is required';
    }

    if (storageRoomFormData.max_capacity !== undefined && storageRoomFormData.max_capacity <= 0) {
      newErrors.max_capacity = 'Max capacity must be greater than 0';
    }

    if (storageRoomFormData.area_sqm !== undefined && storageRoomFormData.area_sqm <= 0) {
      newErrors.area_sqm = 'Area must be greater than 0';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'shelf') {
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      
      try {
        await onSave(formData);
        toast.success(shelf ? 'Shelf updated successfully' : 'Shelf created successfully');
        onClose();
      } catch (error) {
        toast.error('Failed to save shelf');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!validateStorageRoomForm()) {
        return;
      }

      setIsSubmitting(true);
      
      try {
        const storageRoomData = {
          ...storageRoomFormData
        };

        if (onSaveStorageRoom) {
          await onSaveStorageRoom(storageRoomData);
          toast.success('Storage room created successfully');
          onClose();
        }
      } catch (error) {
        toast.error('Failed to save storage room');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleStorageRoomInputChange = (field: string, value: any) => {
    setStorageRoomFormData(prev => ({ ...prev, [field]: value }));
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
              {activeTab === 'shelf' ? (
                <Package className="h-6 w-6 text-blue-500" />
              ) : (
                <Building className="h-6 w-6 text-green-500" />
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {shelf ? 'Edit Shelf' : activeTab === 'shelf' ? 'Add New Shelf' : 'Add New Storage Room'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          {!shelf && (
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('shelf')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'shelf'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Shelf
              </button>
              <button
                onClick={() => setActiveTab('storage-room')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'storage-room'
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building className="w-4 h-4 inline mr-2" />
                Storage Room
              </button>
            </div>
          )}

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

              {/* Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone
                </label>
                <div className="flex gap-2">
                  {zones.map((zone) => (
                    <button
                      key={zone.value}
                      type="button"
                      onClick={() => handleInputChange('zone', zone.value)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        formData.zone === zone.value
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {zone.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Columns */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Columns *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newColumns = [...(formData.columns || []), ''];
                    setFormData(prev => ({ ...prev, columns: newColumns }));
                  }}
                  className="px-2 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  + Add Column
                </button>
              </div>
              <div className="space-y-2">
                {(formData.columns || []).map((column, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={column}
                      onChange={(e) => {
                        const newColumns = [...(formData.columns || [])];
                        newColumns[index] = e.target.value;
                        setFormData(prev => ({ ...prev, columns: newColumns }));
                      }}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.column ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={`Column ${index + 1} (e.g., ${index + 1}, A, B, C)`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newColumns = (formData.columns || []).filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, columns: newColumns }));
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                {(!formData.columns || formData.columns.length === 0) && (
                  <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <p>No columns added yet</p>
                    <p className="text-sm">Click "Add Column" to get started</p>
                  </div>
                )}
              </div>
              {errors.column && (
                <p className="mt-1 text-sm text-red-600">{errors.column}</p>
              )}
            </div>





            {/* Shelf Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shelf Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Electronics, Tools, Cables"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
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
                        placeholder="100"
                      />
                      {errors.max_capacity && (
                        <p className="mt-1 text-sm text-red-600">{errors.max_capacity}</p>
                      )}
                    </div>

                    {/* Max Weight */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Weight (kg)
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={formData.max_weight_kg || ''}
                        onChange={(e) => handleInputChange('max_weight_kg', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.max_weight_kg ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="50.0"
                      />
                      {errors.max_weight_kg && (
                        <p className="mt-1 text-sm text-red-600">{errors.max_weight_kg}</p>
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

                  {/* Physical Dimensions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Width */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Width (cm)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.width_cm || ''}
                        onChange={(e) => handleInputChange('width_cm', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="100"
                      />
                    </div>

                    {/* Height */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.height_cm || ''}
                        onChange={(e) => handleInputChange('height_cm', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="200"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 border border-gray-300 rounded-lg bg-gray-50">
                  <span className="text-sm text-gray-500">
                    Capacity, weight, dimensions, and floor level settings
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

            {/* Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Settings</label>
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
                  <span className="text-sm font-medium text-gray-700">Accessible</span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('is_accessible', !formData.is_accessible)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.is_accessible ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_accessible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-sm font-medium text-gray-700">Requires Ladder</span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('requires_ladder', !formData.requires_ladder)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.requires_ladder ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.requires_ladder ? 'translate-x-6' : 'translate-x-1'
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
                  placeholder="Describe the shelf's purpose, contents, or special requirements..."
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

            {/* Storage Room Form */}
            {activeTab === 'storage-room' && !shelf && (
              <div className="space-y-6">
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
                            onClick={() => handleStorageRoomInputChange('store_location_id', location.id)}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                              storageRoomFormData.store_location_id === location.id
                                ? 'bg-green-500 text-white border-green-500'
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
                          onClick={() => handleStorageRoomInputChange('room_type', type.value)}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            storageRoomFormData.room_type === type.value
                              ? 'bg-green-500 text-white border-green-500'
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
                      value={storageRoomFormData.name}
                      onChange={(e) => handleStorageRoomInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
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
                      value={storageRoomFormData.code}
                      onChange={(e) => handleStorageRoomInputChange('code', e.target.value.toUpperCase())}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
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
                      onClick={() => setStorageRoomFormData(prev => ({ ...prev, advancedExpanded: !prev.advancedExpanded }))}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      {storageRoomFormData.advancedExpanded ? (
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
                  {storageRoomFormData.advancedExpanded ? (
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
                            value={storageRoomFormData.max_capacity || ''}
                            onChange={(e) => handleStorageRoomInputChange('max_capacity', e.target.value ? parseInt(e.target.value) : undefined)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
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
                            value={storageRoomFormData.area_sqm || ''}
                            onChange={(e) => handleStorageRoomInputChange('area_sqm', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
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
                            value={storageRoomFormData.floor_level}
                            onChange={(e) => handleStorageRoomInputChange('floor_level', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="1"
                          />
                        </div>
                      </div>

                      {/* Temperature Range */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Min Temperature (°C)
                          </label>
                          <input
                            type="number"
                            value={storageRoomFormData.temperature_min || ''}
                            onChange={(e) => handleStorageRoomInputChange('temperature_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="-10"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Temperature (°C)
                          </label>
                          <input
                            type="number"
                            value={storageRoomFormData.temperature_max || ''}
                            onChange={(e) => handleStorageRoomInputChange('temperature_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              errors.temperature_max ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="25"
                          />
                          {errors.temperature_max && (
                            <p className="mt-1 text-sm text-red-600">{errors.temperature_max}</p>
                          )}
                        </div>
                      </div>

                      {/* Humidity Range */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Min Humidity (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={storageRoomFormData.humidity_min || ''}
                            onChange={(e) => handleStorageRoomInputChange('humidity_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="30"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Humidity (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={storageRoomFormData.humidity_max || ''}
                            onChange={(e) => handleStorageRoomInputChange('humidity_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              errors.humidity_max ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="70"
                          />
                          {errors.humidity_max && (
                            <p className="mt-1 text-sm text-red-600">{errors.humidity_max}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-500">
                        Capacity, area, floor level, temperature, and humidity settings
                      </span>
                      <button
                        type="button"
                        onClick={() => setStorageRoomFormData(prev => ({ ...prev, advancedExpanded: true }))}
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-sm font-medium text-gray-700">Active</span>
                      <button
                        type="button"
                        onClick={() => handleStorageRoomInputChange('is_active', !storageRoomFormData.is_active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          storageRoomFormData.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            storageRoomFormData.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-sm font-medium text-gray-700">Secure</span>
                      <button
                        type="button"
                        onClick={() => handleStorageRoomInputChange('is_secure', !storageRoomFormData.is_secure)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          storageRoomFormData.is_secure ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            storageRoomFormData.is_secure ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-sm font-medium text-gray-700">Access Card</span>
                      <button
                        type="button"
                        onClick={() => handleStorageRoomInputChange('requires_access_card', !storageRoomFormData.requires_access_card)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          storageRoomFormData.requires_access_card ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            storageRoomFormData.requires_access_card ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-sm font-medium text-gray-700">Climate Control</span>
                      <button
                        type="button"
                        onClick={() => handleStorageRoomInputChange('has_climate_control', !storageRoomFormData.has_climate_control)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          storageRoomFormData.has_climate_control ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            storageRoomFormData.has_climate_control ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-sm font-medium text-gray-700">Ventilation</span>
                      <button
                        type="button"
                        onClick={() => handleStorageRoomInputChange('has_ventilation', !storageRoomFormData.has_ventilation)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          storageRoomFormData.has_ventilation ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            storageRoomFormData.has_ventilation ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-sm font-medium text-gray-700">Lighting</span>
                      <button
                        type="button"
                        onClick={() => handleStorageRoomInputChange('has_lighting', !storageRoomFormData.has_lighting)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          storageRoomFormData.has_lighting ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            storageRoomFormData.has_lighting ? 'translate-x-6' : 'translate-x-1'
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
                      onClick={() => setStorageRoomFormData(prev => ({ ...prev, descriptionExpanded: !prev.descriptionExpanded }))}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      {storageRoomFormData.descriptionExpanded ? (
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
                  {storageRoomFormData.descriptionExpanded ? (
                    <textarea
                      value={storageRoomFormData.description}
                      onChange={(e) => handleStorageRoomInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Describe the storage room's purpose, contents, or special requirements..."
                    />
                  ) : (
                    <div className="flex items-center justify-between p-2 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-500">
                        {storageRoomFormData.description || "Click + to add description"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStorageRoomFormData(prev => ({ ...prev, descriptionExpanded: true }))}
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                className={activeTab === 'storage-room' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}
              >
                {isSubmitting ? 'Saving...' : (
                  activeTab === 'storage-room' ? 'Create Storage Room' : (shelf ? 'Update Shelf' : 'Create Shelf')
                )}
              </GlassButton>
            </div>
            </form>
          </div>


        </div>
      </div>
    </div>
  );
};

export default ShelfModal;
