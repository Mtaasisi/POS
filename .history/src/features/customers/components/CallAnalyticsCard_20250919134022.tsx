import React, { useState } from 'react';
import { 
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, 
  Clock, Calendar, TrendingUp, Award, Star, Users, BarChart3,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { Customer } from '../../../types';

interface CallAnalyticsCardProps {
  customer: Customer;
}

const CallAnalyticsCard: React.FC<CallAnalyticsCardProps> = ({ customer }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Helper function to format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  // Helper function to get loyalty level color
  const getLoyaltyLevelColor = (level: string) => {
    switch (level) {
      case 'VIP':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'Gold':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'Silver':
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
      case 'Bronze':
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      case 'Basic':
        return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
      case 'New':
        return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  // Helper function to get loyalty level icon
  const getLoyaltyLevelIcon = (level: string) => {
    switch (level) {
      case 'VIP':
        return <Award className="w-4 h-4" />;
      case 'Gold':
        return <Star className="w-4 h-4" />;
      case 'Silver':
        return <Star className="w-4 h-4" />;
      case 'Bronze':
        return <Star className="w-4 h-4" />;
      case 'Basic':
        return <Users className="w-4 h-4" />;
      case 'New':
        return <Users className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  // Don't render if no call data
  if (!customer.totalCalls || customer.totalCalls === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Call Analytics</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Phone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No call data available</p>
          <p className="text-sm">This customer hasn't made any calls yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Header with Expand/Collapse */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Phone className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Call Analytics</h3>
        </div>
        <div className="flex items-center gap-3">
          {customer.callLoyaltyLevel && (
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getLoyaltyLevelColor(customer.callLoyaltyLevel)}`}>
              {getLoyaltyLevelIcon(customer.callLoyaltyLevel)}
              {customer.callLoyaltyLevel}
            </div>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Compact Summary View (Always Visible) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Phone className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Calls</span>
          </div>
          <div className="text-lg font-bold text-blue-900">{customer.totalCalls}</div>
          <div className="text-xs text-blue-600">
            {customer.incomingCalls || 0}↗ {customer.outgoingCalls || 0}↙
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-green-600" />
            <span className="text-xs font-medium text-green-700">Duration</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            {formatDuration(customer.totalCallDurationMinutes || 0)}
          </div>
          <div className="text-xs text-green-600">
            Avg: {formatDuration(customer.avgCallDurationMinutes || 0)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Span</span>
          </div>
          <div className="text-lg font-bold text-purple-900">
            {customer.firstCallDate && customer.lastCallDate ? 
              Math.ceil((new Date(customer.lastCallDate).getTime() - new Date(customer.firstCallDate).getTime()) / (1000 * 60 * 60 * 24)) : 0}d
          </div>
          <div className="text-xs text-purple-600">
            {customer.totalCalls > 0 ? Math.round(customer.totalCalls / Math.max(1, Math.ceil((Date.now() - new Date(customer.firstCallDate || customer.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 30)))) : 0}/mo
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Award className="w-3 h-3 text-orange-600" />
            <span className="text-xs font-medium text-orange-700">Level</span>
          </div>
          <div className="text-lg font-bold text-orange-900">{customer.callLoyaltyLevel || 'Basic'}</div>
          <div className="text-xs text-orange-600">
            {customer.missedCalls || 0} missed
          </div>
        </div>
      </div>

      {/* Detailed View (Expandable) */}
      {isExpanded && (
        <div className="space-y-6 border-t border-gray-200 pt-6">

          {/* Call Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Incoming Calls */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <PhoneIncoming className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Incoming</span>
              </div>
              <div className="text-xl font-bold text-green-900">{customer.incomingCalls || 0}</div>
              <div className="text-xs text-green-600">
                {customer.totalCalls ? Math.round(((customer.incomingCalls || 0) / customer.totalCalls) * 100) : 0}% of total
              </div>
            </div>

            {/* Outgoing Calls */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <PhoneOutgoing className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Outgoing</span>
              </div>
              <div className="text-xl font-bold text-blue-900">{customer.outgoingCalls || 0}</div>
              <div className="text-xs text-blue-600">
                {customer.totalCalls ? Math.round(((customer.outgoingCalls || 0) / customer.totalCalls) * 100) : 0}% of total
              </div>
            </div>

            {/* Missed Calls */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <PhoneMissed className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Missed</span>
              </div>
              <div className="text-xl font-bold text-red-900">{customer.missedCalls || 0}</div>
              <div className="text-xs text-red-600">
                {customer.totalCalls ? Math.round(((customer.missedCalls || 0) / customer.totalCalls) * 100) : 0}% of total
              </div>
            </div>
          </div>

          {/* Call Timeline */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Call Timeline
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Call */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-1">First Call</div>
                <div className="text-lg font-semibold text-gray-900">
                  {customer.firstCallDate ? new Date(customer.firstCallDate).toLocaleDateString() : 'Unknown'}
                </div>
                <div className="text-xs text-gray-500">
                  {customer.firstCallDate ? new Date(customer.firstCallDate).toLocaleTimeString() : ''}
                </div>
              </div>

              {/* Last Call */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-1">Last Call</div>
                <div className="text-lg font-semibold text-gray-900">
                  {customer.lastCallDate ? new Date(customer.lastCallDate).toLocaleDateString() : 'Unknown'}
                </div>
                <div className="text-xs text-gray-500">
                  {customer.lastCallDate ? new Date(customer.lastCallDate).toLocaleTimeString() : ''}
                </div>
              </div>
            </div>

            {/* Call Span */}
            {customer.firstCallDate && customer.lastCallDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-700 mb-1">Call Activity Span</div>
                <div className="text-lg font-semibold text-blue-900">
                  {Math.ceil((new Date(customer.lastCallDate).getTime() - new Date(customer.firstCallDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
                <div className="text-xs text-blue-600">
                  From {new Date(customer.firstCallDate).toLocaleDateString()} to {new Date(customer.lastCallDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Call Insights */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Call Insights
            </h4>
            <div className="space-y-2 text-sm text-indigo-700">
              {customer.callLoyaltyLevel === 'VIP' && (
                <p>🌟 This is a VIP customer with exceptional call activity!</p>
              )}
              {customer.callLoyaltyLevel === 'Gold' && (
                <p>⭐ This customer has high call engagement and loyalty.</p>
              )}
              {customer.callLoyaltyLevel === 'Silver' && (
                <p>📞 This customer has been calling for more than 2 days, showing good engagement.</p>
              )}
              {customer.callLoyaltyLevel === 'Bronze' && (
                <p>📱 This customer has made only one call - consider follow-up.</p>
              )}
              {customer.totalCalls && customer.totalCalls > 100 && (
                <p>🔥 High call volume customer - excellent engagement!</p>
              )}
              {customer.avgCallDurationMinutes && customer.avgCallDurationMinutes > 5 && (
                <p>⏱️ Long average call duration - detailed conversations.</p>
              )}
              {customer.missedCalls && customer.missedCalls > customer.totalCalls * 0.3 && (
                <p>⚠️ High missed call rate - consider alternative contact methods.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallAnalyticsCard;
