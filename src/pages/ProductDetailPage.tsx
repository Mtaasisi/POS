import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getProductById, 
  updateStock, 
  getStockMovements,
  Product,
  ProductVariant,
  StockMovement
} from '../lib/inventoryApi';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  ArrowLeft, 
  Package, 
  Edit, 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Tag,
  Building,
  Calendar,
  AlertTriangle,
  Info,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState({
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reason: ''
  });

  useEffect(() => {
    if (id) {
      loadProductData();
    }
  }, [id]);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const productData = await getProductById(id!);
      if (!productData) {
        toast.error('Product not found');
        navigate('/inventory');
        return;
      }
      setProduct(productData);
      
      // Load stock movements for all variants
      const movements = await getStockMovements();
      const productMovements = movements.filter(m => 
        productData.variants?.some(v => v.id === m.variant_id)
      );
      setStockMovements(productMovements);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async () => {
    if (!selectedVariant) return;

    try {
      await updateStock(
        selectedVariant.id,
        stockAdjustment.type,
        stockAdjustment.quantity,
        stockAdjustment.reason
      );
      
      toast.success('Stock updated successfully');
      setShowStockModal(false);
      setStockAdjustment({ type: 'in', quantity: 0, reason: '' });
      setSelectedVariant(null);
      loadProductData(); // Reload to get updated stock levels
    } catch (error: any) {
      toast.error(error.message || 'Failed to update stock');
    }
  };

  const openStockModal = (variant: ProductVariant, type: 'in' | 'out' | 'adjustment') => {
    setSelectedVariant(variant);
    setStockAdjustment({ type, quantity: 0, reason: '' });
    setShowStockModal(true);
  };

  const getStockStatusColor = (variant: ProductVariant) => {
    if (variant.quantity_in_stock === 0) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (variant.quantity_in_stock <= (product?.reorder_point || 10)) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <GlassCard className="text-center py-8">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Product not found</h3>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <GlassButton onClick={() => navigate('/inventory')}>
            Back to Inventory
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  const totalStock = product.variants?.reduce((sum, v) => sum + v.quantity_in_stock, 0) || 0;
  const totalValue = product.variants?.reduce((sum, v) => sum + (v.quantity_in_stock * v.cost_price), 0) || 0;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <GlassButton
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back
          </GlassButton>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">{product.brand} {product.model}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <GlassButton
            onClick={() => navigate(`/inventory/products/${product.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit size={18} />
            Edit Product
          </GlassButton>
        </div>
      </div>

      {/* Product Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Code</label>
                <p className="text-gray-900 font-mono">{product.product_code || 'Not set'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <p className="text-gray-900">{product.category?.name || 'Uncategorized'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <p className="text-gray-900">{product.supplier?.name || 'Not set'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Warranty Period</label>
                <p className="text-gray-900">{product.warranty_period_months} months</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Reorder Point</label>
                <p className="text-gray-900">{product.reorder_point} units</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Min/Max Stock</label>
                <p className="text-gray-900">{product.minimum_stock_level} / {product.maximum_stock_level}</p>
              </div>
            </div>

            {product.description && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <p className="text-gray-900">{product.description}</p>
              </div>
            )}
          </GlassCard>
        </div>

        <div>
          <GlassCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Summary</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Total Stock</span>
                </div>
                <span className="text-xl font-bold text-blue-900">{totalStock}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Total Value</span>
                </div>
                <span className="text-xl font-bold text-green-900">
                  {totalValue.toLocaleString('en-TZ', {
                    style: 'currency',
                    currency: 'TZS',
                    minimumFractionDigits: 0
                  })}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Variants</span>
                </div>
                <span className="text-xl font-bold text-purple-900">{product.variants?.length || 0}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Product Variants */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
          <GlassButton
            onClick={() => navigate(`/inventory/products/${product.id}/variants/new`)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Variant
          </GlassButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {product.variants?.map(variant => (
            <div key={variant.id} className="border border-gray-200 rounded-lg p-4 bg-white/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{variant.variant_name}</h4>
                  <p className="text-sm text-gray-600 font-mono">{variant.sku}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStockStatusColor(variant)}`}>
                  {variant.quantity_in_stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              {/* Attributes */}
              {Object.keys(variant.attributes).length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(variant.attributes).map(([key, value]) => (
                      <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {key}: {value as string}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock and Pricing */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock:</span>
                  <span className="font-medium">{variant.quantity_in_stock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium">
                    {variant.cost_price.toLocaleString('en-TZ', {
                      style: 'currency',
                      currency: 'TZS',
                      minimumFractionDigits: 0
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">
                    {variant.selling_price.toLocaleString('en-TZ', {
                      style: 'currency',
                      currency: 'TZS',
                      minimumFractionDigits: 0
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profit:</span>
                  <span className="font-medium text-green-600">
                    {(variant.selling_price - variant.cost_price).toLocaleString('en-TZ', {
                      style: 'currency',
                      currency: 'TZS',
                      minimumFractionDigits: 0
                    })}
                  </span>
                </div>
              </div>

              {/* Stock Actions */}
              <div className="mt-4 flex gap-2">
                <GlassButton
                  onClick={() => openStockModal(variant, 'in')}
                  variant="success"
                  className="flex-1 text-sm"
                >
                  <Plus size={14} />
                  Add
                </GlassButton>
                <GlassButton
                  onClick={() => openStockModal(variant, 'out')}
                  variant="danger"
                  className="flex-1 text-sm"
                  disabled={variant.quantity_in_stock === 0}
                >
                  <Minus size={14} />
                  Remove
                </GlassButton>
                <GlassButton
                  onClick={() => openStockModal(variant, 'adjustment')}
                  variant="secondary"
                  className="flex-1 text-sm"
                >
                  <BarChart3 size={14} />
                  Adjust
                </GlassButton>
              </div>
            </div>
          ))}
        </div>

        {(!product.variants || product.variants.length === 0) && (
          <div className="text-center py-8">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No variants found for this product</p>
            <GlassButton
              onClick={() => navigate(`/inventory/products/${product.id}/variants/new`)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add First Variant
            </GlassButton>
          </div>
        )}
      </GlassCard>

      {/* Stock Movement History */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Movement History</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-700">Date</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Variant</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Type</th>
                <th className="text-center py-2 px-3 font-medium text-gray-700">Quantity</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Reason</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">By</th>
              </tr>
            </thead>
            <tbody>
              {stockMovements.map(movement => (
                <tr key={movement.id} className="border-b border-gray-100">
                  <td className="py-2 px-3 text-sm text-gray-600">
                    {formatDate(movement.performed_at)}
                  </td>
                  <td className="py-2 px-3 text-sm">
                    <div className="font-medium text-gray-900">
                      {movement.variant?.variant_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {movement.variant?.sku}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      {movement.movement_type === 'in' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {movement.movement_type === 'out' && <TrendingDown className="w-4 h-4 text-red-500" />}
                      {movement.movement_type === 'adjustment' && <BarChart3 className="w-4 h-4 text-blue-500" />}
                      <span className="text-sm capitalize">{movement.movement_type}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`font-medium ${
                      movement.movement_type === 'in' ? 'text-green-600' : 
                      movement.movement_type === 'out' ? 'text-red-600' : 
                      'text-blue-600'
                    }`}>
                      {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-600">
                    {movement.reason || 'No reason provided'}
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-600">
                    {movement.performed_by_user?.name || 'System'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {stockMovements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No stock movements recorded yet
            </div>
          )}
        </div>
      </GlassCard>

      {/* Stock Update Modal */}
      {showStockModal && selectedVariant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {stockAdjustment.type === 'in' ? 'Add Stock' : 
                 stockAdjustment.type === 'out' ? 'Remove Stock' : 
                 'Adjust Stock'}
              </h3>
              <GlassButton
                onClick={() => setShowStockModal(false)}
                className="p-1"
              >
                ✕
              </GlassButton>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900">{selectedVariant.variant_name}</div>
                <div className="text-sm text-blue-700">Current Stock: {selectedVariant.quantity_in_stock}</div>
                <div className="text-sm text-blue-700">SKU: {selectedVariant.sku}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {stockAdjustment.type === 'adjustment' ? 'New Stock Level' : 'Quantity'} *
                </label>
                <input
                  type="number"
                  min={stockAdjustment.type === 'out' ? 1 : 0}
                  max={stockAdjustment.type === 'out' ? selectedVariant.quantity_in_stock : undefined}
                  value={stockAdjustment.quantity}
                  onChange={(e) => setStockAdjustment(prev => ({ 
                    ...prev, 
                    quantity: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                  required
                />
                {stockAdjustment.type === 'adjustment' && (
                  <div className="mt-1 text-sm text-gray-600">
                    Change: {stockAdjustment.quantity - selectedVariant.quantity_in_stock > 0 ? '+' : ''}
                    {stockAdjustment.quantity - selectedVariant.quantity_in_stock}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <textarea
                  value={stockAdjustment.reason}
                  onChange={(e) => setStockAdjustment(prev => ({ 
                    ...prev, 
                    reason: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Enter reason for stock change"
                  required
                />
              </div>

              <div className="flex gap-3">
                <GlassButton
                  onClick={handleStockUpdate}
                  disabled={stockAdjustment.quantity <= 0 || !stockAdjustment.reason.trim()}
                  className="flex-1"
                >
                  Update Stock
                </GlassButton>
                <GlassButton
                  onClick={() => setShowStockModal(false)}
                  variant="secondary"
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;