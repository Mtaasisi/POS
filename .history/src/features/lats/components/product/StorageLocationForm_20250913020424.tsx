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
      return `${room.code} - ${shelf.name}`;
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
    // Letter-based background colors - Strong vibrant colors
    const getLetterBackgroundColor = (letter: string) => {
      const letterColors: { [key: string]: string } = {
        // Each letter gets a completely unique strong color - no repeats anywhere
        'A': 'bg-gradient-to-br from-blue-400 to-blue-500',
        'B': 'bg-gradient-to-br from-green-400 to-green-500',
        'C': 'bg-gradient-to-br from-purple-400 to-purple-500',
        'D': 'bg-gradient-to-br from-orange-400 to-orange-500',
        'E': 'bg-gradient-to-br from-red-400 to-red-500',
        'F': 'bg-gradient-to-br from-teal-400 to-teal-500',
        'G': 'bg-gradient-to-br from-pink-400 to-pink-500',
        'H': 'bg-gradient-to-br from-indigo-400 to-indigo-500',
        'I': 'bg-gradient-to-br from-emerald-400 to-emerald-500',
        'J': 'bg-gradient-to-br from-cyan-400 to-cyan-500',
        'K': 'bg-gradient-to-br from-lime-400 to-lime-500',
        'L': 'bg-gradient-to-br from-amber-400 to-amber-500',
        'M': 'bg-gradient-to-br from-rose-400 to-rose-500',
        'N': 'bg-gradient-to-br from-violet-400 to-violet-500',
        'O': 'bg-gradient-to-br from-sky-400 to-sky-500',
        'P': 'bg-gradient-to-br from-fuchsia-400 to-fuchsia-500',
        'Q': 'bg-gradient-to-br from-slate-400 to-slate-500',
        'R': 'bg-gradient-to-br from-zinc-400 to-zinc-500',
        'S': 'bg-gradient-to-br from-stone-400 to-stone-500',
        'T': 'bg-gradient-to-br from-neutral-400 to-neutral-500',
        'U': 'bg-gradient-to-br from-yellow-400 to-yellow-500',
        'V': 'bg-gradient-to-br from-orange-500 to-orange-600',
        'W': 'bg-gradient-to-br from-red-500 to-red-600',
        'X': 'bg-gradient-to-br from-pink-500 to-pink-600',
        'Y': 'bg-gradient-to-br from-purple-500 to-purple-600',
        'Z': 'bg-gradient-to-br from-indigo-500 to-indigo-600',
        // Numbers - Each gets a unique strong color from different families
        '0': 'bg-gradient-to-br from-gray-300 to-gray-400',
        '1': 'bg-gradient-to-br from-blue-600 to-blue-700',
        '2': 'bg-gradient-to-br from-green-600 to-green-700',
        '3': 'bg-gradient-to-br from-teal-600 to-teal-700',
        '4': 'bg-gradient-to-br from-cyan-600 to-cyan-700',
        '5': 'bg-gradient-to-br from-lime-600 to-lime-700',
        '6': 'bg-gradient-to-br from-amber-600 to-amber-700',
        '7': 'bg-gradient-to-br from-emerald-600 to-emerald-700',
        '8': 'bg-gradient-to-br from-rose-600 to-rose-700',
        '9': 'bg-gradient-to-br from-violet-600 to-violet-700'
      };
      return letterColors[letter] || 'bg-gradient-to-br from-gray-200 to-gray-300';
    };
    
    const columnColor = letter ? getLetterBackgroundColor(letter) : 'bg-gradient-to-br from-gray-200 to-gray-300';
    
    // Return color object for compatibility
    return { 
      bg: columnColor, 
      hover: columnColor, 
      border: 'border-gray-200', 
      text: 'text-white', 
      bgLight: columnColor 
    };
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
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
                          <div className="font-semibold font-mono">{room.code}</div>
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
              {getFilteredShelves().length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {getFilteredShelves().map((shelf, index) => {
                    const isSelected = formData.storageRoomId === selectedRoomId && formData.shelfId === shelf.id;
                    const shelfColor = getShelfColor(shelf.name.charAt(0).toUpperCase());
                    const foundLetter = shelf.name.toUpperCase().match(/[A-Z]/)?.[0];
                    
                    // Letter-based background colors - Strong vibrant colors
                    const getLetterBackgroundColor = (letter: string) => {
                      const letterColors: { [key: string]: string } = {
                        // Each letter gets a completely unique strong color - no repeats anywhere
                        'A': 'bg-gradient-to-br from-blue-400 to-blue-500',
                        'B': 'bg-gradient-to-br from-green-400 to-green-500',
                        'C': 'bg-gradient-to-br from-purple-400 to-purple-500',
                        'D': 'bg-gradient-to-br from-orange-400 to-orange-500',
                        'E': 'bg-gradient-to-br from-red-400 to-red-500',
                        'F': 'bg-gradient-to-br from-teal-400 to-teal-500',
                        'G': 'bg-gradient-to-br from-pink-400 to-pink-500',
                        'H': 'bg-gradient-to-br from-indigo-400 to-indigo-500',
                        'I': 'bg-gradient-to-br from-emerald-400 to-emerald-500',
                        'J': 'bg-gradient-to-br from-cyan-400 to-cyan-500',
                        'K': 'bg-gradient-to-br from-lime-400 to-lime-500',
                        'L': 'bg-gradient-to-br from-amber-400 to-amber-500',
                        'M': 'bg-gradient-to-br from-rose-400 to-rose-500',
                        'N': 'bg-gradient-to-br from-violet-400 to-violet-500',
                        'O': 'bg-gradient-to-br from-sky-400 to-sky-500',
                        'P': 'bg-gradient-to-br from-fuchsia-400 to-fuchsia-500',
                        'Q': 'bg-gradient-to-br from-slate-400 to-slate-500',
                        'R': 'bg-gradient-to-br from-zinc-400 to-zinc-500',
                        'S': 'bg-gradient-to-br from-stone-400 to-stone-500',
                        'T': 'bg-gradient-to-br from-neutral-400 to-neutral-500',
                        'U': 'bg-gradient-to-br from-yellow-400 to-yellow-500',
                        'V': 'bg-gradient-to-br from-orange-500 to-orange-600',
                        'W': 'bg-gradient-to-br from-red-500 to-red-600',
                        'X': 'bg-gradient-to-br from-pink-500 to-pink-600',
                        'Y': 'bg-gradient-to-br from-purple-500 to-purple-600',
                        'Z': 'bg-gradient-to-br from-indigo-500 to-indigo-600',
                        // Numbers - Each gets a unique strong color from different families
                        '0': 'bg-gradient-to-br from-gray-300 to-gray-400',
                        '1': 'bg-gradient-to-br from-blue-600 to-blue-700',
                        '2': 'bg-gradient-to-br from-green-600 to-green-700',
                        '3': 'bg-gradient-to-br from-teal-600 to-teal-700',
                        '4': 'bg-gradient-to-br from-cyan-600 to-cyan-700',
                        '5': 'bg-gradient-to-br from-lime-600 to-lime-700',
                        '6': 'bg-gradient-to-br from-amber-600 to-amber-700',
                        '7': 'bg-gradient-to-br from-emerald-600 to-emerald-700',
                        '8': 'bg-gradient-to-br from-rose-600 to-rose-700',
                        '9': 'bg-gradient-to-br from-violet-600 to-violet-700'
                      };
                      return letterColors[letter] || 'bg-gradient-to-br from-gray-200 to-gray-300';
                    };
                    
                    const columnColor = foundLetter ? getLetterBackgroundColor(foundLetter) : 'bg-gradient-to-br from-gray-200 to-gray-300';
                    
                    return (
                      <button
                        key={shelf.id}
                        onClick={() => handleShelfSelect(selectedRoomId, shelf.id)}
                        className={`group relative overflow-hidden transition-all duration-500 text-left ${
                          isSelected
                            ? 'transform scale-105 shadow-2xl'
                            : 'hover:transform hover:scale-102 hover:shadow-xl'
                        }`}
                      >
                        {/* Main card container */}
                        <div className={`relative h-20 rounded-lg border-2 transition-all duration-500 ${
                          isSelected
                            ? `${shelfColor.border} ${shelfColor.bgLight}`
                            : `border-gray-200 ${columnColor} hover:border-gray-300`
                        }`}>
                          
                          {/* Animated background pattern */}
                          <div className={`absolute inset-0 opacity-10 transition-opacity duration-500 ${
                            isSelected ? 'opacity-20' : 'group-hover:opacity-15'
                          }`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${shelfColor.bg} rounded-3xl`} />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
                          </div>
                          
                          {/* Content overlay */}
                          <div className="relative h-full flex items-center justify-between p-4">
                            
                            {/* Left side - Shelf name only */}
                            <div className="flex items-center">
                              {/* Shelf name */}
                              <div className="flex flex-col">
                                <div className={`text-lg font-black tracking-tight transition-all duration-500 ${
                                  isSelected ? shelfColor.text : 'text-white'
                                }`}>
                                  {shelf.name}
                                </div>
                                <div className={`text-xs font-medium transition-all duration-500 ${
                                  isSelected ? `${shelfColor.text} opacity-80` : 'text-white opacity-80'
                                }`}>
                                  Storage Shelf
                                </div>
                              </div>
                            </div>
                            
                            {/* Right side - Letter badge */}
                            {foundLetter && (
                              <div className="relative">
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-black transition-all duration-500 border-2 ${
                                  isSelected 
                                    ? `${columnColor} text-white shadow-xl border-white/90` 
                                    : `${columnColor} text-white shadow-md border-white/80`
                                }`}>
                                  {foundLetter}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Selection indicator */}
                          {isSelected && (
                            <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${shelfColor.bg} flex items-center justify-center shadow-lg animate-pulse`}>
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Hover border effect */}
                          <div className={`absolute inset-0 rounded-lg border-2 border-transparent transition-all duration-500 ${
                            isSelected 
                              ? `${shelfColor.border} opacity-100` 
                              : 'group-hover:border-gray-300 opacity-0 group-hover:opacity-100'
                          }`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full animate-pulse" />
                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                      <Grid3X3 size={36} className="text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Shelves Found</h3>
                  <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">
                    {searchTerm || selectedLetter 
                      ? 'Try adjusting your search or filter criteria to discover available shelves.'
                      : 'No shelves are currently available in this storage room.'
                    }
                  </p>
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
