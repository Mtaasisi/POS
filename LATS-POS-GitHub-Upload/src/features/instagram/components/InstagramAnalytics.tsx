// Instagram Analytics Component
// Displays Instagram DM analytics and insights

import React from 'react';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock, 
  Eye,
  BarChart3,
  Activity
} from 'lucide-react';
import { InstagramAnalytics as AnalyticsData } from '../types/instagram';

interface InstagramAnalyticsProps {
  analytics: AnalyticsData | null;
  isLoading?: boolean;
  onRefresh: () => Promise<void>;
  className?: string;
}

const InstagramAnalytics: React.FC<InstagramAnalyticsProps> = ({
  analytics,
  isLoading = false,
  onRefresh,
  className = ''
}) => {
  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color?: 'blue' | 'green' | 'purple' | 'orange';
  }> = ({ title, value, subtitle, icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200'
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
        <div className="bg-gray-200 h-64 rounded-lg"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-gray-500 ${className}`}>
        <BarChart3 size={48} className="mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
        <p className="text-sm text-center mb-4">
          Analytics will appear here once you start receiving messages.
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
    );
  }

  const formatResponseTime = (minutes: number): string => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr`;
    return `${Math.round(hours / 24)} days`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Activity size={24} />
          Instagram Analytics
        </h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <TrendingUp size={16} />
          )}
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Conversations"
          value={analytics.total_conversations}
          subtitle="All time"
          icon={<Users size={20} />}
          color="blue"
        />
        
        <StatCard
          title="Active Conversations"
          value={analytics.active_conversations}
          subtitle="Currently active"
          icon={<MessageCircle size={20} />}
          color="green"
        />
        
        <StatCard
          title="Messages Sent"
          value={analytics.messages_sent}
          subtitle="Total outbound"
          icon={<TrendingUp size={20} />}
          color="purple"
        />
        
        <StatCard
          title="Average Response Time"
          value={formatResponseTime(analytics.average_response_time)}
          subtitle="Avg time to respond"
          icon={<Clock size={20} />}
          color="orange"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Messages Received"
          value={analytics.messages_received}
          subtitle="Total inbound"
          icon={<MessageCircle size={20} />}
          color="blue"
        />
        
        <StatCard
          title="Response Rate"
          value={`${(analytics.response_rate * 100).toFixed(1)}%`}
          subtitle="Messages responded to"
          icon={<Eye size={20} />}
          color="green"
        />
        
        <StatCard
          title="Engagement"
          value={analytics.total_conversations > 0 
            ? `${(analytics.messages_received / analytics.total_conversations).toFixed(1)}`
            : '0'
          }
          subtitle="Avg messages per conversation"
          icon={<Activity size={20} />}
          color="purple"
        />
      </div>

      {/* Daily Stats Chart */}
      {analytics.daily_stats && analytics.daily_stats.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Activity</h3>
          
          <div className="space-y-4">
            {analytics.daily_stats.slice(-7).map((day, index) => {
              const maxMessages = Math.max(
                ...analytics.daily_stats.map(d => Math.max(d.messages_sent, d.messages_received))
              );
              
              return (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-16 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString([], { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    {/* Messages Sent */}
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-xs text-gray-500">Sent:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{
                            width: maxMessages > 0 ? `${(day.messages_sent / maxMessages) * 100}%` : '0%'
                          }}
                        />
                      </div>
                      <span className="w-8 text-xs text-gray-600 text-right">
                        {day.messages_sent}
                      </span>
                    </div>
                    
                    {/* Messages Received */}
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-xs text-gray-500">Received:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: maxMessages > 0 ? `${(day.messages_received / maxMessages) * 100}%` : '0%'
                          }}
                        />
                      </div>
                      <span className="w-8 text-xs text-gray-600 text-right">
                        {day.messages_received}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-12 text-xs text-gray-500 text-right">
                    {day.new_conversations} new
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-medium text-blue-900">Response Rate</h4>
              <p className="text-sm text-blue-700">
                You respond to {(analytics.response_rate * 100).toFixed(1)}% of conversations
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {(analytics.response_rate * 100).toFixed(0)}%
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <h4 className="font-medium text-green-900">Response Time</h4>
              <p className="text-sm text-green-700">
                Average time to first response
              </p>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatResponseTime(analytics.average_response_time)}
            </div>
          </div>

          {analytics.response_rate < 0.8 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900">💡 Improvement Tip</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Consider setting up auto-reply rules to improve your response rate. 
                Quick responses help maintain customer engagement.
              </p>
            </div>
          )}

          {analytics.average_response_time > 60 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-orange-900">⚡ Speed Tip</h4>
              <p className="text-sm text-orange-700 mt-1">
                Your average response time is over 1 hour. Consider using message templates 
                and quick replies to respond faster.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstagramAnalytics;
