import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Package, AlertTriangle, Upload, Trash2, MapPin, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassInput from '../../../shared/components/ui/GlassInput';
import GlassSelect from '../../../shared/components/ui/GlassSelect';
import GlassButton from '../../../shared/components/ui/GlassButton';
import GlassBadge from '../../../shared/components/ui/GlassBadge';
import PriceInput from '../../../../shared/components/ui/PriceInput';
import { LATS_CLASSES } from '../../tokens';
import { t } from '../../lib/i18n/t';
import { format } from '../../lib/format';
import { Product, Category, Brand, Supplier, ProductImage } from '../../types/inventory';
import { StoreLocation } from '../../../settings/types/storeLocation';
import { storeLocationApi } from '../../../settings/utils/storeLocationApi';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { storageRoomApi, StorageRoom } from '../../../settings/utils/storageRoomApi';
import { storeShelfApi, StoreShelf } from '../../../settings/utils/storeShelfApi';

// Validation schema for product editing
const editProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU must be less than 100 characters'),
  barcode: z.string().max(100, 'Barcode must be less than 100 characters').optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  supplierId: z.string().optional(),
  condition: z.string().min(1, 'Condition is required'),
  storeLocationId: z.string().optional(),
  storeShelf: z.string().optional(),

  price: z.number().min(0, 'Price must be 0 or greater'),
  costPrice: z.number().min(0, 'Cost price must be 0 or greater'),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater'),
  minStockLevel: z.number().min(0, 'Minimum stock level must be 0 or greater'),
  weight: z.number().min(0, 'Weight must be 0 or greater').optional(),
  tags: z.array(z.string()).default([])
});

