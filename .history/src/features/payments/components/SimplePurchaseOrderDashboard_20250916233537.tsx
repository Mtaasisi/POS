import React from 'react';
import { ShoppingCart } from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';

interface SimplePurchaseOrderDashboardProps {
  onViewDetails: (payment: any) => void;
  onMakePayment: (purchaseOrder: any) => void;
  onExport: () => void;
}

const SimplePurchaseOrderDashboard: React.FC<SimplePurchaseOrderDashboardProps> = ({
  onViewDetails,
  onMakePayment,
  onExport
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart size={24} className="text-blue-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Purchase Order Payments</h2>
          <p className="text-sm text-gray-600">Manage supplier payments and purchase orders</p>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="text-center py-12">
          <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Purchase Order Payments</h3>
          <p className="text-gray-600 mb-4">
            This feature is being updated to work with the new account-based payment system.
          </p>
          <div className="text-sm text-gray-500">
            <p>• View purchase orders and their payment status</p>
            <p>• Make payments to suppliers from your accounts</p>
            <p>• Track payment history and balances</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SimplePurchaseOrderDashboard;
