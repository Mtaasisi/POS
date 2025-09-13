import React, { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface BackgroundSearchIndicatorProps {
  isSearching: boolean;
  searchStatus?: string;
  searchProgress?: number;
  resultCount?: number;
  onCancel?: () => void;
  className?: string;
}

const BackgroundSearchIndicator: React.FC<BackgroundSearchIndicatorProps> = ({
  isSearching,
  searchStatus = 'pending',
  searchProgress = 0,
  resultCount,
  onCancel,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isSearching) return null;

  const getStatusIcon = () => {
    switch (searchStatus) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (searchStatus) {
      case 'processing':
        return 'Searching...';
      case 'completed':
        return resultCount !== undefined ? `Found ${resultCount} results` : 'Search completed';
      case 'failed':
        return 'Search failed';
      case 'pending':
      default:
        return 'Queued for search';
    }
  };

  const getStatusColor = () => {
    switch (searchStatus) {
      case 'processing':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            {getStatusIcon()}
          </div>
          
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            
            {searchStatus === 'processing' && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${searchProgress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{searchProgress}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {searchStatus === 'pending' && onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              Cancel
            </button>
          )}
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Status: <span className="font-medium">{searchStatus}</span></div>
            {searchProgress > 0 && (
              <div>Progress: <span className="font-medium">{searchProgress}%</span></div>
            )}
            {resultCount !== undefined && (
              <div>Results: <span className="font-medium">{resultCount}</span></div>
            )}
            <div>Time: <span className="font-medium">{new Date().toLocaleTimeString()}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundSearchIndicator;
