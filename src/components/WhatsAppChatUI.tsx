import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User, Clock, Plus } from 'lucide-react';
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
  onAddRemark: (remark: string) => Promise<boolean | void>;
  currentUserId?: string;
  currentUserName?: string;
  isLoading?: boolean;
}

const WhatsAppChatUI: React.FC<WhatsAppChatUIProps> = ({
  remarks,
  activityEvents,
  onAddRemark,
  currentUserId,
  currentUserName,
  isLoading = false
}) => {
  const [newRemark, setNewRemark] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [remarks, activityEvents]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newRemark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark.trim() || sending) return;
    
    setSending(true);
    try {
      await onAddRemark(newRemark.trim());
      setNewRemark('');
    } catch (error) {
      console.error('Failed to add remark:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Combine and sort all messages by timestamp
  const allMessages = [
    ...remarks.map(remark => ({
      id: remark.id,
      type: 'remark' as const,
      content: remark.content,
      user: remark.createdBy,
      timestamp: remark.createdAt,
      isCurrentUser: remark.createdBy === currentUserId
    })),
    ...activityEvents.map(event => ({
      id: `activity-${event.timestamp}`,
      type: 'activity' as const,
      content: event.description,
      user: event.user,
      timestamp: event.timestamp,
      icon: event.icon,
      typeLabel: event.typeLabel,
      isCurrentUser: false
    }))
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-green-50/30 to-blue-50/30 rounded-lg border border-white/20 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-white/20 bg-white/20">
        <div className="p-2 rounded-full bg-green-500/20">
          <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px] text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Device Activity & Remarks</h3>
          <p className="text-xs text-gray-600">
            {remarks.length} remark{remarks.length !== 1 ? 's' : ''} • {activityEvents.length} activit{activityEvents.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500 text-sm">Loading activity...</div>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No activity or remarks yet</p>
              <p className="text-xs mt-1">Start a conversation or wait for device updates</p>
            </div>
          </div>
        ) : (
          allMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'remark' && message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs sm:max-w-sm lg:max-w-md rounded-lg p-3 shadow-sm border ${
                  message.type === 'remark'
                    ? message.isCurrentUser
                      ? 'bg-green-500/10 border-green-200 text-green-900'
                      : 'bg-white/60 border-gray-200 text-gray-900'
                    : 'bg-blue-50/60 border-blue-200 text-blue-900'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center gap-2 mb-1">
                  {message.type === 'activity' && message.icon && (
                    <div className="flex-shrink-0">{message.icon}</div>
                  )}
                  <div className="flex items-center gap-1 text-xs">
                    {message.type === 'activity' ? (
                      <span className="font-semibold uppercase tracking-wide">
                        {message.typeLabel}
                      </span>
                    ) : (
                      <User size={12} className="text-gray-500" />
                    )}
                    <span className="text-gray-500">
                      {formatRelativeTime(message.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="text-sm leading-relaxed break-words">
                  {message.content}
                </div>

                {/* User Attribution for remarks */}
                {message.type === 'remark' && !message.isCurrentUser && (
                  <div className="text-xs text-gray-500 mt-1">
                    {message.user}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/20 bg-white/20 p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a remark or note..."
              className="w-full p-2 sm:p-3 rounded-lg border border-gray-300 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 resize-none min-h-[40px] max-h-[120px] text-sm"
              rows={1}
              disabled={sending}
            />
          </div>
          <GlassButton
            type="submit"
            variant="primary"
            size="sm"
            icon={<Send size={14} className="sm:w-4 sm:h-4" />}
            disabled={!newRemark.trim() || sending}
            className="mb-0.5"
          >
            {sending ? 'Sending...' : 'Send'}
          </GlassButton>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Clock size={12} />
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default WhatsAppChatUI;