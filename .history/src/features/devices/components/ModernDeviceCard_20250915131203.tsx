import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Device, DeviceStatus } from '../../../types';
import GlassCard from '../../shared/components/ui/GlassCard';
import { 
  User, Smartphone, Wrench, Calendar, CheckSquare, 
  MessageSquare, Edit, AlertTriangle, DollarSign, Phone, Mail,
  ChevronRight, Eye, Zap, Shield, Battery, Wifi, Signal,
  Clock, Star, Settings, Tag, PhoneCall, Mail as MailIcon
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

interface ModernDeviceCardProps {
  device: Device;
  variant?: 'default' | 'compact' | 'pos';
  showActions?: boolean;
  className?: string;
}

// Helper function to get device icon
const getDeviceIcon = (model: string) => {
  const modelLower = model.toLowerCase();
  if (modelLower.includes('iphone') || modelLower.includes('samsung') || modelLower.includes('phone')) {
    return <Smartphone className="w-5 h-5" />;
  }
  if (modelLower.includes('laptop') || modelLower.includes('macbook') || modelLower.includes('dell')) {
    return <Wifi className="w-5 h-5" />;
  }
  if (modelLower.includes('ipad') || modelLower.includes('tablet')) {
    return <Battery className="w-5 h-5" />;
  }
  if (modelLower.includes('watch') || modelLower.includes('fitbit')) {
    return <Signal className="w-5 h-5" />;
  }
  return <Zap className="w-5 h-5" />;
};

// Helper function to get status color
const getStatusColor = (status: DeviceStatus) => {
  switch (status) {
    case 'assigned':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'diagnosis-started':
    case 'in-repair':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'repair-complete':
    case 'done':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

// Helper function to get priority color
const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const ModernDeviceCard: React.FC<ModernDeviceCardProps> = React.memo(({ 
  device, 
  variant = 'default',
  showActions = true,
  className = ''
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [opened, setOpened] = useState(false);

  // Check if device has been opened
  useEffect(() => {
    if (localStorage.getItem(`devicecard_opened_${device.id}`) === '1') {
      setOpened(true);
    }
  }, [device.id]);

  // Helper functions
  const getDisplayModel = () => {
    return `${device.brand} ${device.model}`.trim();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCardClick = () => {
    localStorage.setItem(`devicecard_opened_${device.id}`, '1');
    setOpened(true);
    navigate(`/devices/${device.id}`);
  };

  // POS Compact Variant - Redesigned
  if (variant === 'pos') {
    return (
      <GlassCard 
        onClick={handleCardClick}
        className={`group transform transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-2xl cursor-pointer relative overflow-hidden bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg hover:border-blue-300/50 ${className}`}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white/20 to-purple-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${device.status === 'assigned' ? 'from-amber-400 to-orange-500' : device.status === 'in-repair' ? 'from-blue-400 to-cyan-500' : device.status === 'done' ? 'from-emerald-400 to-green-500' : 'from-red-400 to-pink-500'}`} />
        
        {/* Notification badge */}
        {device.remarks && device.remarks.length > 0 && !opened && (
          <div className="absolute top-3 right-3 z-20">
            <div className="relative">
              <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
                {device.remarks.length}
              </span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping" />
            </div>
          </div>
        )}

        <div className="relative z-10 p-5">
          {/* Header with device info */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center border border-blue-200/50 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <div className="text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  {getDeviceIcon(device.model)}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base leading-tight mb-2 group-hover:text-blue-900 transition-colors duration-300">
                {getDisplayModel()}
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-gray-600 font-mono bg-gray-100/80 px-3 py-1.5 rounded-lg border border-gray-200/50">
                  {device.serialNumber || 'N/A'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 shadow-sm backdrop-blur-sm transition-all duration-300 ${getStatusColor(device.status)}`}>
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span className="capitalize">{device.status.replace('_', ' ')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Customer info with enhanced styling */}
          <div className="mb-4 p-4 bg-gradient-to-r from-gray-50/90 to-blue-50/90 rounded-xl border border-gray-200/50 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center border border-blue-200/50">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-900 text-sm">
                {device.customerName || 'Unknown Customer'}
              </span>
            </div>
            {/* Hide phone number from technicians */}
            {device.phoneNumber && (currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
              <div className="flex items-center gap-2 text-xs text-gray-600 ml-11">
                <PhoneCall className="w-3 h-3 text-gray-500" />
                <span className="font-mono">{device.phoneNumber}</span>
              </div>
            )}
          </div>

          {/* Issue preview with enhanced styling */}
          {device.issueDescription && (
            <div className="mb-4 p-4 bg-gradient-to-r from-red-50/90 to-orange-50/90 border border-red-200/50 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center border border-red-200/50 flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                </div>
                <p className="text-xs text-red-800 line-clamp-2 leading-relaxed font-medium">
                  {device.issueDescription}
                </p>
              </div>
            </div>
          )}

          {/* Quick info and actions with enhanced layout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200/50">
                <Calendar className="w-3 h-3 text-gray-500" />
                <span className="font-medium">{new Date(device.createdAt).toLocaleDateString()}</span>
              </div>
              {device.depositAmount && (
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-1.5 rounded-lg border border-emerald-200/50">
                  <DollarSign className="w-3 h-3 text-emerald-600" />
                  <span className="font-semibold text-emerald-700">{formatCurrency(parseFloat(device.depositAmount))}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300 shadow-sm group-hover:shadow-md">
                <ChevronRight className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Compact Variant
  if (variant === 'compact') {
    return (
      <GlassCard 
        onClick={handleCardClick}
        className={`group transform transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg cursor-pointer relative overflow-hidden ${className}`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center border border-blue-200">
                {getDeviceIcon(device.model)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 truncate">
                  {getDisplayModel()}
                </h3>
                <p className="text-sm text-gray-500 font-mono">
                  {device.serialNumber || 'N/A'}
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(device.status)}`}>
              <div className="w-2 h-2 rounded-full bg-current" />
              <span className="capitalize">{device.status.replace('_', ' ')}</span>
            </span>
          </div>

          {/* Customer and issue */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700 truncate">
                {device.customerName || 'Unknown Customer'}
              </span>
            </div>
            
            {device.issueDescription && (
              <div className="text-sm text-gray-600 line-clamp-2">
                {device.issueDescription}
              </div>
            )}
          </div>

          {/* Quick actions */}
          {showActions && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{new Date(device.intakeDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/devices/${device.id}`);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="View Details"
                >
                  <Eye size={14} />
                </button>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/devices/${device.id}/edit`);
                    }}
                    className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                    title="Edit Device"
                  >
                    <Edit size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    );
  }

  // Default Detailed Variant
  return (
    <GlassCard 
      onClick={handleCardClick}
      className={`group transform transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl cursor-pointer relative overflow-hidden ${className}`}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Notification badge */}
      {device.remarks && device.remarks.length > 0 && !opened && (
        <div className="absolute top-3 left-3 z-20">
          <div className="relative">
            <span className="bg-red-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
              {device.remarks.length}
            </span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping" />
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-3 right-3 z-20">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 shadow-lg backdrop-blur-sm ${getStatusColor(device.status)}`}>
          <div className="w-2 h-2 rounded-full bg-current" />
          <span className="capitalize">{device.status.replace('_', ' ')}</span>
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 p-6">
        {/* Device header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center border-2 border-blue-200 shadow-sm">
              {getDeviceIcon(device.model)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 truncate mb-1">
              {getDisplayModel()}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-mono">S/N: {device.serialNumber || 'N/A'}</span>
              {device.priority && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(device.priority)}`}>
                  {device.priority}
                </span>
              )}
            </div>
          </div>
          {currentUser?.role === 'admin' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/devices/${device.id}/edit`);
              }}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Device"
            >
              <Edit size={16} />
            </button>
          )}
        </div>

        {/* Issue description */}
        {device.issueDescription && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800 line-clamp-2">
                {device.issueDescription}
              </p>
            </div>
          </div>
        )}

        {/* Customer information */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">
              {device.customerName || 'Unknown Customer'}
            </span>
          </div>
        </div>

        {/* Device details grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Created Date</p>
              <p className="font-medium">{new Date(device.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Expected Return</p>
              <p className="font-medium">{new Date(device.expectedReturnDate).toLocaleDateString()}</p>
            </div>
          </div>
          {/* Hide financial information from technicians */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
            <>
              {device.depositAmount && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Deposit</p>
                    <p className="font-medium text-green-600">{formatCurrency(parseFloat(device.depositAmount))}</p>
                  </div>
                </div>
              )}
              {device.repairCost && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Repair Cost</p>
                    <p className="font-medium">{formatCurrency(parseFloat(device.repairCost))}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/devices/${device.id}`);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Eye size={16} />
                View Details
              </button>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
        )}
      </div>
    </GlassCard>
  );
});

export default ModernDeviceCard;
