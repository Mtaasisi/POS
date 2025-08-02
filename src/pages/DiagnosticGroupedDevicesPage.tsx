import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getDiagnosticRequest, 
  getDiagnosticTemplate,
  getDiagnosticChecks
} from '../lib/diagnosticsApi';
import { 
  DiagnosticRequest, 
  DiagnosticDevice, 
  DiagnosticCheck,
  DiagnosticTemplate
} from '../types/diagnostics';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Monitor,
  Printer,
  Laptop,
  Smartphone,
  Tablet,
  Package,
  AlertTriangle,
  MessageSquare,
  Wrench,
  Eye,
  Play,
  Activity,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DiagnosticGroupedDevicesPage: React.FC = () => {
  const { requestId, deviceName, model } = useParams<{ requestId: string; deviceName: string; model: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<DiagnosticRequest | null>(null);
  const [devices, setDevices] = useState<DiagnosticDevice[]>([]);
  const [template, setTemplate] = useState<DiagnosticTemplate | null>(null);
  const [deviceChecks, setDeviceChecks] = useState<Record<string, DiagnosticCheck[]>>({});

  // Load data
  useEffect(() => {
    if (requestId && deviceName && model) {
      loadData();
    }
  }, [requestId, deviceName, model]);

  const loadData = async () => {
    setLoading(true);
    try {
      const requestData = await getDiagnosticRequest(requestId!);
      if (!requestData) {
        toast.error('Diagnostic request not found');
        navigate('/diagnostics/reports');
        return;
      }

      setRequest(requestData);
      
      // Find all devices with the same name and model
      const matchingDevices = requestData.devices?.filter(d => 
        d.device_name === deviceName && d.model === model
      ) || [];
      
      setDevices(matchingDevices);

      // Load template based on device type
      if (matchingDevices.length > 0) {
        const deviceType = getDeviceTypeFromName(matchingDevices[0].device_name);
        const templateData = await getDiagnosticTemplate(deviceType);
        setTemplate(templateData);
      }

      // Load checks for all devices
      const checksData: Record<string, DiagnosticCheck[]> = {};
      for (const device of matchingDevices) {
        const checks = await getDiagnosticChecks(device.id);
        checksData[device.id] = checks;
      }
      setDeviceChecks(checksData);
    } catch (error) {
      console.error('Error loading diagnostic data:', error);
      toast.error('Failed to load diagnostic data');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceTypeFromName = (deviceName: string): string => {
    const name = deviceName.toLowerCase();
    if (name.includes('laptop') || name.includes('notebook')) return 'laptop';
    if (name.includes('printer') || name.includes('print')) return 'printer';
    if (name.includes('monitor') || name.includes('screen')) return 'monitor';
    if (name.includes('desktop') || name.includes('pc')) return 'desktop';
    if (name.includes('tablet') || name.includes('ipad')) return 'tablet';
    if (name.includes('phone') || name.includes('mobile')) return 'phone';
    return 'other';
  };

  const getDeviceIcon = (deviceName?: string) => {
    if (!deviceName) return <Package className="h-6 w-6" />;
    const name = deviceName.toLowerCase();
    if (name.includes('laptop') || name.includes('notebook')) return <Laptop className="h-6 w-6" />;
    if (name.includes('printer') || name.includes('print')) return <Printer className="h-6 w-6" />;
    if (name.includes('monitor') || name.includes('screen')) return <Monitor className="h-6 w-6" />;
    if (name.includes('desktop') || name.includes('pc')) return <Monitor className="h-6 w-6" />;
    if (name.includes('tablet') || name.includes('ipad')) return <Tablet className="h-6 w-6" />;
    if (name.includes('phone') || name.includes('mobile')) return <Smartphone className="h-6 w-6" />;
    return <Package className="h-6 w-6" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-700 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
      case 'passed':
        return 'text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-gradient-to-r from-red-50 to-pink-50 border-red-200';
      case 'partially_failed':
        return 'text-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
      case 'submitted_for_review':
        return 'text-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200';
      case 'repair_complete':
        return 'text-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200';
      case 'repair_required':
        return 'text-orange-700 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200';
      case 'replacement_required':
        return 'text-red-700 bg-gradient-to-r from-red-50 to-pink-50 border-red-200';
      case 'escalated':
        return 'text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200';
      case 'no_action_required':
        return 'text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5" />;
      case 'failed':
        return <XCircle className="h-5 w-5" />;
      case 'partially_failed':
        return <AlertTriangle className="h-5 w-5" />;
      case 'repair_required':
        return <Wrench className="h-5 w-5" />;
      case 'replacement_required':
        return <RefreshCw className="h-5 w-5" />;
      case 'escalated':
        return <MessageSquare className="h-5 w-5" />;
      case 'no_action_required':
        return <Eye className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'submitted_for_review':
        return 'Review';
      case 'partially_failed':
        return 'Partial';
      case 'repair_complete':
        return 'Repaired';
      case 'repair_required':
        return 'Repair Required';
      case 'replacement_required':
        return 'Replacement Required';
      case 'escalated':
        return 'Escalated';
      case 'no_action_required':
        return 'No Action Required';
      default:
        return status.replace('_', ' ');
    }
  };

  const getProgressInfo = (device: DiagnosticDevice) => {
    const checks = deviceChecks[device.id] || [];
    const completed = checks.length;
    const total = device.check_count || completed;
    return `${completed}/${total} tests completed`;
  };

  const getProgressPercentage = (device: DiagnosticDevice) => {
    const checks = deviceChecks[device.id] || [];
    const completed = checks.length;
    const total = device.check_count || completed;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (percentage >= 50) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (percentage > 0) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-gray-300 to-gray-400';
  };

  const handleDeviceClick = (device: DiagnosticDevice) => {
    const deviceId = device.diagnostic_device_id || device.id || device.device_id;
    if (requestId && deviceId) {
      navigate(`/diagnostics/device/${requestId}/${deviceId}`);
    }
  };

  const getActionButton = (device: DiagnosticDevice) => {
    const status = device.result_status || 'pending';
    
    // Admin actions
    if (currentUser?.role === 'admin') {
      if (status === 'submitted_for_review') {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-sm"
          >
            <Eye className="h-4 w-4" />
            Review
          </GlassButton>
        );
      } else if (status === 'failed' || status === 'partially_failed') {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm"
          >
            <AlertTriangle className="h-4 w-4" />
            Assess
          </GlassButton>
        );
      } else if (status === 'repair_required') {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm"
          >
            <Wrench className="h-4 w-4" />
            Repair Assigned
          </GlassButton>
        );
      } else if (status === 'replacement_required') {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Replacement Assigned
          </GlassButton>
        );
      } else if (status === 'escalated') {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm"
          >
            <MessageSquare className="h-4 w-4" />
            Escalated
          </GlassButton>
        );
      } else if (status === 'no_action_required') {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-sm"
          >
            <Eye className="h-4 w-4" />
            No Action Required
          </GlassButton>
        );
      } else {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm"
          >
            <Eye className="h-4 w-4" />
            View
          </GlassButton>
        );
      }
    }
    
    // Technician actions
    if (currentUser?.role === 'technician') {
      if (status === 'pending') {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm"
          >
            <Play className="h-4 w-4" />
            Start Tests
          </GlassButton>
        );
      } else if (status === 'in_progress' || status === 'partially_failed') {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm"
          >
            <Activity className="h-4 w-4" />
            Continue
          </GlassButton>
        );
      } else if (status === 'repair_required' || (device.admin_feedback && device.next_action === 'repair')) {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm"
          >
            <Wrench className="h-4 w-4" />
            Repair Required
          </GlassButton>
        );
      } else if (status === 'replacement_required') {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Replacement Required
          </GlassButton>
        );
      } else if (status === 'escalated') {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm"
          >
            <MessageSquare className="h-4 w-4" />
            Escalated
          </GlassButton>
        );
      } else if (status === 'no_action_required') {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-sm"
          >
            <Eye className="h-4 w-4" />
            No Action Required
          </GlassButton>
        );
      } else {
        return (
          <GlassButton
            onClick={() => handleDeviceClick(device)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm"
          >
            <Eye className="h-4 w-4" />
            View
          </GlassButton>
        );
      }
    }
    
    // Default action
    return (
      <GlassButton
        onClick={() => handleDeviceClick(device)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm"
      >
        <Eye className="h-4 w-4" />
        View
      </GlassButton>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading grouped devices...</p>
        </div>
      </div>
    );
  }

  if (!request || devices.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <GlassCard className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Devices Not Found</h2>
            <p className="text-gray-600">The requested grouped devices could not be found.</p>
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
            onClick={() => navigate(currentUser?.role === 'admin' ? '/diagnostics/reports' : '/diagnostics/assigned')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back
          </GlassButton>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {deviceName} - {model}
            </h1>
            <p className="text-gray-600">{request.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-500">{devices.length} device{devices.length > 1 ? 's' : ''}</span>
              {request.assigned_to_user && (
                <span className="text-sm text-blue-600">• Technician: {request.assigned_to_user.name}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device, index) => (
          <GlassCard key={device.id || index} className="p-6 hover:shadow-lg transition-shadow duration-200">
            {/* Device Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-blue-200">
                {getDeviceIcon(device.device_name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {device.serial_number || `Device ${index + 1}`}
                </h3>
                <p className="text-sm text-gray-600">#{index + 1}</p>
              </div>
              <div className="flex items-center gap-2">
                {device.admin_feedback && (
                  <div className="relative">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  </div>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.result_status || 'pending')}`}>
                  {getStatusIcon(device.result_status || 'pending')}
                  <span className="capitalize">{getStatusDisplayName(device.result_status || 'pending')}</span>
                </span>
              </div>
            </div>

            {/* Progress Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-semibold text-gray-900">{getProgressInfo(device)}</span>
              </div>
              <div className="relative">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor(getProgressPercentage(device))}`}
                    style={{ width: `${getProgressPercentage(device)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Admin Feedback Preview */}
            {device.admin_feedback && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={14} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Admin Feedback:</span>
                </div>
                <p className="text-sm text-blue-700 line-clamp-2">{device.admin_feedback}</p>
                {device.next_action && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium text-blue-600">Action:</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      device.next_action === 'repair' ? 'bg-orange-100 text-orange-700' :
                      device.next_action === 'replace' ? 'bg-red-100 text-red-700' :
                      device.next_action === 'ignore' ? 'bg-gray-100 text-gray-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {device.next_action.charAt(0).toUpperCase() + device.next_action.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="flex justify-center">
              {getActionButton(device)}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default DiagnosticGroupedDevicesPage; 