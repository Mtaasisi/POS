import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, Package, Clock, CheckCircle, AlertTriangle, 
  TrendingUp, ArrowRight, MapPin, Eye
} from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';

interface ShippingStatusWidgetProps {
  shipments?: any[];
  compact?: boolean;
}

const ShippingStatusWidget: React.FC<ShippingStatusWidgetProps> = ({
  shipments = [],
  compact = false
}) => {
  const navigate = useNavigate();

  // TODO: Replace with real database queries
  // This should fetch actual shipping data from your database
  const mockShipments = shipments.length > 0 ? shipments : [];

  const getStatusStats = () => {
    const stats = {
      total: mockShipments.length,
      pending: mockShipments.filter(s => s.status === 'pending').length,
      inTransit: mockShipments.filter(s => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length,
      delivered: mockShipments.filter(s => s.status === 'delivered').length,
      exceptions: mockShipments.filter(s => s.status === 'exception').length
    };
    return stats;
  };

  const stats = getStatusStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'picked_up': 
      case 'in_transit': 
      case 'out_for_delivery': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'exception': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'picked_up': 
      case 'in_transit': 
      case 'out_for_delivery': return <Truck size={14} />;
      case 'delivered': return <CheckCircle size={14} />;
      case 'exception': return <AlertTriangle size={14} />;
      default: return <Package size={14} />;
    }
  };

  if (compact) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Shipping</h3>
          </div>
          <button
            onClick={() => navigate('/lats/shipping')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <div className="flex items-center gap-1">
              <Eye size={14} />
              View All
            </div>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">{stats.inTransit}</p>
            <p className="text-xs text-gray-600">In Transit</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{stats.delivered}</p>
            <p className="text-xs text-gray-600">Delivered</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-600">{stats.exceptions}</p>
            <p className="text-xs text-gray-600">Issues</p>
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="space-y-2">
          {mockShipments.slice(0, 3).map(shipment => (
            <div key={shipment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(shipment.status)}
                    <span className="capitalize">{shipment.status.replace('_', ' ')}</span>
                  </div>
                </span>
                <span className="text-sm font-mono text-gray-700">{shipment.trackingNumber}</span>
              </div>
              <span className="text-xs text-gray-500">{shipment.carrier?.name}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
            <Truck size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Shipping Overview</h3>
            <p className="text-gray-600">Monitor your shipment status</p>
          </div>
        </div>
        <GlassButton
          onClick={() => navigate('/lats/shipping')}
          className="flex items-center gap-2"
        >
          <MapPin size={16} />
          Manage Shipping
        </GlassButton>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Package size={16} className="text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-600">Total Shipments</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Truck size={16} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.inTransit}</p>
          <p className="text-sm text-gray-600">In Transit</p>
        </div>

        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle size={16} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
          <p className="text-sm text-gray-600">Delivered</p>
        </div>

        <div className="bg-red-50 rounded-xl p-4 text-center">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.exceptions}</p>
          <p className="text-sm text-gray-600">Exceptions</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Recent Shipments</h4>
        <div className="space-y-3">
          {mockShipments.slice(0, 5).map(shipment => (
            <div key={shipment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(shipment.status)}
                    <span className="capitalize">{shipment.status.replace('_', ' ')}</span>
                  </div>
                </span>
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900">{shipment.trackingNumber}</p>
                  <p className="text-xs text-gray-500">{shipment.carrier?.name}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/lats/shipping')}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>

        {mockShipments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Truck size={32} className="mx-auto mb-3 text-gray-300" />
            <p>No active shipments</p>
            <p className="text-sm">Shipments will appear here when orders are sent</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default ShippingStatusWidget;
