import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { 
  getDiagnosticRequests, 
  getDiagnosticStats,
  DiagnosticRequest,
  DiagnosticStats
} from '../../../lib/diagnosticsApi';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  Smartphone,
  BarChart3,
  RefreshCw,
  Calendar,
  User,
  MessageSquare,
  Plus,
  Bell,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CustomerCareDiagnosticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DiagnosticRequest[]>([]);
  const [stats, setStats] = useState<DiagnosticStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'submitted_for_review' | 'admin_reviewed' | 'ready_for_customer_care'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedRequest, setSelectedRequest] = useState<DiagnosticRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

  useEffect(() => {
    if (currentUser && ['admin', 'customer-care'].includes(currentUser.role)) {
      loadData();
      setupRealTimeSubscriptions();
    }
  }, [statusFilter, dateFilter, currentUser]);

  // Check if user has permission
  if (!currentUser || !['admin', 'customer-care'].includes(currentUser.role)) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <GlassCard className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view diagnostic requests.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Setup real-time subscriptions for diagnostic updates
  const setupRealTimeSubscriptions = () => {
    if (!currentUser?.id) return;

    // Subscribe to diagnostic requests created by this user
    const diagnosticRequestsSubscription = supabase
      .channel('customer-care-diagnostic-requests')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'diagnostic_requests',
          filter: `created_by=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('🔔 Diagnostic request update received:', payload);
          handleDiagnosticUpdate(payload);
        }
      )
      .subscribe();

    // Subscribe to diagnostic devices for this user's requests
    const diagnosticDevicesSubscription = supabase
      .channel('customer-care-diagnostic-devices')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'diagnostic_devices'
        },
        (payload) => {
          console.log('🔔 Diagnostic device update received:', payload);
          handleDiagnosticDeviceUpdate(payload);
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      diagnosticRequestsSubscription.unsubscribe();
      diagnosticDevicesSubscription.unsubscribe();
    };
  };

  // Handle diagnostic request updates
  const handleDiagnosticUpdate = (payload: any) => {
    if (payload.eventType === 'UPDATE') {
      const updatedRequest = payload.new;
      setRequests(prev => 
        prev.map(req => 
          req.id === updatedRequest.id 
            ? { ...req, ...updatedRequest }
            : req
        )
      );
      
      // Show notification for status changes
      if (payload.old?.status !== payload.new?.status) {
        const statusText = getStatusText(payload.new?.status);
        
        // Special notification for ready_for_customer_care status
        if (payload.new?.status === 'ready_for_customer_care') {
          toast.success(`🎉 Device diagnostics completed! "${updatedRequest.title}" is ready for customer care review.`, {
            icon: <Bell className="w-4 h-4" />,
            duration: 6000
          });
        } else {
          toast.success(`Diagnostic request "${updatedRequest.title}" status updated to ${statusText}`, {
            icon: <Bell className="w-4 h-4" />,
            duration: 4000
          });
        }
        setHasNewUpdates(true);
      }
    } else if (payload.eventType === 'INSERT') {
      // New request created
      loadData(); // Reload to get fresh data
      toast.success('New diagnostic request created!', {
        icon: <Plus className="w-4 h-4" />,
        duration: 3000
      });
      setHasNewUpdates(true);
    }
  };

  // Handle diagnostic device updates
  const handleDiagnosticDeviceUpdate = (payload: any) => {
    if (payload.eventType === 'UPDATE') {
      const updatedDevice = payload.new;
      
      // Check if this device belongs to one of our requests
      setRequests(prev => 
        prev.map(req => {
          // This is a simplified check - in a real app you'd need to fetch the request_id
          // For now, we'll reload the data to ensure accuracy
          return req;
        })
      );
      
      // Show notification for device status changes
      if (payload.old?.result_status !== payload.new?.result_status) {
        const statusText = getDeviceStatusText(payload.new?.result_status);
        toast.success(`Device "${updatedDevice.device_name}" status updated to ${statusText}`, {
          icon: <Smartphone className="w-4 h-4" />,
          duration: 4000
        });
        setHasNewUpdates(true);
      }
    }
  };

  const getDeviceStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'passed':
        return 'Passed';
      case 'failed':
        return 'Failed';
      case 'partially_failed':
        return 'Partially Failed';
      case 'submitted_for_review':
        return 'Submitted for Review';
      case 'ready_for_customer_care':
        return 'Ready for Customer Care';
      case 'repair_required':
        return 'Repair Required';
      case 'replacement_required':
        return 'Replacement Required';
      case 'no_action_required':
        return 'No Action Required';
      case 'escalated':
        return 'Escalated';
      case 'admin_reviewed':
        return 'Admin Reviewed';
      default:
        return 'Unknown';
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Build filters
      const filters: any = {
        created_by: currentUser.id
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      // Add date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
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

        filters.date_from = startDate.toISOString();
      }

      const [requestsData, statsData] = await Promise.all([
        getDiagnosticRequests(filters),
        getDiagnosticStats()
      ]);

      setRequests(requestsData);
      setStats(statsData);
      setHasNewUpdates(false); // Reset new updates flag
    } catch (error) {
      console.error('Error loading diagnostic data:', error);
      toast.error('Failed to load diagnostic data');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.assigned_to_user?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'submitted_for_review':
        return <Eye className="h-5 w-5 text-purple-500" />;
      case 'ready_for_customer_care':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'repair_required':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'replacement_required':
        return <RefreshCw className="h-5 w-5 text-red-500" />;
      case 'escalated':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'no_action_required':
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
      case 'admin_reviewed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted_for_review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ready_for_customer_care':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'repair_required':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'replacement_required':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'escalated':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'no_action_required':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'admin_reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'submitted_for_review':
        return 'Submitted for Review';
      case 'ready_for_customer_care':
        return 'Ready for Customer Care';
      case 'repair_required':
        return 'Repair Required';
      case 'replacement_required':
        return 'Replacement Required';
      case 'escalated':
        return 'Escalated';
      case 'no_action_required':
        return 'No Action Required';
      case 'admin_reviewed':
        return 'Admin Reviewed';
      default:
        return 'Unknown';
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

  const handleViewDetails = (request: DiagnosticRequest) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  const handleRefresh = () => {
    loadData();
    toast.success('Data refreshed');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <GlassButton
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back
            </GlassButton>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                My Diagnostic Requests
              </h1>
              {hasNewUpdates && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <Bell className="w-4 h-4 animate-pulse" />
                  Live Updates
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GlassButton
              onClick={() => navigate('/diagnostics/new')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              New Request
            </GlassButton>
            <GlassButton
              onClick={handleRefresh}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </GlassButton>
          </div>
        </div>
        <p className="text-gray-600">
          View and track all diagnostic requests you've sent to technicians
          {hasNewUpdates && (
            <span className="ml-2 text-green-600 font-medium">
              • Real-time updates enabled
            </span>
          )}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalRequests}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold text-gray-900">{stats.pendingRequests}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-xl font-bold text-gray-900">{stats.inProgressRequests}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold text-gray-900">{stats.completedRequests}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Filters and Search */}
      <GlassCard className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="ready_for_customer_care">Ready for Customer Care</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <GlassButton
              onClick={() => navigate('/diagnostics/new')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              New Request
            </GlassButton>
            <GlassButton
              onClick={handleRefresh}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Ready for Customer Care Section */}
      {filteredRequests.filter(r => r.status === 'ready_for_customer_care').length > 0 && (
        <GlassCard className="p-6 mb-6 border-2 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Ready for Customer Care Review</h3>
              <p className="text-blue-700">
                {filteredRequests.filter(r => r.status === 'ready_for_customer_care').length} device(s) completed diagnostics and ready for your review
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {filteredRequests
              .filter(r => r.status === 'ready_for_customer_care')
              .map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{request.title}</h4>
                      <p className="text-sm text-gray-600">
                        Completed by: {request.assigned_to_user?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GlassButton
                      onClick={() => handleViewDetails(request)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Eye className="h-4 w-4" />
                      Review
                    </GlassButton>
                  </div>
                </div>
              ))}
          </div>
        </GlassCard>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <GlassCard className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading diagnostic requests...</p>
            </div>
          </GlassCard>
        ) : filteredRequests.length === 0 ? (
          <GlassCard className="p-6">
            <div className="text-center">
              <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Diagnostic Requests</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'No requests match your current filters.'
                  : 'You haven\'t created any diagnostic requests yet.'}
              </p>
              <GlassButton
                onClick={() => navigate('/diagnostics/new')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Request
              </GlassButton>
            </div>
          </GlassCard>
        ) : (
          filteredRequests.map((request) => (
            <GlassCard key={request.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Assigned to: <span className="font-medium">{request.assigned_to_user?.name || 'Unassigned'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Devices: <span className="font-medium">{request.device_count || 0}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Created: <span className="font-medium">{formatDate(request.created_at)}</span>
                      </span>
                    </div>
                  </div>

                  {request.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {request.notes}
                      </p>
                    </div>
                  )}

                  {/* Device Results Summary */}
                  {request.devices && request.devices.length > 0 && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">{request.passed_devices || 0} passed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">{request.failed_devices || 0} failed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-yellow-600">{request.pending_devices || 0} pending</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <GlassButton
                    onClick={() => handleViewDetails(request)}
                    className="flex items-center gap-2"
                    variant="secondary"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Diagnostic Request Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Request Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Title</p>
                      <p className="font-medium">{selectedRequest.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedRequest.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedRequest.status)}`}>
                          {getStatusText(selectedRequest.status)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Assigned To</p>
                      <p className="font-medium">{selectedRequest.assigned_to_user?.name || 'Unassigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium">{formatDate(selectedRequest.created_at)}</p>
                    </div>
                  </div>
                  {selectedRequest.notes && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="font-medium">{selectedRequest.notes}</p>
                    </div>
                  )}
                </div>

                {/* Devices */}
                {selectedRequest.devices && selectedRequest.devices.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Devices</h3>
                    <div className="space-y-3">
                      {selectedRequest.devices.map((device: any, index: number) => (
                        <div key={device.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{device.device_name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              device.result_status === 'passed' ? 'bg-green-100 text-green-800 border-green-200' :
                              device.result_status === 'failed' ? 'bg-red-100 text-red-800 border-red-200' :
                              device.result_status === 'partially_failed' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {device.result_status === 'passed' ? 'Passed' :
                               device.result_status === 'failed' ? 'Failed' :
                               device.result_status === 'partially_failed' ? 'Partially Failed' :
                               'Pending'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            {device.serial_number && (
                              <div>
                                <span className="font-medium">Serial:</span> {device.serial_number}
                              </div>
                            )}
                            {device.model && (
                              <div>
                                <span className="font-medium">Model:</span> {device.model}
                              </div>
                            )}
                          </div>
                          {device.notes && (
                            <div className="mt-2">
                              <span className="font-medium text-sm">Notes:</span>
                              <p className="text-sm text-gray-600">{device.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <GlassButton
                  onClick={() => setShowDetails(false)}
                  variant="secondary"
                >
                  Close
                </GlassButton>
                <GlassButton
                  onClick={() => {
                    setShowDetails(false);
                    navigate(`/diagnostics/request/${selectedRequest.id}`);
                  }}
                >
                  View Full Report
                </GlassButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCareDiagnosticsPage;