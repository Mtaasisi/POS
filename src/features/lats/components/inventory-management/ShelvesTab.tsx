import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { toast } from 'react-hot-toast';
import { Package, Plus, Edit, Trash2, Layers, Building } from 'lucide-react';

const ShelvesTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [shelves, setShelves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeLocations, setStoreLocations] = useState<any[]>([]);

  useEffect(() => {
    // Simulate loading without API calls
    setLoading(true);
    setTimeout(() => {
      setShelves([]);
      setStoreLocations([]);
      setLoading(false);
    }, 1000);
  }, []);

  const getLocationName = (locationId: string) => {
    const location = storeLocations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            Storage Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage storage shelves and rooms
          </p>
        </div>
        <div className="flex gap-3">
          <GlassButton
            onClick={() => console.log('Add shelf clicked')}
            icon={<Plus size={18} />}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
          >
            Add Shelf
          </GlassButton>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading shelves...</span>
        </div>
      ) : shelves.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Layers className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Shelves Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Get started by adding your first storage shelf. Shelves help organize your inventory by location.
          </p>
          <GlassButton
            onClick={() => console.log('Add first shelf clicked')}
            icon={<Plus size={18} />}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
          >
            Add Your First Shelf
          </GlassButton>
        </div>
      ) : (
        <div className="space-y-4">
          {shelves.map((shelf) => (
            <div
              key={shelf.id}
              className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{shelf.name}</h3>
                    <p className="text-sm text-gray-600">Code: {shelf.code}</p>
                    <p className="text-sm text-gray-500">
                      Location: {getLocationName(shelf.store_location_id)}
                    </p>
                    {shelf.max_capacity && (
                      <p className="text-sm text-gray-500">
                        Capacity: {shelf.current_capacity}/{shelf.max_capacity}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GlassButton
                    onClick={() => console.log('Edit shelf clicked')}
                    variant="secondary"
                    size="sm"
                    icon={<Edit size={14} />}
                  >
                    Edit
                  </GlassButton>
                  <GlassButton
                    onClick={() => console.log('Delete shelf clicked')}
                    variant="secondary"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </GlassButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default ShelvesTab;
