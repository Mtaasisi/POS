import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import GlassButton from './GlassButton';

export interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  type?: 'text' | 'textarea';
}

const PromptDialog: React.FC<PromptDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = 'Enter value...',
  defaultValue = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  type = 'text'
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    onConfirm(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 px-6 pb-4 overflow-y-auto">
          {/* Message */}
          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed">{message}</p>
          </div>

          {/* Input */}
          <div>
            {type === 'textarea' ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={loading}
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Fixed Actions at Bottom */}
        <div className="flex gap-3 justify-end p-6 pt-4 border-t border-gray-100 bg-white rounded-b-2xl">
          <GlassButton
            variant="outline"
            onClick={onClose}
            disabled={loading}
            size="md"
          >
            {cancelText}
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleConfirm}
            loading={loading}
            size="md"
            disabled={!value.trim()}
          >
            {confirmText}
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export default PromptDialog;
