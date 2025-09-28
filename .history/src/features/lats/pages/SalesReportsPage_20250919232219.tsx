// SalesReportsPage component for LATS module
import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import PageHeader from '../components/ui/PageHeader';
import SaleDetailsModal from '../components/modals/SaleDetailsModal';
import { supabase } from '../../../../lib/supabaseClient';
import { Eye, Calendar, User, CreditCard, TrendingUp, DollarSign } from 'lucide-react';



const SalesReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedReport, setSelectedReport] = useState('daily');
  const [dateRange, setDateRange] = useState({ start: '2024-01-09', end: '2024-01-15' });

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    return {
      totalSales: 0,
      totalTransactions: 0,
      totalCustomers: 0,
      averageOrder: 0,
      totalProfit: 0,
      profitMargin: '0.0'
    };
  }, []);

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  // Generate simple chart
  const generateChart = (data: any[], key: string, valueKey: string, color = 'blue') => {
    const maxValue = Math.max(...data.map(item => item[valueKey]));
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-24 text-sm text-gray-600 truncate">
              {item[key]}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-${color}-500 h-3 rounded-full transition-all duration-300`}
                style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-20 text-sm font-medium text-gray-900 text-right">
              {formatMoney(item[valueKey])}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <PageHeader
        title="Sales Reports"
        subtitle="Detailed sales analysis and reporting"
        className="mb-6"
      />

      {/* Report Controls */}
      <GlassCard className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="daily">Daily Sales</option>
              <option value="products">Product Performance</option>
              <option value="customers">Customer Analysis</option>
              <option value="payments">Payment Methods</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="1d">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleString()}
          </div>
          <div className="flex space-x-2">
            <GlassButton
              variant="secondary"
              onClick={() => alert('Generate report functionality')}
            >
              Generate Report
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={() => alert('Export report functionality')}
            >
              Export Report
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatMoney(summaryMetrics.totalSales)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-green-600 text-xl">💰</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Period total</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalTransactions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Total orders</span>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalCustomers}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-purple-600 text-xl">👥</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Unique customers</span>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order</p>
              <p className="text-2xl font-bold text-gray-900">{formatMoney(summaryMetrics.averageOrder)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-orange-600 text-xl">📈</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Per transaction</span>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-2xl font-bold text-green-600">{summaryMetrics.profitMargin}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-green-600 text-xl">📊</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Total profit: {formatMoney(summaryMetrics.totalProfit)}</span>
          </div>
        </GlassCard>
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedReport === 'daily' && (
          <>
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Sales Trend</h3>
              <div className="text-center py-8 text-gray-500">
                <p>No sales data available for the selected period</p>
                <p className="text-sm mt-2">Generate a report to see daily sales trends</p>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Performance</h3>
              <div className="text-center py-8 text-gray-500">
                <p>No chart data available</p>
                <p className="text-sm mt-2">Generate a report to see sales performance charts</p>
              </div>
            </GlassCard>
          </>
        )}

        {selectedReport === 'products' && (
          <>
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Performance</h3>
              <div className="text-center py-8 text-gray-500">
                <p>No product performance data available</p>
                <p className="text-sm mt-2">Generate a report to see product performance metrics</p>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Product</h3>
              <div className="text-center py-8 text-gray-500">
                <p>No chart data available</p>
                <p className="text-sm mt-2">Generate a report to see revenue charts</p>
              </div>
            </GlassCard>
          </>
        )}

        {selectedReport === 'customers' && (
          <>
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Analysis</h3>
              <div className="text-center py-8 text-gray-500">
                <p>No customer analysis data available</p>
                <p className="text-sm mt-2">Generate a report to see customer spending patterns</p>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Spending</h3>
              <div className="text-center py-8 text-gray-500">
                <p>No chart data available</p>
                <p className="text-sm mt-2">Generate a report to see customer spending charts</p>
              </div>
            </GlassCard>
          </>
        )}
          
        {selectedReport === 'payments' && (
          <>
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
              <div className="text-center py-8 text-gray-500">
                <p>No payment method data available</p>
                <p className="text-sm mt-2">Generate a report to see payment method analysis</p>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Distribution</h3>
              <div className="text-center py-8 text-gray-500">
                <p>No chart data available</p>
                <p className="text-sm mt-2">Generate a report to see payment distribution charts</p>
              </div>
            </GlassCard>
          </>
        )}
        </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="text-blue-600 text-2xl mb-2">📊</div>
              <div className="font-medium text-gray-900">Export PDF</div>
              <div className="text-sm text-gray-600">Download as PDF</div>
            </button>
            <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <div className="text-green-600 text-2xl mb-2">📈</div>
              <div className="font-medium text-gray-900">Schedule Report</div>
              <div className="text-sm text-gray-600">Auto-generate reports</div>
            </button>
            <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="text-purple-600 text-2xl mb-2">📧</div>
              <div className="font-medium text-gray-900">Email Report</div>
              <div className="text-sm text-gray-600">Send via email</div>
            </button>
            <button className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
              <div className="text-orange-600 text-2xl mb-2">⚙️</div>
              <div className="font-medium text-gray-900">Report Settings</div>
              <div className="text-sm text-gray-600">Configure reports</div>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default SalesReportsPage;
