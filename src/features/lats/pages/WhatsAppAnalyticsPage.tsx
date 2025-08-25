import React from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import { 
  TrendingUp,
  Send,
  Target,
  CheckCircle,
  Users,
  Activity,
  BarChart3,
  ChevronRight,
  Calendar,
  Clock,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

interface WhatsAppAnalyticsPageProps {
  campaigns: any[];
  messages: any[];
  metrics: any;
  campaignMetrics: any;
  onNavigateToGreenApi: (section: string) => void;
  isDark: boolean;
}

const WhatsAppAnalyticsPage: React.FC<WhatsAppAnalyticsPageProps> = ({
  campaigns,
  messages,
  metrics,
  campaignMetrics,
  onNavigateToGreenApi,
  isDark
}) => {
  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <GlassCard className="p-8 bg-gradient-to-br from-green-500 to-green-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-green-100 text-sm font-medium">Delivery Rate</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{metrics?.deliveryRate || 0}%</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp size={28} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-blue-100 text-sm font-medium">Messages Sent</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{metrics?.totalMessages || messages.length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Send size={28} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Campaigns</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{campaigns.filter(c => c.status === 'sending').length}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target size={28} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-orange-100 text-sm font-medium">Success Rate</p>
              <p className="text-2xl xl:text-3xl font-bold mt-1">{metrics?.successRate || 0}%</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle size={28} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Campaign Performance Metrics */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Campaign Performance</h2>
          <button
            onClick={() => onNavigateToGreenApi('campaigns')}
            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
          >
            View All Campaigns
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Campaigns</p>
                <p className="text-2xl font-bold text-blue-900">{campaignMetrics?.totalCampaigns || campaigns.length}</p>
              </div>
              <Target size={20} className="text-blue-600" />
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Active Campaigns</p>
                <p className="text-2xl font-bold text-green-900">{campaignMetrics?.activeCampaigns || campaigns.filter(c => c.status === 'sending').length}</p>
              </div>
              <Activity size={20} className="text-green-600" />
            </div>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Recipients</p>
                <p className="text-2xl font-bold text-purple-900">{campaignMetrics?.totalRecipients || 0}</p>
              </div>
              <Users size={20} className="text-purple-600" />
            </div>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-orange-900">{campaignMetrics?.campaignSuccessRate || 0}%</p>
              </div>
              <CheckCircle size={20} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Delivery Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sent:</span>
                <span className="font-medium">{campaignMetrics?.totalSent || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivered:</span>
                <span className="font-medium">{campaignMetrics?.totalDelivered || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Failed:</span>
                <span className="font-medium">{campaignMetrics?.failedCampaigns || 0}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Performance Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg. Delivery Time:</span>
                <span className="font-medium">2.3s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bounce Rate:</span>
                <span className="font-medium">1.2%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Engagement Rate:</span>
                <span className="font-medium">78.5%</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Recent Activity */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download size={16} />
            </button>
            <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {campaigns.slice(0, 5).map((campaign, index) => (
            <div key={campaign.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    campaign.status === 'completed' ? 'bg-green-500' :
                    campaign.status === 'sending' ? 'bg-blue-500' :
                    campaign.status === 'failed' ? 'bg-red-500' :
                    campaign.status === 'paused' ? 'bg-orange-500' :
                    'bg-gray-400'
                  }`} />
                  <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                    campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                    campaign.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Recipients</p>
                  <p className="font-medium">{campaign.total_recipients || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Sent</p>
                  <p className="font-medium text-green-600">{campaign.sent_count || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Delivered</p>
                  <p className="font-medium text-blue-600">{campaign.delivered_count || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Failed</p>
                  <p className="font-medium text-red-600">{campaign.failed_count || 0}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created: {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'Unknown'}
                </p>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600" title="View Details">
                    <Eye size={14} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600" title="View Analytics">
                    <BarChart3 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Performance Charts */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Performance Charts</h2>
          <div className="flex items-center gap-3">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none">
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Message Volume Chart */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700 mb-4">Message Volume</h3>
            <div className="h-32 bg-white rounded-lg border border-blue-200 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 size={32} className="text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-blue-600">Chart placeholder</p>
                <p className="text-xs text-blue-500">Message volume over time</p>
              </div>
            </div>
          </div>

          {/* Delivery Rate Chart */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-sm font-medium text-green-700 mb-4">Delivery Rate</h3>
            <div className="h-32 bg-white rounded-lg border border-green-200 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp size={32} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm text-green-600">Chart placeholder</p>
                <p className="text-xs text-green-500">Delivery success rate</p>
              </div>
            </div>
          </div>

          {/* Campaign Performance */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-sm font-medium text-purple-700 mb-4">Campaign Performance</h3>
            <div className="h-32 bg-white rounded-lg border border-purple-200 flex items-center justify-center">
              <div className="text-center">
                <Target size={32} className="text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-purple-600">Chart placeholder</p>
                <p className="text-xs text-purple-500">Campaign success metrics</p>
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-sm font-medium text-orange-700 mb-4">Engagement Metrics</h3>
            <div className="h-32 bg-white rounded-lg border border-orange-200 flex items-center justify-center">
              <div className="text-center">
                <Activity size={32} className="text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-orange-600">Chart placeholder</p>
                <p className="text-xs text-orange-500">User engagement rates</p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Analytics Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-left">
            <div className="flex items-center gap-3 mb-2">
              <Download size={20} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">Export Report</h3>
            </div>
            <p className="text-sm text-gray-600">Download detailed analytics report</p>
          </button>

          <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:border-green-300 hover:shadow-lg transition-all duration-300 text-left">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={20} className="text-green-600" />
              <h3 className="font-semibold text-gray-900">Schedule Report</h3>
            </div>
            <p className="text-sm text-gray-600">Set up automated report delivery</p>
          </button>

          <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:border-purple-300 hover:shadow-lg transition-all duration-300 text-left">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 size={20} className="text-purple-600" />
              <h3 className="font-semibold text-gray-900">Custom Dashboard</h3>
            </div>
            <p className="text-sm text-gray-600">Create personalized analytics view</p>
          </button>

          <button className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:border-orange-300 hover:shadow-lg transition-all duration-300 text-left">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} className="text-orange-600" />
              <h3 className="font-semibold text-gray-900">Real-time Monitoring</h3>
            </div>
            <p className="text-sm text-gray-600">Monitor live campaign performance</p>
          </button>

          <button className="p-4 bg-red-50 border border-red-200 rounded-lg hover:border-red-300 hover:shadow-lg transition-all duration-300 text-left">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={20} className="text-red-600" />
              <h3 className="font-semibold text-gray-900">Performance Alerts</h3>
            </div>
            <p className="text-sm text-gray-600">Set up performance notifications</p>
          </button>

          <button className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:border-indigo-300 hover:shadow-lg transition-all duration-300 text-left">
            <div className="flex items-center gap-3 mb-2">
              <Eye size={20} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Detailed Analysis</h3>
            </div>
            <p className="text-sm text-gray-600">Deep dive into campaign data</p>
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default WhatsAppAnalyticsPage;
