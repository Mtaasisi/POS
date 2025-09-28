import React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onEnter?: () => void;
  disabled?: boolean;
  className?: string;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  onBackspace,
  onClear,
  onEnter,
  disabled = false,
  className = ''
}) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['0', '.', '00']
  ];

  const handleKeyClick = (key: string) => {
    if (!disabled) {
      onKeyPress(key);
    }
  };

  const handleBackspace = () => {
    if (!disabled) {
      onBackspace();
    }
  };

  const handleClear = () => {
    if (!disabled) {
      onClear();
    }
  };

  const handleEnter = () => {
    if (!disabled && onEnter) {
      onEnter();
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 ${className}`}>
      {/* Debug info */}
      <div className="text-white/50 text-xs mb-2">Virtual Keyboard Component Loaded</div>
      
      {/* Number Keys */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyClick(key)}
                disabled={disabled}
                className="flex-1 h-12 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleBackspace}
          disabled={disabled}
          className="flex-1 h-12 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/30 rounded-lg text-orange-200 font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Backspace className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        
        <button
          onClick={handleClear}
          disabled={disabled}
          className="flex-1 h-12 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-200 font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Delete className="w-4 h-4" />
          <span className="text-sm">Clear</span>
        </button>

        {onEnter && (
          <button
            onClick={handleEnter}
            disabled={disabled}
            className="flex-1 h-12 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-200 font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enter
          </button>
        )}
      </div>
    </div>
  );
};

export default VirtualKeyboard;
