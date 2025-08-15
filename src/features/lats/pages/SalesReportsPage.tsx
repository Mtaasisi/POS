// SalesReportsPage component for LATS module
import React, { useState, useMemo } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import PageHeader from '../components/ui/PageHeader';

// Demo sales reports data
const DEMO_SALES_REPORTS = {
  dailyReports: [
    { date: '2024-01-15', sales: 125000, transactions: 8, customers: 6, avgOrder: 15625 },
    { date: '2024-01-14', sales: 98000, transactions: 6, customers: 5, avgOrder: 16333 },
    { date: '2024-01-13', sales: 145000, transactions: 9, customers: 7, avgOrder: 16111 },
    { date: '2024-01-12', sales: 89000, transactions: 5, customers: 4, avgOrder: 17800 },
    { date: '2024-01-11', sales: 167000, transactions: 10, customers: 8, avgOrder: 16700 },
    { date: '2024-01-10', sales: 112000, transactions: 7, customers: 6, avgOrder: 16000 },
    { date: '2024-01-09', sales: 134000, transactions: 8, customers: 7, avgOrder: 16750 },
  ],
  productReports: [
    { product: 'iPhone 14 Pro', units: 3, revenue: 479997, cost: 360000, profit: 119997 },
    { product: 'MacBook Pro 14"', units: 2, revenue: 599998, cost: 500000, profit: 99998 },
    { product: 'Samsung Galaxy S23', units: 4, revenue: 519996, cost: 380000, profit: 139996 },
    { product: 'AirPods Pro', units: 8, revenue: 367992, cost: 280000, profit: 87992 },
    { product: 'Dell XPS 13', units: 2, revenue: 379998, cost: 280000, profit: 99998 },
    { product: 'Samsung Galaxy Watch', units: 5, revenue: 179995, cost: 140000, profit: 39995 },
  ],
  customerReports: [
    { customer: 'Mike Johnson', orders: 3, totalSpent: 245000, avgOrder: 81667, lastOrder: '2024-01-15' },
    { customer: 'David Brown', orders: 2, totalSpent: 189999, avgOrder: 94999, lastOrder: '2024-01-14' },
    { customer: 'John Doe', orders: 4, totalSpent: 167000, avgOrder: 41750, lastOrder: '2024-01-13' },
    { customer: 'Jane Smith', orders: 2, totalSpent: 145000, avgOrder: 72500, lastOrder: '2024-01-12' },
    { customer: 'Sarah Wilson', orders: 1, totalSpent: 89999, avgOrder: 89999, lastOrder: '2024-01-11' },
  ],
  paymentReports: [
    { method: 'M-Pesa', transactions: 15, amount: 350000, percentage: 45 },
    { method: 'Cash', transactions: 8, amount: 200000, percentage: 25 },
    { method: 'Card', transactions: 7, amount: 180000, percentage: 23 },
    { method: 'Bank Transfer', transactions: 2, amount: 50000, percentage: 7 },
  ]
};

const SalesReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedReport, setSelectedReport] = useState('daily');
  const [dateRange, setDateRange] = useState({ start: '2024-01-09', end: '2024-01-15' });

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalSales = DEMO_SALES_REPORTS.dailyReports.reduce((sum, day) => sum + day.sales, 0);
    const totalTransactions = DEMO_SALES_REPORTS.dailyReports.reduce((sum, day) => sum + day.transactions, 0);
    const totalCustomers = DEMO_SALES_REPORTS.dailyReports.reduce((sum, day) => sum + day.customers, 0);
    const averageOrder = totalSales / totalTransactions;
    const totalProfit = DEMO_SALES_REPORTS.productReports.reduce((sum, product) => sum + product.profit, 0);

    return {
      totalSales,
      totalTransactions,
      totalCustomers,
      averageOrder,
      totalProfit,
      profitMargin: (totalProfit / totalSales * 100).toFixed(1)
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
          <div className="space-y-3">
                {DEMO_SALES_REPORTS.dailyReports.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                      <div className="font-medium text-gray-900">{new Date(day.date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-600">{day.transactions} transactions, {day.customers} customers</div>
                </div>
                <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatMoney(day.sales)}</div>
                      <div className="text-sm text-gray-600">Avg: {formatMoney(day.avgOrder)}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Performance</h3>
              {generateChart(DEMO_SALES_REPORTS.dailyReports, 'date', 'sales', 'blue')}
            </GlassCard>
          </>
        )}

        {selectedReport === 'products' && (
          <>
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Product</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Units</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Revenue</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_SALES_REPORTS.productReports.map((product, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-2 text-sm text-gray-900">{product.product}</td>
                        <td className="py-2 px-2 text-sm text-gray-600">{product.units}</td>
                        <td className="py-2 px-2 text-sm font-medium text-gray-900">{formatMoney(product.revenue)}</td>
                        <td className="py-2 px-2 text-sm text-green-600 font-medium">{formatMoney(product.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Product</h3>
              {generateChart(DEMO_SALES_REPORTS.productReports, 'product', 'revenue', 'green')}
            </GlassCard>
          </>
        )}

        {selectedReport === 'customers' && (
          <>
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Analysis</h3>
          <div className="space-y-3">
                {DEMO_SALES_REPORTS.customerReports.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{customer.customer}</div>
                      <div className="text-sm text-gray-600">{customer.orders} orders, Last: {customer.lastOrder}</div>
                </div>
                <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatMoney(customer.totalSpent)}</div>
                      <div className="text-sm text-gray-600">Avg: {formatMoney(customer.avgOrder)}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Spending</h3>
              {generateChart(DEMO_SALES_REPORTS.customerReports, 'customer', 'totalSpent', 'purple')}
            </GlassCard>
            </>
          )}
          
        {selectedReport === 'payments' && (
          <>
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
        <div className="space-y-4">
                {DEMO_SALES_REPORTS.paymentReports.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">
                          {payment.method === 'M-Pesa' ? '📱' : payment.method === 'Cash' ? '💵' : payment.method === 'Card' ? '💳' : '🏦'}
                        </span>
            </div>
                    <div>
                        <div className="font-medium text-gray-900">{payment.method}</div>
                        <div className="text-sm text-gray-600">{payment.transactions} transactions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatMoney(payment.amount)}</div>
                      <div className="text-sm text-gray-600">{payment.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Distribution</h3>
              {generateChart(DEMO_SALES_REPORTS.paymentReports, 'method', 'amount', 'orange')}
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
