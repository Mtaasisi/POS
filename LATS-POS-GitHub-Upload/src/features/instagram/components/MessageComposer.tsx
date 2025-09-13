// Instagram Message Composer Component
// Interface for composing and sending Instagram DM messages

import React, { useState, useRef } from 'react';
import { 
  Send, 
  Image, 
  FileText, 
  Zap, 
  Smile,
  MoreHorizontal,
  X
} from 'lucide-react';
import { InstagramConversation, MessageTemplate, QuickReply } from '../types/instagram';

interface MessageComposerProps {
  conversation: InstagramConversation | null;
  messageTemplates: MessageTemplate[];
  onSendMessage: (recipientId: string, text: string) => Promise<boolean>;
  onSendQuickReplies: (recipientId: string, text: string, replies: QuickReply[]) => Promise<boolean>;
  onSendTemplate: (recipientId: string, template: any) => Promise<boolean>;
  onSendTyping: (recipientId: string, isTyping: boolean) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  conversation,
  messageTemplates,
  onSendMessage,
  onSendQuickReplies,
  onSendTemplate,
  onSendTyping,
  disabled = false,
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [quickReplyText, setQuickReplyText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMessageChange = (value: string) => {
    setMessage(value);
    
    // Handle typing indicators
    if (conversation && value.length > 0) {
      onSendTyping(conversation.user.id, true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        onSendTyping(conversation.user.id, false);
      }, 3000);
    }
  };

  const handleSendMessage = async () => {
    if (!conversation || !message.trim() || isSending) return;

    setIsSending(true);
    
    try {
      // Stop typing indicator
      await onSendTyping(conversation.user.id, false);
      
      const success = await onSendMessage(conversation.user.id, message.trim());
      
      if (success) {
        setMessage('');
        // Auto-resize textarea
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendQuickReplies = async () => {
    if (!conversation || !quickReplyText.trim() || quickReplies.length === 0 || isSending) return;

    setIsSending(true);
    
    try {
      const success = await onSendQuickReplies(
        conversation.user.id, 
        quickReplyText.trim(), 
        quickReplies
      );
      
      if (success) {
        setQuickReplyText('');
        setQuickReplies([]);
        setShowQuickReplies(false);
      }
    } catch (error) {
      console.error('Error sending quick replies:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleUseTemplate = async (template: MessageTemplate) => {
    if (!conversation || isSending) return;

    setIsSending(true);
    
    try {
      let success = false;
      
      switch (template.type) {
        case 'text':
          success = await onSendMessage(conversation.user.id, template.content as string);
          break;
        case 'quick_reply':
          const qrData = template.content as any;
          success = await onSendQuickReplies(
            conversation.user.id, 
            qrData.text, 
            qrData.replies
          );
          break;
        case 'generic':
        case 'button':
          success = await onSendTemplate(conversation.user.id, template.content);
          break;
      }
      
      if (success) {
        setShowTemplates(false);
      }
    } catch (error) {
      console.error('Error using template:', error);
    } finally {
      setIsSending(false);
    }
  };

  const addQuickReply = () => {
    if (quickReplies.length < 13) { // Instagram limit
      setQuickReplies([...quickReplies, { content_type: 'text', title: '', payload: '' }]);
    }
  };

  const updateQuickReply = (index: number, field: keyof QuickReply, value: string) => {
    const updated = [...quickReplies];
    updated[index] = { ...updated[index], [field]: value };
    setQuickReplies(updated);
  };

  const removeQuickReply = (index: number) => {
    setQuickReplies(quickReplies.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!conversation) {
    return (
      <div className={`p-4 bg-gray-100 border-t border-gray-200 ${className}`}>
        <div className="text-center text-gray-500 text-sm">
          Select a conversation to start messaging
        </div>
      </div>
    );
  }

  if (conversation.status === 'blocked') {
    return (
      <div className={`p-4 bg-red-50 border-t border-red-200 ${className}`}>
        <div className="text-center text-red-600 text-sm">
          This user has been blocked. Unblock to continue messaging.
        </div>
      </div>
    );
  }

  return (
    <div className={`border-t border-gray-200 bg-white ${className}`}>
      {/* Quick Replies Builder */}
      {showQuickReplies && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Quick Replies</h4>
            <button
              onClick={() => setShowQuickReplies(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Text
              </label>
              <input
                type="text"
                value={quickReplyText}
                onChange={(e) => setQuickReplyText(e.target.value)}
                placeholder="Enter message text..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Quick Reply Options ({quickReplies.length}/13)
                </label>
                <button
                  onClick={addQuickReply}
                  disabled={quickReplies.length >= 13}
                  className="text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50"
                >
                  + Add Option
                </button>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {quickReplies.map((reply, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={reply.title}
                      onChange={(e) => updateQuickReply(index, 'title', e.target.value.substring(0, 20))}
                      placeholder="Button text (max 20 chars)"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      value={reply.payload}
                      onChange={(e) => updateQuickReply(index, 'payload', e.target.value)}
                      placeholder="Payload"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => removeQuickReply(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSendQuickReplies}
                disabled={!quickReplyText.trim() || quickReplies.length === 0 || isSending}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                Send Quick Replies
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selector */}
      {showTemplates && (
        <div className="p-4 border-b border-gray-200 bg-gray-50 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Message Templates</h4>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {messageTemplates.filter(t => t.is_active).map((template) => (
              <button
                key={template.id}
                onClick={() => handleUseTemplate(template)}
                disabled={isSending}
                className="text-left p-3 border border-gray-200 rounded-md hover:bg-white transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">{template.name}</h5>
                    <p className="text-sm text-gray-500">
                      {template.type} • Used {template.usage_count} times
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {template.category}
                  </span>
                </div>
              </button>
            ))}
            
            {messageTemplates.filter(t => t.is_active).length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No active templates found. Create templates in settings.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Composer */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* Action Buttons */}
          <div className="flex gap-1 pb-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Message templates"
            >
              <FileText size={20} />
            </button>
            
            <button
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Quick replies"
            >
              <Zap size={20} />
            </button>
            
            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Add image (coming soon)"
              disabled
            >
              <Image size={20} />
            </button>
            
            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="More options"
              disabled
            >
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Text Input */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                handleMessageChange(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyPress={handleKeyPress}
              placeholder={
                conversation.status === 'archived' 
                  ? 'This conversation is archived'
                  : 'Type a message...'
              }
              disabled={disabled || isSending || conversation.status !== 'active'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending || disabled || conversation.status !== 'active'}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handleMessageChange("Hi! Thanks for your message. How can I help you today?")}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            👋 Greeting
          </button>
          
          <button
            onClick={() => handleMessageChange("Thank you for your interest! Let me get that information for you.")}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            ℹ️ Info
          </button>
          
          <button
            onClick={() => handleMessageChange("I understand your concern. Let me help you resolve this issue.")}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            🛠️ Support
          </button>
        </div>

        {/* Character Count */}
        {message.length > 500 && (
          <div className="text-xs text-gray-500 mt-1 text-right">
            {message.length}/1000 characters
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageComposer;
