import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
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
  RefreshCw,
  X,
  Eye,
  Grid3X3,
  Layers,
  Settings,
  BarChart3,
  QrCode,
  Archive
} from 'lucide-react';
import { storageRoomApi, StorageRoom } from '../../../features/settings/utils/storageRoomApi';
import { storeLocationApi } from '../../../features/settings/utils/storeLocationApi';
import { storeShelfApi, StoreShelf, CreateStoreShelfData } from '../../../features/settings/utils/storeShelfApi';
import StorageRoomModal from '../components/inventory-management/StorageRoomModal';
import ShelfModal from '../components/inventory-management/ShelfModal';

interface StoreLocation {
  id: string;
  name: string;
  city: string;
}

const StorageRoomManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [storageRooms, setStorageRooms] = useState<StorageRoom[]>([]);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<StorageRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<StorageRoom | null>(null);
  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<StoreShelf | null>(null);
  const [selectedRoomForShelves, setSelectedRoomForShelves] = useState<StorageRoom | null>(null);
  const [roomShelves, setRoomShelves] = useState<StoreShelf[]>([]);
  const [loadingShelves, setLoadingShelves] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showShelfDetails, setShowShelfDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    secure: 0,
    totalCapacity: 0,
    usedCapacity: 0,
    totalShelves: 0,
    activeShelves: 0
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
      toast.error('Failed to load storage room data');
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
    if (!confirm(`Are you sure you want to delete "${room.name}"? This will also delete all associated shelves.`)) {
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

  const handleManageShelves = async (room: StorageRoom) => {
    setSelectedRoomForShelves(room);
    setShowShelfDetails(true);
    await loadRoomShelves(room.id);
  };

  const loadRoomShelves = async (roomId: string) => {
    try {
      setLoadingShelves(true);
      const shelves = await storeShelfApi.getShelvesByStorageRoom(roomId);
      setRoomShelves(shelves);
    } catch (error) {
      console.error('Error loading room shelves:', error);
      toast.error('Failed to load shelves');
    } finally {
      setLoadingShelves(false);
    }
  };

  const handleCreateShelf = () => {
    setEditingShelf(null);
    setIsShelfModalOpen(true);
  };

  const handleEditShelf = (shelf: StoreShelf) => {
    setEditingShelf(shelf);
    setIsShelfModalOpen(true);
  };

  const handleDeleteShelf = async (shelf: StoreShelf) => {
    if (!confirm(`Are you sure you want to delete shelf "${shelf.name}"?`)) {
      return;
    }

    try {
      await storeShelfApi.delete(shelf.id);
      toast.success('Shelf deleted successfully');
      if (selectedRoomForShelves) {
        await loadRoomShelves(selectedRoomForShelves.id);
      }
    } catch (error) {
      console.error('Error deleting shelf:', error);
      toast.error('Failed to delete shelf');
    }
  };

  const handleShelfModalClose = () => {
    setIsShelfModalOpen(false);
    setEditingShelf(null);
  };

  const handleShelfModalSave = async (shelfData: CreateStoreShelfData) => {
    try {
      if (editingShelf) {
        // Update existing shelf
        await storeShelfApi.update(editingShelf.id, shelfData);
        toast.success('Shelf updated successfully');
      } else {
        // Create new shelf
        await storeShelfApi.create(shelfData);
        toast.success('Shelf created successfully');
      }
      
      // Reload shelves for the current room
      if (selectedRoomForShelves) {
        await loadRoomShelves(selectedRoomForShelves.id);
      }
    } catch (error) {
      console.error('Error saving shelf:', error);
      toast.error('Failed to save shelf');
    }
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

  const getCapacityBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatShelfName = (shelfName: string) => {
    // Extract room code, row, and column from shelf name (e.g., "Shop01A1")
    const match = shelfName.match(/^(.+?)([A-Z])(\d+)$/);
    if (match) {
      const [, roomCode, row, column] = match;
      return (
        <span className="font-mono">
          <span className="text-blue-600">{roomCode}</span>
          <span className="text-green-600">{row}</span>
          <span className="text-purple-600">{column}</span>
        </span>
      );
    }
    return shelfName;
  };

  const sortShelvesByPosition = (shelves: StoreShelf[]) => {
    return shelves.sort((a, b) => {
      // Extract row and column from shelf names
      const aMatch = a.name.match(/^(.+?)([A-Z])(\d+)$/);
      const bMatch = b.name.match(/^(.+?)([A-Z])(\d+)$/);
      
      if (aMatch && bMatch) {
        const [, , aRow, aCol] = aMatch;
        const [, , bRow, bCol] = bMatch;
        
        // Sort by row first (A, B, C...), then by column (1, 2, 3...)
        if (aRow !== bRow) {
          return aRow.localeCompare(bRow);
        }
        return parseInt(aCol) - parseInt(bCol);
      }
      
      return a.name.localeCompare(b.name);
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Storage Room Management</h1>
          <p className="text-gray-600 mt-2">Organize and manage storage rooms with intelligent shelf numbering</p>
        </div>
        <div className="flex gap-3">
          <GlassButton
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            {viewMode === 'list' ? <Grid3X3 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            {viewMode === 'list' ? 'Grid View' : 'List View'}
          </GlassButton>
          <GlassButton
            onClick={handleCreateRoom}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Storage Room
          </GlassButton>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <BarChart3 className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Capacity Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalCapacity > 0 ? Math.round((stats.usedCapacity / stats.totalCapacity) * 100) : 0}%
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search storage rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {storeLocations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="secure">Secure</option>
            </select>
            
            <GlassButton
              onClick={loadData}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Storage Rooms List/Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No storage rooms found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedLocation !== 'all' || selectedStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first storage room'
            }
          </p>
          {!searchQuery && selectedLocation === 'all' && selectedStatus === 'all' && (
            <GlassButton onClick={handleCreateRoom} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create First Storage Room
            </GlassButton>
          )}
        </GlassCard>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {filteredRooms.map((room) => (
            <GlassCard key={room.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                    {room.is_secure && (
                      <Shield className="w-4 h-4 text-red-500" />
                    )}
                    {!room.is_active && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-mono">{room.code}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {getLocationName(room.store_location_id)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleManageShelves(room)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Manage Shelves"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditRoom(room)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Edit Room"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Room"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {room.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{room.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Capacity</span>
                  <span className="font-medium">
                    {room.current_capacity} / {room.max_capacity || '∞'}
                  </span>
                </div>
                
                {room.max_capacity && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getCapacityBarColor(getCapacityPercentage(room.current_capacity, room.max_capacity))}`}
                      style={{ width: `${Math.min(getCapacityPercentage(room.current_capacity, room.max_capacity), 100)}%` }}
                    ></div>
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Floor {room.floor_level}</span>
                  {room.area_sqm && <span>{room.area_sqm} sqm</span>}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Shelf Management Modal */}
      {showShelfDetails && selectedRoomForShelves && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200/50 rounded-lg">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Grid3X3 className="h-6 w-6 text-blue-500" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Shelves for {selectedRoomForShelves.name}
                    </h2>
                    <p className="text-sm text-gray-600">{selectedRoomForShelves.code}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <GlassButton
                    onClick={handleCreateShelf}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Shelf
                  </GlassButton>
                  <button
                    onClick={() => setShowShelfDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingShelves ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : roomShelves.length === 0 ? (
                  <div className="text-center py-12">
                    <Grid3X3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No shelves found</h3>
                    <p className="text-gray-600 mb-4">This storage room doesn't have any shelves yet.</p>
                    <GlassButton onClick={handleCreateShelf} className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Shelf
                    </GlassButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortShelvesByPosition(roomShelves).map((shelf) => (
                      <GlassCard key={shelf.id} className="p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {formatShelfName(shelf.name)}
                            </h4>
                            <p className="text-sm text-gray-600 font-mono">{shelf.code}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditShelf(shelf)}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                              title="Edit Shelf"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteShelf(shelf)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Shelf"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Capacity</span>
                            <span className="font-medium">
                              {shelf.current_capacity} / {shelf.max_capacity || '∞'}
                            </span>
                          </div>
                          
                          {shelf.max_capacity && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${getCapacityBarColor(getCapacityPercentage(shelf.current_capacity, shelf.max_capacity))}`}
                                style={{ width: `${Math.min(getCapacityPercentage(shelf.current_capacity, shelf.max_capacity), 100)}%` }}
                              ></div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              {shelf.is_refrigerated && <span className="text-blue-500">❄</span>}
                              {shelf.requires_ladder && <span className="text-orange-500">🪜</span>}
                              {!shelf.is_accessible && <span className="text-red-500">🔒</span>}
                            </span>
                            <span>Floor {shelf.floor_level}</span>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <StorageRoomModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        storageRoom={editingRoom}
        onSave={handleModalSave}
      />

      <ShelfModal
        isOpen={isShelfModalOpen}
        onClose={handleShelfModalClose}
        shelf={editingShelf}
        storageRoomId={selectedRoomForShelves?.id}
        onSave={handleShelfModalSave}
      />
    </div>
  );
};

export default StorageRoomManagementPage;
