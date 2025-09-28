import React, { useState, useEffect } from 'react';
import { X, MapPin, Package, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import InventoryManagementService from '@/features/lats/services/inventoryManagementService';

interface LocationAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    serial_number?: string;
    product?: { name: string };
    location?: string;
    shelf?: string;
    bin?: string;
  };
  onLocationUpdate: (itemId: string, location: string, shelf?: string, bin?: string) => Promise<void>;
  isUpdating?: boolean;
}

const LocationAssignmentModal: React.FC<LocationAssignmentModalProps> = ({
  isOpen,
  onClose,
  item,
  onLocationUpdate,
  isUpdating = false
}) => {
  const [location, setLocation] = useState(item?.location || '');
  const [shelf, setShelf] = useState(item?.shelf || '');
  const [bin, setBin] = useState(item?.bin || '');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailableLocations();
    }
  }, [isOpen]);

  const loadAvailableLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const response = await InventoryManagementService.getAvailableLocations();
      if (response.success && response.data) {
        setAvailableLocations(response.data);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) {
      toast.error('No item selected');
      return;
    }
    
    if (!location.trim()) {
      toast.error('Please enter a location');
      return;
    }

    // Check if location actually changed
    if (location === item.location && shelf === item.shelf && bin === item.bin) {
      toast.info('Location is already set to this value');
      return;
    }

    setIsSubmitting(true);
    try {
      await onLocationUpdate(item.id, location.trim(), shelf.trim() || undefined, bin.trim() || undefined);
      toast.success('Location updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error('Failed to update location');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    // Clear shelf and bin when location changes
    setShelf('');
    setBin('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Assign Location</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Item Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Product</div>
            <div className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</div>
            {item.serial_number && (
              <>
                <div className="text-sm text-gray-600 mt-2">Serial Number</div>
                <div className="font-mono text-sm text-gray-900">{item.serial_number}</div>
              </>
            )}
          </div>

          {/* Location Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location (e.g., Warehouse A, Store Room)"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                  required
                />
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              
              {/* Quick Location Selection */}
              {availableLocations.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-2">Quick select:</div>
                  <div className="flex flex-wrap gap-2">
                    {availableLocations.slice(0, 5).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleLocationSelect(loc)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                        disabled={isSubmitting}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Shelf */}
            <div>
              <label htmlFor="shelf" className="block text-sm font-medium text-gray-700 mb-2">
                Shelf Name
              </label>
              <div className="relative">
                <input
                  id="shelf"
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  placeholder="Enter shelf name (e.g., Shelf A1, Rack 3)"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
                <Package className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Bin */}
            <div>
              <label htmlFor="bin" className="block text-sm font-medium text-gray-700 mb-2">
                Bin Code
              </label>
              <div className="relative">
                <input
                  id="bin"
                  type="text"
                  value={bin}
                  onChange={(e) => setBin(e.target.value)}
                  placeholder="Enter bin code (e.g., B1, C2)"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
                <Package className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Current Location Display */}
            {(item.location || item.shelf || item.bin) && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800 font-medium mb-1">Current Location:</div>
                <div className="text-sm text-blue-700">
                  {[item.location, item.shelf, item.bin].filter(Boolean).join(' • ')}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !location.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Update Location
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LocationAssignmentModal;
