import React, { useState } from 'react';
import { BarChart3, Users, FileText, Settings, RefreshCw, Clock, Maximize2, Minimize2 } from 'lucide-react';

interface POSBottomBarProps {
  onViewAnalytics: () => void;
  onPaymentTracking: () => void;
  onSettings: () => void;
  onCustomers: () => void;
  onReports: () => void;
  onRefreshData?: () => void;
  className?: string;
}

const POSBottomBar: React.FC<POSBottomBarProps> = ({
  onViewAnalytics,
  onPaymentTracking,
  onSettings,
  onCustomers,
  onReports,
  onRefreshData,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.log('Error attempting to exit fullscreen:', err);
      });
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-neutral-200 shadow-medium ${className}`}>
      <div className="px-6 py-3">
        {/* Main Actions Row */}
        <div className="flex items-center justify-between">
          {/* Left Section - Customer Care Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onViewAnalytics}
              className="flex items-center gap-2 px-4 py-2 bg-lats-analytics-50 text-lats-analytics-700 rounded-lg hover:bg-lats-analytics-100 transition-all duration-200 border border-lats-analytics-200 shadow-soft hover:shadow-medium"
            >
              <BarChart3 size={16} />
              <span className="text-sm font-medium">Analytics</span>
            </button>

            <button
              onClick={onPaymentTracking}
              className="flex items-center gap-2 px-4 py-2 bg-lats-finance-50 text-lats-finance-700 rounded-lg hover:bg-lats-finance-100 transition-all duration-200 border border-lats-finance-200 shadow-soft hover:shadow-medium"
            >
              <FileText size={16} />
              <span className="text-sm font-medium">Payments</span>
            </button>

            <button
              onClick={onCustomers}
              className="flex items-center gap-2 px-4 py-2 bg-lats-customer-care-50 text-lats-customer-care-700 rounded-lg hover:bg-lats-customer-care-100 transition-all duration-200 border border-lats-customer-care-200 shadow-soft hover:shadow-medium"
            >
              <Users size={16} />
              <span className="text-sm font-medium">Customers</span>
            </button>
          </div>

          {/* Center Section - Reports & Status */}
          <div className="flex items-center gap-4">
            <button
              onClick={onReports}
              className="flex items-center gap-2 px-6 py-2 bg-lats-analytics-500 text-white rounded-lg hover:bg-lats-analytics-600 transition-all duration-200 font-semibold shadow-glow"
            >
              <BarChart3 size={18} />
              <span>Sales Reports</span>
            </button>

            {/* Status Indicators */}
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-lats-pos-500 rounded-full shadow-glow-green"></div>
                <span>POS Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-lats-customer-care-500 rounded-full shadow-glow"></div>
                <span>Online</span>
              </div>
            </div>
          </div>

          {/* Right Section - System Actions */}
          <div className="flex items-center gap-2">
            {onRefreshData && (
              <button
                onClick={onRefreshData}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw size={16} />
              </button>
            )}

            <button
              onClick={onSettings}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Expand/Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title={isExpanded ? "Collapse Menu" : "Expand Menu"}
            >
              <Clock size={16} />
            </button>
          </div>
        </div>

        {/* Expanded Menu */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={14} />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Customer Care Mode</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Session: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSBottomBar;