import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDiagnosticRequests, getDiagnosticStats } from '../lib/diagnosticsApi';
import { DiagnosticRequest, DiagnosticStats } from '../types/diagnostics';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Eye,
  Monitor,
  Printer,
  Laptop,
  Smartphone,
  Tablet,
  Package,
  User,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AssignedDiagnosticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DiagnosticRequest[]>([]);
  const [stats, setStats] = useState<DiagnosticStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  // Check if user has permission
  if (!currentUser || currentUser.role !== 'technician') {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <GlassCard className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">This page is only available for technicians.</p>
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
        assigned_to: currentUser?.id,
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

  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'submitted_for_review':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'in_progress':
        return <Play size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'submitted_for_review':
        return <AlertTriangle size={16} />;
      default:
        return <Clock size={16} />;
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

  const handleStartDiagnosis = (requestId: string) => {
    navigate(`/diagnostics/request/${requestId}`);
  };

  const handleViewRequest = (requestId: string) => {
    navigate(`/diagnostics/request/${requestId}`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Assigned Diagnostics</h1>
            <p className="text-gray-600">View and work on your assigned diagnostic requests</p>
          </div>
          <GlassButton
            onClick={() => navigate('/diagnostics/new')}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            New Request
          </GlassButton>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.pending_requests}</div>
              <div className="text-sm text-gray-600">Pending Requests</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.in_progress_requests}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed_requests}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.total_devices}</div>
              <div className="text-sm text-gray-600">Total Devices</div>
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
                placeholder="Search requests..."
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
              <option value="completed">Completed</option>
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
          <p className="text-gray-600">Loading diagnostic requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <AlertTriangle size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Diagnostic Requests</h3>
          <p className="text-gray-600">
            {searchQuery || statusFilter !== 'all' 
              ? 'No requests match your current filters.'
              : 'You have no assigned diagnostic requests at the moment.'
            }
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((request) => (
            <GlassCard key={request.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{request.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} />
                  <span>Created by: {request.created_by_user?.name || 'Unknown'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} />
                  <span>Created: {formatDate(request.created_at)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package size={16} />
                  <span>Devices: {request.device_count || 0}</span>
                </div>

                {/* Device Summary */}
                {request.devices && request.devices.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Devices:</h4>
                    <div className="space-y-1">
                      {request.devices.slice(0, 3).map((device: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          {getDeviceIcon(device.device_name)}
                          <span className="truncate">{device.device_name}</span>
                          {device.serial_number && (
                            <span className="text-xs text-gray-500">({device.serial_number})</span>
                          )}
                        </div>
                      ))}
                      {request.devices.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{request.devices.length - 3} more devices
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {request.notes && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {request.notes}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {request.status === 'pending' ? (
                  <GlassButton
                    onClick={() => handleStartDiagnosis(request.id)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Play size={16} />
                    Start Diagnosis
                  </GlassButton>
                ) : (
                  <GlassButton
                    onClick={() => handleViewRequest(request.id)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View Details
                  </GlassButton>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedDiagnosticsPage;