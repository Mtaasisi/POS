import React from 'react';
import { BarChart3, Zap, Settings, Users, Package, TrendingUp, FileText, Crown } from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';

interface POSBottomBarProps {
  onViewAnalytics: () => void;
  onQuickActions: () => void;
  onPaymentTracking: () => void;
  onSettings: () => void;
  onCustomers: () => void;
  onInventory: () => void;
  onReports: () => void;
  onLoyalty: () => void;
  className?: string;
}

const POSBottomBar: React.FC<POSBottomBarProps> = ({
  onViewAnalytics,
  onQuickActions,
  onPaymentTracking,
  onSettings,
  onCustomers,
  onInventory,
  onReports,
  onLoyalty,
  className = ''
}) => {
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-lg z-40 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Main actions */}
          <div className="flex items-center gap-3">
            <GlassButton
              onClick={onViewAnalytics}
              icon={<BarChart3 size={20} />}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 px-4 py-2 rounded-lg font-medium"
            >
              View Analytics
            </GlassButton>
            
            <GlassButton
              onClick={onQuickActions}
              icon={<Zap size={20} />}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 px-4 py-2 rounded-lg font-medium"
            >
              Quick Actions
            </GlassButton>

            <GlassButton
              onClick={onPaymentTracking}
              icon={<TrendingUp size={20} />}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 px-4 py-2 rounded-lg font-medium"
            >
              Payment Tracking
            </GlassButton>
          </div>

          {/* Center - Status indicators */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>POS Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Online</span>
            </div>
          </div>

          {/* Right side - Secondary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onCustomers}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Customer Management"
            >
              <Users size={18} />
            </button>
            
            <button
              onClick={onInventory}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
              title="Inventory Management"
            >
              <Package size={18} />
            </button>
            
            <button
              onClick={onReports}
              className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
              title="Sales Reports"
            >
              <FileText size={18} />
            </button>
            
            <button
              onClick={onLoyalty}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
              title="Loyalty Program"
            >
              <Crown size={18} />
            </button>
            
            <button
              onClick={onSettings}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              title="POS Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSBottomBar;
