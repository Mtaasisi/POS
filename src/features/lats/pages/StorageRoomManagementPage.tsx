import React, { useState, useEffect } from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Building, 
  MapPin, 
  Users, 
  Package, 
  Shield, 
  Edit, 
  Trash2,
  Filter,
  RefreshCw
} from 'lucide-react';
import { storageRoomApi, StorageRoom } from '../../settings/utils/storageRoomApi';
import { storeLocationApi } from '../../settings/utils/storeLocationApi';
import StorageRoomModal from '../components/inventory-management/StorageRoomModal';

interface StoreLocation {
  id: string;
  name: string;
  city: string;
}

const StorageRoomManagementPage: React.FC = () => {
  const [storageRooms, setStorageRooms] = useState<StorageRoom[]>([]);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<StorageRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<StorageRoom | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    secure: 0,
    totalCapacity: 0,
    usedCapacity: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [storageRooms, searchQuery, selectedLocation, selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsData, locationsData, statsData] = await Promise.all([
        storageRoomApi.getAll(),
        storeLocationApi.getAll(),
        storageRoomApi.getStats()
      ]);
      
      setStorageRooms(roomsData);
      setStoreLocations(locationsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load storage rooms');
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = storageRooms;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(room => room.store_location_id === selectedLocation);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'active') {
        filtered = filtered.filter(room => room.is_active);
      } else if (selectedStatus === 'inactive') {
        filtered = filtered.filter(room => !room.is_active);
      } else if (selectedStatus === 'secure') {
        filtered = filtered.filter(room => room.is_secure);
      }
    }

    setFilteredRooms(filtered);
  };

  const handleCreateRoom = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleEditRoom = (room: StorageRoom) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleDeleteRoom = async (room: StorageRoom) => {
    if (!confirm(`Are you sure you want to delete "${room.name}"?`)) {
      return;
    }

    try {
      await storageRoomApi.delete(room.id);
      toast.success('Storage room deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting storage room:', error);
      toast.error('Failed to delete storage room');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleModalSave = async () => {
    await loadData();
    handleModalClose();
  };

  const getLocationName = (locationId: string) => {
    const location = storeLocations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Storage Room Management</h1>
          <p className="text-gray-600 mt-2">Manage storage rooms and their capacity</p>
        </div>
        <GlassButton
          onClick={handleCreateRoom}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Storage Room
        </GlassButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center">
            <Building className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Active Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Secure Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{stats.secure}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCapacity}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Used Capacity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.usedCapacity}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search storage rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {storeLocations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-32">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="secure">Secure</option>
            </select>
          </div>

          {/* Refresh Button */}
          <GlassButton
            onClick={loadData}
            variant="secondary"
            className="w-full md:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </GlassButton>
        </div>
      </GlassCard>

      {/* Storage Rooms List */}
      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Capacity</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map(room => (
                <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{room.name}</p>
                      {room.description && (
                        <p className="text-sm text-gray-500">{room.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {room.code}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-600">{getLocationName(room.store_location_id)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {room.current_capacity} / {room.max_capacity || '∞'}
                        </span>
                        {room.max_capacity && (
                          <span className={`font-medium ${getCapacityColor(getCapacityPercentage(room.current_capacity, room.max_capacity))}`}>
                            {getCapacityPercentage(room.current_capacity, room.max_capacity)}%
                          </span>
                        )}
                      </div>
                      {room.max_capacity && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              getCapacityPercentage(room.current_capacity, room.max_capacity) >= 90
                                ? 'bg-red-500'
                                : getCapacityPercentage(room.current_capacity, room.max_capacity) >= 75
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min(getCapacityPercentage(room.current_capacity, room.max_capacity), 100)}%`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        room.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {room.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {room.is_secure && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Secure
                        </span>
                      )}
                      {room.requires_access_card && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Access Card
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditRoom(room)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRooms.length === 0 && (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No storage rooms found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery || selectedLocation !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first storage room to get started'
                }
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Storage Room Modal */}
      <StorageRoomModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        storageRoom={editingRoom}
        onSave={handleModalSave}
      />
    </div>
  );
};

export default StorageRoomManagementPage;
