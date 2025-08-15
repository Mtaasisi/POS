import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User, Clock, AlertCircle } from 'lucide-react';

interface Remark {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  created_by?: string;
}

interface WhatsAppChatUIProps {
  remarks: Remark[];
  activityEvents?: any[];
  onAddRemark?: (content: string) => Promise<void>;
  currentUserId?: string;
  currentUserName?: string;
  isLoading?: boolean;
  disableAutoScroll?: boolean;
}

const WhatsAppChatUI: React.FC<WhatsAppChatUIProps> = ({
  remarks = [],
  activityEvents = [],
  onAddRemark,
  currentUserId,
  currentUserName,
  isLoading = false,
  disableAutoScroll = false
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Only auto-scroll when new remarks are added, not on every render
  const [prevRemarksLength, setPrevRemarksLength] = useState(0);
  
  useEffect(() => {
    // Only scroll if new remarks were added and auto-scroll is not disabled
    if (!disableAutoScroll && remarks.length > prevRemarksLength && remarks.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
    setPrevRemarksLength(remarks.length);
  }, [remarks, prevRemarksLength, disableAutoScroll]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !onAddRemark) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      await onAddRemark(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  const isOwnMessage = (remark: Remark) => {
    return (remark.createdBy === currentUserName) || 
           (remark.created_by === currentUserId) ||
           (remark.createdBy === currentUserId);
  };

  // Combine and sort all messages
  const allMessages = [...remarks, ...activityEvents]
    .filter(item => item && (item.createdAt || item.timestamp))
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.timestamp || 0);
      const dateB = new Date(b.createdAt || b.timestamp || 0);
      return dateA.getTime() - dateB.getTime();
    });

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Device Remarks</h3>
          <p className="text-xs text-green-100">Chat with team members</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Loading messages...</span>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
          </div>
        ) : (
          allMessages.map((item, index) => {
            const isRemark = 'content' in item;
            const isOwn = isRemark ? isOwnMessage(item) : false;
            const showDate = index === 0 || 
              formatDate(item.createdAt || item.timestamp) !== formatDate(allMessages[index - 1]?.createdAt || allMessages[index - 1]?.timestamp);

            return (
              <div key={isRemark ? item.id : `${item.type}-${item.timestamp}-${index}`}>
                {/* Date Separator */}
                {showDate && (
                  <div className="flex justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {formatDate(item.createdAt || item.timestamp)}
                    </div>
                  </div>
                )}

                {/* Activity Event (System Message) */}
                {!isRemark && (
                  <div className="flex justify-center my-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 max-w-xs lg:max-w-md">
                      <div className="flex items-center gap-2 mb-1">
                        {item.icon || <Clock className="w-3 h-3" />}
                        <span className="text-xs font-semibold text-blue-700">
                          {item.typeLabel || 'Activity'}
                        </span>
                      </div>
                      <p className="text-xs text-blue-800">
                        {item.description || 'System activity'}
                      </p>
                      <div className="flex items-center justify-end mt-1">
                        <span className="text-xs text-blue-600">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Bubble for Remarks */}
                {isRemark && (
                  <>
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                        isOwn 
                          ? 'bg-green-500 text-white rounded-br-md' 
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {item.content || 'Empty message'}
                        </p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          isOwn ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">
                            {formatTime(item.createdAt)}
                          </span>
                          {isOwn && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sender Name for others' messages */}
                    {!isOwn && (
                      <div className="flex justify-start mt-1">
                        <span className="text-xs text-gray-500 ml-3">
                          {item.createdBy || 'Unknown User'}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {onAddRemark && (
        <div className="bg-white border-t border-gray-200 p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full bg-transparent border-none outline-none resize-none text-sm"
                rows={1}
                style={{ minHeight: '20px', maxHeight: '100px' }}
                disabled={isSending}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className={`p-2 rounded-full transition-colors ${
                newMessage.trim() && !isSending
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppChatUI; 