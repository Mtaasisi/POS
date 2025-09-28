import React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  disabled?: boolean;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  onBackspace,
  onClear,
  disabled = false
}) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['Clear', '0', 'Backspace']
  ];

  const handleKeyClick = (key: string) => {
    if (disabled) return;
    
    if (key === 'Backspace') {
      onBackspace();
    } else if (key === 'Clear') {
      onClear();
    } else {
      onKeyPress(key);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {keys.map((row, rowIndex) => 
          row.map((key, keyIndex) => (
            <button
              key={`${rowIndex}-${keyIndex}`}
              onClick={() => handleKeyClick(key)}
              disabled={disabled}
              className={`aspect-square flex items-center justify-center rounded-lg font-semibold text-lg transition-all duration-200 min-h-[44px] min-w-[44px] ${
                key === 'Backspace' || key === 'Clear'
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
                  : 'bg-white text-gray-900 hover:bg-gray-100 active:bg-gray-200 border border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} shadow-sm hover:shadow-md active:shadow-inner`}
            >
              {key === 'Backspace' ? (
                <ArrowLeft className="w-5 h-5" />
              ) : key === 'Clear' ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                key
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default VirtualKeyboard;
