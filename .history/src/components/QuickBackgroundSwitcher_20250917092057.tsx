import React from 'react';
import { changeWallpaper } from '../lib/backgroundUtils';
import { toast } from 'react-hot-toast';

interface QuickBackgroundSwitcherProps {
  className?: string;
}

const QuickBackgroundSwitcher: React.FC<QuickBackgroundSwitcherProps> = ({ className = '' }) => {
  const applyScurveBackground = () => {
    changeWallpaper('s-curve-red-blue');
    toast.success('Applied S-Curve Red & Blue background!');
  };

  const applyDefaultBackground = () => {
    changeWallpaper('default');
    toast.success('Applied Default background!');
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={applyScurveBackground}
        className="px-4 py-2 bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-lg hover:from-red-600 hover:to-blue-600 transition-all duration-200 shadow-lg"
      >
        S-Curve Red & Blue
      </button>
      <button
        onClick={applyDefaultBackground}
        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg"
      >
        Default Blue
      </button>
    </div>
  );
};

export default QuickBackgroundSwitcher;
