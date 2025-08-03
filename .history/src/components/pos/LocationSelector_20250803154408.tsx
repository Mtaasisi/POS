import React, { useState } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { MapPin, Building, Users, Package, DollarSign, Settings } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: 'active' | 'inactive' | 'maintenance';
  salesToday: number;
  customersToday: number;
  inventoryCount: number;
}

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: Location) => void;
  currentLocation?: Location;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ 
  isOpen, 
  onClose, 
  onLocationSelect, 
  currentLocation 
}) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(currentLocation || null);

  // Mock locations - replace with real API data
  const locations: Location[] = [
    {
      id: '1',
      name: 'Main Repair Center',
      address: '123 Tech Street, Lagos',
      phone: '+234 801 234 5678',
      manager: 'John Doe',
      status: 'active',
      salesToday: 125000,
      customersToday: 12,
      inventoryCount: 450
    },
    {
      id: '2',
      name: 'Victoria Island Branch',
      address: '456 Business Ave, Victoria Island',
      phone: '+234 802 345 6789',
      manager: 'Jane Smith',
      status: 'active',
      salesToday: 89000,
      customersToday: 8,
      inventoryCount: 320
    },
    {
      id: '3',
      name: 'Ikeja Service Center',
      address: '789 Service Road, Ikeja',
      phone: '+234 803 456 7890',
      manager: 'Mike Johnson',
      status: 'maintenance',
      salesToday: 0,
      customersToday: 0,
      inventoryCount: 280
    },
    {
      id: '4',
      name: 'Lekki Express',
      address: '321 Express Way, Lekki',
      phone: '+234 804 567 8901',
      manager: 'Sarah Wilson',
      status: 'active',
      salesToday: 156000,
      customersToday: 15,
      inventoryCount: 520
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'inactive':
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
      case 'maintenance':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="max-w-4xl w-full mx-4">
        <GlassCard className="bg-white/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Building size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Select Location</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Current Location Info */}
          {currentLocation && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">Current Location</h3>
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">{currentLocation.name}</p>
                  <p className="text-sm text-blue-700">{currentLocation.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((location) => (
              <GlassCard
                key={location.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedLocation?.id === location.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedLocation(location)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building size={20} className="text-gray-600" />
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(location.status)}
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(location.status)}`}>
                      {location.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} />
                    <span>{location.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={14} />
                    <span>{location.manager}</span>
                  </div>
                </div>

                {/* Location Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <DollarSign size={16} className="text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Sales Today</p>
                    <p className="font-semibold text-sm">₦{location.salesToday.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <Users size={16} className="text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Customers</p>
                    <p className="font-semibold text-sm">{location.customersToday}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <Package size={16} className="text-purple-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Inventory</p>
                    <p className="font-semibold text-sm">{location.inventoryCount}</p>
                  </div>
                </div>

                {location.status === 'maintenance' && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
                    <p className="text-xs text-yellow-800">⚠️ Under Maintenance</p>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <GlassButton
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={() => {
                if (selectedLocation) {
                  onLocationSelect(selectedLocation);
                  onClose();
                }
              }}
              disabled={!selectedLocation}
            >
              Switch to {selectedLocation?.name || 'Location'}
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default LocationSelector; 