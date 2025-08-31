// Instagram Message Thread Component
// Displays messages in a conversation thread

import React, { useEffect, useRef } from 'react';
import { Clock, ExternalLink, User } from 'lucide-react';
import { InstagramConversation, InstagramMessage } from '../types/instagram';

interface MessageThreadProps {
  conversation: InstagramConversation | null;
  onMarkAsRead: (conversationId: string) => void;
  className?: string;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  onMarkAsRead,
  className = ''
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages]);

  // Mark as read when conversation is opened
  useEffect(() => {
    if (conversation && conversation.unread_count > 0) {
      const timer = setTimeout(() => {
        onMarkAsRead(conversation.id);
      }, 1000); // Mark as read after 1 second of viewing

      return () => clearTimeout(timer);
    }
  }, [conversation, onMarkAsRead]);

  const formatMessageTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const renderMessage = (message: InstagramMessage, index: number) => {
    const isFromUser = true; // All messages in this thread are from the Instagram user to business
    
    return (
      <div
        key={`${message.mid}-${index}`}
        className={`flex mb-4 ${isFromUser ? 'justify-start' : 'justify-end'}`}
      >
        {isFromUser && conversation?.user && (
          <div className="flex-shrink-0 mr-2">
            {conversation.user.profile_pic ? (
              <img
                src={conversation.user.profile_pic}
                alt={conversation.user.username}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={16} className="text-gray-500" />
              </div>
            )}
          </div>
        )}

        <div className={`max-w-xs lg:max-w-md ${isFromUser ? '' : 'ml-auto'}`}>
          {/* Message Content */}
          <div
            className={`rounded-lg px-4 py-2 ${
              isFromUser
                ? 'bg-gray-100 text-gray-900'
                : 'bg-blue-500 text-white'
            }`}
          >
            {/* Text Content */}
            {message.text && (
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            )}

            {/* Quick Reply Indicator */}
            {message.quick_reply && (
              <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                <strong>Quick Reply:</strong> {message.quick_reply.payload}
              </div>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.map((attachment, attachIndex) => (
              <div key={attachIndex} className="mt-2">
                {attachment.type === 'image' && attachment.payload.url && (
                  <img
                    src={attachment.payload.url}
                    alt="Shared image"
                    className="max-w-full rounded cursor-pointer"
                    onClick={() => window.open(attachment.payload.url, '_blank')}
                  />
                )}
                
                {attachment.type === 'video' && attachment.payload.url && (
                  <video
                    src={attachment.payload.url}
                    controls
                    className="max-w-full rounded"
                  />
                )}

                {attachment.type === 'template' && (
                  <div className="p-2 bg-white border rounded text-xs text-gray-600">
                    Template: {attachment.payload.template_type}
                  </div>
                )}

                {(attachment.type === 'audio' || attachment.type === 'file') && attachment.payload.url && (
                  <a
                    href={attachment.payload.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <ExternalLink size={14} />
                    {attachment.type === 'audio' ? 'Audio File' : 'File'}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Message Time */}
          <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
            isFromUser ? '' : 'justify-end'
          }`}>
            <Clock size={10} />
            {formatMessageTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  if (!conversation) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-gray-500 ${className}`}>
        <MessageCircle size={48} className="mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Select a Conversation</h3>
        <p className="text-sm text-center">
          Choose a conversation from the list to start viewing messages.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Thread Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {conversation.user.profile_pic ? (
              <img
                src={conversation.user.profile_pic}
                alt={conversation.user.username}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={20} className="text-gray-500" />
              </div>
            )}
            
            <div>
              <h3 className="font-medium text-gray-900 flex items-center gap-1">
                {conversation.user.name || conversation.user.username}
                {conversation.user.is_verified_user && (
                  <span className="text-blue-500">✓</span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                @{conversation.user.username}
                {conversation.user.follower_count && (
                  <span className="ml-2">
                    {conversation.user.follower_count > 1000 
                      ? `${(conversation.user.follower_count / 1000).toFixed(1)}K followers`
                      : `${conversation.user.follower_count} followers`
                    }
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {conversation.user.is_user_follow_business && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Following
              </span>
            )}
            
            <button
              onClick={() => onArchiveConversation(conversation.id)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Archive conversation"
            >
              <Archive size={16} />
            </button>
            
            <button
              onClick={() => onBlockUser(conversation.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Block user"
            >
              <Shield size={16} />
            </button>
          </div>
        </div>

        {/* Conversation Status */}
        {conversation.status !== 'active' && (
          <div className={`mt-2 p-2 rounded text-sm ${
            conversation.status === 'archived' 
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {conversation.status === 'archived' ? '📁 Archived' : '🚫 Blocked'}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {conversation.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No messages in this conversation yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversation.messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageThread;