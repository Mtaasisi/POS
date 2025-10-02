import React, { useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  ShoppingCart, Plus, CheckCircle, FileText, Send, Truck
} from 'lucide-react';

interface PurchaseOrdersTabProps {
  navigate: (path: string) => void;
  useInventoryStore: any;
}

const PurchaseOrdersTab: React.FC<PurchaseOrdersTabProps> = ({
  navigate,
  useInventoryStore
}) => {
  // Database state management
  const { 
    purchaseOrders, 
    isLoading, 
    error,
    loadPurchaseOrders,
    deletePurchaseOrder,
    receivePurchaseOrder
  } = useInventoryStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'orderNumber' | 'totalAmount' | 'expectedDelivery'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Load purchase orders on component mount
  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{purchaseOrders?.length || 0}</p>
            </div>
            <div className="p-3 bg-blue-50/20 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Draft Orders</p>
              <p className="text-2xl font-bold text-yellow-900">
                {purchaseOrders?.filter((order: any) => order.status === 'draft').length || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-50/20 rounded-full">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Sent Orders</p>
              <p className="text-2xl font-bold text-purple-900">
                {purchaseOrders?.filter((order: any) => order.status === 'sent').length || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <Send className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Received Orders</p>
              <p className="text-2xl font-bold text-green-900">
                {purchaseOrders?.filter((order: any) => order.status === 'received').length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Purchase Orders</h3>
            <p className="text-sm text-gray-600">Manage your purchase orders and supplier relationships</p>
          </div>
          
          <div className="flex gap-2">
            <GlassButton
              onClick={() => navigate('/lats/purchase-order/create')}
              icon={<Plus size={18} />}
              className="bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold"
            >
              Create Purchase Order
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/lats/purchase-orders')}
              icon={<Eye size={18} />}
              variant="secondary"
            >
              View All Orders
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Featured Purchase Order Creation */}
      <GlassCard className="text-center py-12 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
        <div className="relative">
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs px-2 py-1 rounded-full font-bold">
            NEW
          </div>
          <ShoppingCart className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Purchase Order Creation</h3>
        <p className="text-gray-600 mb-4">Create purchase orders with our new interactive interface - similar to POS but for purchasing from suppliers</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <GlassButton
            onClick={() => navigate('/lats/purchase-order/create')}
            icon={<Plus size={18} />}
            className="bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-lg px-8 py-3"
          >
            🛒 Start Creating Purchase Order
          </GlassButton>
          <GlassButton
            onClick={() => navigate('/lats/purchase-orders')}
            icon={<Eye size={18} />}
            variant="outline"
            className="border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            View Existing Orders
          </GlassButton>
        </div>
        
        {/* Feature highlights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-orange-700">
            <CheckCircle className="w-4 h-4" />
            <span>Multi-currency support</span>
          </div>
          <div className="flex items-center gap-2 text-orange-700">
            <CheckCircle className="w-4 h-4" />
            <span>Supplier management</span>
          </div>
          <div className="flex items-center gap-2 text-orange-700">
            <CheckCircle className="w-4 h-4" />
            <span>Interactive product selection</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default PurchaseOrdersTab;
