import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import CategoryInput from '../../../shared/components/ui/CategoryInput';
import PriceInput from '../../../../shared/components/ui/PriceInput';

import { X, Save, Package, AlertCircle, DollarSign, Image as ImageIcon, MapPin, Layers, FileText, Hash, Building, LayoutGrid, Check, Search, Plus, Smartphone, Laptop, Monitor, Tablet, Watch, Headphones, Camera, Gamepad2, XCircle } from 'lucide-react';
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
import BrandInput from './BrandInput';

interface SparePartAddEditFormProps {
  sparePart?: SparePart | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const SparePartAddEditForm: React.FC<SparePartAddEditFormProps> = ({ 
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
    condition: 'new',
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Storage modal state
  const [storageRooms, setStorageRooms] = useState<StorageRoom[]>([]);
  const [allShelves, setAllShelves] = useState<Record<string, StoreShelf[]>>({});
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('');

  // Variants state
  const [variants, setVariants] = useState<SparePartVariant[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [useVariants, setUseVariants] = useState(false);
  const [isReorderingVariants, setIsReorderingVariants] = useState(false);
  const [draggedVariantIndex, setDraggedVariantIndex] = useState<number | null>(null);

  // Variant specifications modal state
  const [showVariantSpecificationsModal, setShowVariantSpecificationsModal] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState<number | null>(null);
  const [showCustomInput, setShowCustomInput] = useState<number | null>(null);
  const [customAttributeInput, setCustomAttributeInput] = useState('');
  const [selectedSpecCategory, setSelectedSpecCategory] = useState<string>('laptop');
  
  // Temporary ID for new spare parts
  const [tempSparePartId, setTempSparePartId] = useState('temp-sparepart-' + Date.now());
  
  // QR Code state
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  
  // Compatible devices state
  const [deviceSuggestions, setDeviceSuggestions] = useState<string[]>([]);
  const [showDeviceSuggestions, setShowDeviceSuggestions] = useState(false);
  const [deviceInputValue, setDeviceInputValue] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [savedDevices, setSavedDevices] = useState<string[]>([]);

  // Device database for suggestions
  const deviceDatabase = [
    // Apple Devices
    { name: 'iPhone 15 Pro Max', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 15 Pro', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 15 Plus', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 15', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 14 Pro Max', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 14 Pro', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 14 Plus', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 14', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 13 Pro Max', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 13 Pro', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 13', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 12 Pro Max', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 12 Pro', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone 12', category: 'smartphone', brand: 'Apple' },
    { name: 'iPhone SE (3rd gen)', category: 'smartphone', brand: 'Apple' },
    { name: 'iPad Pro 12.9" (6th gen)', category: 'tablet', brand: 'Apple' },
    { name: 'iPad Pro 11" (4th gen)', category: 'tablet', brand: 'Apple' },
    { name: 'iPad Air (5th gen)', category: 'tablet', brand: 'Apple' },
    { name: 'iPad (10th gen)', category: 'tablet', brand: 'Apple' },
    { name: 'iPad mini (6th gen)', category: 'tablet', brand: 'Apple' },
    { name: 'MacBook Pro 16" M3 Max', category: 'laptop', brand: 'Apple' },
    { name: 'MacBook Pro 14" M3 Pro', category: 'laptop', brand: 'Apple' },
    { name: 'MacBook Air 15" M2', category: 'laptop', brand: 'Apple' },
    { name: 'MacBook Air 13" M2', category: 'laptop', brand: 'Apple' },
    { name: 'iMac 24" M1', category: 'desktop', brand: 'Apple' },
    { name: 'Mac Studio M2 Ultra', category: 'desktop', brand: 'Apple' },
    { name: 'Apple Watch Series 9', category: 'watch', brand: 'Apple' },
    { name: 'Apple Watch Ultra 2', category: 'watch', brand: 'Apple' },
    
    // Samsung Devices
    { name: 'Galaxy S24 Ultra', category: 'smartphone', brand: 'Samsung' },
    { name: 'Galaxy S24+', category: 'smartphone', brand: 'Samsung' },
    { name: 'Galaxy S24', category: 'smartphone', brand: 'Samsung' },
    { name: 'Galaxy S23 Ultra', category: 'smartphone', brand: 'Samsung' },
    { name: 'Galaxy S23+', category: 'smartphone', brand: 'Samsung' },
    { name: 'Galaxy S23', category: 'smartphone', brand: 'Samsung' },
    { name: 'Galaxy Z Fold 5', category: 'smartphone', brand: 'Samsung' },
    { name: 'Galaxy Z Flip 5', category: 'smartphone', brand: 'Samsung' },
    { name: 'Galaxy Tab S9 Ultra', category: 'tablet', brand: 'Samsung' },
    { name: 'Galaxy Tab S9+', category: 'tablet', brand: 'Samsung' },
    { name: 'Galaxy Tab S9', category: 'tablet', brand: 'Samsung' },
    { name: 'Galaxy Book4 Ultra', category: 'laptop', brand: 'Samsung' },
    { name: 'Galaxy Book4 Pro 360', category: 'laptop', brand: 'Samsung' },
    
    // Google Devices
    { name: 'Pixel 8 Pro', category: 'smartphone', brand: 'Google' },
    { name: 'Pixel 8', category: 'smartphone', brand: 'Google' },
    { name: 'Pixel 7a', category: 'smartphone', brand: 'Google' },
    { name: 'Pixel Tablet', category: 'tablet', brand: 'Google' },
    { name: 'Pixelbook Go', category: 'laptop', brand: 'Google' },
    
    // OnePlus Devices
    { name: 'OnePlus 12', category: 'smartphone', brand: 'OnePlus' },
    { name: 'OnePlus 11', category: 'smartphone', brand: 'OnePlus' },
    { name: 'OnePlus Open', category: 'smartphone', brand: 'OnePlus' },
    { name: 'OnePlus Pad', category: 'tablet', brand: 'OnePlus' },
    
    // Xiaomi Devices
    { name: 'Xiaomi 14 Pro', category: 'smartphone', brand: 'Xiaomi' },
    { name: 'Xiaomi 14', category: 'smartphone', brand: 'Xiaomi' },
    { name: 'Redmi Note 13 Pro', category: 'smartphone', brand: 'Xiaomi' },
    { name: 'Xiaomi Pad 6', category: 'tablet', brand: 'Xiaomi' },
    
    // Gaming Devices
    { name: 'Steam Deck OLED', category: 'gaming', brand: 'Valve' },
    { name: 'Nintendo Switch OLED', category: 'gaming', brand: 'Nintendo' },
    { name: 'PlayStation 5', category: 'gaming', brand: 'Sony' },
    { name: 'Xbox Series X', category: 'gaming', brand: 'Microsoft' },
    
    // Audio Devices
    { name: 'AirPods Pro (2nd gen)', category: 'audio', brand: 'Apple' },
    { name: 'AirPods Max', category: 'audio', brand: 'Apple' },
    { name: 'Sony WH-1000XM5', category: 'audio', brand: 'Sony' },
    { name: 'Bose QuietComfort 45', category: 'audio', brand: 'Bose' },
    
    // Accessories
    { name: 'Magic Keyboard', category: 'accessory', brand: 'Apple' },
    { name: 'Apple Pencil (2nd gen)', category: 'accessory', brand: 'Apple' },
    { name: 'Samsung S Pen', category: 'accessory', brand: 'Samsung' },
    { name: 'USB-C Hub', category: 'accessory', brand: 'Generic' },
    { name: 'Lightning Cable', category: 'accessory', brand: 'Apple' },
    { name: 'USB-C Cable', category: 'accessory', brand: 'Generic' },
    { name: 'Wireless Charger', category: 'accessory', brand: 'Generic' },
  ];

  // Helper functions for device management
  const getDeviceIcon = (device: string) => {
    const deviceLower = device.toLowerCase();
    if (deviceLower.includes('iphone') || deviceLower.includes('galaxy s') || deviceLower.includes('pixel')) {
      return <Smartphone className="w-4 h-4" />;
    } else if (deviceLower.includes('ipad') || deviceLower.includes('galaxy tab') || deviceLower.includes('tablet')) {
      return <Tablet className="w-4 h-4" />;
    } else if (deviceLower.includes('macbook') || deviceLower.includes('galaxy book') || deviceLower.includes('laptop')) {
      return <Laptop className="w-4 h-4" />;
    } else if (deviceLower.includes('imac') || deviceLower.includes('mac studio') || deviceLower.includes('desktop')) {
      return <Monitor className="w-4 h-4" />;
    } else if (deviceLower.includes('watch')) {
      return <Watch className="w-4 h-4" />;
    } else if (deviceLower.includes('airpods') || deviceLower.includes('headphones') || deviceLower.includes('audio')) {
      return <Headphones className="w-4 h-4" />;
    } else if (deviceLower.includes('camera')) {
      return <Camera className="w-4 h-4" />;
    } else if (deviceLower.includes('steam deck') || deviceLower.includes('switch') || deviceLower.includes('playstation') || deviceLower.includes('xbox')) {
      return <Gamepad2 className="w-4 h-4" />;
    }
    return <Smartphone className="w-4 h-4" />;
  };

  const searchDevices = (query: string) => {
    if (query.length < 2) return [];
    
    const allDevices = getAllDevices();
    const queryLower = query.toLowerCase();
    
    // First, search in built-in database with full metadata
    const builtInMatches = deviceDatabase
      .filter(device => 
        device.name.toLowerCase().includes(queryLower) ||
        device.brand.toLowerCase().includes(queryLower) ||
        device.category.toLowerCase().includes(queryLower)
      )
      .map(device => ({ name: device.name, type: 'built-in' }));
    
    // Then, search in saved devices
    const savedMatches = savedDevices
      .filter(device => device.toLowerCase().includes(queryLower))
      .map(device => ({ name: device, type: 'saved' }));
    
    // Combine and prioritize built-in devices, then saved devices
    const allMatches = [...builtInMatches, ...savedMatches];
    
    // Remove duplicates and limit results
    const uniqueMatches = allMatches.filter((device, index, self) => 
      index === self.findIndex(d => d.name === device.name)
    );
    
    return uniqueMatches.slice(0, 8).map(device => device.name);
  };

  const addDevice = (device: string) => {
    if (device.trim() && !selectedDevices.includes(device.trim())) {
      const newDevices = [...selectedDevices, device.trim()];
      setSelectedDevices(newDevices);
      setFormData(prev => ({
        ...prev,
        compatibleDevices: newDevices.join(', ')
      }));
      setDeviceInputValue('');
      setShowDeviceSuggestions(false);
    }
  };

  const removeDevice = (deviceToRemove: string) => {
    const newDevices = selectedDevices.filter(device => device !== deviceToRemove);
    setSelectedDevices(newDevices);
    setFormData(prev => ({
      ...prev,
      compatibleDevices: newDevices.join(', ')
    }));
  };

  // Local storage functions for saved devices
  const STORAGE_KEY = 'lats_saved_devices';
  
  const loadSavedDevices = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedDevices = JSON.parse(saved);
        setSavedDevices(Array.isArray(parsedDevices) ? parsedDevices : []);
      }
    } catch (error) {
      console.error('Error loading saved devices:', error);
      setSavedDevices([]);
    }
  };

  const saveDeviceToStorage = (device: string) => {
    try {
      const trimmedDevice = device.trim();
      if (trimmedDevice && !savedDevices.includes(trimmedDevice)) {
        const newSavedDevices = [...savedDevices, trimmedDevice];
        setSavedDevices(newSavedDevices);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSavedDevices));
        
        // Show success message
        toast.success(`"${trimmedDevice}" added to your device suggestions!`, {
          duration: 3000,
          icon: '📱',
        });
      }
    } catch (error) {
      console.error('Error saving device:', error);
      toast.error('Failed to save device to suggestions');
    }
  };

  const removeSavedDevice = (deviceToRemove: string) => {
    try {
      const newSavedDevices = savedDevices.filter(device => device !== deviceToRemove);
      setSavedDevices(newSavedDevices);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSavedDevices));
      toast.success(`"${deviceToRemove}" removed from suggestions`);
    } catch (error) {
      console.error('Error removing saved device:', error);
    }
  };

  // Combined device database (built-in + saved)
  const getAllDevices = () => {
    const builtInDevices = deviceDatabase.map(d => d.name);
    return [...new Set([...builtInDevices, ...savedDevices])].sort();
  };
  
  // Initialize selected devices from form data
  useEffect(() => {
    if (formData.compatibleDevices) {
      const devices = formData.compatibleDevices.split(',').map(device => device.trim()).filter(Boolean);
      setSelectedDevices(devices);
    }
  }, [formData.compatibleDevices]);

  // Load categories and suppliers on mount
  useEffect(() => {
    loadSparePartCategories();
    loadSuppliers();
  }, [loadSparePartCategories, loadSuppliers]);

  // Ensure default variant exists when variants are enabled
  useEffect(() => {
    ensureDefaultVariant();
  }, [useVariants]);

  // Load store locations
  useEffect(() => {
    const loadStoreData = async () => {
      try {
        setLoadingLocations(true);
        console.log('🔍 [DEBUG] Loading store locations...');
        const locations = await storeLocationApi.getAll();
        console.log('✅ [DEBUG] Store locations loaded:', locations.length);
        setStoreLocations(locations);
      } catch (error) {
        console.error('❌ [DEBUG] Error loading store locations:', error);
        toast.error('Failed to load store locations. Please check your connection and try again.');
        setStoreLocations([]);
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
      console.log('🔍 [DEBUG] Initializing form with existing spare part:', sparePart);
      
      const initialFormData = {
        name: sparePart.name,
        categoryId: sparePart.category_id,
        partNumber: sparePart.part_number,
        brand: sparePart.brand || '',
        supplierId: sparePart.supplier_id || null,
        condition: sparePart.condition || 'new',
        description: sparePart.description || '',
        costPrice: sparePart.cost_price,
        sellingPrice: sparePart.selling_price,
        quantity: sparePart.quantity,
        minQuantity: sparePart.min_quantity,
        storageRoomId: sparePart.storage_room_id || '',
        shelfId: sparePart.store_shelf_id || '',
        storeLocationId: sparePart.storage_room_id || '',
        location: sparePart.location || '',
        compatibleDevices: sparePart.compatible_devices || '',
        images: []
      };
      
      setFormData(initialFormData);

      // Check if this spare part uses variants
      const hasVariants = sparePart.variants && sparePart.variants.length > 0;
      const usesVariants = sparePart.metadata?.useVariants || hasVariants;
      
      console.log('🔍 [DEBUG] Spare part variant info:', {
        hasVariants,
        usesVariants,
        variantsCount: sparePart.variants?.length || 0,
        metadata: sparePart.metadata
      });

      if (usesVariants && hasVariants) {
        // Set variants from existing data
        setUseVariants(true);
        setVariants(sparePart.variants);
        setShowVariants(true);
        console.log('✅ [DEBUG] Loaded existing variants:', sparePart.variants);
      } else if (usesVariants && !hasVariants) {
        // Spare part is marked to use variants but has no variants - create default
        setUseVariants(true);
        console.log('🔍 [DEBUG] Creating default variant for existing spare part...');
        const defaultVariant = createVariantFromFormData('Default', 0);
        setVariants([defaultVariant]);
        setShowVariants(true);
        console.log('✅ [DEBUG] Created default variant for existing spare part:', defaultVariant);
      }

      // If spare part has a location, try to find the store location
      if (sparePart.location) {
        findLocationForShelf(sparePart.location);
      }

      // Load images from database
      loadSparePartImages();
      
    }
  }, [sparePart]);

  // Load spare part images from database
  const loadSparePartImages = async () => {
    if (!sparePart?.id) return;

    try {
      const { getSparePartImages } = await import('../../lib/sparePartsApi');
      const dbImages = await getSparePartImages(sparePart.id);
      
      if (dbImages && dbImages.length > 0) {
        const formattedImages = dbImages.map((dbImage, index) => ({
          id: dbImage.id,
          url: dbImage.image_url,
          thumbnailUrl: dbImage.thumbnail_url || dbImage.image_url,
          fileName: dbImage.file_name || `image-${index + 1}`,
          fileSize: dbImage.file_size || 0,
          isPrimary: dbImage.is_primary || false,
          uploadedAt: dbImage.created_at || new Date().toISOString(),
          mimeType: dbImage.mime_type || 'image/jpeg',
          image_url: dbImage.image_url,
          file_name: dbImage.file_name,
          file_size: dbImage.file_size,
          mime_type: dbImage.mime_type,
          is_primary: dbImage.is_primary
        }));
        
        setFormData(prev => ({ ...prev, images: formattedImages }));
      } else {
        const sparePartImages = sparePart.images || [];
        
        if (sparePartImages.length > 0) {
          const fallbackImages = sparePartImages.map((url: string, index: number) => ({
            id: `fallback-${index}`,
            url: url,
            thumbnailUrl: url,
            fileName: `image-${index + 1}.jpg`,
            fileSize: 0,
            isPrimary: index === 0,
            uploadedAt: new Date().toISOString(),
            mimeType: 'image/jpeg',
            image_url: url,
            file_name: `image-${index + 1}.jpg`,
            file_size: 0,
            mime_type: 'image/jpeg',
            is_primary: index === 0
          }));
          
          setFormData(prev => ({ ...prev, images: fallbackImages }));
        } else {
          setFormData(prev => ({ ...prev, images: [] }));
        }
      }
    } catch (error) {
      console.error('Failed to load images:', error);
      toast.error('Failed to load images for editing');
      setFormData(prev => ({ ...prev, images: [] }));
    }
  };

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

    // Only validate pricing and stock if not using variants
    if (!useVariants) {
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
    }

    // Validate variants if using variants
    if (useVariants) {
      if (variants.length === 0) {
        newErrors.variants = 'At least one variant is required when using variants';
      } else {
        variants.forEach((variant, index) => {
          if (!variant.name || variant.name.trim() === '') {
            newErrors[`variant_${index}_name`] = 'Variant name is required';
          }
          if (variant.cost_price < 0) {
            newErrors[`variant_${index}_costPrice`] = 'Variant cost price must be 0 or greater';
          }
          if (variant.selling_price < 0) {
            newErrors[`variant_${index}_sellingPrice`] = 'Variant selling price must be 0 or greater';
          }
          if (variant.quantity < 0) {
            newErrors[`variant_${index}_quantity`] = 'Variant stock quantity must be 0 or greater';
          }
          if (variant.min_quantity < 0) {
            newErrors[`variant_${index}_minQuantity`] = 'Variant min stock level must be 0 or greater';
          }
        });
      }
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
      console.log('🔍 [DEBUG] Loading storage rooms...');
      const rooms = await storageRoomApi.getAll();
      console.log('✅ [DEBUG] Storage rooms loaded:', rooms?.length || 0);
      setStorageRooms(rooms || []);
    } catch (error) {
      console.error('❌ [DEBUG] Error loading storage rooms:', error);
      toast.error('Failed to load storage rooms. Please check your connection and try again.');
      setStorageRooms([]);
    }
  };

  const loadAllShelves = async () => {
    try {
      console.log('🔍 [DEBUG] Loading shelves for all storage rooms...');
      const shelvesData: Record<string, StoreShelf[]> = {};
      
      for (const room of storageRooms) {
        console.log(`🔍 [DEBUG] Loading shelves for room: ${room.name} (${room.id})`);
        const roomShelves = await storeShelfApi.getShelvesByStorageRoom(room.id);
        shelvesData[room.id] = roomShelves || [];
        console.log(`✅ [DEBUG] Loaded ${roomShelves?.length || 0} shelves for room: ${room.name}`);
      }
      
      console.log('✅ [DEBUG] All shelves loaded successfully');
      setAllShelves(shelvesData);
    } catch (error) {
      console.error('❌ [DEBUG] Error loading shelves:', error);
      toast.error('Failed to load shelves. Please check your connection and try again.');
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
        updatedBy: currentUser?.id,
        // Include variants data
        useVariants: useVariants,
        variants: useVariants ? variants : []
      };
      
      // Let the parent component handle the API call
      await onSave(sparePartData);
      
    } catch (error: any) {
      console.error('Error saving spare part:', error);
      toast.error(error.message || 'Failed to save spare part');
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

  // Function to create a variant from current form data
  const createVariantFromFormData = (variantName?: string, variantIndex: number = 0): SparePartVariant => {
    const defaultName = variantName || (variantIndex === 0 ? 'Default' : `Variant ${variantIndex + 1}`);
    const skuSuffix = variantIndex === 0 ? 'DEFAULT' : `V${String(variantIndex + 1).padStart(2, '0')}`;
    
    return {
      name: defaultName,
      sku: `${formData.partNumber}-${skuSuffix}`,
      cost_price: formData.costPrice || 0,
      selling_price: formData.sellingPrice || 0,
      quantity: formData.quantity || 0,
      min_quantity: formData.minQuantity || 0,
      attributes: {},
      // Use main product image as fallback for first variant
      image_url: formData.images && formData.images.length > 0 ? formData.images[0].image_url || formData.images[0].url : undefined
    };
  };

  // Handle variants toggle - automatically create variant from form data
  const handleUseVariantsToggle = (enabled: boolean) => {
    console.log('🔍 [DEBUG] Toggling variants:', { enabled, currentVariantsCount: variants.length });
    
    setUseVariants(enabled);
    
    if (enabled) {
      // Always ensure we have at least one variant when enabling variants
      if (variants.length === 0) {
        console.log('🔍 [DEBUG] Creating default variant from form data...');
        const defaultVariant = createVariantFromFormData('Default', 0);
        console.log('✅ [DEBUG] Created default variant:', defaultVariant);
        setVariants([defaultVariant]);
        setShowVariants(true);
        
        // Show success message
        toast.success('Default variant created from main product data');
      } else {
        // If variants already exist, just show the variants section
        setShowVariants(true);
        console.log('✅ [DEBUG] Variants already exist, showing variants section');
      }
    } else {
      // Clear variants when disabling
      console.log('🔍 [DEBUG] Disabling variants, clearing variant data');
      setVariants([]);
      setShowVariants(false);
      toast.info('Variants disabled - using main product data');
    }
  };

  // Update the first variant when form data changes (if variants are enabled)
  useEffect(() => {
    if (useVariants && variants.length > 0) {
      console.log('🔍 [DEBUG] Updating first variant with form data changes...');
      const updatedVariant = createVariantFromFormData(variants[0]?.name || 'Default', 0);
      
      setVariants(prev => prev.map((variant, index) => {
        if (index === 0) {
          // Preserve the variant name and attributes, but update pricing and stock
          const updated = { 
            ...variant, 
            ...updatedVariant,
            name: variant.name || updatedVariant.name, // Keep existing name
            attributes: variant.attributes || {} // Keep existing attributes
          };
          console.log('✅ [DEBUG] Updated first variant:', updated);
          return updated;
        }
        return variant;
      }));
    }
  }, [formData.costPrice, formData.sellingPrice, formData.quantity, formData.minQuantity, formData.partNumber, useVariants]);

  // Ensure there's always a default variant when variants are enabled
  const ensureDefaultVariant = () => {
    if (useVariants && variants.length === 0) {
      console.log('🔍 [DEBUG] Ensuring default variant exists...');
      const defaultVariant = createVariantFromFormData('Default', 0);
      setVariants([defaultVariant]);
      setShowVariants(true);
      console.log('✅ [DEBUG] Default variant ensured:', defaultVariant);
    }
  };

  // Add a new variant
  const addNewVariant = () => {
    const newVariantIndex = variants.length;
    const newVariant = createVariantFromFormData(`Variant ${newVariantIndex + 1}`, newVariantIndex);
    setVariants(prev => [...prev, newVariant]);
    console.log('✅ [DEBUG] Added new variant:', newVariant);
    toast.success(`Added new variant: ${newVariant.name}`);
  };

  // Add attribute to a variant
  const addAttributeToVariant = (variantIndex: number, attributeName: string, defaultValue: string = '') => {
    const variant = variants[variantIndex];
    const newAttributes = { ...variant.attributes, [attributeName]: defaultValue };
    updateVariant(variantIndex, 'attributes', newAttributes);
  };

  // Update specification value for a variant
  const updateVariantSpecification = (variantIndex: number, specKey: string, value: string | boolean) => {
    const variant = variants[variantIndex];
    const newAttributes = { ...variant.attributes, [specKey]: value };
    updateVariant(variantIndex, 'attributes', newAttributes);
  };

  // Handle custom attribute submission
  const handleCustomAttributeSubmit = (variantIndex: number) => {
    if (customAttributeInput.trim()) {
      const cleanName = customAttributeInput.trim().toLowerCase().replace(/\s+/g, '_');
      addAttributeToVariant(variantIndex, cleanName);
      setShowCustomInput(null);
      setCustomAttributeInput('');
    }
  };

  // Cancel custom attribute input
  const cancelCustomAttribute = () => {
    setShowCustomInput(null);
    setCustomAttributeInput('');
  };

  // Update variant function
  const updateVariant = (index: number, field: keyof SparePartVariant, value: any) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  // Remove attribute from a variant
  const removeAttributeFromVariant = (variantIndex: number, attributeName: string) => {
    const variant = variants[variantIndex];
    const newAttributes = { ...variant.attributes };
    delete newAttributes[attributeName];
    updateVariant(variantIndex, 'attributes', newAttributes);
  };

  const handleVariantSpecificationsClick = (index: number) => {
    setCurrentVariantIndex(index);
    setShowVariantSpecificationsModal(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto">
          <GlassCard className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  {sparePart ? 'Edit Part' : 'Add Part'}
                </h2>
              </div>
              <button
                onClick={onCancel}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package size={16} className="text-blue-600" />
                  Basic Info
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label 
                      htmlFor="spare-part-name"
                      className={`block mb-1 font-medium text-sm ${errors.name ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Name *
                    </label>
                    <div className="relative">
                      <input
                        id="spare-part-name"
                        type="text"
                        className={`w-full py-2 pl-10 pr-3 bg-white/30 backdrop-blur-md border-2 rounded focus:outline-none transition-colors text-sm ${
                          errors.name ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="e.g., iPhone 14 Screen"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Part Number */}
                  <div>
                    <label 
                      htmlFor="part-number"
                      className={`block mb-1 font-medium text-sm ${errors.partNumber ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Part Number *
                    </label>
                    <div className="relative">
                      <input
                        id="part-number"
                        type="text"
                        className={`w-full py-2 pl-10 pr-3 bg-white/30 backdrop-blur-md border-2 rounded focus:outline-none transition-colors text-sm ${
                          errors.partNumber ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="e.g., IP14-SCR-001"
                        value={formData.partNumber}
                        onChange={(e) => handleInputChange('partNumber', e.target.value)}
                        required
                      />
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    </div>
                    {errors.partNumber && (
                      <p className="mt-1 text-xs text-red-600">{errors.partNumber}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label 
                      htmlFor="category"
                      className={`block mb-1 font-medium text-sm ${errors.categoryId ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      Category *
                    </label>
                    <CategoryInput
                      value={formData.categoryId}
                      onChange={(categoryId) => handleInputChange('categoryId', categoryId)}
                      placeholder="Select category"
                      categories={categories}
                      required
                      error={errors.categoryId}
                      className="w-full"
                    />
                    {errors.categoryId && (
                      <p className="mt-1 text-xs text-red-600">{errors.categoryId}</p>
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
                    <BrandInput
                      value={formData.brand}
                      onChange={(value) => handleInputChange('brand', value)}
                      placeholder="e.g., Apple, Samsung"
                      className="w-full"
                    />
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

                {/* Compatible Devices - Enhanced */}
                <div>
                  <label 
                    htmlFor="compatible-devices"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Compatible Devices
                    <span className="text-sm text-gray-500 ml-2">({selectedDevices.length} selected)</span>
                  </label>
                  
                  {/* Selected Devices Tags */}
                  {selectedDevices.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selectedDevices.map((device, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200"
                        >
                          {getDeviceIcon(device)}
                          <span className="max-w-[200px] truncate">{device}</span>
                          <button
                            type="button"
                            onClick={() => removeDevice(device)}
                            className="ml-1 p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Device Input with Suggestions */}
                  <div className="relative">
                    <input
                      type="text"
                      id="compatible-devices"
                      className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Type device name (e.g., iPhone 15, Galaxy S24, MacBook Pro)..."
                      value={deviceInputValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDeviceInputValue(value);
                        
                        if (value.length >= 2) {
                          const suggestions = searchDevices(value);
                          setDeviceSuggestions(suggestions);
                          setShowDeviceSuggestions(suggestions.length > 0);
                        } else {
                          setShowDeviceSuggestions(false);
                          setDeviceSuggestions([]);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (deviceInputValue.trim()) {
                            addDevice(deviceInputValue.trim());
                          }
                        }
                        if (e.key === 'Escape') {
                          setShowDeviceSuggestions(false);
                        }
                      }}
                      onFocus={() => {
                        if (deviceInputValue.length >= 2) {
                          const suggestions = searchDevices(deviceInputValue);
                          setDeviceSuggestions(suggestions);
                          setShowDeviceSuggestions(suggestions.length > 0);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow clicking on them
                        setTimeout(() => setShowDeviceSuggestions(false), 200);
                      }}
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    
                    {/* Device Suggestions Dropdown */}
                    {showDeviceSuggestions && deviceSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        {deviceSuggestions.map((device, index) => (
                          <button
                            key={index}
                            type="button"
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0 transition-colors"
                            onClick={() => addDevice(device)}
                          >
                            <div className="text-gray-500">
                              {getDeviceIcon(device)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{device}</div>
                              <div className="text-sm text-gray-500">
                                {deviceDatabase.find(d => d.name === device)?.brand} • {deviceDatabase.find(d => d.name === device)?.category}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Helper Text */}
                  <div className="mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>💡 Start typing to see device suggestions</span>
                      <span>⌨️ Press Enter to add custom device</span>
                      <span>🏷️ Click suggestions to add quickly</span>
                    </div>
                  </div>

                  {/* Popular Devices Quick Add */}
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">Popular devices:</div>
                    <div className="flex flex-wrap gap-1">
                      {['iPhone 15 Pro', 'iPhone 14', 'Galaxy S24', 'MacBook Pro', 'iPad Air'].map((device) => (
                        <button
                          key={device}
                          type="button"
                          onClick={() => addDevice(device)}
                          disabled={selectedDevices.includes(device)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-full border border-gray-200 transition-colors"
                        >
                          + {device}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing and Stock - Only show when not using variants */}
              {!useVariants && (
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
              )}

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
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">No Storage Data Available</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          You need to create storage rooms and shelves before adding spare parts. 
                          Go to <strong>Settings → Storage Management</strong> to set up your storage infrastructure.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          loadStorageRooms();
                          loadAllShelves();
                        }}
                        className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                      >
                        Retry
                      </button>
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



              {/* Spare Part Variants Section */}
              <SparePartVariantsSection
                variants={variants}
                setVariants={setVariants}
                useVariants={useVariants}
                setUseVariants={handleUseVariantsToggle}
                showVariants={showVariants}
                setShowVariants={setShowVariants}
                isReorderingVariants={isReorderingVariants}
                setIsReorderingVariants={setIsReorderingVariants}
                draggedVariantIndex={draggedVariantIndex}
                setDraggedVariantIndex={setDraggedVariantIndex}
                onVariantSpecificationsClick={handleVariantSpecificationsClick}
                basePartNumber={formData.partNumber}
                mainProductImages={formData.images}
              />

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
                    existingImages={formData.images}
                    onImagesChange={(images) => {
                      console.log('🔍 [SparePartForm] SimpleImageUpload onImagesChange called with:', images);
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
                      console.log('🔍 [SparePartForm] Setting form data with images:', formImages);
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
                      <LayoutGrid size={36} className="text-gray-400" />
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

      {/* Variant Specifications Modal */}
      {showVariantSpecificationsModal && currentVariantIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-2"
          role="dialog"
          aria-modal="true"
          aria-labelledby="variant-specifications-modal-title"
        >
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[85vh] overflow-hidden mx-auto">
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  <div>
                    <h2 id="variant-specifications-modal-title" className="text-lg font-semibold">
                      Variant Specs
                    </h2>
                    <p className="text-blue-100 text-xs">
                      {variants[currentVariantIndex]?.name || `Variant ${currentVariantIndex + 1}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVariantSpecificationsModal(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
              <div className="flex gap-1 overflow-x-auto">
                {specificationCategories.map((category) => {
                  const IconComponent = category.icon;
                  const isSelected = selectedSpecCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedSpecCategory(category.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        isSelected
                          ? `bg-${category.color}-500 text-white`
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent size={14} />
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)]">
              <div className="space-y-4">
                {/* Specifications Grid - Grouped by Type */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Plus size={16} className="text-blue-600" />
                    {specificationCategories.find(cat => cat.id === selectedSpecCategory)?.name}
                  </h3>
                  
                  {Object.entries(getSpecificationsByType(selectedSpecCategory)).map(([type, specs]) => {
                    if (specs.length === 0) return null;
                    
                    return (
                      <div key={type} className="mb-4">
                        <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {getTypeDisplayName(type)}
                          </span>
                          <span className="text-xs text-gray-500">({specs.length})</span>
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {specs.map((spec) => {
                            const IconComponent = spec.icon;
                            const currentValue = variants[currentVariantIndex]?.attributes?.[spec.key] || '';
                            const isBoolean = spec.type === 'boolean';
                            
                            return (
                              <div key={spec.key} className="bg-white border border-gray-200 rounded-lg p-3">
                                <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                                  <IconComponent size={12} className="text-gray-500" />
                                  {spec.name}
                                  {spec.unit && <span className="text-xs text-gray-500">({spec.unit})</span>}
                                </label>
                                
                                {isBoolean ? (
                                  <button
                                    type="button"
                                    onClick={() => updateVariantSpecification(currentVariantIndex, spec.key, !currentValue)}
                                    className={`w-full p-2 border rounded-lg transition-colors ${
                                      currentValue
                                        ? 'bg-green-50 border-green-300 text-green-800'
                                        : 'bg-white border-gray-300 text-gray-600 hover:border-blue-500 hover:bg-blue-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center">
                                      <Check size={14} className={currentValue ? 'text-green-600' : 'text-gray-400'} />
                                    </div>
                                  </button>
                                ) : spec.type === 'select' && spec.options ? (
                                  <select
                                    value={currentValue as string}
                                    onChange={(e) => updateVariantSpecification(currentVariantIndex, spec.key, e.target.value)}
                                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xs"
                                  >
                                    <option value="">Select</option>
                                    {spec.options.map((option) => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="relative">
                                    <input
                                      type={spec.type === 'number' ? 'number' : 'text'}
                                      value={currentValue as string}
                                      onChange={(e) => updateVariantSpecification(currentVariantIndex, spec.key, e.target.value)}
                                      placeholder={spec.placeholder || `Enter ${spec.name.toLowerCase()}`}
                                      className="w-full py-1.5 px-2 pr-6 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xs"
                                      autoComplete="off"
                                      autoCorrect="off"
                                      spellCheck={false}
                                    />
                                    {currentValue && (
                                      <button
                                        type="button"
                                        onClick={() => updateVariantSpecification(currentVariantIndex, spec.key, '')}
                                        className="absolute right-1 top-1.5 text-red-500 hover:text-red-700"
                                        title="Clear value"
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Specification */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Plus size={16} className="text-gray-600" />
                    Custom
                  </h3>
                  
                  {showCustomInput === currentVariantIndex ? (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customAttributeInput}
                          onChange={(e) => setCustomAttributeInput(e.target.value)}
                          placeholder="Enter custom spec name..."
                          className="flex-1 py-1.5 px-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xs"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && customAttributeInput.trim()) {
                              handleCustomAttributeSubmit(currentVariantIndex);
                            }
                          }}
                          autoFocus
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                        />
                        <button 
                          type="button" 
                          onClick={() => handleCustomAttributeSubmit(currentVariantIndex)} 
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                        >
                          Add
                        </button>
                        <button 
                          type="button" 
                          onClick={cancelCustomAttribute} 
                          className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => { setShowCustomInput(currentVariantIndex); setCustomAttributeInput(''); }} 
                      className="flex items-center gap-2 p-2 bg-white border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors w-full"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">Add Custom</span>
                    </button>
                  )}
                </div>

                {/* Current Specifications Summary */}
                {variants[currentVariantIndex]?.attributes && Object.keys(variants[currentVariantIndex].attributes).length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Check size={16} className="text-green-600" />
                      Current
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {Object.keys(variants[currentVariantIndex].attributes).length}
                      </span>
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {Object.entries(variants[currentVariantIndex].attributes).map(([key, value]) => (
                        <div key={key} className="bg-green-50 border border-green-200 rounded-lg p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-green-800 capitalize truncate">
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div className="text-xs text-green-600 truncate">
                                {String(value) || 'Not set'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttributeFromVariant(currentVariantIndex, key)}
                              className="ml-1 text-red-500 hover:text-red-700 flex-shrink-0"
                              title="Remove specification"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-600">
                  {variants[currentVariantIndex]?.attributes && Object.keys(variants[currentVariantIndex].attributes).length > 0 
                    ? `${Object.keys(variants[currentVariantIndex].attributes).length} spec${Object.keys(variants[currentVariantIndex].attributes).length !== 1 ? 's' : ''} added`
                    : 'No specs added yet'
                  }
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVariantSpecificationsModal(false)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVariantSpecificationsModal(false);
                      toast.success('Variant specifications saved successfully!');
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SparePartAddEditForm;
