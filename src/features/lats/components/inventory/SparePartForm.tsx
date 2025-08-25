import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { X, Save, Package, AlertCircle, QrCode, Download, DollarSign, Image as ImageIcon, MapPin, Layers } from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { SparePart } from '../../types/inventory';
import { SimpleImageUpload } from '../../../../components/SimpleImageUpload';
import { toast } from 'react-hot-toast';
import { StoreLocation } from '../../../settings/types/storeLocation';
import { storeLocationApi } from '../../../settings/utils/storeLocationApi';

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
  const { categories, suppliers, loadCategories, loadSuppliers } = useInventoryStore();

  // Store location and shelf state
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [shelves, setShelves] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingShelves, setLoadingShelves] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    partNumber: '',
    brand: '',
    supplierId: '',
    condition: '',
    description: '',
    costPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    minQuantity: 0,
    storeLocationId: '',
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

  // Load categories and suppliers on mount
  useEffect(() => {
    loadCategories();
    loadSuppliers();
  }, [loadCategories, loadSuppliers]);

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

  // Initialize form with existing data
  useEffect(() => {
    if (sparePart) {
      setFormData({
        name: sparePart.name,
        categoryId: sparePart.categoryId,
        partNumber: sparePart.partNumber,
        costPrice: sparePart.costPrice,
        sellingPrice: sparePart.sellingPrice,
        quantity: sparePart.quantity,
        minQuantity: sparePart.minQuantity,
        storeLocationId: '', // Will be set based on location lookup
        location: sparePart.location || '',
        compatibleDevices: sparePart.compatibleDevices || ''
      });

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
      newErrors.name = 'Name is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.partNumber.trim()) {
      newErrors.partNumber = 'Part number is required';
    }

    if (formData.costPrice < 0) {
      newErrors.costPrice = 'Cost price cannot be negative';
    }

    if (formData.sellingPrice < 0) {
      newErrors.sellingPrice = 'Selling price cannot be negative';
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }

    if (formData.minQuantity < 0) {
      newErrors.minQuantity = 'Minimum quantity cannot be negative';
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
    } catch (error) {
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
                  <Package className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Name *
                    </label>
                    <input
                      type="text"
                      className={`w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.name ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="e.g., iPhone 14 Screen"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Part Number */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Part Number *
                    </label>
                    <input
                      type="text"
                      className={`w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.partNumber ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="e.g., IP14-SCR-001"
                      value={formData.partNumber}
                      onChange={(e) => handleInputChange('partNumber', e.target.value)}
                    />
                    {errors.partNumber && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.partNumber}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Category *
                    </label>
                    <select
                      className={`w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.categoryId ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      value={formData.categoryId}
                      onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.categoryId}
                      </p>
                    )}
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Brand
                    </label>
                    <input
                      type="text"
                      className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="e.g., Apple, Samsung"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                    />
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Supplier
                    </label>
                    <select
                      className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
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
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Condition
                    </label>
                    <select
                      className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                      value={formData.condition}
                      onChange={(e) => handleInputChange('condition', e.target.value)}
                    >
                      <option value="">Select Condition</option>
                      <option value="new">New</option>
                      <option value="refurbished">Refurbished</option>
                      <option value="used">Used</option>
                      <option value="damaged">Damaged</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing and Stock */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Pricing & Stock
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cost Price */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Cost Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.costPrice ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="0.00"
                      value={formData.costPrice}
                      onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                    />
                    {errors.costPrice && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.costPrice}
                      </p>
                    )}
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Selling Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.sellingPrice ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="0.00"
                      value={formData.sellingPrice}
                      onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                    />
                    {errors.sellingPrice && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.sellingPrice}
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      className={`w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.quantity ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="0"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    />
                    {errors.quantity && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.quantity}
                      </p>
                    )}
                  </div>

                  {/* Minimum Quantity */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Minimum Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      className={`w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.minQuantity ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="0"
                      value={formData.minQuantity}
                      onChange={(e) => handleInputChange('minQuantity', parseInt(e.target.value) || 0)}
                    />
                    {errors.minQuantity && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.minQuantity}
                      </p>
                    )}
                  </div>

                  {/* Store Location and Shelf Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-2">
                    {/* Store Location */}
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Store Location
                      </label>
                      <select
                        className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                        value={formData.storeLocationId}
                        onChange={(e) => handleInputChange('storeLocationId', e.target.value)}
                        disabled={loadingLocations}
                      >
                        <option value="">{loadingLocations ? 'Loading...' : 'Select Store Location'}</option>
                        {storeLocations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name} ({location.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Shelf Selection */}
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">
                        <Building className="w-4 h-4 inline mr-2" />
                        Storage Room
                      </label>
                      <select
                        className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        disabled={!formData.storeLocationId || loadingShelves}
                      >
                        <option value="">
                          {!formData.storeLocationId 
                            ? 'Select Location First' 
                            : loadingShelves 
                              ? 'Loading...' 
                              : 'Select Shelf'
                          }
                        </option>
                        {shelves.map((shelf) => (
                          <option key={shelf.id} value={shelf.code}>
                            {shelf.name} ({shelf.code}) - {shelf.current_capacity}/{shelf.max_capacity || '∞'}
                          </option>
                        ))}
                      </select>
                      {formData.storeLocationId && shelves.length === 0 && !loadingShelves && (
                        <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-sm text-yellow-800">
                            No storage rooms found for this location.
                            <button
                              type="button"
                              onClick={() => window.open('/lats/inventory-management?storage-room', '_blank')}
                              className="text-blue-600 hover:text-blue-800 ml-1 underline"
                            >
                              Manage storage rooms
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Additional Information
                </h3>
                
                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Describe the spare part, its specifications, and any important details..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Compatible Devices */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Compatible Devices
                    </label>
                    <textarea
                      className="w-full py-3 px-3 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="List compatible device models (e.g., iPhone 14, iPhone 14 Plus, iPhone 14 Pro)"
                      value={formData.compatibleDevices}
                      onChange={(e) => handleInputChange('compatibleDevices', e.target.value)}
                      rows={2}
                    />
                  </div>
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
    </>
  );
};

export default SparePartForm;
