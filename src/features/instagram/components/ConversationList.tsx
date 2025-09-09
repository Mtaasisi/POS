// Instagram Conversation List Component
// Displays list of Instagram DM conversations

import React from 'react';
import { Clock, MessageCircle, User, Archive, Shield } from 'lucide-react';
import { InstagramConversation, InstagramUser } from '../types/instagram';

interface ConversationListProps {
  conversations: InstagramConversation[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onArchiveConversation: (conversationId: string) => void;
  onBlockUser: (conversationId: string) => void;
  className?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onArchiveConversation,
  onBlockUser,
  className = ''
}) => {
  const formatLastMessageTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getLastMessagePreview = (conversation: InstagramConversation): string => {
    if (conversation.messages.length === 0) return 'No messages yet';
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage.text) {
      return lastMessage.text.length > 50 
        ? lastMessage.text.substring(0, 50) + '...'
        : lastMessage.text;
    }
    
    if (lastMessage.attachments) {
      return '📎 Attachment';
    }
    
    return 'Message';
  };

  if (conversations.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-gray-500 ${className}`}>
        <MessageCircle size={48} className="mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Conversations</h3>
        <p className="text-sm text-center">
          Instagram DM conversations will appear here when users message your account.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle size={20} />
          Conversations ({conversations.length})
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          const user = conversation.user;
          
          return (
            <div
              key={conversation.id}
              className={`flex items-center p-4 border-b border-gray-100 cursor-pointer transition-colors
                ${isActive 
                  ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                  : 'hover:bg-gray-50'
                }
                ${conversation.status === 'archived' ? 'opacity-60' : ''}
                ${conversation.status === 'blocked' ? 'opacity-40 bg-red-50' : ''}
              `}
              onClick={() => onSelectConversation(conversation.id)}
            >
              {/* User Avatar */}
              <div className="flex-shrink-0 mr-3">
                {user.profile_pic ? (
                  <img
                    src={user.profile_pic}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={20} className="text-gray-500" />
                  </div>
                )}
                
                {/* Online indicator */}
                {conversation.status === 'active' && (
                  <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-white -mt-2 ml-9"></div>
                )}
              </div>

              {/* Conversation Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {user.name || user.username}
                    {user.is_verified_user && (
                      <span className="ml-1 text-blue-500">✓</span>
                    )}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {conversation.status === 'archived' && (
                      <Archive size={12} />
                    )}
                    {conversation.status === 'blocked' && (
                      <Shield size={12} />
                    )}
                    <Clock size={12} />
                    {formatLastMessageTime(conversation.last_message_time)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">
                    {getLastMessagePreview(conversation)}
                  </p>
                  
                  {conversation.unread_count > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">@{user.username}</span>
                  {user.follower_count && (
                    <span className="text-xs text-gray-500">
                      {user.follower_count > 1000 
                        ? `${(user.follower_count / 1000).toFixed(1)}K followers`
                        : `${user.follower_count} followers`
                      }
                    </span>
                  )}
                  {user.is_user_follow_business && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Following</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1 ml-2">
                {conversation.status === 'active' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveConversation(conversation.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Archive conversation"
                    >
                      <Archive size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlockUser(conversation.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Block user"
                    >
                      <Shield size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
