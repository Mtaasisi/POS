import React, { useState, useEffect } from 'react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { toast } from 'react-hot-toast';
import { X, Building, MapPin, Tag, Users, Home, Palette, FileText, Settings, Grid3X3 } from 'lucide-react';
import { storeLocationApi } from '../../../../features/settings/utils/storeLocationApi';
import { storageRoomApi, StorageRoom as StorageRoomType } from '../../../../features/settings/utils/storageRoomApi';
import { storeShelfApi } from '../../../../features/settings/utils/storeShelfApi';

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
    advancedExpanded: false,
    rowsPerColumn: 3,
    columnsPerRow: 3,
    createShelves: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeLocations, setStoreLocations] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadStoreLocations();
    }
  }, [isOpen]);

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
        advancedExpanded: false,
        createShelves: 0,
        rowsPerColumn: 3,
        columnsPerRow: 3
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
        advancedExpanded: false,
        createShelves: 0,
        rowsPerColumn: 3,
        columnsPerRow: 3
      });
    }
    setErrors({});
  }, [storageRoom, isOpen]);

  const loadStoreLocations = async () => {
    try {
      const locations = await storeLocationApi.getAll();
      setStoreLocations(locations);
      
      // Set default store location if none is selected and locations are available
      if (locations.length > 0 && !formData.store_location_id) {
        setFormData(prev => ({ ...prev, store_location_id: locations[0].id }));
      }
    } catch (error) {
      console.error('Error loading store locations:', error);
      // Silent error handling - no toast notification
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

    // Validate color code format if provided
    if (formData.color_code && !/^#[0-9A-F]{6}$/i.test(formData.color_code)) {
      newErrors.color_code = 'Color code must be a valid hex color (e.g., #3B82F6)';
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

      let createdRoomId: string | undefined;

      if (storageRoom) {
        // Update existing storage room
        await storageRoomApi.update({
          id: storageRoom.id,
          ...storageRoomData
        });
        toast.success('Storage room updated successfully');
      } else {
        // Create new storage room
        const result = await storageRoomApi.create(storageRoomData);
        createdRoomId = result?.id;
        toast.success('Storage room created successfully');
        
        // Create shelves based on rows and columns
        if (formData.rowsPerColumn > 0 && formData.columnsPerRow > 0 && createdRoomId) {
          const shelfPromises = [];
          const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
          const totalShelves = formData.rowsPerColumn * formData.columnsPerRow;
          
          for (let rowIndex = 0; rowIndex < formData.rowsPerColumn; rowIndex++) {
            for (let colIndex = 0; colIndex < formData.columnsPerRow; colIndex++) {
              const row = rows[rowIndex];
              const column = colIndex + 1;
              
              const shelfData = {
                store_location_id: formData.store_location_id,
                storage_room_id: createdRoomId,
                name: `${formData.code}${row}${column}`,
                code: `${formData.code}${row}${column}`,
                shelf_type: 'standard',
                floor_level: formData.floor_level,
                is_active: true,
                is_accessible: true,
                requires_ladder: false,
                is_refrigerated: false,
                priority_order: (rowIndex * formData.columnsPerRow) + colIndex + 1
              };
              shelfPromises.push(storeShelfApi.create(shelfData));
            }
          }
          
          try {
            await Promise.all(shelfPromises);
            toast.success(`${formData.rowsPerColumn * formData.columnsPerRow} shelves created successfully`);
          } catch (shelfError) {
            console.error('Error creating shelves:', shelfError);
            toast.error('Storage room created but failed to create some shelves');
          }
        }
      }
      
      onSave(storageRoomData);
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200/50 rounded-lg">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {storageRoom ? 'Edit Storage Room' : 'Add New Storage Room'}
                </h2>
                {storageRoom && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      storageRoom.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {storageRoom.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {storageRoom.is_secure && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Secure
                      </span>
                    )}
                    {storageRoom.requires_access_card && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Access Card Required
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

                        {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Current Status Info for Edit Mode */}
                {storageRoom && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Current Storage Room Status</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700">Current Capacity:</span>
                            <div className="font-medium text-blue-900">
                              {storageRoom.current_capacity} / {storageRoom.max_capacity || '∞'}
                            </div>
                          </div>
                          <div>
                            <span className="text-blue-700">Total Shelves:</span>
                            <div className="font-medium text-blue-900">
                              {/* This would need to be fetched separately */}
                              N/A
                            </div>
                          </div>
                          <div>
                            <span className="text-blue-700">Floor Level:</span>
                            <div className="font-medium text-blue-900">{storageRoom.floor_level}</div>
                          </div>
                          <div>
                            <span className="text-blue-700">Area:</span>
                            <div className="font-medium text-blue-900">
                              {storageRoom.area_sqm ? `${storageRoom.area_sqm} sqm` : 'Not specified'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    placeholder="Enter room name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Room Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., STOR001"
                  />
                  {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                </div>

                {/* Store Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Location *
                  </label>
                  <select
                    value={formData.store_location_id}
                    onChange={(e) => handleInputChange('store_location_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.store_location_id ? 'border-red-500' : 'border-gray-300'
                    }`}

                  >
                    <option value="">Select a store location</option>
                    {storeLocations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  {errors.store_location_id && <p className="text-red-500 text-sm mt-1">{errors.store_location_id}</p>}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Physical Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area (sqm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.area_sqm || ''}
                    onChange={(e) => handleInputChange('area_sqm', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.area_sqm ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter area in square meters"
                  />
                  {errors.area_sqm && <p className="text-red-500 text-sm mt-1">{errors.area_sqm}</p>}
                </div>

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
                    placeholder="Enter maximum capacity"
                  />
                  {errors.max_capacity && <p className="text-red-500 text-sm mt-1">{errors.max_capacity}</p>}
                </div>
              </div>



              {/* Shelf Layout Configuration (only for new rooms) */}
              {!storageRoom && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Grid3X3 className="w-5 h-5 text-blue-500" />
                    <h4 className="text-sm font-medium text-gray-700">Shelf Layout Configuration</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Number of Rows */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Rows (A, B, C...)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.rowsPerColumn}
                        onChange={(e) => handleInputChange('rowsPerColumn', parseInt(e.target.value) || 3)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Number of rows (1-10)"
                      />
                    </div>

                    {/* Number of Columns */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Columns (1, 2, 3...)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.columnsPerRow}
                        onChange={(e) => handleInputChange('columnsPerRow', parseInt(e.target.value) || 3)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Number of columns (1-20)"
                      />
                    </div>
                  </div>

                  {/* Shelf Layout Preview */}
                  {formData.rowsPerColumn > 0 && formData.columnsPerRow > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shelf Layout Preview
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Layout:</strong> {formData.rowsPerColumn} rows × {formData.columnsPerRow} columns = {formData.rowsPerColumn * formData.columnsPerRow} total shelves
                        </p>
                        <p className="text-xs text-gray-600">
                          <strong>Naming Pattern:</strong> {formData.code}[Row][Column]
                          <br />
                          <strong>Example:</strong> {formData.code}A1, {formData.code}A2, {formData.code}A3, {formData.code}B1, {formData.code}B2, {formData.code}B3, etc.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Existing Shelves Info (only for edit mode) */}
              {storageRoom && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Grid3X3 className="w-5 h-5 text-green-500" />
                    <h4 className="text-sm font-medium text-gray-700">Existing Shelves</h4>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 mb-2">
                      <strong>Note:</strong> This storage room already has shelves configured.
                    </p>
                    <p className="text-xs text-green-700">
                      To manage existing shelves, use the "Manage Shelves" option from the storage room list.
                      You can add, edit, or remove individual shelves as needed.
                    </p>
                  </div>
                </div>
              )}

              {/* Advanced Settings */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => handleInputChange('advancedExpanded', !formData.advancedExpanded)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Advanced Settings
                  <span className={`transform transition-transform ${formData.advancedExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {formData.advancedExpanded && (
                  <div className="mt-4 space-y-6">
                    {/* Security Settings */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Security & Access</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-sm font-medium text-gray-700">Active</span>
                          <button
                            type="button"
                            onClick={() => handleInputChange('is_active', !formData.is_active)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              formData.is_active ? 'bg-green-500' : 'bg-gray-300'
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
                              formData.is_secure ? 'bg-red-500' : 'bg-gray-300'
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
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the storage room's purpose, contents, or special requirements..."
                />
              </div>

              {/* Color Code and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Color Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="w-4 h-4 inline mr-2" />
                    Color Code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color_code || '#3B82F6'}
                      onChange={(e) => handleInputChange('color_code', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color_code}
                      onChange={(e) => handleInputChange('color_code', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.color_code ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="#3B82F6"
                    />
                  </div>
                  {errors.color_code && <p className="text-red-500 text-sm mt-1">{errors.color_code}</p>}
                  <p className="text-xs text-gray-500 mt-1">Used for visual organization and identification</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes, special instructions, or reminders..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-6">
                <GlassButton
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
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
