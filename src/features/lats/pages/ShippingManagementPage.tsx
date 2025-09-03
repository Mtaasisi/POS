import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import { 
  Truck, Search, Plus, Grid, List, Filter, SortAsc, Download, Upload,
  AlertCircle, Edit, Eye, Trash2, Star, Tag, DollarSign, TrendingUp, 
  Activity, BarChart3, Settings, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Users, Crown, Calendar, RotateCcw, RefreshCw as RefreshCwIcon,
  FileText, ShoppingCart, Clock, CheckSquare, XSquare, Send, Package,
  MapPin, ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../stores/useInventoryStore';
import { PurchaseOrder } from '../types/inventory';

const ShippingManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Database state management
  const { 
    purchaseOrders, 
    isLoading, 
    error,
    loadPurchaseOrders
  } = useInventoryStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'shipped' | 'delivered'>('all');
  const [sortBy, setSortBy] = useState<'shippedDate' | 'trackingNumber' | 'estimatedDelivery' | 'carrier'>('shippedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Load purchase orders on component mount
  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  // Filter to only shipped orders with shipping info
  const shippedOrders = useMemo(() => {
    return purchaseOrders.filter(order => 
      (order.status === 'shipped' || order.status === 'received') && 
      order.shippingInfo
    );
  }, [purchaseOrders]);

  // Filter and sort shipped orders
  const filteredShipments = useMemo(() => {
    let filtered = shippedOrders.filter(order => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          order.orderNumber.toLowerCase().includes(query) ||
          order.shippingInfo?.trackingNumber.toLowerCase().includes(query) ||
          order.shippingInfo?.carrier.toLowerCase().includes(query) ||
          order.supplier?.name?.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Carrier filter
      if (carrierFilter !== 'all' && order.shippingInfo?.carrier !== carrierFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'shipped' && order.status !== 'shipped') return false;
      if (statusFilter === 'delivered' && order.status !== 'received') return false;

      return true;
    });

    // Sort orders
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (sortBy) {
        case 'shippedDate':
          valueA = new Date(a.shippingInfo?.shippedDate || 0).getTime();
          valueB = new Date(b.shippingInfo?.shippedDate || 0).getTime();
          break;
        case 'trackingNumber':
          valueA = a.shippingInfo?.trackingNumber || '';
          valueB = b.shippingInfo?.trackingNumber || '';
          break;
        case 'estimatedDelivery':
          valueA = new Date(a.shippingInfo?.estimatedDelivery || 0).getTime();
          valueB = new Date(b.shippingInfo?.estimatedDelivery || 0).getTime();
          break;
        case 'carrier':
          valueA = a.shippingInfo?.carrier || '';
          valueB = b.shippingInfo?.carrier || '';
          break;
        default:
          valueA = a.orderNumber;
          valueB = b.orderNumber;
      }

      if (sortOrder === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });

    return filtered;
  }, [shippedOrders, searchQuery, carrierFilter, statusFilter, sortBy, sortOrder]);

  // Get unique carriers for filter
  const carriers = useMemo(() => {
    const carrierSet = new Set(shippedOrders.map(order => order.shippingInfo?.carrier).filter(Boolean));
    return Array.from(carrierSet).sort();
  }, [shippedOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'received': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'received': return <CheckSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysInTransit = (shippedDate: string, deliveredDate?: string) => {
    const shipped = new Date(shippedDate);
    const delivered = deliveredDate ? new Date(deliveredDate) : new Date();
    const diffTime = delivered.getTime() - shipped.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isDeliveryOverdue = (estimatedDelivery: string) => {
    return new Date(estimatedDelivery) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <div className="container mx-auto px-4 py-6">
        <LATSBreadcrumb 
          items={[
            { label: 'LATS', href: '/lats' },
            { label: 'Shipping Management', href: '/lats/shipping' }
          ]} 
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Management</h1>
            <p className="text-gray-600">Track and manage all your shipments</p>
          </div>
          
          <div className="flex gap-2">
            <GlassButton
              onClick={() => navigate('/lats/purchase-orders')}
              icon={<Package size={18} />}
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              Purchase Orders
            </GlassButton>
          </div>
        </div>

        {/* Filters and Search */}
        <GlassCard className="mb-6">
          <div className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by order number, tracking number, or carrier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Carrier Filter */}
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Carriers</option>
                {carriers.map(carrier => (
                  <option key={carrier} value={carrier}>{carrier}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="shipped">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="shippedDate">Date Shipped</option>
                <option value="trackingNumber">Tracking Number</option>
                <option value="estimatedDelivery">Est. Delivery</option>
                <option value="carrier">Carrier</option>
              </select>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <SortAsc className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={loadPurchaseOrders}
                disabled={isLoading}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Error Display */}
        {error && (
          <GlassCard className="mb-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </GlassCard>
        )}

        {/* Shipping Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredShipments.filter(order => order.status === 'shipped').length}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredShipments.filter(order => order.status === 'received').length}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredShipments.filter(order => 
                    order.shippingInfo && isDeliveryOverdue(order.shippingInfo.estimatedDelivery) && order.status === 'shipped'
                  ).length}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Shipments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shippedOrders.length}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Shipments List */}
        {isLoading ? (
          <GlassCard className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading shipments...</span>
            </div>
          </GlassCard>
        ) : filteredShipments.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No shipments found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || carrierFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No purchase orders have been shipped yet'
              }
            </p>
            {!searchQuery && carrierFilter === 'all' && statusFilter === 'all' && (
              <GlassButton onClick={() => navigate('/lats/purchase-orders')}>
                <Package className="w-4 h-4 mr-2" />
                View Purchase Orders
              </GlassButton>
            )}
          </GlassCard>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredShipments.map((order) => (
              <GlassCard key={order.id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500">
                        Shipped {formatDate(order.shippingInfo?.shippedDate || '')}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize">
                        {order.status === 'received' ? 'Delivered' : order.status}
                      </span>
                    </div>
                  </div>

                  {/* Shipping Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Carrier:</span>
                      <span className="text-sm font-medium">{order.shippingInfo?.carrier}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Tracking:</span>
                      <span className="text-sm font-mono font-medium">{order.shippingInfo?.trackingNumber}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Est. Delivery:</span>
                      <span className={`text-sm font-medium ${
                        order.shippingInfo && isDeliveryOverdue(order.shippingInfo.estimatedDelivery) && order.status === 'shipped'
                          ? 'text-red-600' 
                          : 'text-gray-900'
                      }`}>
                        {formatDate(order.shippingInfo?.estimatedDelivery || '')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Transit Time:</span>
                      <span className="text-sm font-medium">
                        {getDaysInTransit(
                          order.shippingInfo?.shippedDate || '',
                          order.status === 'received' ? order.receivedDate : undefined
                        )} days
                      </span>
                    </div>

                    {order.shippingInfo?.shippingCost && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Shipping Cost:</span>
                        <span className="text-sm font-medium">{formatCurrency(order.shippingInfo.shippingCost)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <GlassButton
                      onClick={() => navigate(`/lats/purchase-orders/${order.id}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Order
                    </GlassButton>
                    
                    <GlassButton
                      onClick={() => window.open(`https://tracking-url.com/${order.shippingInfo?.trackingNumber}`, '_blank')}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Track
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredShipments.length > 0 && (
          <GlassCard className="mt-6">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">
                    Showing {filteredShipments.length} of {shippedOrders.length} shipments
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    Total Value: {formatCurrency(filteredShipments.reduce((sum, order) => sum + order.totalAmount, 0))}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    Avg. Transit: {filteredShipments.length > 0 ? Math.round(
                      filteredShipments.reduce((sum, order) => 
                        sum + getDaysInTransit(
                          order.shippingInfo?.shippedDate || '',
                          order.status === 'received' ? order.receivedDate : undefined
                        ), 0
                      ) / filteredShipments.length
                    ) : 0} days
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default ShippingManagementPage;