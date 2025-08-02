import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDiagnosticRequest, markActionCompleted } from '../lib/diagnosticsApi';
import { DiagnosticRequest, DiagnosticDevice } from '../types/diagnostics';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import DiagnosticDeviceCard from '../components/DiagnosticDeviceCard';
import { 
  ArrowLeft, 
  Play, 
  Eye, 
  Monitor,
  Printer,
  Laptop,
  Smartphone,
  Tablet,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DiagnosticRequestDetailPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<DiagnosticRequest | null>(null);

  // Load data
  useEffect(() => {
    if (requestId) {
      loadData();
    }
  }, [requestId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const requestData = await getDiagnosticRequest(requestId!);
      if (!requestData) {
        toast.error('Diagnostic request not found');
        navigate('/diagnostics/assigned');
        return;
      }

      setRequest(requestData);
    } catch (error) {
      console.error('Error loading diagnostic request:', error);
      toast.error('Failed to load diagnostic request');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceName?: string) => {
    if (!deviceName) return <Package className="h-5 w-5" />;
    const name = deviceName.toLowerCase();
    if (name.includes('laptop') || name.includes('notebook')) return <Laptop className="h-5 w-5" />;
    if (name.includes('printer') || name.includes('print')) return <Printer className="h-5 w-5" />;
    if (name.includes('monitor') || name.includes('screen')) return <Monitor className="h-5 w-5" />;
    if (name.includes('desktop') || name.includes('pc')) return <Monitor className="h-5 w-5" />;
    if (name.includes('tablet') || name.includes('ipad')) return <Tablet className="h-5 w-5" />;
    if (name.includes('phone') || name.includes('mobile')) return <Smartphone className="h-5 w-5" />;
    return <Package className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'passed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'partially_failed':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'passed':
        return <CheckCircle size={16} />;
      case 'failed':
        return <XCircle size={16} />;
      case 'partially_failed':
        return <AlertTriangle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const handleStartDevice = (device: DiagnosticDevice) => {
    navigate(`/diagnostics/device/${requestId}/${device.id}`);
  };

  const handleViewDevice = (device: DiagnosticDevice) => {
    // For now, navigate to the same page but we could implement a modal view later
    navigate(`/diagnostics/device/${requestId}/${device.id}`);
  };

  const handleMarkActionCompleted = async (deviceId: string) => {
    try {
      const success = await markActionCompleted({ device_id: deviceId });
      if (success) {
        loadData(); // Reload data to show updated status
      }
    } catch (error) {
      console.error('Error marking action as completed:', error);
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
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading diagnostic request...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <GlassCard className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Not Found</h2>
            <p className="text-gray-600">The diagnostic request you're looking for doesn't exist.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <GlassButton
            onClick={() => navigate('/diagnostics/assigned')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back
          </GlassButton>
          <h1 className="text-2xl font-bold text-gray-900">Diagnostic Request</h1>
        </div>
      </div>

      {/* Request Details */}
      <GlassCard className="p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{request.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Created: {formatDate(request.created_at)}</span>
              {request.created_by_user && (
                <span>By: {request.created_by_user.name}</span>
              )}
              {request.assigned_to_user && (
                <span>Assigned to: {request.assigned_to_user.name}</span>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
            {getStatusIcon(request.status)}
            {request.status.replace('_', ' ')}
          </span>
        </div>
        
        {request.notes && (
          <p className="text-gray-600 mb-4">{request.notes}</p>
        )}
      </GlassCard>

      {/* Devices List */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Devices ({request.devices?.length || 0})</h3>
        
        {!request.devices || request.devices.length === 0 ? (
          <div className="text-center py-8">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No devices in this request</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {request.devices.map((device, index) => (
              <DiagnosticDeviceCard
                key={device.id || `device-${request.id}-${index}`}
                device={device}
                request={request}
                showDetails={true}
              />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default DiagnosticRequestDetailPage;