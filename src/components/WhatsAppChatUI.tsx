import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import GlassButton from '../features/shared/components/ui/GlassButton';
import { formatRelativeTime } from '../lib/utils';

interface Remark {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

interface ActivityEvent {
  type: string;
  typeLabel: string;
  timestamp: string;
  user: string;
  description: string;
  icon: React.ReactNode;
}

interface WhatsAppChatUIProps {
  remarks: Remark[];
  activityEvents: ActivityEvent[];
  onAddRemark: (remark: string) => Promise<void>;
  currentUserId?: string;
  currentUserName?: string;
  isLoading: boolean;
}

const WhatsAppChatUI: React.FC<WhatsAppChatUIProps> = ({
  remarks,
  activityEvents,
  onAddRemark,
  currentUserId,
  currentUserName,
  isLoading
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Combine remarks and activity events into a single timeline
  const allMessages = [...remarks, ...activityEvents]
    .sort((a, b) => new Date(a.createdAt || a.timestamp).getTime() - new Date(b.createdAt || b.timestamp).getTime());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      await onAddRemark(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isOwnMessage = (item: any) => {
    return item.createdBy === currentUserId || item.user === currentUserId;
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'status':
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      case 'audit':
        return <Clock className="w-4 h-4 text-gray-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-blue-200 bg-white/50 rounded-t-lg">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Device Communication</h3>
          <p className="text-sm text-gray-600">Remarks and Activity Timeline</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {allMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>No messages yet</p>
            <p className="text-sm">Start a conversation by adding a remark</p>
          </div>
        ) : (
          allMessages.map((item, index) => {
            const isOwn = isOwnMessage(item);
            const isRemark = 'content' in item;
            const isActivityEvent = 'type' in item;

            return (
              <div
                key={item.id || index}
                className={`flex ${isOwn && isRemark ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isRemark
                      ? isOwn
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}
                >
                  {isActivityEvent && (
                    <div className="flex items-center gap-2 mb-1">
                      {getMessageIcon(item.type)}
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {item.typeLabel}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap">
                    {isRemark ? item.content : item.description}
                  </p>
                  
                  <div className={`text-xs mt-1 ${isOwn && isRemark ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatRelativeTime(item.createdAt || item.timestamp)}
                    {isRemark && !isOwn && (
                      <span className="ml-2">
                        • {item.createdBy === currentUserId ? currentUserName : item.createdBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-blue-200 bg-white/50 rounded-b-lg">
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a remark..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            disabled={sending || isLoading}
          />
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Send className="w-4 h-4" />}
            onClick={handleSendMessage}
            disabled={!message.trim() || sending || isLoading}
            className="self-end"
          >
            {sending ? 'Sending...' : 'Send'}
          </GlassButton>
        </div>
        
        {sending && (
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Sending remark...
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppChatUI;