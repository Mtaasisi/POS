import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Truck,
  Calendar,
  DollarSign,
  Package,
  Building,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  order_date: string;
  expected_delivery_date?: string;
  total_amount: number;
  items_count: number;
  created_by: string;
}

const PurchaseOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data for now - replace with actual API calls
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const mockPOs: PurchaseOrder[] = [
        {
          id: '1',
          po_number: 'PO-2024-001',
          supplier_name: 'TechParts Tanzania',
          status: 'confirmed',
          order_date: '2024-01-15',
          expected_delivery_date: '2024-01-22',
          total_amount: 2500000,
          items_count: 15,
          created_by: currentUser?.name || 'Admin'
        },
        {
          id: '2',
          po_number: 'PO-2024-002',
          supplier_name: 'Mobile Solutions Ltd',
          status: 'draft',
          order_date: '2024-01-20',
          total_amount: 1800000,
          items_count: 8,
          created_by: currentUser?.name || 'Admin'
        },
        {
          id: '3',
          po_number: 'PO-2024-003',
          supplier_name: 'Computer World',
          status: 'received',
          order_date: '2024-01-10',
          expected_delivery_date: '2024-01-18',
          total_amount: 3200000,
          items_count: 22,
          created_by: currentUser?.name || 'Admin'
        }
      ];
      setPurchaseOrders(mockPOs);
      setLoading(false);
    }, 500);
  }, [currentUser]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-500" />;
      case 'sent':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'received':
        return <Package className="h-4 w-4 text-purple-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'received':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = searchQuery === '' || 
      po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: purchaseOrders.length,
    draft: purchaseOrders.filter(po => po.status === 'draft').length,
    confirmed: purchaseOrders.filter(po => po.status === 'confirmed').length,
    received: purchaseOrders.filter(po => po.status === 'received').length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + po.total_amount, 0)
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading purchase orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <GlassButton
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Inventory
          </GlassButton>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600 mt-1">Manage supplier orders and inventory restocking</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <GlassButton
            onClick={() => navigate('/inventory/purchase-orders/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          >
            <Plus size={18} />
            New Purchase Order
          </GlassButton>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50/20 rounded-full">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
            <div className="p-3 bg-gray-50/20 rounded-full">
              <Edit className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-900">{stats.confirmed}</p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Received</p>
              <p className="text-2xl font-bold text-purple-900">{stats.received}</p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Total Value</p>
              <p className="text-2xl font-bold text-amber-900">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="p-3 bg-amber-50/20 rounded-full">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search purchase orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="confirmed">Confirmed</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {filteredPOs.map(po => (
          <GlassCard key={po.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{po.po_number}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(po.status)}`}>
                    {getStatusIcon(po.status)}
                    <span className="capitalize">{po.status}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Supplier: <span className="font-medium">{po.supplier_name}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Order Date: <span className="font-medium">{formatDate(po.order_date)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Items: <span className="font-medium">{po.items_count}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Total: <span className="font-medium">{formatCurrency(po.total_amount)}</span>
                    </span>
                  </div>
                </div>

                {po.expected_delivery_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <span>Expected Delivery: <span className="font-medium">{formatDate(po.expected_delivery_date)}</span></span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <GlassButton
                  onClick={() => navigate(`/inventory/purchase-orders/${po.id}`)}
                  className="flex items-center gap-2"
                  variant="secondary"
                >
                  <Eye className="h-4 w-4" />
                  View
                </GlassButton>
                
                {po.status === 'draft' && (
                  <GlassButton
                    onClick={() => navigate(`/inventory/purchase-orders/${po.id}/edit`)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </GlassButton>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Empty State */}
      {filteredPOs.length === 0 && (
        <GlassCard className="text-center py-12">
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first purchase order to start managing supplier orders'}
          </p>
          <GlassButton
            onClick={() => navigate('/inventory/purchase-orders/new')}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Create Purchase Order
          </GlassButton>
        </GlassCard>
      )}
    </div>
  );
};

export default PurchaseOrdersPage;