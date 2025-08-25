import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Building, 
  Package, 
  MapPin, 
  Users, 
  Settings, 
  Edit, 
  Trash2,
  Plus,
  Eye,
  BarChart3,
  Calendar,
  Shield,
  Key,
  Palette,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import GlassBadge from '../../../features/shared/components/ui/GlassBadge';
import { StorageRoom } from '../../../features/settings/utils/storageRoomApi';
import { StoreShelf } from '../../../features/settings/utils/storeShelfApi';
import { storageRoomApi } from '../../../features/settings/utils/storageRoomApi';
import { storeShelfApi } from '../../../features/settings/utils/storeShelfApi';
import { storeLocationApi } from '../../../features/settings/utils/storeLocationApi';
import ShelfModal from '../components/inventory-management/ShelfModal';
import { format } from 'date-fns';

const StorageRoomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [storageRoom, setStorageRoom] = useState<StorageRoom | null>(null);
  const [storeLocation, setStoreLocation] = useState<any>(null);
  const [shelves, setShelves] = useState<StoreShelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<StoreShelf | null>(null);

  useEffect(() => {
    if (id) {
      loadStorageRoomDetails();
    }
  }, [id]);

  const loadStorageRoomDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load storage room details
      const roomData = await storageRoomApi.getById(id!);
      if (!roomData) {
        throw new Error('Storage room not found');
      }
      setStorageRoom(roomData);

      // Load store location details
      if (roomData.store_location_id) {
        const locationData = await storeLocationApi.getById(roomData.store_location_id);
        setStoreLocation(locationData);
      }

      // Load shelves
      const shelvesData = await storeShelfApi.getShelvesByStorageRoom(id!);
      setShelves(shelvesData);

    } catch (err: any) {
      console.error('Error loading storage room details:', err);
      setError(err.message || 'Failed to load storage room details');
      toast.error('Failed to load storage room details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditShelf = (shelf: StoreShelf) => {
    setEditingShelf(shelf);
    setIsShelfModalOpen(true);
  };

  const handleCreateShelf = () => {
    setEditingShelf(null);
    setIsShelfModalOpen(true);
  };

  const handleShelfModalClose = () => {
    setIsShelfModalOpen(false);
    setEditingShelf(null);
  };

  const handleShelfModalSave = async () => {
    await loadStorageRoomDetails();
    handleShelfModalClose();
  };

  const handleDeleteShelf = async (shelf: StoreShelf) => {
    if (!confirm(`Are you sure you want to delete shelf "${shelf.name}"?`)) {
      return;
    }

    try {
      await storeShelfApi.delete(shelf.id);
      toast.success('Shelf deleted successfully');
      await loadStorageRoomDetails();
    } catch (error) {
      console.error('Error deleting shelf:', error);
      toast.error('Failed to delete shelf');
    }
  };

  const getCapacityPercentage = (current: number, max: number) => {
    if (!max) return 0;
    return Math.round((current / max) * 100);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading storage room details...</span>
        </div>
      </div>
    );
  }

  if (error || !storageRoom) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Storage Room Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested storage room could not be found.'}</p>
          <GlassButton onClick={() => navigate('/lats/storage-rooms')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Storage Rooms
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <GlassButton
            onClick={() => navigate('/lats/storage-rooms')}
            variant="secondary"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </GlassButton>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{storageRoom.name}</h1>
            <p className="text-gray-600">Storage Room Details</p>
          </div>
        </div>
        <div className="flex gap-3">
          <GlassButton
            onClick={() => navigate(`/lats/storage-rooms/${id}/edit`)}
            variant="secondary"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Room
          </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <GlassCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room Name</label>
                    <p className="text-gray-900 font-medium">{storageRoom.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room Code</label>
                    <p className="text-gray-900 font-mono">{storageRoom.code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-gray-900">{storageRoom.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <GlassBadge variant={storageRoom.is_active ? 'default' : 'secondary'}>
                      {storageRoom.is_active ? 'Active' : 'Inactive'}
                    </GlassBadge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Floor Level</label>
                    <p className="text-gray-900">{storageRoom.floor_level}</p>
                  </div>
                  {storageRoom.area_sqm && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Area</label>
                      <p className="text-gray-900">{storageRoom.area_sqm} m²</p>
                    </div>
                  )}
                  {storageRoom.max_capacity && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Capacity</label>
                      <p className="text-gray-900">{storageRoom.max_capacity} items</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Capacity</label>
                    <p className={`font-medium ${getCapacityColor(getCapacityPercentage(storageRoom.current_capacity, storageRoom.max_capacity || 0))}`}>
                      {storageRoom.current_capacity} items
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Location Information */}
          {storeLocation && (
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Location Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Store Location</label>
                      <p className="text-gray-900 font-medium">{storeLocation.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location Code</label>
                      <p className="text-gray-900 font-mono">{storeLocation.code}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <p className="text-gray-900">{storeLocation.city}</p>
                    </div>
                    {storeLocation.address && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <p className="text-gray-900">{storeLocation.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Security & Settings */}
          <GlassCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Security & Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Secure Room</span>
                    {storageRoom.is_secure ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Requires Access Card</span>
                    {storageRoom.requires_access_card ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {storageRoom.color_code && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Color Code</label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: storageRoom.color_code }}
                        ></div>
                        <span className="text-gray-900">{storageRoom.color_code}</span>
                      </div>
                    </div>
                  )}
                  {storageRoom.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="text-gray-900">{storageRoom.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Shelves */}
          <GlassCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Shelves ({shelves.length})</h2>
                <GlassButton
                  onClick={handleCreateShelf}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Shelf
                </GlassButton>
              </div>
              
              {shelves.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No shelves in this room</p>
                  <p className="text-gray-400 text-sm mt-2">Add your first shelf to start organizing inventory</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {shelves.map((shelf) => (
                    <div
                      key={shelf.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{shelf.name}</h4>
                            <p className="text-sm text-gray-600">Code: {shelf.code}</p>
                            {shelf.row_number && shelf.column_number && (
                              <p className="text-sm text-gray-500">
                                Position: Row {shelf.row_number}, Column {shelf.column_number}
                                {shelf.column_number > 1 && (
                                  <span className="ml-2 inline-flex items-center gap-1">
                                    <span className="text-blue-600 font-medium">{shelf.column_number} columns</span>
                                    <div className="flex gap-1">
                                      {Array.from({ length: Math.min(shelf.column_number, 5) }, (_, i) => (
                                        <div key={i} className="w-2 h-2 bg-blue-300 rounded-full"></div>
                                      ))}
                                      {shelf.column_number > 5 && <span className="text-xs text-gray-400">...</span>}
                                    </div>
                                  </span>
                                )}
                              </p>
                            )}
                            {shelf.max_capacity && (
                              <p className="text-sm text-gray-500">
                                Capacity: {shelf.current_capacity}/{shelf.max_capacity}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <GlassButton
                            onClick={() => handleEditShelf(shelf)}
                            variant="secondary"
                            size="sm"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </GlassButton>
                          <GlassButton
                            onClick={() => handleDeleteShelf(shelf)}
                            variant="secondary"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </GlassButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <GlassCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Shelves</span>
                  <span className="font-semibold text-gray-900">{shelves.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Capacity Used</span>
                  <span className={`font-semibold ${getCapacityColor(getCapacityPercentage(storageRoom.current_capacity, storageRoom.max_capacity || 0))}`}>
                    {storageRoom.max_capacity ? `${getCapacityPercentage(storageRoom.current_capacity, storageRoom.max_capacity)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <GlassBadge variant={storageRoom.is_active ? 'default' : 'secondary'}>
                    {storageRoom.is_active ? 'Active' : 'Inactive'}
                  </GlassBadge>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Created/Updated Info */}
          <GlassCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">
                    {storageRoom.created_at ? format(new Date(storageRoom.created_at), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900">
                    {storageRoom.updated_at ? format(new Date(storageRoom.updated_at), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Shelf Modal */}
      <ShelfModal
        isOpen={isShelfModalOpen}
        onClose={handleShelfModalClose}
        shelf={editingShelf}
        storageRoom={storageRoom}
        onSave={handleShelfModalSave}
      />
    </div>
  );
};

export default StorageRoomDetailPage;
