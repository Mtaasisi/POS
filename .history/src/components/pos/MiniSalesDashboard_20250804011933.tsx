import React from 'react';
import GlassCard from '../ui/GlassCard';
import { TrendingUp, AlertTriangle, Package, DollarSign, Clock, Users } from 'lucide-react';

interface MiniSalesDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const MiniSalesDashboard: React.FC<MiniSalesDashboardProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Mock data - replace with real data from your API
  const todaySales = 125000;
  const itemsSold = 23;
  const popularItems = [
    { name: 'iPhone 13 Pro', sales: 5, revenue: 2250000 },
    { name: 'AirPods Pro', sales: 8, revenue: 960000 },
    { name: 'MacBook Air M1', sales: 2, revenue: 1700000 },
  ];
  const lowStockAlerts = [
    { name: 'iPhone 13 Pro', stock: 2 },
    { name: 'Samsung Galaxy S21', stock: 1 },
  ];
  const recentTransactions = [
    { id: 'TXN001', customer: 'John Doe', amount: 450000, time: '2:30 PM' },
    { id: 'TXN002', customer: 'Jane Smith', amount: 120000, time: '2:15 PM' },
    { id: 'TXN003', customer: 'Mike Johnson', amount: 850000, time: '2:00 PM' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="max-w-4xl w-full mx-4">
        <GlassCard className="bg-white/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Sales Dashboard</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Today's Summary */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={20} />
                    <span className="text-sm font-medium">Total Sales</span>
                  </div>
                  <p className="text-2xl font-bold">Tsh{todaySales.toLocaleString()}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Package size={20} />
                    <span className="text-sm font-medium">Items Sold</span>
                  </div>
                  <p className="text-2xl font-bold">{itemsSold}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={20} />
                    <span className="text-sm font-medium">Customers</span>
                  </div>
                  <p className="text-2xl font-bold">12</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={20} />
                    <span className="text-sm font-medium">Avg. Sale</span>
                  </div>
                  <p className="text-2xl font-bold">Tsh{(todaySales / itemsSold).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" />
                Low Stock Alerts
              </h3>
              <div className="space-y-3">
                {lowStockAlerts.map((item, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-red-800">{item.name}</span>
                      <span className="text-sm text-red-600">{item.stock} left</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Items */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Items Today</h3>
              <div className="space-y-3">
                {popularItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.sales} sold</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₦{item.revenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Revenue</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {recentTransactions.map((txn, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{txn.customer}</span>
                      <span className="text-xs text-gray-500">{txn.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{txn.id}</span>
                      <span className="font-semibold text-gray-900">₦{txn.amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default MiniSalesDashboard; 