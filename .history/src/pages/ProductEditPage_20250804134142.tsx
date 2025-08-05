import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Package, Edit } from 'lucide-react';
import { getProductById, updateProduct, getInventoryCategories, getSuppliers } from '../lib/inventoryApi';
import { Product, InventoryCategory, Supplier } from '../lib/inventoryApi';
import GlassButton from '../components/ui/GlassButton';
import GlassCard from '../components/ui/GlassCard';
import BrandSuggestionInput from '../components/ui/BrandSuggestionInput';

interface ProductEditFormData {
  name: string;
  description: string;
  brand: string;
  model: string;
  category_id: string;
  supplier_id: string;
  product_code: string;
  barcode: string;
  minimum_stock_level: number;
  maximum_stock_level: number;
  reorder_point: number;
  warranty_period_months: number;
  tags: string[];
  images: string[];
  specifications: Record<string, any>;
}

const ProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [formData, setFormData] = useState<ProductEditFormData>({
    name: '',
    description: '',
    brand: '',
    model: '',
    category_id: '',
    supplier_id: '',
    product_code: '',
    barcode: '',
    minimum_stock_level: 0,
    maximum_stock_level: 1000,
    reorder_point: 10,
    warranty_period_months: 12,
    tags: [],
    images: [],
    specifications: {}
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load product data
      const productData = await getProductById(id!);
      if (!productData) {
        toast.error('Product not found');
        navigate('/inventory');
        return;
      }
      setProduct(productData);

      // Load categories and suppliers
      const [categoriesData, suppliersData] = await Promise.all([
        getInventoryCategories(),
        getSuppliers()
      ]);
      setCategories(categoriesData);
      setSuppliers(suppliersData);

      // Set form data
      setFormData({
        name: productData.name,
        description: productData.description || '',
        brand: productData.brand || '',
        model: productData.model || '',
        category_id: productData.category_id || '',
        supplier_id: productData.supplier_id || '',
        product_code: productData.product_code || '',
        barcode: productData.barcode || '',
        minimum_stock_level: productData.minimum_stock_level,
        maximum_stock_level: productData.maximum_stock_level,
        reorder_point: productData.reorder_point,
        warranty_period_months: productData.warranty_period_months,
        tags: productData.tags || [],
        images: productData.images || [],
        specifications: productData.specifications || {}
      });
    } catch (error) {
      console.error('Error loading product data:', error);
      toast.error('Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductEditFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;

    try {
      setSaving(true);
      
      // Prepare update data
      const updateData = {
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        model: formData.model,
        category_id: formData.category_id || null,
        supplier_id: formData.supplier_id || null,
        product_code: formData.product_code,
        barcode: formData.barcode,
        minimum_stock_level: formData.minimum_stock_level,
        maximum_stock_level: formData.maximum_stock_level,
        reorder_point: formData.reorder_point,
        warranty_period_months: formData.warranty_period_months,
        tags: formData.tags,
        images: formData.images,
        specifications: formData.specifications
      };

      await updateProduct(product.id, updateData);
      
      toast.success('Product updated successfully');
      navigate(`/inventory/products/${product.id}`);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <GlassButton
            onClick={() => navigate(`/inventory/products/${product.id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back
          </GlassButton>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600">{product.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <GlassCard className="mb-6">
          {/* Basic Product Information */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={20} className="text-blue-600" />
              Product Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg pl-12 bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="Enter product name"
                    required
                  />
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <BrandSuggestionInput
                  value={formData.brand}
                  onChange={(value) => handleInputChange('brand', value)}
                  placeholder="Select or enter brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder="Enter model"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Code
                </label>
                <input
                  type="text"
                  value={formData.product_code}
                  onChange={(e) => handleInputChange('product_code', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder="Enter product code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder="Enter barcode"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                placeholder="Enter product description"
              />
            </div>
          </div>

          {/* Stock Settings */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  value={formData.minimum_stock_level}
                  onChange={(e) => handleInputChange('minimum_stock_level', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Stock Level
                </label>
                <input
                  type="number"
                  value={formData.maximum_stock_level}
                  onChange={(e) => handleInputChange('maximum_stock_level', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reorder Point
                </label>
                <input
                  type="number"
                  value={formData.reorder_point}
                  onChange={(e) => handleInputChange('reorder_point', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty Period (months)
                </label>
                <input
                  type="number"
                  value={formData.warranty_period_months}
                  onChange={(e) => handleInputChange('warranty_period_months', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  min="0"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <GlassButton
            type="button"
            onClick={() => navigate(`/inventory/products/${product.id}`)}
            className="flex items-center gap-2"
          >
            Cancel
          </GlassButton>
          
          <GlassButton
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </GlassButton>
        </div>
      </form>
    </div>
  );
};

export default ProductEditPage; 