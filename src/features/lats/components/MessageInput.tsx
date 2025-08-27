import React, { memo } from 'react';
import { Send, Smile, Plus, RefreshCw, MessageCircle } from 'lucide-react';

interface MessageInputProps {
  message: string;
  customerName: string;
  isSending: boolean;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onToggleEmoji: () => void;
  onToggleAttachment: () => void;
  onToggleQuickReplies: () => void;
  showQuickReplies: boolean;
  hasSelectedMedia?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = memo(({
  message,
  customerName,
  isSending,
  onMessageChange,
  onSendMessage,
  onToggleEmoji,
  onToggleAttachment,
  onToggleQuickReplies,
  showQuickReplies,
  hasSelectedMedia = false
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const canSend = (message.trim() || hasSelectedMedia) && !isSending;

  return (
    <div className="bg-white p-4 border-t border-gray-200 shadow-lg flex-shrink-0 rounded-br-2xl">
      <div className="flex items-center gap-4">
        {/* Attachment Button */}
        <button 
          onClick={onToggleAttachment}
          className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
        >
          <Plus size={20} />
        </button>
        
        {/* Quick Replies Button */}
        <button 
          onClick={onToggleQuickReplies}
          className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
            showQuickReplies 
              ? 'bg-purple-500 text-white shadow-lg' 
              : 'text-purple-500 hover:text-purple-600 hover:bg-purple-50'
          }`}
        >
          <MessageCircle size={20} />
        </button>
        
        {/* Message Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Type a message to ${customerName}...`}
            className="w-full px-5 py-4 border border-gray-300 rounded-full focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm text-base"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <button 
              onClick={onToggleEmoji}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Smile size={18} />
            </button>
          </div>
        </div>
        
        {/* Send Button */}
        <button
          onClick={onSendMessage}
          disabled={!canSend}
          className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 shadow-lg"
        >
          {isSending ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
      
      {/* Character Count */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span>{message.length}/1000 characters</span>
      </div>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;