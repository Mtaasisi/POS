import React from 'react';
import { ArrowLeft, Delete } from 'lucide-react';

interface VirtualNumberKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  className?: string;
}

const VirtualNumberKeyboard: React.FC<VirtualNumberKeyboardProps> = ({
  onKeyPress,
  onBackspace,
  onClear,
  className = ''
}) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '00']
  ];

  const handleKeyClick = (key: string) => {
    // Add haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    onKeyPress(key);
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-3 shadow-lg ${className}`}>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyClick(key)}
                className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 active:from-blue-100 active:to-blue-200 border border-gray-200/50 rounded-lg text-lg font-semibold text-gray-800 hover:text-blue-700 transition-all duration-200 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {key}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
      
      {/* Action buttons row */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <button
          onClick={onClear}
          className="aspect-square bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-600 transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-red-500"
          title="Clear All"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          onClick={onBackspace}
          className="aspect-square bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded text-orange-600 transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-orange-500"
          title="Backspace"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleKeyClick('000')}
          className="aspect-square bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-lg font-medium text-gray-800 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          000
        </button>
      </div>
    </div>
  );
};

export default VirtualNumberKeyboard;
