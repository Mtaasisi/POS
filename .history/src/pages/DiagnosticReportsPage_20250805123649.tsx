import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDiagnosticRequests, getDiagnosticStats } from '../lib/diagnosticsApi';
import { DiagnosticRequest, DiagnosticStats } from '../types/diagnostics';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { BackButton } from '../components/ui/BackButton';
import AdminFeedbackModal from '../components/AdminFeedbackModal';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Wrench, 
  RefreshCw, 
  XCircle,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  User,
  Monitor,
  Printer,
  Laptop,
  Smartphone,
  Tablet,
  Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DiagnosticReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DiagnosticRequest[]>([]);
  const [stats, setStats] = useState<DiagnosticStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'submitted_for_review'>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'passed' | 'failed' | 'partially_failed' | 'submitted_for_review'>('all');
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Check if user has permission
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <GlassCard className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">This page is only available for administrators.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = {
        ...(statusFilter !== 'all' && { status: statusFilter })
      };

      const [requestsData, statsData] = await Promise.all([
        getDiagnosticRequests(filters),
        getDiagnosticStats()
      ]);

      setRequests(requestsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading diagnostic data:', error);
      toast.error('Failed to load diagnostic data');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesResultFilter = resultFilter === 'all' || 
      request.devices?.some(device => device.result_status === resultFilter);

    return matchesSearch && matchesResultFilter;
  });

  const getDeviceIcon = (deviceName?: string) => {
    if (!deviceName) return <Package className="h-4 w-4" />;
    const name = deviceName.toLowerCase();
    if (name.includes('laptop') || name.includes('notebook')) return <Laptop className="h-4 w-4" />;
    if (name.includes('printer') || name.includes('print')) return <Printer className="h-4 w-4" />;
    if (name.includes('monitor') || name.includes('screen')) return <Monitor className="h-4 w-4" />;
    if (name.includes('desktop') || name.includes('pc')) return <Monitor className="h-4 w-4" />;
    if (name.includes('tablet') || name.includes('ipad')) return <Tablet className="h-4 w-4" />;
    if (name.includes('phone') || name.includes('mobile')) return <Smartphone className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'submitted_for_review':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getResultColor = (result?: string) => {
    if (!result) return 'text-gray-600 bg-gray-50 border-gray-200';
    switch (result) {
      case 'passed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'partially_failed':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'submitted_for_review':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const handleViewRequest = (requestId: string) => {
    navigate(`/diagnostics/request/${requestId}`);
  };

  const handleGiveFeedback = (device: any) => {
    setSelectedDevice(device);
    setIsFeedbackModalOpen(true);
  };

  const handleFeedbackSuccess = () => {
    loadData(); // Reload data to show updated feedback
  };

  const exportReport = () => {
    // Export diagnostic report to CSV/PDF
    toast('Export feature coming soon');
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diagnostic Reports</h1>
            <p className="text-gray-600">Review all diagnostic results and assign follow-up actions</p>
          </div>
          <div className="flex gap-2">
            <GlassButton
              onClick={exportReport}
              className="flex items-center gap-2"
            >
              <Download size={20} />
              Export
            </GlassButton>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total_requests}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.passed_devices}</div>
              <div className="text-sm text-gray-600">Passed Devices</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed_devices}</div>
              <div className="text-sm text-gray-600">Failed Devices</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.partially_failed_devices}</div>
              <div className="text-sm text-gray-600">Partial Failures</div>
            </GlassCard>
            <GlassCard className="p-4 text-center bg-purple-50 border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {requests.reduce((count, request) => 
                  count + (request.devices?.filter(device => device.result_status === 'submitted_for_review').length || 0), 0
                )}
              </div>
              <div className="text-sm text-purple-600 font-medium">Needs Review</div>
            </GlassCard>
          </div>
        )}
      </div>

      {/* Filters */}
      <GlassCard className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search requests or devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted_for_review">Submitted for Review</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Results</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="partially_failed">Partially Failed</option>
              <option value="submitted_for_review">Needs Review</option>
            </select>
            
            <GlassButton
              onClick={loadData}
              className="flex items-center gap-2"
            >
              <Filter size={16} />
              Refresh
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading diagnostic reports...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <BarChart3 size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Diagnostic Reports</h3>
          <p className="text-gray-600">
            {searchQuery || statusFilter !== 'all' || resultFilter !== 'all'
              ? 'No reports match your current filters.'
              : 'No diagnostic reports available.'
            }
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <GlassCard key={request.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Created by: <span className="font-medium">{request.created_by_user?.name || 'Unknown'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Assigned to: <span className="font-medium">{request.assigned_to_user?.name || 'Unassigned'}</span>
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
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-yellow-600">{request.pending_devices || 0} pending</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <GlassButton
                    onClick={() => handleViewRequest(request.id)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </GlassButton>
                </div>
              </div>

              {/* Devices that need review */}
              {request.devices?.filter(device => device.result_status === 'submitted_for_review').length > 0 && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-3">Devices Needing Review:</h4>
                  <div className="space-y-2">
                    {request.devices
                      .filter(device => device.result_status === 'submitted_for_review')
                      .map((device: any) => (
                        <div key={device.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                          <div className="flex items-center gap-3">
                            {getDeviceIcon(device.device_name)}
                            <div>
                              <h5 className="font-medium text-gray-900">{device.device_name}</h5>
                              {device.serial_number && (
                                <p className="text-sm text-gray-500">S/N: {device.serial_number}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getResultColor(device.result_status)}`}>
                              {device.result_status.replace('_', ' ')}
                            </span>
                            <GlassButton
                              onClick={() => handleGiveFeedback(device)}
                              className="flex items-center gap-2 px-3 py-1 text-sm"
                            >
                              <Wrench className="h-3 w-3" />
                              Review
                            </GlassButton>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
      
      {/* Admin Feedback Modal */}
      {selectedDevice && (
        <AdminFeedbackModal
          device={selectedDevice}
          isOpen={isFeedbackModalOpen}
          onClose={() => {
            setIsFeedbackModalOpen(false);
            setSelectedDevice(null);
          }}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  );
};

export default DiagnosticReportsPage;