type EditProductFormData = z.infer<typeof editProductSchema>;

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onProductUpdated?: (product: any) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  productId,
  onProductUpdated
}) => {
  const { categories, brands, suppliers, updateProduct, loadCategories, loadBrands, loadSuppliers, getProduct } = useInventoryStore();
  
  const [tagInput, setTagInput] = useState('');
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [storageRooms, setStorageRooms] = useState<StorageRoom[]>([]);
  const [loadingStorageRooms, setLoadingStorageRooms] = useState(false);
  const [shelves, setShelves] = useState<StoreShelf[]>([]);
  const [loadingShelves, setLoadingShelves] = useState(false);
  const [selectedStorageRoomId, setSelectedStorageRoomId] = useState<string>('');
  const [selectedRow, setSelectedRow] = useState<number | undefined>(undefined);
  const [selectedColumn, setSelectedColumn] = useState<number | undefined>(undefined);

  const [loadingLocations, setLoadingLocations] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  // Don't render if modal is not open
  if (!isOpen) {
    return null;
  }

  // Show loading state if required data is not available
  if (isLoading || !product) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2">Loading product data...</span>
          </div>
        </div>
      </div>
    );
  }

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      barcode: '',
      categoryId: '',
      brandId: '',
      supplierId: '',
      condition: 'new',
      storeLocationId: '',
      storeShelf: '',
  
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      minStockLevel: 0,
      weight: 0,
      tags: []
    }
  });

  const selectedLocationId = watch('storeLocationId');

  // Load store locations and shelves
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

    if (isOpen) {
      loadStoreData();
    }
  }, [isOpen]);

  // Load storage rooms when location changes
  useEffect(() => {
    const loadRooms = async () => {
      if (!selectedLocationId) {
        setStorageRooms([]);
        setSelectedStorageRoomId('');
        setShelves([]);
        setSelectedRow(undefined);
        setSelectedColumn(undefined);
        return;
      }

      try {
        setLoadingStorageRooms(true);
        const rooms = await storageRoomApi.getByStoreLocation(selectedLocationId);
        setStorageRooms(rooms);
      } catch (error) {
        console.error('Error loading storage rooms:', error);
        toast.error('Failed to load storage rooms');
      } finally {
        setLoadingStorageRooms(false);
      }
    };

    loadRooms();
  }, [selectedLocationId]);

  // Load shelves when storage room changes
  useEffect(() => {
    const loadShelvesForRoom = async () => {
      if (!selectedStorageRoomId) {
        setShelves([]);
        setSelectedRow(undefined);
        setSelectedColumn(undefined);
        return;
      }

      try {
        setLoadingShelves(true);
        const roomShelves = await storeShelfApi.getShelvesByStorageRoom(selectedStorageRoomId);
        setShelves(roomShelves);
      } catch (error) {
        console.error('Error loading shelves:', error);
        toast.error('Failed to load shelves');
      } finally {
        setLoadingShelves(false);
      }
    };

    loadShelvesForRoom();
  }, [selectedStorageRoomId]);

  // Load categories, brands, and suppliers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadBrands();
      loadSuppliers();
    }
  }, [isOpen, loadCategories, loadBrands, loadSuppliers]);

  // Load product data when product changes
  useEffect(() => {
    if (productId && isOpen) {
      const loadProductData = async () => {
        setIsLoading(true);
        try {
          const result = await getProduct(productId);
          if (result && result.data) {
            const fetchedProduct = result.data;
            setProduct(fetchedProduct);
            reset({
              name: fetchedProduct.name,
              description: fetchedProduct.description || '',
              sku: fetchedProduct.sku,
              barcode: fetchedProduct.barcode || '',
              categoryId: fetchedProduct.categoryId,
              brandId: fetchedProduct.brandId || '',
              supplierId: fetchedProduct.supplierId || '',
              condition: fetchedProduct.condition || 'new',
              storeLocationId: '', // Will be set based on shelf lookup
              storeShelf: fetchedProduct.storeShelf || '',
              price: fetchedProduct.price || 0,
              costPrice: fetchedProduct.costPrice || 0,
              stockQuantity: fetchedProduct.stockQuantity || 0,
              minStockLevel: fetchedProduct.minStockLevel || 0,
              weight: fetchedProduct.weight || 0,
              tags: fetchedProduct.tags || []
            });
            setCurrentTags(fetchedProduct.tags || []);

            // If product has a shelf, find the location
            if (fetchedProduct.storeShelf) {
              findLocationForShelf(fetchedProduct.storeShelf);
            }
          } else {
            toast.error('Failed to load product data');
            onClose();
          }
        } catch (error) {
          console.error('Error loading product data:', error);
          toast.error('Failed to load product data');
          onClose();
        } finally {
          setIsLoading(false);
        }
      };
      loadProductData();
    }
  }, [productId, isOpen, reset, getProduct, onClose]);

  // Find location for existing shelf
  const findLocationForShelf = async (shelfCode: string) => {
    try {
      const shelf = await storeShelfApi.getByCode(shelfCode);
      if (shelf) {
        setValue('storeLocationId', shelf.store_location_id);
        if (shelf.storage_room_id) setSelectedStorageRoomId(shelf.storage_room_id);
        setSelectedRow(shelf.row_number);
        setSelectedColumn(shelf.column_number);
      }
    } catch (error) {
      console.error('Error finding location for shelf:', error);
    }
  };

  // Handle tag input
  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      setCurrentTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    setCurrentTags(newTags);
    setValue('tags', newTags);
  };

  const handleClose = () => {
    reset();
    setCurrentTags([]);
    setTagInput('');
    setStoreLocations([]);
    
    onClose();
  };

  const handleFormSubmit = async (data: EditProductFormData) => {
    try {
      const result = await updateProduct(productId, data);
      if (result.ok) {
        toast.success('Product updated successfully!');
        onProductUpdated?.(result.data);
        handleClose();
      } else {
        toast.error(result.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to update product');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {product ? t('Edit Product') : t('Add Product')}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    {...field}
                    label={t('Product Name')}
                    placeholder={t('Enter product name')}
                    error={errors.name?.message}
                  />
                )}
              />

              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    {...field}
                    label={t('SKU')}
                    placeholder={t('Enter SKU')}
                    error={errors.sku?.message}
                  />
                )}
              />
            </div>

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <GlassInput
                  {...field}
                  label={t('Description')}
                  placeholder={t('Enter product description')}
                  error={errors.description?.message}
                />
              )}
            />

            {/* Category and Brand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    {...field}
                    label={t('Category')}
                    error={errors.categoryId?.message}
                  >
                    <option value="">{t('Select Category')}</option>
                    {(categories || [])?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </GlassSelect>
                )}
              />

              <Controller
                name="brandId"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    {...field}
                    label={t('Brand')}
                    error={errors.brandId?.message}
                  >
                    <option value="">{t('Select Brand')}</option>
                    {(brands || [])?.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </GlassSelect>
                )}
              />
            </div>

            {/* Store Location and Storage Room */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="storeLocationId"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      {t('Store Location')}
                    </label>
                    <GlassSelect
                      {...field}
                      disabled={loadingLocations}
                      error={errors.storeLocationId?.message}
                    >
                      <option value="">{loadingLocations ? t('Loading...') : t('Select Store Location')}</option>
                      {(storeLocations || [])?.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name} ({location.city})
                        </option>
                      ))}
                    </GlassSelect>
                  </div>
                )}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Layers className="w-4 h-4 inline mr-2" />
                  {t('Storage Room')}
                </label>
                <select
                  value={selectedStorageRoomId}
                  onChange={(e) => {
                    setSelectedStorageRoomId(e.target.value);
                    setSelectedRow(undefined);
                    setSelectedColumn(undefined);
                    // Clear storeShelf when changing room
                    setValue('storeShelf', '');
                  }}
                  disabled={!selectedLocationId || loadingStorageRooms}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">
                    {!selectedLocationId
                      ? t('Select Location First')
                      : loadingStorageRooms
                        ? t('Loading...')
                        : t('Select Storage Room')}
                  </option>
                  {(storageRooms || []).map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({room.code})
                    </option>
                  ))}
                </select>
                {selectedLocationId && (storageRooms || []).length === 0 && !loadingStorageRooms && (
                  <p className="text-sm text-gray-500 mt-1">
                    {t('No storage rooms found for this location.')} 
                    <button
                      type="button"
                      onClick={() => window.open('/lats/storage-rooms', '_blank')}
                      className="text-blue-600 hover:text-blue-800 ml-1 underline"
                    >
                      {t('Manage storage rooms')}
                    </button>
                  </p>
                )}
              </div>
            </div>

            {/* Shelf Row and Column within selected Storage Room */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Shelf row')}
                </label>
                <select
                  value={selectedRow ?? ''}
                  onChange={(e) => {
                    const row = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    setSelectedRow(row);
                    // Update composed code if possible
                    const shelf = shelves.find(s => s.row_number === row && s.column_number === selectedColumn);
                    setValue('storeShelf', shelf?.code || '');
                  }}
                  disabled={!selectedStorageRoomId || loadingShelves}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{!selectedStorageRoomId ? t('Select storage room first') : loadingShelves ? t('Loading...') : t('Select row')}</option>
                  {Array.from(new Set((shelves || []).map(s => s.row_number).filter(Boolean))).map((row) => (
                    <option key={`row-${row}`} value={row as number}>{row as number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Shelf column')}
                </label>
                <select
                  value={selectedColumn ?? ''}
                  onChange={(e) => {
                    const col = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    setSelectedColumn(col);
                    const shelf = shelves.find(s => s.row_number === selectedRow && s.column_number === col);
                    setValue('storeShelf', shelf?.code || '');
                  }}
                  disabled={!selectedStorageRoomId || loadingShelves}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{!selectedStorageRoomId ? t('Select storage room first') : loadingShelves ? t('Loading...') : t('Select column')}</option>
                  {Array.from(new Set((shelves || []).map(s => s.column_number).filter(Boolean))).map((col) => (
                    <option key={`col-${col}`} value={col as number}>{col as number}</option>
                  ))}
                </select>
              </div>

              <Controller
                name="storeShelf"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    {...field}
                    label={t('Shelf code')}
                    placeholder={t('Auto-filled from row/column')}
                    readOnly
                  />
                )}
              />
            </div>

            {/* Pricing and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <PriceInput
                    {...field}
                    label={t('Price')}
                    placeholder={t('0.00')}
                    error={errors.price?.message}
                  />
                )}
              />

              <Controller
                name="costPrice"
                control={control}
                render={({ field }) => (
                  <PriceInput
                    {...field}
                    label={t('Cost Price')}
                    placeholder={t('0.00')}
                    error={errors.costPrice?.message}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="stockQuantity"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    {...field}
                    type="number"
                    label={t('Stock Quantity')}
                    placeholder={t('0')}
                    error={errors.stockQuantity?.message}
                  />
                )}
              />

              <Controller
                name="minStockLevel"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    {...field}
                    type="number"
                    label={t('Minimum Stock Level')}
                    placeholder={t('0')}
                    error={errors.minStockLevel?.message}
                  />
                )}
              />
            </div>

            {/* Condition and Supplier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    {...field}
                    label={t('Condition')}
                    error={errors.condition?.message}
                  >
                    <option value="">{t('Select Condition')}</option>
                    <option value="new">{t('New')}</option>
                    <option value="like-new">{t('Like New')}</option>
                    <option value="good">{t('Good')}</option>
                    <option value="fair">{t('Fair')}</option>
                    <option value="poor">{t('Poor')}</option>
                    <option value="refurbished">{t('Refurbished')}</option>
                  </GlassSelect>
                )}
              />

              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    {...field}
                    label={t('Supplier')}
                    error={errors.supplierId?.message}
                  >
                    <option value="">{t('Select Supplier')}</option>
                    {(suppliers || [])?.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </GlassSelect>
                )}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('Tags')}
              </label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('Add a tag')}
                  />
                  <GlassButton
                    type="button"
                    onClick={addTag}
                    variant="secondary"
                    disabled={!tagInput.trim()}
                  >
                    {t('Add')}
                  </GlassButton>
                </div>
                {(currentTags || [])?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(currentTags || [])?.map((tag, index) => (
                      <GlassBadge
                        key={index}
                        variant="info"
                        className="flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </GlassBadge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <GlassButton
                type="button"
                onClick={handleClose}
                variant="secondary"
                disabled={isSubmitting || isLoading}
              >
                {t('Cancel')}
              </GlassButton>
              <GlassButton
                type="submit"
                disabled={isSubmitting || isLoading}
                className="flex items-center space-x-2"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('Saving...')}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t('Save Changes')}</span>
                  </>
                )}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default EditProductModal;
