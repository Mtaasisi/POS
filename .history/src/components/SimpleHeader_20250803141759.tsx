import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone } from 'lucide-react';

interface SimpleHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

const SimpleHeader: React.FC<SimpleHeaderProps> = ({ 
  title = 'Repair Shop',
  showBackButton = false,
  onBack,
  className = ''
}) => {
  return (
    <header className={`
      sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm
      transition-all duration-300 ${className}
    `}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Brand */}
          <div className="flex items-center gap-4">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Brand Logo */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg group-hover:shadow-xl transition-shadow">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">{title}</h1>
                <p className="text-xs text-gray-600">Management System</p>
              </div>
            </Link>
          </div>

          {/* Right Section - Can be customized */}
          <div className="flex items-center gap-3">
            {/* Add any additional header actions here */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader; 