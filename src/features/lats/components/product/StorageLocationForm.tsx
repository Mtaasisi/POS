import React, { useState, useEffect } from 'react';
import { MapPin, Grid3X3, Building, Package, X, Check, Search, Filter } from 'lucide-react';
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
  const [allShelves, setAllShelves] = useState<Record<string, StoreShelf[]>>({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('');

  // Load storage rooms on mount
  useEffect(() => {
    loadStorageRooms();
  }, []);

  // Load all shelves for all rooms
  useEffect(() => {
    if (storageRooms.length > 0) {
      loadAllShelves();
    }
  }, [storageRooms]);

  // Set selected room when modal opens
  useEffect(() => {
    if (showModal) {
      setSelectedRoomId(formData.storageRoomId || storageRooms[0]?.id || '');
    }
  }, [showModal, formData.storageRoomId, storageRooms]);

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

  const loadAllShelves = async () => {
    try {
      const shelvesData: Record<string, StoreShelf[]> = {};
      
      for (const room of storageRooms) {
        const roomShelves = await storeShelfApi.getShelvesByStorageRoom(room.id);
        shelvesData[room.id] = roomShelves || [];
      }
      
      setAllShelves(shelvesData);
    } catch (error) {
      console.error('Error loading shelves:', error);
      setAllShelves({});
    }
  };

  const handleShelfSelect = (roomId: string, shelfId: string) => {
    setFormData(prev => ({
      ...prev,
      storageRoomId: roomId,
      shelfId: shelfId
    }));
    setShowModal(false);
  };

  const getSelectedDisplay = () => {
    if (!formData.storageRoomId || !formData.shelfId) {
      return 'Select storage location';
    }

    const room = storageRooms.find(r => r.id === formData.storageRoomId);
    const shelf = allShelves[formData.storageRoomId]?.find(s => s.id === formData.shelfId);
    
    if (room && shelf) {
      return `${room.name} - ${shelf.name}`;
    }
    
    return 'Select storage location';
  };

  const getCurrentShelves = () => {
    const shelves = allShelves[selectedRoomId] || [];
    return shelves.sort((a, b) => {
      // First sort by name (case-insensitive)
      const nameComparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      if (nameComparison !== 0) {
        return nameComparison;
      }
      // If names are the same, sort by ID for consistent ordering
      return a.id.localeCompare(b.id);
    });
  };

  const getRoomColor = (roomCode: string) => {
    const firstLetter = roomCode.charAt(0).toUpperCase();
    const colors = {
      'A': { bg: 'bg-green-500', hover: 'hover:bg-green-600', border: 'border-green-500', text: 'text-green-600', bgLight: 'bg-green-50' },
      'B': { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', border: 'border-blue-500', text: 'text-blue-600', bgLight: 'bg-blue-50' },
      'C': { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', border: 'border-purple-500', text: 'text-purple-600', bgLight: 'bg-purple-50' },
      'D': { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', border: 'border-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-50' },
      'E': { bg: 'bg-red-500', hover: 'hover:bg-red-600', border: 'border-red-500', text: 'text-red-600', bgLight: 'bg-red-50' },
      'F': { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600', border: 'border-indigo-500', text: 'text-indigo-600', bgLight: 'bg-indigo-50' },
      'G': { bg: 'bg-pink-500', hover: 'hover:bg-pink-600', border: 'border-pink-500', text: 'text-pink-600', bgLight: 'bg-pink-50' },
      'H': { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', border: 'border-yellow-500', text: 'text-yellow-600', bgLight: 'bg-yellow-50' }
    };
    return colors[firstLetter as keyof typeof colors] || colors['A'];
  };

  const getShelfColor = (letter: string) => {
    // Unique colors for each letter A-Z - no repetition
    const uniqueColors: { [key: string]: any } = {
      'A': { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', border: 'border-blue-500', text: 'text-blue-600', bgLight: 'bg-blue-50' },
      'B': { bg: 'bg-green-500', hover: 'hover:bg-green-600', border: 'border-green-500', text: 'text-green-600', bgLight: 'bg-green-50' },
      'C': { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', border: 'border-purple-500', text: 'text-purple-600', bgLight: 'bg-purple-50' },
      'D': { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', border: 'border-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-50' },
      'E': { bg: 'bg-red-500', hover: 'hover:bg-red-600', border: 'border-red-500', text: 'text-red-600', bgLight: 'bg-red-50' },
      'F': { bg: 'bg-teal-500', hover: 'hover:bg-teal-600', border: 'border-teal-500', text: 'text-teal-600', bgLight: 'bg-teal-50' },
      'G': { bg: 'bg-pink-500', hover: 'hover:bg-pink-600', border: 'border-pink-500', text: 'text-pink-600', bgLight: 'bg-pink-50' },
      'H': { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600', border: 'border-indigo-500', text: 'text-indigo-600', bgLight: 'bg-indigo-50' },
      'I': { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', border: 'border-emerald-500', text: 'text-emerald-600', bgLight: 'bg-emerald-50' },
      'J': { bg: 'bg-cyan-500', hover: 'hover:bg-cyan-600', border: 'border-cyan-500', text: 'text-cyan-600', bgLight: 'bg-cyan-50' },
      'K': { bg: 'bg-lime-500', hover: 'hover:bg-lime-600', border: 'border-lime-500', text: 'text-lime-600', bgLight: 'bg-lime-50' },
      'L': { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', border: 'border-amber-500', text: 'text-amber-600', bgLight: 'bg-amber-50' },
      'M': { bg: 'bg-rose-500', hover: 'hover:bg-rose-600', border: 'border-rose-500', text: 'text-rose-600', bgLight: 'bg-rose-50' },
      'N': { bg: 'bg-violet-500', hover: 'hover:bg-violet-600', border: 'border-violet-500', text: 'text-violet-600', bgLight: 'bg-violet-50' },
      'O': { bg: 'bg-sky-500', hover: 'hover:bg-sky-600', border: 'border-sky-500', text: 'text-sky-600', bgLight: 'bg-sky-50' },
      'P': { bg: 'bg-slate-500', hover: 'hover:bg-slate-600', border: 'border-slate-500', text: 'text-slate-600', bgLight: 'bg-slate-50' },
      'Q': { bg: 'bg-zinc-500', hover: 'hover:bg-zinc-600', border: 'border-zinc-500', text: 'text-zinc-600', bgLight: 'bg-zinc-50' },
      'R': { bg: 'bg-stone-500', hover: 'hover:bg-stone-600', border: 'border-stone-500', text: 'text-stone-600', bgLight: 'bg-stone-50' },
      'S': { bg: 'bg-neutral-500', hover: 'hover:bg-neutral-600', border: 'border-neutral-500', text: 'text-neutral-600', bgLight: 'bg-neutral-50' },
      'T': { bg: 'bg-fuchsia-500', hover: 'hover:bg-fuchsia-600', border: 'border-fuchsia-500', text: 'text-fuchsia-600', bgLight: 'bg-fuchsia-50' },
      'U': { bg: 'bg-blue-400', hover: 'hover:bg-blue-500', border: 'border-blue-400', text: 'text-blue-500', bgLight: 'bg-blue-25' },
      'V': { bg: 'bg-green-400', hover: 'hover:bg-green-500', border: 'border-green-400', text: 'text-green-500', bgLight: 'bg-green-25' },
      'W': { bg: 'bg-purple-400', hover: 'hover:bg-purple-500', border: 'border-purple-400', text: 'text-purple-500', bgLight: 'bg-purple-25' },
      'X': { bg: 'bg-orange-400', hover: 'hover:bg-orange-500', border: 'border-orange-400', text: 'text-orange-500', bgLight: 'bg-orange-25' },
      'Y': { bg: 'bg-red-400', hover: 'hover:bg-red-500', border: 'border-red-400', text: 'text-red-500', bgLight: 'bg-red-25' },
      'Z': { bg: 'bg-teal-400', hover: 'hover:bg-teal-500', border: 'border-teal-400', text: 'text-teal-500', bgLight: 'bg-teal-25' }
    };
    
    if (!letter) {
      return { bg: 'bg-gray-500', hover: 'hover:bg-gray-600', border: 'border-gray-500', text: 'text-gray-600', bgLight: 'bg-gray-50' };
    }
    
    return uniqueColors[letter] || { bg: 'bg-gray-500', hover: 'hover:bg-gray-600', border: 'border-gray-500', text: 'text-gray-600', bgLight: 'bg-gray-50' };
  };

  const getFilteredShelves = () => {
    let shelves = getCurrentShelves();
    
    // Filter by search term
    if (searchTerm) {
      shelves = shelves.filter(shelf => 
        shelf.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by selected letter
    if (selectedLetter) {
      shelves = shelves.filter(shelf => 
        shelf.name.toUpperCase().includes(selectedLetter)
      );
    }
    
    return shelves;
  };

  const getAvailableLetters = () => {
    const shelves = getCurrentShelves();
    const letters = new Set<string>();
    
    shelves.forEach(shelf => {
      const upperName = shelf.name.toUpperCase();
      for (let i = 0; i < upperName.length; i++) {
        const char = upperName[i];
        if (char >= 'A' && char <= 'Z') {
          letters.add(char);
          break;
        }
      }
    });
    
    return Array.from(letters).sort();
  };

  return (
    <div className="border-b border-gray-200 pb-4">
      <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <MapPin size={18} className="text-blue-600" />
        Storage Location
      </h3>
      
      {storageRooms.length === 0 && !loading && (
        <div className="mb-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3 text-amber-800">
            <Package size={24} className="text-amber-600" />
            <div>
              <h4 className="font-semibold text-lg">No Storage Data Available</h4>
              <p className="text-sm text-amber-700 mt-1">
                You need to create storage rooms and shelves before adding products. 
                Go to <strong>Settings → Storage Management</strong> to set up your storage infrastructure.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Storage Location Button */}
      <div>
        <label className="block mb-2 font-medium text-gray-700">
          Storage Location (optional)
        </label>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          disabled={loading || storageRooms.length === 0}
          className={`w-full py-4 pl-12 pr-4 bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-md border-2 rounded-xl focus:outline-none transition-all duration-300 text-left shadow-sm hover:shadow-md ${
            currentErrors.storageRoomId || currentErrors.shelfId
              ? 'border-red-500 focus:border-red-600' 
              : 'border-gray-300 focus:border-blue-500 hover:border-blue-400'
          } ${loading || storageRooms.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
        >
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <span className={`text-base ${formData.storageRoomId && formData.shelfId ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
            {getSelectedDisplay()}
          </span>
          {formData.storageRoomId && formData.shelfId && (
            <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={20} />
          )}
        </button>
        {(currentErrors.storageRoomId || currentErrors.shelfId) && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            {currentErrors.storageRoomId || currentErrors.shelfId}
          </p>
        )}
      </div>

      {/* Storage Location Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MapPin size={28} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Select Storage Location</h2>
                  <p className="text-gray-600 mt-1">Choose a storage room and shelf for your product</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Storage Room Tabs */}
            <div className="border-b border-gray-100 bg-white">
              <div className="flex overflow-x-auto px-6 py-4 gap-2">
                {storageRooms.map((room) => {
                  const roomColor = getRoomColor(room.code);
                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        selectedRoomId === room.id
                          ? `${roomColor.text} ${roomColor.bgLight} border-2 ${roomColor.border} shadow-md`
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedRoomId === room.id ? roomColor.bg : 'bg-gray-100'}`}>
                          <Building size={16} className={selectedRoomId === room.id ? 'text-white' : 'text-gray-500'} />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">{room.name}</div>
                          <div className={`text-xs ${selectedRoomId === room.id ? roomColor.text : 'text-gray-500'}`}>
                            {room.code}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search shelves..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                
                {/* Letter Filter */}
                <div className="flex gap-2">
                  <Filter className="text-gray-400 mt-3" size={20} />
                  <div className="flex gap-1">
                    {getAvailableLetters().map(letter => (
                      <button
                        key={letter}
                        onClick={() => setSelectedLetter(selectedLetter === letter ? '' : letter)}
                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                          selectedLetter === letter
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Shelves Grid */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {getFilteredShelves().length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <Grid3X3 size={48} className="text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-600 mb-3">
                    {searchTerm || selectedLetter ? 'No matching shelves found' : 'No Shelves Available'}
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    {searchTerm || selectedLetter 
                      ? 'Try adjusting your search terms or clearing the letter filter to see all available shelves.'
                      : 'This storage room doesn\'t have any shelves yet. Please create shelves in the storage management section.'
                    }
                  </p>
                  {(searchTerm || selectedLetter) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedLetter('');
                      }}
                      className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {getFilteredShelves().map((shelf) => {
                    const isSelected = formData.storageRoomId === selectedRoomId && formData.shelfId === shelf.id;
                    
                    // Find the first letter A-Z in the shelf name
                    const upperName = shelf.name.toUpperCase();
                    let foundLetter = null;
                    for (let i = 0; i < upperName.length; i++) {
                      const char = upperName[i];
                      if (char >= 'A' && char <= 'Z') {
                        foundLetter = char;
                        break;
                      }
                    }
                    
                    const shelfColor = getShelfColor(foundLetter || '');
                    
                    return (
                      <button
                        key={shelf.id}
                        onClick={() => handleShelfSelect(selectedRoomId, shelf.id)}
                        className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg hover:scale-105 ${
                          isSelected
                            ? `${shelfColor.border} ${shelfColor.bgLight} shadow-lg scale-105`
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {/* Color indicator bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${shelfColor.bg}`}></div>
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className={`absolute -top-2 -right-2 w-6 h-6 ${shelfColor.bg} rounded-full flex items-center justify-center shadow-lg`}>
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${isSelected ? shelfColor.bg : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                            <Grid3X3 size={16} className={isSelected ? 'text-white' : 'text-gray-500'} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{shelf.name}</div>
                            <div className="text-xs text-gray-500">
                              {shelf.is_refrigerated ? '❄ Refrigerated' : 'Standard'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Letter badge */}
                        {foundLetter && (
                          <div className={`inline-flex items-center px-3 py-2 rounded-full text-lg font-bold ${shelfColor.bg} text-white shadow-md`}>
                            {foundLetter}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50">
              <div className="text-sm text-gray-500">
                {getFilteredShelves().length} shelf{getFilteredShelves().length !== 1 ? 'es' : ''} found
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageLocationForm;
