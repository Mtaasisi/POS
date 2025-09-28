import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Building, 
  Search,
  Package
} from 'lucide-react';

interface StorageRoom {
  id: string;
  name: string;
  code: string;
  shelf_count: number;
}

interface ShelfPosition {
  id: string;
  name: string;
  code: string;
  type: string;
  is_available: boolean;
}

interface StorageLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (room: StorageRoom, shelf: ShelfPosition) => void;
  storageRooms?: StorageRoom[];
  selectedRoomId?: string;
}

const StorageLocationModal: React.FC<StorageLocationModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  storageRooms = [],
  selectedRoomId
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>(selectedRoomId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // TODO: Replace with real database queries
  // This should fetch actual storage rooms and shelf positions from your database
  const mockStorageRooms: StorageRoom[] = [];
  const mockShelfPositions: ShelfPosition[] = [];

  const rooms = storageRooms.length > 0 ? storageRooms : mockStorageRooms;
  const positions = mockShelfPositions;

  useEffect(() => {
    if (selectedRoomId && !selectedRoom) {
      setSelectedRoom(selectedRoomId);
    }
  }, [selectedRoomId, selectedRoom]);

  const filteredPositions = positions.filter(position => {
    const matchesSearch = position.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         position.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || position.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId);
  };

  const handleShelfSelect = (shelf: ShelfPosition) => {
    const room = rooms.find(r => r.id === selectedRoom);
    if (room) {
      onSelectLocation(room, shelf);
      onClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedType('all');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <MapPin className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select Storage Location</h2>
              <p className="text-gray-600 mt-1">Choose a storage room and shelf for your spare part</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Storage Room Tabs */}
        <div className="border-b border-gray-100 bg-white">
          <div className="flex overflow-x-auto px-6 py-4 gap-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomSelect(room.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  selectedRoom === room.id
                    ? 'text-green-600 bg-green-50 border-2 border-green-500 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedRoom === room.id ? 'bg-green-500' : 'bg-gray-100'
                  }`}>
                    <Building className={`w-4 h-4 ${
                      selectedRoom === room.id ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{room.name}</div>
                    <div className="text-xs opacity-75">{room.code}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search shelves..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType('P')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === 'P'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                P
              </button>
            </div>
          </div>
        </div>

        {/* Shelf Positions Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPositions.map((position) => (
              <button
                key={position.id}
                onClick={() => handleShelfSelect(position)}
                className="group relative overflow-hidden transition-all duration-500 text-left hover:transform hover:scale-102 hover:shadow-xl"
              >
                <div className="relative h-32 rounded-3xl border-2 transition-all duration-500 border-gray-200 bg-gradient-to-br from-fuchsia-400 to-fuchsia-500 hover:border-gray-300">
                  <div className="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-15">
                    <div className="absolute inset-0 bg-gradient-to-br bg-fuchsia-500 rounded-3xl"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]"></div>
                  </div>
                  <div className="relative h-full flex items-center justify-between p-6">
                    <div className="flex items-center">
                      <div className="flex flex-col">
                        <div className="text-5xl font-black tracking-tight transition-all duration-500 text-white">
                          {position.code}
                        </div>
                        <div className="text-base font-medium transition-all duration-500 text-white opacity-80">
                          Storage Shelf
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black transition-all duration-500 border-2 bg-gradient-to-br from-fuchsia-400 to-fuchsia-500 text-white shadow-md border-white/80">
                        P
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-3xl border-2 border-transparent transition-all duration-500 group-hover:border-gray-300 opacity-0 group-hover:opacity-100"></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-500">
            {filteredPositions.length} shelves found
          </div>
          <button 
            onClick={handleClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorageLocationModal;
