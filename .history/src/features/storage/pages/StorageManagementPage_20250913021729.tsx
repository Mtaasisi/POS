import React, { useState, useEffect } from 'react';
import { Plus, Building2, Package, Settings } from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { StorageRoom, StoreShelf } from '../../../types/storage';
import { storageService } from '../../../services/storageService';

interface StorageManagementPageProps {
  storeLocationId?: string;
}

export const StorageManagementPage: React.FC<StorageManagementPageProps> = ({ 
  storeLocationId 
}) => {
  const [rooms, setRooms] = useState<StorageRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<StorageRoom | null>(null);
  const [shelves, setShelves] = useState<StoreShelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rooms' | 'shelves'>('rooms');

  useEffect(() => {
    loadStorageRooms();
  }, [storeLocationId]);

  useEffect(() => {
    if (selectedRoom) {
      loadShelves(selectedRoom.id);
    }
  }, [selectedRoom]);

  const loadStorageRooms = async () => {
    try {
      setIsLoading(true);
      const storageRooms = await storageService.getStorageRooms(storeLocationId);
      setRooms(storageRooms);
      if (storageRooms.length > 0 && !selectedRoom) {
        setSelectedRoom(storageRooms[0]);
      }
    } catch (error) {
      console.error('Error loading storage rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadShelves = async (roomId: string) => {
    try {
      const storeShelves = await storageService.getStoreShelves(roomId);
      setShelves(storeShelves);
    } catch (error) {
      console.error('Error loading shelves:', error);
    }
  };

  const handleRoomSelect = (room: StorageRoom) => {
    setSelectedRoom(room);
    setActiveTab('shelves');
  };

  const getShelfTypeColor = (type: string) => {
    switch (type) {
      case 'refrigerated': return 'bg-blue-100 text-blue-800';
      case 'display': return 'bg-purple-100 text-purple-800';
      case 'storage': return 'bg-gray-100 text-gray-800';
      case 'specialty': return 'bg-orange-100 text-orange-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Storage Management</h1>
            <p className="text-gray-600">Manage storage rooms and shelves</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <GlassButton
            onClick={() => setActiveTab('rooms')}
            variant={activeTab === 'rooms' ? 'default' : 'ghost'}
            icon={<Building2 size={16} />}
          >
            Rooms
          </GlassButton>
          <GlassButton
            onClick={() => setActiveTab('shelves')}
            variant={activeTab === 'shelves' ? 'default' : 'ghost'}
            icon={<Package size={16} />}
            disabled={!selectedRoom}
          >
            Shelves
          </GlassButton>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rooms List */}
        <div className="lg:col-span-1">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Storage Rooms</h3>
              <GlassButton
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {/* TODO: Open add room modal */}}
              >
                Add
              </GlassButton>
            </div>
            
            <div className="space-y-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleRoomSelect(room)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedRoom?.id === room.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{room.name}</p>
                      <p className="text-sm text-gray-600">Code: {room.code}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      Floor {room.floorLevel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Shelves Grid */}
        <div className="lg:col-span-2">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedRoom ? `${selectedRoom.name} Shelves` : 'Select a Room'}
                </h3>
                {selectedRoom && (
                  <p className="text-sm text-gray-600">
                    {shelves.length} shelves • Floor {selectedRoom.floorLevel}
                  </p>
                )}
              </div>
              {selectedRoom && (
                <GlassButton
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => {/* TODO: Open add shelf modal */}}
                >
                  Add Shelf
                </GlassButton>
              )}
            </div>

            {selectedRoom ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {shelves.map((shelf) => (
                  <div
                    key={shelf.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      shelf.isActive
                        ? 'bg-white border-gray-200 hover:border-blue-300'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                    onClick={() => {/* TODO: Open shelf details modal */}}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gray-900">
                        {shelf.code}
                      </span>
                      {!shelf.isAccessible && (
                        <Settings size={12} className="text-orange-500" />
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-1">
                      Storage Shelf
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${getShelfTypeColor(shelf.shelfType)}`}>
                        {shelf.shelfType}
                      </span>
                      <span className="text-xs text-gray-500">
                        R{shelf.rowNumber}C{shelf.columnNumber}
                      </span>
                    </div>
                    
                    {shelf.maxCapacity && (
                      <p className="text-xs text-gray-600 mt-1">
                        Max: {shelf.maxCapacity}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Select a storage room to view shelves</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
