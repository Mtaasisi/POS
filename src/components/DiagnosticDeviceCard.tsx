import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiagnosticDevice, DiagnosticRequest } from '../types/diagnostics';
import GlassCard from './ui/GlassCard';
import { 
  Eye, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Monitor,
  Printer,
  Laptop,
  Smartphone,
  Tablet,
  Package,
  Calendar,
  User,
  Clock,
  MessageSquare,
  Wrench,
  TrendingUp,
  BarChart3,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DiagnosticDeviceCardProps {
  device: DiagnosticDevice;
  request: DiagnosticRequest;
  showDetails?: boolean;
}

const DiagnosticDeviceCard: React.FC<DiagnosticDeviceCardProps> = React.memo(({ 
  device, 
  request, 
  showDetails = true 
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Format date to readable format
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const options: Intl.DateTimeFormatOptions = {
      year: '2-digit',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString(undefined, options);
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
      case 'no_action_required':
        return 'text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 'escalated':
        return 'text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200';
      case 'admin_reviewed':
        return 'text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
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
      case 'admin_reviewed':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
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
      case 'no_action_required':
        return 'No Action Required';
      case 'escalated':
        return 'Escalated';
      case 'admin_reviewed':
        return 'Admin Reviewed';
      default:
        return status.replace('_', ' ');
    }
  };

  const handleCardClick = () => {
    // Card clicked - navigating to device detail
    
    // Use diagnostic_device_id as the primary ID field for devices
    const deviceId = device.diagnostic_device_id || device.id || device.device_id;
    const requestId = request.id || request.request_id || request.diagnostic_request_id;
    
    if (requestId && deviceId) {
      try {
        navigate(`/diagnostics/device/${requestId}/${deviceId}`);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    } else {
      console.warn('Missing request.id or device.id for navigation', {
        deviceId,
        requestId,
        device: device,
        request: request
      });
    }
  };

  const getDisplayModel = () => {
    if (device.model) {
      return `${device.device_name || 'Unknown Device'} - ${device.model}`;
    }
    return device.device_name || 'Unknown Device';
  };

  const getProgressInfo = () => {
    if (device.checks && device.checks.length > 0) {
      const completed = device.checks.length;
      const total = device.check_count || completed;
      return `${completed}/${total} tests completed`;
    }
    return 'No tests started';
  };

  const getProgressPercentage = () => {
    if (device.checks && device.checks.length > 0) {
      const completed = device.checks.length;
      const total = device.check_count || completed;
      return total > 0 ? (completed / total) * 100 : 0;
    }
    return 0;
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage === 100) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (percentage >= 50) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (percentage > 0) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-gray-300 to-gray-400';
  };

  return (
    <GlassCard 
      onClick={handleCardClick}
      className="group transform transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl cursor-pointer relative overflow-hidden"
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Feedback notification badge in top-left corner */}
      {device.admin_feedback && (
        <div className="absolute top-3 left-3 z-20">
          <div className="relative">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
              <MessageSquare className="h-3 w-3" />
            </span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping" />
          </div>
        </div>
      )}
      
      {/* Status badge in top-right corner */}
      <div className="absolute top-3 right-3 z-20">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 shadow-lg backdrop-blur-sm ${getStatusColor(device.result_status || 'pending')}`}>
          {getStatusIcon(device.result_status || 'pending')}
          <span className="capitalize">{getStatusDisplayName(device.result_status || 'pending')}</span>
        </span>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10">
        {/* Device Header with Icon */}
        <div className="flex items-center gap-4 mb-4 pt-8 pr-20">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-blue-200 shadow-sm">
              {getDeviceIcon(device.device_name)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 truncate" title={getDisplayModel()}>
              {getDisplayModel()}
            </h3>
            {device.serial_number && (
              <p className="text-sm text-gray-600 font-mono truncate" title={`S/N: ${device.serial_number}`}>S/N: {device.serial_number}</p>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Progress</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{getProgressInfo()}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Created</p>
              <p className="text-sm font-semibold text-blue-700 truncate">{formatDate(device.created_at)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-purple-50/50 rounded-lg border border-purple-100">
            <User className="h-4 w-4 text-purple-600" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Assigned</p>
              <p className="text-sm font-semibold text-purple-700 truncate">
                {request.assigned_to_user?.name || 'Unassigned'}
              </p>
            </div>
          </div>
        </div>

        {showDetails && (
          <>
            {/* Request Info */}
            <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-800">Request</span>
              </div>
              <p className="text-sm text-indigo-700 font-medium truncate">
                {request.title || 'Untitled Request'}
              </p>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {(() => {
            const deviceId = device.diagnostic_device_id || device.id || device.device_id;
            const requestId = request.id || request.request_id || request.diagnostic_request_id;
            const status = device.result_status || 'pending';
            
            const handleNavigation = (e: React.MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
              
              if (requestId && deviceId) {
                try {
                  navigate(`/diagnostics/device/${requestId}/${deviceId}`);
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              } else {
                console.warn('Missing request.id or device.id for navigation', {
                  deviceId,
                  requestId,
                  device: device,
                  request: request
                });
              }
            };

            // Admin actions
            if (currentUser?.role === 'admin') {
              if (status === 'submitted_for_review') {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <Eye className="h-4 w-4" />
                    Review
                  </button>
                );
              } else if (status === 'failed' || status === 'partially_failed') {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Assess
                  </button>
                );
              } else if (status === 'repair_required') {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <Wrench className="h-4 w-4" />
                    Repair Assigned
                  </button>
                );
              } else if (status === 'replacement_required') {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Replacement Assigned
                  </button>
                );
              } else if (status === 'escalated') {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Escalated
                  </button>
                );
              } else if (status === 'no_action_required') {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <Eye className="h-4 w-4" />
                    No Action Required
                  </button>
                );
              } else {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                );
              }
            }
            
            // Technician actions
            if (currentUser?.role === 'technician') {
              if (status === 'pending') {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <Play className="h-4 w-4" />
                    Start Tests
                  </button>
                );
              } else if (status === 'in_progress' || status === 'partially_failed') {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <Activity className="h-4 w-4" />
                    Continue
                  </button>
                );
              } else if (status === 'repair_required' || (device.admin_feedback && device.next_action === 'repair')) {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <Wrench className="h-4 w-4" />
                    Repair Required
                  </button>
                );
              } else if (status === 'replacement_required') {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Replacement Required
                  </button>
                );
              } else if (status === 'escalated') {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Escalated
                  </button>
                );
              } else if (status === 'no_action_required') {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <Eye className="h-4 w-4" />
                    No Action Required
                  </button>
                );
              } else {
                return (
                  <button
                    onClick={handleNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                );
              }
            }
            
            // Default action for other users
            return (
              <button
                onClick={handleNavigation}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium shadow-sm transition-all duration-200 group-hover:shadow-md"
              >
                <Eye className="h-4 w-4" />
                View
              </button>
            );
          })()}
        </div>
      </div>
    </GlassCard>
  );
});

export default DiagnosticDeviceCard;