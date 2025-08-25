import React, { useState, useEffect } from 'react';
import { MapPin, Grid3X3, Building, Package } from 'lucide-react';
import { storageRoomApi, StorageRoom } from '../../../settings/utils/storageRoomApi';
import { storeShelfApi, StoreShelf } from '../../../settings/utils/storeShelfApi';
import { storeLocationApi } from '../../../settings/utils/storeLocationApi';

interface StorageLocationFormProps {
  formData: {
    storageRoomId: string;
    shelfId: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  currentErrors: Record<string, string>;
}

const StorageLocationForm: React.FC<StorageLocationFormProps> = ({
  formData,
  setFormData,
  currentErrors
}) => {
  const [storageRooms, setStorageRooms] = useState<StorageRoom[]>([]);
  const [shelves, setShelves] = useState<StoreShelf[]>([]);
  const [loading, setLoading] = useState(false);

  // Load storage rooms on mount
  useEffect(() => {
    loadStorageRooms();
  }, []);

  // Load shelves when storage room changes
  useEffect(() => {
    if (formData.storageRoomId) {
      loadShelves(formData.storageRoomId);
    } else {
      setShelves([]);
    }
  }, [formData.storageRoomId]);



  const loadStorageRooms = async () => {
    try {
      setLoading(true);
      const rooms = await storageRoomApi.getAll();
      setStorageRooms(rooms || []);
    } catch (error) {
      console.error('Error loading storage rooms:', error);
      setStorageRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const loadShelves = async (roomId: string) => {
    try {
      const roomShelves = await storeShelfApi.getShelvesByStorageRoom(roomId);
      setShelves(roomShelves || []);
      // Reset shelf selection when storage room changes
      setFormData(prev => ({
        ...prev,
        shelfId: ''
      }));
    } catch (error) {
      console.error('Error loading shelves:', error);
      setShelves([]);
    }
  };



  return (
    <div className="border-b border-gray-200 pb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MapPin size={20} className="text-blue-600" />
        Storage Location
      </h3>
      
      {storageRooms.length === 0 && !loading && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-800">
            <Package size={20} />
            <div>
              <h4 className="font-medium">No Storage Data Available</h4>
              <p className="text-sm text-amber-700">
                You need to create storage rooms and shelves before adding products. 
                Go to <strong>Settings → Storage Management</strong> to set up your storage infrastructure.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Storage Room */}
        <div>
          <label 
            htmlFor="storage-room"
            className={`block mb-2 font-medium ${currentErrors.storageRoomId ? 'text-red-600' : 'text-gray-700'}`}
          >
            Store Room (optional)
          </label>
          <div className="relative">
            <select
              id="storage-room"
              value={formData.storageRoomId}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                storageRoomId: e.target.value
              }))}
              disabled={loading}
              className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                currentErrors.storageRoomId 
                  ? 'border-red-500 focus:border-red-600' 
                  : 'border-gray-300 focus:border-blue-500'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                          <option value="">
              {loading 
                ? 'Loading storage rooms...' 
                : storageRooms.length === 0 
                  ? 'No storage rooms available - Please create storage rooms first' 
                  : 'Select storage room'
              }
            </option>
              {storageRooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.code})
                </option>
              ))}
            </select>
            <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          {currentErrors.storageRoomId && (
            <p className="mt-1 text-sm text-red-600">{currentErrors.storageRoomId}</p>
          )}
        </div>

        {/* Shelf */}
        <div>
          <label 
            htmlFor="shelf"
            className={`block mb-2 font-medium ${currentErrors.shelfId ? 'text-red-600' : 'text-gray-700'}`}
          >
            Shelf (optional)
          </label>
          <div className="relative">
            <select
              id="shelf"
              value={formData.shelfId}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                shelfId: e.target.value 
              }))}
              disabled={!formData.storageRoomId}
              className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                currentErrors.shelfId 
                  ? 'border-red-500 focus:border-red-600' 
                  : 'border-gray-300 focus:border-blue-500'
              } ${!formData.storageRoomId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                          <option value="">
              {!formData.storageRoomId 
                ? 'Select a storage room first' 
                : shelves.length === 0 
                  ? 'No shelves available - Please create shelves first' 
                  : 'Select a shelf'
              }
            </option>
              {shelves.map(shelf => (
                <option key={shelf.id} value={shelf.id}>
                  {shelf.name} - {shelf.is_refrigerated ? '❄ Refrigerated' : 'Standard'}
                </option>
              ))}
            </select>
            <Grid3X3 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          </div>
          {currentErrors.shelfId && (
            <p className="mt-1 text-sm text-red-600">{currentErrors.shelfId}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageLocationForm;
