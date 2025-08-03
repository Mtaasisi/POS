import React from 'react';
import { Customer, CustomerType } from '../../types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import {
  Users,
  User,
  Plus,
  Crown,
  ShoppingBag,
  Phone,
  MapPin,
  Edit,
  CheckCircle
} from 'lucide-react';

interface CustomerSummaryCardProps {
  selectedCustomer: Customer | null;
  customerType: CustomerType;
  onOpenCustomerModal: () => void;
  onAddCustomer: () => void;
}

const CustomerSummaryCard: React.FC<CustomerSummaryCardProps> = ({
  selectedCustomer,
  customerType,
  onOpenCustomerModal,
  onAddCustomer
}) => {
  const getCustomerTypeIcon = (type: CustomerType) => {
    return type === 'wholesale' ? <Crown className="w-4 h-4 text-yellow-600" /> : <ShoppingBag className="w-4 h-4 text-blue-600" />;
  };

  const getCustomerTypeColor = (type: CustomerType) => {
    return type === 'wholesale' ? 'text-yellow-600 bg-yellow-100' : 'text-blue-600 bg-blue-100';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Customer</h3>
            <p className="text-sm text-gray-600">Select customer & type</p>
          </div>
        </div>
        
        <GlassButton
          onClick={onOpenCustomerModal}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
        >
          <Edit className="w-4 h-4 mr-2" />
          Select
        </GlassButton>
      </div>

      {selectedCustomer ? (
        <div className="space-y-3">
          {/* Customer Info */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-gray-900">{selectedCustomer.name}</span>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCustomerTypeColor(customerType)}`}>
                {customerType}
              </span>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              {selectedCustomer.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{selectedCustomer.phone}</span>
                </div>
              )}
              {selectedCustomer.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedCustomer.city}</span>
                </div>
              )}
              {selectedCustomer.totalSpent && selectedCustomer.totalSpent > 0 && (
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <span>Total Spent: {formatCurrency(selectedCustomer.totalSpent)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Type Toggle */}
          <div className="flex gap-2">
            <GlassButton
              variant={customerType === 'retail' ? 'default' : 'outline'}
              onClick={() => {}} // This will be handled in the modal
              className="flex-1 text-xs py-2"
            >
              <ShoppingBag className="w-3 h-3 mr-1" />
              Retail
            </GlassButton>
            <GlassButton
              variant={customerType === 'wholesale' ? 'default' : 'outline'}
              onClick={() => {}} // This will be handled in the modal
              className="flex-1 text-xs py-2"
            >
              <Crown className="w-3 h-3 mr-1" />
              Wholesale
            </GlassButton>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
            <User className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-3">No customer selected</p>
          <div className="flex gap-2">
            <GlassButton
              onClick={onOpenCustomerModal}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm py-2"
            >
              <Users className="w-3 h-3 mr-1" />
              Select Customer
            </GlassButton>
            <GlassButton
              onClick={onAddCustomer}
              variant="outline"
              className="flex-1 border-2 border-green-200 hover:border-green-300 text-green-600 text-sm py-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add New
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default CustomerSummaryCard; 