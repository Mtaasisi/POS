// Instagram Integration Widget
// Small widget component for showing Instagram DM status in main app

import React from 'react';
import { Instagram, MessageCircle, Users, TrendingUp } from 'lucide-react';
import { useInstagramDM } from '../hooks/useInstagramDM';

interface InstagramIntegrationWidgetProps {
  onNavigateToInstagram?: () => void;
  showDetails?: boolean;
  className?: string;
}

const InstagramIntegrationWidget: React.FC<InstagramIntegrationWidgetProps> = ({
  onNavigateToInstagram,
  showDetails = true,
  className = ''
}) => {
  const [state] = useInstagramDM();

  if (!state.isConnected) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Instagram size={20} className="text-gray-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Instagram DMs</h3>
            <p className="text-sm text-gray-500">Not connected</p>
          </div>
          {onNavigateToInstagram && (
            <button
              onClick={onNavigateToInstagram}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeConversations = state.conversations.filter(c => c.status === 'active').length;
  const totalMessages = state.conversations.reduce((sum, c) => sum + c.messages.length, 0);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Instagram size={20} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            Instagram DMs
            <div className="w-2 h-2 bg-green-400 rounded-full" title="Connected" />
          </h3>
          <p className="text-sm text-gray-500">
            {state.unreadCount > 0 
              ? `${state.unreadCount} unread message${state.unreadCount > 1 ? 's' : ''}`
              : 'All caught up'
            }
          </p>
        </div>
        {onNavigateToInstagram && (
          <button
            onClick={onNavigateToInstagram}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            Open
          </button>
        )}
      </div>

      {showDetails && (
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <MessageCircle size={14} />
            </div>
            <p className="text-xs text-gray-500">Conversations</p>
            <p className="text-sm font-medium text-gray-900">{state.conversations.length}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Users size={14} />
            </div>
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-sm font-medium text-gray-900">{activeConversations}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <TrendingUp size={14} />
            </div>
            <p className="text-xs text-gray-500">Messages</p>
            <p className="text-sm font-medium text-gray-900">{totalMessages}</p>
          </div>
        </div>
      )}

      {state.unreadCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span>New messages waiting</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstagramIntegrationWidget;
