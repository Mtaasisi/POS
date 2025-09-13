// Instagram DM Dashboard Page
// Main page for managing Instagram direct messages

import React, { useState, useEffect } from 'react';
import { 
  Instagram, 
  MessageCircle, 
  Settings, 
  BarChart3, 
  Users,
  RefreshCw,
  Filter,
  Search,
  AlertCircle
} from 'lucide-react';
import { useInstagramDM } from '../hooks/useInstagramDM';
import ConversationList from '../components/ConversationList';
import MessageThread from '../components/MessageThread';
import MessageComposer from '../components/MessageComposer';
import InstagramConnection from '../components/InstagramConnection';
import InstagramSettingsPanel from '../components/InstagramSettingsPanel';
import InstagramAnalytics from '../components/InstagramAnalytics';

const InstagramDMPage: React.FC = () => {
  const [instagramState, instagramActions] = useInstagramDM();
  const [activeView, setActiveView] = useState<'conversations' | 'settings' | 'analytics'>('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationFilter, setConversationFilter] = useState<'all' | 'unread' | 'active' | 'archived'>('all');

  // Filter conversations based on search and filter
  const filteredConversations = instagramState.conversations.filter(conversation => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesUser = conversation.user.username.toLowerCase().includes(query) ||
                         conversation.user.name?.toLowerCase().includes(query);
      const matchesMessage = conversation.messages.some(msg => 
        msg.text?.toLowerCase().includes(query)
      );
      if (!matchesUser && !matchesMessage) return false;
    }

    // Status filter
    switch (conversationFilter) {
      case 'unread':
        return conversation.unread_count > 0;
      case 'active':
        return conversation.status === 'active';
      case 'archived':
        return conversation.status === 'archived';
      default:
        return true;
    }
  });

  const handleRefresh = async () => {
    await instagramActions.refreshAnalytics();
    // In a real implementation, you might want to refresh conversations from server
  };

  // Show connection screen if not connected
  if (!instagramState.isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Instagram size={48} className="mx-auto mb-4 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Instagram Direct Messages</h1>
            <p className="text-gray-600">
              Connect your Instagram Professional account to start managing customer conversations.
            </p>
          </div>

          <InstagramConnection
            isConnected={instagramState.isConnected}
            settings={instagramState.settings}
            onConnect={instagramActions.connect}
            onDisconnect={instagramActions.disconnect}
            isLoading={instagramState.isLoading}
            error={instagramState.error}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Instagram size={24} className="text-blue-500" />
            <h1 className="text-xl font-semibold text-gray-900">Instagram DMs</h1>
            
            {instagramState.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {instagramState.unreadCount > 99 ? '99+' : instagramState.unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('conversations')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeView === 'conversations'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageCircle size={16} className="inline mr-1" />
                Messages
              </button>
              <button
                onClick={() => setActiveView('analytics')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeView === 'analytics'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 size={16} className="inline mr-1" />
                Analytics
              </button>
              <button
                onClick={() => setActiveView('settings')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeView === 'settings'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings size={16} className="inline mr-1" />
                Settings
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={instagramState.isLoading}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={instagramState.isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Conversations View */}
        {activeView === 'conversations' && (
          <>
            {/* Sidebar - Conversation List */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              {/* Search and Filters */}
              <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-1">
                  {[
                    { key: 'all', label: 'All', count: instagramState.conversations.length },
                    { key: 'unread', label: 'Unread', count: instagramState.unreadCount },
                    { key: 'active', label: 'Active', count: instagramState.conversations.filter(c => c.status === 'active').length },
                    { key: 'archived', label: 'Archived', count: instagramState.conversations.filter(c => c.status === 'archived').length }
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => setConversationFilter(filter.key as any)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        conversationFilter === filter.key
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation List */}
              <ConversationList
                conversations={filteredConversations}
                activeConversationId={instagramState.activeConversation?.id}
                onSelectConversation={instagramActions.selectConversation}
                onArchiveConversation={instagramActions.archiveConversation}
                onBlockUser={instagramActions.blockUser}
                className="flex-1"
              />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Message Thread */}
              <MessageThread
                conversation={instagramState.activeConversation}
                onMarkAsRead={instagramActions.markAsRead}
                className="flex-1"
              />

              {/* Message Composer */}
              <MessageComposer
                conversation={instagramState.activeConversation}
                messageTemplates={instagramState.messageTemplates}
                onSendMessage={instagramActions.sendMessage}
                onSendQuickReplies={instagramActions.sendQuickReplies}
                onSendTemplate={instagramActions.sendTemplate}
                onSendTyping={instagramActions.sendTypingIndicator}
                disabled={instagramState.isLoading}
              />
            </div>
          </>
        )}

        {/* Settings View */}
        {activeView === 'settings' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              <InstagramConnection
                isConnected={instagramState.isConnected}
                settings={instagramState.settings}
                onConnect={instagramActions.connect}
                onDisconnect={instagramActions.disconnect}
                isLoading={instagramState.isLoading}
                error={instagramState.error}
              />

              <InstagramSettingsPanel
                settings={instagramState.settings}
                autoReplyRules={instagramState.autoReplyRules}
                onUpdateSettings={instagramActions.updateSettings}
                onSetWelcomeMessage={instagramActions.setWelcomeMessage}
                onSetPersistentMenu={instagramActions.setPersistentMenu}
                onSetIceBreakers={instagramActions.setIceBreakers}
                onAddAutoReplyRule={instagramActions.addAutoReplyRule}
                onUpdateAutoReplyRule={instagramActions.updateAutoReplyRule}
                onDeleteAutoReplyRule={instagramActions.deleteAutoReplyRule}
              />
            </div>
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <InstagramAnalytics
                analytics={instagramState.analytics}
                isLoading={instagramState.isLoading}
                onRefresh={instagramActions.refreshAnalytics}
              />
            </div>
          </div>
        )}
      </div>

      {/* Connection Status Indicator */}
      {instagramState.isConnected && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-md shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <span className="text-sm">Instagram Connected</span>
        </div>
      )}

      {/* Error Toast */}
      {instagramState.error && (
        <div className="fixed bottom-4 left-4 bg-red-500 text-white px-4 py-3 rounded-md shadow-lg flex items-center gap-2 max-w-md">
          <AlertCircle size={16} />
          <span className="text-sm">{instagramState.error}</span>
        </div>
      )}
    </div>
  );
};

export default InstagramDMPage;
