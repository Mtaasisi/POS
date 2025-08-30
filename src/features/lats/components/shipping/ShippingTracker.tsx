import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, CheckCircle, Clock, AlertTriangle, MapPin, 
  User, Building, Phone, Mail, ExternalLink, RefreshCw, Eye
} from 'lucide-react';
import { ShippingInfo, ShippingEvent } from '../../types/inventory';
import GlassCard from '../../../shared/components/ui/GlassCard';
import { toast } from 'react-hot-toast';

interface ShippingTrackerProps {
  shippingInfo: ShippingInfo;
  onRefresh?: () => void;
  compact?: boolean;
}

const ShippingTracker: React.FC<ShippingTrackerProps> = ({
  shippingInfo,
  onRefresh,
  compact = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(!compact);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast.success('Tracking updated');
    } catch (error) {
      toast.error('Failed to update tracking');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'picked_up': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_transit': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'exception': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'picked_up': return <Package size={16} />;
      case 'in_transit': return <Truck size={16} />;
      case 'out_for_delivery': return <MapPin size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      case 'exception': return <AlertTriangle size={16} />;
      default: return <Package size={16} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending': return 10;
      case 'picked_up': return 25;
      case 'in_transit': return 60;
      case 'out_for_delivery': return 85;
      case 'delivered': return 100;
      case 'exception': return 50;
      default: return 0;
    }
  };

  const trackingUrl = shippingInfo.carrier?.trackingUrl.replace('{tracking_number}', shippingInfo.trackingNumber);

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(shippingInfo.status)}`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(shippingInfo.status)}
                <span className="capitalize">{shippingInfo.status.replace('_', ' ')}</span>
              </div>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <div className="flex items-center gap-1">
                <Eye size={14} />
                Details
              </div>
            </button>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{shippingInfo.carrier?.name}</span>
            <span>{getProgressPercentage(shippingInfo.status)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage(shippingInfo.status)}%` }}
            />
          </div>
        </div>

        {/* Tracking Number */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tracking: {shippingInfo.trackingNumber}</span>
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <ExternalLink size={12} />
            Track
          </a>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-gray-400" />
              <span className="text-gray-600">Agent:</span>
              <span className="font-medium">{shippingInfo.agent?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building size={14} className="text-gray-400" />
              <span className="text-gray-600">Manager:</span>
              <span className="font-medium">{shippingInfo.manager?.name}</span>
            </div>
            {shippingInfo.estimatedDelivery && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-gray-400" />
                <span className="text-gray-600">ETA:</span>
                <span className="font-medium">{formatDate(shippingInfo.estimatedDelivery)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <GlassCard className="w-full max-w-4xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Shipping Tracker</h3>
              <p className="text-gray-600">Track your purchase order delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Track Online
            </a>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Carrier</p>
                <p className="font-semibold text-gray-900">{shippingInfo.carrier?.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Agent</p>
                <p className="font-semibold text-gray-900">{shippingInfo.agent?.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Building size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Manager</p>
                <p className="font-semibold text-gray-900">{shippingInfo.manager?.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                shippingInfo.status === 'delivered' ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                {getStatusIcon(shippingInfo.status)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {shippingInfo.status.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Delivery Progress</h4>
          
          {/* Progress Bar */}
          <div className="relative mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Order Placed</span>
              <span>In Transit</span>
              <span>Delivered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-1000 relative"
                style={{ width: `${getProgressPercentage(shippingInfo.status)}%` }}
              >
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-current rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Status Steps */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'].map((status, index) => {
              const isComplete = getProgressPercentage(shippingInfo.status) > getProgressPercentage(status);
              const isCurrent = shippingInfo.status === status;
              
              return (
                <div
                  key={status}
                  className={`p-3 rounded-lg text-center border-2 transition-all ${
                    isComplete || isCurrent
                      ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    {getStatusIcon(status)}
                  </div>
                  <p className="text-xs font-medium capitalize">
                    {status.replace('_', ' ')}
                  </p>
                  {isCurrent && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tracking Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shipping Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Shipping Information</h4>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tracking Number:</span>
                <span className="font-mono font-medium text-gray-900">{shippingInfo.trackingNumber}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated Delivery:</span>
                <span className="font-medium text-gray-900">
                  {shippingInfo.estimatedDelivery ? formatDate(shippingInfo.estimatedDelivery) : 'TBD'}
                </span>
              </div>
              
              {shippingInfo.actualDelivery && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Actual Delivery:</span>
                  <span className="font-medium text-green-600">
                    {formatDate(shippingInfo.actualDelivery)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Shipping Cost:</span>
                <span className="font-medium text-gray-900">
                  TZS {shippingInfo.cost.toLocaleString()}
                </span>
              </div>

              {shippingInfo.requireSignature && (
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-sm text-gray-600">Signature Required</span>
                </div>
              )}

              {shippingInfo.enableInsurance && (
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-blue-500" />
                  <span className="text-sm text-gray-600">Insured Package</span>
                </div>
              )}
            </div>
          </div>

          {/* Team Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Shipping Team</h4>
            
            {/* Agent Info */}
            {shippingInfo.agent && (
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{shippingInfo.agent.name}</p>
                    <p className="text-sm text-gray-600">Shipping Agent</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-gray-400" />
                    <span className="text-gray-600">{shippingInfo.agent.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-gray-600">{shippingInfo.agent.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-gray-600">{shippingInfo.agent.email}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Manager Info */}
            {shippingInfo.manager && (
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Building size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{shippingInfo.manager.name}</p>
                    <p className="text-sm text-gray-600">Shipping Manager</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-gray-400" />
                    <span className="text-gray-600">{shippingInfo.manager.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-gray-600">{shippingInfo.manager.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-gray-600">{shippingInfo.manager.email}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tracking Events */}
        {shippingInfo.trackingEvents && shippingInfo.trackingEvents.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Tracking History</h4>
            
            <div className="space-y-4">
              {shippingInfo.trackingEvents
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((event, index) => (
                <div
                  key={event.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 ${
                    index === 0 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {getStatusIcon(event.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 capitalize">
                        {event.status.replace('_', ' ')}
                      </p>
                      <span className="text-sm text-gray-500">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-1">{event.description}</p>
                    {event.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={12} />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">{event.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {shippingInfo.notes && (
          <div className="mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <h5 className="font-medium text-gray-900 mb-2">Shipping Notes</h5>
            <p className="text-gray-700 text-sm">{shippingInfo.notes}</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default ShippingTracker;