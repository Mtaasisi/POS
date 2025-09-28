import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Target, 
  MessageSquare, 
  DollarSign, 
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Gift
} from 'lucide-react';

interface CustomerPromotionData {
  summary: {
    totalCustomers: number;
    totalMessages: number;
    analysisDate: string;
  };
  promotionTargets: {
    highValueCustomers: {
      count: number;
      reason: string;
      strategy: string;
      customers: Array<{
        id: string;
        phone: string;
        name: string;
        totalSpent: number;
        messageCount: number;
        loyaltyScore: number;
      }>;
    };
    frequentBuyers: {
      count: number;
      reason: string;
      strategy: string;
      customers: Array<any>;
    };
    inactiveCustomers: {
      count: number;
      reason: string;
      strategy: string;
      customers: Array<any>;
    };
    newCustomers: {
      count: number;
      reason: string;
      strategy: string;
      customers: Array<any>;
    };
    complaintCustomers: {
      count: number;
      reason: string;
      strategy: string;
      customers: Array<any>;
    };
    loyalCustomers: {
      count: number;
      reason: string;
      strategy: string;
      customers: Array<any>;
    };
  };
}

const CustomerPromotionDashboard: React.FC = () => {
  const [promotionData, setPromotionData] = useState<CustomerPromotionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('highValueCustomers');

  useEffect(() => {
    loadPromotionData();
  }, []);

  const loadPromotionData = async () => {
    try {
      // In a real implementation, this would fetch from your API
      // For now, we'll use the generated JSON file
      const response = await fetch('/customer-analysis-2025-09-24.json');
      const data = await response.json();
      setPromotionData(data);
    } catch (error) {
      console.error('Error loading promotion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'highValueCustomers':
        return <DollarSign className="w-5 h-5" />;
      case 'frequentBuyers':
        return <TrendingUp className="w-5 h-5" />;
      case 'inactiveCustomers':
        return <Clock className="w-5 h-5" />;
      case 'newCustomers':
        return <Users className="w-5 h-5" />;
      case 'complaintCustomers':
        return <AlertCircle className="w-5 h-5" />;
      case 'loyalCustomers':
        return <Star className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'highValueCustomers':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'frequentBuyers':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactiveCustomers':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'newCustomers':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'complaintCustomers':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'loyalCustomers':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (count: number) => {
    if (count > 1000) return 'text-red-600';
    if (count > 100) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!promotionData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No promotion data available</p>
      </div>
    );
  }

  const categories = Object.entries(promotionData.promotionTargets);
  const selectedCategoryData = promotionData.promotionTargets[selectedCategory as keyof typeof promotionData.promotionTargets];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 Customer Promotion Dashboard
          </h1>
          <p className="text-gray-600">
            Target the right customers with the right promotions at the right time
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {promotionData.summary.totalCustomers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">
                  {promotionData.summary.totalMessages.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {promotionData.promotionTargets.highValueCustomers.count}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Loyal Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {promotionData.promotionTargets.loyalCustomers.count}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {categories.map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    selectedCategory === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {getCategoryIcon(key)}
                  <span>{data.reason.split(' - ')[0]}</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${getCategoryColor(key)}`}>
                    {data.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Category Content */}
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedCategoryData.reason}
              </h3>
              <p className="text-gray-600 mb-4">
                {selectedCategoryData.strategy}
              </p>
              <div className="flex items-center space-x-4">
                <span className={`text-2xl font-bold ${getPriorityColor(selectedCategoryData.count)}`}>
                  {selectedCategoryData.count} customers
                </span>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Gift className="w-4 h-4" />
                  <span>Send Promotion</span>
                </button>
              </div>
            </div>

            {/* Customer List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedCategoryData.customers.slice(0, 9).map((customer, index) => (
                <div key={customer.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {customer.name || 'Unknown Customer'}
                    </h4>
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{customer.phone}</p>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Spent</p>
                      <p className="text-sm font-semibold text-green-600">
                        TZS {customer.totalSpent?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Messages</p>
                      <p className="text-sm font-semibold text-blue-600">
                        {customer.messageCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Loyalty</p>
                      <p className="text-sm font-semibold text-purple-600">
                        {customer.loyaltyScore || 0}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex space-x-2">
                    <button className="flex-1 bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-200">
                      View Details
                    </button>
                    <button className="flex-1 bg-green-100 text-green-700 px-3 py-1 rounded text-xs hover:bg-green-200">
                      Send SMS
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedCategoryData.customers.length > 9 && (
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  View All {selectedCategoryData.count} Customers →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Bulk SMS Campaign</p>
                <p className="text-sm text-gray-600">Send promotions to selected groups</p>
              </div>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <div className="text-center">
                <Gift className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Create Promotion</p>
                <p className="text-sm text-gray-600">Design targeted offers</p>
              </div>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-600">Track promotion performance</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPromotionDashboard;
