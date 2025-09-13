import React from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassBadge from '../../shared/components/ui/GlassBadge';
import GlassButton from '../../shared/components/ui/GlassButton';
import { StoreLocation } from '../types/storeLocation';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  Building, 
  Star,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal
} from 'lucide-react';

interface StoreLocationCardProps {
  location: StoreLocation;
  onEdit: (location: StoreLocation) => void;
  onDelete: (location: StoreLocation) => void;
  onView: (location: StoreLocation) => void;
  onToggleActive: (location: StoreLocation) => void;
  onSetMainBranch: (location: StoreLocation) => void;
}

export const StoreLocationCard: React.FC<StoreLocationCardProps> = ({
  location,
  onEdit,
  onDelete,
  onView,
  onToggleActive,
  onSetMainBranch
}) => {
  const formatTime = (time: string) => {
    return time.replace(':', 'h');
  };

  const getTodayHours = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hours = location.opening_hours[today as keyof typeof location.opening_hours];
    if (location.is_24_hours) {
      return '24 Hours';
    }
    if (hours) {
      return `${formatTime(hours.open)} - ${formatTime(hours.close)}`;
    }
    return 'Closed';
  };

  const getFeatures = () => {
    const features = [];
    if (location.has_repair_service) features.push('Repair');
    if (location.has_sales_service) features.push('Sales');
    if (location.has_delivery_service) features.push('Delivery');
    if (location.has_parking) features.push('Parking');
    if (location.has_wifi) features.push('WiFi');
    return features;
  };

  return (
    <GlassCard className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{location.name}</h3>
            {location.is_main_branch && (
              <GlassBadge variant="default" className="bg-yellow-500 text-white">
                <Star className="w-3 h-3 mr-1" />
                Main Branch
              </GlassBadge>
            )}
            {!location.is_active && (
              <GlassBadge variant="secondary" className="bg-gray-500 text-white">
                Inactive
              </GlassBadge>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
            <MapPin className="w-4 h-4" />
            <span>{location.address}, {location.city}</span>
          </div>
          
          <div className="text-sm text-gray-500 mb-3">
            Code: {location.code} • Priority: {location.priority_order}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <GlassButton
            size="sm"
            variant="ghost"
            onClick={() => onView(location)}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </GlassButton>
          <GlassButton
            size="sm"
            variant="ghost"
            onClick={() => onEdit(location)}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </GlassButton>
          <GlassButton
            size="sm"
            variant="ghost"
            onClick={() => onDelete(location)}
            title="Delete"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Contact Information */}
        <div className="space-y-2">
          {location.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>{location.phone}</span>
            </div>
          )}
          
          {location.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>{location.email}</span>
            </div>
          )}
          
          {location.whatsapp && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600 font-semibold">WhatsApp:</span>
              <span>{location.whatsapp}</span>
            </div>
          )}
        </div>

        {/* Business Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>Today: {getTodayHours()}</span>
          </div>
          
          {location.manager_name && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-gray-500" />
              <span>Manager: {location.manager_name}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Building className="w-4 h-4 text-gray-500" />
            <span>Staff: {location.current_staff_count}</span>
          </div>
        </div>
      </div>

      {/* Features */}
      {getFeatures().length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {getFeatures().map((feature) => (
              <GlassBadge key={feature} variant="outline" className="text-xs">
                {feature}
              </GlassBadge>
            ))}
          </div>
        </div>
      )}

      {/* Financial Information */}
      {(location.monthly_rent || location.monthly_target) && (
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          {location.monthly_rent && (
            <div>
              <span className="text-gray-500">Monthly Rent:</span>
              <div className="font-medium">
                {location.monthly_rent.toLocaleString()} TZS
              </div>
            </div>
          )}
          {location.monthly_target && (
            <div>
              <span className="text-gray-500">Monthly Target:</span>
              <div className="font-medium">
                {location.monthly_target.toLocaleString()} TZS
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex gap-2">
          <GlassButton
            size="sm"
            variant="outline"
            onClick={() => onToggleActive(location)}
          >
            {location.is_active ? 'Deactivate' : 'Activate'}
          </GlassButton>
          
          {!location.is_main_branch && (
            <GlassButton
              size="sm"
              variant="outline"
              onClick={() => onSetMainBranch(location)}
            >
              Set as Main
            </GlassButton>
          )}
        </div>

        <div className="text-xs text-gray-500">
          Created: {new Date(location.created_at).toLocaleDateString()}
        </div>
      </div>
    </GlassCard>
  );
};
