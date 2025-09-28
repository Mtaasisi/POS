import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassBadge from '../../shared/components/ui/GlassBadge';
import SearchBar from '../../shared/components/ui/SearchBar';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import { BackButton } from '../../shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../shared/components/PageErrorBoundary';
import { 
  RotateCcw, Search, Filter, Download, RefreshCw, Eye, Edit, 
  CheckCircle, XCircle, Clock, AlertTriangle, DollarSign, 
  Calendar, User, Smartphone, Package, TrendingUp, BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { fetchCustomerReturns, updateReturnStatus, getCustomerReturnStats } from '../../../lib/customerApi/returns';
import { CustomerReturn } from '../../../lib/customerApi/returns';
import { formatCurrency } from '../../../lib/customerApi';
import ReturnDetailModal from '../components/ReturnDetailModal';

type ReturnStatus = 'under-return-review' | 'return-accepted' | 'return-rejected' | 'return-resolved' | 'return-refunded' | 'return-exchanged';
type ReturnType = 'repair' | 'warranty' | 'exchange' | 'refund';

interface ReturnFilters {
  status: ReturnStatus | 'all';
  type: ReturnType | 'all';
  dateRange: 'today' | 'week' | 'month' | 'all';
  search: string;
}

const ReturnsManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [returns, setReturns] = useState<CustomerReturn[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<CustomerReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<CustomerReturn | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [filters, setFilters] = useState<ReturnFilters>({
    status: 'all',
    type: 'all',
    dateRange: 'all',
    search: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    resolved: 0,
    refunded: 0,
    exchanged: 0,
    rejected: 0,
    totalRefundAmount: 0
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!['admin', 'customer-care'].includes(currentUser.role)) {
      navigate('/dashboard');
      return;
    }

    loadReturns();
  }, [currentUser, navigate]);

  useEffect(() => {
    applyFilters();
  }, [returns, filters]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      
      // Fetch all returns from the database
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          customers!inner(name, phone, email),
          devices(brand, model)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading returns:', error);
        toast.error('Failed to load returns');
        return;
      }

      setReturns(data || []);
      
      // Calculate stats
      const returnStats = {
        total: data?.length || 0,
        pending: data?.filter(r => r.status === 'under-return-review').length || 0,
        accepted: data?.filter(r => r.status === 'return-accepted').length || 0,
        resolved: data?.filter(r => r.status === 'return-resolved').length || 0,
        refunded: data?.filter(r => r.status === 'return-refunded').length || 0,
        exchanged: data?.filter(r => r.status === 'return-exchanged').length || 0,
        rejected: data?.filter(r => r.status === 'return-rejected').length || 0,
        totalRefundAmount: data?.reduce((sum, r) => sum + (r.refund_amount || 0), 0) || 0
      };
      
      setStats(returnStats);
    } catch (error) {
      console.error('Error loading returns:', error);
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...returns];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(returnItem => returnItem.status === filters.status);
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(returnItem => returnItem.return_type === filters.type);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(returnItem => 
        new Date(returnItem.created_at) >= startDate
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(returnItem => 
        returnItem.customers?.name?.toLowerCase().includes(searchLower) ||
        returnItem.customers?.phone?.includes(searchLower) ||
        returnItem.manual_device_brand?.toLowerCase().includes(searchLower) ||
        returnItem.manual_device_model?.toLowerCase().includes(searchLower) ||
        returnItem.reason?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredReturns(filtered);
  };

  const handleStatusUpdate = async (returnId: string, newStatus: ReturnStatus, resolution?: string) => {
    try {
      const success = await updateReturnStatus(returnId, newStatus, resolution);
      
      if (success) {
        toast.success('Return status updated successfully');
        loadReturns();
        setShowReturnModal(false);
      } else {
        toast.error('Failed to update return status');
      }
    } catch (error) {
      console.error('Error updating return status:', error);
      toast.error('Failed to update return status');
    }
  };

  const getStatusColor = (status: ReturnStatus) => {
    switch (status) {
      case 'return-resolved':
      case 'return-refunded':
      case 'return-exchanged':
        return 'bg-green-100 text-green-800';
      case 'return-accepted':
        return 'bg-blue-100 text-blue-800';
      case 'return-rejected':
        return 'bg-red-100 text-red-800';
      case 'under-return-review':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: ReturnStatus) => {
    switch (status) {
      case 'return-resolved':
      case 'return-refunded':
      case 'return-exchanged':
        return <CheckCircle className="w-4 h-4" />;
      case 'return-accepted':
        return <Clock className="w-4 h-4" />;
      case 'return-rejected':
        return <XCircle className="w-4 h-4" />;
      case 'under-return-review':
      default:
        return <AlertTriangle className="w-4 h-4" />;
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

  if (!currentUser) {
    return null;
  }

  return (
    <PageErrorBoundary pageName="Returns Management">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton onClick={() => navigate('/dashboard')} />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Returns Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage customer returns and refunds
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GlassButton
                variant="secondary"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={loadReturns}
                disabled={loading}
              >
                Refresh
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<Download className="w-4 h-4" />}
                onClick={() => toast('Export functionality coming soon')}
              >
                Export
              </GlassButton>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.accepted}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.refunded}</div>
              <div className="text-sm text-gray-600">Refunded</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.exchanged}</div>
              <div className="text-sm text-gray-600">Exchanged</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRefundAmount)}</div>
              <div className="text-sm text-gray-600">Total Refunds</div>
            </GlassCard>
          </div>

          {/* Filters */}
          <GlassCard className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <SearchBar
                  value={filters.search}
                  onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                  placeholder="Search returns..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <GlassSelect
                  value={filters.status}
                  onChange={(value) => setFilters(prev => ({ ...prev, status: value as ReturnStatus | 'all' }))}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'under-return-review', label: 'Under Review' },
                    { value: 'return-accepted', label: 'Accepted' },
                    { value: 'return-rejected', label: 'Rejected' },
                    { value: 'return-resolved', label: 'Resolved' },
                    { value: 'return-refunded', label: 'Refunded' },
                    { value: 'return-exchanged', label: 'Exchanged' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <GlassSelect
                  value={filters.type}
                  onChange={(value) => setFilters(prev => ({ ...prev, type: value as ReturnType | 'all' }))}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'repair', label: 'Repair' },
                    { value: 'warranty', label: 'Warranty' },
                    { value: 'exchange', label: 'Exchange' },
                    { value: 'refund', label: 'Refund' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <GlassSelect
                  value={filters.dateRange}
                  onChange={(value) => setFilters(prev => ({ ...prev, dateRange: value as any }))}
                  options={[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' }
                  ]}
                />
              </div>
            </div>
          </GlassCard>

          {/* Returns List */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Returns ({filteredReturns.length})
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading returns...</p>
              </div>
            ) : filteredReturns.length === 0 ? (
              <div className="text-center py-8">
                <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No returns found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReturns.map((returnItem) => (
                  <div
                    key={returnItem.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                          <RotateCcw className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {returnItem.customers?.name || 'Unknown Customer'}
                            </h3>
                            <GlassBadge
                              className={`${getStatusColor(returnItem.status)} flex items-center gap-1`}
                            >
                              {getStatusIcon(returnItem.status)}
                              {returnItem.status.replace('return-', '')}
                            </GlassBadge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <Smartphone className="w-4 h-4 inline mr-1" />
                              {returnItem.manual_device_brand} {returnItem.manual_device_model}
                            </p>
                            <p>
                              <Calendar className="w-4 h-4 inline mr-1" />
                              {formatDate(returnItem.created_at)}
                            </p>
                            <p>
                              <Package className="w-4 h-4 inline mr-1" />
                              {returnItem.return_type} - {returnItem.reason}
                            </p>
                            {returnItem.refund_amount && (
                              <p>
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                {formatCurrency(returnItem.refund_amount)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <GlassButton
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => {
                            setSelectedReturn(returnItem);
                            setShowReturnModal(true);
                          }}
                        >
                          View
                        </GlassButton>
                        {returnItem.status === 'under-return-review' && (
                          <GlassButton
                            variant="primary"
                            size="sm"
                            icon={<Edit className="w-4 h-4" />}
                            onClick={() => {
                              setSelectedReturn(returnItem);
                              setShowReturnModal(true);
                            }}
                          >
                            Process
                          </GlassButton>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Return Detail Modal */}
          {selectedReturn && (
            <ReturnDetailModal
              isOpen={showReturnModal}
              onClose={() => {
                setShowReturnModal(false);
                setSelectedReturn(null);
              }}
              returnItem={selectedReturn}
              onStatusUpdate={handleStatusUpdate}
            />
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
};

export default ReturnsManagementPage;
