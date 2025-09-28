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
    <div className={`bg-white rounded-xl border border-gray-200 shadow-lg p-3 ${className}`}>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyClick(key)}
                className="aspect-square bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-lg text-lg font-semibold text-gray-800 transition-all duration-150 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          className="aspect-square bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 rounded-lg text-red-600 transition-all duration-150 hover:shadow-md active:scale-95 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500"
          title="Clear All"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          onClick={onBackspace}
          className="aspect-square bg-orange-50 hover:bg-orange-100 active:bg-orange-200 border border-orange-200 rounded-lg text-orange-600 transition-all duration-150 hover:shadow-md active:scale-95 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-500"
          title="Backspace"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleKeyClick('000')}
          className="aspect-square bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-lg text-xl font-semibold text-gray-800 transition-all duration-150 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          000
        </button>
      </div>
    </div>
  );
};

export default VirtualNumberKeyboard;
