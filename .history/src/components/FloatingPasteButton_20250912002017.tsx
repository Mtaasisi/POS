import React from 'react';
import { Clipboard, Loader2 } from 'lucide-react';

interface FloatingPasteButtonProps {
  hasClipboardImage: boolean;
  isCheckingClipboard: boolean;
  onPaste: () => void;
  disabled?: boolean;
}

export const FloatingPasteButton: React.FC<FloatingPasteButtonProps> = ({
  hasClipboardImage,
  isCheckingClipboard,
  onPaste,
  disabled = false
}) => {
  if (!hasClipboardImage && !isCheckingClipboard) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onPaste}
        disabled={disabled || isCheckingClipboard}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-full shadow-lg
          transition-all duration-200 transform hover:scale-105
          ${hasClipboardImage 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
        `}
        title={hasClipboardImage ? 'Paste image from clipboard' : 'Checking clipboard...'}
      >
        {isCheckingClipboard ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Clipboard className="w-5 h-5" />
        )}
        <span className="font-medium text-sm">
          {isCheckingClipboard ? 'Checking...' : 'Paste Image'}
        </span>
      </button>
    </div>
  );
};
