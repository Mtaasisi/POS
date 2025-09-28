import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import CategoryInput from '../../../shared/components/ui/CategoryInput';
import PriceInput from '../../../../shared/components/ui/PriceInput';

import { X, Save, Package, AlertCircle, QrCode, Download, DollarSign, Image as ImageIcon, MapPin, Layers, FileText, Hash, Building, Grid3X3, Check, Search, Filter, Plus } from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { SparePart, SparePartVariant } from '../../types/spareParts';
import SparePartVariantsSection from './SparePartVariantsSection';
import { specificationCategories, getSpecificationsByType, getTypeDisplayName } from '../../../../data/specificationCategories';
import { SimpleImageUpload } from '../../../../components/SimpleImageUpload';
import { toast } from 'react-hot-toast';
import { StoreLocation } from '../../../settings/types/storeLocation';
import { storeLocationApi } from '../../../settings/utils/storeLocationApi';
import { storageRoomApi, StorageRoom } from '../../../settings/utils/storageRoomApi';
import { storeShelfApi, StoreShelf } from '../../../settings/utils/storeShelfApi';
import { format } from '../../lib/format';

interface SparePartFormProps {
  sparePart?: SparePart | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const SparePartForm: React.FC<SparePartFormProps> = ({ 
  sparePart, 
  onSave, 
  onCancel 
}) => {
  const { currentUser } = useAuth();
  const { categories, suppliers, loadSparePartCategories, loadSuppliers } = useInventoryStore();




  // Store location and shelf state
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [shelves, setShelves] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingShelves, setLoadingShelves] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    categoryId: null,
    partNumber: '',
    brand: '',
    supplierId: null,
    condition: '',
    description: '',
    costPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    minQuantity: 0,
    storeLocationId: '',
    shelfId: '',
    location: '',
    compatibleDevices: '',
    images: [] as any[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [tempSparePartId, setTempSparePartId] = useState('temp-sparepart-' + Date.now());
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const [createdSparePart, setCreatedSparePart] = useState<any>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Storage modal state
  const [storageRooms, setStorageRooms] = useState<StorageRoom[]>([]);
  const [allShelves, setAllShelves] = useState<Record<string, StoreShelf[]>>({});
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  
  // Load categories and suppliers on mount
  useEffect(() => {
    loadSparePartCategories();
    loadSuppliers();
  }, [loadSparePartCategories, loadSuppliers]);

  // Load store locations
  useEffect(() => {
    const loadStoreData = async () => {
      try {
        setLoadingLocations(true);
        const locations = await storeLocationApi.getAll();
        setStoreLocations(locations);
      } catch (error) {
        console.error('Error loading store locations:', error);
        toast.error('Failed to load store locations');
      } finally {
        setLoadingLocations(false);
      }
    };

    loadStoreData();
  }, []);

  // Load shelves when location changes
  useEffect(() => {
    const loadShelves = async () => {
      if (!formData.storeLocationId) {
        setShelves([]);
        return;
      }

      try {
        setLoadingShelves(true);
        setShelves([]);
        // TODO: Implement shelf loading logic
        // const locationShelves = await shelfApi.getByLocation(formData.storeLocationId);
        // setShelves(locationShelves);
      } catch (error) {
        console.error('Error loading shelves:', error);
        toast.error('Failed to load shelves');
        setShelves([]);
      } finally {
        setLoadingShelves(false);
      }
    };

    loadShelves();
  }, [formData.storeLocationId]);

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
    if (showStorageModal) {
      setSelectedRoomId(formData.storageRoomId || storageRooms[0]?.id || '');
    }
  }, [showStorageModal, formData.storageRoomId, storageRooms]);

  // Initialize form with existing data
  useEffect(() => {
    if (sparePart) {
      const initialFormData = {
        name: sparePart.name,
        categoryId: sparePart.category_id,
        partNumber: sparePart.part_number,
        brand: sparePart.brand || '',
        supplierId: sparePart.supplier_id || null,
        condition: sparePart.condition || '',
        description: sparePart.description || '',
        costPrice: sparePart.cost_price,
        sellingPrice: sparePart.selling_price,
        quantity: sparePart.quantity,
        minQuantity: sparePart.min_quantity,
        storageRoomId: sparePart.storage_room_id || '',
        shelfId: sparePart.store_shelf_id || '',
        storeLocationId: sparePart.storage_room_id || '', // For backward compatibility
        location: sparePart.location || '',
        compatibleDevices: sparePart.compatible_devices || '',
        images: sparePart.images || []
      };
      
      setFormData(initialFormData);

      // If spare part has a location, try to find the store location
      if (sparePart.location) {
        findLocationForShelf(sparePart.location);
      }
    }
  }, [sparePart]);

  // Find location for existing shelf
  const findLocationForShelf = async (shelfCode: string) => {
    try {
      // TODO: Implement shelf lookup logic
      // const allShelves = await shelfApi.getAll();
      // const shelf = allShelves.find(s => s.code === shelfCode);
      // if (shelf) {
      //   setFormData(prev => ({ ...prev, storeLocationId: shelf.store_location_id }));
      // }
    } catch (error) {
      console.error('Error finding location for shelf:', error);
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Spare part name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.partNumber.trim()) {
      newErrors.partNumber = 'Part number is required';
    } else if (formData.partNumber.trim().length < 2) {
      newErrors.partNumber = 'Part number must be at least 2 characters long';
    }

    if (formData.costPrice < 0) {
      newErrors.costPrice = 'Cost price cannot be negative';
    } else if (formData.costPrice === 0) {
      newErrors.costPrice = 'Cost price must be greater than 0';
    }

    if (formData.sellingPrice < 0) {
      newErrors.sellingPrice = 'Selling price cannot be negative';
    } else if (formData.sellingPrice === 0) {
      newErrors.sellingPrice = 'Selling price must be greater than 0';
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Stock quantity cannot be negative';
    }

    if (formData.minQuantity < 0) {
      newErrors.minQuantity = 'Minimum stock level cannot be negative';
    }

    if (formData.minQuantity > formData.quantity) {
      newErrors.minQuantity = 'Minimum stock level cannot be greater than current quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Update form data with better error handling
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Storage modal functions
  const loadStorageRooms = async () => {
    try {
      const rooms = await storageRoomApi.getAll();
      setStorageRooms(rooms || []);
    } catch (error) {
      console.error('Error loading storage rooms:', error);
      setStorageRooms([]);
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
    setShowStorageModal(false);
  };

  const getSelectedStorageDisplay = () => {
    if (!formData.storageRoomId || !formData.shelfId) {
      return 'Select storage location';
    }

    const room = storageRooms.find(r => r.id === formData.storageRoomId);
    const shelf = allShelves[formData.storageRoomId]?.find(s => s.id === formData.shelfId);
    
    if (room && shelf) {
      return `${room.code} - ${shelf.code}`;
    }
    
    return 'Select storage location';
  };

  const getCurrentShelves = () => {
    const shelves = allShelves[selectedRoomId] || [];
    return shelves.sort((a, b) => {
      const nameComparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      if (nameComparison !== 0) {
        return nameComparison;
      }
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
    // Enhanced color palette with more diverse colors for each alphabet
    const uniqueColors: { [key: string]: any } = {
      // Primary Colors (A-H)
      'A': { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', border: 'border-blue-500', text: 'text-blue-600', bgLight: 'bg-blue-50' },
      'B': { bg: 'bg-green-500', hover: 'hover:bg-green-600', border: 'border-green-500', text: 'text-green-600', bgLight: 'bg-green-50' },
      'C': { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', border: 'border-purple-500', text: 'text-purple-600', bgLight: 'bg-purple-50' },
      'D': { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', border: 'border-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-50' },
      'E': { bg: 'bg-red-500', hover: 'hover:bg-red-600', border: 'border-red-500', text: 'text-red-600', bgLight: 'bg-red-50' },
      'F': { bg: 'bg-teal-500', hover: 'hover:bg-teal-600', border: 'border-teal-500', text: 'text-teal-600', bgLight: 'bg-teal-50' },
      'G': { bg: 'bg-pink-500', hover: 'hover:bg-pink-600', border: 'border-pink-500', text: 'text-pink-600', bgLight: 'bg-pink-50' },
      'H': { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600', border: 'border-indigo-500', text: 'text-indigo-600', bgLight: 'bg-indigo-50' },
      
      // Secondary Colors (I-P)
      'I': { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', border: 'border-emerald-500', text: 'text-emerald-600', bgLight: 'bg-emerald-50' },
      'J': { bg: 'bg-cyan-500', hover: 'hover:bg-cyan-600', border: 'border-cyan-500', text: 'text-cyan-600', bgLight: 'bg-cyan-50' },
      'K': { bg: 'bg-lime-500', hover: 'hover:bg-lime-600', border: 'border-lime-500', text: 'text-lime-600', bgLight: 'bg-lime-50' },
      'L': { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', border: 'border-amber-500', text: 'text-amber-600', bgLight: 'bg-amber-50' },
      'M': { bg: 'bg-rose-500', hover: 'hover:bg-rose-600', border: 'border-rose-500', text: 'text-rose-600', bgLight: 'bg-rose-50' },
      'N': { bg: 'bg-violet-500', hover: 'hover:bg-violet-600', border: 'border-violet-500', text: 'text-violet-600', bgLight: 'bg-violet-50' },
      'O': { bg: 'bg-sky-500', hover: 'hover:bg-sky-600', border: 'border-sky-500', text: 'text-sky-600', bgLight: 'bg-sky-50' },
      'P': { bg: 'bg-fuchsia-500', hover: 'hover:bg-fuchsia-600', border: 'border-fuchsia-500', text: 'text-fuchsia-600', bgLight: 'bg-fuchsia-50' },
      
      // Tertiary Colors (Q-X)
      'Q': { bg: 'bg-slate-500', hover: 'hover:bg-slate-600', border: 'border-slate-500', text: 'text-slate-600', bgLight: 'bg-slate-50' },
      'R': { bg: 'bg-zinc-500', hover: 'hover:bg-zinc-600', border: 'border-zinc-500', text: 'text-zinc-600', bgLight: 'bg-zinc-50' },
      'S': { bg: 'bg-stone-500', hover: 'hover:bg-stone-600', border: 'border-stone-500', text: 'text-stone-600', bgLight: 'bg-stone-50' },
      'T': { bg: 'bg-neutral-500', hover: 'hover:bg-neutral-600', border: 'border-neutral-500', text: 'text-neutral-600', bgLight: 'bg-neutral-50' },
      'U': { bg: 'bg-blue-400', hover: 'hover:bg-blue-500', border: 'border-blue-400', text: 'text-blue-500', bgLight: 'bg-blue-25' },
      'V': { bg: 'bg-green-400', hover: 'hover:bg-green-500', border: 'border-green-400', text: 'text-green-500', bgLight: 'bg-green-25' },
      'W': { bg: 'bg-purple-400', hover: 'hover:bg-purple-500', border: 'border-purple-400', text: 'text-purple-500', bgLight: 'bg-purple-25' },
      'X': { bg: 'bg-orange-400', hover: 'hover:bg-orange-500', border: 'border-orange-400', text: 'text-orange-500', bgLight: 'bg-orange-25' },
      
      // Quaternary Colors (Y-Z + Extended)
      'Y': { bg: 'bg-red-400', hover: 'hover:bg-red-500', border: 'border-red-400', text: 'text-red-500', bgLight: 'bg-red-25' },
      'Z': { bg: 'bg-teal-400', hover: 'hover:bg-teal-500', border: 'border-teal-400', text: 'text-teal-500', bgLight: 'bg-teal-25' },
      
      // Extended Colors for numbers and special characters
      '0': { bg: 'bg-gray-600', hover: 'hover:bg-gray-700', border: 'border-gray-600', text: 'text-gray-600', bgLight: 'bg-gray-100' },
      '1': { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', border: 'border-blue-600', text: 'text-blue-600', bgLight: 'bg-blue-100' },
      '2': { bg: 'bg-green-600', hover: 'hover:bg-green-700', border: 'border-green-600', text: 'text-green-600', bgLight: 'bg-green-100' },
      '3': { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', border: 'border-purple-600', text: 'text-purple-600', bgLight: 'bg-purple-100' },
      '4': { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', border: 'border-orange-600', text: 'text-orange-600', bgLight: 'bg-orange-100' },
      '5': { bg: 'bg-red-600', hover: 'hover:bg-red-700', border: 'border-red-600', text: 'text-red-600', bgLight: 'bg-red-100' },
      '6': { bg: 'bg-teal-600', hover: 'hover:bg-teal-700', border: 'border-teal-600', text: 'text-teal-600', bgLight: 'bg-teal-100' },
      '7': { bg: 'bg-pink-600', hover: 'hover:bg-pink-700', border: 'border-pink-600', text: 'text-pink-600', bgLight: 'bg-pink-100' },
      '8': { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', border: 'border-indigo-600', text: 'text-indigo-600', bgLight: 'bg-indigo-100' },
      '9': { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', border: 'border-emerald-600', text: 'text-emerald-600', bgLight: 'bg-emerald-100' }
    };
    
    if (!letter) {
      return { bg: 'bg-gray-500', hover: 'hover:bg-gray-600', border: 'border-gray-500', text: 'text-gray-600', bgLight: 'bg-gray-50' };
    }
    
    // Try to find the color for the letter, fallback to gray if not found
    return uniqueColors[letter.toUpperCase()] || { bg: 'bg-gray-500', hover: 'hover:bg-gray-600', border: 'border-gray-500', text: 'text-gray-600', bgLight: 'bg-gray-50' };
  };

  const getFilteredShelves = () => {
    let shelves = getCurrentShelves();
    
    if (searchTerm) {
      shelves = shelves.filter(shelf => 
        shelf.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shelf.name && shelf.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedLetter) {
      shelves = shelves.filter(shelf => 
        shelf.code.toUpperCase().includes(selectedLetter)
      );
    }
    
    return shelves;
  };

  const getAvailableLetters = () => {
    const shelves = getCurrentShelves();
    const letters = new Set<string>();
    
    shelves.forEach(shelf => {
      const upperName = shelf.code.toUpperCase();
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const sparePartData = {
        ...formData,
        id: sparePart?.id,
        createdBy: currentUser?.id,
        updatedBy: currentUser?.id
      };
      
      await onSave(sparePartData);
      
      if (!sparePart) {
        setCreatedSparePart(sparePartData);
        setShowSummaryModal(true);
      }
    } catch (error: any) {
      console.error('Error saving spare part:', error);
      
      toast.error('Failed to save spare part');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate QR Code
  const generateQRCode = () => {
    const qrData = JSON.stringify({
      type: 'spare-part',
      id: sparePart?.id || tempSparePartId,
      name: formData.name,
      partNumber: formData.partNumber
    });
    
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`);
    setShowQRCode(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <GlassCard className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {sparePart ? 'Edit Spare Part' : 'Add New Spare Part'}
                </h2>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label 
                      htmlFor="spare-part-name"
                      className={`block mb-2 font-medium ${errors.name ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Spare Part Name *
                    </label>
                    <div className="relative">
                      <input
                        id="spare-part-name"
                        type="text"
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                          errors.name ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="e.g., iPhone 14 Screen"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Part Number */}
                  <div>
                    <label 
                      htmlFor="part-number"
                      className={`block mb-2 font-medium ${errors.partNumber ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Part Number *
                    </label>
                    <div className="relative">
                      <input
                        id="part-number"
                        type="text"
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                          errors.partNumber ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="e.g., IP14-SCR-001"
                        value={formData.partNumber}
                        onChange={(e) => handleInputChange('partNumber', e.target.value)}
                        required
                      />
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                    {errors.partNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.partNumber}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label 
                      htmlFor="category"
                      className={`block mb-2 font-medium ${errors.categoryId ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Category *
                    </label>
                    <CategoryInput
                      value={formData.categoryId}
                      onChange={(categoryId) => handleInputChange('categoryId', categoryId)}
                      placeholder="Select a spare part category"
                      categories={categories}
                      required
                      error={errors.categoryId}
                      className="w-full"
                    />
                    {errors.categoryId && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
                    )}
                  </div>

                  {/* Supplier */}
                  <div>
                    <label 
                      htmlFor="supplier"
                      className="block mb-2 font-medium text-gray-700"
                    >
                      Supplier
                    </label>
                    <div className="relative">
                      <select
                        id="supplier"
                        className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                        value={formData.supplierId}
                        onChange={(e) => handleInputChange('supplierId', e.target.value)}
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>

                  {/* Condition */}
                  <div>
                    <label 
                      htmlFor="condition"
                      className="block mb-2 font-medium text-gray-700"
                    >
                      Condition
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'new', label: 'New', color: 'bg-green-500 hover:bg-green-600 border-green-500' },
                        { value: 'used', label: 'Used', color: 'bg-blue-500 hover:bg-blue-600 border-blue-500' },
                        { value: 'refurbished', label: 'Refurbished', color: 'bg-purple-500 hover:bg-purple-600 border-purple-500' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleInputChange('condition', option.value)}
                          className={`py-3 px-4 rounded-lg border-2 transition-all duration-200 font-medium ${
                            formData.condition === option.value
                              ? `${option.color} text-white`
                              : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand */}
                  <div>
                    <label 
                      htmlFor="brand"
                      className="block mb-2 font-medium text-gray-700"
                    >
                      Brand
                    </label>
                    <div className="relative">
                      <input
                        id="brand"
                        type="text"
                        className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="e.g., Apple, Samsung"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                      />
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label 
                    htmlFor="description"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Description (optional)
                  </label>
                  <div className="relative">
                    {isDescriptionExpanded ? (
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full py-3 pl-10 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200 resize-none"
                        placeholder="Describe the spare part, its specifications, and any important details..."
                        maxLength={500}
                        rows={4}
                        onBlur={() => setIsDescriptionExpanded(false)}
                        autoFocus
                      />
                    ) : (
                      <input
                        id="description"
                        type="text"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full py-3 pl-10 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
                        placeholder="Brief description..."
                        maxLength={200}
                        onFocus={() => setIsDescriptionExpanded(true)}
                      />
                    )}
                    <FileText className={`absolute left-3 text-gray-500 transition-all duration-200 ${
                      isDescriptionExpanded ? 'top-4' : 'top-1/2 -translate-y-1/2'
                    }`} size={16} />
                  </div>
                  {isDescriptionExpanded && (
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.description.length}/500 characters
                    </p>
                  )}
                </div>

                {/* Compatible Devices */}
                <div>
                  <label 
                    htmlFor="compatible-devices"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Compatible Devices
                  </label>
                  <div className="relative">
                    <textarea
                      id="compatible-devices"
                      className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      placeholder="List compatible devices (e.g., iPhone 14, iPhone 14 Pro, iPhone 14 Pro Max)"
                      value={formData.compatibleDevices}
                      onChange={(e) => handleInputChange('compatibleDevices', e.target.value)}
                      rows={3}
                    />
                    <svg className="absolute left-4 top-4 text-gray-500" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Pricing and Stock */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign size={18} className="text-green-600" />
                  Pricing & Stock
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Cost Price */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Cost Price *
                    </label>
                    <PriceInput
                      value={formData.costPrice}
                      onChange={(value) => handleInputChange('costPrice', value)}
                      placeholder="0.00"
                      className={`w-full ${errors.costPrice ? 'border-red-500' : ''}`}
                      required
                      error={errors.costPrice}
                    />
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Selling Price *
                    </label>
                    <PriceInput
                      value={formData.sellingPrice}
                      onChange={(value) => handleInputChange('sellingPrice', value)}
                      placeholder="0.00"
                      className={`w-full ${errors.sellingPrice ? 'border-red-500' : ''}`}
                      required
                      error={errors.sellingPrice}
                    />
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label 
                      htmlFor="stock-quantity"
                      className={`block mb-2 text-sm font-medium ${errors.quantity ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Stock Quantity *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.quantity === 0 ? '' : formData.quantity || ''}
                        onChange={(e) => handleInputChange('quantity', Math.max(0, parseInt(e.target.value) || 0))}
                        onFocus={(e) => {
                          if (formData.quantity === 0) {
                            e.target.value = '';
                          }
                        }}
                        className="w-full py-3 px-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 focus:outline-none focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                        min="0"
                        step="1"
                      />
                      
                      {/* Minus button on the left */}
                      <button
                        type="button"
                        onClick={() => handleInputChange('quantity', Math.max(0, (formData.quantity || 0) - 1))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Decrease stock quantity"
                      >
                        −
                      </button>
                      
                      {/* Plus button on the right */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <button
                          type="button"
                          onClick={() => handleInputChange('quantity', (formData.quantity || 0) + 1)}
                          className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                          aria-label="Increase stock quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {errors.quantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                    )}
                  </div>

                  {/* Min Stock Level */}
                  <div>
                    <label 
                      htmlFor="min-stock-level"
                      className={`block mb-2 text-sm font-medium ${errors.minQuantity ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Min Stock Level *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.minQuantity === 0 ? '' : formData.minQuantity || ''}
                        onChange={(e) => handleInputChange('minQuantity', Math.max(0, parseInt(e.target.value) || 0))}
                        onFocus={(e) => {
                          if (formData.minQuantity === 0) {
                            e.target.value = '';
                          }
                        }}
                        className="w-full py-3 px-20 bg-white/30 backdrop-blur-md border-2 rounded-lg text-center text-lg font-semibold text-gray-900 border-gray-300 focus:outline-none focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="2"
                        min="0"
                        step="1"
                      />
                      
                      {/* Minus button on the left */}
                      <button
                        type="button"
                        onClick={() => handleInputChange('minQuantity', Math.max(0, (formData.minQuantity || 0) - 1))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                        aria-label="Decrease minimum stock level"
                      >
                        −
                      </button>
                      
                      {/* Plus button on the right */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <button
                          type="button"
                          onClick={() => handleInputChange('minQuantity', (formData.minQuantity || 0) + 1)}
                          className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
                          aria-label="Increase minimum stock level"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {errors.minQuantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.minQuantity}</p>
                    )}
                  </div>
                </div>

                {/* Profit Margin Display */}
                {formData.sellingPrice > 0 && formData.costPrice > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Profit Margin:</span>
                      <span className="font-semibold text-blue-600">
                        TZS {format.number(formData.sellingPrice - formData.costPrice)} 
                        ({(((formData.sellingPrice - formData.costPrice) / formData.sellingPrice) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Storage Location */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600" />
                  Storage Location
                </h3>
                
                {storageRooms.length === 0 && !loadingLocations && (
                  <div className="mb-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-3 text-amber-800">
                      <Package size={24} className="text-amber-600" />
                      <div>
                        <h4 className="font-semibold text-lg">No Storage Data Available</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          You need to create storage rooms and shelves before adding spare parts. 
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
                    onClick={() => setShowStorageModal(true)}
                    disabled={loadingLocations || storageRooms.length === 0}
                    className={`w-full py-4 pl-12 pr-4 bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-md border-2 rounded-xl focus:outline-none transition-all duration-300 text-left shadow-sm hover:shadow-md ${
                      errors.storeLocationId || errors.shelfId
                        ? 'border-red-500 focus:border-red-600' 
                        : 'border-gray-300 focus:border-blue-500 hover:border-blue-400'
                    } ${loadingLocations || storageRooms.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                  >
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <span className={`text-base ${formData.storageRoomId && formData.shelfId ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                      {getSelectedStorageDisplay()}
                    </span>
                    {formData.storageRoomId && formData.shelfId && (
                      <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={20} />
                    )}
                  </button>
                  {(errors.storeLocationId || errors.shelfId) && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {errors.storeLocationId || errors.shelfId}
                    </p>
                  )}
                </div>
              </div>



              {/* Product Images Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <div className="w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-3 h-3 text-pink-600" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Spare Part Images</h3>
                  </div>
                </div>
              
                <div className="space-y-4">
                  <SimpleImageUpload
                    productId={tempSparePartId}
                    userId={currentUser?.id || ''}
                    onImagesChange={(images) => {
                      const formImages = images.map(img => ({
                        id: img.id,
                        image_url: img.url,
                        thumbnail_url: img.thumbnailUrl || img.url,
                        file_name: img.fileName,
                        file_size: img.fileSize,
                        is_primary: img.isPrimary,
                        uploaded_by: img.uploadedAt,
                        created_at: img.uploadedAt
                      }));
                      setFormData(prev => ({ ...prev, images: formImages }));
                      
                      // Show success message for image upload
                      if (images.length > 0) {
                        toast.success(`${images.length} image${images.length > 1 ? 's' : ''} uploaded successfully!`);
                      }
                    }}
                    maxFiles={5}
                  />
                </div>
              </div>

              {/* QR Code Preview */}
              {showQRCode && qrCodeUrl && (
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-blue-600" />
                      QR Code Preview
                    </h3>
                    <GlassButton
                      type="button"
                      onClick={() => setShowQRCode(false)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </GlassButton>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code" 
                        className="border border-gray-300 rounded-lg shadow-sm"
                      />
                      <p className="mt-2 text-sm text-gray-600">
                        Part Number: {formData.partNumber}
                      </p>
                      <GlassButton
                        type="button"
                        onClick={generateQRCode}
                        className="mt-3 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download QR Code
                      </GlassButton>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    isSubmitting 
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {sparePart ? 'Update' : 'Create'}
                    </div>
                  )}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>

      {/* Storage Location Modal */}
      {showStorageModal && (
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
                  <p className="text-gray-600 mt-1">Choose a storage room and shelf for your spare part</p>
                </div>
              </div>
              <button
                onClick={() => setShowStorageModal(false)}
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
                          <div className="text-xs opacity-75">{room.code}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and Filter */}
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search shelves..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Letter Filter */}
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    onClick={() => setSelectedLetter('')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedLetter === ''
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    All
                  </button>
                  {getAvailableLetters().map((letter) => (
                    <button
                      key={letter}
                      onClick={() => setSelectedLetter(selectedLetter === letter ? '' : letter)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedLetter === letter
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Shelves Grid */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {getFilteredShelves().length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getFilteredShelves().map((shelf, index) => {
                    const isSelected = formData.storageRoomId === selectedRoomId && formData.shelfId === shelf.id;
                    const shelfColor = getShelfColor(shelf.code.charAt(0).toUpperCase());
                    const foundLetter = shelf.code.toUpperCase().match(/[A-Z]/)?.[0];
                    
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
                    
                    const columnColor = foundLetter ? getLetterBackgroundColor(foundLetter) : 'bg-gradient-to-br from-gray-50 to-gray-100/50';
                    
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
                        <div className={`relative h-32 rounded-3xl border-2 transition-all duration-500 ${
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
                          <div className="relative h-full flex items-center justify-between p-6">
                            
                            {/* Left side - Shelf name only */}
                            <div className="flex items-center">
                              {/* Shelf name */}
                              <div className="flex flex-col">
                                <div className={`text-5xl font-black tracking-tight transition-all duration-500 ${
                                  isSelected ? 'text-white' : 'text-white'
                                }`}>
                                  {shelf.code}
                                </div>
                                <div className={`text-base font-medium transition-all duration-500 ${
                                  isSelected ? 'text-white opacity-90' : 'text-white opacity-80'
                                }`}>
                                  Storage Shelf
                                </div>
                              </div>
                            </div>
                            
                            {/* Right side - Letter badge */}
                            {foundLetter && (
                              <div className="relative">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black transition-all duration-500 border-2 ${
                                  isSelected 
                                    ? `${columnColor} text-white shadow-xl border-white/90` 
                                    : `${columnColor} text-white shadow-md border-white/80`
                                }`}>
                                  {foundLetter}
                                </div>
                                
                                {/* Badge glow effect */}
                                {isSelected && (
                                  <div className={`absolute inset-0 rounded-2xl ${shelfColor.bg} opacity-30 blur-md`} />
                                )}
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
                          <div className={`absolute inset-0 rounded-3xl border-2 border-transparent transition-all duration-500 ${
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
                onClick={() => setShowStorageModal(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SparePartForm;
